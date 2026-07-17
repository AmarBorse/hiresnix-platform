import React, { useState } from 'react';
import { FileText, Download, ChevronDown, Loader2 } from 'lucide-react';
import client from '../../api/client';

type DocType = 'appointment' | 'joining' | 'stipend';

const DOCS = [
  { id: 'appointment' as DocType, label: 'Appointment Letter', icon: '📋', desc: 'Full-time or Internship appointment' },
  { id: 'joining'     as DocType, label: 'Joining Letter',     icon: '🤝', desc: 'Confirmation of joining with document checklist' },
  { id: 'stipend'     as DocType, label: 'Stipend Slip',       icon: '💰', desc: 'Monthly stipend / salary slip' },
];

const inputCls = 'w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition';
const labelCls = 'block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide';

export function AdminDocuments() {
  const [active, setActive] = useState<DocType>('appointment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Appointment fields
  const [apt, setApt] = useState({
    candidateName: '', designation: '', department: '', employmentType: 'internship',
    startDate: '', endDate: '', stipend: '', ctc: '', location: 'Shirpur, Maharashtra / Remote',
    reportingManager: 'Mr. A.S. Borse (Founder & CEO)',
    workingHours: '9:00 AM – 6:00 PM', workingDays: 'Monday to Saturday',
    probationPeriod: '3 months', noticePeriod: '30 days',
  });

  // Joining fields
  const [jl, setJl] = useState({
    candidateName: '', designation: '', department: '', employmentType: 'internship',
    joiningDate: '', stipend: '', ctc: '',
    location: 'Shirpur, Maharashtra / Remote',
    reportingManager: 'Mr. A.S. Borse (Founder & CEO)',
  });

  // Stipend fields
  const [ss, setSs] = useState({
    candidateName: '', designation: '', department: '', employeeId: '',
    month: '', year: new Date().getFullYear().toString(),
    basicStipend: '', allowances: '0', deductions: '0',
  });

  const download = async (endpoint: string, body: object, filename: string) => {
    setLoading(true); setError('');
    try {
      const res = await client.post(endpoint, body, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to generate document');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080d16', padding: '24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>📄 Document Generator</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Admin-only • Generate official HR documents as PDF</p>
        </div>

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {DOCS.map(d => (
            <button key={d.id} onClick={() => { setActive(d.id); setError(''); }}
              style={{
                flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: active === d.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
                background: active === d.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s',
              }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{d.icon}</div>
              <div style={{ color: active === d.id ? '#60a5fa' : '#94a3b8', fontWeight: 700, fontSize: 13 }}>{d.label}</div>
              <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{d.desc}</div>
            </button>
          ))}
        </div>

        {/* Form card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>

          {/* ── APPOINTMENT LETTER ── */}
          {active === 'appointment' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📋 Appointment Letter</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label className={labelCls}>Candidate Name *</label>
                  <input className={inputCls} placeholder="Full name" value={apt.candidateName} onChange={e=>setApt(p=>({...p,candidateName:e.target.value}))} /></div>
                <div><label className={labelCls}>Designation *</label>
                  <input className={inputCls} placeholder="e.g. Python Developer Intern" value={apt.designation} onChange={e=>setApt(p=>({...p,designation:e.target.value}))} /></div>
                <div><label className={labelCls}>Department</label>
                  <input className={inputCls} placeholder="Technology" value={apt.department} onChange={e=>setApt(p=>({...p,department:e.target.value}))} /></div>
                <div><label className={labelCls}>Employment Type *</label>
                  <select className={inputCls} value={apt.employmentType} onChange={e=>setApt(p=>({...p,employmentType:e.target.value}))}>
                    <option value="internship">Internship</option>
                    <option value="fulltime">Full-Time</option>
                  </select></div>
                <div><label className={labelCls}>Start Date *</label>
                  <input className={inputCls} type="date" value={apt.startDate} onChange={e=>setApt(p=>({...p,startDate:e.target.value}))} /></div>
                {apt.employmentType === 'internship'
                  ? <div><label className={labelCls}>End Date</label>
                      <input className={inputCls} type="date" value={apt.endDate} onChange={e=>setApt(p=>({...p,endDate:e.target.value}))} /></div>
                  : <div><label className={labelCls}>Annual CTC (₹)</label>
                      <input className={inputCls} placeholder="e.g. 300000" value={apt.ctc} onChange={e=>setApt(p=>({...p,ctc:e.target.value}))} /></div>
                }
                {apt.employmentType === 'internship' && (
                  <div><label className={labelCls}>Monthly Stipend (₹)</label>
                    <input className={inputCls} placeholder="e.g. 5000" value={apt.stipend} onChange={e=>setApt(p=>({...p,stipend:e.target.value}))} /></div>
                )}
                <div><label className={labelCls}>Location</label>
                  <input className={inputCls} value={apt.location} onChange={e=>setApt(p=>({...p,location:e.target.value}))} /></div>
                <div><label className={labelCls}>Reporting Manager</label>
                  <input className={inputCls} value={apt.reportingManager} onChange={e=>setApt(p=>({...p,reportingManager:e.target.value}))} /></div>
                <div><label className={labelCls}>Working Hours</label>
                  <input className={inputCls} value={apt.workingHours} onChange={e=>setApt(p=>({...p,workingHours:e.target.value}))} /></div>
                <div><label className={labelCls}>Working Days</label>
                  <input className={inputCls} value={apt.workingDays} onChange={e=>setApt(p=>({...p,workingDays:e.target.value}))} /></div>
                {apt.employmentType === 'fulltime' && <>
                  <div><label className={labelCls}>Probation Period</label>
                    <input className={inputCls} value={apt.probationPeriod} onChange={e=>setApt(p=>({...p,probationPeriod:e.target.value}))} /></div>
                  <div><label className={labelCls}>Notice Period</label>
                    <input className={inputCls} value={apt.noticePeriod} onChange={e=>setApt(p=>({...p,noticePeriod:e.target.value}))} /></div>
                </>}
              </div>
              <button disabled={loading} onClick={()=>download('/iplatform/generate-appointment', apt, `Appointment_Letter_${apt.candidateName||'candidate'}.pdf`)}
                style={{ marginTop:22, width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                {loading ? 'Generating...' : 'Generate & Download PDF'}
              </button>
            </div>
          )}

          {/* ── JOINING LETTER ── */}
          {active === 'joining' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🤝 Joining Letter</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label className={labelCls}>Candidate Name *</label>
                  <input className={inputCls} placeholder="Full name" value={jl.candidateName} onChange={e=>setJl(p=>({...p,candidateName:e.target.value}))} /></div>
                <div><label className={labelCls}>Designation *</label>
                  <input className={inputCls} placeholder="e.g. Frontend Developer" value={jl.designation} onChange={e=>setJl(p=>({...p,designation:e.target.value}))} /></div>
                <div><label className={labelCls}>Department</label>
                  <input className={inputCls} placeholder="Technology" value={jl.department} onChange={e=>setJl(p=>({...p,department:e.target.value}))} /></div>
                <div><label className={labelCls}>Employment Type</label>
                  <select className={inputCls} value={jl.employmentType} onChange={e=>setJl(p=>({...p,employmentType:e.target.value}))}>
                    <option value="internship">Internship</option>
                    <option value="fulltime">Full-Time</option>
                  </select></div>
                <div><label className={labelCls}>Date of Joining *</label>
                  <input className={inputCls} type="date" value={jl.joiningDate} onChange={e=>setJl(p=>({...p,joiningDate:e.target.value}))} /></div>
                <div><label className={labelCls}>{jl.employmentType === 'internship' ? 'Monthly Stipend (₹)' : 'Annual CTC (₹)'}</label>
                  <input className={inputCls} placeholder="e.g. 5000" value={jl.employmentType==='internship'?jl.stipend:jl.ctc}
                    onChange={e=>setJl(p=>jl.employmentType==='internship'?{...p,stipend:e.target.value}:{...p,ctc:e.target.value})} /></div>
                <div><label className={labelCls}>Location</label>
                  <input className={inputCls} value={jl.location} onChange={e=>setJl(p=>({...p,location:e.target.value}))} /></div>
                <div><label className={labelCls}>Reporting Manager</label>
                  <input className={inputCls} value={jl.reportingManager} onChange={e=>setJl(p=>({...p,reportingManager:e.target.value}))} /></div>
              </div>
              <button disabled={loading} onClick={()=>download('/iplatform/generate-joining', jl, `Joining_Letter_${jl.candidateName||'candidate'}.pdf`)}
                style={{ marginTop:22, width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                {loading ? 'Generating...' : 'Generate & Download PDF'}
              </button>
            </div>
          )}

          {/* ── STIPEND SLIP ── */}
          {active === 'stipend' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>💰 Stipend Slip</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label className={labelCls}>Candidate Name *</label>
                  <input className={inputCls} placeholder="Full name" value={ss.candidateName} onChange={e=>setSs(p=>({...p,candidateName:e.target.value}))} /></div>
                <div><label className={labelCls}>Designation</label>
                  <input className={inputCls} placeholder="e.g. Intern" value={ss.designation} onChange={e=>setSs(p=>({...p,designation:e.target.value}))} /></div>
                <div><label className={labelCls}>Department</label>
                  <input className={inputCls} placeholder="Technology" value={ss.department} onChange={e=>setSs(p=>({...p,department:e.target.value}))} /></div>
                <div><label className={labelCls}>Employee / Intern ID</label>
                  <input className={inputCls} placeholder="e.g. HX-2026-000005" value={ss.employeeId} onChange={e=>setSs(p=>({...p,employeeId:e.target.value}))} /></div>
                <div><label className={labelCls}>Month *</label>
                  <select className={inputCls} value={ss.month} onChange={e=>setSs(p=>({...p,month:e.target.value}))}>
                    <option value="">Select Month</option>
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m,i)=>(
                      <option key={m} value={m}>{new Date(2000,i,1).toLocaleString('en-IN',{month:'long'})}</option>
                    ))}
                  </select></div>
                <div><label className={labelCls}>Year *</label>
                  <input className={inputCls} placeholder="2026" value={ss.year} onChange={e=>setSs(p=>({...p,year:e.target.value}))} /></div>
                <div><label className={labelCls}>Basic Stipend (₹) *</label>
                  <input className={inputCls} placeholder="e.g. 5000" value={ss.basicStipend} onChange={e=>setSs(p=>({...p,basicStipend:e.target.value}))} /></div>
                <div><label className={labelCls}>Allowances (₹)</label>
                  <input className={inputCls} placeholder="0" value={ss.allowances} onChange={e=>setSs(p=>({...p,allowances:e.target.value}))} /></div>
                <div><label className={labelCls}>Deductions / TDS (₹)</label>
                  <input className={inputCls} placeholder="0" value={ss.deductions} onChange={e=>setSs(p=>({...p,deductions:e.target.value}))} /></div>

                {/* Live preview */}
                {ss.basicStipend && (
                  <div style={{ background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:10, padding:12 }}>
                    <div style={{ color:'#94a3b8', fontSize:11, marginBottom:6, fontWeight:700 }}>PREVIEW</div>
                    <div style={{ color:'#cbd5e1', fontSize:11 }}>Gross: ₹{(Number(ss.basicStipend||0)+Number(ss.allowances||0)).toLocaleString('en-IN')}</div>
                    <div style={{ color:'#f87171', fontSize:11 }}>Deductions: ₹{Number(ss.deductions||0).toLocaleString('en-IN')}</div>
                    <div style={{ color:'#4ade80', fontSize:13, fontWeight:800, marginTop:4 }}>
                      Net Pay: ₹{(Number(ss.basicStipend||0)+Number(ss.allowances||0)-Number(ss.deductions||0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
              <button disabled={loading} onClick={()=>download('/iplatform/generate-stipend', ss, `Stipend_Slip_${ss.candidateName||'candidate'}_${ss.month}_${ss.year}.pdf`)}
                style={{ marginTop:22, width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                {loading ? 'Generating...' : 'Generate & Download PDF'}
              </button>
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
