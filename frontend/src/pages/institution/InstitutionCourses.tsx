// src/pages/institution/InstitutionCourses.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstituteCourse, InstitutionStudent } from '../../types';

const EMPTY = { name: '', description: '', duration: '', durationUnit: 'Weeks' as const, status: 'Active' as const };

function CourseModal({ course, onClose, onSaved }: { course?: InstituteCourse | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(course ? { name: course.name, description: course.description||'', duration: course.duration||'', durationUnit: course.durationUnit, status: course.status } : { ...EMPTY });
  const [loading, setLoading] = useState(false);
  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Course name required'); return; }
    setLoading(true);
    try {
      if (course) await institutionApi.updateCourse(course.id, form);
      else await institutionApi.createCourse(form);
      toast.success(course ? 'Course updated' : 'Course created'); onSaved();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">{course ? 'Edit Course' : 'Create Course'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Course Name *</label>
            <input value={form.name} onChange={f('name')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
              <input value={form.duration} onChange={f('duration')} placeholder="e.g. 6" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <select value={form.durationUnit} onChange={f('durationUnit')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option>Days</option><option>Weeks</option><option>Months</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={f('status')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={f('description')} rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : (course ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InstitutionCourses() {
  const [courses, setCourses] = useState<InstituteCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<InstituteCourse | null>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [assignCourse, setAssignCourse] = useState<InstituteCourse | null>(null);
  const [allStudents, setAllStudents] = useState<InstitutionStudent[]>([]);
  const [assignSelected, setAssignSelected] = useState<number[]>([]);

  const load = () => {
    setLoading(true);
    institutionApi.getCourses().then(r => setCourses(r.data)).catch(() => toast.error('Failed to load courses')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (c: InstituteCourse) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try { await institutionApi.deleteCourse(c.id); toast.success('Course deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const openAssign = async (c: InstituteCourse) => {
    setAssignCourse(c); setAssignSelected([]);
    try { const r = await institutionApi.getStudents({ limit: 200 }); setAllStudents(r.data); setAssignModal(true); }
    catch { toast.error('Failed to load students'); }
  };

  const handleAssign = async () => {
    if (!assignCourse || assignSelected.length === 0) return;
    try {
      await institutionApi.assignStudentsToCourse(assignCourse.id, assignSelected);
      toast.success('Students assigned to course'); setAssignModal(false);
    } catch { toast.error('Failed to assign'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Course Management</h1>
          <p className="text-sm text-gray-500">{courses.length} courses</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create'); }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Create Course
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      : courses.length === 0 ? <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">No courses yet</div>
      : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {c.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{c.name}</h3>
              {c.duration && <p className="text-xs text-gray-400 mb-3">Duration: {c.duration} {c.durationUnit}</p>}
              {c.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
              <div className="flex gap-2 pt-3 border-t border-gray-50">
                <button onClick={() => openAssign(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition">
                  <Users size={13} /> Assign Students
                </button>
                <button onClick={() => { setSelected(c); setModal('edit'); }}
                  className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(c)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      }

      {modal && <CourseModal course={modal === 'edit' ? selected : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}

      {assignModal && assignCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">Assign Students to "{assignCourse.name}"</h2>
              <button onClick={() => setAssignModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {allStudents.map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={assignSelected.includes(s.id)}
                    onChange={e => setAssignSelected(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))}
                    className="w-4 h-4 rounded" />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.careerId} · {s.email}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setAssignModal(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
              <button onClick={handleAssign} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Assign {assignSelected.length > 0 ? `(${assignSelected.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
