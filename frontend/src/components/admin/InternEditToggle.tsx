// src/components/admin/InternEditToggle.tsx
// Admin switches for all interns at once:
//   1. edit the tasks and daily logs they already submitted
//   2. import their own daily logs from an Excel sheet (marked "From sheet")
// Usage (any admin page):  import { InternEditToggle } from '../../components/admin/InternEditToggle';
//                          <InternEditToggle />

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PencilLine, FileSpreadsheet, Loader2 } from 'lucide-react';
import client from '../../api/client';

type Key = 'enabled' | 'importEnabled';

const ROWS: { key: Key; icon: typeof PencilLine; title: string; text: string; on: string; off: string }[] = [
  {
    key: 'enabled', icon: PencilLine,
    title: 'Let interns edit submitted work',
    text: 'Interns can change the text of tasks and daily logs they already submitted. Dates stay the same and each edit is marked “Edited”.',
    on: 'Interns can now edit their submitted tasks and daily logs', off: 'Editing turned off for all interns',
  },
  {
    key: 'importEnabled', icon: FileSpreadsheet,
    title: 'Let interns import daily logs from a sheet',
    text: 'Interns who kept their daily log in Excel can upload it themselves. Imported logs are marked “From sheet” and listed under Sheet imports so you can check them.',
    on: 'Interns can now import daily logs from a sheet', off: 'Sheet import turned off for all interns',
  },
];

export function InternEditToggle() {
  const [state, setState] = useState<Record<Key, boolean> | null>(null);
  const [saving, setSaving] = useState<Key | null>(null);

  useEffect(() => {
    client.get('/intern-edit/setting')
      .then(res => setState({ enabled: !!res.data?.data?.enabled, importEnabled: !!res.data?.data?.importEnabled }))
      .catch(() => setState({ enabled: false, importEnabled: false }));
  }, []);

  const toggle = async (row: typeof ROWS[number]) => {
    if (!state || saving) return;
    const next = !state[row.key];
    setSaving(row.key);
    try {
      const res = await client.put('/intern-edit/setting', { [row.key]: next });
      setState({ enabled: !!res.data?.data?.enabled, importEnabled: !!res.data?.data?.importEnabled });
      toast.success(next ? row.on : row.off);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not change the setting');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] divide-y divide-white/5">
      {ROWS.map(row => {
        const on = !!state?.[row.key];
        const Icon = row.icon;
        return (
          <div key={row.key} className="p-4 flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Icon size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{row.title}</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{row.text}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={row.title}
              onClick={() => toggle(row)}
              disabled={!state || saving !== null}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-emerald-500' : 'bg-slate-600'}`}
            >
              {saving === row.key || !state
                ? <Loader2 size={14} className="animate-spin text-white mx-auto" />
                : <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default InternEditToggle;