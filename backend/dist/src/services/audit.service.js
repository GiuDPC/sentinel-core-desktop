import { prisma } from "../config/prisma.js";
//registra una accion en el historial de auditoria
async function logAction(ticketId, userId, action, oldValue, newValue, tx) {
    const client = tx || prisma;
    await client.auditLog.create({
        data: {
            ticketId,
            userId,
            action,
            oldValue,
            newValue
        }
    });
}
//obtiene el historial de auditoria de un ticket
async function findByTicketId(ticketId) {
    return prisma.auditLog.findMany({
        where: { ticketId },
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });
}
/**
 * Obtiene todos los logs de auditoria con paginacion.
 */
async function findAll(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 30;
    const skip = (page - 1) * limit;
    const where = {};
    if (filters.action)
        where.action = filters.action;
    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true },
                },
                ticket: {
                    select: { id: true, ticketCode: true, title: true },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);
    return {
        data: logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}
export const auditService = { logAction, findByTicketId, findAll };
