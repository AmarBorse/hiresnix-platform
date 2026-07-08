// src/pages/institution/InstitutionBatches.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, X, ChevronRight, ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstituteBatch, InstitutionStudent } from '../../types';

const EMPTY = { name: '', description: '', startDate: '', endDate: '', trainerName: '', trainerEmail: '', status: 'Active' as const };

function BatchModal({ batch, onClose, onSaved }: { batch?: InstituteBatch | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(batch ? {
    name: batch.name, description: batch.description||'', startDate: batch.startDate||'',
    endDate: batch.endDate||'', trainerName: batch.trainerName||'', trainerEmail: batch.trainerEmail||'', status: batch.status,
  } : { ...EMPTY });
  const [loading, setLoading] = useState(false);
  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Batch name required'); return; }
    setLoading(true);
    try {
      if (batch) await institutionApi.updateBatch(batch.id, form);
      else await institutionApi.createBatch(form);
      toast.success(batch ? 'Batch updated' : 'Batch created');
      onSaved();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">{batch ? 'Edit Batch' : 'Create Batch'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {[['Batch Name *', 'name', 'text'], ['Trainer Name', 'trainerName', 'text'], ['Trainer Email', 'trainerEmail', 'email']].map(([l, k, t]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
              <input type={t} value={(form as any)[k]} onChange={f(k)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[['Start Date', 'startDate'], ['End Date', 'endDate']].map(([l, k]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <input type="date" value={(form as any)[k]} onChange={f(k)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={f('status')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option>Active</option><option>Upcoming</option><option>Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={f('description')} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : (batch ? 'Update' : 'Create Batch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-gray-100 text-gray-600',
  Upcoming: 'bg-blue-100 text-blue-700'
};

export function InstitutionBatches() {
  const [batches, setBatches] = useState<InstituteBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<InstituteBatch | null>(null);
  const [viewBatch, setViewBatch] = useState<InstituteBatch | null>(null);
  const [batchStudents, setBatchStudents] = useState<InstitutionStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<InstitutionStudent[]>([]);
  const [assignModal, setAssignModal] = useState(false);
  const [assignSelected, setAssignSelected] = useState<number[]>([]);

  const load = () => {
    setLoading(true);
    institutionApi.getBatches().then(r => setBatches(r.data)).catch(() => toast.error('Failed to load batches')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (b: InstituteBatch) => {
    if (!confirm(`Delete batch "${b.name}"?`)) return;
    try { await institutionApi.deleteBatch(b.id); toast.success('Batch deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const openBatch = async (b: InstituteBatch) => {
    setViewBatch(b); setStudentsLoading(true);
    try { const r = await institutionApi.getBatchStudents(b.id); setBatchStudents(r.data); }
    catch { toast.error('Failed to load students'); }
    finally { setStudentsLoading(false); }
  };

  const openAssign = async () => {
    try {
      const [allRes, batchRes] = await Promise.all([
        institutionApi.getStudents({ limit: 200 }),
        institutionApi.getBatchStudents(viewBatch!.id),
      ]);
      // Filter out already assigned students
      const alreadyAssigned = new Set(batchRes.data.map((s: any) => s.id));
      const available = allRes.data.filter((s: any) => !alreadyAssigned.has(s.id));
      setAllStudents(available);
      setAssignSelected([]);
      setAssignModal(true);
    } catch { toast.error('Failed to load students'); }
  };

  const handleAssign = async () => {
    if (!viewBatch || assignSelected.length === 0) return;
    try {
      await institutionApi.assignStudentsToBatch(viewBatch.id, assignSelected);
      toast.success('Students assigned');
      setAssignModal(false);
      openBatch(viewBatch);
    } catch { toast.error('Failed to assign students'); }
  };

  // Select All / Deselect All
  const toggleSelectAll = () => {
    if (assignSelected.length === allStudents.length) {
      setAssignSelected([]);
    } else {
      setAssignSelected(allStudents.map(s => s.id));
    }
  };

  const allSelected = allStudents.length > 0 && assignSelected.length === allStudents.length;
  const someSelected = assignSelected.length > 0 && assignSelected.length < allStudents.length;

  if (viewBatch) return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewBatch(null)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{viewBatch.name}</h1>
          <p className="text-sm text-gray-500">{batchStudents.length} students enrolled</p>
        </div>
        <button onClick={openAssign} className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Assign Students
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="px-4 py-3">Career ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading
              ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
              : batchStudents.length === 0
              ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No students in this batch yet</td></tr>
              : batchStudents.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{s.careerId}</span></td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email}</td>
                  <td className="px-4 py-3 text-gray-500">{s.department || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={async () => {
                      await institutionApi.removeFromBatch(viewBatch.id, s.id);
                      toast.success('Removed');
                      openBatch(viewBatch);
                    }} className="text-xs text-red-500 hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">Assign Students to Batch</h2>
              <button onClick={() => setAssignModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            {/* Select All bar */}
            <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
              <button onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                {allSelected
                  ? <CheckSquare size={18} className="text-indigo-600" />
                  : someSelected
                  ? <CheckSquare size={18} className="text-indigo-400" />
                  : <Square size={18} className="text-gray-400" />
                }
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs text-gray-400">
                {allStudents.length} available · {assignSelected.length} selected
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {allStudents.length === 0
                ? <p className="text-center text-gray-400 text-sm py-8">All students already assigned to this batch</p>
                : allStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={assignSelected.includes(s.id)}
                      onChange={e => setAssignSelected(prev =>
                        e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id)
                      )}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.careerId} · {s.email}</p>
                    </div>
                  </label>
                ))}
            </div>

            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setAssignModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssign} disabled={assignSelected.length === 0}
                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40">
                Assign {assignSelected.length > 0 ? `(${assignSelected.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-sm text-gray-500">{batches.length} batches</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create'); }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Create Batch
        </button>
      </div>

      {loading
        ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        : batches.length === 0
        ? <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">No batches created yet</div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map(b => (
              <div key={b.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{b.name}</h3>
                    {b.trainerName && <p className="text-xs text-gray-400 mt-0.5">Trainer: {b.trainerName}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                </div>
                <div className="flex items-center gap-2 text-2xl font-bold text-indigo-600 mb-3">
                  <Users size={20} className="text-indigo-400" />
                  {(b as any).studentCount ?? 0}
                  <span className="text-sm font-normal text-gray-400">students</span>
                </div>
                {b.startDate && <p className="text-xs text-gray-400 mb-3">{b.startDate} → {b.endDate || 'ongoing'}</p>}
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <button onClick={() => openBatch(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition">
                    <ChevronRight size={14} /> View Students
                  </button>
                  <button onClick={() => { setSelected(b); setModal('edit'); }}
                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(b)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <BatchModal
          batch={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
