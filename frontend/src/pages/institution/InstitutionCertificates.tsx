// src/pages/institution/InstitutionCertificates.tsx
import React, { useEffect, useState } from 'react';
import { Award, Plus, Download, X, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstitutionCertificate, InstitutionStudent, InstituteCourse } from '../../types';

const CERT_TYPES = ['Course Completion', 'Training Completion', 'Skill Assessment'] as const;
type CertType = typeof CERT_TYPES[number];

const TYPE_STYLE: Record<string,{background:string,color:string}> = {
  'Course Completion':   {background:'rgba(16,185,129,0.15)',color:'#34d399'},
  'Training Completion': {background:'rgba(59,130,246,0.15)',color:'#60a5fa'},
  'Skill Assessment':    {background:'rgba(139,92,246,0.15)',color:'#c084fc'},
};

// ── Bulk Issue Modal ──────────────────────────────────────────────
function IssueCertModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [students, setStudents]   = useState<InstitutionStudent[]>([]);
  const [courses, setCourses]     = useState<InstituteCourse[]>([]);
  const [selected, setSelected]   = useState<number[]>([]);
  const [certType, setCertType]   = useState<CertType>('Course Completion');
  const [courseId, setCourseId]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [batchIssueModal, setBatchIssueModal] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchSelected, setBatchSelected] = useState('');
  const [batchCertType, setBatchCertType] = useState('Course Completion');
  const [batchIssuing, setBatchIssuing] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  const [issuedStudentIds, setIssuedStudentIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    institutionApi.getBatches().then(r => setBatches(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      institutionApi.getStudents({ limit: 200 }),
      institutionApi.getCourses(),
      institutionApi.getCertificates({ limit: 500 }),
    ])
      .then(([s, c, certs]) => {
        setStudents(s.data);
        setCourses(c.data);
        // Track already issued for this type+course combo
        const issued = new Set<number>(
          (certs.data || []).map((cert: any) => cert.studentId)
        );
        setIssuedStudentIds(issued);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setDataLoading(false));
  }, []);

  // Recompute issued when type/courseId changes
  useEffect(() => {
    institutionApi.getCertificates({ limit: 500 }).then(certs => {
      const issued = new Set<number>(
        (certs.data || [])
          .filter((cert: any) => cert.type === certType && (courseId ? String(cert.courseId) === courseId : !cert.courseId))
          .map((cert: any) => cert.studentId)
      );
      setIssuedStudentIds(issued);
    }).catch(() => {});
  }, [certType, courseId]);

  // Select All
  const allSelected  = students.length > 0 && selected.length === students.length;
  const someSelected = selected.length > 0 && selected.length < students.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(students.map(s => s.id));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) { toast.error('Select at least one student'); return; }
    setLoading(true);
    let success = 0, failed = 0;
    for (const sid of selected) {
      try {
        await institutionApi.issueCertificate({
          studentId: sid,
          courseId: courseId ? parseInt(courseId) : undefined,
          type: certType,
        });
        success++;
      } catch { failed++; }
    }
    if (success > 0) toast.success(`${success} certificate${success > 1 ? 's' : ''} issued!`);
    if (failed > 0) toast.error(`${failed} failed`);
    onSaved();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <h2 className="font-semibold text-white">Issue Certificates</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Type & Course selectors */}
        <div className="px-5 py-4 space-y-3" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Certificate Type *</label>
            <select value={certType} onChange={e => setCertType(e.target.value as CertType)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              {CERT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Course (optional)</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              <option value="">No specific course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
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
            {students.length} students · {selected.length} selected
          </span>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {dataLoading
            ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            : students.length === 0
            ? <p className="text-center text-gray-400 text-sm py-8">No students found</p>
            : students.map(s => {
              const alreadyIssued = issuedStudentIds.has(s.id);
              return (
              <label key={s.id} className={`flex items-center gap-3 p-2.5 rounded-lg transition ${alreadyIssued ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/05'}`}>
                <input type="checkbox" checked={selected.includes(s.id)}
                  disabled={alreadyIssued}
                  onChange={e => !alreadyIssued && setSelected(prev =>
                    e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id)
                  )}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs" style={{color:"#64748b"}}>{s.careerId} · {s.email}</p>
                </div>
                {alreadyIssued
                  ? <span className="text-xs font-semibold shrink-0" style={{color:'#34d399'}}>✅ Already Issued</span>
                  : s.department && <span className="text-xs text-gray-400 shrink-0">{s.department}</span>
                }
              </label>
              );
            })
          }
        </div>

        <div className="p-4 flex items-center justify-between" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <p className="text-xs" style={{color:"#64748b"}}>
            {selected.length > 0 ? `${selected.length} certificate${selected.length > 1 ? 's' : ''} will be issued` : 'Select students to issue certificates'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg transition text-gray-400 hover:bg-white/10" style={{border:"1px solid rgba(255,255,255,0.1)"}}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading || selected.length === 0}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40">
              {loading ? 'Issuing...' : `Issue ${selected.length > 0 ? `(${selected.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export function InstitutionCertificates() {
  const [certs, setCerts]   = useState<InstitutionCertificate[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);

  const load = () => {
    setLoading(true);
    institutionApi.getCertificates({ page: 1, limit: 500 })
      .then(r => { setCerts(r.data); setTotal(r.total); })
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const downloadPdf = (cert: InstitutionCertificate) => {
    window.open(institutionApi.downloadCertPdf(cert.certificateId), '_blank');
  };

  // Group by student
  const grouped = certs.reduce((acc: Record<number, any>, c) => {
    const sid = c.studentId;
    if (!acc[sid]) acc[sid] = { name: c.studentName, careerId: c.student?.careerId || '—', certs: [] };
    acc[sid].certs.push(c);
    return acc;
  }, {});
  const students = Object.values(grouped);

  const TYPE_COLOR: Record<string, { bg: string; color: string; label: string }> = {
    'Skill Assessment':    { bg: 'rgba(139,92,246,0.15)', color: '#c084fc', label: 'Skill' },
    'Course Completion':   { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Course' },
    'Training Completion': { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Training' },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Certificate Management</h1>
          <p className="text-sm" style={{color:"#64748b"}}>{students.length} students · {total} certificates issued</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Issue Certificates
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))",border:"1px solid rgba(255,255,255,0.1)"}}>
        {/* Header */}
        <div className="grid text-xs uppercase tracking-wide px-4 py-3" style={{gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr',color:"#475569",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div>Student</div>
          <div>Career ID</div>
          <div className="text-center">Skill</div>
          <div className="text-center">Course</div>
          <div className="text-center">Training</div>
          <div className="text-center">Downloads</div>
        </div>

        {loading
          ? <div className="text-center py-12" style={{color:"#475569"}}>Loading...</div>
          : students.length === 0
          ? <div className="text-center py-12" style={{color:"#475569"}}>No certificates issued yet</div>
          : students.map((s: any) => {
              const skill    = s.certs.find((c: any) => c.type === 'Skill Assessment');
              const course   = s.certs.find((c: any) => c.type === 'Course Completion');
              const training = s.certs.find((c: any) => c.type === 'Training Completion');
              return (
                <div key={s.careerId} className="grid px-4 py-3 items-center transition"
                  style={{gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr',borderBottom:"1px solid rgba(255,255,255,0.05)"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="")}>
                  {/* Student */}
                  <div className="font-medium text-white text-sm">{s.name}</div>
                  {/* Career ID */}
                  <div className="font-mono text-xs" style={{color:"#64748b"}}>{s.careerId}</div>
                  {/* Skill */}
                  <div className="flex justify-center">
                    {skill
                      ? <button onClick={()=>downloadPdf(skill)} title={`Download ${skill.certificateId}`}
                          className="flex flex-col items-center gap-0.5 group">
                          <CheckCircle2 size={18} style={{color:'#c084fc'}}/>
                          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition" style={{color:'#c084fc'}}>↓</span>
                        </button>
                      : <span style={{color:"#334155"}}>—</span>}
                  </div>
                  {/* Course */}
                  <div className="flex justify-center">
                    {course
                      ? <button onClick={()=>downloadPdf(course)} title={`Download ${course.certificateId}`}
                          className="flex flex-col items-center gap-0.5 group">
                          <CheckCircle2 size={18} style={{color:'#34d399'}}/>
                          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition" style={{color:'#34d399'}}>↓</span>
                        </button>
                      : <span style={{color:"#334155"}}>—</span>}
                  </div>
                  {/* Training */}
                  <div className="flex justify-center">
                    {training
                      ? <button onClick={()=>downloadPdf(training)} title={`Download ${training.certificateId}`}
                          className="flex flex-col items-center gap-0.5 group">
                          <CheckCircle2 size={18} style={{color:'#60a5fa'}}/>
                          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition" style={{color:'#60a5fa'}}>↓</span>
                        </button>
                      : <span style={{color:"#334155"}}>—</span>}
                  </div>
                  {/* Download All */}
                  <div className="flex justify-center gap-2">
                    {s.certs.map((c: any) => (
                      <button key={c.id} onClick={()=>downloadPdf(c)}
                        title={c.type}
                        className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition">
                        <Download size={14}/>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
        }
      </div>

      {modal && <IssueCertModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}