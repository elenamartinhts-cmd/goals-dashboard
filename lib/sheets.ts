import { google } from 'googleapis';
import { parseISO, format, isValid } from 'date-fns';
import { type SheetData, type WeekData, type DayData, type HabitWeekData, type WeeklyAuditItem } from './types';

const SPREADSHEET_ID = '1QBg3Tpu31Xb_9zLvy6o9A4U_OaVMspJ9J7OAM9CT5uA';

// Column letter(s) to 0-based index
function colToIdx(col: string): number {
  let n = 0;
  for (const ch of col.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

const WEEK_LABELS: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
};

const SPANISH_MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

function parseSpanishDate(raw: string): Date | null {
  // e.g. "octubre 26, 2026"
  const m = raw.trim().toLowerCase().match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) return null;
  const month = SPANISH_MONTHS[m[1]];
  if (month === undefined) return null;
  return new Date(Number(m[3]), month, Number(m[2]));
}

// Day block starting columns (0-based)
const DAY_START_COLS = [
  colToIdx('B'),  // Mon
  colToIdx('J'),  // Tue
  colToIdx('R'),  // Wed
  colToIdx('Z'),  // Thu
  colToIdx('AH'), // Fri
  colToIdx('AP'), // Sat
  colToIdx('AX'), // Sun
];

// Habits section
const HABIT_NAME_COL  = colToIdx('AI');  // 34
const HABIT_DAY_START = colToIdx('AP');  // 41 — Mon's checkbox col
const HABIT_PCT_COL   = colToIdx('BC');  // 54
const HABIT_ROWS      = [3, 4, 5, 6, 7, 8, 9, 10]; // 0-based rows 4–11

// Weekly audit
const AUDIT_LABEL_COL    = colToIdx('BG'); // 58
const AUDIT_CHECK_COL    = colToIdx('BM'); // 64

function cell(rows: any[][], r: number, c: number): string {
  return String(rows[r]?.[c] ?? '').trim();
}

function isTruthy(val: string): boolean {
  return val.toUpperCase() === 'TRUE' || val === '1';
}

function parseDay(rows: any[][], startCol: number, dayDate: Date): DayData {
  const dateStr = isValid(dayDate) ? format(dayDate, 'yyyy-MM-dd') : '';
  const dayOfWeek = isValid(dayDate) ? WEEK_LABELS[dayDate.getDay()] : '';

  const top3: string[] = [];
  const tasks: { text: string; completed: boolean }[] = [];
  let completed_count = 0;
  let outstanding_count = 0;
  const went_well: string[] = [];
  const improve: string[] = [];
  const grateful: string[] = [];

  // Scan rows within this day block
  let foundTop3 = false;
  let foundTasks = false;
  let wentWellRow = -1;
  let improveRow = -1;
  let gratefulRow = -1;

  for (let r = 0; r < rows.length; r++) {
    const label = cell(rows, r, startCol).toLowerCase();

    if (!foundTop3 && label.includes('top 3')) {
      // Numbers (1,2,3) are in startCol; actual text is one column to the right
      for (let i = 1; i <= 3; i++) {
        const t = cell(rows, r + i, startCol + 1);
        if (t) top3.push(t);
      }
      foundTop3 = true;
      continue;
    }

    if (!foundTasks && label === 'tasks') {
      foundTasks = true;
      continue;
    }

    if (foundTasks && !label.includes('completed') && !label.includes('outstanding') && !label.includes('what')) {
      const text = cell(rows, r, startCol);
      if (text && text.toLowerCase() !== 'tasks') {
        const checkbox = cell(rows, r, startCol + 6);
        if (text) tasks.push({ text, completed: isTruthy(checkbox) });
      }
    }

    if (label.includes('completed')) {
      const v = cell(rows, r, startCol + 1) || cell(rows, r, startCol + 2);
      completed_count = parseInt(v) || 0;
    }
    if (label.includes('outstanding')) {
      const v = cell(rows, r, startCol + 1) || cell(rows, r, startCol + 2);
      outstanding_count = parseInt(v) || 0;
    }

    if (label.includes('went well'))  wentWellRow = r;
    if (label.includes('improve'))    improveRow = r;
    if (label.includes('grateful'))   gratefulRow = r;
  }

  // Read notes (3 rows below each label)
  [wentWellRow, improveRow, gratefulRow].forEach((row, idx) => {
    if (row === -1) return;
    const target = idx === 0 ? went_well : idx === 1 ? improve : grateful;
    for (let i = 1; i <= 3; i++) {
      const v = cell(rows, row + i, startCol);
      if (v) target.push(v);
    }
  });

  return { date: dateStr, day_of_week: dayOfWeek, top3_priorities: top3, tasks, completed_count, outstanding_count, notes: { went_well, improve, grateful } };
}

function parseHabits(rows: any[][]): HabitWeekData {
  const habit_names: string[] = [];
  for (const r of HABIT_ROWS) {
    const name = cell(rows, r, HABIT_NAME_COL);
    if (name) habit_names.push(name);
  }

  const days: boolean[][] = [];
  for (let hi = 0; hi < habit_names.length; hi++) {
    const r = HABIT_ROWS[hi];
    const dayChecks: boolean[] = [];
    for (let d = 0; d < 7; d++) {
      dayChecks.push(isTruthy(cell(rows, r, HABIT_DAY_START + d)));
    }
    days.push(dayChecks);
  }

  const weekly_pct: (number | null)[] = habit_names.map((_, hi) => {
    const r = HABIT_ROWS[hi];
    const v = cell(rows, r, HABIT_PCT_COL);
    if (!v) return null;
    const n = parseFloat(v.replace('%', ''));
    return isNaN(n) ? null : n;
  });

  return { habit_names, days, weekly_pct };
}

function parseWeeklyAudit(rows: any[][]): WeeklyAuditItem[] {
  const items: WeeklyAuditItem[] = [];
  for (let r = 0; r < rows.length; r++) {
    const label = cell(rows, r, AUDIT_LABEL_COL);
    if (label && label.toLowerCase() !== 'weekly audit') {
      items.push({ label, completed: isTruthy(cell(rows, r, AUDIT_CHECK_COL)) });
    }
  }
  return items;
}

function parseTab(tabName: string, rows: any[][]): WeekData | null {
  if (!tabName.match(/^Week \d+$/i)) return null;

  // Find start date: scan row 9 (0-based) for "Start Date" label near col B
  let startDate: Date | null = null;
  const searchRow = rows[9] ?? [];
  for (let c = 0; c < searchRow.length; c++) {
    if (String(searchRow[c]).toLowerCase().includes('start date')) {
      // Date is 5 cols to the right (G is col 6, B is col 1 → diff = 5)
      const rawDate = String(searchRow[c + 5] ?? '').trim();
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        startDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      break;
    }
  }
  if (!startDate || !isValid(startDate)) return null;

  // Day dates from row 14 (0-based)
  const dateRow = rows[14] ?? [];
  const dayDates: Date[] = [];
  for (const startCol of DAY_START_COLS) {
    const raw = String(dateRow[startCol] ?? '').trim();
    const d = parseSpanishDate(raw);
    dayDates.push(d ?? startDate);
  }

  const days: DayData[] = DAY_START_COLS.map((col, i) => parseDay(rows, col, dayDates[i]));
  const habits = parseHabits(rows);
  const weekly_audit = parseWeeklyAudit(rows);

  return {
    tab_name: tabName,
    start_date: format(startDate, 'yyyy-MM-dd'),
    days,
    habits,
    weekly_audit,
  };
}

export async function fetchSheetData(): Promise<SheetData> {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key:   process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Get list of tabs
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tabNames = (meta.data.sheets ?? [])
    .map(s => s.properties?.title ?? '')
    .filter(n => /^Week \d+$/i.test(n));

  if (!tabNames.length) return { weeks: [], fetched_at: new Date().toISOString() };

  // Fetch all tabs at once
  const batch = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: tabNames.map(n => `'${n}'`),
  });

  const weeks: WeekData[] = [];
  const valueRanges = batch.data.valueRanges ?? [];

  for (let i = 0; i < tabNames.length; i++) {
    const rows = valueRanges[i]?.values ?? [];
    // Skip future / empty tabs
    if (rows.length < 15) continue;

    const week = parseTab(tabNames[i], rows);
    if (week) weeks.push(week);
  }

  // Sort weeks chronologically
  weeks.sort((a, b) => a.start_date.localeCompare(b.start_date));

  return { weeks, fetched_at: new Date().toISOString() };
}
