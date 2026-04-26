import { prisma } from '../config/prisma.js';
import { calculateDueDate } from '../utils/sla-calculator.js';
import { generateTicketCode } from '../utils/ticket-code.js';
import { AppError } from '../utils/app-error.js';
import { auditService } from './audit.service.js';
import { isValidTransition } from '../utils/state-machine.js';
import { sanitizeTicketInput } from '../utils/sanitize.js';
/**
 * Auto-asigna un técnico basado en la categoría del ticket.
 * Selecciona el técnico con menor carga de trabajo del departamento correspondiente.
 * Si no hay técnicos disponibles, el ticket queda en OPEN.
 */
async function autoAssign(ticketId, categoryDepartment, creatorId, tx) {
    // Construir where clause dinámicamente
    const whereClause = {
        role: { name: 'TECHNICIAN' },
        isActive: true,
    };
    if (categoryDepartment) {
        whereClause.department = categoryDepartment;
    }
    // Buscar técnicos activos del departamento con menor carga
    const technicians = await tx.user.findMany({
        where: whereClause,
        include: {
            assignments: {
                where: {
                    ticket: {
                        status: { notIn: ['RESOLVED', 'CLOSED'] },
                    },
                },
            },
        },
    });
    if (technicians.length === 0)
        return null;
    // Ordenar por menor carga de trabajo (least connections)
    const sorted = technicians
        .map((tech) => ({
        id: tech.id,
        activeTickets: tech.assignments.length,
    }))
        .sort((a, b) => a.activeTickets - b.activeTickets);
    const bestTechId = sorted[0].id;
    // Crear asignación
    await tx.assignment.create({
        data: { ticketId, technicianId: bestTechId },
    });
    // Cambiar a ASSIGNED
    await tx.ticket.update({
        where: { id: ticketId },
        data: { status: 'ASSIGNED' },
    });
    // Audit logs
    await auditService.logAction(ticketId, creatorId, 'STATUS_CHANGE', 'OPEN', 'ASSIGNED', tx);
    await auditService.logAction(ticketId, creatorId, 'ASSIGNMENT', null, bestTechId, tx);
    return bestTechId;
}
async function create(data) {
    // Sanitizar input para prevenir XSS
    const sanitized = sanitizeTicketInput(data);
    // Validar que priority sea un valor válido
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const priority = validPriorities.includes(sanitized.priority) ? sanitized.priority : 'MEDIUM';
    return prisma.$transaction(async (tx) => {
        const category = await tx.category.findUnique({
            where: { id: sanitized.categoryId },
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
                title: sanitized.title,
                description: sanitized.description,
                location: sanitized.location,
                categoryId: sanitized.categoryId,
                priority: priority,
                creatorId: sanitized.creatorId,
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
        // Auto-asignación inteligente basada en departamento de la categoría
        const assignedTechId = await autoAssign(ticket.id, category.department, sanitized.creatorId, tx);
        // Re-fetch con la asignación incluida
        const finalTicket = await tx.ticket.findUnique({
            where: { id: ticket.id },
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
            },
        });
        return { ...finalTicket, autoAssigned: !!assignedTechId };
    });
}
async function findAll(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where = {};
    if (filters.status)
        where.status = filters.status;
    if (filters.priority)
        where.priority = filters.priority;
    if (filters.categoryId)
        where.categoryId = filters.categoryId;
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
                            select: { id: true, firstName: true, lastName: true, department: true },
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
async function findById(id) {
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
/**
 * Cambio de estado genérico.
 * Si el usuario es TECHNICIAN, verifica que el ticket esté asignado a él.
 */
async function updateStatus(ticketId, newStatus, userId, userRole) {
    // Validar que el status sea un valor válido del enum
    const validStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'AWAITING_CONFIRMATION', 'CLOSED'];
    if (!validStatuses.includes(newStatus)) {
        throw new AppError(400, 'Estado inválido');
    }
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { assignments: true },
    });
    if (!ticket) {
        throw new AppError(404, 'Ticket no encontrado');
    }
    // Verificar ownership para técnicos
    if (userRole === 'TECHNICIAN') {
        const isAssigned = ticket.assignments.some((a) => a.technicianId === userId);
        if (!isAssigned) {
            throw new AppError(403, 'Solo podés cambiar el estado de tickets asignados a vos');
        }
    }
    if (!isValidTransition(ticket.status, newStatus)) {
        throw new AppError(422, `Transición inválida: no se puede cambiar de ${ticket.status} a ${newStatus}`);
    }
    const statusUpdate = validStatuses.includes(newStatus) ? newStatus : 'OPEN';
    return prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
            where: { id: ticketId },
            data: { status: statusUpdate },
            include: {
                category: true,
                creator: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
        await auditService.logAction(ticketId, userId, 'STATUS_CHANGE', ticket.status, newStatus, tx);
        return updated;
    });
}
/**
 * Técnico resuelve con nota obligatoria.
 * IN_PROGRESS → AWAITING_CONFIRMATION (el técnico debe estar asignado).
 */
async function resolveWithNote(ticketId, data, userId) {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { assignments: true },
    });
    if (!ticket)
        throw new AppError(404, 'Ticket no encontrado');
    // Verificar que el técnico está asignado a este ticket
    const isAssigned = ticket.assignments.some((a) => a.technicianId === userId);
    if (!isAssigned) {
        throw new AppError(403, 'Solo podés resolver tickets asignados a vos');
    }
    if (!isValidTransition(ticket.status, 'RESOLVED')) {
        throw new AppError(422, `No se puede resolver un ticket en estado ${ticket.status}`);
    }
    if (!data.resolutionNote || data.resolutionNote.trim().length < 10) {
        throw new AppError(400, 'La nota de resolución debe tener al menos 10 caracteres');
    }
    return prisma.$transaction(async (tx) => {
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
 * Rating/estrellas eliminado — solo confirmación y comentario opcional.
 */
async function confirmTicket(ticketId, data, userId) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket)
        throw new AppError(404, 'Ticket no encontrado');
    if (ticket.status !== 'AWAITING_CONFIRMATION') {
        throw new AppError(422, 'El ticket no está esperando confirmación');
    }
    if (ticket.creatorId !== userId) {
        throw new AppError(403, 'Solo el creador del ticket puede confirmar');
    }
    return prisma.$transaction(async (tx) => {
        if (data.confirmed) {
            // Confirmar → CLOSED (sin rating)
            const updated = await tx.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'CLOSED',
                    ratingComment: data.ratingComment || null,
                },
                include: {
                    category: true,
                    creator: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            });
            await auditService.logAction(ticketId, userId, 'STATUS_CHANGE', 'AWAITING_CONFIRMATION', 'CLOSED', tx);
            await auditService.logAction(ticketId, userId, 'TICKET_CONFIRMED', null, 'Confirmado por el solicitante', tx);
            return updated;
        }
        else {
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
async function findByCreator(creatorId, filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where = { creatorId };
    if (filters.status)
        where.status = filters.status;
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
async function findAssigned(technicianId, filters) {
    const where = {
        assignments: { some: { technicianId } },
    };
    if (filters.status)
        where.status = filters.status;
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
