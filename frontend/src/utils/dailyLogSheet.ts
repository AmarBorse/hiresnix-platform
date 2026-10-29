// src/utils/dailyLogSheet.ts
// Reads a daily-log Excel/CSV sheet into rows, checks them against the internship period,
// and makes the downloadable template. Used by the admin import and the intern's own import.

import * as XLSX from 'xlsx';

export type SheetRow = {
  line: number; logDate: string | null; todaysWork: string; hoursWorked: number;
  learning: string; challenges: string; tomorrowPlan: string; problem?: string;
};
export type Period = { start: string | null; end: string | null } | null | undefined;

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number) => String(n).padStart(2, '0');
const valid = (y: number, m: number, d: number) => {
  if (y < 100) y += 2000;
  const x = new Date(Date.UTC(y, m - 1, d));
  return x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
};
const monthOf = (w: string) => MONTHS[w.toLowerCase().slice(0, 4)] || MONTHS[w.toLowerCase().slice(0, 3)];

/** Reads a date cell the way people in India write it (day first). Returns YYYY-MM-DD or null. */
export function readDate(v: any): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const t = new Date(v.getTime() + 12 * 3600 * 1000); // guard against 23:59:59 rounding
    return valid(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }
  if (typeof v === 'number') {
    const p = XLSX.SSF.parse_date_code(v);
    return p ? valid(p.y, p.m, p.d) : null;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);                        // 2026-08-05
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);                         // 05/08/2026 (day first)
  if (m) return valid(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3,9})[\s,-]+(\d{2,4})$/i);  // 5 Aug 2026, 05-Aug-26
  if (m && monthOf(m[2])) return valid(+m[3], monthOf(m[2]), +m[1]);
  m = s.match(/^([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})$/i);                        // Aug 5, 2026
  if (m && monthOf(m[1])) return valid(+m[3], monthOf(m[1]), +m[2]);
  return null;
}

const COLS: Record<'logDate' | 'todaysWork' | 'hoursWorked' | 'learning' | 'challenges' | 'tomorrowPlan', string[]> = {
  logDate: ['date', 'day', 'logdate'],
  todaysWork: ['todayswork', 'work', 'workdone', 'task', 'tasks', 'taskscompleted', 'summaryoftaskscompleted', 'summary', 'description', 'activity', 'activities'],
  hoursWorked: ['hours', 'hoursworked', 'hrs', 'hour'],
  learning: ['learning', 'learnings', 'whatilearned', 'learned', 'learnt'],
  challenges: ['challenges', 'challenge', 'problems', 'issues'],
  tomorrowPlan: ['tomorrowsplan', 'tomorrowplan', 'plan', 'nextplan', 'nextdayplan'],
};
const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');

/** Reads the first sheet of an .xlsx/.xls/.csv file. Throws an Error with a readable message. */
export async function readDailyLogSheet(file: File): Promise<SheetRow[]> {
  let grid: any[][];
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    grid = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: true });
  } catch {
    throw new Error('Could not read this file. Use .xlsx, .xls or .csv');
  }
  // The header row is the first row with a "date" column and a work column
  const hi = grid.findIndex(r => {
    const h = r.map(c => norm(String(c)));
    return h.some(x => COLS.logDate.includes(x)) && h.some(x => COLS.todaysWork.includes(x));
  });
  if (hi < 0) throw new Error('Could not find the header row. The sheet needs at least "Date" and "Today\'s Work" columns.');
  const head = grid[hi].map(c => norm(String(c)));
  const col = (k: keyof typeof COLS) => head.findIndex(h => COLS[k].includes(h));
  const idx = { logDate: col('logDate'), todaysWork: col('todaysWork'), hoursWorked: col('hoursWorked'), learning: col('learning'), challenges: col('challenges'), tomorrowPlan: col('tomorrowPlan') };
  const text = (r: any[], i: number) => (i >= 0 ? String(r[i] ?? '').trim() : '');

  const out: SheetRow[] = [];
  grid.slice(hi + 1).forEach((r, k) => {
    if (!r.some(c => String(c).trim() !== '')) return; // blank row
    out.push({
      line: hi + k + 2,
      logDate: readDate(idx.logDate >= 0 ? r[idx.logDate] : ''),
      todaysWork: text(r, idx.todaysWork),
      hoursWorked: Number(text(r, idx.hoursWorked).replace(/[^\d.]/g, '')) || 0,
      learning: text(r, idx.learning),
      challenges: text(r, idx.challenges),
      tomorrowPlan: text(r, idx.tomorrowPlan),
    });
  });
  if (!out.length) throw new Error('No rows found under the header');
  return out.slice(0, 400);
}

/** Marks each row with the reason it would be skipped (same checks as the server). */
export function checkRows(rows: SheetRow[], period: Period, existingDates: string[] = []): SheetRow[] {
  const seen = new Set<string>(existingDates);
  const start = period?.start, end = period?.end;
  return rows.map(r => {
    let problem: string | undefined;
    if (!r.logDate) problem = 'Date not readable';
    else if (start && r.logDate < start) problem = 'Before internship start';
    else if (end && r.logDate > end) problem = 'After internship end / today';
    else if (!r.todaysWork.trim()) problem = 'Work is empty';
    else if (seen.has(r.logDate)) problem = 'Log for this date already exists';
    if (r.logDate && !problem) seen.add(r.logDate);
    return { ...r, problem };
  });
}

export const toPayload = (rows: SheetRow[]) => rows.filter(r => !r.problem).map(r => ({
  line: r.line, logDate: r.logDate, todaysWork: r.todaysWork, hoursWorked: r.hoursWorked,
  learning: r.learning, challenges: r.challenges, tomorrowPlan: r.tomorrowPlan,
}));

export function downloadDailyLogTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Date', "Today's Work", 'Hours', 'Learning', 'Challenges', "Tomorrow's Plan"],
    ['05/08/2026', 'Explored the Titanic dataset and cleaned missing values', 3, 'Pandas fillna, groupby', 'Choosing how to fill Age', 'Feature engineering'],
  ]);
  ws['!cols'] = [{ wch: 12 }, { wch: 50 }, { wch: 7 }, { wch: 28 }, { wch: 28 }, { wch: 28 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily log');
  XLSX.writeFile(wb, 'hiresnix_daily_log_template.xlsx');
}

export const fmtDay = (d?: string | null) => {
  if (!d) return '—';
  const x = new Date(String(d).slice(0, 10) + 'T00:00:00');
  return isNaN(x.getTime()) ? String(d) : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
