// src/components/admin/InternEditToggle.tsx
// Admin switch: when ON, every intern can edit the tasks and daily logs they already submitted.
// Usage (any admin page):  import { InternEditToggle } from '../../components/admin/InternEditToggle';
//                          <InternEditToggle />

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PencilLine, Loader2 } from 'lucide-react';
import client from '../../api/client';

export function InternEditToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get('/intern-edit/setting')
      .then(res => setEnabled(!!res.data?.data?.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const toggle = async () => {
    if (enabled === null || saving) return;
    const next = !enabled;
    setSaving(true);
    try {
      await client.put('/intern-edit/setting', { enabled: next });
      setEnabled(next);
      toast.success(next ? 'Interns can now edit their submitted tasks and daily logs' : 'Editing turned off for all interns');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not change the setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-4 flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
        <PencilLine size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">Let interns edit submitted work</div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          When on, every intern can change the text of tasks and daily logs they already submitted.
          They can't add new entries or change dates, and each edit is marked “Edited” with its date.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!enabled}
        aria-label="Let interns edit submitted work"
        onClick={toggle}
        disabled={enabled === null || saving}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
      >
        {saving || enabled === null
          ? <Loader2 size={14} className="animate-spin text-white mx-auto" />
          : <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />}
      </button>
    </div>
  );
}

export default InternEditToggle;
