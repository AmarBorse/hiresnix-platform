// src/components/admin/CertUnlockAdmin.tsx
// Admin: what interns must do to unlock certificates.
//   • Certificate fee (₹100): switch + the date it turns on by itself (default 2 Feb 2028)
//   • LinkedIn share: switch
//   • LinkedIn submissions: every intern's post link + screenshot; mark one "not valid" to lock again
// Usage (any admin page):  import { CertUnlockAdmin } from '../../components/admin/CertUnlockAdmin';
//                          <CertUnlockAdmin />

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { IndianRupee, Linkedin, Loader2, Search, ExternalLink, Image as ImageIcon, X, RefreshCw, Ban, CheckCircle2 } from 'lucide-react';
import client from '../../api/client';

type Settings = { feeSwitch: boolean; feeAutoOn: string; feeRequired: boolean; linkedinRequired: boolean };
type Proof = { userId: string; name?: string; email?: string; postUrl: string; status: 'submitted' | 'rejected'; note?: string; submittedAt: string; reviewedBy?: string };

const card = 'rounded-xl border border-white/10 bg-[#111827]';
const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDay = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

function Switch({ on, busy, onClick, label }: { on: boolean; busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} disabled={busy}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-emerald-500' : 'bg-slate-600'}`}>
      {busy ? <Loader2 size={14} className="animate-spin text-white mx-auto" />
        : <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />}
    </button>
  );
}

export function CertUnlockAdmin() {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [date, setDate] = useState('');

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'' | 'submitted' | 'rejected'>('');
  const [list, setList] = useState<Proof[]>([]);
  const [counts, setCounts] = useState<{ total: number; rejected: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [shot, setShot] = useState<{ name: string; src: string } | null>(null);
  const [rejecting, setRejecting] = useState<Proof | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    client.get('/cert-unlock/settings').then(r => { setS(r.data.data); setDate(r.data.data.feeAutoOn || ''); }).catch(() => toast.error('Could not load certificate settings'));
  }, []);

  const save = async (key: string, body: Partial<Settings>, msg: string) => {
    setBusy(key);
    try {
      const r = await client.put('/cert-unlock/settings', body);
      setS(r.data.data); setDate(r.data.data.feeAutoOn || '');
      toast.success(msg);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save');
    } finally { setBusy(null); }
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await client.get('/cert-unlock/admin/linkedin', { params: { q: q.trim(), status: filter } });
      setList(r.data.data || []); setCounts(r.data.counts || null);
    } catch { toast.error('Could not load submissions'); } finally { setLoading(false); }
  };
  useEffect(() => { if (open) load(); }, [open, filter]);
  useEffect(() => { if (!open) return; const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q]);

  const viewShot = async (p: Proof) => {
    try {
      const r = await client.get(`/cert-unlock/admin/linkedin/${p.userId}/screenshot`);
      setShot({ name: p.name || p.email || '', src: r.data.data });
    } catch { toast.error('No screenshot found'); }
  };

  const mark = async (p: Proof, status: 'submitted' | 'rejected', note = '') => {
    try {
      const r = await client.put(`/cert-unlock/admin/linkedin/${p.userId}`, { status, note });
      toast.success(r.data.message);
      setList(l => l.map(x => (x.userId === p.userId ? { ...x, status, note } : x)));
      setRejecting(null); setReason('');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not update'); }
  };

  const feeText = !s ? '' : s.feeSwitch
    ? 'On now: interns pay ₹100 to unlock certificates.'
    : s.feeRequired
      ? `On since ${fmtDay(s.feeAutoOn)} (automatic start date).`
      : s.feeAutoOn ? `Off. Certificates are free until ${fmtDay(s.feeAutoOn)}, then the fee starts by itself.` : 'Off. Certificates are free.';

  return (
    <div className="space-y-3">
      <div className={`${card} divide-y divide-white/5`}>
        {/* Fee */}
        <div className="p-4 flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0"><IndianRupee size={17} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">Certificate fee (₹100)</div>
            <p className="text-xs text-slate-400 mt-1">{feeText || 'Loading…'}</p>
            {s && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <label className="text-xs text-slate-400" htmlFor="fee-date">Fee starts by itself on</label>
                <input id="fee-date" type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="bg-[#0f172a] border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500" />
                <button type="button" disabled={busy === 'date' || date === (s.feeAutoOn || '')}
                  onClick={() => save('date', { feeAutoOn: date } as any, date ? `Fee will start on ${fmtDay(date)}` : 'Automatic start removed')}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 text-white disabled:opacity-40">Save date</button>
                {s.feeAutoOn && (
                  <button type="button" onClick={() => save('date', { feeAutoOn: '' } as any, 'Automatic start removed')}
                    className="text-xs text-slate-400 hover:text-white">Clear</button>
                )}
              </div>
            )}
          </div>
          <Switch label="Certificate fee" on={!!s?.feeSwitch} busy={!s || busy === 'fee'}
            onClick={() => s && save('fee', { feeSwitch: !s.feeSwitch }, !s.feeSwitch ? 'Certificate fee turned on' : 'Certificate fee turned off')} />
        </div>

        {/* LinkedIn */}
        <div className="p-4 flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-[#0a66c2]/20 text-sky-400 flex items-center justify-center shrink-0"><Linkedin size={17} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">LinkedIn share needed for certificates</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Interns share their offer letter on LinkedIn, tag Hiresnix, add the internship to Experience, and submit the post link
              with a screenshot. They see this right after downloading the offer letter.
            </p>
          </div>
          <Switch label="LinkedIn share needed" on={!!s?.linkedinRequired} busy={!s || busy === 'li'}
            onClick={() => s && save('li', { linkedinRequired: !s.linkedinRequired }, !s.linkedinRequired ? 'LinkedIn share is now needed' : 'LinkedIn share is no longer needed')} />
        </div>
      </div>

      {/* Submissions */}
      <div className={`${card} p-4`}>
        <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-start gap-4 text-left">
          <div className="w-9 h-9 rounded-lg bg-[#0a66c2]/20 text-sky-400 flex items-center justify-center shrink-0"><CheckCircle2 size={17} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">LinkedIn submissions {counts ? <span className="text-slate-400 font-normal">· {counts.total}{counts.rejected ? `, ${counts.rejected} not valid` : ''}</span> : null}</div>
            <p className="text-xs text-slate-400 mt-1">Open a few posts now and then. If one is fake or Hiresnix isn't tagged, mark it not valid and that intern's certificates lock again.</p>
          </div>
          <span className="text-xs text-emerald-400 font-medium shrink-0 mt-1">{open ? 'Close' : 'Open'}</span>
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by name or email"
                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              {(['', 'submitted', 'rejected'] as const).map(f => (
                <button key={f || 'all'} type="button" onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border ${filter === f ? 'border-emerald-500 text-white bg-emerald-500/10' : 'border-white/10 text-slate-400'}`}>
                  {f === '' ? 'All' : f === 'submitted' ? 'Accepted' : 'Not valid'}
                </button>
              ))}
              <button type="button" onClick={load} className="px-3 rounded-lg border border-white/10 text-slate-300" aria-label="Refresh"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
            </div>

            {loading && !list.length ? <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-emerald-400" /></div>
              : !list.length ? <p className="text-sm text-slate-500 text-center py-6">No submissions yet.</p>
              : (
                <div className="space-y-2">
                  {list.map(p => (
                    <div key={p.userId} className="rounded-lg border border-white/10 bg-[#0f172a] p-3 flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-[220px] text-sm">
                        <div className="text-white font-medium truncate">{p.name || 'Unnamed'} <span className="text-slate-400 font-normal">· {p.email}</span></div>
                        <a href={p.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline break-all inline-flex items-center gap-1 mt-0.5">
                          {p.postUrl.replace(/^https:\/\/(www\.)?/, '').slice(0, 70)}{p.postUrl.length > 80 ? '…' : ''} <ExternalLink size={11} />
                        </a>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Submitted {fmt(p.submittedAt)}
                          {p.status === 'rejected' && <span className="text-red-400"> · Not valid: {p.note}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => viewShot(p)} className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10">
                          <ImageIcon size={12} /> Screenshot
                        </button>
                        {p.status === 'rejected'
                          ? <button type="button" onClick={() => mark(p, 'submitted')} className="text-xs text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">Accept</button>
                          : <button type="button" onClick={() => { setRejecting(p); setReason(''); }} className="text-xs text-red-400 px-2 py-1 rounded border border-red-500/30 inline-flex items-center gap-1"><Ban size={12} /> Not valid</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Screenshot viewer */}
      {shot && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShot(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 text-sm text-white">
              <span>{shot.name}</span>
              <button type="button" onClick={() => setShot(null)} aria-label="Close" className="p-1"><X size={18} /></button>
            </div>
            <img src={shot.src} alt="LinkedIn Experience screenshot" className="w-full max-h-[80vh] object-contain rounded-lg bg-white" />
          </div>
        </div>
      )}

      {/* Reject with reason */}
      {rejecting && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111827] p-5" onClick={e => e.stopPropagation()}>
            <div className="text-white font-semibold">Mark as not valid</div>
            <p className="text-xs text-slate-400 mt-1">{rejecting.name || rejecting.email}'s certificates will lock again, and they'll see this reason.</p>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Hiresnix isn't tagged in the post" autoFocus
              className="mt-3 w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setRejecting(null)} className="px-3 py-2 text-sm text-slate-300">Cancel</button>
              <button type="button" disabled={!reason.trim()} onClick={() => mark(rejecting, 'rejected', reason.trim())}
                className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white disabled:opacity-40">Mark not valid</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CertUnlockAdmin;
