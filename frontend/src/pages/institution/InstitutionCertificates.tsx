// src/pages/institution/InstitutionCertificates.tsx
import React, { useEffect, useState } from 'react';
import { Award, Plus, Download, X, CheckCircle2, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
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
  const [certTypes, setCertTypes] = useState<Set<CertType>>(new Set(['Course Completion']));
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
          .filter((cert: any) => certTypes.has(cert.type as CertType) && (courseId ? String(cert.courseId) === courseId : !cert.courseId))
          .map((cert: any) => cert.studentId)
      );
      setIssuedStudentIds(issued);
    }).catch(() => {});
  }, [courseId]);

  // Select All
  const allSelected  = students.length > 0 && selected.length === students.length;
  const someSelected = selected.length > 0 && selected.length < students.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(students.map(s => s.id));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) { toast.error('Select at least one student'); return; }
    if (certTypes.size === 0) { toast.error('Select at least one certificate type'); return; }
    setLoading(true);
    let success = 0, failed = 0;
    for (const sid of selected) {
      for (const cType of certTypes) {
        try {
          await institutionApi.issueCertificate({
            studentId: sid,
            courseId: courseId ? parseInt(courseId) : undefined,
            type: cType,
          });
          success++;
        } catch { failed++; }
      }
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
            <label className="block text-xs font-medium mb-2" style={{color:"#64748b"}}>Certificate Type *</label>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {CERT_TYPES.map(t => {
                const checked = certTypes.has(t);
                const style = TYPE_STYLE[t];
                return (
                  <label key={t} onClick={()=>setCertTypes(prev=>{const n=new Set(prev);n.has(t)?n.delete(t):n.add(t);return n;})}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:10,cursor:'pointer',border:`1px solid ${checked?style.color+'55':'rgba(255,255,255,0.08)'}`,background:checked?style.background:'transparent',transition:'all 0.15s'}}>
                    <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?style.color:'rgba(255,255,255,0.2)'}`,background:checked?style.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {checked && <span style={{color:'#fff',fontSize:10,fontWeight:900}}>✓</span>}
                    </div>
                    <span style={{color:checked?style.color:'#94a3b8',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>{t}</span>
                  </label>
                );
              })}
            </div>
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
            : students.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition hover:bg-white/05">
                <input type="checkbox" checked={selected.includes(s.id)}
                  onChange={e => setSelected(prev =>
                    e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id)
                  )}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs" style={{color:"#64748b"}}>{s.careerId} · {s.email}</p>
                </div>
                {s.department && (
                  <span className="text-xs text-gray-400 shrink-0">{s.department}</span>
                )}
              </label>
            ))
          }
        </div>

        <div className="p-4 flex items-center justify-between" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <p className="text-xs" style={{color:"#64748b"}}>
            {selected.length > 0 && certTypes.size > 0 ? `${selected.length * certTypes.size} certificate${selected.length * certTypes.size > 1 ? 's' : ''} will be issued (${selected.length} students × ${certTypes.size} types)` : 'Select students and certificate types'}
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
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const LIMIT = 15;

  const load = () => {
    setLoading(true);
    institutionApi.getCertificates({ page, limit: LIMIT })
      .then(r => { setCerts(r.data); setTotal(r.total); })
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page]);

  const downloadPdf = (cert: InstitutionCertificate) => {
    window.open(institutionApi.downloadCertPdf(cert.certificateId), '_blank');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Certificate Management</h1>
          <p className="text-sm" style={{color:"#64748b"}}>{total} certificates issued</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Issue Certificates
        </button>
      </div>

      <div className="rounded-xl overflow-x-auto" style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))",border:"1px solid rgba(255,255,255,0.1)"}}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide" style={{color:"#475569",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <th className="px-4 py-3">Certificate ID</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Career ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">PDF</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-12" style={{color:"#475569"}}>Loading...</td></tr>
              : certs.length === 0
              ? <tr><td colSpan={8} className="text-center py-12" style={{color:"#475569"}}>No certificates issued yet</td></tr>
              : certs.map(c => (
                <tr key={c.id} className="transition" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{background:"rgba(99,102,241,0.15)",color:"#818cf8"}}>{c.certificateId}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{c.studentName}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{color:"#64748b"}}>{c.student?.careerId || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium"}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{color:"#64748b"}}>{c.courseName || '—'}</td>
                  <td className="px-4 py-3" style={{color:"#64748b"}}>{new Date(c.issuedAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    {c.isValid
                      ? <span className="flex items-center gap-1 text-xs font-medium" style={{color:"#34d399"}}><CheckCircle2 size={13} /> Valid</span>
                      : <span className="text-xs" style={{color:"#f87171"}}>Revoked</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => downloadPdf(c)}
                      className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition" title="Download PDF">
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm" style={{color:"#64748b"}}>
          <span>Showing {Math.min((page-1)*LIMIT+1, total)}–{Math.min(page*LIMIT, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)}
              className="p-1.5 rounded disabled:opacity-40 hover:bg-white/10 text-gray-400 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}><ChevronLeft size={16} /></button>
            <button disabled={page*LIMIT>=total} onClick={() => setPage(p=>p+1)}
              className="p-1.5 rounded disabled:opacity-40 hover:bg-white/10 text-gray-400 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {modal && <IssueCertModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}