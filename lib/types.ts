// ── Call log ────────────────────────────────────────────────────────────────
export type CallOutcome = 'closed' | 'deposit' | 'follow_up' | 'lost';

export interface Call {
  id: string;
  date: string;           // ISO date string 'YYYY-MM-DD'
  showed: boolean;
  outcome: CallOutcome | null;   // null when no-show
  offer_id: string | null;
  commission: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ── Offers ──────────────────────────────────────────────────────────────────
export interface Offer {
  id: string;
  name: string;
  price: number;
  commission: number;
  is_core: boolean;
}

// ── Skill reviews ───────────────────────────────────────────────────────────
export interface SkillReview {
  id: string;
  date: string;
  calls_reviewed: number;
  objection_handling: number | null;
  statement_close: number | null;
  commitment_phase: number | null;
  tonality_confidence: number | null;
  deep_questions: number | null;
  focus_skill: string;
  why: string;
  drill: string;
  todos: string[];
  win: string;
  created_at: string;
  updated_at: string;
}

export const SKILL_KEYS = [
  'objection_handling',
  'statement_close',
  'commitment_phase',
  'tonality_confidence',
  'deep_questions',
] as const;

export type SkillKey = typeof SKILL_KEYS[number];

export const SKILL_LABELS: Record<SkillKey, string> = {
  objection_handling:  'Objection handling',
  statement_close:     'Statement close',
  commitment_phase:    'Commitment phase',
  tonality_confidence: 'Tonality & confidence',
  deep_questions:      'Deep questions',
};

// ── Settings ─────────────────────────────────────────────────────────────────
export type WorkDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface AppSettings {
  income_goal: number;
  core_closes_target: number;
  offers: Offer[];
  working_days: WorkDay[];
  shift_start: string;   // 'HH:mm'
  shift_end: string;
  motto: string;
  morning_start: string;
  night_start: string;
  expected_calls_per_day: number;
  tracking_start: string;  // 'YYYY-MM-DD'
  warmup_start: string;
  tracking_end: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  income_goal: 10000,
  core_closes_target: 5,
  offers: [
    { id: 'core', name: 'Core offer — $19,000', price: 19000, commission: 1900, is_core: true },
  ],
  working_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  shift_start: '15:00',
  shift_end: '03:00',
  motto: '$10K months. Act like it.',
  morning_start: '05:00',
  night_start: '15:00',
  expected_calls_per_day: 4,
  tracking_start: '2026-11-01',
  warmup_start: '2026-10-27',
  tracking_end: '2026-12-31',
};

// ── Google Sheet data ────────────────────────────────────────────────────────
export interface TaskItem {
  text: string;
  completed: boolean;
}

export interface DayNotes {
  went_well: string[];
  improve: string[];
  grateful: string[];
}

export interface DayData {
  date: string;          // 'YYYY-MM-DD'
  day_of_week: string;   // 'monday' | 'tuesday' | …
  top3_priorities: string[];
  tasks: TaskItem[];
  completed_count: number;
  outstanding_count: number;
  notes: DayNotes;
}

export interface HabitWeekData {
  habit_names: string[];
  // days[habit_index][day_index 0=Mon…6=Sun]
  days: boolean[][];
  weekly_pct: (number | null)[];
}

export interface WeeklyAuditItem {
  label: string;
  completed: boolean;
}

export interface WeekData {
  tab_name: string;
  start_date: string;    // 'YYYY-MM-DD' (Monday of that week)
  days: DayData[];
  habits: HabitWeekData;
  weekly_audit: WeeklyAuditItem[];
}

export interface SheetData {
  weeks: WeekData[];
  fetched_at: string;
}

// ── Computed metrics ─────────────────────────────────────────────────────────
export type PaceBadge = 'ahead' | 'on_pace' | 'behind' | 'not_started';

export interface MonthMetrics {
  month: string;          // 'YYYY-MM'
  calls_booked: number;
  calls_taken: number;
  no_shows: number;
  no_show_pct: number | null;
  closes: number;
  close_pct: number | null;
  core_closes: number;
  commission_earned: number;
  commission_pending: number;  // deposits
  follow_ups_pending: number;
  income_goal: number;
  core_target: number;
  money_left: number;
  working_days_total: number;
  working_days_elapsed: number;
  working_days_remaining: number;
  pace_badge: PaceBadge;
  calls_needed_estimate: number | null;  // null = not enough data
}
