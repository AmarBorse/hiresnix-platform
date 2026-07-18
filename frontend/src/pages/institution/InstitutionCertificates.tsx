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
  const [certs, setCerts]     = useState<InstitutionCertificate[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchStudentsMap, setBatchStudentsMap] = useState<Record<number,any[]>>({});
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const load = () => {
    setLoading(true);
    Promise.all([
      institutionApi.getCertificates({ page: 1, limit: 500 }),
      institutionApi.getBatches(),
    ]).then(async ([certsRes, batchesRes]) => {
      setCerts(certsRes.data || []);
      setTotal(certsRes.total || 0);
      const bList = batchesRes.data || [];
      setBatches(bList);
      // Fetch students for each batch
      const map: Record<number,any[]> = {};
      await Promise.all(bList.map(async (b: any) => {
        try {
          const r = await institutionApi.getBatchStudents(b.id);
          map[b.id] = r.data || [];
        } catch { map[b.id] = []; }
      }));
      setBatchStudentsMap(map);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const downloadPdf = (cert: InstitutionCertificate) => {
    window.open(institutionApi.downloadCertPdf(cert.certificateId), '_blank');
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const certsByStudent = certs.reduce((acc: Record<number,any>, c) => {
    if (!acc[c.studentId]) acc[c.studentId] = { name: c.studentName, careerId: c.student?.careerId || '—', certs: [] };
    acc[c.studentId].certs.push(c);
    return acc;
  }, {});

  const allBatchStudentIds = new Set(
    Object.values(batchStudentsMap).flat().map((s:any) => Number(s.id))
  );
  const noBatchStudents = Object.entries(certsByStudent).filter(
    ([sid]) => !allBatchStudentIds.has(Number(sid))
  );

  const StudentRow = ({ s }: { s: any }) => {
    const skill    = s.certs.find((c:any)=>c.type==='Skill Assessment');
    const course   = s.certs.find((c:any)=>c.type==='Course Completion');
    const training = s.certs.find((c:any)=>c.type==='Training Completion');
    return (
      <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr',padding:'10px 18px',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,0.04)'}}
        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.03)')}
        onMouseLeave={e=>(e.currentTarget.style.background='')}>
        <div style={{color:'#fff',fontSize:13,fontWeight:600}}>{s.name}</div>
        <div style={{color:'#6366f1',fontSize:11,fontFamily:'monospace'}}>{s.careerId}</div>
        <div style={{textAlign:'center'}}>{skill?<button onClick={()=>downloadPdf(skill)} style={{background:'none',border:'none',cursor:'pointer'}}><CheckCircle2 size={18} style={{color:'#c084fc'}}/></button>:<span style={{color:'#334155'}}>—</span>}</div>
        <div style={{textAlign:'center'}}>{course?<button onClick={()=>downloadPdf(course)} style={{background:'none',border:'none',cursor:'pointer'}}><CheckCircle2 size={18} style={{color:'#34d399'}}/></button>:<span style={{color:'#334155'}}>—</span>}</div>
        <div style={{textAlign:'center'}}>{training?<button onClick={()=>downloadPdf(training)} style={{background:'none',border:'none',cursor:'pointer'}}><CheckCircle2 size={18} style={{color:'#60a5fa'}}/></button>:<span style={{color:'#334155'}}>—</span>}</div>
        <div style={{display:'flex',justifyContent:'center',gap:4}}>
          {s.certs.map((c:any)=>(
            <button key={c.id} onClick={()=>downloadPdf(c)} title={c.type}
              style={{padding:'4px',borderRadius:6,border:'none',background:'rgba(99,102,241,0.1)',color:'#818cf8',cursor:'pointer'}}>
              <Download size={13}/>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const TableHeader = () => (
    <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr',padding:'8px 18px',color:'#475569',fontSize:11,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.05em',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
      <div>Student</div><div>Career ID</div>
      <div style={{textAlign:'center' as const}}>Skill</div>
      <div style={{textAlign:'center' as const}}>Course</div>
      <div style={{textAlign:'center' as const}}>Training</div>
      <div style={{textAlign:'center' as const}}>Downloads</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Certificate Management</h1>
          <p className="text-sm" style={{color:"#64748b"}}>{batches.length} batches · {total} certificates issued</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Issue Certificates
        </button>
      </div>

      {loading
        ? <div className="text-center py-12" style={{color:'#475569'}}>Loading...</div>
        : <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
          {batches.map((batch:any) => {
            const bStudents = (batchStudentsMap[batch.id] || [])
              .map((s:any) => certsByStudent[s.id]).filter(Boolean);
            const certCount = bStudents.reduce((a:number,s:any)=>a+s.certs.length,0);
            const isOpen = expanded.has(batch.id);
            return (
              <div key={batch.id} style={{backdropFilter:'blur(20px)',background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))',border:'1px solid rgba(99,102,241,0.25)',borderRadius:16,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.06)'}}>
                {/* Glass Card Header — Square */}
                <div onClick={()=>toggleExpand(batch.id)} style={{cursor:'pointer',padding:'28px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:14,minHeight:140,justifyContent:'center',position:'relative'}}>
                  {/* Expand arrow top right */}
                  <div style={{position:'absolute',top:14,right:14,width:26,height:26,borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b',fontSize:10}}>
                    {isOpen?'▲':'▼'}
                  </div>
                  {/* Icon */}
                  <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))',border:'1px solid rgba(99,102,241,0.3)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(99,102,241,0.25)'}}>
                    <Award size={24} style={{color:'#a5b4fc'}}/>
                  </div>
                  {/* Name */}
                  <p style={{color:'#fff',fontWeight:800,fontSize:17,margin:0,textAlign:'center',letterSpacing:'0.01em'}}>{batch.name}</p>
                  {/* Badges */}
                  <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                    <span style={{background:'rgba(99,102,241,0.15)',color:'#a5b4fc',fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:8}}>{bStudents.length} students</span>
                    <span style={{background:'rgba(16,185,129,0.12)',color:'#34d399',fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:8}}>{certCount} certs</span>
                  </div>
                  {/* Bottom shine */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.4),rgba(139,92,246,0.4),transparent)'}}/>
                </div>
                {isOpen && (
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                    {bStudents.length===0
                      ? <div style={{padding:'16px 18px',color:'#334155',fontSize:12}}>No certificates issued for this batch yet</div>
                      : <><TableHeader/>{bStudents.map((s:any,i:number)=><StudentRow key={i} s={s}/>)}</>
                    }
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Expanded students shown below grid */}
          {batches.filter((b:any)=>expanded.has(b.id)).map((batch:any)=>{
            const bStudents = (batchStudentsMap[batch.id]||[]).map((s:any)=>certsByStudent[s.id]).filter(Boolean);
            if(!bStudents.length) return null;
            return (
              <div key={`exp-${batch.id}`} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:14,overflow:'hidden',marginTop:8}}>
                <div style={{padding:'10px 18px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:8}}>
                  <Award size={13} style={{color:'#818cf8'}}/> 
                  <span style={{color:'#a5b4fc',fontSize:12,fontWeight:700}}>{batch.name}</span>
                </div>
                <TableHeader/>
                {bStudents.map((s:any,i:number)=><StudentRow key={i} s={s}/>)}
              </div>
            );
          })}

          {noBatchStudents.length>0 && (
            <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,overflow:'hidden'}}>
              <div style={{padding:'12px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <p style={{color:'#64748b',fontWeight:700,fontSize:12,margin:0,textTransform:'uppercase',letterSpacing:'0.05em'}}>No Batch Assigned</p>
              </div>
              <TableHeader/>
              {noBatchStudents.map(([sid,s]:any)=><StudentRow key={sid} s={s}/>)}
            </div>
          )}
        </>
      }

      {modal && <IssueCertModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}