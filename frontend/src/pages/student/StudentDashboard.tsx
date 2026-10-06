// src/pages/student/StudentDashboard.tsx
// Student dashboard — white, clean design matching the landing page.
import React from 'react';
import { Link } from 'react-router';
import { Briefcase, Award, FileText, ChevronRight, TrendingUp, Sparkles, BotMessageSquare, Map, Upload, CalendarDays } from 'lucide-react';
import { internshipsApi } from '../../api/internships';
import { applicationsApi } from '../../api/applications';
import { studentApi } from '../../api/student';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { useAuthStore } from '../../store/useAuthStore';

// Application status → pill tone
const STATUS_TONE: Record<string, string> = {
  'Applied': 'neutral',
  'Under Review': 'amber',
  'Shortlisted': 'green',
  'Interview Scheduled': 'amber',
  'Selected': 'green-strong',
  'Rejected': 'red',
};

const QUICK_LINKS = [
  { to: '/student/academy',        icon: Sparkles,         title: 'AI Academy',     desc: '16 courses with an AI teacher' },
  { to: '/student/mock-interview', icon: BotMessageSquare, title: 'Mock interview', desc: 'Practise with an AI interviewer' },
  { to: '/student/resume-builder', icon: FileText,         title: 'Resume AI',      desc: 'Check and improve your resume' },
  { to: '/student/roadmap',        icon: Map,              title: 'Career roadmap', desc: 'Step-by-step learning paths' },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export function StudentDashboard() {
  const { user } = useAuthStore();
  const { data: enrollments, loading: eLoading, error: eError } = useFetch(() => internshipsApi.getMyIplatformEnrollments());
  const { data: applications, loading: aLoading } = useFetch(() => applicationsApi.getMyApplications());
  const { data: profileData, loading: pLoading } = useFetch(() => studentApi.getProfile());
  const { data: certs, loading: cLoading } = useFetch(() => studentApi.getMyCertificates());

  const loading = eLoading || aLoading || pLoading || cLoading;
  if (loading) return <PageLoader />;
  if (eError) return <ErrorState message={eError} />;

  const safeEnrollments: any[] = Array.isArray(enrollments) ? enrollments : ((enrollments as any)?.data?.data || (enrollments as any)?.data || []);
  const safeApps: any[] = Array.isArray(applications) ? applications : ((applications as any)?.data?.data || (applications as any)?.data || []);
  const safeCerts: any[] = Array.isArray(certs) ? certs : ((certs as any)?.data?.data || (certs as any)?.data || []);
  const profile = (profileData as any)?.data?.data || (profileData as any)?.data || profileData || {};

  const activeEnrollments = safeEnrollments.filter(e => e.status !== 'Completed');
  const completedEnrollments = safeEnrollments.filter(e => e.status === 'Completed');
  const recentApps = safeApps.slice(0, 4);
  const firstName = (user?.name || '').split(' ')[0];

  const stats = [
    { label: 'Active internships', value: activeEnrollments.length, to: '/student/internships', icon: Briefcase },
    { label: 'Applications', value: safeApps.length, to: '/student/applications', icon: FileText },
    { label: 'Certificates', value: safeCerts.length, to: '/student/certificates', icon: Award },
    { label: 'Completed', value: completedEnrollments.length, to: '/student/internships', icon: TrendingUp },
  ];

  return (
    <div className="sd">
      <style>{CSS}</style>

      {/* Greeting */}
      <section className="sd-hero">
        <div>
          <h2 className="sd-h1">{greeting()}, {firstName}</h2>
          <p className="sd-lead">
            {profile?.placementStatus === 'Placed'
              ? `Congratulations, you're placed at ${profile.placedCompany} as ${profile.placedRole}.`
              : "Here's where your internship and applications stand today."}
          </p>
        </div>
        <Link to="/student/internships" className="stu-btn stu-btn-primary">Open my internship</Link>
      </section>

      {/* Stats */}
      <div className="sd-stats">
        {stats.map(({ label, value, to, icon: Icon }) => (
          <Link key={label} to={to} className="sd-stat">
            <span className="sd-stat-icon" aria-hidden="true"><Icon size={16} /></span>
            <span className="sd-stat-value">{value}</span>
            <span className="sd-stat-label">{label}</span>
          </Link>
        ))}
      </div>

      <div className="sd-grid">
        {/* Internship */}
        <section className="sd-card">
          <header className="sd-card-head">
            <h3 className="sd-h3">Your internship</h3>
            <Link to="/student/internships" className="sd-link">View all <ChevronRight size={14} aria-hidden="true" /></Link>
          </header>
          {activeEnrollments.length === 0 ? (
            <div className="sd-empty">
              <p>You don't have an active internship yet.</p>
              <Link to="/student/internships" className="stu-btn stu-btn-ghost">Browse internships</Link>
            </div>
          ) : (
            <ul className="sd-list">
              {activeEnrollments.slice(0, 3).map((e: any) => {
                const name = e.domain?.name || e.internship?.title || 'Internship';
                const progress = Math.max(0, Math.min(100, Number(e.progress) || 0));
                return (
                  <li key={e.id} className="sd-intern">
                    <div className="sd-intern-top">
                      <div>
                        <p className="sd-item-title">{name}</p>
                        {e.startDate && (
                          <p className="sd-item-meta"><CalendarDays size={13} aria-hidden="true" /> Started {fmtDate(e.startDate)}</p>
                        )}
                      </div>
                      <span className="sd-pill sd-pill-green">{e.status || 'Active'}</span>
                    </div>
                    <div className="sd-progress">
                      <div className="sd-progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${name} progress`}>
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <span className="sd-progress-num">{progress}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Applications */}
        <section className="sd-card">
          <header className="sd-card-head">
            <h3 className="sd-h3">Recent applications</h3>
            <Link to="/student/applications" className="sd-link">View all <ChevronRight size={14} aria-hidden="true" /></Link>
          </header>
          {recentApps.length === 0 ? (
            <div className="sd-empty">
              <p>No applications yet.</p>
              <Link to="/student/jobs" className="stu-btn stu-btn-ghost">Browse jobs</Link>
            </div>
          ) : (
            <ul className="sd-list">
              {recentApps.map((a: any) => (
                <li key={a.id} className="sd-app">
                  <div className="sd-app-text">
                    <p className="sd-item-title">{a.job?.title || 'Job'}</p>
                    <p className="sd-item-meta">{a.job?.company?.companyName}</p>
                    {a.status === 'Interview Scheduled' && a.interviewAt && (
                      <p className="sd-item-meta sd-amber">
                        Interview {new Date(a.interviewAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                  <div className="sd-app-side">
                    <span className={`sd-pill sd-pill-${STATUS_TONE[a.status] || 'neutral'}`}>{a.status}</span>
                    {a.meetingLink && a.status === 'Interview Scheduled' && (
                      <a href={a.meetingLink.startsWith('http') ? a.meetingLink : `https://${a.meetingLink}`}
                        target="_blank" rel="noopener noreferrer" className="sd-join">Join meeting</a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Resume prompt */}
      {!profile?.resumeUrl && (
        <section className="sd-banner">
          <span className="sd-banner-icon" aria-hidden="true"><Upload size={18} /></span>
          <div className="sd-banner-text">
            <p className="sd-banner-title">Upload your resume to apply for jobs</p>
            <p className="sd-banner-sub">Companies see it when you apply. It takes a minute.</p>
          </div>
          <Link to="/student/profile" className="stu-btn stu-btn-primary">Upload resume</Link>
        </section>
      )}

      {/* Quick links */}
      <section>
        <h3 className="sd-h3 sd-quick-title">Keep growing</h3>
        <div className="sd-quick">
          {QUICK_LINKS.map(({ to, icon: Icon, title, desc }) => (
            <Link key={to} to={to} className="sd-quick-item">
              <span className="sd-quick-icon" aria-hidden="true"><Icon size={18} /></span>
              <span className="sd-quick-title-text">{title}</span>
              <span className="sd-quick-desc">{desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

const CSS = `
.sd{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:22px;}
.sd-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;padding:6px 0 4px;}
.sd-h1{margin:0 0 6px;font-family:var(--display);font-weight:700;font-size:clamp(1.7rem,3vw,2.3rem);letter-spacing:-0.03em;color:var(--ink);line-height:1.1;}
.sd-lead{margin:0;color:var(--text);font-size:1rem;}
.sd-h3{margin:0;font-family:var(--display);font-weight:600;font-size:1.08rem;color:var(--ink);}

.sd-stats{display:grid;grid-template-columns:repeat(4,1fr);background:var(--paper);border:1px solid var(--line);border-radius:18px;overflow:hidden;}
.sd-stat{display:flex;flex-direction:column;gap:2px;padding:20px 22px;text-decoration:none;color:inherit;transition:background-color .15s ease;}
.sd-stat + .sd-stat{border-left:1px solid var(--line);}
.sd-stat:hover{background:var(--mist);}
.sd-stat-icon{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:var(--accent-soft);color:var(--accent);margin-bottom:10px;}
.sd-stat-value{font-family:var(--display);font-weight:700;font-size:2rem;line-height:1;color:var(--ink);letter-spacing:-0.02em;}
.sd-stat-label{color:var(--muted);font-size:0.9rem;margin-top:4px;}

.sd-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.sd-card{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:22px;}
.sd-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.sd-link{display:inline-flex;align-items:center;gap:2px;color:var(--accent);font-weight:600;font-size:0.88rem;text-decoration:none;}
.sd-link:hover{color:var(--accent-press);text-decoration:underline;text-underline-offset:3px;}
.sd-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;}
.sd-list > li + li{border-top:1px solid var(--line);}
.sd-item-title{margin:0;font-weight:700;color:var(--ink);font-size:0.97rem;}
.sd-item-meta{margin:2px 0 0;color:var(--muted);font-size:0.86rem;display:flex;align-items:center;gap:5px;}
.sd-amber{color:var(--amber);font-weight:600;}
.sd-intern{padding:12px 0;}
.sd-intern:first-child{padding-top:2px;}
.sd-intern-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
.sd-progress{display:flex;align-items:center;gap:12px;margin-top:14px;}
.sd-progress-bar{flex:1;height:8px;border-radius:999px;background:var(--mist);border:1px solid var(--line);overflow:hidden;}
.sd-progress-bar span{display:block;height:100%;background:var(--accent);border-radius:999px;}
.sd-progress-num{font-family:var(--display);font-weight:700;color:var(--ink);font-size:0.95rem;min-width:40px;text-align:right;}
.sd-app{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;}
.sd-app:first-child{padding-top:2px;}
.sd-app-text{min-width:0;}
.sd-app-side{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;}
.sd-join{font-size:0.8rem;font-weight:600;color:#fff;background:var(--accent);border-radius:999px;padding:4px 10px;text-decoration:none;}
.sd-pill{font-size:0.78rem;font-weight:600;border-radius:999px;padding:4px 10px;white-space:nowrap;}
.sd-pill-neutral{background:var(--mist);color:var(--text);border:1px solid var(--line);}
.sd-pill-green{background:var(--accent-soft);color:var(--accent-press);}
.sd-pill-green-strong{background:var(--accent);color:#fff;}
.sd-pill-amber{background:var(--amber-soft);color:var(--amber);}
.sd-pill-red{background:var(--red-soft);color:var(--red);}
.sd-empty{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:8px 0 4px;}
.sd-empty p{margin:0;color:var(--muted);}

.sd-banner{display:flex;align-items:center;gap:16px;background:var(--paper);border:1px solid var(--line);border-left:4px solid var(--amber);border-radius:18px;padding:18px 22px;}
.sd-banner-icon{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:var(--amber-soft);color:var(--amber);flex-shrink:0;}
.sd-banner-text{flex:1;min-width:0;}
.sd-banner-title{margin:0;font-weight:700;color:var(--ink);}
.sd-banner-sub{margin:2px 0 0;color:var(--muted);font-size:0.9rem;}

.sd-quick-title{margin-bottom:12px;}
.sd-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.sd-quick-item{display:flex;flex-direction:column;gap:4px;padding:18px;background:var(--paper);border:1px solid var(--line);border-radius:16px;text-decoration:none;color:inherit;transition:border-color .2s ease,transform .2s ease,box-shadow .2s ease;}
.sd-quick-item:hover{border-color:#D3D6D0;transform:translateY(-2px);box-shadow:0 14px 30px -22px rgba(21,23,26,.3);}
.sd-quick-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:var(--ink);color:#fff;margin-bottom:8px;}
.sd-quick-title-text{font-weight:700;color:var(--ink);}
.sd-quick-desc{color:var(--muted);font-size:0.88rem;}

@media (max-width: 960px){
  .sd-grid{grid-template-columns:1fr;}
  .sd-quick{grid-template-columns:1fr 1fr;}
}
@media (max-width: 640px){
  .sd-stats{grid-template-columns:1fr 1fr;}
  .sd-stat:nth-child(3){border-left:none;}
  .sd-stat:nth-child(n+3){border-top:1px solid var(--line);}
  .sd-banner{flex-wrap:wrap;}
  .sd-quick{grid-template-columns:1fr;}
}
@media (prefers-reduced-motion: reduce){
  .sd-quick-item,.sd-stat{transition:none;}
  .sd-quick-item:hover{transform:none;}
}
`;