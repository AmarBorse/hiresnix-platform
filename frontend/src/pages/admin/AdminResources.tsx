// src/pages/admin/AdminResources.tsx
import React, { useState } from 'react';
import { resourcesApi } from '../../api/resources';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Loader2, X, Save, Pencil } from 'lucide-react';
import { DOMAIN_OPTIONS } from '../../lib/domains';

type ResourceForm = {
  title: string;
  type: 'Video' | 'Note' | 'Article' | 'PDF';
  link: string;
  domain: string;
  category: string;
  badge: string;
  isPublic: boolean;
};

const EMPTY_FORM: ResourceForm = { title: '', type: 'Video', link: '', domain: '', category: '', badge: '', isPublic: true };

export function AdminResources() {
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: result, loading, error, refetch } = useFetch(
    () => resourcesApi.getResources({ limit: 100 })
  );
  const resources = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  const closeModal = () => {
    setModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const startEdit = (resource: any) => {
    setEditingId(resource.id);
    setForm({
      title: resource.title || '',
      type: resource.type || 'Video',
      link: resource.link || '',
      domain: resource.domain || '',
      category: resource.category || '',
      badge: resource.badge || '',
      isPublic: resource.isPublic ?? true,
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.link || !form.domain) {
      toast.error('Title, link, and domain required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await resourcesApi.updateResource(editingId, form);
        toast.success('Resource updated!');
      } else {
        await resourcesApi.createResource(form);
        toast.success('Resource added!');
      }
      closeModal();
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
        <button onClick={startCreate}
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
                  <td className="px-4 py-3 text-gray-600">{r.domain || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.category || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(r)}
                        className="text-gray-400 hover:text-blue-500 transition"
                        aria-label={`Edit ${r.title}`}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition"
                        aria-label={`Delete ${r.title}`}>
                        {deleting === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
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
              <h3 className="font-black text-gray-900">{editingId ? 'Edit Resource' : 'Add Resource'}</h3>
              <button onClick={closeModal}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'title', label: 'Title *', placeholder: 'Resource title' },
                { key: 'link', label: 'URL *', placeholder: 'https://...' },
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Domain *</label>
                <select value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white">
                  <option value="">Select domain</option>
                  {DOMAIN_OPTIONS.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
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
              <button onClick={closeModal} className="flex-1 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
