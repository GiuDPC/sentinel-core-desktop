//Genera el siguiente codigo secuencial de ticket: TKT-0001, TKT-0002, etc
export async function generateTicketCode(prismaClient) {
    const lastTicket = await prismaClient.ticket.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { ticketCode: true },
    });
    if (!lastTicket) {
        return 'TKT-0001';
    }
    const lastNumber = parseInt(lastTicket.ticketCode.split('-')[1], 10);
    const nextNumber = lastNumber + 1;
    return `TKT-${nextNumber.toString().padStart(4, '0')}`;
}
