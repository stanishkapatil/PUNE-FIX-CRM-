const CATEGORY_SLA_HOURS: Record<string, number> = {
  "Water Supply": 72,
  "Roads & Infrastructure": 96,
  Electricity: 48,
  Sanitation: 72,
  "Tax & Finance": 120,
  General: 96,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function asDate(d: Date | string | number): Date {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date input");
  return date;
}

export function getSLADuration(category: string): number {
  const hours = CATEGORY_SLA_HOURS[category];
  return typeof hours === "number" && Number.isFinite(hours) && hours > 0 ? hours : CATEGORY_SLA_HOURS.General;
}

export function getSLADeadline(category: string, createdAt: Date | string | number): Date {
  const created = asDate(createdAt);
  const hours = getSLADuration(category);
  return new Date(created.getTime() + hours * 60 * 60 * 1000);
}

export function getSLAStatus(
  deadline: Date | string | number,
  createdAt?: Date | string | number,
): {
  hoursLeft: number;
  percentLeft: number;
  isBreached: boolean;
  isAtRisk: boolean;
} {
  const d = asDate(deadline);
  const now = Date.now();

  const msLeft = d.getTime() - now;
  const hoursLeft = msLeft / (60 * 60 * 1000);
  const isBreached = msLeft <= 0;

  let percentLeft = isBreached ? 0 : 100;

  if (createdAt !== undefined) {
    const created = asDate(createdAt);
    const totalMs = Math.max(1, d.getTime() - created.getTime());
    percentLeft = clamp((msLeft / totalMs) * 100, 0, 100);
  }

  // At-risk when 20% time remaining (or less) but not yet breached
  const isAtRisk = !isBreached && percentLeft <= 20;

  return {
    hoursLeft: Number.isFinite(hoursLeft) ? hoursLeft : 0,
    percentLeft: Number.isFinite(percentLeft) ? percentLeft : 0,
    isBreached,
    isAtRisk,
  };
}

