// src/components/admin/ImportedLogsReview.tsx
// Admin: every daily-log sheet import (by interns or by admin), newest first.
// Check each against your own list, open its rows, and remove an import if it shouldn't be there.
// Usage (any admin page):  import { ImportedLogsReview } from '../../components/admin/ImportedLogsReview';
//                          <ImportedLogsReview />

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ListChecks, Search, Loader2, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import client from '../../api/client';
import { fmtDay } from '../../utils/dailyLogSheet';

type Batch = {
  batch: string; importedAt: string; importedBy: string; importSource: string; count: number;
  firstDate: string; lastDate: string; enrollmentId: string; studentName?: string; email?: string;
};
type LogRow = { id: string; logDate: string; todaysWork: string; hoursWorked: string | number; editedAt?: string | null };

const when = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function ImportedLogsReview() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [list, setList] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, LogRow[]>>({});
  const [removing, setRemoving] = useState<string | null>(null);

  const load = async (query = q) => {
    setLoading(true);
    try {
      const res = await client.get('/intern-edit/admin/imports', { params: { q: query.trim() } });
      setList(res.data?.data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not load sheet imports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(''); }, [open]);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const toggleRows = async (b: Batch) => {
    if (expanded === b.batch) { setExpanded(null); return; }
    setExpanded(b.batch);
    if (!rows[b.batch]) {
      try {
        const res = await client.get(`/intern-edit/admin/imports/${encodeURIComponent(b.batch)}`);
        setRows(r => ({ ...r, [b.batch]: res.data?.data || [] }));
      } catch {
        toast.error('Could not load the rows');
      }
    }
  };

  const remove = async (b: Batch) => {
    if (!window.confirm(`Remove ${b.count} imported logs for ${b.studentName || b.email}? This can't be undone.`)) return;
    setRemoving(b.batch);
    try {
      const res = await client.delete(`/intern-edit/admin/imports/${encodeURIComponent(b.batch)}`);
      toast.success(res.data?.message || 'Removed');
      setList(l => l.filter(x => x.batch !== b.batch));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-start gap-4 text-left">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
          <ListChecks size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">Sheet imports</div>
          <p className="text-xs text-slate-400 mt-1">Every daily-log sheet imported by interns or admins. Check them against your list and remove any that shouldn't be there.</p>
        </div>
        <span className="text-xs text-emerald-400 font-medium shrink-0 mt-1">{open ? 'Close' : 'Open'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by name or email"
                className="w-full bg-[#0f172a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <button type="button" onClick={() => load()} className="px-3 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5" aria-label="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading && !list.length ? (
            <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-emerald-400" /></div>
          ) : !list.length ? (
            <p className="text-sm text-slate-500 text-center py-6">No sheet imports yet.</p>
          ) : (
            <div className="space-y-2">
              {list.map(b => {
                const byStudent = b.importedBy?.startsWith('student:');
                return (
                  <div key={b.batch} className="rounded-lg border border-white/10 bg-[#0f172a]">
                    <div className="p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0 text-sm">
                        <div className="text-white font-medium truncate">{b.studentName || 'Unnamed'} <span className="text-slate-400 font-normal">· {b.email}</span></div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {b.count} logs · {fmtDay(b.firstDate)} – {fmtDay(b.lastDate)} · “{b.importSource}”
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {byStudent ? 'Imported by the intern' : `Imported by ${b.importedBy?.replace(/^admin:/, '')}`} on {when(b.importedAt)}
                        </div>
                      </div>
                      <button type="button" onClick={() => toggleRows(b)} className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 shrink-0">
                        Rows <ChevronDown size={13} className={`transition-transform ${expanded === b.batch ? 'rotate-180' : ''}`} />
                      </button>
                      <button type="button" onClick={() => remove(b)} disabled={removing === b.batch}
                        className="text-red-400 hover:text-red-300 shrink-0 disabled:opacity-50" aria-label="Remove this import">
                        {removing === b.batch ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                    {expanded === b.batch && (
                      <div className="border-t border-white/5 max-h-64 overflow-auto">
                        {!rows[b.batch] ? (
                          <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
                        ) : (
                          <table className="w-full text-xs">
                            <tbody>
                              {rows[b.batch].map(r => (
                                <tr key={r.id} className="border-t border-white/5 first:border-t-0">
                                  <td className="px-3 py-1.5 text-white whitespace-nowrap align-top">{fmtDay(r.logDate)}</td>
                                  <td className="px-3 py-1.5 text-slate-300">{r.todaysWork}{r.editedAt ? <span className="text-amber-400"> · edited</span> : null}</td>
                                  <td className="px-3 py-1.5 text-slate-400 whitespace-nowrap align-top">{Number(r.hoursWorked) ? `${Number(r.hoursWorked)} h` : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImportedLogsReview;
