// src/pages/admin/AdminClients.tsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, EyeOff, Save, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import client from '../../api/client';

const EMPTY_FORM = {
  name: '',
  industry: '',
  location: '',
  tagline: '',
  what_we_built: [{ icon: '⚙️', title: '', desc: '' }],
  tech_stack: [''],
  results: [{ value: '', color: '#6366f1', label: '' }],
  is_active: true,
  sort_order: 0,
  nda_protected: false,
};

export function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await client.get('/clients/all');
      setClients(r.data.data || []);
    } catch { toast.error('Failed to load clients'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ ...EMPTY_FORM, what_we_built: [{ icon: '⚙️', title: '', desc: '' }], tech_stack: [''], results: [{ value: '', color: '#6366f1', label: '' }] });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(c: any) {
    setForm({
      name: c.name || '',
      industry: c.industry || '',
      location: c.location || '',
      tagline: c.tagline || '',
      what_we_built: (typeof c.what_we_built === 'string' ? JSON.parse(c.what_we_built) : c.what_we_built) || [{ icon: '⚙️', title: '', desc: '' }],
      tech_stack: (typeof c.tech_stack === 'string' ? JSON.parse(c.tech_stack) : c.tech_stack) || [''],
      results: (typeof c.results === 'string' ? JSON.parse(c.results) : c.results) || [{ value: '', color: '#6366f1', label: '' }],
      is_active: c.is_active !== false,
      sort_order: c.sort_order || 0,
      nda_protected: c.nda_protected || false,
    });
    setEditingId(c.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) { toast.error('Company name required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await client.put(`/clients/${editingId}`, form);
        toast.success('Client updated!');
      } else {
        await client.post('/clients', form);
        toast.success('Client added!');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  }

  async function toggleActive(c: any) {
    try {
      await client.put(`/clients/${c.id}`, {
        ...c,
        what_we_built: typeof c.what_we_built === 'string' ? JSON.parse(c.what_we_built) : c.what_we_built,
        tech_stack: typeof c.tech_stack === 'string' ? JSON.parse(c.tech_stack) : c.tech_stack,
        results: typeof c.results === 'string' ? JSON.parse(c.results) : c.results,
        is_active: !c.is_active,
      });
      toast.success(c.is_active ? 'Hidden from landing page' : 'Visible on landing page');
      load();
    } catch { toast.error('Failed'); }
  }

  async function del(id: number) {
    if (!confirm('Delete this client?')) return;
    setDeleting(id);
    try {
      await client.delete(`/clients/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
    setDeleting(null);
  }

  // Form helpers
  const updateWWB = (i: number, field: string, val: string) => {
    const arr = [...form.what_we_built];
    arr[i] = { ...arr[i], [field]: val };
    setForm((f: any) => ({ ...f, what_we_built: arr }));
  };
  const addWWB = () => setForm((f: any) => ({ ...f, what_we_built: [...f.what_we_built, { icon: '⚙️', title: '', desc: '' }] }));
  const removeWWB = (i: number) => setForm((f: any) => ({ ...f, what_we_built: f.what_we_built.filter((_: any, idx: number) => idx !== i) }));

  const updateStack = (i: number, val: string) => {
    const arr = [...form.tech_stack]; arr[i] = val;
    setForm((f: any) => ({ ...f, tech_stack: arr }));
  };
  const addStack = () => setForm((f: any) => ({ ...f, tech_stack: [...f.tech_stack, ''] }));
  const removeStack = (i: number) => setForm((f: any) => ({ ...f, tech_stack: f.tech_stack.filter((_: any, idx: number) => idx !== i) }));

  const updateResult = (i: number, field: string, val: string) => {
    const arr = [...form.results]; arr[i] = { ...arr[i], [field]: val };
    setForm((f: any) => ({ ...f, results: arr }));
  };
  const addResult = () => setForm((f: any) => ({ ...f, results: [...f.results, { value: '', color: '#6366f1', label: '' }] }));
  const removeResult = (i: number) => setForm((f: any) => ({ ...f, results: f.results.filter((_: any, idx: number) => idx !== i) }));

  const inp = "w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-gray-200 focus:outline-none focus:border-violet-500";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Client Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage clients shown on landing page</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Clients list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: '2.5rem' }}>🏢</div>
          <p className="text-gray-400 font-semibold mt-2">No clients yet</p>
          <p className="text-gray-600 text-sm">Add your first client to show on landing page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(c => (
            <div key={c.id} className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.is_active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                {c.nda_protected ? '🔒' : c.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white">{c.nda_protected ? c.industry || 'NDA Protected Client' : c.name}</p>
                  {c.nda_protected && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-semibold">NDA</span>}
                  {!c.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 font-semibold">Hidden</span>}
                </div>
                <p className="text-xs text-gray-500">{c.industry} {c.location && `· ${c.location}`}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(c)} title={c.is_active ? 'Hide' : 'Show'}
                  className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400">
                  {c.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => openEdit(c)}
                  className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => del(c.id)} disabled={deleting === c.id}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
              style={{ background: '#0f1729', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-black text-white">{editingId ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* NDA toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <input type="checkbox" id="nda" checked={form.nda_protected}
                  onChange={e => setForm((f: any) => ({ ...f, nda_protected: e.target.checked }))}
                  className="w-4 h-4 accent-violet-500" />
                <label htmlFor="nda" className="text-sm font-semibold text-violet-300 cursor-pointer">
                  🔒 NDA Protected — Show as anonymous client (hide company name)
                </label>
              </div>

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Company Name *</label>
                  <input className={inp} value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Focktix Limited" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Industry</label>
                  <input className={inp} value={form.industry} onChange={e => setForm((f: any) => ({ ...f, industry: e.target.value }))} placeholder="e.g. Digital Marketing Agency" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Location</label>
                  <input className={inp} value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="e.g. Maharashtra, India" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Sort Order</label>
                  <input type="number" className={inp} value={form.sort_order} onChange={e => setForm((f: any) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>

              {/* What we built */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-400">What We Built</label>
                  <button onClick={addWWB} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus size={11} /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.what_we_built.map((w: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className={`col-span-1 ${inp}`} value={w.icon} onChange={e => updateWWB(i, 'icon', e.target.value)} placeholder="🔧" />
                      <input className={`col-span-4 ${inp}`} value={w.title} onChange={e => updateWWB(i, 'title', e.target.value)} placeholder="Feature title" />
                      <input className={`col-span-6 ${inp}`} value={w.desc} onChange={e => updateWWB(i, 'desc', e.target.value)} placeholder="Short description" />
                      <button onClick={() => removeWWB(i)} className="col-span-1 text-red-400 hover:text-red-300 text-center"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech stack */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-400">Tech Stack</label>
                  <button onClick={addStack} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus size={11} /> Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tech_stack.map((t: string, i: number) => (
                    <div key={i} className="flex items-center gap-1">
                      <input className="border border-gray-700 rounded-lg px-2 py-1.5 text-xs bg-gray-900 text-gray-200 focus:outline-none focus:border-violet-500 w-28"
                        value={t} onChange={e => updateStack(i, e.target.value)} placeholder="React.js" />
                      <button onClick={() => removeStack(i)} className="text-red-400"><X size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-400">Results / Metrics</label>
                  <button onClick={addResult} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus size={11} /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.results.map((res: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className={`col-span-3 ${inp}`} value={res.value} onChange={e => updateResult(i, 'value', e.target.value)} placeholder="3x" />
                      <input type="color" className="col-span-1 h-9 w-full rounded-lg border border-gray-700 bg-gray-900 cursor-pointer" value={res.color} onChange={e => updateResult(i, 'color', e.target.value)} />
                      <input className={`col-span-7 ${inp}`} value={res.label} onChange={e => updateResult(i, 'label', e.target.value)} placeholder="Lead conversion improvement" />
                      <button onClick={() => removeResult(i)} className="col-span-1 text-red-400"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.is_active}
                  onChange={e => setForm((f: any) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-violet-500" />
                <label htmlFor="active" className="text-sm text-gray-300 cursor-pointer">Show on landing page</label>
              </div>

              {/* Save */}
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition">
                  <Save size={15} /> {saving ? 'Saving...' : editingId ? 'Update Client' : 'Add Client'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-400 hover:bg-white/10 transition font-medium border border-white/10">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
