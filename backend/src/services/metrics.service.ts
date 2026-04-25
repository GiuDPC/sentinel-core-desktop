import { prisma } from '../config/prisma.js';

async function getDashboard() {
  const now = new Date();

  // ── Contadores generales
  const [
    totalTickets,
    openTickets,
    assignedTickets,
    inProgressTickets,
    onHoldTickets,
    resolvedTickets,
    closedTickets,
  ] = await Promise.all([
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

export const metricsService = { getDashboard, getSlaBreachedTickets, getRequesterMetrics, getTechnicianMetrics };

/**
 * Métricas específicas del solicitante.
 */
async function getRequesterMetrics(userId: string) {
  const now = new Date();

  const [total, open, inProgress, resolved, slaBreached] = await Promise.all([
    prisma.ticket.count({ where: { creatorId: userId } }),
    prisma.ticket.count({ where: { creatorId: userId, status: 'OPEN' } }),
    prisma.ticket.count({ where: { creatorId: userId, status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { creatorId: userId, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.count({
      where: {
        creatorId: userId,
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        dueDate: { lt: now },
      },
    }),
  ]);

  // Promedio de resolución de tickets del solicitante
  const resolvedTickets = await prisma.ticket.findMany({
    where: { creatorId: userId, status: { in: ['RESOLVED', 'CLOSED'] } },
    select: { createdAt: true, updatedAt: true },
  });

  let avgResolutionHours = 0;
  if (resolvedTickets.length > 0) {
    const totalHours = resolvedTickets.reduce((sum, t) => {
      return sum + (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
    }, 0);
    avgResolutionHours = Math.round((totalHours / resolvedTickets.length) * 10) / 10;
  }

  const slaCompliance = total > 0
    ? Math.round(((total - slaBreached) / total) * 100)
    : 100;

  return {
    totalTickets: total,
    openTickets: open,
    inProgressTickets: inProgress,
    resolvedTickets: resolved,
    slaBreached,
    slaCompliance,
    avgResolutionHours,
  };
}

/**
 * Métricas específicas del técnico.
 */
async function getTechnicianMetrics(userId: string) {
  const now = new Date();

  const assignedTicketIds = await prisma.assignment.findMany({
    where: { technicianId: userId },
    select: { ticketId: true },
  });
  const ticketIds = assignedTicketIds.map((a) => a.ticketId);

  if (ticketIds.length === 0) {
    return {
      totalAssigned: 0,
      inProgress: 0,
      resolved: 0,
      slaBreached: 0,
      avgResolutionHours: 0,
    };
  }

  const [totalAssigned, inProgress, resolved, slaBreached] = await Promise.all([
    prisma.ticket.count({ where: { id: { in: ticketIds } } }),
    prisma.ticket.count({ where: { id: { in: ticketIds }, status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { id: { in: ticketIds }, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.count({
      where: {
        id: { in: ticketIds },
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        dueDate: { lt: now },
      },
    }),
  ]);

  // Promedio de resolución
  const resolvedTickets = await prisma.ticket.findMany({
    where: { id: { in: ticketIds }, status: { in: ['RESOLVED', 'CLOSED'] } },
    select: { createdAt: true, updatedAt: true },
  });

  let avgResolutionHours = 0;
  if (resolvedTickets.length > 0) {
    const totalHours = resolvedTickets.reduce((sum, t) => {
      return sum + (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
    }, 0);
    avgResolutionHours = Math.round((totalHours / resolvedTickets.length) * 10) / 10;
  }

  return {
    totalAssigned,
    inProgress,
    resolved,
    slaBreached,
    avgResolutionHours,
  };
}

