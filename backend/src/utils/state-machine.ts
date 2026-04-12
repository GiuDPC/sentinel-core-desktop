const VALID_TRANSITIONS: Record<string, string[]> = {
 OPEN: ['ASSIGNED'],
 ASSIGNED: ['IN_PROGRESS'],
 IN_PROGRESS: ['ON_HOLD', 'RESOLVED'],
 ON_HOLD: ['IN_PROGRESS'],
 RESOLVED: ['CLOSED', 'IN_PROGRESS'],
 CLOSED: [],
}

export function isValidTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}

export function getNextStatuses(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}