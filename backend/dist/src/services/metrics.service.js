import { prisma } from '../config/prisma.js';
async function getDashboard() {
    const now = new Date();
    // ── Contadores generales
    const [totalTickets, openTickets, assignedTickets, inProgressTickets, onHoldTickets, resolvedTickets, closedTickets,] = await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: 'OPEN' } }),
        prisma.ticket.count({ where: { status: 'ASSIGNED' } }),
        prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.ticket.count({ where: { status: 'ON_HOLD' } }),
        prisma.ticket.count({ where: { status: 'RESOLVED' } }),
        prisma.ticket.count({ where: { status: 'CLOSED' } }),
    ]);
    // ── SLA vencidos tickets activos pasados de fecha
    const slaBreached = await prisma.ticket.count({
        where: {
            status: { notIn: ['RESOLVED', 'CLOSED'] },
            dueDate: { lt: now },
        },
    });
    // ── Tickets por categoría 
    const ticketsByCategory = await prisma.ticket.groupBy({
        by: ['categoryId'],
        _count: { id: true },
    });
    // Traer nombres de categorías
    const categories = await prisma.category.findMany({
        where: { id: { in: ticketsByCategory.map((t) => t.categoryId) } },
    });
    const ticketsByCategoryNamed = ticketsByCategory.map((item) => ({
        category: categories.find((c) => c.id === item.categoryId)?.name || 'Desconocida',
        count: item._count.id,
    }));
    // ── Tickets por prioridad
    const ticketsByPriority = await prisma.ticket.groupBy({
        by: ['priority'],
        _count: { id: true },
    });
    const ticketsByPriorityFormatted = ticketsByPriority.map((item) => ({
        priority: item.priority,
        count: item._count.id,
    }));
    // ── Tickets por estado 
    const ticketsByStatus = [
        { status: 'OPEN', count: openTickets },
        { status: 'ASSIGNED', count: assignedTickets },
        { status: 'IN_PROGRESS', count: inProgressTickets },
        { status: 'ON_HOLD', count: onHoldTickets },
        { status: 'RESOLVED', count: resolvedTickets },
        { status: 'CLOSED', count: closedTickets },
    ];
    // ── Promedio de resolución horas
    const resolvedOrClosed = await prisma.ticket.findMany({
        where: { status: { in: ['RESOLVED', 'CLOSED'] } },
        select: { createdAt: true, updatedAt: true },
    });
    let avgResolutionHours = 0;
    if (resolvedOrClosed.length > 0) {
        const totalHours = resolvedOrClosed.reduce((sum, ticket) => {
            const diff = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
            return sum + diff / (1000 * 60 * 60); // ms → horas
        }, 0);
        avgResolutionHours = Math.round((totalHours / resolvedOrClosed.length) * 10) / 10;
    }
    // ── Tickets creados este mes
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const ticketsThisMonth = await prisma.ticket.count({
        where: { createdAt: { gte: startOfMonth } },
    });
    // ── Tickets con SLA próximo a vencer (< 2 horas) ──
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const slaAtRisk = await prisma.ticket.count({
        where: {
            status: { notIn: ['RESOLVED', 'CLOSED'] },
            dueDate: { gt: now, lt: twoHoursFromNow },
        },
    });
    return {
        summary: {
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            closedTickets,
            slaBreached,
            slaAtRisk,
            avgResolutionHours,
            ticketsThisMonth,
        },
        ticketsByCategory: ticketsByCategoryNamed,
        ticketsByPriority: ticketsByPriorityFormatted,
        ticketsByStatus,
    };
}
/**
 * Obtiene los tickets con SLA vencido (para alertas).
 */
async function getSlaBreachedTickets() {
    return prisma.ticket.findMany({
        where: {
            status: { notIn: ['RESOLVED', 'CLOSED'] },
            dueDate: { lt: new Date() },
        },
        include: {
            category: true,
            creator: { select: { id: true, firstName: true, lastName: true } },
            assignments: {
                include: {
                    technician: { select: { id: true, firstName: true, lastName: true } },
                },
            },
        },
        orderBy: { dueDate: 'asc' }, // Los más vencidos primero
    });
}
export const metricsService = { getDashboard, getSlaBreachedTickets };
