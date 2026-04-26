const VALID_TRANSITIONS = {
    OPEN: ['ASSIGNED'],
    ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['ON_HOLD', 'RESOLVED'],
    ON_HOLD: ['IN_PROGRESS'],
    RESOLVED: ['AWAITING_CONFIRMATION'],
    AWAITING_CONFIRMATION: ['CLOSED', 'IN_PROGRESS'],
    CLOSED: [],
};
export function isValidTransition(currentStatus, newStatus) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed)
        return false;
    return allowed.includes(newStatus);
}
export function getNextStatuses(currentStatus) {
    return VALID_TRANSITIONS[currentStatus] || [];
}
