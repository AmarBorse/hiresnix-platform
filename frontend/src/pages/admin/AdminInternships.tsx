// src/pages/admin/AdminInternships.tsx
import React, { useState } from 'react';
import { internshipsApi } from '../../api/internships';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2, Loader2, X, Plus, Save } from 'lucide-react';
import { Internship, InternshipTask } from '../../types';

const EMPTY = {
  title: '', description: '', domain: '', duration: '',
  difficulty: 'Intermediate' as const, technologies: [] as string[],
  tasks: [] as InternshipTask[], status: 'Active' as const,
  maxEnrollments: 100, relatedJobDomains: [] as string[],
};

export function AdminInternships() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [newTech, setNewTech] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: result, loading, error, refetch } = useFetch(
    () => internshipsApi.getInternships({ limit: 50 })
  );
  const internships: Internship[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  const openEdit = (i: Internship) => {
    setForm({
      title: i.title, description: i.description, domain: i.domain,
      duration: i.duration, difficulty: i.difficulty,
      technologies: i.technologies || [], tasks: i.tasks || [],
      status: i.status, maxEnrollments: i.maxEnrollments,
      relatedJobDomains: i.relatedJobDomains || [],
    });
    setEditId(i.id);
    setModal('edit');
  };

  const openCreate = () => {
    setForm(EMPTY);
    setEditId(null);
    setModal('create');
  };

  const handleSave = async () => {
    if (!form.title || !form.domain) { toast.error('Title and domain are required'); return; }
    setSaving(true);
    try {
      if (modal === 'edit' && editId) {
        await internshipsApi.updateInternship(editId, form);
        toast.success('Internship updated!');
      } else {
        await internshipsApi.createInternship(form);
        toast.success('Internship created!');
      }
      setModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this internship?')) return;
    setDeleting(id);
    try {
      await internshipsApi.deleteInternship(id);
      toast.success('Deleted');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setDeleting(null);
    }
  };

  const addTask = () => {
    setForm(p => ({
      ...p,
      tasks: [...p.tasks, { id: Date.now().toString(), title: 'New Task', description: '', difficulty: 'Easy', dueWeek: p.tasks.length + 1 }]
    }));
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Internships</h1>
          <p className="text-sm text-gray-500 mt-1">{internships.length} programs</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition"
        >
          <PlusCircle size={16} /> Create Internship
        </button>
      </div>

      {internships.length === 0 ? (
        <EmptyState title="No internships yet" description="Create your first internship program" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {internships.map(i => (
            <div key={i.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{i.title}</h3>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">{i.domain}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(i)}
                    className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(i.id)} disabled={deleting === i.id}
                    className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 disabled:opacity-50 transition">
                    {deleting === i.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                <span>⏱ {i.duration}</span>
                <span>📋 {i.tasks?.length || 0} tasks</span>
                <span>👥 {i.enrollmentCount}/{i.maxEnrollments} enrolled</span>
                <span className={`font-bold ${i.status === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>{i.status}</span>
              </div>
              {i.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {i.technologies.slice(0, 4).map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900">{modal === 'edit' ? 'Edit Internship' : 'Create Internship'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Domain *</label>
                  <input type="text" value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                    placeholder="Frontend, Backend, Data Science..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Duration</label>
                  <input type="text" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                    placeholder="e.g. 6 Weeks"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white">
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Max Enrollments</label>
                  <input type="number" value={form.maxEnrollments} onChange={e => setForm(p => ({ ...p, maxEnrollments: parseInt(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Technologies</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.technologies.map(t => (
                    <span key={t} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                      {t}
                      <button onClick={() => setForm(p => ({ ...p, technologies: p.technologies.filter(x => x !== t) }))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newTech} onChange={e => setNewTech(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newTech.trim()) { setForm(p => ({ ...p, technologies: [...p.technologies, newTech.trim()] })); setNewTech(''); } }}}
                    placeholder="Add technology..." className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500" />
                  <button onClick={() => { if (newTech.trim()) { setForm(p => ({ ...p, technologies: [...p.technologies, newTech.trim()] })); setNewTech(''); }}}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasks ({form.tasks.length})</label>
                  <button onClick={addTask} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold">
                    <Plus size={12} /> Add Task
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {form.tasks.map((task, idx) => (
                    <div key={task.id} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-bold text-gray-400 w-6">{idx + 1}</span>
                      <input
                        type="text" value={task.title}
                        onChange={e => setForm(p => ({
                          ...p,
                          tasks: p.tasks.map((t, i) => i === idx ? { ...t, title: e.target.value } : t)
                        }))}
                        className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button onClick={() => setForm(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== idx) }))}
                        className="text-gray-400 hover:text-red-400"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Job Domains */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Related Job Domains (for post-completion recommendations)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.relatedJobDomains.map(d => (
                    <span key={d} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      {d}
                      <button onClick={() => setForm(p => ({ ...p, relatedJobDomains: p.relatedJobDomains.filter(x => x !== d) }))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newDomain.trim()) { setForm(p => ({ ...p, relatedJobDomains: [...p.relatedJobDomains, newDomain.trim()] })); setNewDomain(''); }}}}
                    placeholder="e.g. Frontend, React Developer" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500" />
                  <button onClick={() => { if (newDomain.trim()) { setForm(p => ({ ...p, relatedJobDomains: [...p.relatedJobDomains, newDomain.trim()] })); setNewDomain(''); }}}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {modal === 'edit' ? 'Update' : 'Create'}
              </button>
              <button onClick={() => setModal(null)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
