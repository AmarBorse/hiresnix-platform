// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Users, Building2, Briefcase, FileText, GraduationCap, Award, TrendingUp, AlertTriangle, ChevronRight, Download, MessageSquare, BookOpen, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.admin;

function downloadCSV(data: any[], filename: string) {
  if (!data.length) { toast.error('No data to export'); return; }
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => {
    const val = row[k] ?? ''; const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url); toast.success('Downloaded!');
}

function GlassStatCard({ icon: Icon, label, value, accent, to, delay = 0 }: any) {
  return (
    <Link to={to} className="stat-card animate-page group" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}44` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 transition mt-1" />
      </div>
      <p className="text-2xl font-black text-white">{value ?? '—'}</p>
      <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>{label}</p>
    </Link>
  );
}

export function AdminDashboard() {
  const { data, loading, error, refetch } = useFetch(() => adminApi.getAnalytics());
  const [ipStats, setIpStats] = useState<any>({});
  const [downloadingApps, setDownloadingApps] = useState(false);
  const [downloadingStudents, setDownloadingStudents] = useState(false);
  const a = (data as any) || {};
  const enquiryCount = a.unreadEnquiries || 0;

  useEffect(() => {
    adminApi.getIPlatformStats().then(r => setIpStats(r.data || {})).catch(() => {});
  }, []);

  const handleDownloadJobApps = async () => {
    setDownloadingApps(true);
    try {
      const res = await adminApi.getAllApplications({ limit: 999 });
      const rows = (res.data || []).map((a: any) => ({
        StudentName: a.student?.user?.name || '', Email: a.student?.user?.email || '',
        Department: a.student?.department || '', CGPA: a.student?.cgpa || '',
        JobTitle: a.job?.title || '', Company: a.job?.company?.companyName || '',
        Status: a.status, AppliedOn: new Date(a.createdAt).toLocaleDateString(),
      }));
      downloadCSV(rows, `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
    } catch { toast.error('Failed'); } finally { setDownloadingApps(false); }
  };

  const handleDownloadInternStudents = async () => {
    setDownloadingStudents(true);
    try {
      const res = await adminApi.downloadIPlatformStudents();
      const rows = (res.data || []).map((e: any) => ({
        StudentName: e.studentName || '', Email: e.email || '', Domain: e.domain?.name || '',
        Progress: `${e.progress}%`, Status: e.status, Tasks: (e.taskLogs || []).length,
        StartDate: e.startDate ? new Date(e.startDate).toLocaleDateString() : '',
        CompletedOn: e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '',
      }));
      downloadCSV(rows, `interns_${new Date().toISOString().split('T')[0]}.csv`);
    } catch { toast.error('Failed'); } finally { setDownloadingStudents(false); }
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;

  const placementRate = a.totalStudents > 0 ? Math.round((a.placedStudents / a.totalStudents) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.15) 0%,rgba(59,130,246,0.1) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img src="/hiresnix-logo.png" alt="" style={{ height: 44, objectFit: 'contain', filter: `drop-shadow(0 0 12px ${C.ring})` }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.accent }}>Admin Control Panel</p>
              <h1 className="text-2xl font-black text-white mt-0.5">Platform Overview</h1>
              <p className="text-gray-500 text-xs mt-0.5">Live data from database</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadJobApps} disabled={downloadingApps}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-60"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
              {downloadingApps ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Job Apps CSV
            </button>
            <button onClick={handleDownloadInternStudents} disabled={downloadingStudents}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-60 text-white"
              style={{ background: `linear-gradient(135deg,${C.accent},#059669)` }}>
              {downloadingStudents ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Intern CSV
            </button>
          </div>
        </div>
      </div>

      {/* Job Portal Stats */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-3">Job Portal</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: Users,         label: 'Total Students',   value: a.totalStudents,     accent: '#3B82F6', to: '/admin/students' },
            { icon: Building2,     label: 'Companies',        value: a.totalCompanies,    accent: '#8B5CF6', to: '/admin/companies' },
            { icon: Briefcase,     label: 'Job Listings',     value: a.totalJobs,         accent: '#10B981', to: '/admin/jobs' },
            { icon: FileText,      label: 'Job Applications', value: a.totalApplications, accent: '#F59E0B', to: '/admin/applications' },
            { icon: TrendingUp,    label: 'Placed Students',  value: a.placedStudents,    accent: '#22C55E', to: '/admin/students' },
            { icon: AlertTriangle, label: 'Pending Jobs',     value: a.pendingJobs,       accent: '#EF4444', to: '/admin/jobs' },
          ].map((s, i) => <GlassStatCard key={s.label} {...s} delay={i * 40} />)}
        </div>
      </div>

      {/* Internship Platform Stats */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-3">Hiresnix Internship Platform</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: GraduationCap, label: 'Intern Applications', value: ipStats.totalApplications,   accent: '#6366F1', to: '/admin/iplatform' },
            { icon: BookOpen,      label: 'Active Interns',      value: ipStats.activeEnrollments,   accent: '#06B6D4', to: '/admin/iplatform' },
            { icon: Award,         label: 'Completed',           value: ipStats.completedEnrollments, accent: '#A855F7', to: '/admin/iplatform' },
            { icon: MessageSquare, label: 'New Enquiries',       value: enquiryCount,                accent: '#EC4899', to: '/admin/enquiries' },
          ].map((s, i) => <GlassStatCard key={s.label} {...s} delay={i * 40 + 240} />)}
        </div>
      </div>

      {/* Placement progress bar */}
      {a.totalStudents > 0 && (
        <div className="rounded-2xl p-5 animate-page" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-white text-sm">Placement Rate</p>
            <span className="text-2xl font-black" style={{ color: C.accent }}>{placementRate}%</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Placed: {a.placedStudents}</span>
            <span>Total: {a.totalStudents}</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, placementRate)}%`, background: `linear-gradient(90deg,${C.accent},#059669)` }} />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { to: '/admin/iplatform',    label: '🎓 Internship Applications', desc: 'Approve / reject student applications', accent: '#6366F1' },
          { to: '/admin/applications', label: '💼 Job Applications',         desc: 'View and download all job applications', accent: '#10B981' },
          { to: '/admin/enquiries',    label: `📬 Enquiries (${enquiryCount} new)`, desc: 'Messages from students on landing page', accent: '#EC4899' },
        ].map(q => (
          <Link key={q.to} to={q.to} className="p-4 rounded-2xl transition-all hover:-translate-y-1"
            style={{ background: `linear-gradient(135deg,${q.accent}15,${q.accent}08)`, border: `1px solid ${q.accent}30` }}>
            <p className="font-bold text-white text-sm">{q.label}</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>{q.desc}</p>
            <div className="flex items-center gap-1 text-xs font-semibold mt-3" style={{ color: q.accent }}>
              Open <ChevronRight size={11} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}