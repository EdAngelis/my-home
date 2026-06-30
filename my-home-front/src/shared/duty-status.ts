import IDuties from "../models/duties.model";

export type DutyState = "to_make" | "expire_in" | "paused";

const MS_PER_DAY = 1000 * 3600 * 24;

// Most recent execution date, or null when the duty has never been done.
const lastExecution = (duty: IDuties): Date | null => {
  const last = duty.history?.[0]?.date;
  return last ? new Date(last) : null;
};

// Whole days elapsed since the last execution (floored, so "made today" === 0).
const daysSince = (last: Date): number =>
  Math.floor((Date.now() - last.getTime()) / MS_PER_DAY);

// Derive the display state from stored status + history + frequency.
// - paused status                 -> "paused" (excluded from due calculation)
// - empty history / due or overdue -> "to_make"
// - still within frequency window  -> "expire_in"
const getDutyState = (duty: IDuties): DutyState => {
  if (duty.status === "paused") return "paused";

  const last = lastExecution(duty);
  if (!last) return "to_make";

  return daysSince(last) >= duty.frequency ? "to_make" : "expire_in";
};

// Days left before the duty becomes due again. A duty made today returns the
// full frequency; 0 when overdue or never done.
const daysRemaining = (duty: IDuties): number => {
  const last = lastExecution(duty);
  if (!last) return 0;

  const remaining = duty.frequency - daysSince(last);
  return remaining > 0 ? remaining : 0;
};

export { getDutyState, daysRemaining };
