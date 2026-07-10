// src/pages/student/StudentDashboard.tsx
import React from 'react';
import { Link } from 'react-router';
import { Briefcase, BookOpen, Award, FileText, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import { internshipsApi } from '../../api/internships';
import { applicationsApi } from '../../api/applications';
import { studentApi } from '../../api/student';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { useAuthStore } from '../../store/useAuthStore';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.student;

function GlassStatCard({ icon: Icon, label, value, accent, to, delay = 0 }: any) {
  return (
    <Link to={to} className="stat-card group animate-page" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg,${accent}33,${accent}11)`, border: `1px solid ${accent}44` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 transition mt-1" />
      </div>
      <p className="text-2xl font-black text-white">{value ?? 0}</p>
      <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>{label}</p>
    </Link>
  );
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Applied':              { bg: 'rgba(59,130,246,0.15)',  text: '#60A5FA' },
  'Under Review':         { bg: 'rgba(234,179,8,0.15)',   text: '#FCD34D' },
  'Shortlisted':          { bg: 'rgba(168,85,247,0.15)',  text: '#C084FC' },
  'Interview Scheduled':  { bg: 'rgba(249,115,22,0.15)',  text: '#FB923C' },
  'Selected':             { bg: 'rgba(34,197,94,0.15)',   text: '#4ADE80' },
  'Rejected':             { bg: 'rgba(239,68,68,0.15)',   text: '#F87171' },
};

export function StudentDashboard() {
  const { user } = useAuthStore();
  const { data: enrollments, loading: eLoading, error: eError } = useFetch(() => internshipsApi.getMyEnrollments());
  const { data: applications, loading: aLoading } = useFetch(() => applicationsApi.getMyApplications());
  const { data: profileData, loading: pLoading } = useFetch(() => studentApi.getProfile());
  const { data: certs, loading: cLoading } = useFetch(() => studentApi.getMyCertificates());

  const loading = eLoading || aLoading || pLoading || cLoading;
  if (loading) return <PageLoader />;
  if (eError)  return <ErrorState message={eError} />;

  const safeEnrollments: any[] = Array.isArray(enrollments) ? enrollments : ((enrollments as any)?.data?.data || (enrollments as any)?.data || []);
  const safeApps: any[]        = Array.isArray(applications) ? applications : ((applications as any)?.data?.data || (applications as any)?.data || []);
  const safeCerts: any[]       = Array.isArray(certs) ? certs : ((certs as any)?.data?.data || (certs as any)?.data || []);
  const profile = (profileData as any)?.data?.data || (profileData as any)?.data || profileData || {};

  const activeEnrollments    = safeEnrollments.filter(e => e.status !== 'Completed');
  const completedEnrollments = safeEnrollments.filter(e => e.status === 'Completed');
  const recentApps           = safeApps.slice(0, 4);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Welcome hero */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.15) 0%,rgba(139,92,246,0.1) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right,rgba(59,130,246,0.08) 0%,transparent 60%)' }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>Welcome back 👋</p>
          <h1 className="text-2xl font-black text-white mt-1">{user?.name}</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {profile?.placementStatus === 'Placed'
              ? `🎉 Placed at ${profile.placedCompany} as ${profile.placedRole}`
              : "Keep building your career — you're on the right track."}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassStatCard icon={Briefcase}  label="Active Internships" value={activeEnrollments.length}   accent="#3B82F6" to="/student/internships"  delay={0}   />
        <GlassStatCard icon={FileText}   label="Applications"       value={safeApps.length}            accent="#8B5CF6" to="/student/applications" delay={60}  />
        <GlassStatCard icon={Award}      label="Certificates"       value={safeCerts.length}           accent="#F59E0B" to="/student/certificates" delay={120} />
        <GlassStatCard icon={TrendingUp} label="Completed"          value={completedEnrollments.length} accent="#10B981" to="/student/internships" delay={180} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Active Internships */}
        <div className="rounded-2xl p-5 animate-page" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-sm">Active Internships</h2>
            <Link to="/student/internships" className="text-xs flex items-center gap-1 transition" style={{ color: C.accent }}>
              View all <ChevronRight size={11} />
            </Link>
          </div>
          {activeEnrollments.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#475569' }}>
              <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active internships. <Link to="/student/internships" style={{ color: C.accent }}>Browse →</Link></p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeEnrollments.slice(0, 3).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-sm font-semibold text-white">{e.internship?.title}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>{e.internship?.domain}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black" style={{ color: C.accent }}>{e.progress}%</p>
                    <div className="w-16 rounded-full h-1 mt-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-1 rounded-full" style={{ width: `${e.progress}%`, background: C.accent }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="rounded-2xl p-5 animate-page stagger-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-sm">Recent Applications</h2>
            <Link to="/student/applications" className="text-xs flex items-center gap-1" style={{ color: C.accent }}>
              View all <ChevronRight size={11} />
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#475569' }}>
              <FileText size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No applications yet. <Link to="/student/jobs" style={{ color: C.accent }}>Browse jobs →</Link></p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentApps.map((a: any) => {
                const sc = STATUS_COLORS[a.status] || { bg: 'rgba(255,255,255,0.08)', text: '#94a3b8' };
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="text-sm font-semibold text-white">{a.job?.title}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{a.job?.company?.companyName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{a.status}</span>
                      {a.status === 'Interview Scheduled' && a.interviewAt && (
                        <p className="text-[10px]" style={{ color: '#FB923C' }}>
                          📅 {new Date(a.interviewAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                      {a.meetingLink && a.status === 'Interview Scheduled' && (
                        <a href={a.meetingLink.startsWith('http') ? a.meetingLink : `https://${a.meetingLink}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-bold px-2 py-0.5 rounded text-white transition"
                          style={{ background: '#F97316' }}>
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resume prompt */}
      {!profile?.resumeUrl && (
        <div className="rounded-2xl p-4 flex items-center justify-between animate-page"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#FCD34D' }}>Upload your resume to apply for jobs</p>
            <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>Required before you can submit job applications</p>
          </div>
          <Link to="/student/profile" className="text-xs font-bold px-4 py-2 rounded-xl transition text-white"
            style={{ background: '#F59E0B' }}>Upload Resume</Link>
        </div>
      )}
    </div>
  );
}