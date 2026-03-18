import { getSLAStatus } from "../utils/sla";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type PriorityScoreInput = {
  urgency_score: number; // 1-100
  sla_deadline: Date | string | number;
  sla_created_at?: Date | string | number; // if provided, enables accurate percentLeft
  vulnerable_flag: boolean;
  is_recurring: boolean;
};

export type PriorityScoreResult = {
  priority_score: number; // 0-100 (clamped)
  sla_hours_left: number;
  sla_percent_left: number; // 0-100
  sla_remaining_inverse: number; // 0-100
  is_breached: boolean;
  is_at_risk: boolean;
};

/**
 * Priority = (urgency_score × 0.40)
 *          + (SLA_remaining_inverse × 0.30)
 *          + (vulnerable_flag ? 100 : 0) × 0.20
 *          + (is_recurring ? 100 : 0) × 0.10
 */
export function calculatePriorityScore(input: PriorityScoreInput): PriorityScoreResult {
  const urgency = clamp(Number(input.urgency_score) || 0, 0, 100);

  const sla = getSLAStatus(input.sla_deadline, input.sla_created_at);
  const slaRemainingInverse = clamp(100 - sla.percentLeft, 0, 100);

  const vulnerable = input.vulnerable_flag ? 100 : 0;
  const recurring = input.is_recurring ? 100 : 0;

  const raw =
    urgency * 0.4 +
    slaRemainingInverse * 0.3 +
    vulnerable * 0.2 +
    recurring * 0.1;

  const score = clamp(raw, 0, 100);

  return {
    priority_score: score,
    sla_hours_left: sla.hoursLeft,
    sla_percent_left: sla.percentLeft,
    sla_remaining_inverse: slaRemainingInverse,
    is_breached: sla.isBreached,
    is_at_risk: sla.isAtRisk,
  };
}

