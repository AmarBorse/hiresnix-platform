// src/pages/institution/InstitutionCourses.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, X, Users, ChevronRight, ArrowLeft, CheckCircle, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstituteCourse } from '../../types';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.institution;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="rounded-xl w-full max-w-md" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <h2 className="font-semibold text-white">{course ? 'Edit Course' : 'Create Course'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Course Name *</label>
            <input value={form.name} onChange={f('name')} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Duration</label>
              <input value={form.duration} onChange={f('duration')} placeholder="e.g. 6" className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Unit</label>
              <select value={form.durationUnit} onChange={f('durationUnit')} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
                <option>Days</option><option>Weeks</option><option>Months</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Status</label>
            <select value={form.status} onChange={f('status')} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Description</label>
            <textarea value={form.description} onChange={f('description')} rows={3} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-400 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}>Cancel</button>
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
  const [loading, setLoading]  = useState(true);
  const [modal, setModal]      = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<InstituteCourse | null>(null);
  const [viewCourse, setViewCourse] = useState<InstituteCourse | null>(null);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [studLoading, setStudLoading] = useState(false);

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

  const openView = async (c: InstituteCourse) => {
    setViewCourse(c); setStudLoading(true);
    try {
      const res = await institutionApi.getCourseStudents(c.id);
      setCourseStudents(res.data || []);
    } catch { toast.error('Failed to load students'); }
    finally { setStudLoading(false); }
  };

  // ── Course Students View ────────────────────────────────────────
  if (viewCourse) {
    // Group by batch
    const batchMap: Record<string, any[]> = {};
    courseStudents.forEach(s => {
      const batchName = s.batch?.name || 'No Batch';
      if (!batchMap[batchName]) batchMap[batchName] = [];
      batchMap[batchName].push(s);
    });
    const batchStatus: Record<string, string> = {};
    courseStudents.forEach(s => { if (s.batch) batchStatus[s.batch.name] = s.batch.status; });

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewCourse(null)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{viewCourse.name}</h1>
            <p className="text-sm" style={{color:"#64748b"}}>{courseStudents.length} students enrolled</p>
          </div>
        </div>

        {studLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:`${C.accent} transparent transparent transparent`}} />
          </div>
        ) : courseStudents.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(255,255,255,0.08)",color:"#475569"}}>
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p>No students enrolled in this course yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(batchMap).map(([batchName, students]) => {
              const status = batchStatus[batchName] || 'Active';
              const isCompleted = status === 'Completed';
              return (
                <div key={batchName} className="rounded-xl overflow-hidden" style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))",border:"1px solid rgba(255,255,255,0.1)"}}>
                  {/* Batch header */}
                  <div className="flex items-center justify-between px-5 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.03)"}}>
                    <div className="flex items-center gap-2.5">
                      <Layers size={14} style={{color: isCompleted ? '#34d399' : C.accent}} />
                      <span className="font-bold text-white text-sm">{batchName}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={isCompleted
                          ? {background:"rgba(16,185,129,0.15)",color:"#34d399"}
                          : {background:"rgba(139,92,246,0.15)",color:C.accent}}>
                        {status}
                      </span>
                    </div>
                    <span className="text-xs" style={{color:"#64748b"}}>{students.length} students</span>
                  </div>
                  {/* Students */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide" style={{color:"#475569",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                        <th className="px-4 py-2.5 text-left">Career ID</th>
                        <th className="px-4 py-2.5 text-left">Name</th>
                        <th className="px-4 py-2.5 text-left">Email</th>
                        <th className="px-4 py-2.5 text-left">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id} className="transition" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}
                          onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                          onMouseLeave={e=>(e.currentTarget.style.background="")}>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs px-2 py-0.5 rounded" style={{background:"rgba(99,102,241,0.15)",color:"#818cf8"}}>{s.careerId}</span>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-white">{s.name}</td>
                          <td className="px-4 py-2.5" style={{color:"#64748b"}}>{s.email}</td>
                          <td className="px-4 py-2.5" style={{color:"#64748b"}}>{s.department || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Course List ─────────────────────────────────────────────────
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
        ? <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:`${C.accent} transparent transparent transparent`}} /></div>
        : courses.length === 0
        ? <div className="rounded-xl p-12 text-center" style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(255,255,255,0.08)",color:"#475569"}}>No courses yet</div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <div key={c.id} className="rounded-xl p-5 transition hover:shadow-xl hover:-translate-y-0.5"
                style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(12px)"}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:"rgba(59,130,246,0.15)",color:"#60a5fa"}}>
                    <BookOpen size={18} />
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={c.status === 'Active' ? {background:"rgba(16,185,129,0.15)",color:"#34d399"} : {background:"rgba(100,116,139,0.15)",color:"#94a3b8"}}>
                    {c.status}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1">{c.name}</h3>
                {c.duration && <p className="text-xs mb-1" style={{color:"#64748b"}}>Duration: {c.duration} {c.durationUnit}</p>}
                {c.description && <p className="text-xs mb-3 line-clamp-2" style={{color:"#64748b"}}>{c.description}</p>}
                <div className="flex gap-2 pt-3" style={{borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                  {/* View Students instead of Assign */}
                  <button onClick={() => openView(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition hover:bg-indigo-500/20" style={{color:"#818cf8"}}>
                    <Users size={13} /> View Students
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
    </div>
  );
}