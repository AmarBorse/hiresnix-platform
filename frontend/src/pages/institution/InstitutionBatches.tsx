// src/pages/institution/InstitutionBatches.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, X, ChevronRight, ArrowLeft, CheckSquare, Square, Award, CheckCircle, Upload, Download, FileSpreadsheet, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstituteBatch, InstitutionStudent } from '../../types';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.institution;
const EMPTY = { name: '', description: '', startDate: '', endDate: '', trainerName: '', trainerEmail: '', status: 'Active' as const, courseId: '' };

// ── Batch Create/Edit Modal ───────────────────────────────────────
function BatchModal({ batch, onClose, onSaved }: { batch?: InstituteBatch | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(batch ? {
    name: batch.name, description: batch.description||'', startDate: batch.startDate||'',
    endDate: batch.endDate||'', trainerName: batch.trainerName||'', trainerEmail: batch.trainerEmail||'',
    status: batch.status, courseId: String((batch as any).courseId || ''),
  } : { ...EMPTY });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    institutionApi.getCourses().then(r => setCourses(r.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Batch name required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, courseId: form.courseId ? parseInt(form.courseId) : null };
      if (batch) await institutionApi.updateBatch(batch.id, payload);
      else await institutionApi.createBatch(payload);
      toast.success(batch ? 'Batch updated' : 'Batch created');
      onSaved();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="rounded-xl w-full max-w-lg" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <h2 className="font-semibold text-white">{batch ? 'Edit Batch' : 'Create Batch'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Course select — top & prominent */}
          <div className="p-3 rounded-xl" style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)"}}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{color:C.accent}}>
              📚 Course *
            </label>
            <select value={form.courseId} onChange={f('courseId')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              <option value="">Select course...</option>
              {courses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} {c.duration ? `(${c.duration} ${c.durationUnit})` : ''}</option>
              ))}
            </select>
          </div>

          {[['Batch Name *', 'name', 'text'], ['Trainer Name', 'trainerName', 'text'], ['Trainer Email', 'trainerEmail', 'email']].map(([l, k, t]) => (
            <div key={k}>
              <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>{l}</label>
              <input type={t} value={(form as any)[k]} onChange={f(k)}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[['Start Date', 'startDate'], ['End Date', 'endDate']].map(([l, k]) => (
              <div key={k}>
                <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>{l}</label>
                <input type="date" value={(form as any)[k]} onChange={f(k)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Status</label>
            <select value={form.status} onChange={f('status')} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              <option>Active</option><option>Upcoming</option><option>Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Description</label>
            <textarea value={form.description} onChange={f('description')} rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/10 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}>Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : (batch ? 'Update' : 'Create Batch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Issue Certificate Modal (from Batch) ─────────────────────────
function IssueCertFromBatchModal({ batch, onClose, onSaved }: { batch: InstituteBatch; onClose: () => void; onSaved: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [certType, setCertType] = useState('Course Completion');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [issuedIds, setIssuedIds] = useState<Set<number>>(new Set());

  const CERT_TYPES = ['Course Completion', 'Training Completion', 'Skill Assessment'];

  useEffect(() => {
    Promise.all([
      institutionApi.getBatchStudents(batch.id),
      institutionApi.getCertificates({ limit: 500 }),
    ]).then(([studRes, certRes]) => {
      setStudents(studRes.data || []);
      // Find already issued for this batch's course + type
      const batchCourseId = (batch as any).courseId;
      const issued = new Set<number>(
        (certRes.data || [])
          .filter((c: any) => c.type === certType && (batchCourseId ? c.courseId === batchCourseId : !c.courseId))
          .map((c: any) => c.studentId)
      );
      setIssuedIds(issued);
      // Auto-select non-issued students
      const available = (studRes.data || []).filter((s: any) => !issued.has(s.id));
      setSelected(available.map((s: any) => s.id));
    }).catch(() => toast.error('Failed to load')).finally(() => setDataLoading(false));
  }, []);

  // Recompute issued when type changes
  useEffect(() => {
    if (dataLoading) return;
    institutionApi.getCertificates({ limit: 500 }).then(certRes => {
      const batchCourseId = (batch as any).courseId;
      const issued = new Set<number>(
        (certRes.data || [])
          .filter((c: any) => c.type === certType && (batchCourseId ? c.courseId === batchCourseId : !c.courseId))
          .map((c: any) => c.studentId)
      );
      setIssuedIds(issued);
      const available = students.filter(s => !issued.has(s.id));
      setSelected(available.map(s => s.id));
    }).catch(() => {});
  }, [certType]);

  const handleIssue = async () => {
    if (selected.length === 0) { toast.error('Select at least one student'); return; }
    setLoading(true);
    let success = 0, failed = 0;
    for (const sid of selected) {
      try {
        await institutionApi.issueCertificate({
          studentId: sid,
          batchId: batch.id,
          courseId: (batch as any).courseId || undefined,
          type: certType,
        });
        success++;
      } catch { failed++; }
    }
    if (success > 0) toast.success(`${success} certificate${success > 1 ? 's' : ''} issued!`);
    if (failed > 0) toast.error(`${failed} already issued or failed`);
    onSaved();
    setLoading(false);
  };

  const available = students.filter(s => !issuedIds.has(s.id));
  const allSelected = available.length > 0 && selected.length === available.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div>
            <h2 className="font-bold text-white">Issue Certificates</h2>
            <p className="text-xs mt-0.5" style={{color:"#64748b"}}>{batch.name} {(batch as any).course ? `· ${(batch as any).course.name}` : ''}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Cert type */}
        <div className="px-5 py-3 flex-shrink-0" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{color:"#64748b"}}>Certificate Type</label>
          <div className="flex gap-2 flex-wrap">
            {CERT_TYPES.map(t => (
              <button key={t} onClick={() => setCertType(t)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                style={certType === t
                  ? {background:`linear-gradient(135deg,${C.accent},${C.accent}99)`,color:'#fff'}
                  : {background:'rgba(255,255,255,0.06)',color:'#94a3b8',border:'1px solid rgba(255,255,255,0.1)'}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Select all */}
        <div className="px-4 py-2.5 flex items-center justify-between flex-shrink-0" style={{borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"}}>
          <button onClick={() => setSelected(allSelected ? [] : available.map(s => s.id))}
            className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition">
            {allSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-500" />}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs" style={{color:"#64748b"}}>{available.length} available · {selected.length} selected</span>
        </div>

        {/* Students list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {dataLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:`${C.accent} transparent transparent transparent`}} />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{color:"#64748b"}}>No students in this batch</p>
          ) : (
            <>
              {/* Already issued */}
              {Array.from(issuedIds).length > 0 && students.filter(s => issuedIds.has(s.id)).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-50"
                  style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)"}}>
                  <CheckCircle size={14} style={{color:"#34d399",flexShrink:0}} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs truncate" style={{color:"#475569"}}>{s.careerId}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{background:"rgba(16,185,129,0.15)",color:"#34d399"}}>Issued</span>
                </div>
              ))}
              {/* Available */}
              {available.map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition"
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.05)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="")}>
                  <input type="checkbox" checked={selected.includes(s.id)}
                    onChange={e => setSelected(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))}
                    className="w-4 h-4 rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs truncate" style={{color:"#475569"}}>{s.careerId} · {s.department || s.email}</p>
                  </div>
                </label>
              ))}
            </>
          )}
        </div>

        <div className="p-4 flex items-center justify-between flex-shrink-0" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <p className="text-xs" style={{color:"#64748b"}}>
            {selected.length > 0 ? `${selected.length} certificate${selected.length > 1 ? 's' : ''} will be issued` : 'Select students'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/10 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}>Cancel</button>
            <button onClick={handleIssue} disabled={loading || selected.length === 0}
              className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40 transition"
              style={{background:`linear-gradient(135deg,${C.accent},${C.accent}99)`}}>
              {loading ? 'Issuing...' : `Issue (${selected.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Status styles ─────────────────────────────────────────────────
const STATUS_STYLE: Record<string, {background:string,color:string}> = {
  Active:    {background:'rgba(16,185,129,0.15)',color:'#34d399'},
  Completed: {background:'rgba(100,116,139,0.15)',color:'#94a3b8'},
  Upcoming:  {background:'rgba(59,130,246,0.15)',color:'#60a5fa'},
};

// ── Main Component ────────────────────────────────────────────────
export function InstitutionBatches() {
  const [batches, setBatches]       = useState<InstituteBatch[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected]     = useState<InstituteBatch | null>(null);
  const [viewBatch, setViewBatch]   = useState<InstituteBatch | null>(null);
  const [batchStudents, setBatchStudents]   = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [allStudents, setAllStudents]           = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents]   = useState<any[]>([]);
  const [sameCourseStudents, setSameCourseStudents] = useState<any[]>([]);
  const [batchCourse, setBatchCourse]             = useState<any>(null);
  const [assignModal, setAssignModal]       = useState(false);
  const [assignSelected, setAssignSelected] = useState<number[]>([]);
  const [certModal, setCertModal]           = useState<InstituteBatch | null>(null);
  const [batchImportModal, setBatchImportModal] = useState(false);
  const [batchImportFile, setBatchImportFile]   = useState<File|null>(null);
  const [batchImporting, setBatchImporting]     = useState(false);
  const [batchImportResult, setBatchImportResult] = useState<any>(null);

  const load = () => {
    setLoading(true);
    institutionApi.getBatches()
      .then(r => setBatches(r.data))
      .catch(() => toast.error('Failed to load batches'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (b: InstituteBatch) => {
    if (!confirm(`Delete batch "${b.name}"?`)) return;
    try { await institutionApi.deleteBatch(b.id); toast.success('Batch deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const openBatch = async (b: InstituteBatch) => {
    setViewBatch(b); setStudentsLoading(true);
    try {
      const r = await institutionApi.getBatchStudents(b.id);
      setBatchStudents(r.data || []);
    } catch { toast.error('Failed to load students'); }
    finally { setStudentsLoading(false); }
  };

  const handleBatchImport = async () => {
    if (!batchImportFile || !viewBatch) return;
    setBatchImporting(true);
    try {
      const result = await institutionApi.bulkImportToBatch(viewBatch.id, batchImportFile);
      setBatchImportResult(result);
      openBatch(viewBatch);
    } catch(err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally { setBatchImporting(false); }
  };

  const openAssign = async () => {
    try {
      // Try new API with course filtering
      const res = await institutionApi.getAvailableStudentsForBatch(viewBatch!.id);
      setAllStudents(res.data || []);
      setEnrolledStudents(res.alreadyInBatch || []);
      setSameCourseStudents(res.alreadyInSameCourse || []);
      setBatchCourse(res.batchCourse || null);
      setAssignSelected([]);
      setAssignModal(true);
    } catch {
      // Fallback: if new API fails (DB migration not run yet), use old API
      try {
        const [allRes, batchRes] = await Promise.all([
          institutionApi.getStudents({ limit: 200 }),
          institutionApi.getBatchStudents(viewBatch!.id),
        ]);
        const enrolledIds = new Set((batchRes.data || []).map((s: any) => s.id));
        setEnrolledStudents(batchRes.data || []);
        setSameCourseStudents([]);
        setBatchCourse(null);
        setAllStudents((allRes.data || []).filter((s: any) => !enrolledIds.has(s.id)));
        setAssignSelected([]);
        setAssignModal(true);
      } catch { toast.error('Failed to load students'); }
    }
  };

  const handleAssign = async () => {
    if (!viewBatch || assignSelected.length === 0) return;
    try {
      await institutionApi.assignStudentsToBatch(viewBatch.id, assignSelected);
      toast.success('Students assigned!');
      setAssignModal(false);
      openBatch(viewBatch);
    } catch { toast.error('Failed to assign'); }
  };

  const toggleAll = () => {
    setAssignSelected(assignSelected.length === allStudents.length ? [] : allStudents.map(s => s.id));
  };
  const allSel  = allStudents.length > 0 && assignSelected.length === allStudents.length;
  const someSel = assignSelected.length > 0 && assignSelected.length < allStudents.length;

  // ── Batch Detail View ──────────────────────────────────────────
  if (viewBatch) return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewBatch(null)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{viewBatch.name}</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={STATUS_STYLE[(viewBatch as any).status] || {}}>
              {(viewBatch as any).status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {(viewBatch as any).course && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{background:"rgba(139,92,246,0.15)",color:"#c084fc"}}>
                📚 {(viewBatch as any).course.name}
              </span>
            )}
            <p className="text-sm" style={{color:"#64748b"}}>{batchStudents.length} students</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setBatchImportModal(true); setBatchImportFile(null); setBatchImportResult(null); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl transition"
            style={{background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.3)',color:'#f59e0b'}}>
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={() => setCertModal(viewBatch)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl transition text-white"
            style={{background:"linear-gradient(135deg,#10b981,#059669)"}}>
            <Award size={14} /> Issue Certificates
          </button>
          <button onClick={openAssign}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
            <Plus size={15} /> Assign Students
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-x-auto" style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))",border:"1px solid rgba(255,255,255,0.1)"}}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide" style={{color:"#475569",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <th className="px-4 py-3">Career ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading
              ? <tr><td colSpan={5} className="text-center py-10" style={{color:"#475569"}}>Loading...</td></tr>
              : batchStudents.length === 0
              ? <tr><td colSpan={5} className="text-center py-10" style={{color:"#475569"}}>No students yet. Click "Assign Students" to add.</td></tr>
              : batchStudents.map((s: any) => (
                <tr key={s.id} className="transition" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="")}>
                  <td className="px-4 py-3"><span className="font-mono text-xs px-2 py-0.5 rounded" style={{background:"rgba(99,102,241,0.15)",color:"#818cf8"}}>{s.careerId}</span></td>
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3" style={{color:"#64748b"}}>{s.email}</td>
                  <td className="px-4 py-3" style={{color:"#64748b"}}>{s.department || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={async () => {
                      await institutionApi.removeFromBatch(viewBatch.id, s.id);
                      toast.success('Removed');
                      openBatch(viewBatch);
                    }} className="text-xs hover:underline transition" style={{color:"#f87171"}}>Remove</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Batch Import Modal */}
      {batchImportModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto" style={{backdropFilter:'blur(4px)'}}>
          <div className="rounded-2xl w-full max-w-lg mt-8" style={{background:'linear-gradient(135deg,#0f1729,#0d1b35)',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'0 25px 60px rgba(0,0,0,0.7)'}}>
            <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} style={{color:'#f59e0b'}} />
                <div>
                  <h2 className="font-bold text-white">Import Students to Batch</h2>
                  <p className="text-xs mt-0.5" style={{color:'#64748b'}}>{viewBatch?.name} — Students will be created & auto-assigned</p>
                </div>
              </div>
              <button onClick={() => setBatchImportModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!batchImportResult ? (
                <>
                  <div className="rounded-xl p-3 text-xs" style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',color:'#94a3b8'}}>
                    <p className="font-bold mb-1" style={{color:'#f59e0b'}}>CSV Columns:</p>
                    <div className="grid grid-cols-3 gap-1">
                      {['Name *','Email *','Department','Roll No','Mobile','Year'].map(c=>(
                        <span key={c} className="font-mono" style={{color:'#c7d2fe'}}>{c}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => {
                    const csv = 'Name,Email,Department,Roll No,Mobile,Year
Rahul Sharma,rahul@example.com,Computer Science,CS001,9876543210,3rd Year
';
                    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
                    a.download = 'batch_import_template.csv'; a.click();
                  }} className="flex items-center gap-2 text-xs" style={{color:'#34d399'}}>
                    <Download size={12}/> Download Template
                  </button>
                  <label className="flex flex-col items-center justify-center p-8 rounded-xl cursor-pointer" style={{border:`2px dashed ${batchImportFile?'rgba(245,158,11,0.5)':'rgba(255,255,255,0.12)'}`,background:'rgba(255,255,255,0.02)'}}>
                    <Upload size={28} className="mb-2" style={{color:batchImportFile?'#f59e0b':'#475569'}} />
                    <p className="text-sm font-semibold" style={{color:batchImportFile?'#f59e0b':'#64748b'}}>
                      {batchImportFile ? batchImportFile.name : 'Click to upload CSV / Excel'}
                    </p>
                    <p className="text-xs mt-1" style={{color:'#334155'}}>.csv, .xlsx, .xls</p>
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e=>setBatchImportFile(e.target.files?.[0]||null)} />
                  </label>
                  <div className="flex gap-3">
                    <button onClick={()=>setBatchImportModal(false)} className="flex-1 py-2.5 text-sm rounded-xl text-gray-400 hover:bg-white/10" style={{border:'1px solid rgba(255,255,255,0.1)'}}>Cancel</button>
                    <button onClick={handleBatchImport} disabled={!batchImportFile||batchImporting}
                      className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}>
                      {batchImporting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Importing...</> : <><Upload size={14}/> Import & Assign</>}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {l:'Total', v:batchImportResult.summary.total, c:'#94a3b8'},
                      {l:'Created', v:batchImportResult.summary.created, c:'#34d399'},
                      {l:'Assigned', v:batchImportResult.summary.assigned, c:'#818cf8'},
                      {l:'Skipped', v:batchImportResult.summary.skipped, c:'#f59e0b'},
                    ].map(s=>(
                      <div key={s.l} className="rounded-xl p-3 text-center" style={{background:'rgba(255,255,255,0.04)'}}>
                        <p className="text-xl font-black" style={{color:s.c}}>{s.v}</p>
                        <p className="text-xs" style={{color:'#475569'}}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                  {batchImportResult.data.created.length > 0 && (
                    <div className="rounded-xl overflow-hidden" style={{border:'1px solid rgba(52,211,153,0.2)'}}>
                      <div className="px-3 py-2 text-xs font-bold" style={{background:'rgba(16,185,129,0.08)',color:'#34d399'}}>✅ New Students (save passwords!)</div>
                      <div className="max-h-40 overflow-y-auto">
                        {batchImportResult.data.created.map((s:any)=>(
                          <div key={s.careerId} className="flex items-center justify-between px-3 py-2 text-xs" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                            <div><span className="text-white">{s.name}</span> <span className="font-mono ml-1" style={{color:'#818cf8'}}>{s.careerId}</span></div>
                            <span className="font-mono px-2 py-0.5 rounded" style={{background:'rgba(245,158,11,0.15)',color:'#fbbf24'}}>{s.defaultPassword}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={()=>{setBatchImportResult(null);setBatchImportFile(null);}} className="w-full py-2.5 text-sm font-bold rounded-xl text-white" style={{background:'#6366f1'}}>Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
            <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <h2 className="font-semibold text-white">Assign Students</h2>
              <button onClick={() => setAssignModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)"}}>
              <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition">
                {allSel ? <CheckSquare size={16}/> : someSel ? <CheckSquare size={16} className="opacity-50"/> : <Square size={16} className="text-gray-500"/>}
                {allSel ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs" style={{color:"#64748b"}}>{allStudents.length} available · {assignSelected.length} selected</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {enrolledStudents.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:"#34d399"}}>✅ Already in this Batch ({enrolledStudents.length})</p>
                  {enrolledStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg opacity-50 mb-1"
                      style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)"}}>
                      <CheckCircle size={13} style={{color:"#34d399",flexShrink:0}} />
                      <div><p className="text-sm font-medium text-white">{s.name}</p><p className="text-xs" style={{color:"#475569"}}>{s.careerId}</p></div>
                    </div>
                  ))}
                  {(allStudents.length > 0 || sameCourseStudents.length > 0) && <div className="my-3 border-t" style={{borderColor:"rgba(255,255,255,0.08)"}} />}
                </div>
              )}

              {/* Same course — not eligible */}
              {sameCourseStudents.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:"#f59e0b"}}>
                    ⚠️ Already completed/enrolled in {batchCourse?.name || 'same course'} ({sameCourseStudents.length})
                  </p>
                  {sameCourseStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg opacity-50 mb-1"
                      style={{background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)"}}>
                      <span style={{color:"#f59e0b",fontSize:13,flexShrink:0}}>⚠</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.name}</p>
                        <p className="text-xs" style={{color:"#475569"}}>{s.careerId} · Already in this course or certificate issued</p>
                      </div>
                    </div>
                  ))}
                  {allStudents.length > 0 && <div className="my-3 border-t" style={{borderColor:"rgba(255,255,255,0.08)"}} />}
                </div>
              )}
              {allStudents.length === 0
                ? <p className="text-center text-sm py-4" style={{color:"#64748b"}}>All students already assigned</p>
                : allStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.05)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="")}>
                    <input type="checkbox" checked={assignSelected.includes(s.id)}
                      onChange={e => setAssignSelected(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))}
                      className="w-4 h-4 rounded" />
                    <div><p className="text-sm font-medium text-white">{s.name}</p><p className="text-xs" style={{color:"#64748b"}}>{s.careerId} · {s.email}</p></div>
                  </label>
                ))}
            </div>
            <div className="p-4 flex justify-end gap-3" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              <button onClick={() => setAssignModal(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/10 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}>Cancel</button>
              <button onClick={handleAssign} disabled={assignSelected.length === 0}
                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40">
                Assign ({assignSelected.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Certificate Modal */}
      {certModal && (
        <IssueCertFromBatchModal
          batch={certModal}
          onClose={() => setCertModal(null)}
          onSaved={() => { setCertModal(null); }}
        />
      )}
    </div>
  );

  // ── Batch List ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Batch Management</h1>
          <p className="text-sm" style={{color:"#64748b"}}>{batches.length} batches</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create'); }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Create Batch
        </button>
      </div>

      {loading
        ? <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:`${C.accent} transparent transparent transparent`}} /></div>
        : batches.length === 0
        ? <div className="rounded-xl p-12 text-center" style={{background:"rgba(15,23,42,0.6)",border:"1px solid rgba(255,255,255,0.08)",color:"#475569"}}>No batches yet. Create your first batch!</div>
        : (() => {
            const activeBatches = batches.filter(b => b.status !== 'Completed');
            const completedBatches = batches.filter(b => b.status === 'Completed');
            return (
              <div className="space-y-6">
                {/* Active & Upcoming Batches */}
                {activeBatches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      Active & Upcoming ({activeBatches.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeBatches.map(b => (
                        <div key={b.id} className="rounded-xl p-5 transition hover:shadow-xl hover:-translate-y-0.5"
                          style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(12px)"}}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">{b.name}</h3>
                              {(b as any).course && (
                                <span className="inline-flex items-center text-xs font-medium mt-1 px-2 py-0.5 rounded-full" style={{background:"rgba(139,92,246,0.15)",color:"#c084fc"}}>
                                  📚 {(b as any).course.name}
                                </span>
                              )}
                              {b.trainerName && <p className="text-xs mt-1" style={{color:"#64748b"}}>👤 {b.trainerName}</p>}
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2" style={STATUS_STYLE[b.status] || {}}>
                              {b.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-2xl font-bold mb-3" style={{color:"#818cf8"}}>
                            <Users size={20} className="text-indigo-400" />
                            {(b as any).studentCount ?? 0}
                            <span className="text-sm font-normal text-gray-400">students</span>
                          </div>
                          {b.startDate && <p className="text-xs mb-3" style={{color:"#64748b"}}>{b.startDate} → {b.endDate || 'ongoing'}</p>}
                          <div className="flex gap-2 pt-3" style={{borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                            <button onClick={() => openBatch(b)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition hover:bg-indigo-500/20" style={{color:"#818cf8"}}>
                              <ChevronRight size={14}/> View
                            </button>
                            <button onClick={() => setCertModal(b)} className="flex items-center gap-1 py-1.5 px-2.5 text-xs font-medium rounded-lg transition hover:bg-emerald-500/20" style={{color:"#34d399"}}>
                              <Award size={13}/> Cert
                            </button>
                            <button onClick={() => { setSelected(b); setModal('edit'); }} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition"><Pencil size={14}/></button>
                            <button onClick={() => handleDelete(b)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Completed Batches Glass Cards ── */}
                {completedBatches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <CheckCircle size={14} style={{color:'#34d399'}} />
                      Completed Batches ({completedBatches.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {completedBatches.map(b => (
                        <div key={b.id} className="rounded-2xl overflow-hidden transition hover:shadow-2xl hover:-translate-y-1"
                          style={{
                            background:'linear-gradient(135deg,rgba(16,185,129,0.08) 0%,rgba(15,23,42,0.98) 40%,rgba(15,23,42,0.98) 100%)',
                            border:'1px solid rgba(52,211,153,0.25)',
                            backdropFilter:'blur(20px)',
                            boxShadow:'0 8px 32px rgba(16,185,129,0.1)',
                          }}>
                          {/* Green shimmer header */}
                          <div className="px-5 pt-5 pb-3 relative overflow-hidden">
                            <div style={{position:'absolute',top:-30,right:-30,width:80,height:80,borderRadius:'50%',background:'#10b981',opacity:0.08,filter:'blur(20px)'}} />
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:'rgba(52,211,153,0.15)',color:'#34d399'}}>✅ Completed</span>
                                  {(b as any).course && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{background:'rgba(139,92,246,0.15)',color:'#c084fc'}}>
                                      📚 {(b as any).course.name}
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-black text-white text-base">{b.name}</h3>
                                {b.trainerName && <p className="text-xs mt-0.5" style={{color:'#64748b'}}>👤 {b.trainerName}</p>}
                              </div>
                              <div className="flex flex-col items-center ml-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                  style={{background:'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.05)',border:'1px solid rgba(52,211,153,0.3)'}}>
                                  🏆
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-3 gap-px mx-4 mb-4 rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                            {[
                              {label:'Students', value:(b as any).studentCount ?? 0, icon:'👥'},
                              {label:'Duration', value:b.startDate && b.endDate ? `${Math.ceil((new Date(b.endDate).getTime()-new Date(b.startDate).getTime())/(1000*60*60*24*30))}m` : '—', icon:'📅'},
                              {label:'Trainer', value:b.trainerName ? b.trainerName.split(' ')[0] : '—', icon:'👤'},
                            ].map((stat,i)=>(
                              <div key={i} className="py-3 text-center" style={{background:'rgba(15,23,42,0.6)'}}>
                                <p className="text-base font-black text-white">{stat.value}</p>
                                <p className="text-xs mt-0.5" style={{color:'#475569'}}>{stat.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Dates */}
                          {b.startDate && (
                            <div className="mx-4 mb-3 px-3 py-2 rounded-lg text-xs" style={{background:'rgba(255,255,255,0.03)',color:'#475569'}}>
                              🗓 {b.startDate} → {b.endDate || '—'}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 px-4 pb-4">
                            <button onClick={() => openBatch(b)}
                              className="flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                              style={{background:'rgba(52,211,153,0.12)',border:'1px solid rgba(52,211,153,0.25)',color:'#34d399'}}>
                              <Users size={12}/> View Students
                            </button>
                            <button onClick={() => setCertModal(b)}
                              className="flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 text-white"
                              style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
                              <Award size={12}/> Issue Certs
                            </button>
                            <button onClick={() => { setSelected(b); setModal('edit'); }}
                              className="p-2 rounded-xl transition hover:bg-white/10 text-gray-500 hover:text-indigo-400">
                              <Pencil size={13}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
      }

      {modal && (
        <BatchModal
          batch={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {certModal && !viewBatch && (
        <IssueCertFromBatchModal
          batch={certModal}
          onClose={() => setCertModal(null)}
          onSaved={() => { setCertModal(null); }}
        />
      )}
    </div>
  );
}