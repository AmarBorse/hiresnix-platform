// src/components/admin/ImportDailyLogs.tsx
// Admin tool: an intern kept their daily log in an Excel sheet instead of the portal.
// Pick the intern, upload the sheet, check the preview, import. Imported logs keep the
// sheet's dates but are always shown as "Imported from <file>" with the import date.
// Usage (any admin page):  import { ImportDailyLogs } from '../../components/admin/ImportDailyLogs';
//                          <ImportDailyLogs />

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileSpreadsheet, Search, Upload, Loader2, Download, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import client from '../../api/client';

type Enr = {
  id: string; studentName?: string; email?: string; status?: string; domain?: string; logCount?: number;
  period?: { start: string | null; end: string | null } | null;
};
type Row = {
  line: number; logDate: string | null; todaysWork: string; hoursWorked: number;
  learning: string; challenges: string; tomorrowPlan: string; problem?: string;
};

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number) => String(n).padStart(2, '0');
const valid = (y: number, m: number, d: number) => {
  if (y < 100) y += 2000;
  const x = new Date(Date.UTC(y, m - 1, d));
  return x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
};

/** Reads a date cell the way people in India write it (day first). Returns YYYY-MM-DD or null. */
function readDate(v: any): string | null {
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
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);                       // 2026-08-05
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);                        // 05/08/2026 (day first)
  if (m) return valid(+m[3], +m[2], +m[1]);
  const monthOf = (w: string) => MONTHS[w.toLowerCase().slice(0, 4)] || MONTHS[w.toLowerCase().slice(0, 3)];
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3,9})[\s,-]+(\d{2,4})$/i); // 5 Aug 2026, 05-Aug-26
  if (m && monthOf(m[2])) return valid(+m[3], monthOf(m[2]), +m[1]);
  m = s.match(/^([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})$/i);                       // Aug 5, 2026
  if (m && monthOf(m[1])) return valid(+m[3], monthOf(m[1]), +m[2]);
  return null;
}

const COLS: Record<keyof Omit<Row, 'line' | 'problem'>, string[]> = {
  logDate: ['date', 'day', 'logdate'],
  todaysWork: ['todayswork', 'work', 'workdone', 'task', 'tasks', 'taskscompleted', 'summaryoftaskscompleted', 'summary', 'description', 'activity', 'activities'],
  hoursWorked: ['hours', 'hoursworked', 'hrs', 'hour'],
  learning: ['learning', 'learnings', 'whatilearned', 'learned', 'learnt'],
  challenges: ['challenges', 'challenge', 'problems', 'issues'],
  tomorrowPlan: ['tomorrowsplan', 'tomorrowplan', 'plan', 'nextplan', 'nextdayplan'],
};
const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');

const fmt = (d?: string | null) => {
  if (!d) return '—';
  const x = new Date(d + 'T00:00:00');
  return isNaN(x.getTime()) ? d : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const box = 'rounded-xl border border-white/10 bg-[#111827] p-4';
const inputCls = 'w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500';

export function ImportDailyLogs() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Enr[]>([]);
  const [searching, setSearching] = useState(false);
  const [enr, setEnr] = useState<Enr | null>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<{ imported: number; skipped: { line: number; date?: string; reason: string }[] } | null>(null);

  // Search interns as the admin types
  useEffect(() => {
    if (q.trim().length < 2 || enr) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await client.get('/intern-edit/admin/enrollments', { params: { q: q.trim() } });
        setResults(res.data?.data || []);
      } catch { setResults([]); } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q, enr]);

  const checked = useMemo(() => {
    const seen = new Set<string>();
    const start = enr?.period?.start, end = enr?.period?.end;
    return rows.map(r => {
      let problem: string | undefined;
      if (!r.logDate) problem = 'Date not readable';
      else if (start && r.logDate < start) problem = 'Before internship start';
      else if (end && r.logDate > end) problem = 'After internship end / today';
      else if (!r.todaysWork.trim()) problem = 'Work is empty';
      else if (seen.has(r.logDate)) problem = 'Same date twice in sheet';
      if (r.logDate) seen.add(r.logDate);
      return { ...r, problem };
    });
  }, [rows, enr]);
  const good = checked.filter(r => !r.problem);

  const readSheet = async (file: File) => {
    setReport(null);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
      // Find the header row: the first row that has a "date" column and a work column
      const hi = grid.findIndex(r => {
        const h = r.map(c => norm(String(c)));
        return h.some(x => COLS.logDate.includes(x)) && h.some(x => COLS.todaysWork.includes(x));
      });
      if (hi < 0) { toast.error('Could not find the header row. The sheet needs at least "Date" and "Today\'s Work" columns.'); return; }
      const head = grid[hi].map(c => norm(String(c)));
      const col = (k: keyof typeof COLS) => head.findIndex(h => COLS[k].includes(h));
      const idx = { logDate: col('logDate'), todaysWork: col('todaysWork'), hoursWorked: col('hoursWorked'), learning: col('learning'), challenges: col('challenges'), tomorrowPlan: col('tomorrowPlan') };
      const text = (r: any[], i: number) => (i >= 0 ? String(r[i] ?? '').trim() : '');
      const out: Row[] = [];
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
      if (!out.length) { toast.error('No rows found under the header'); return; }
      setFileName(file.name);
      setRows(out.slice(0, 400));
    } catch {
      toast.error('Could not read this file. Use .xlsx, .xls or .csv');
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Date', "Today's Work", 'Hours', 'Learning', 'Challenges', "Tomorrow's Plan"],
      ['05/08/2026', 'Explored the Titanic dataset and cleaned missing values', 3, 'Pandas fillna, groupby', 'Choosing how to fill Age', 'Feature engineering'],
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 50 }, { wch: 7 }, { wch: 28 }, { wch: 28 }, { wch: 28 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily log');
    XLSX.writeFile(wb, 'hiresnix_daily_log_template.xlsx');
  };

  const doImport = async () => {
    if (!enr || !good.length) return;
    setImporting(true);
    try {
      const res = await client.post('/intern-edit/admin/import-daily-logs', {
        enrollmentId: enr.id,
        sourceName: fileName,
        rows: good.map(r => ({ logDate: r.logDate, todaysWork: r.todaysWork, hoursWorked: r.hoursWorked, learning: r.learning, challenges: r.challenges, tomorrowPlan: r.tomorrowPlan })),
      });
      setReport(res.data.data);
      toast.success(res.data.message || 'Imported');
      setRows([]);
      setEnr(e => (e ? { ...e, logCount: (e.logCount || 0) + (res.data.data?.imported || 0) } : e));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => { setEnr(null); setQ(''); setRows([]); setFileName(''); setReport(null); };

  return (
    <div className={box}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-start gap-4 text-left">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
          <FileSpreadsheet size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">Import daily logs from a sheet</div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            For interns who kept their daily log in Excel instead of the portal. Imported logs keep the sheet's dates
            and are always marked “Imported from sheet” with the import date.
          </p>
        </div>
        <span className="text-xs text-emerald-400 font-medium shrink-0 mt-1">{open ? 'Close' : 'Open'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Step 1: intern */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1.5">1. Intern</div>
            {enr ? (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-[#0f172a] p-3">
                <div className="min-w-0 text-sm">
                  <div className="text-white font-medium truncate">{enr.studentName || 'Unnamed'} <span className="text-slate-400 font-normal">· {enr.email}</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {enr.domain || 'Internship'} · {fmt(enr.period?.start)} – {fmt(enr.period?.end)} · {enr.logCount || 0} logs on portal
                  </div>
                </div>
                <button type="button" onClick={reset} className="text-slate-400 hover:text-white" aria-label="Change intern"><X size={16} /></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email" className={`${inputCls} pl-9`} />
                {searching && <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
                {results.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-white/10 bg-[#0f172a] shadow-xl max-h-64 overflow-auto">
                    {results.map(r => (
                      <button key={r.id} type="button" onClick={() => { setEnr(r); setResults([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">
                        <div className="text-white">{r.studentName || 'Unnamed'} <span className="text-slate-400">· {r.email}</span></div>
                        <div className="text-xs text-slate-500">{r.domain || 'Internship'} · {r.status} · {r.logCount || 0} logs</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: sheet */}
          {enr && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-semibold text-slate-400">2. The intern's sheet</div>
                <button type="button" onClick={downloadTemplate} className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
                  <Download size={12} /> Template
                </button>
              </div>
              <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-[#0f172a] px-3 py-4 text-sm text-slate-300 cursor-pointer hover:border-emerald-500/50">
                <Upload size={15} /> {fileName ? `${fileName} · choose another` : 'Choose .xlsx, .xls or .csv'}
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) readSheet(f); e.target.value = ''; }} />
              </label>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Needs a “Date” column and a “Today's Work” (or “Tasks”) column. Hours, Learning, Challenges and Tomorrow's Plan are optional.
                Dates like 05/08/2026 are read day first.
              </p>
            </div>
          )}

          {/* Step 3: preview */}
          {enr && checked.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5">
                3. Check and import · {good.length} ready{checked.length - good.length ? `, ${checked.length - good.length} will be skipped` : ''}
              </div>
              <div className="rounded-lg border border-white/10 overflow-auto max-h-80">
                <table className="w-full text-xs">
                  <thead className="bg-white/5 text-slate-400 sticky top-0">
                    <tr><th className="text-left px-2 py-1.5">Row</th><th className="text-left px-2 py-1.5">Date</th><th className="text-left px-2 py-1.5">Work</th><th className="text-left px-2 py-1.5">Hrs</th><th className="text-left px-2 py-1.5"></th></tr>
                  </thead>
                  <tbody>
                    {checked.map(r => (
                      <tr key={r.line} className={`border-t border-white/5 ${r.problem ? 'opacity-60' : ''}`}>
                        <td className="px-2 py-1.5 text-slate-500">{r.line}</td>
                        <td className="px-2 py-1.5 text-white whitespace-nowrap">{fmt(r.logDate)}</td>
                        <td className="px-2 py-1.5 text-slate-300 max-w-[360px] truncate" title={r.todaysWork}>{r.todaysWork || '—'}</td>
                        <td className="px-2 py-1.5 text-slate-300">{r.hoursWorked || ''}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          {r.problem
                            ? <span className="inline-flex items-center gap-1 text-amber-400"><AlertTriangle size={12} /> {r.problem}</span>
                            : <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Ready</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-amber-300/90 mt-2">
                Keep the intern's original sheet. These logs will show as imported from “{fileName}” on today's date, wherever they appear.
              </p>
              <button type="button" onClick={doImport} disabled={!good.length || importing}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40">
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import {good.length} logs
              </button>
            </div>
          )}

          {report && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              <div className="font-medium">{report.imported} logs imported{report.skipped.length ? `, ${report.skipped.length} skipped` : ''}.</div>
              {report.skipped.length > 0 && (
                <ul className="mt-1 text-xs text-emerald-200/80 space-y-0.5">
                  {report.skipped.slice(0, 10).map(s => <li key={`${s.line}-${s.reason}`}>Row {s.line}{s.date ? ` (${fmt(s.date)})` : ''}: {s.reason}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImportDailyLogs;
