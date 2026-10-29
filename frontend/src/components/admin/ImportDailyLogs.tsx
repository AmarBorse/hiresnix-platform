// src/components/admin/ImportDailyLogs.tsx
// Admin tool: an intern kept their daily log in an Excel sheet instead of the portal.
// Pick the intern, upload the sheet, check the preview, import. Imported logs keep the
// sheet's dates but are always shown as "Imported from <file>" with the import date.
// Usage (any admin page):  import { ImportDailyLogs } from '../../components/admin/ImportDailyLogs';
//                          <ImportDailyLogs />

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileSpreadsheet, Search, Upload, Loader2, Download, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import client from '../../api/client';
import { readDailyLogSheet, checkRows, toPayload, downloadDailyLogTemplate, fmtDay, type SheetRow } from '../../utils/dailyLogSheet';

type Enr = {
  id: string; studentName?: string; email?: string; status?: string; domain?: string; logCount?: number;
  period?: { start: string | null; end: string | null } | null;
};
const fmt = fmtDay;

const box = 'rounded-xl border border-white/10 bg-[#111827] p-4';
const inputCls = 'w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500';

export function ImportDailyLogs() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Enr[]>([]);
  const [searching, setSearching] = useState(false);
  const [enr, setEnr] = useState<Enr | null>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<SheetRow[]>([]);
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

  const checked = useMemo(() => checkRows(rows, enr?.period), [rows, enr]);
  const good = checked.filter(r => !r.problem);

  const readSheet = async (file: File) => {
    setReport(null);
    try {
      setRows(await readDailyLogSheet(file));
      setFileName(file.name);
    } catch (e: any) {
      toast.error(e?.message || 'Could not read this file');
    }
  };

  const downloadTemplate = downloadDailyLogTemplate;

  const doImport = async () => {
    if (!enr || !good.length) return;
    setImporting(true);
    try {
      const res = await client.post('/intern-edit/admin/import-daily-logs', {
        enrollmentId: enr.id,
        sourceName: fileName,
        rows: toPayload(checked),
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