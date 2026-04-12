import { prisma } from "../config/prisma.js";

//registra una accion en el historial de auditoria
async function logAction(
    ticketId: string,
    userId: string,
    action: string,
    oldValue: string | null,
    newValue: string | null,
    tx?: any
) {
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
async function findByTicketId(ticketId: string) {
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