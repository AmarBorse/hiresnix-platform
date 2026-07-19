import React, { useState, useEffect } from 'react';
import { Download, Loader2, Search, User, Lock, Eye, RefreshCw } from 'lucide-react';
import client from '../../api/client';

type DocType = 'appointment' | 'joining' | 'stipend';

const DOCS = [
  { id: 'appointment' as DocType, label: 'Appointment Letter', icon: '📋', desc: 'Full-time or Internship appointment' },
  { id: 'joining'     as DocType, label: 'Joining Letter',     icon: '🤝', desc: 'Confirmation of joining with document checklist' },
  { id: 'stipend'     as DocType, label: 'Stipend Slip',       icon: '💰', desc: 'Monthly stipend / salary slip' },
];

const inputCls = 'w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition';
const lockedInputCls = 'w-full bg-[#0a0f1a] border border-white/5 rounded-lg px-3 py-2 text-slate-400 text-sm cursor-not-allowed';
const labelCls = 'block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide';

const STORAGE_KEY = 'hx_admin_docs_locked';

function getLockedDocs(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function setLockedDoc(key: string, data: any) {
  const all = getLockedDocs();
  all[key] = { ...data, lockedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function clearLockedDoc(key: string) {
  const all = getLockedDocs();
  delete all[key];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// Lock key per candidate+type
function lockKey(type: string, candidateName: string, extra?: string) {
  return `${type}__${candidateName.trim().toLowerCase().replace(/\s+/g,'_')}${extra ? '__' + extra : ''}`;
}

export function AdminDocuments() {
  const [active, setActive]   = useState<DocType>('appointment');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch]   = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [lockedDocs, setLockedDocs] = useState<Record<string,any>>(getLockedDocs());

  const refreshLocked = () => setLockedDocs(getLockedDocs());

  // Appointment fields
  const [apt, setApt] = useState({
    candidateName:'', designation:'', department:'', employmentType:'internship',
    startDate:'', endDate:'', stipend:'', ctc:'',
    location:'Shirpur, Maharashtra / Remote',
    reportingManager:'Mr. Jayesh Badgujar',
    workingHours:'9:00 AM – 6:00 PM', workingDays:'Monday to Saturday',
    probationPeriod:'3 months', noticePeriod:'30 days',
  });

  // Joining fields
  const [jl, setJl] = useState({
    candidateName:'', designation:'', department:'', employmentType:'internship',
    joiningDate:'', stipend:'', ctc:'',
    location:'Shirpur, Maharashtra / Remote',
    reportingManager:'Mr. Jayesh Badgujar',
  });

  // Stipend fields
  const [ss, setSs] = useState({
    candidateName:'', designation:'', department:'', employeeId:'',
    month: String(new Date().getMonth() + 1).padStart(2,'0'),
    year: String(new Date().getFullYear()),
    basicStipend:'', allowances:'0', deductions:'0',
  });

  useEffect(() => {
    client.get('/iplatform/enrolled-students')
      .then((r: any) => setStudents(r.data.data || []))
      .catch(() => {});
  }, []);

  const filteredStudents = students.filter(s =>
    !search || s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    s.domain?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const domainToDept: Record<string,string> = {
    'frontend development': 'Software Development',
    'backend development': 'Software Development',
    'full stack development': 'Software Development',
    'python development': 'Software Development',
    'javascript development': 'Software Development',
    'java development': 'Software Development',
    'android development': 'Mobile Application Development',
    'flutter development': 'Mobile Application Development',
    'ios development': 'Mobile Application Development',
    'data science': 'Data Science & Analytics',
    'machine learning': 'Artificial Intelligence & ML',
    'artificial intelligence': 'Artificial Intelligence & ML',
    'data analytics': 'Data Science & Analytics',
    'ui/ux design': 'Design & User Experience',
    'graphic design': 'Design & User Experience',
    'digital marketing': 'Digital Marketing',
    'social media marketing': 'Digital Marketing',
    'content writing': 'Content & Communications',
    'devops': 'DevOps & Infrastructure',
    'cloud computing': 'DevOps & Infrastructure',
    'cybersecurity': 'Information Security',
    'ethical hacking': 'Information Security',
    'database management': 'Database Administration',
    'sql': 'Database Administration',
    'business development': 'Business Development',
    'hr management': 'Human Resources',
  };

  const autoFill = (enrollment: any) => {
    const name = enrollment.studentName || '';
    const domain = enrollment.domain?.name || 'Intern';
    const dept = domainToDept[domain.toLowerCase()] || domain.split(' ').map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
    const start = enrollment.startDate ? enrollment.startDate.split('T')[0] : '';
    const stipendAmt = String(enrollment.stipend || '').replace(/[^\d.]/g, '').trim();
    const designation = `${domain} Intern`;

    let end = '';
    if (start && enrollment.domain?.duration) {
      const dur = enrollment.domain.duration.toLowerCase().trim();
      const num = parseInt(dur);
      let totalMonths = 0;
      if (dur.includes('month')) totalMonths = num;
      else if (dur.includes('week')) totalMonths = Math.round(num / 4.33);
      else if (dur.includes('year')) totalMonths = num * 12;
      if (totalMonths > 0) {
        const endDate = new Date(start);
        endDate.setMonth(endDate.getMonth() + totalMonths);
        end = endDate.toISOString().split('T')[0];
      }
    }

    setApt(p => ({ ...p, candidateName: name, designation, department: dept, startDate: start, endDate: end, stipend: stipendAmt, employmentType: 'internship' }));
    setJl(p => ({ ...p, candidateName: name, designation, department: dept, joiningDate: start, stipend: stipendAmt, employmentType: 'internship' }));
    setSs(p => ({ ...p, candidateName: name, designation, department: dept, basicStipend: stipendAmt, employeeId: `HX-INT-${new Date().getFullYear()}-${String(enrollment.id).padStart(4,'0')}` }));
    setSearch(name);
    setShowDropdown(false);
  };

  const download = async (endpoint: string, body: object, filename: string, lockKeyStr?: string, lockData?: any) => {
    setLoading(true); setError('');
    try {
      const res = await client.post(endpoint, body, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      // Open in new tab for display
      window.open(url, '_blank');
      // Also trigger download
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      // Lock it
      if (lockKeyStr && lockData) {
        setLockedDoc(lockKeyStr, lockData);
        refreshLocked();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to generate document');
    } finally { setLoading(false); }
  };

  // Locked info display
  const LockedBanner = ({ lkey, onUnlock }: { lkey: string; onUnlock: () => void }) => {
    const doc = lockedDocs[lkey];
    if (!doc) return null;
    const lockedAt = doc.lockedAt ? new Date(doc.lockedAt).toLocaleString('en-IN') : '';
    return (
      <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(234,179,8,0.08)', border:'1px solid rgba(234,179,8,0.25)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Lock size={14} style={{ color:'#eab308' }}/>
          <div>
            <div style={{ color:'#eab308', fontSize:12, fontWeight:700 }}>Document Locked</div>
            <div style={{ color:'#64748b', fontSize:11 }}>Generated on {lockedAt}</div>
          </div>
        </div>
        <button onClick={onUnlock}
          style={{ padding:'6px 12px', borderRadius:8, border:'1px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.08)', color:'#f87171', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
          <RefreshCw size={11}/> Unlock & Re-generate
        </button>
      </div>
    );
  };

  const DownloadBtn = ({ onClick, label, locked }: { onClick: () => void; label: string; locked?: boolean }) => (
    <button disabled={loading || locked} onClick={onClick}
      style={{ marginTop:22, width:'100%', padding:'12px', borderRadius:10, border:'none',
        background: locked ? 'rgba(100,116,139,0.2)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
        color: locked ? '#475569' : '#fff', fontWeight:700, fontSize:14,
        cursor: locked ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
      {locked ? <Lock size={16}/> : loading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
      {locked ? 'Document Already Generated (Locked)' : loading ? 'Generating...' : label}
    </button>
  );

  // Lock keys
  const aptKey = apt.candidateName ? lockKey('apt', apt.candidateName, apt.startDate) : '';
  const jlKey  = jl.candidateName  ? lockKey('jl',  jl.candidateName,  jl.joiningDate) : '';
  const ssKey  = ss.candidateName  ? lockKey('ss',  ss.candidateName,  `${ss.month}_${ss.year}`) : '';

  const aptLocked = !!aptKey && !!lockedDocs[aptKey];
  const jlLocked  = !!jlKey  && !!lockedDocs[jlKey];
  const ssLocked  = !!ssKey  && !!lockedDocs[ssKey];

  return (
    <div style={{ minHeight:'100vh', background:'#080d16', padding:'24px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:800, margin:0 }}>📄 Document Generator</h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Admin-only • Documents lock after first generation</p>
        </div>

        {/* Student Search */}
        <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:12, padding:'16px 18px', marginBottom:24, position:'relative' }}>
          <label className={labelCls} style={{ color:'#60a5fa' }}>🔍 Search & Auto-fill from Internship Portal</label>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#475569' }}/>
            <input className={inputCls} style={{ paddingLeft:32 }}
              placeholder="Search student name or domain..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
            />
          </div>
          {showDropdown && filteredStudents.length > 0 && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, marginTop:4, maxHeight:200, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
              {filteredStudents.slice(0,8).map((s:any,i:number) => (
                <div key={i} onClick={() => autoFill(s)}
                  style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:10 }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(59,130,246,0.1)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  <User size={14} style={{ color:'#60a5fa' }}/>
                  <div>
                    <div style={{ color:'#fff', fontSize:13, fontWeight:600 }}>{s.studentName}</div>
                    <div style={{ color:'#64748b', fontSize:11 }}>{s.domain?.name} • {s.startDate?.split('T')[0]} {s.stipend ? `• ₹${s.stipend}/mo` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:10, marginBottom:24 }}>
          {DOCS.map(d => (
            <button key={d.id} onClick={() => { setActive(d.id); setError(''); }}
              style={{ flex:1, padding:'14px 12px', borderRadius:12, cursor:'pointer', textAlign:'left', border:`1px solid ${active===d.id?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.07)'}`, background:active===d.id?'rgba(59,130,246,0.12)':'rgba(255,255,255,0.03)', transition:'all 0.2s' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{d.icon}</div>
              <div style={{ color:active===d.id?'#60a5fa':'#94a3b8', fontWeight:700, fontSize:13 }}>{d.label}</div>
              <div style={{ color:'#475569', fontSize:11, marginTop:2 }}>{d.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:28 }}>

          {/* APPOINTMENT LETTER */}
          {active === 'appointment' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>📋 Appointment Letter</h2>
                {aptLocked && <span style={{ background:'rgba(234,179,8,0.15)', color:'#eab308', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}><Lock size={10}/> LOCKED</span>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {(['candidateName','designation','department'] as const).map(f => (
                  <div key={f}>
                    <label className={labelCls}>{f === 'candidateName' ? 'Candidate Name *' : f === 'designation' ? 'Designation *' : 'Department'}</label>
                    <input className={aptLocked ? lockedInputCls : inputCls} disabled={aptLocked}
                      value={apt[f]} onChange={e=>setApt(p=>({...p,[f]:e.target.value}))}/>
                  </div>
                ))}
                <div><label className={labelCls}>Employment Type *</label>
                  <select className={aptLocked ? lockedInputCls : inputCls} disabled={aptLocked} value={apt.employmentType} onChange={e=>setApt(p=>({...p,employmentType:e.target.value}))}>
                    <option value="internship">Internship</option>
                    <option value="fulltime">Full-Time</option>
                  </select></div>
                <div><label className={labelCls}>Start Date *</label>
                  <input className={aptLocked ? lockedInputCls : inputCls} type="date" disabled={aptLocked} value={apt.startDate} onChange={e=>setApt(p=>({...p,startDate:e.target.value}))}/></div>
                {apt.employmentType==='internship'
                  ? <div><label className={labelCls}>End Date</label>
                      <input className={aptLocked ? lockedInputCls : inputCls} type="date" disabled={aptLocked} value={apt.endDate} onChange={e=>setApt(p=>({...p,endDate:e.target.value}))}/></div>
                  : <div><label className={labelCls}>Annual CTC (₹)</label>
                      <input className={aptLocked ? lockedInputCls : inputCls} disabled={aptLocked} value={apt.ctc} onChange={e=>setApt(p=>({...p,ctc:e.target.value}))}/></div>
                }
                {apt.employmentType==='internship' && (
                  <div><label className={labelCls}>Monthly Stipend (₹)</label>
                    <input className={aptLocked ? lockedInputCls : inputCls} disabled={aptLocked} value={apt.stipend} onChange={e=>setApt(p=>({...p,stipend:e.target.value}))}/></div>
                )}
                <div><label className={labelCls}>Location</label>
                  <input className={aptLocked ? lockedInputCls : inputCls} disabled={aptLocked} value={apt.location} onChange={e=>setApt(p=>({...p,location:e.target.value}))}/></div>
                <div><label className={labelCls}>Reporting Manager</label>
                  <input className={aptLocked ? lockedInputCls : inputCls} disabled={aptLocked} value={apt.reportingManager} onChange={e=>setApt(p=>({...p,reportingManager:e.target.value}))}/></div>
                <div><label className={labelCls}>Working Hours</label>
                  <input className={aptLocked ? lockedInputCls : inputCls} disabled={aptLocked} value={apt.workingHours} onChange={e=>setApt(p=>({...p,workingHours:e.target.value}))}/></div>
                <div><label className={labelCls}>Working Days</label>
                  <input className={aptLocked ? lockedInputCls : inputCls} disabled={aptLocked} value={apt.workingDays} onChange={e=>setApt(p=>({...p,workingDays:e.target.value}))}/></div>
              </div>

              <DownloadBtn locked={aptLocked}
                onClick={() => download('/iplatform/generate-appointment', apt,
                  `Appointment_Letter_${apt.candidateName||'candidate'}.pdf`,
                  aptKey, apt)}
                label="Generate & Download PDF"/>

              {aptLocked && <LockedBanner lkey={aptKey} onUnlock={() => { clearLockedDoc(aptKey); refreshLocked(); }}/>}
            </div>
          )}

          {/* JOINING LETTER */}
          {active === 'joining' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>🤝 Joining Letter</h2>
                {jlLocked && <span style={{ background:'rgba(234,179,8,0.15)', color:'#eab308', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}><Lock size={10}/> LOCKED</span>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label className={labelCls}>Candidate Name *</label>
                  <input className={jlLocked ? lockedInputCls : inputCls} disabled={jlLocked} value={jl.candidateName} onChange={e=>setJl(p=>({...p,candidateName:e.target.value}))}/></div>
                <div><label className={labelCls}>Designation *</label>
                  <input className={jlLocked ? lockedInputCls : inputCls} disabled={jlLocked} value={jl.designation} onChange={e=>setJl(p=>({...p,designation:e.target.value}))}/></div>
                <div><label className={labelCls}>Department</label>
                  <input className={jlLocked ? lockedInputCls : inputCls} disabled={jlLocked} value={jl.department} onChange={e=>setJl(p=>({...p,department:e.target.value}))}/></div>
                <div><label className={labelCls}>Employment Type</label>
                  <select className={jlLocked ? lockedInputCls : inputCls} disabled={jlLocked} value={jl.employmentType} onChange={e=>setJl(p=>({...p,employmentType:e.target.value}))}>
                    <option value="internship">Internship</option>
                    <option value="fulltime">Full-Time</option>
                  </select></div>
                <div><label className={labelCls}>Date of Joining *</label>
                  <input className={jlLocked ? lockedInputCls : inputCls} type="date" disabled={jlLocked} value={jl.joiningDate} onChange={e=>setJl(p=>({...p,joiningDate:e.target.value}))}/></div>
                <div><label className={labelCls}>{jl.employmentType==='internship'?'Monthly Stipend (₹)':'Annual CTC (₹)'}</label>
                  <input className={jlLocked ? lockedInputCls : inputCls} disabled={jlLocked}
                    value={jl.employmentType==='internship'?jl.stipend:jl.ctc}
                    onChange={e=>setJl(p=>jl.employmentType==='internship'?{...p,stipend:e.target.value}:{...p,ctc:e.target.value})}/></div>
                <div><label className={labelCls}>Location</label>
                  <input className={jlLocked ? lockedInputCls : inputCls} disabled={jlLocked} value={jl.location} onChange={e=>setJl(p=>({...p,location:e.target.value}))}/></div>
                <div><label className={labelCls}>Reporting Manager</label>
                  <input className={jlLocked ? lockedInputCls : inputCls} disabled={jlLocked} value={jl.reportingManager} onChange={e=>setJl(p=>({...p,reportingManager:e.target.value}))}/></div>
              </div>

              <DownloadBtn locked={jlLocked}
                onClick={() => download('/iplatform/generate-joining', jl,
                  `Joining_Letter_${jl.candidateName||'candidate'}.pdf`,
                  jlKey, jl)}
                label="Generate & Download PDF"/>

              {jlLocked && <LockedBanner lkey={jlKey} onUnlock={() => { clearLockedDoc(jlKey); refreshLocked(); }}/>}
            </div>
          )}

          {/* STIPEND SLIP */}
          {active === 'stipend' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>💰 Stipend Slip</h2>
                {ssLocked && <span style={{ background:'rgba(234,179,8,0.15)', color:'#eab308', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}><Lock size={10}/> LOCKED</span>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label className={labelCls}>Candidate Name *</label>
                  <input className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.candidateName} onChange={e=>setSs(p=>({...p,candidateName:e.target.value}))}/></div>
                <div><label className={labelCls}>Designation</label>
                  <input className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.designation} onChange={e=>setSs(p=>({...p,designation:e.target.value}))}/></div>
                <div><label className={labelCls}>Department</label>
                  <input className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.department} onChange={e=>setSs(p=>({...p,department:e.target.value}))}/></div>
                <div><label className={labelCls}>Employee / Intern ID</label>
                  <input className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.employeeId} onChange={e=>setSs(p=>({...p,employeeId:e.target.value}))}/></div>
                <div><label className={labelCls}>Month *</label>
                  <select className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.month} onChange={e=>setSs(p=>({...p,month:e.target.value}))}>
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m,i)=>(
                      <option key={m} value={m}>{new Date(2000,i,1).toLocaleString('en-IN',{month:'long'})}</option>
                    ))}
                  </select></div>
                <div><label className={labelCls}>Year *</label>
                  <input className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.year} onChange={e=>setSs(p=>({...p,year:e.target.value}))}/></div>
                <div><label className={labelCls}>Basic Stipend (₹) *</label>
                  <input className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.basicStipend} onChange={e=>setSs(p=>({...p,basicStipend:e.target.value}))}/></div>
                <div><label className={labelCls}>Allowances (₹)</label>
                  <input className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.allowances} onChange={e=>setSs(p=>({...p,allowances:e.target.value}))}/></div>
                <div><label className={labelCls}>Deductions / TDS (₹)</label>
                  <input className={ssLocked ? lockedInputCls : inputCls} disabled={ssLocked} value={ss.deductions} onChange={e=>setSs(p=>({...p,deductions:e.target.value}))}/></div>
                {ss.basicStipend && (
                  <div style={{ background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:10, padding:12 }}>
                    <div style={{ color:'#94a3b8', fontSize:11, marginBottom:6, fontWeight:700 }}>PREVIEW</div>
                    <div style={{ color:'#cbd5e1', fontSize:11 }}>Gross: ₹{(Number(ss.basicStipend||0)+Number(ss.allowances||0)).toLocaleString('en-IN')}</div>
                    <div style={{ color:'#f87171', fontSize:11 }}>Deductions: ₹{Number(ss.deductions||0).toLocaleString('en-IN')}</div>
                    <div style={{ color: ssLocked ? '#475569' : '#4ade80', fontSize:13, fontWeight:800, marginTop:4 }}>
                      Net Pay: ₹{(Number(ss.basicStipend||0)+Number(ss.allowances||0)-Number(ss.deductions||0)).toLocaleString('en-IN')}
                      {ssLocked && <Lock size={12} style={{ marginLeft:6, display:'inline' }}/>}
                    </div>
                  </div>
                )}
              </div>

              <DownloadBtn locked={ssLocked}
                onClick={() => download('/iplatform/generate-stipend', ss,
                  `Stipend_Slip_${ss.candidateName||'candidate'}_${ss.month}_${ss.year}.pdf`,
                  ssKey, ss)}
                label="Generate & Download PDF"/>

              {ssLocked && <LockedBanner lkey={ssKey} onUnlock={() => { clearLockedDoc(ssKey); refreshLocked(); }}/>}
            </div>
          )}

          {error && (
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#f87171', fontSize:13 }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}