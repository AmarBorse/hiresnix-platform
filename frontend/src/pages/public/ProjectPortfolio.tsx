// src/pages/public/ProjectPortfolio.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

const API = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

const CARD_BG = [
  'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.08))',
  'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(245,214,128,0.04))',
  'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.04))',
  'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(248,113,113,0.04))',
  'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(56,189,248,0.04))',
];

const EMOJIS: Record<string,string> = {
  'e-commerce':'🛒','shop':'🛒','ai':'🤖','ml':'🧠','chat':'💬',
  'dashboard':'📊','analytics':'📈','mobile':'📱','stock':'📈',
  'web':'🌐','portfolio':'💼','blog':'📝','game':'🎮',
  'auth':'🔐','api':'⚡','cloud':'☁️','social':'👥',
};
const getEmoji = (t: string) => {
  const l = t.toLowerCase();
  for (const [k,v] of Object.entries(EMOJIS)) if (l.includes(k)) return v;
  return '🚀';
};

export function ProjectPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/projects/u/${username}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div style={{background:'#030508',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:40,height:40,borderRadius:'50%',border:'2px solid #6366f1',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />
    </div>
  );

  if (notFound || !data) return (
    <div style={{background:'#030508',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif'}}>
      <div style={{fontSize:64,marginBottom:16}}>🔍</div>
      <h1 style={{color:'#fff',fontSize:24,fontWeight:800,marginBottom:8}}>Portfolio not found</h1>
      <p style={{color:'rgba(255,255,255,0.4)',marginBottom:24}}>No portfolio found for <strong style={{color:'#a5b4fc'}}>@{username}</strong></p>
      <a href="/" style={{padding:'12px 28px',borderRadius:12,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',textDecoration:'none',fontWeight:700,fontSize:14}}>Go to Hiresnix</a>
    </div>
  );

  const { user, student, projects } = data;
  const initials = user.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  const liveProjects = projects.filter((p:any)=>p.status==='live').length;
  const skills = student.skills ? (Array.isArray(student.skills) ? student.skills : student.skills.split(',')).map((s:string)=>s.trim()).filter(Boolean) : [];
  const firstName = user.name.split(' ')[0];

  return (
    <div style={{background:'#030508',minHeight:'100vh',color:'#fff',fontFamily:'Inter,sans-serif',overflowX:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .pcard{transition:all 0.3s!important}
        .pcard:hover{transform:translateY(-4px)!important;border-color:rgba(99,102,241,0.5)!important;box-shadow:0 20px 40px rgba(0,0,0,0.5),0 0 30px rgba(99,102,241,0.1)!important}
        .spill:hover{background:rgba(99,102,241,0.2)!important;color:#a5b4fc!important}
      `}</style>

      {/* Blobs */}
      <div style={{position:'fixed',top:-300,left:-200,width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)',pointerEvents:'none',zIndex:0}} />
      <div style={{position:'fixed',bottom:-200,right:-100,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,175,55,0.08) 0%,transparent 70%)',pointerEvents:'none',zIndex:0}} />

      {/* Nav */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 40px',borderBottom:'1px solid rgba(255,255,255,0.05)',position:'sticky',top:0,background:'rgba(3,5,8,0.9)',backdropFilter:'blur(20px)',zIndex:100}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#d4af37)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:'#fff'}}>H</div>
          <span style={{fontSize:15,fontWeight:800,color:'#fff',letterSpacing:-0.5}}>Hiresnix</span>
        </a>
        <a href="/auth" style={{fontSize:12,padding:'8px 18px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.5)',textDecoration:'none',fontWeight:600}}>Create yours →</a>
      </nav>

      {/* Hero */}
      <div style={{padding:'80px 40px 60px',position:'relative',zIndex:1,textAlign:'center',maxWidth:900,margin:'0 auto'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:12,padding:'6px 16px',borderRadius:20,border:'1px solid rgba(212,175,55,0.3)',background:'rgba(212,175,55,0.08)',color:'#d4af37',fontWeight:700,marginBottom:24,letterSpacing:'0.5px'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 8px rgba(34,197,94,0.8)'}} />
          Available for opportunities
        </div>
        <div style={{fontSize:'clamp(48px,8vw,80px)',fontWeight:900,letterSpacing:-3,lineHeight:1,marginBottom:16,background:'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.7))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{user.name}</div>
        <div style={{fontSize:'clamp(20px,3vw,28px)',fontWeight:800,letterSpacing:-1,marginBottom:20}}>
          <span style={{background:'linear-gradient(135deg,#6366f1,#d4af37)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{student.domain || 'Developer'}</span>
        </div>
        {student.bio && <div style={{fontSize:15,color:'rgba(255,255,255,0.45)',lineHeight:1.7,maxWidth:520,margin:'0 auto 32px'}}>{student.bio}</div>}
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:40}}>
          <a href={`mailto:${user.email}`} style={{padding:'14px 28px',borderRadius:12,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none',boxShadow:'0 4px 20px rgba(99,102,241,0.4)'}}>✉ Get in Touch</a>
          {student.githubUrl && <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" style={{padding:'14px 28px',borderRadius:12,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.6)',fontSize:14,fontWeight:600,textDecoration:'none',border:'1px solid rgba(255,255,255,0.1)'}}>⌥ GitHub</a>}
        </div>
        <div style={{display:'flex',gap:32,justifyContent:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,background:'linear-gradient(135deg,#d4af37,#f5d680)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{projects.length}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginTop:2}}>Projects</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:28,fontWeight:900,color:'#22c55e',textShadow:'0 0 20px rgba(34,197,94,0.6)'}}>{liveProjects}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginTop:2}}>Live</div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      {skills.length > 0 && (
        <div style={{padding:'24px 0',borderTop:'1px solid rgba(255,255,255,0.05)',borderBottom:'1px solid rgba(255,255,255,0.05)',overflow:'hidden',position:'relative',zIndex:1}}>
          <div style={{display:'flex',animation:'marquee 20s linear infinite',width:'max-content'}}>
            {[...skills,...skills,...skills,...skills].map((s:string,i:number)=>(
              <span key={i} style={{display:'inline-flex',alignItems:'center',gap:10,padding:'0 28px',fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.3)',whiteSpace:'nowrap'}}>
                {s} <span style={{width:4,height:4,borderRadius:'50%',background:'rgba(99,102,241,0.6)',display:'inline-block'}} />
              </span>
            ))}
          </div>
          <div style={{position:'absolute',top:0,bottom:0,left:0,width:100,background:'linear-gradient(90deg,#030508,transparent)',zIndex:2}} />
          <div style={{position:'absolute',top:0,bottom:0,right:0,width:100,background:'linear-gradient(-90deg,#030508,transparent)',zIndex:2}} />
        </div>
      )}

      {/* Profile Card */}
      <div style={{padding:'40px 40px 0',position:'relative',zIndex:1}}>
        <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:24,padding:32,position:'relative',overflow:'hidden',maxWidth:900,margin:'0 auto'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.8),rgba(212,175,55,0.6),transparent)'}} />
          <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap'}}>
            <div style={{position:'relative',flexShrink:0}}>
              {student.profilePic ? (
                <img src={student.profilePic} alt={user.name} style={{width:72,height:72,borderRadius:20,objectFit:'cover',boxShadow:'0 0 30px rgba(99,102,241,0.4)'}} />
              ) : (
                <div style={{width:72,height:72,borderRadius:20,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:900,boxShadow:'0 0 30px rgba(99,102,241,0.4)'}}>{initials}</div>
              )}
              <div style={{position:'absolute',bottom:4,right:4,width:14,height:14,borderRadius:'50%',background:'#22c55e',border:'3px solid #030508',boxShadow:'0 0 8px rgba(34,197,94,0.8)'}} />
            </div>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontSize:22,fontWeight:900,letterSpacing:-0.5,marginBottom:3}}>{user.name}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:12}}>{student.domain || 'Developer'}{student.location ? ` · ${student.location}` : ''}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                <span style={{fontSize:10,padding:'4px 10px',borderRadius:20,fontWeight:700,background:'rgba(212,175,55,0.15)',color:'#d4af37',border:'1px solid rgba(212,175,55,0.3)'}}>✦ Hiresnix Verified</span>
                {student.domain && <span style={{fontSize:10,padding:'4px 10px',borderRadius:20,fontWeight:700,background:'rgba(99,102,241,0.15)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.3)'}}>{student.domain}</span>}
                <span style={{fontSize:10,padding:'4px 10px',borderRadius:20,fontWeight:700,background:'rgba(34,197,94,0.12)',color:'#4ade80',border:'1px solid rgba(34,197,94,0.25)'}}>● Open to work</span>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {student.githubUrl && <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,padding:'6px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.6)',textDecoration:'none',fontWeight:600}}>⌥ GitHub</a>}
                {student.linkedinUrl && <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,padding:'6px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.6)',textDecoration:'none',fontWeight:600}}>in LinkedIn</a>}
                {student.phone && <a href={`https://wa.me/91${student.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,padding:'6px 12px',borderRadius:8,border:'1px solid rgba(37,211,102,0.3)',background:'rgba(37,211,102,0.08)',color:'#25d366',textDecoration:'none',fontWeight:700}}>📱 WhatsApp</a>}
                <a href={`mailto:${user.email}`} style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,padding:'6px 12px',borderRadius:8,border:'1px solid rgba(99,102,241,0.4)',background:'rgba(99,102,241,0.1)',color:'#a5b4fc',textDecoration:'none',fontWeight:700}}>✉ Get in Touch</a>
              </div>
            </div>
          </div>
          {skills.length > 0 && (
            <div style={{marginTop:20,paddingTop:18,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.2)',textTransform:'uppercase',letterSpacing:'2px',marginBottom:10}}>Tech Stack</div>
              {skills.slice(0,15).map((s:string)=>(
                <span key={s} className="spill" style={{display:'inline-block',padding:'5px 12px',borderRadius:7,fontSize:12,fontWeight:600,background:'rgba(99,102,241,0.08)',color:'rgba(165,180,252,0.7)',border:'1px solid rgba(99,102,241,0.12)',margin:'3px 3px 3px 0',cursor:'default',transition:'all 0.2s'}}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div style={{padding:'40px 40px 0',position:'relative',zIndex:1}}>
        <div style={{maxWidth:980,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:-0.5}}>Projects</div>
            <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(99,102,241,0.4),transparent)'}} />
            <div style={{fontSize:12,color:'rgba(255,255,255,0.25)',fontWeight:600}}>{projects.length} total</div>
          </div>
          {projects.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.3)'}}>
              <div style={{fontSize:48,marginBottom:12}}>🚀</div>
              <p>No projects yet</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
              {projects.map((p:any,i:number)=>(
                <div key={p.id} className="pcard" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20,overflow:'hidden',cursor:'pointer',position:'relative',transition:'all 0.3s'}}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} style={{width:'100%',height:130,objectFit:'cover'}} />
                  ) : (
                    <div style={{height:130,display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,background:CARD_BG[i%CARD_BG.length],position:'relative'}}>
                      {getEmoji(p.title)}
                      {p.featured && <div style={{position:'absolute',top:10,right:10,fontSize:10,padding:'3px 10px',borderRadius:20,background:'rgba(212,175,55,0.2)',color:'#d4af37',border:'1px solid rgba(212,175,55,0.4)',fontWeight:700}}>✦ Featured</div>}
                    </div>
                  )}
                  <div style={{padding:16}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:6}}>
                      <div style={{fontSize:14,fontWeight:700,letterSpacing:-0.3,lineHeight:1.3}}>{p.title}</div>
                      {p.status==='live'
                        ? <span style={{fontSize:10,padding:'3px 8px',borderRadius:6,background:'rgba(34,197,94,0.12)',color:'#4ade80',border:'1px solid rgba(34,197,94,0.2)',fontWeight:700,whiteSpace:'nowrap'}}>● Live</span>
                        : <span style={{fontSize:10,padding:'3px 8px',borderRadius:6,background:'rgba(99,102,241,0.12)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.2)',fontWeight:700}}>✓ Done</span>
                      }
                    </div>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.6,marginBottom:12}}>{p.description.slice(0,100)}{p.description.length>100?'...':''}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:14}}>
                      {p.techStack.slice(0,4).map((t:string)=>(
                        <span key={t} style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.35)',border:'1px solid rgba(255,255,255,0.06)'}}>{t}</span>
                      ))}
                      {p.techStack.length>4 && <span style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.3)'}}>+{p.techStack.length-4}</span>}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:9,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontSize:12,fontWeight:700,textAlign:'center',textDecoration:'none',boxShadow:'0 4px 15px rgba(99,102,241,0.3)'}}>↗ Live Demo</a>}
                      {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" style={{padding:'9px 14px',borderRadius:10,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:600,textDecoration:'none',border:'1px solid rgba(255,255,255,0.07)'}}>⌥ Code</a>}
                      {!p.liveUrl && !p.githubUrl && <div style={{flex:1,padding:9,borderRadius:10,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',border:'1px solid rgba(255,255,255,0.05)'}}>No links</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{margin:'40px 40px 0',background:'linear-gradient(135deg,rgba(212,175,55,0.06),rgba(99,102,241,0.06))',border:'1px solid rgba(212,175,55,0.15)',borderRadius:20,padding:'32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,flexWrap:'wrap',position:'relative',overflow:'hidden',zIndex:1}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.6),rgba(99,102,241,0.5),transparent)'}} />
        <div>
          <h3 style={{fontSize:20,fontWeight:800,letterSpacing:-0.5,marginBottom:4,background:'linear-gradient(135deg,#fff,#d4af37)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Interested in hiring {firstName}?</h3>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>Connect directly — let's build something great together</p>
        </div>
        <a href={`mailto:${user.email}`} style={{padding:'12px 24px',borderRadius:12,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',boxShadow:'0 4px 15px rgba(99,102,241,0.3)'}}>✉ Get in Touch</a>
      </div>

      {/* Footer */}
      <div style={{textAlign:'center',padding:32,fontSize:12,color:'rgba(255,255,255,0.15)',position:'relative',zIndex:1,marginTop:40}}>
        Powered by <a href="/" style={{color:'rgba(99,102,241,0.5)',textDecoration:'none',fontWeight:600}}>Hiresnix</a> · Build your portfolio free
      </div>
    </div>
  );
}