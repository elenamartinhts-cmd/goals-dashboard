import { google } from 'googleapis';

export interface CommissionEntry {
  date: string;          // YYYY-MM-DD
  client_name: string;
  package_type: string;
  cash_collected: number;
  commission: number;
  month: string;         // YYYY-MM
}

function parseAmount(val: string | undefined): number {
  if (!val || val.trim() === '' || val.trim() === '-' || val.includes('REF')) return 0;
  return parseFloat(val.replace(/[$,€\s]/g, '')) || 0;
}

function parseDate(val: string | undefined): string | null {
  if (!val || val.trim() === '') return null;
  // Try formats: "Oct 1, 2026", "10/1/2026", "2026-10-01"
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

const MONTH_TABS: Record<string, string> = {
  'Oct 2026': '2026-10',
  'Nov 2026': '2026-11',
  'Dec 2026': '2026-12',
};

export async function fetchCommissionData(): Promise<CommissionEntry[]> {
  const sheetId = process.env.GOOGLE_COMMISSION_SHEET_ID;
  const email   = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key     = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!sheetId || !email || !key) return [];

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const entries: CommissionEntry[] = [];

  for (const [tabName, monthKey] of Object.entries(MONTH_TABS)) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${tabName}!A1:I60`,
      });

      const rows = res.data.values ?? [];

      // Row 0: Commission Rate row — parse rate
      const rateStr = rows[0]?.[1] ?? '10%';
      const rate = parseFloat(rateStr.replace('%', '')) / 100 || 0.10;

      // Rows 4+ (index 4) are data rows; row 3 (index 3) is header
      for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        const dateVal = row?.[0];
        const clientName = row?.[2] ?? '';
        const packageType = row?.[3] ?? '';
        const cashStr = row?.[6] ?? '';

        if (!dateVal && !clientName && !cashStr) continue;

        const cash = parseAmount(cashStr);
        if (cash <= 0) continue;

        const date = parseDate(dateVal) ?? `${monthKey}-01`;
        const commission = cash * rate;

        entries.push({
          date,
          client_name: clientName,
          package_type: packageType,
          cash_collected: cash,
          commission,
          month: monthKey,
        });
      }
    } catch {
      // Skip tab on error
    }
  }

  return entries;
}

export function sumCommissionByMonth(entries: CommissionEntry[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of entries) {
    result[e.month] = (result[e.month] ?? 0) + e.commission;
  }
  return result;
}
