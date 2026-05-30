// src/pages/admin/AdminIPlatform.tsx
// Full Hiresnix Internship Platform management for admin
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { toast } from 'sonner';
import {
  Users, BookOpen, CheckCircle, Clock, Plus, Trash2,
  Loader2, Award, Download, Star, ChevronDown, ChevronUp,
  GraduationCap, Globe, FileText, Video, Link2, RefreshCw
} from 'lucide-react';
import client from '../../api/client';

// ── CSV Download helper ───────────────────────────────────────────
function downloadCSV(data: any[], filename: string) {
  if (!data.length) { toast.error('No data to export'); return; }
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(','),
    ...data.map(row => keys.map(k => {
      const val = row[k] ?? '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${filename}`);
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-xs font-medium">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value ?? 0}</p>
      </div>
    </div>
  );
}

// ── STATUS BADGE ──────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-700',
    Active: 'bg-blue-100 text-blue-700',
    Completed: 'bg-purple-100 text-purple-700',
    Dropped: 'bg-gray-100 text-gray-600',
  };
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

// ── TABS ──────────────────────────────────────────────────────────
type Tab = 'applications' | 'students' | 'domains' | 'resources';

export function AdminIPlatform() {
  const [tab, setTab] = useState<Tab>('applications');
  const [stats, setStats] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [completeModal, setCompleteModal] = useState<any>(null);
  const [offerModal, setOfferModal] = useState<any>(null);
  const [generatingOffer, setGeneratingOffer] = useState(false);

  // Forms
  const [domainForm, setDomainForm] = useState({ name: '', description: '', icon: '💻', duration: '8 Weeks', totalSeats: 30 });
  const [resForm, setResForm] = useState({ domainId: '', title: '', type: 'Video', url: '', description: '', week: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, e, d, r] = await Promise.all([
        adminApi.getIPlatformStats(),
        adminApi.getIPlatformApplications(),
        adminApi.getIPlatformEnrollments(),
        adminApi.getIPlatformDomains(),
        adminApi.getIPlatformResources(),
      ]);
      setStats(s.data || {});
      setApplications(a.data || []);
      setEnrollments(e.data || []);
      setDomains(d.data || []);
      setResources(r.data || []);
    } catch (e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Approve / Reject application ──────────────────────────────
  const handleAppAction = async (id: number, status: 'Approved' | 'Rejected') => {
    const note = status === 'Rejected' ? prompt('Reason for rejection (optional):') || '' : '';
    setActionId(`app-${id}`);
    try {
      await adminApi.approveIPlatformApplication(id, { status, adminNote: note });
      toast.success(`Application ${status}!`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setActionId(null); }
  };

  // ── Mark enrollment complete ──────────────────────────────────
  const handleMarkComplete = async () => {
    if (!completeModal) return;
    setActionId(`complete-${completeModal.id}`);
    try {
      await adminApi.markEnrollmentComplete(completeModal.id, {
        adminRemark: completeModal.adminRemark || '',
        lorPerformance: completeModal.lorPerformance || 'Excellent',
        lorHighlights: completeModal.lorHighlights || 'Demonstrated excellent skills and dedication.',
      });
      toast.success('Marked complete! Certificate generated 🎉');
      setCompleteModal(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setActionId(null); }
  };

  // ── Create domain ─────────────────────────────────────────────
  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createIPlatformDomain(domainForm);
      toast.success('Domain created!');
      setDomainForm({ name: '', description: '', icon: '💻', duration: '8 Weeks', totalSeats: 30 });
      load();
    } catch { toast.error('Failed to create domain'); }
  };

  // ── Add resource ──────────────────────────────────────────────
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.addIPlatformResource({ ...resForm, domainId: Number(resForm.domainId) });
      toast.success('Resource added!');
      setResForm({ domainId: '', title: '', type: 'Video', url: '', description: '', week: 1 });
      load();
    } catch { toast.error('Failed to add resource'); }
  };

  // ── CSV Downloads ─────────────────────────────────────────────
  const downloadApplicationsCSV = () => {
    const rows = applications.map(a => ({
      Name: a.studentName, Email: a.email, Phone: a.phone || '',
      College: a.college || '', Year: a.year || '', Domain: a.domain?.name || '',
      Status: a.status, AppliedOn: new Date(a.createdAt).toLocaleDateString(),
      WhyJoin: a.whyJoin || '', AdminNote: a.adminNote || '',
    }));
    downloadCSV(rows, 'hiresnix_internship_applications.csv');
  };

  const downloadEnrollmentsCSV = () => {
    const rows = enrollments.map(e => ({
      Name: e.studentName, Email: e.email, Domain: e.domain?.name || '',
      Progress: `${e.progress}%`, Status: e.status, TasksSubmitted: (e.taskLogs || []).length,
      StartDate: e.startDate ? new Date(e.startDate).toLocaleDateString() : '',
      CompletedOn: e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '',
      AdminRemark: e.adminRemark || '',
    }));
    downloadCSV(rows, 'hiresnix_internship_students.csv');
  };

  const tabs = [
    { id: 'applications' as Tab, label: '📋 Applications', count: stats.pendingApplications },
    { id: 'students'     as Tab, label: '🎓 Students',     count: stats.activeEnrollments },
    { id: 'domains'      as Tab, label: '🗂 Domains',      count: null },
    { id: 'resources'    as Tab, label: '📚 Resources',    count: null },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1e3a5f] rounded-2xl p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/hiresnix-logo.png" alt="" style={{ height: 44, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.5))' }} />
          <div>
            <h1 className="text-xl font-black">Internship Platform</h1>
            <p className="text-slate-400 text-sm">Manage domains, applications, and student progress</p>
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={stats.totalApplications} icon="📋" color="bg-blue-50" />
        <StatCard label="Pending Review"     value={stats.pendingApplications} icon="⏳" color="bg-amber-50" />
        <StatCard label="Active Students"    value={stats.activeEnrollments}  icon="🎓" color="bg-emerald-50" />
        <StatCard label="Completed"          value={stats.completedEnrollments} icon="🏆" color="bg-purple-50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 bg-white rounded-t-xl px-3 pt-3">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 -mb-px ${
              tab === t.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16 bg-white rounded-b-xl">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      )}

      {/* ── APPLICATIONS ─────────────────────────────────────── */}
      {!loading && tab === 'applications' && (
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{applications.length} total applications</p>
            <button onClick={downloadApplicationsCSV}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
              <Download size={13} /> Export CSV
            </button>
          </div>
          {applications.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
              <p>No applications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {applications.map((app: any) => (
                <div key={app.id} className="px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">
                        {app.studentName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{app.studentName}</p>
                          <Badge status={app.status} />
                        </div>
                        <p className="text-xs text-gray-500">{app.email} · {app.phone}</p>
                        <p className="text-xs text-gray-500">{app.college} · {app.year}</p>
                        <p className="text-sm font-medium text-blue-600 mt-0.5">{app.domain?.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</p>
                      <div className="flex gap-2">
                        {app.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleAppAction(app.id, 'Approved')}
                              disabled={actionId === `app-${app.id}`}
                              className="flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition">
                              {actionId === `app-${app.id}` ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleAppAction(app.id, 'Rejected')}
                              disabled={actionId === `app-${app.id}`}
                              className="flex items-center gap-1 text-xs font-bold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition">
                              ✕ Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => setOfferModal({
                            applicationId: app.id,
                            candidateName: app.studentName || '',
                            role: `${app.domain?.name || 'Internship'} Intern`,
                            companyName: 'Hiresnix',
                            salary: 'Unpaid Internship',
                            offerLetterDate: app.offerLetterDate || todayInputValue(),
                            joiningDate: app.offerJoiningDate || '',
                            datesLocked: Boolean(app.offerLetterDate || app.offerJoiningDate),
                          })} className="flex items-center gap-1 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition">
                          <FileText size={11} /> Offer Letter
                        </button>
                      </div>
                    </div>
                  </div>
                  {app.whyJoin && (
                    <div className="mt-2 ml-13 pl-13">
                      <button onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        {expandedId === app.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        Why they want to join
                      </button>
                      {expandedId === app.id && (
                        <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-lg p-3 italic">"{app.whyJoin}"</p>
                      )}
                    </div>
                  )}
                  {app.adminNote && app.status === 'Rejected' && (
                    <p className="text-xs text-red-500 mt-1 ml-13 pl-13">Note: {app.adminNote}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STUDENTS (ENROLLMENTS) ──────────────────────────── */}
      {!loading && tab === 'students' && (
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{enrollments.length} enrolled students</p>
            <button onClick={downloadEnrollmentsCSV}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
              <Download size={13} /> Export CSV
            </button>
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p>No enrolled students yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {enrollments.map((e: any) => (
                <div key={e.id} className="px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {e.studentName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900">{e.studentName}</p>
                          <Badge status={e.status} />
                        </div>
                        <p className="text-xs text-gray-500">{e.email}</p>
                        <p className="text-sm font-medium text-blue-600">{e.domain?.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-28 bg-gray-100 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${e.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-emerald-600">{e.progress}%</span>
                          </div>
                          <span className="text-xs text-gray-400">{(e.taskLogs || []).length} tasks submitted</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs text-gray-400">
                        Started {e.startDate ? new Date(e.startDate).toLocaleDateString() : '—'}
                      </p>
                      {e.status === 'Active' && (
                        <button
                          onClick={() => setCompleteModal({ id: e.id, name: e.studentName, adminRemark: '', lorPerformance: 'Excellent', lorHighlights: '' })}
                          className="flex items-center gap-1 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition">
                          <Award size={11} /> Mark Complete
                        </button>
                      )}
                      {e.status === 'Completed' && (
                        <span className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                          <CheckCircle size={12} /> Cert issued
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task logs preview */}
                  {(e.taskLogs || []).length > 0 && (
                    <div className="mt-3 ml-13">
                      <button onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        {expandedId === e.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        View submitted tasks ({(e.taskLogs || []).length})
                      </button>
                      {expandedId === e.id && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                          {[...(e.taskLogs || [])].reverse().map((log: any) => (
                            <div key={log.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                              <CheckCircle size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{log.title}</p>
                                <p className="text-xs text-gray-500">{log.description}</p>
                                {log.url && <a href={log.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">{log.url}</a>}
                                <p className="text-[10px] text-gray-400 mt-0.5">Week {log.week} · {new Date(log.submittedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DOMAINS ─────────────────────────────────────────── */}
      {!loading && tab === 'domains' && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Create Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <Plus size={16} className="text-emerald-500" /> Create Domain
            </h3>
            <form onSubmit={handleCreateDomain} className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Icon</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-center text-lg"
                    value={domainForm.icon} onChange={e => setDomainForm(p => ({ ...p, icon: e.target.value }))} />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Domain Name *</label>
                  <input required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Web Development" value={domainForm.name}
                    onChange={e => setDomainForm(p => ({ ...p, name: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="What will students learn?" value={domainForm.description}
                  onChange={e => setDomainForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Duration</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    value={domainForm.duration} onChange={e => setDomainForm(p => ({ ...p, duration: e.target.value }))}>
                    {['4 Weeks','6 Weeks','8 Weeks','10 Weeks','12 Weeks'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Total Seats</label>
                  <input type="number" min={1} max={200} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    value={domainForm.totalSeats} onChange={e => setDomainForm(p => ({ ...p, totalSeats: +e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition">
                <Plus size={14} /> Create Domain
              </button>
            </form>
          </div>

          {/* Domain List */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">{domains.length} domains</h3>
            {domains.map((d: any) => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <span className="text-2xl">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.duration} · {d.filledSeats}/{d.totalSeats} seats</p>
                </div>
                <button onClick={async () => { 
                    if (window.confirm(`Are you sure you want to delete the ${d.name} domain?`)) {
                      await adminApi.deleteIPlatformDomain(d.id); load(); 
                    }
                  }}
                  className="text-red-400 hover:text-red-600 transition p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {domains.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
                <p className="text-sm">No domains yet. Create your first one!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESOURCES ────────────────────────────────────────── */}
      {!loading && tab === 'resources' && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Add Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500" /> Add Resource
            </h3>
            <form onSubmit={handleAddResource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Domain *</label>
                <select required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={resForm.domainId} onChange={e => setResForm(p => ({ ...p, domainId: e.target.value }))}>
                  <option value="">Select domain</option>
                  {domains.map((d: any) => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={resForm.type} onChange={e => setResForm(p => ({ ...p, type: e.target.value }))}>
                    {['Video','PDF','Article','Assignment','Link'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Week</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={resForm.week} onChange={e => setResForm(p => ({ ...p, week: +e.target.value }))}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
                <input required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Resource title" value={resForm.title} onChange={e => setResForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL (YouTube / Drive / Link)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="https://..." value={resForm.url} onChange={e => setResForm(p => ({ ...p, url: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description (optional)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Brief description" value={resForm.description} onChange={e => setResForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm transition">
                <Plus size={14} /> Add Resource
              </button>
            </form>
          </div>

          {/* Resource List */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-sm">{resources.length} resources</h3>
            <div className="max-h-[600px] overflow-y-auto space-y-2">
              {resources.map((r: any) => {
                const iconMap: Record<string, any> = { Video: '🎬', PDF: '📄', Article: '📰', Assignment: '📝', Link: '🔗' };
                return (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <span>{iconMap[r.type] || '📎'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.domain?.name} · Week {r.week} · {r.type}</p>
                    </div>
                    <button onClick={async () => { await adminApi.deleteIPlatformResource(r.id); load(); }}
                      className="text-red-400 hover:text-red-600 transition p-1 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {resources.length === 0 && (
                <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
                  <p className="text-sm">No resources yet. Add your first one!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MARK COMPLETE MODAL ───────────────────────────────── */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-gray-900 text-lg mb-0.5">Mark Internship Complete</h3>
            <p className="text-gray-500 text-sm mb-4">{completeModal.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Remark</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Overall feedback about the student..."
                  value={completeModal.adminRemark}
                  onChange={e => setCompleteModal((p: any) => ({ ...p, adminRemark: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">LOR Performance</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  value={completeModal.lorPerformance}
                  onChange={e => setCompleteModal((p: any) => ({ ...p, lorPerformance: e.target.value }))}>
                  {['Excellent','Very Good','Good','Satisfactory'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">LOR Highlights</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="e.g. Demonstrated excellent React skills and delivered quality work on time..."
                  value={completeModal.lorHighlights}
                  onChange={e => setCompleteModal((p: any) => ({ ...p, lorHighlights: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleMarkComplete} disabled={!!actionId}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
                {actionId ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                Confirm & Generate Docs
              </button>
              <button onClick={() => setCompleteModal(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GENERATE OFFER MODAL ───────────────────────────────── */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-gray-900 text-lg mb-0.5">Generate Offer Letter</h3>
            <p className="text-gray-500 text-sm mb-4">Create a Hiresnix PDF offer letter for this candidate.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setGeneratingOffer(true);
              try {
                const res = await client.post('/admin/generate-offer', offerModal, { responseType: 'blob' });
                const url = URL.createObjectURL(res.data);
                const a = document.createElement('a'); a.href = url; a.download = `Hiresnix_Offer_${offerModal.candidateName}.pdf`; a.click();
                URL.revokeObjectURL(url);
                toast.success('Offer Letter Generated!');
                setOfferModal(null);
              } catch {
                toast.error('Failed to generate offer letter');
              } finally { setGeneratingOffer(false); }
            }} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Candidate Name</label>
                <input required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={offerModal.candidateName} onChange={e => setOfferModal({ ...offerModal, candidateName: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Role / Domain</label>
                <input required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={offerModal.role} onChange={e => setOfferModal({ ...offerModal, role: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Stipend / Salary</label>
                  <input required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Unpaid or ₹5000" value={offerModal.salary} onChange={e => setOfferModal({ ...offerModal, salary: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Joining Date</label>
                  <input required type="date" disabled={offerModal.datesLocked} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    value={offerModal.joiningDate} onChange={e => setOfferModal({ ...offerModal, joiningDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Offer Letter Date</label>
                <input required type="date" disabled={offerModal.datesLocked} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  value={offerModal.offerLetterDate} onChange={e => setOfferModal({ ...offerModal, offerLetterDate: e.target.value })} />
                {offerModal.datesLocked && <p className="text-[11px] text-gray-400 mt-1">Dates are locked because this offer letter was already generated.</p>}
              </div>
              <div className="flex gap-3 mt-5">
                <button type="submit" disabled={generatingOffer}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  {generatingOffer ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Download PDF
                </button>
                <button type="button" onClick={() => setOfferModal(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
