// src/components/student/EditMySubmissions.tsx
// Shows the intern's submitted tasks and daily logs. While the admin's switches are on, the intern
// can edit them and/or import daily logs they kept in an Excel sheet. Shows nothing when both are off.
// Usage (any student page):  import { EditMySubmissions } from '../../components/student/EditMySubmissions';
//                            <EditMySubmissions />

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PencilLine, Check, X, Loader2, ClipboardList, CalendarDays, ExternalLink, FileSpreadsheet, Upload, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import client from '../../api/client';
import { readDailyLogSheet, checkRows, toPayload, downloadDailyLogTemplate, fmtDay, type SheetRow, type Period } from '../../utils/dailyLogSheet';

type Task = {
  id: string; title?: string; description?: string; url?: string; week?: number; submittedAt?: string; editedAt?: string;
  workDate?: string; importedAt?: string; importSource?: string; dailyLogId?: string | number;
};
type DailyLog = {
  id: string | number; logDate: string; todaysWork?: string; hoursWorked?: number | string;
  learning?: string; challenges?: string; tomorrowPlan?: string; editedAt?: string | null;
  importedAt?: string | null; importSource?: string | null;
};

const fmtDate = (d?: string | null) => {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1';

export function EditMySubmissions() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [importEnabled, setImportEnabled] = useState(false);
  const [period, setPeriod] = useState<Period>(null);
  const [sheetName, setSheetName] = useState('');
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [tab, setTab] = useState<'tasks' | 'logs'>('tasks');
  const [editing, setEditing] = useState<string | null>(null);   // "task:<id>" or "log:<id>"
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get('/intern-edit/my-submissions')
      .then(res => {
        const d = res.data?.data || {};
        setEnabled(!!d.enabled);
        setImportEnabled(!!d.importEnabled);
        setPeriod(d.period || null);
        setTasks(d.tasks || []);
        setLogs(d.dailyLogs || []);
        if (!(d.tasks || []).length && ((d.dailyLogs || []).length || d.importEnabled)) setTab('logs');
      })
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading || (!enabled && !importEnabled)) return null;

  const checkedSheet = checkRows(sheetRows, period, logs.map(l => String(l.logDate).slice(0, 10)));
  const readyCount = checkedSheet.filter(r => !r.problem).length;

  const chooseSheet = async (file: File) => {
    setImportMsg(null);
    try {
      setSheetRows(await readDailyLogSheet(file));
      setSheetName(file.name);
    } catch (e: any) {
      toast.error(e?.message || 'Could not read this file');
    }
  };

  const importSheet = async () => {
    if (!readyCount) return;
    setImporting(true);
    try {
      const res = await client.post('/intern-edit/my-import-daily-logs', { sourceName: sheetName, rows: toPayload(checkedSheet) });
      const d = res.data?.data || {};
      setImportMsg(`${d.imported || 0} logs added${d.skipped?.length ? `, ${d.skipped.length} skipped` : ''}. They also count as tasks; reload the page to see the new task total.`);
      toast.success(res.data?.message || 'Imported');
      setSheetRows([]); setSheetName('');
      const fresh = await client.get('/intern-edit/my-submissions');
      setLogs(fresh.data?.data?.dailyLogs || []);
      setTasks(fresh.data?.data?.tasks || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Import failed');
      if (e?.response?.status === 403) setImportEnabled(false);
    } finally {
      setImporting(false);
    }
  };

  const startTask = (t: Task) => { setEditing(`task:${t.id}`); setDraft({ title: t.title || '', description: t.description || '', url: t.url || '' }); };
  const startLog = (l: DailyLog) => {
    setEditing(`log:${l.id}`);
    setDraft({
      todaysWork: l.todaysWork || '', hoursWorked: l.hoursWorked ?? '', learning: l.learning || '',
      challenges: l.challenges || '', tomorrowPlan: l.tomorrowPlan || '',
    });
  };
  const cancel = () => { setEditing(null); setDraft({}); };

  const saveTask = async (t: Task) => {
    if (!String(draft.title || '').trim()) { toast.error('Task title cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await client.put(`/intern-edit/tasks/${encodeURIComponent(t.id)}`, draft);
      setTasks(ts => ts.map(x => (x.id === t.id ? res.data.data : x)));
      toast.success('Task updated');
      cancel();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save the task');
      if (e?.response?.status === 403) setEnabled(false);
    } finally {
      setSaving(false);
    }
  };

  const saveLog = async (l: DailyLog) => {
    if (!String(draft.todaysWork || '').trim()) { toast.error("Today's work cannot be empty"); return; }
    setSaving(true);
    try {
      const res = await client.put(`/intern-edit/daily-logs/${l.id}`, draft);
      setLogs(ls => ls.map(x => (String(x.id) === String(l.id) ? res.data.data : x)));
      toast.success('Daily log updated');
      cancel();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save the daily log');
      if (e?.response?.status === 403) setEnabled(false);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: string, label: string, rows = 0) => (
    <div>
      <label className={labelCls}>{label}</label>
      {rows
        ? <textarea rows={rows} value={draft[key] ?? ''} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className={`${inputCls} resize-y`} />
        : <input value={draft[key] ?? ''} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className={inputCls} />}
    </div>
  );

  const actions = (onSave: () => void) => (
    <div className="flex items-center gap-2 pt-1">
      <button type="button" onClick={onSave} disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
      </button>
      <button type="button" onClick={cancel} disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
        <X size={14} /> Cancel
      </button>
    </div>
  );

  const editedTag = (d?: string | null) => d
    ? <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Edited {fmtDate(d)}</span>
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="font-bold text-gray-900 flex items-center gap-2"><PencilLine size={16} className="text-emerald-600" /> Edit your submissions</h4>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
          {enabled && importEnabled ? 'Editing & import open' : enabled ? 'Editing open' : 'Import open'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {enabled ? 'You can correct what you already submitted. Dates stay the same, and edited entries are marked. ' : ''}
        {importEnabled ? 'If you kept your daily log in an Excel sheet, you can add it under Daily logs.' : ''}
      </p>

      <div className="flex gap-2 mb-4">
        {([['tasks', `Tasks (${tasks.length})`, ClipboardList], ['logs', `Daily logs (${logs.length})`, CalendarDays]] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" onClick={() => { setTab(key); cancel(); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition ${tab === key ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        tasks.length === 0
          ? <p className="text-sm text-gray-400 text-center py-4">You haven't submitted any tasks yet.</p>
          : <div className="space-y-3">
            {tasks.map(t => {
              const isEd = editing === `task:${t.id}`;
              return (
                <div key={t.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 break-words">{t.title || 'Untitled task'}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                        {t.week ? <span>Week {t.week}</span> : null}
                        {t.importedAt
                          ? <>
                            {t.workDate ? <span>Work date {fmtDate(t.workDate)}</span> : null}
                            <span className="text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5"
                              title={t.importSource ? `Imported from ${t.importSource}` : undefined}>
                              From sheet · added {fmtDate(t.importedAt)}
                            </span>
                          </>
                          : t.submittedAt ? <span>Submitted {fmtDate(t.submittedAt)}</span> : null}
                        {editedTag(t.editedAt)}
                      </div>
                    </div>
                    {enabled && !isEd && t.dailyLogId != null && (
                      <span className="text-[11px] text-gray-400 shrink-0">Edit under Daily logs</span>
                    )}
                    {enabled && !isEd && t.dailyLogId == null && (
                      <button type="button" onClick={() => startTask(t)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600 shrink-0">
                        <PencilLine size={14} /> Edit
                      </button>
                    )}
                  </div>
                  {isEd ? (
                    <div className="mt-3 space-y-3">
                      {field('title', 'Title')}
                      {field('description', 'What you did', 4)}
                      {field('url', 'Link (GitHub, drive, demo…)')}
                      {actions(() => saveTask(t))}
                    </div>
                  ) : (
                    <>
                      {t.description && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line break-words">{t.description}</p>}
                      {t.url && (
                        <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-700 mt-2 break-all">
                          <ExternalLink size={12} /> {t.url}
                        </a>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
      )}

      {tab === 'logs' && importEnabled && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <FileSpreadsheet size={16} className="text-sky-700 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">Import from an Excel sheet</div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Needs a “Date” and a “Today's Work” column. Imported logs keep their dates and are marked “From sheet”.
                  {period?.start ? ` Dates must be between ${fmtDay(period.start)} and ${fmtDay(period.end)}.` : ''}
                </p>
              </div>
            </div>
            <button type="button" onClick={downloadDailyLogTemplate} className="text-xs text-sky-700 hover:text-sky-600 inline-flex items-center gap-1 shrink-0">
              <Download size={12} /> Template
            </button>
          </div>
          <label className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-sky-300 bg-white px-3 py-3 text-sm text-gray-700 cursor-pointer hover:border-sky-500">
            <Upload size={14} /> {sheetName ? `${sheetName} · choose another` : 'Choose .xlsx, .xls or .csv'}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) chooseSheet(f); e.target.value = ''; }} />
          </label>
          {checkedSheet.length > 0 && (
            <>
              <div className="mt-3 rounded-lg border border-gray-200 bg-white overflow-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 sticky top-0">
                    <tr><th className="text-left px-2 py-1.5">Date</th><th className="text-left px-2 py-1.5">Work</th><th className="text-left px-2 py-1.5">Hrs</th><th className="px-2 py-1.5"></th></tr>
                  </thead>
                  <tbody>
                    {checkedSheet.map(r => (
                      <tr key={r.line} className={`border-t border-gray-100 ${r.problem ? 'opacity-60' : ''}`}>
                        <td className="px-2 py-1.5 whitespace-nowrap text-gray-900">{fmtDay(r.logDate)}</td>
                        <td className="px-2 py-1.5 text-gray-700 max-w-[260px] truncate" title={r.todaysWork}>{r.todaysWork || '—'}</td>
                        <td className="px-2 py-1.5 text-gray-600">{r.hoursWorked || ''}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          {r.problem
                            ? <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle size={12} /> {r.problem}</span>
                            : <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={12} /> Ready</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={importSheet} disabled={!readyCount || importing}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40">
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Add {readyCount} logs
              </button>
            </>
          )}
          {importMsg && <p className="text-xs text-emerald-700 mt-2">{importMsg}</p>}
        </div>
      )}

      {tab === 'logs' && (
        logs.length === 0
          ? <p className="text-sm text-gray-400 text-center py-4">You haven't submitted any daily logs yet.</p>
          : <div className="space-y-3">
            {logs.map(l => {
              const isEd = editing === `log:${l.id}`;
              return (
                <div key={l.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-900">{fmtDate(l.logDate)}</span>
                      {l.hoursWorked ? <span className="text-xs text-gray-500">{Number(l.hoursWorked)} h</span> : null}
                      {l.importedAt && (
                        <span className="text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5"
                          title={l.importSource ? `Imported from ${l.importSource}` : undefined}>
                          From sheet · added {fmtDate(l.importedAt)}
                        </span>
                      )}
                      {editedTag(l.editedAt)}
                    </div>
                    {enabled && !isEd && (
                      <button type="button" onClick={() => startLog(l)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600 shrink-0">
                        <PencilLine size={14} /> Edit
                      </button>
                    )}
                  </div>
                  {isEd ? (
                    <div className="mt-3 space-y-3">
                      {field('todaysWork', "Today's work", 3)}
                      <div>
                        <label className={labelCls}>Hours worked</label>
                        <input type="number" min={0} max={24} step={0.5} value={draft.hoursWorked ?? ''}
                          onChange={e => setDraft(d => ({ ...d, hoursWorked: e.target.value }))} className={`${inputCls} max-w-[140px]`} />
                      </div>
                      {field('learning', 'What I learned', 2)}
                      {field('challenges', 'Challenges', 2)}
                      {field('tomorrowPlan', "Tomorrow's plan", 2)}
                      {actions(() => saveLog(l))}
                    </div>
                  ) : (
                    l.todaysWork && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line break-words">{l.todaysWork}</p>
                  )}
                </div>
              );
            })}
          </div>
      )}
    </div>
  );
}

export default EditMySubmissions;