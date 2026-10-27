import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { type WorkDay } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MADRID_TZ = 'Europe/Madrid';

// Current time in Madrid timezone
export function nowMadrid(): Date {
  return toZonedTime(new Date(), MADRID_TZ);
}

// Format a date in Madrid timezone
export function formatMadrid(date: Date | string, fmt: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, MADRID_TZ, fmt);
}

// Today's date string in Madrid timezone ('YYYY-MM-DD')
export function todayMadrid(): string {
  return formatInTimeZone(new Date(), MADRID_TZ, 'yyyy-MM-dd');
}

// 'YYYY-MM' for a date string
export function toMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

const DAY_MAP: Record<WorkDay, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

// Count working days (Mon-Sat by default) in a date range [start, end] inclusive
export function countWorkingDays(
  start: Date,
  end: Date,
  workingDays: WorkDay[]
): number {
  const dayNums = new Set(workingDays.map(d => DAY_MAP[d]));
  return eachDayOfInterval({ start, end }).filter(d => dayNums.has(getDay(d))).length;
}

// Working days in a full calendar month
export function workingDaysInMonth(yearMonth: string, workingDays: WorkDay[]): number {
  const first = parseISO(`${yearMonth}-01`);
  return countWorkingDays(startOfMonth(first), endOfMonth(first), workingDays);
}

// Working days elapsed from month start to today (inclusive)
export function workingDaysElapsed(yearMonth: string, todayDate: string, workingDays: WorkDay[]): number {
  const first = parseISO(`${yearMonth}-01`);
  const today = parseISO(todayDate);
  if (today < first) return 0;
  const last = endOfMonth(first);
  const end = today < last ? today : last;
  return countWorkingDays(first, end, workingDays);
}

// Format USD
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPct(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value)}%`;
}

// Determine if a date is in warm-up period
export function isWarmup(dateStr: string, warmupStart: string, trackingStart: string): boolean {
  return dateStr >= warmupStart && dateStr < trackingStart;
}

// Get current view (morning | night) based on Madrid time
export function getCurrentView(morningStart: string, nightStart: string): 'morning' | 'night' {
  const now = nowMadrid();
  const h = now.getHours();
  const m = now.getMinutes();
  const current = h * 60 + m;

  const [mh, mm] = morningStart.split(':').map(Number);
  const [nh, nm] = nightStart.split(':').map(Number);
  const morningMin = mh * 60 + mm;
  const nightMin = nh * 60 + nm;

  if (morningMin < nightMin) {
    return current >= morningMin && current < nightMin ? 'morning' : 'night';
  }
  // morning starts after midnight (e.g., 05:00 → 15:00)
  return current >= morningMin || current < nightMin ? 'morning' : 'night';
}

// Parse review block text into structured data
export function parseReviewText(raw: string): Record<string, string> | null {
  if (!raw.includes('REVIEW UPDATE')) return null;
  const result: Record<string, string> = {};
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  let inTodos = false;
  const todos: string[] = [];

  for (const line of lines) {
    if (line === 'REVIEW UPDATE') continue;
    if (line.startsWith('To-dos:')) { inTodos = true; continue; }
    if (inTodos) {
      if (line.startsWith('-')) { todos.push(line.slice(1).trim()); continue; }
      else { inTodos = false; result['todos'] = todos.join('|||'); }
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const val = line.slice(colonIdx + 1).trim();
    result[key] = val;
  }
  if (todos.length) result['todos'] = todos.join('|||');
  return result;
}
