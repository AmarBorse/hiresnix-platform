// src/pages/institution/InstitutionCourses.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, X, Users, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstituteCourse, InstitutionStudent } from '../../types';

const EMPTY = { name: '', description: '', duration: '', durationUnit: 'Weeks' as const, status: 'Active' as const };

function CourseModal({ course, onClose, onSaved }: { course?: InstituteCourse | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(course
    ? { name: course.name, description: course.description||'', duration: course.duration||'', durationUnit: course.durationUnit, status: course.status }
    : { ...EMPTY });
  const [loading, setLoading] = useState(false);
  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Course name required'); return; }
    setLoading(true);
    try {
      if (course) await institutionApi.updateCourse(course.id, form);
      else await institutionApi.createCourse(form);
      toast.success(course ? 'Course updated' : 'Course created');
      onSaved();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="rounded-xl w-full max-w-md" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <h2 className="font-semibold text-white">{course ? 'Edit Course' : 'Create Course'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Course Name *</label>
            <input value={form.name} onChange={f('name')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Duration</label>
              <input value={form.duration} onChange={f('duration')} placeholder="e.g. 6"
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Unit</label>
              <select value={form.durationUnit} onChange={f('durationUnit')}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
                <option>Days</option><option>Weeks</option><option>Months</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Status</label>
            <select value={form.status} onChange={f('status')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Description</label>
            <textarea value={form.description} onChange={f('description')} rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg transition text-gray-400 hover:bg-white/10" style={{border:"1px solid rgba(255,255,255,0.1)"}}>Cancel</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
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
  const [enrolledStudents, setEnrolledStudents] = useState<InstitutionStudent[]>([]);
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
    setAssignCourse(c);
    setAssignSelected([]);
    try {
      const [allRes, enrolledRes] = await Promise.all([
        institutionApi.getStudents({ limit: 200 }),
        institutionApi.getCourseStudents(c.id),
      ]);
      const enrolledIds = new Set((enrolledRes.data || []).map((s: any) => s.id));
      // Available = not yet assigned
      const available = (allRes.data || []).filter((s: any) => !enrolledIds.has(s.id));
      setEnrolledStudents(enrolledRes.data || []);
      setAllStudents(available);
      setAssignModal(true);
    } catch { toast.error('Failed to load students'); }
  };

  const handleAssign = async () => {
    if (!assignCourse || assignSelected.length === 0) return;
    try {
      await institutionApi.assignStudentsToCourse(assignCourse.id, assignSelected);
      toast.success('Students assigned to course');
      setAssignModal(false);
    } catch { toast.error('Failed to assign'); }
  };

  // Select All toggle
  const toggleSelectAll = () => {
    if (assignSelected.length === allStudents.length) setAssignSelected([]);
    else setAssignSelected(allStudents.map(s => s.id));
  };

  const allSelected  = allStudents.length > 0 && assignSelected.length === allStudents.length;
  const someSelected = assignSelected.length > 0 && assignSelected.length < allStudents.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Course Management</h1>
          <p className="text-sm" style={{color:"#64748b"}}>{courses.length} courses</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create'); }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Create Course
        </button>
      </div>

      {loading
        ? <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:"#818cf8 transparent transparent transparent"}} /></div>
        : courses.length === 0
        ? <div className="rounded-xl p-12 text-center" style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(255,255,255,0.08)",color:"#475569"}}>No courses yet</div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <div key={c.id} className="rounded-xl p-5 transition hover:shadow-xl hover:-translate-y-0.5" style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(12px)"}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:"rgba(59,130,246,0.15)",color:"#60a5fa"}}>
                    <BookOpen size={18} />
                  </div>
                  <span className={"text-xs px-2 py-0.5 rounded-full font-medium"}>
                    {c.status}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1">{c.name}</h3>
                {c.duration && <p className="text-xs mb-3" style={{color:"#64748b"}}>Duration: {c.duration} {c.durationUnit}</p>}
                {c.description && <p className="text-xs mb-3 line-clamp-2" style={{color:"#64748b"}}>{c.description}</p>}
                <div className="flex gap-2 pt-3" style={{borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                  <button onClick={() => openAssign(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition hover:bg-indigo-500/20" style={{color:"#818cf8"}}>
                    <Users size={13} /> Assign Students
                  </button>
                  <button onClick={() => { setSelected(c); setModal('edit'); }}
                    className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(c)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <CourseModal
          course={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {assignModal && assignCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
            <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <h2 className="font-semibold text-white">Assign Students to "{assignCourse.name}"</h2>
              <button onClick={() => setAssignModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            {/* Select All bar */}
            <div className="px-4 py-2.5 flex items-center justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)"}}>
              <button onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition">
                {allSelected
                  ? <CheckSquare size={18} className="text-indigo-600" />
                  : someSelected
                  ? <CheckSquare size={18} className="text-indigo-400" />
                  : <Square size={18} className="text-gray-400" />
                }
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs" style={{color:"#64748b"}}>
                {allStudents.length} students · {assignSelected.length} selected
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {allStudents.map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition hover:bg-white/05">
                  <input type="checkbox" checked={assignSelected.includes(s.id)}
                    onChange={e => setAssignSelected(prev =>
                      e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id)
                    )}
                    className="w-4 h-4 rounded" />
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs" style={{color:"#64748b"}}>{s.careerId} · {s.email}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-4 flex justify-end gap-3" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              <button onClick={() => setAssignModal(false)} className="px-4 py-2 text-sm rounded-lg transition text-gray-400 hover:bg-white/10" style={{border:"1px solid rgba(255,255,255,0.1)"}}>Cancel</button>
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
}