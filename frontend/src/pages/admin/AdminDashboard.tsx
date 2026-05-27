// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Users, Building2, Briefcase, FileText, GraduationCap, Award, TrendingUp, AlertTriangle, ChevronRight, Download, MessageSquare, BookOpen, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { toast } from 'sonner';

function downloadCSV(data: any[], filename: string) {
  if (!data.length) { toast.error('No data to export'); return; }
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => {
    const val = row[k] ?? '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success('Downloaded!');
}

function StatCard({ icon: Icon, label, value, color, bg, to }: any) {
  return (
    <Link to={to} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group hover:-translate-y-0.5">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      <ChevronRight size={12} className="text-gray-300 group-hover:text-blue-400 mt-2 transition" />
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
      downloadCSV(rows, `all_job_applications_${new Date().toISOString().split('T')[0]}.csv`);
    } catch { toast.error('Failed to download'); }
    finally { setDownloadingApps(false); }
  };

  const handleDownloadInternStudents = async () => {
    setDownloadingStudents(true);
    try {
      const res = await adminApi.downloadIPlatformStudents();
      const rows = (res.data || []).map((e: any) => ({
        StudentName: e.studentName || '', Email: e.email || '',
        Domain: e.domain?.name || '', Progress: `${e.progress}%`,
        Status: e.status, Tasks: (e.taskLogs || []).length,
        StartDate: e.startDate ? new Date(e.startDate).toLocaleDateString() : '',
        CompletedOn: e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '',
      }));
      downloadCSV(rows, `internship_students_${new Date().toISOString().split('T')[0]}.csv`);
    } catch { toast.error('Failed to download'); }
    finally { setDownloadingStudents(false); }
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;

  const jobStats = [
    { icon: Users,         label: 'Total Students',      value: a.totalStudents,     bg: 'bg-blue-50',    color: 'text-blue-600',   to: '/admin/students' },
    { icon: Building2,     label: 'Companies',           value: a.totalCompanies,    bg: 'bg-violet-50',  color: 'text-violet-600', to: '/admin/companies' },
    { icon: Briefcase,     label: 'Job Listings',        value: a.totalJobs,         bg: 'bg-emerald-50', color: 'text-emerald-600',to: '/admin/jobs' },
    { icon: FileText,      label: 'Job Applications',    value: a.totalApplications, bg: 'bg-orange-50',  color: 'text-orange-600', to: '/admin/applications' },
    { icon: TrendingUp,    label: 'Placed Students',     value: a.placedStudents,    bg: 'bg-green-50',   color: 'text-green-600',  to: '/admin/students' },
    { icon: AlertTriangle, label: 'Pending Jobs',        value: a.pendingJobs,       bg: 'bg-yellow-50',  color: 'text-yellow-600', to: '/admin/jobs' },
  ];

  const ipStatCards = [
    { icon: GraduationCap, label: 'Intern Applications', value: ipStats.totalApplications, bg: 'bg-indigo-50',  color: 'text-indigo-600', to: '/admin/iplatform' },
    { icon: BookOpen,      label: 'Active Interns',      value: ipStats.activeEnrollments, bg: 'bg-cyan-50',    color: 'text-cyan-600',   to: '/admin/iplatform' },
    { icon: Award,         label: 'Intern Completed',    value: ipStats.completedEnrollments, bg: 'bg-purple-50', color: 'text-purple-600', to: '/admin/iplatform' },
    { icon: MessageSquare, label: 'New Enquiries',       value: enquiryCount,              bg: 'bg-pink-50',    color: 'text-pink-600',   to: '/admin/enquiries' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1e3a5f] rounded-2xl p-6 text-white flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 48, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.5))' }} />
          <div>
            <p className="text-slate-400 text-sm">Admin Control Panel</p>
            <h1 className="text-2xl font-black">Platform Overview</h1>
            <p className="text-slate-400 text-xs mt-0.5">All statistics pulled live from the database</p>
          </div>
        </div>
        {/* Quick download buttons */}
        <div className="flex gap-2">
          <button onClick={handleDownloadJobApps} disabled={downloadingApps}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition disabled:opacity-60">
            {downloadingApps ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Job Apps CSV
          </button>
          <button onClick={handleDownloadInternStudents} disabled={downloadingStudents}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500/80 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl transition disabled:opacity-60">
            {downloadingStudents ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Intern CSV
          </button>
        </div>
      </div>

      {/* Job Portal Stats */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Job Portal</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {jobStats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      {/* Internship Platform Stats */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Hiresnix Internship Platform</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ipStatCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      {/* Placement rate */}
      {a.totalStudents > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Job Portal Placement Rate</h2>
            <span className="text-2xl font-black text-emerald-600">{Math.round((a.placedStudents / a.totalStudents) * 100)}%</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Placed: {a.placedStudents} students</span>
            <span>Total: {a.totalStudents} students</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, (a.placedStudents / a.totalStudents) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { to: '/admin/iplatform', label: '🎓 Manage Internship Applications', desc: 'Approve / reject student applications', color: 'border-blue-200 bg-blue-50' },
          { to: '/admin/applications', label: '💼 Job Applications + CSV', desc: 'View and download all job applications', color: 'border-emerald-200 bg-emerald-50' },
          { to: '/admin/enquiries', label: '📬 Landing Page Enquiries', desc: `${enquiryCount} unread messages from students`, color: 'border-purple-200 bg-purple-50' },
        ].map(q => (
          <Link key={q.to} to={q.to} className={`p-4 rounded-2xl border-2 ${q.color} hover:shadow-md transition-all`}>
            <p className="font-bold text-gray-900 text-sm">{q.label}</p>
            <p className="text-xs text-gray-500 mt-1">{q.desc}</p>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold mt-2">Open <ChevronRight size={11} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
