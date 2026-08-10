/**
 * Event excluded from bulk approve to CAS (niewiedzący BM).
 * SV must approve these individually — never mass-add to TP without a conscious single-action path.
 */
export const EXCLUDED_BULK_APPROVE_EVENT_ID = 29

/**
 * Event IDs excluded from schedule collision detection on supervisor day view.
 * Same shop + overlapping [since, until] do NOT form a collision cluster for these events.
 * Aligns with BM shop conflict-check exception for event 6.
 * Note: event 29 is still collision-checked on the SV day list, but blocked from bulk approve.
 */
export const EXCLUDED_COLLISION_EVENT_IDS = new Set([6])

/** True when this event is ignored by SV day collision clustering. */
export function isCollisionExcludedEvent(eventId: number): boolean {
  return eventId > 0 && EXCLUDED_COLLISION_EVENT_IDS.has(eventId)
}

/** True when this event must not go through mass „Dodaj do TP”. */
export function isBulkApproveExcludedEvent(eventId: number): boolean {
  return eventId === EXCLUDED_BULK_APPROVE_EVENT_ID
}
