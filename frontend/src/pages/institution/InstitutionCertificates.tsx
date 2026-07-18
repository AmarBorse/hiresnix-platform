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

// ── Issue Modal ───────────────────────────────────────────────────
function IssueCertModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [students, setStudents] = useState<InstitutionStudent[]>([]);
  const [courses, setCourses]   = useState<InstituteCourse[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [certTypes, setCertTypes] = useState<Set<CertType>>(new Set(['Course Completion']));
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading]   = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      institutionApi.getStudents({ limit: 200 }),
      institutionApi.getCourses(),
    ]).then(([s, c]) => { setStudents(s.data); setCourses(c.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setDataLoading(false));
  }, []);

  const allSelected = students.length > 0 && selected.length === students.length;

  const handleSubmit = async () => {
    if (selected.length === 0) { toast.error('Select at least one student'); return; }
    if (certTypes.size === 0) { toast.error('Select at least one type'); return; }
    setLoading(true);
    let success = 0, failed = 0;
    for (const sid of selected) {
      for (const cType of certTypes) {
        try {
          await institutionApi.issueCertificate({ studentId: sid, courseId: courseId ? parseInt(courseId) : undefined, type: cType });
          success++;
        } catch { failed++; }
      }
    }
    if (success > 0) toast.success(`${success} certificates issued!`);
    if (failed > 0) toast.error(`${failed} failed`);
    onSaved(); setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <h2 className="font-semibold text-white">Issue Certificates</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="px-5 py-4 space-y-3" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div>
            <label className="block text-xs font-medium mb-2" style={{color:"#64748b"}}>Certificate Type *</label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {CERT_TYPES.map(t => {
                const checked = certTypes.has(t);
                const s = TYPE_STYLE[t];
                return (
                  <div key={t} onClick={()=>setCertTypes(prev=>{const n=new Set(prev);n.has(t)?n.delete(t):n.add(t);return n;})}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:10,cursor:'pointer',border:`1px solid ${checked?s.color+'55':'rgba(255,255,255,0.08)'}`,background:checked?s.background:'transparent',transition:'all 0.15s'}}>
                    <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?s.color:'rgba(255,255,255,0.2)'}`,background:checked?s.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {checked && <span style={{color:'#fff',fontSize:10,fontWeight:900}}>✓</span>}
                    </div>
                    <span style={{color:checked?s.color:'#94a3b8',fontSize:12,fontWeight:600}}>{t}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Course (optional)</label>
            <select value={courseId} onChange={e=>setCourseId(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              <option value="">No specific course</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="px-4 py-2.5 flex items-center justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)"}}>
          <button onClick={()=>allSelected?setSelected([]):setSelected(students.map(s=>s.id))} className="flex items-center gap-2 text-sm font-medium text-indigo-400">
            {allSelected?<CheckSquare size={18}/>:<Square size={18}/>}
            {allSelected?'Deselect All':'Select All'}
          </button>
          <span className="text-xs" style={{color:"#64748b"}}>{students.length} students · {selected.length} selected</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {dataLoading ? <div className="text-center py-8 text-gray-400">Loading...</div>
            : students.map(s=>(
              <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition hover:bg-white/05">
                <input type="checkbox" checked={selected.includes(s.id)}
                  onChange={e=>setSelected(prev=>e.target.checked?[...prev,s.id]:prev.filter(x=>x!==s.id))}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs" style={{color:"#64748b"}}>{s.careerId} · {s.email}</p>
                </div>
                {s.department && <span className="text-xs text-gray-400">{s.department}</span>}
              </label>
            ))
          }
        </div>

        <div className="p-4 flex items-center justify-between" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <p className="text-xs" style={{color:"#64748b"}}>
            {selected.length>0&&certTypes.size>0?`${selected.length*certTypes.size} certs (${selected.length}×${certTypes.size})`:'Select students & types'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/10" style={{border:"1px solid rgba(255,255,255,0.1)"}}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading||selected.length===0} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40">
              {loading?'Issuing...':`Issue${selected.length>0?` (${selected.length})`:''}` }
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
  const [total, setTotal]     = useState(0);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchStudentsMap, setBatchStudentsMap] = useState<Record<number,any[]>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

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
      const map: Record<number,any[]> = {};
      await Promise.all(bList.map(async (b: any) => {
        try { const r = await institutionApi.getBatchStudents(b.id); map[b.id] = r.data || []; }
        catch { map[b.id] = []; }
      }));
      setBatchStudentsMap(map);
      setExpanded(new Set(bList.map((b:any)=>b.id)));
    }).catch(()=>toast.error('Failed to load'))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const downloadPdf = (cert: InstitutionCertificate) => window.open(institutionApi.downloadCertPdf(cert.certificateId),'_blank');

  const toggle = (id: number) => setExpanded(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  const certsByStudent = certs.reduce((acc:Record<number,any>,c)=>{
    if(!acc[c.studentId]) acc[c.studentId]={name:c.studentName,careerId:c.student?.careerId||'—',certs:[]};
    acc[c.studentId].certs.push(c); return acc;
  },{});

  const allBatchStudentIds = new Set(Object.values(batchStudentsMap).flat().map((s:any)=>Number(s.id)));
  const noBatchStudents = Object.entries(certsByStudent).filter(([sid])=>!allBatchStudentIds.has(Number(sid)));

  const TableHeader = () => (
    <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr',padding:'8px 18px',color:'#475569',fontSize:11,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.05em',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
      <div>Student</div><div>Career ID</div>
      <div style={{textAlign:'center' as const}}>Skill</div>
      <div style={{textAlign:'center' as const}}>Course</div>
      <div style={{textAlign:'center' as const}}>Training</div>
      <div style={{textAlign:'center' as const}}>Downloads</div>
    </div>
  );

  const StudentRow = ({s}:{s:any}) => {
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Certificate Management</h1>
          <p className="text-sm" style={{color:"#64748b"}}>{batches.length} batches · {total} certificates issued</p>
        </div>
        <button onClick={()=>setModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15}/> Issue Certificates
        </button>
      </div>

      {loading
        ? <div className="text-center py-12" style={{color:'#475569'}}>Loading...</div>
        : <div className="space-y-4">
          {batches.map((batch:any)=>{
            const bStudents = (batchStudentsMap[batch.id]||[]).map((s:any)=>certsByStudent[s.id]).filter(Boolean);
            const certCount = bStudents.reduce((a:number,s:any)=>a+s.certs.length,0);
            const isOpen = expanded.has(batch.id);
            return (
              <div key={batch.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,overflow:'hidden'}}>
                <div onClick={()=>toggle(batch.id)} style={{padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:40,height:40,borderRadius:10,background:'rgba(99,102,241,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <Award size={18} style={{color:'#818cf8'}}/>
                    </div>
                    <div>
                      <p style={{color:'#fff',fontWeight:700,fontSize:14,margin:0}}>{batch.name}</p>
                      <div style={{display:'flex',gap:8,marginTop:3}}>
                        <span style={{background:'rgba(99,102,241,0.12)',color:'#a5b4fc',fontSize:11,fontWeight:600,padding:'1px 8px',borderRadius:6}}>{bStudents.length} students</span>
                        <span style={{background:'rgba(16,185,129,0.1)',color:'#34d399',fontSize:11,fontWeight:600,padding:'1px 8px',borderRadius:6}}>{certCount} certs</span>
                      </div>
                    </div>
                  </div>
                  <span style={{color:'#475569',fontSize:12}}>{isOpen?'▲':'▼'}</span>
                </div>
                {isOpen && (
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                    {bStudents.length===0
                      ? <div style={{padding:'14px 18px',color:'#334155',fontSize:12}}>No certificates issued for this batch yet</div>
                      : <><TableHeader/>{bStudents.map((s:any,i:number)=><StudentRow key={i} s={s}/>)}</>
                    }
                  </div>
                )}
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
        </div>
      }

      {modal && <IssueCertModal onClose={()=>setModal(false)} onSaved={()=>{setModal(false);load();}}/>}
    </div>
  );
}