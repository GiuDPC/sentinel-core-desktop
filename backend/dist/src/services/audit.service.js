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
export const auditService = { logAction, findByTicketId };
