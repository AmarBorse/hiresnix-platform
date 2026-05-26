// src/pages/admin/AdminResources.tsx
import React, { useState } from 'react';
import { resourcesApi } from '../../api/resources';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Loader2, X, Save } from 'lucide-react';

const EMPTY_FORM = { title: '', type: 'Video' as const, link: '', domain: '', category: '', badge: '', isPublic: true };

export function AdminResources() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: result, loading, error, refetch } = useFetch(
    () => resourcesApi.getResources({ limit: 100 } as any)
  );
  const resources = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  const handleSave = async () => {
    if (!form.title || !form.link) { toast.error('Title and link required'); return; }
    setSaving(true);
    try {
      await resourcesApi.createResource(form);
      toast.success('Resource added!');
      setModal(false);
      setForm(EMPTY_FORM);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await resourcesApi.deleteResource(id);
      toast.success('Deleted');
      refetch();
    } catch (err: any) {
      toast.error('Failed');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Learning Resources</h1>
          <p className="text-sm text-gray-500 mt-1">{resources.length} resources</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
          <PlusCircle size={16} /> Add Resource
        </button>
      </div>

      {resources.length === 0 ? <EmptyState title="No resources yet" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title', 'Type', 'Domain', 'Category', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline line-clamp-1">{r.title}</a>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{r.type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{r.domain || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.category || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition">
                      {deleting === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">Add Resource</h3>
              <button onClick={() => setModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'title', label: 'Title *', placeholder: 'Resource title' },
                { key: 'link', label: 'URL *', placeholder: 'https://...' },
                { key: 'domain', label: 'Domain', placeholder: 'Frontend, Python...' },
                { key: 'category', label: 'Category', placeholder: 'Beginner, Advanced...' },
                { key: 'badge', label: 'Badge', placeholder: 'Free, Paid, New...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                  <input type="text" value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white">
                  <option>Video</option><option>Note</option><option>Article</option><option>PDF</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
