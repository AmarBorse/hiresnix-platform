// src/pages/institution/AcademyAdminView.tsx
import React, { useState, useEffect } from 'react';
import { Trophy, Flame, ChevronRight, Users, Award, Loader2 } from 'lucide-react';
import { institutionApi } from '../../api/institution';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.institution;

const COURSES: Record<string,{title:string,icon:string,accent:string}> = {
  python:     { title:'Python Programming',   icon:'🐍', accent:'#6366f1' },
  javascript: { title:'JavaScript',           icon:'⚡', accent:'#f59e0b' },
  java:       { title:'Java',                 icon:'☕', accent:'#ef4444' },
  cpp:        { title:'C++',                  icon:'⚙️', accent:'#06b6d4' },
  dsa:        { title:'DSA',                  icon:'🧠', accent:'#8b5cf6' },
  sql:        { title:'SQL & Databases',      icon:'🗄️', accent:'#10b981' },
  webdev:     { title:'Full Stack Web Dev',   icon:'🌐', accent:'#ec4899' },
};

export function AcademyAdminView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number|null>(null);

  useEffect(() => {
    institutionApi.getAcademyProgress()
      .then((r: any) => setData(r.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  // Compute stats
  const enrolled = data.filter(s => s.academy?.length > 0);
  const totalCerts = data.reduce((a,s) => a + (s.academy||[]).filter((p:any)=>p.claimedCert).length, 0);
  const totalXp = data.reduce((a,s) => a + (s.academy||[]).reduce((b:number,p:any)=>b+(p.xp||0),0), 0);

  // Course counts
  const courseCounts = Object.keys(COURSES).map(id => ({
    id,
    count: data.filter(s => s.academy?.some((p:any)=>p.courseId===id)).length,
    completed: data.filter(s => s.academy?.some((p:any)=>p.courseId===id && (p.completed||[]).length > 0)).length,
  }));

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 size={24} className="animate-spin" style={{color:C.accent}} />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-white">🎓 AI Academy — Student Progress</h2>
        <p className="text-sm mt-0.5" style={{color:'#64748b'}}>Real-time tracking of student course progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:'Students Active', value:enrolled.length, icon:Users, color:'#6366f1'},
          {label:'Certificates Earned', value:totalCerts, icon:Award, color:'#f59e0b'},
          {label:'Total XP Earned', value:totalXp, icon:Flame, color:'#ec4899'},
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <s.icon size={16} style={{color:s.color,marginBottom:'8px'}} />
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-xs mt-0.5" style={{color:'#64748b'}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Course Overview */}
      <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{color:'#475569',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          Course Enrollment Overview
        </div>
        {courseCounts.map(c => {
          const info = COURSES[c.id];
          const pct = data.length > 0 ? Math.round((c.count/data.length)*100) : 0;
          return (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span className="text-lg shrink-0">{info.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{info.title}</span>
                  <span className="text-xs" style={{color:'#64748b'}}>{c.count} enrolled · {c.completed} active</span>
                </div>
                <div className="rounded-full h-1.5" style={{background:'rgba(255,255,255,0.06)'}}>
                  <div className="h-1.5 rounded-full" style={{width:`${pct}%`,background:info.accent}} />
                </div>
              </div>
              <span className="text-xs font-bold shrink-0" style={{color:info.accent}}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Student List */}
      <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{color:'#475569',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          Student Progress ({data.length} students)
        </div>
        {data.length === 0
          ? <div className="text-center py-10 text-sm" style={{color:'#475569'}}>No students found</div>
          : data.map((s,i) => {
            const academy = s.academy || [];
            const certs = academy.filter((p:any)=>p.claimedCert).length;
            const xp = academy.reduce((a:number,p:any)=>a+(p.xp||0),0);
            const isOpen = selected === i;
            return (
              <div key={s.student_id}>
                <div onClick={() => setSelected(isOpen ? null : i)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition"
                  style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:isOpen?'rgba(255,255,255,0.03)':''}}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white"
                    style={{background:`linear-gradient(135deg,${C.accent},${C.accent}99)`}}>
                    {s.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{s.name}</div>
                    {/* Career ID prominently */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{s.careerId}</span>
                      {s.department && <span className="text-xs" style={{color:'#475569'}}>{s.department}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    {academy.length > 0
                      ? <span className="font-bold px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>
                          📚 {academy.length} course{academy.length>1?'s':''}
                        </span>
                      : <span style={{color:'#334155'}}>Not started</span>
                    }
                    {certs > 0 && <span className="font-bold" style={{color:'#f59e0b'}}>🏆 {certs}</span>}
                    {xp > 0 && <span style={{color:'#64748b'}}>{xp} XP</span>}
                    <ChevronRight size={13} style={{color:'#334155',transform:isOpen?'rotate(90deg)':'none',transition:'transform 0.2s'}} />
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-4 pb-3 pt-2 space-y-2" style={{background:'rgba(255,255,255,0.02)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    {academy.length === 0
                      ? <p className="text-xs py-2" style={{color:'#334155'}}>No Academy activity yet.</p>
                      : academy.map((p:any) => {
                        const info = COURSES[p.courseId] || {title:p.courseId,icon:'📚',accent:'#6366f1'};
                        const done = p.completed?.length || 0;
                        const pct = done > 0 ? Math.min(100, Math.round(done/5)*10) : 0; // estimate
                        const lastDate = p.lastActive ? new Date(p.lastActive).toLocaleDateString('en-IN') : '—';
                        return (
                          <div key={p.courseId} className="flex items-center gap-3 p-3 rounded-xl"
                            style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${info.accent}22`}}>
                            <span className="text-base shrink-0">{info.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-white">{info.title}</span>
                                <div className="flex items-center gap-2">
                                  {p.claimedCert && <span className="text-xs font-bold" style={{color:'#f59e0b'}}>🏆 Certified</span>}
                                  {p.xp > 0 && <span className="text-xs" style={{color:'#64748b'}}>{p.xp} XP</span>}
                                </div>
                              </div>
                              <div className="rounded-full h-1.5 mb-1" style={{background:'rgba(255,255,255,0.06)'}}>
                                <div className="h-1.5 rounded-full" style={{width:`${pct}%`,background:info.accent}} />
                              </div>
                              <div className="flex justify-between text-xs" style={{color:'#475569'}}>
                                <span>{done} lessons completed</span>
                                <span>Last active: {lastDate}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}