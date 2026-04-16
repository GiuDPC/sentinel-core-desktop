// calcula de fecha limite segun el Sla ejemplo createdAt = 10 Abr 08:00, slaHours = 4, resultado = 10 Abr 12:00
export function calculateDueDate(createdAt, slaHours) {
    const dueDate = new Date(createdAt.getTime());
    dueDate.setHours(dueDate.getHours() + slaHours);
    return dueDate;
}
//aqui se verifica si un tikect supero su fecha limite de SLA
export function isSlaBreached(dueDate) {
    if (!dueDate)
        return false;
    return new Date() > dueDate;
}
