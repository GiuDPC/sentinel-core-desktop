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
  // Transacción: genera el código + crea el ticket de forma atómica.
  // Si dos requests llegan al mismo tiempo, no habrá códigos duplicados.
  return prisma.$transaction(async (tx) => {
    // Buscar categoría para obtener SLA
    const category = await tx.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category || !category.isActive) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    // Generar código secuencial
    const ticketCode = await generateTicketCode(tx);

    // Calcular due_date según SLA
    const now = new Date();
    const dueDate = calculateDueDate(now, category.slaHours);

    // Crear ticket
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

    // Audit log de creación
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
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  // Construir where dinámico — solo incluye filtros que vengan definidos
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.categoryId) where.categoryId = filters.categoryId;

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
  // Validar transición con la State Machine
  if (!isValidTransition(ticket.status, newStatus)) {
    throw new AppError(
      422,
      `Transición inválida: no se puede cambiar de ${ticket.status} a ${newStatus}`
    );
  }
  // Actualizar estado + crear audit log en una transacción atómica
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
    // Audit log — silencioso, automático, inmutable
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

export const ticketService = { create, findAll, findById, updateStatus };
