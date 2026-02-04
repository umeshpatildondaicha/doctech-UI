export type SchedulingType = 'slots' | 'flexible';

export type TimingRuleType = 'daily' | 'weekly' | 'specific_day' | 'leave';

// Backend returns java.time.DayOfWeek enum names
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface TimingBreak {
  label?: string; // optional reason/label
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface TimingRule {
  /**
   * UUID string (for weekly: ruleGroupId; for others: derived from record)
   */
  id: string;
  /**
   * Numeric id: use for PATCH/DELETE when type is 'specific_day' or 'leave'
   */
  recordId?: number | null;
  type: TimingRuleType;

  // When type === 'weekly'
  weekdays?: DayOfWeek[];

  // When type === 'specific_day'
  date?: string; // "YYYY-MM-DD"

  // When type === 'leave'
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  isFullDay?: boolean;
  reason?: string;

  // When has schedule (not leave)
  startTime?: string; // "HH:mm"
  endTime?: string;
  breaks?: TimingBreak[];
  schedulingType?: SchedulingType;
  slotDurationMinutes?: number;
  maxAppointmentsPerSlot?: number;
  maxAppointmentsPerDay?: number;
  bufferTimeSeconds?: number;
  notes?: string;
}

export interface SlotsSummary {
  totalSlots: number;
  firstSlot: string | null; // "HH:mm" or null
  lastSlot: string | null; // "HH:mm" or null
}

export interface TimingsForecastDay {
  date: string; // "YYYY-MM-DD"
  priority: number; // 1..4 (P1 leave .. P4 daily)
  priorityType: 'leave' | 'specific_day' | 'weekly' | 'daily';
  hasSchedule: boolean;

  startTime?: string;
  endTime?: string;
  breaks?: TimingBreak[];
  schedulingType?: SchedulingType;
  slotDurationMinutes?: number;
  maxAppointmentsPerSlot?: number;
  maxAppointmentsPerDay?: number;
  bufferTimeSeconds?: number;

  slotsSummary?: SlotsSummary;
  appliedRuleId?: string | null;
  partiallyOverridden?: boolean | null;
}

export interface DoctorTimingsResponse {
  timezone: string; // e.g. "UTC"
  scheduleWindowDays: number;
  base: TimingRule | null;
  weeklyRules: TimingRule[];
  dateOverrides: TimingRule[];
  leaves: TimingRule[];
}

// ---- Request DTOs ----

export interface BaseTimingUpsertRequest {
  startTime?: string;
  endTime?: string;
  breaks?: TimingBreak[];
  schedulingType?: SchedulingType; // default "slots"
  slotDurationMinutes?: number;
  maxAppointmentsPerSlot?: number;
  maxAppointmentsPerDay?: number; // used when schedulingType "flexible"
  bufferTimeSeconds?: number;
  notes?: string;
}

export interface WeeklyTimingUpsertRequest {
  weekdays: DayOfWeek[];
  startTime?: string;
  endTime?: string;
  breaks?: TimingBreak[];
  schedulingType?: SchedulingType;
  slotDurationMinutes?: number;
  maxAppointmentsPerSlot?: number;
  maxAppointmentsPerDay?: number;
  bufferTimeSeconds?: number;
  notes?: string;
}

export interface OverrideTimingUpsertRequest {
  date: string; // "YYYY-MM-DD"
  startTime?: string;
  endTime?: string;
  breaks?: TimingBreak[];
  schedulingType?: SchedulingType;
  slotDurationMinutes?: number;
  maxAppointmentsPerSlot?: number;
  maxAppointmentsPerDay?: number;
  bufferTimeSeconds?: number;
  notes?: string;
}

export interface LeaveUpsertRequest {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  isFullDay?: boolean; // default true
  reason?: string;
}

