import { prisma } from '../config/prisma.js';
import { calculateDueDate } from '../utils/sla-calculator.js';
import { generateTicketCode } from '../utils/ticket-code.js';
import { AppError } from '../utils/app-error.js';
import { auditService } from './audit.service.js';
import { isValidTransition } from '../utils/state-machine.js';

async function create(data: {
  title: string;
  description: string;
  location: string;
  categoryId: number;
  priority: string;
  creatorId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category || !category.isActive) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    const ticketCode = await generateTicketCode(tx);
    const now = new Date();
    const dueDate = calculateDueDate(now, category.slaHours);

    const ticket = await tx.ticket.create({
      data: {
        ticketCode,
        title: data.title,
        description: data.description,
        location: data.location,
        categoryId: data.categoryId,
        priority: data.priority as any,
        creatorId: data.creatorId,
        dueDate,
      },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        ticketId: ticket.id,
        userId: data.creatorId,
        action: 'TICKET_CREATED',
        oldValue: null,
        newValue: null,
      },
    });

    return ticket;
  });
}

async function findAll(filters: {
  status?: string;
  priority?: string;
  categoryId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.categoryId) where.categoryId = filters.categoryId;

  // Búsqueda por texto en múltiples campos
  if (filters.search) {
    where.OR = [
      { ticketCode: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignments: {
          include: {
            technician: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function findById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      category: true,
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignments: {
        include: {
          technician: {
            select: { id: true, firstName: true, lastName: true, department: true },
          },
        },
      },
      comments: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      auditLogs: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    throw new AppError(404, 'Ticket no encontrado');
  }

  return ticket;
}

async function updateStatus(
  ticketId: string,
  newStatus: string,
  userId: string
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) {
    throw new AppError(404, 'Ticket no encontrado');
  }
  if (!isValidTransition(ticket.status, newStatus)) {
    throw new AppError(
      422,
      `Transición inválida: no se puede cambiar de ${ticket.status} a ${newStatus}`
    );
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus as any },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    await auditService.logAction(
      ticketId,
      userId,
      'STATUS_CHANGE',
      ticket.status,
      newStatus,
      tx
    );
    return updated;
  });
}

/**
 * Técnico resuelve con nota obligatoria.
 * IN_PROGRESS → RESOLVED → AWAITING_CONFIRMATION (automático)
 */
async function resolveWithNote(
  ticketId: string,
  data: { resolutionNote: string },
  userId: string
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new AppError(404, 'Ticket no encontrado');

  if (!isValidTransition(ticket.status, 'RESOLVED')) {
    throw new AppError(422, `No se puede resolver un ticket en estado ${ticket.status}`);
  }

  if (!data.resolutionNote || data.resolutionNote.trim().length < 10) {
    throw new AppError(400, 'La nota de resolución debe tener al menos 10 caracteres');
  }

  return prisma.$transaction(async (tx) => {
    // Primero marcar como RESOLVED, luego automáticamente AWAITING_CONFIRMATION
    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'AWAITING_CONFIRMATION',
        resolutionNote: data.resolutionNote.trim(),
        resolvedAt: new Date(),
      },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await auditService.logAction(ticketId, userId, 'STATUS_CHANGE', ticket.status, 'RESOLVED', tx);
    await auditService.logAction(ticketId, userId, 'STATUS_CHANGE', 'RESOLVED', 'AWAITING_CONFIRMATION', tx);
    await auditService.logAction(ticketId, userId, 'RESOLUTION_NOTE', null, data.resolutionNote.trim(), tx);

    return updated;
  });
}

/**
 * Solicitante confirma o reabre el ticket.
 * AWAITING_CONFIRMATION → CLOSED (confirma) o AWAITING_CONFIRMATION → IN_PROGRESS (reabre)
 */
async function confirmTicket(
  ticketId: string,
  data: { confirmed: boolean; rating?: number; ratingComment?: string },
  userId: string
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new AppError(404, 'Ticket no encontrado');

  if (ticket.status !== 'AWAITING_CONFIRMATION') {
    throw new AppError(422, 'El ticket no está esperando confirmación');
  }

  if (ticket.creatorId !== userId) {
    throw new AppError(403, 'Solo el creador del ticket puede confirmar');
  }

  return prisma.$transaction(async (tx) => {
    if (data.confirmed) {
      // Confirmar → CLOSED con rating
      if (data.rating && (data.rating < 1 || data.rating > 5)) {
        throw new AppError(400, 'La calificación debe ser entre 1 y 5');
      }

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'CLOSED',
          rating: data.rating || null,
          ratingComment: data.ratingComment || null,
        },
        include: {
          category: true,
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      await auditService.logAction(ticketId, userId, 'STATUS_CHANGE', 'AWAITING_CONFIRMATION', 'CLOSED', tx);
      if (data.rating) {
        await auditService.logAction(ticketId, userId, 'RATING', null, `${data.rating}/5`, tx);
      }

      return updated;
    } else {
      // Reabrir → IN_PROGRESS
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          resolvedAt: null,
          resolutionNote: null,
        },
        include: {
          category: true,
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      await auditService.logAction(ticketId, userId, 'STATUS_CHANGE', 'AWAITING_CONFIRMATION', 'IN_PROGRESS', tx);
      await auditService.logAction(ticketId, userId, 'TICKET_REOPENED', null, data.ratingComment || 'Falla persiste', tx);

      return updated;
    }
  });
}

/**
 * Tickets creados por un solicitante específico.
 */
async function findByCreator(creatorId: string, filters: { status?: string; page?: number; limit?: number }) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { creatorId };
  if (filters.status) where.status = filters.status;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        assignments: {
          include: {
            technician: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Tickets asignados a un técnico específico.
 */
async function findAssigned(technicianId: string, filters: { status?: string }) {
  const where: any = {
    assignments: { some: { technicianId } },
  };
  if (filters.status) where.status = filters.status;

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignments: {
        include: {
          technician: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  return { data: tickets, total: tickets.length };
}

export const ticketService = {
  create, findAll, findById, updateStatus,
  findByCreator, findAssigned,
  resolveWithNote, confirmTicket,
};
