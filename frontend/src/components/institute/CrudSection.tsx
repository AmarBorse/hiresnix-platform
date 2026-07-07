// src/components/institute/CrudSection.tsx
// Generic list + add/edit/delete panel shared by every Institute Dashboard module.
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { SectionPanel } from '../../modules/institution/components/InstitutionCards';

export interface CrudColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

export interface CrudField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  parse?: (raw: string) => unknown;
  format?: (value: unknown) => string;
}

interface CrudApi<T> {
  list: () => Promise<{ data?: T[] }>;
  create: (data: Record<string, unknown>) => Promise<{ data?: T }>;
  update: (id: number, data: Record<string, unknown>) => Promise<{ data?: T }>;
  remove: (id: number) => Promise<unknown>;
}

interface CrudSectionProps<T extends { id: number }> {
  title: string;
  addLabel?: string;
  api: CrudApi<T>;
  columns: CrudColumn<T>[];
  fields: CrudField[];
  emptyMessage?: string;
  defaultValues?: Record<string, unknown>;
  rowLabel?: (row: T) => string;
  onLoaded?: (rows: T[]) => void;
}

export function CrudSection<T extends { id: number }>({
  title, addLabel = 'Add', api, columns, fields, emptyMessage = 'No records yet.', defaultValues = {}, rowLabel, onLoaded,
}: CrudSectionProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.list();
      const data = res.data || [];
      setRows(data);
      onLoaded?.(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Could not load ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...defaultValues });
    setDialogOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    const next: Record<string, unknown> = {};
    fields.forEach((field) => {
      const raw = (row as any)[field.key];
      next[field.key] = field.format ? field.format(raw) : raw ?? '';
    });
    setForm(next);
    setDialogOpen(true);
  }

  async function handleSave() {
    for (const field of fields) {
      if (field.required && !String(form[field.key] ?? '').trim()) {
        toast.error(`${field.label} is required.`);
        return;
      }
    }

    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const raw = form[field.key];
      if (field.parse) {
        payload[field.key] = field.parse(String(raw ?? ''));
      } else if (field.type === 'number') {
        payload[field.key] = raw === '' || raw == null ? null : Number(raw);
      } else if (field.type === 'select' && raw !== '' && raw != null && !Number.isNaN(Number(raw))) {
        payload[field.key] = Number(raw);
      } else if (field.type === 'checkbox') {
        payload[field.key] = !!raw;
      } else {
        payload[field.key] = raw === '' ? null : raw;
      }
    });

    setSaving(true);
    try {
      if (editing) {
        await api.update(editing.id, payload);
        toast.success('Updated.');
      } else {
        await api.create(payload);
        toast.success('Added.');
      }
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: T) {
    const label = rowLabel ? rowLabel(row) : `#${row.id}`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await api.remove(row.id);
      toast.success('Deleted.');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not delete.');
    }
  }

  return (
    <SectionPanel title={title} action={<Button size="sm" onClick={openAdd}><Plus size={14} /> {addLabel}</Button>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              {columns.map((col) => <th key={col.key} className="py-3 pr-3">{col.label}</th>)}
              <th className="py-3 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-sm font-semibold text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 pr-3 text-slate-700">
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
                <td className="py-3 pr-3">
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" onClick={() => openEdit(row)}><Pencil size={12} /> Edit</Button>
                    <Button size="xs" variant="outline" onClick={() => handleDelete(row)}><Trash2 size={12} /> Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title.replace(/ Management$/, '')}` : addLabel}</DialogTitle>
            <DialogDescription>{editing ? 'Update the details below.' : 'Fill in the details below.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  {field.label}{field.required ? ' *' : ''}
                </span>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={String(form[field.key] ?? '')}
                    placeholder={field.placeholder}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                    value={String(form[field.key] ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={!!form[field.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.checked }))}
                    className="size-4"
                  />
                ) : (
                  <Input
                    type={field.type || 'text'}
                    value={String(form[field.key] ?? '')}
                    placeholder={field.placeholder}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionPanel>
  );
}
