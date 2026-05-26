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

function StatCard({ icon: Icon, label, value, color, to }: { icon: any; label: string; value: number | string; color: string; to: string }) {
  return (
    <Link to={to} className={`bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group`}>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      <div className="flex items-center gap-1 mt-3 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition">
        View all <ChevronRight size={12} />
      </div>
    </Link>
  );
}

export function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: enrollments, loading: eLoading, error: eError } = useFetch(
    () => internshipsApi.getMyEnrollments()
  );
  const { data: applications, loading: aLoading } = useFetch(
    () => applicationsApi.getMyApplications()
  );
  const { data: profileData, loading: pLoading } = useFetch(
    () => studentApi.getProfile()
  );
  const { data: certs, loading: cLoading } = useFetch(
    () => studentApi.getMyCertificates()
  );

  const loading = eLoading || aLoading || pLoading || cLoading;
  if (loading) return <PageLoader />;
  if (eError) return <ErrorState message={eError} />;

  const safeEnrollments: any[] = Array.isArray(enrollments) ? enrollments : (Array.isArray((enrollments as any)?.data) ? (enrollments as any)?.data : ((enrollments as any)?.data?.data || []));
  const safeApps: any[] = Array.isArray(applications) ? applications : (Array.isArray((applications as any)?.data) ? (applications as any)?.data : ((applications as any)?.data?.data || []));
  const safeCerts: any[] = Array.isArray(certs) ? certs : (Array.isArray((certs as any)?.data) ? (certs as any)?.data : ((certs as any)?.data?.data || []));
  const profile = (profileData as any)?.data?.data || (profileData as any)?.data || profileData || {};

  const activeEnrollments = safeEnrollments.filter(e => e.status !== 'Completed');
  const completedEnrollments = safeEnrollments.filter(e => e.status === 'Completed');
  const recentApps = safeApps.slice(0, 4);

  const statusColors: Record<string, string> = {
    Applied: 'bg-blue-100 text-blue-700',
    'Under Review': 'bg-yellow-100 text-yellow-700',
    Shortlisted: 'bg-purple-100 text-purple-700',
    'Interview Scheduled': 'bg-orange-100 text-orange-700',
    Selected: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium">Welcome back 👋</p>
        <h1 className="text-2xl font-black mt-1">{user?.name}</h1>
        <p className="text-blue-200 text-sm mt-1">
          {profile?.placementStatus === 'Placed'
            ? `🎉 Placed at ${profile.placedCompany} as ${profile.placedRole}`
            : 'Keep building your career — you\'re on the right track.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase}  label="Active Internships" value={activeEnrollments.length}            color="bg-blue-500"   to="/student/internships" />
        <StatCard icon={FileText}   label="Applications"       value={safeApps.length}                      color="bg-violet-500" to="/student/applications" />
        <StatCard icon={Award}      label="Certificates"       value={safeCerts.length}                     color="bg-amber-500"  to="/student/certificates" />
        <StatCard icon={TrendingUp} label="Completed"          value={completedEnrollments.length}          color="bg-emerald-500" to="/student/internships" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Internships */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Active Internships</h2>
            <Link to="/student/internships" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {activeEnrollments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active internships. <Link to="/student/internships" className="text-blue-500">Browse internships →</Link></p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeEnrollments.slice(0, 3).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{e.internship?.title}</p>
                    <p className="text-xs text-gray-500">{e.internship?.domain}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-600">{e.progress}%</p>
                    <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                      <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${e.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Applications</h2>
            <Link to="/student/applications" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No applications yet. <Link to="/student/jobs" className="text-blue-500">Browse jobs →</Link></p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApps.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.job?.title}</p>
                    <p className="text-xs text-gray-500">{a.job?.company?.companyName}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[a.status] || 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                    {a.status === 'Interview Scheduled' && a.interviewAt && (
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <p className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded shadow-sm">
                          📅 {new Date(a.interviewAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                        {a.meetingLink && (
                          <a href={a.meetingLink.startsWith('http') ? a.meetingLink : `https://${a.meetingLink}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded hover:bg-orange-600 transition shadow-sm">
                            Join Meeting
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resume Upload Prompt */}
      {!profile?.resumeUrl && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800 text-sm">Upload your resume to apply for jobs</p>
            <p className="text-xs text-amber-600 mt-0.5">Required before you can submit job applications</p>
          </div>
          <Link to="/student/profile" className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-600 transition">
            Upload Resume
          </Link>
        </div>
      )}
    </div>
  );
}
