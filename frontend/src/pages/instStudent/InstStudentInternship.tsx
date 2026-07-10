// src/pages/instStudent/InstStudentInternship.tsx
import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle, Clock, Award, ChevronRight, Send, BookOpen, AlertCircle, Download, Loader2 } from 'lucide-react';
import { instStudentInternshipApi } from '../../api/instStudent';
import { useInstStudentStore } from '../../store/useInstStudentStore';
import { toast } from 'sonner';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.instStudent;

type View = 'home' | 'apply' | 'progress' | 'resources';

export function InstStudentInternship() {
  const { student } = useInstStudentStore();
  const [view, setView] = useState<View>('home');
  const [domains, setDomains] = useState<any[]>([]);
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [form, setForm] = useState({ phone: '', college: student?.institutionName || '', year: '', whyJoin: '' });

  // Check if hiresnixToken exists
  const hasToken = !!localStorage.getItem('hirenix_token');

  const loadData = async () => {
    setLoading(true);
    try {
      const [domRes, appRes] = await Promise.all([
        instStudentInternshipApi.getDomains(),
        instStudentInternshipApi.getMyApplication(),
      ]);
      setDomains(domRes.data || []);
      setAppData(appRes.data || null);
    } catch (err: any) {
      if (err.response?.status !== 404) toast.error('Failed to load internship data');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (hasToken) loadData(); else setLoading(false); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) { toast.error('Please select a domain'); return; }
    setApplying(true);
    try {
      await instStudentInternshipApi.apply({
        domainId: parseInt(selectedDomain),
        phone: form.phone,
        college: form.college || student?.institutionName,
        year: form.year,
        whyJoin: form.whyJoin,
      });
      toast.success('Application submitted! Admin will review soon.');
      await loadData();
      setView('home');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally { setApplying(false); }
  };

  if (!hasToken) return (
    <div className="space-y-6">
      <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <AlertCircle size={40} className="mx-auto mb-4" style={{ color: C.accent }} />
        <h2 className="text-white font-bold text-lg mb-2">Session Refresh Required</h2>
        <p className="text-sm mb-4" style={{ color: '#64748b' }}>Please logout and login again to activate internship access.</p>
        <button onClick={() => { localStorage.clear(); window.location.href = '/inst-login'; }}
          className="px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: C.accent }}>
          Login Again
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.accent} transparent transparent transparent` }} />
    </div>
  );

  const application = appData?.application;
  const enrollment  = appData?.enrollment;

  // ── HOME VIEW ─────────────────────────────────────────────────
  if (view === 'home') return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>Hiresnix Internship Platform</p>
          <h1 className="text-2xl font-black text-white mt-1">Internship Program</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Apply for internships, track your progress, earn certificates</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(245,158,11,0.15)', color: C.accent, border: `1px solid rgba(245,158,11,0.3)` }}>
            🏫 {student?.institutionName}
          </div>
        </div>
      </div>

      {/* No application yet */}
      {!application && (
        <div className="rounded-2xl p-6 text-center space-y-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Briefcase size={40} className="mx-auto opacity-40 text-white" />
          <div>
            <p className="text-white font-semibold">No internship application yet</p>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Apply now to start your internship journey</p>
          </div>
          <button onClick={() => setView('apply')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white text-sm transition"
            style={{ background: `linear-gradient(135deg,${C.accent},#d97706)` }}>
            <Send size={14} /> Apply Now
          </button>
        </div>
      )}

      {/* Application status */}
      {application && (
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-sm">My Application</h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{
              background: application.status === 'Approved' ? 'rgba(16,185,129,0.15)' : application.status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              color: application.status === 'Approved' ? '#34d399' : application.status === 'Rejected' ? '#f87171' : '#fbbf24',
            }}>
              {application.status === 'Approved' ? '✅ ' : application.status === 'Rejected' ? '❌ ' : '⏳ '}{application.status}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `rgba(245,158,11,0.2)` }}>
              <Briefcase size={18} style={{ color: C.accent }} />
            </div>
            <div>
              <p className="font-semibold text-white">{application.domain?.name}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Applied {new Date(application.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          {application.adminNote && application.status === 'Rejected' && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
              Note: {application.adminNote}
            </p>
          )}
        </div>
      )}

      {/* Active enrollment */}
      {enrollment && (
        <div className="space-y-3">
          {/* Progress card */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">Internship Progress</h2>
              <span className="text-xl font-black" style={{ color: C.accent }}>{enrollment.progress}%</span>
            </div>
            <div className="w-full rounded-full h-2 mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${enrollment.progress}%`, background: `linear-gradient(90deg,${C.accent},#f97316)` }} />
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: '#64748b' }}>
              <span>Domain: {enrollment.domain?.name}</span>
              <span>Tasks: {(enrollment.taskLogs || []).length} submitted</span>
            </div>
          </div>

          {/* Action cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BookOpen, label: 'Resources', action: () => setView('resources'), accent: '#3B82F6' },
              { icon: CheckCircle, label: 'Progress', action: () => setView('progress'), accent: '#10B981' },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className="rounded-2xl p-4 text-left transition hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${item.accent}22`, border: `1px solid ${item.accent}33` }}>
                  <item.icon size={16} style={{ color: item.accent }} />
                </div>
                <p className="text-white text-sm font-semibold">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed — show certificate */}
      {enrollment?.status === 'Completed' && enrollment?.certificate && (
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award size={24} style={{ color: '#34d399' }} />
              <div>
                <p className="font-bold text-white">Certificate Earned! 🎉</p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {enrollment.certificate.certificateNo}
                </p>
              </div>
            </div>
            <a href={instStudentInternshipApi.downloadCertificate(enrollment.id)}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition"
              style={{ background: '#10B981' }}>
              <Download size={13} /> Download
            </a>
          </div>
        </div>
      )}
    </div>
  );

  // ── APPLY VIEW ────────────────────────────────────────────────
  if (view === 'apply') return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="p-2 rounded-xl hover:bg-white/10 transition">
          <ChevronRight size={16} className="text-gray-400 rotate-180" />
        </button>
        <h1 className="text-xl font-black text-white">Apply for Internship</h1>
      </div>

      <form onSubmit={handleApply} className="space-y-4 rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>
            Select Domain *
          </label>
          <select value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}
            required className="dark-input w-full px-4 py-2.5 rounded-xl text-sm">
            <option value="">Choose internship domain...</option>
            {domains.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name} — {d.duration}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Phone *</label>
          <input type="tel" required value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="dark-input w-full px-4 py-2.5 rounded-xl text-sm" placeholder="Your phone number" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>College / Institution</label>
          <input type="text" value={form.college}
            onChange={e => setForm(p => ({ ...p, college: e.target.value }))}
            className="dark-input w-full px-4 py-2.5 rounded-xl text-sm" placeholder="Your institution name" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Year of Study</label>
          <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
            className="dark-input w-full px-4 py-2.5 rounded-xl text-sm">
            <option value="">Select year...</option>
            {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Post Graduate'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Why do you want to join? *</label>
          <textarea rows={4} required value={form.whyJoin}
            onChange={e => setForm(p => ({ ...p, whyJoin: e.target.value }))}
            className="dark-input w-full px-4 py-2.5 rounded-xl text-sm resize-none"
            placeholder="Tell us about your interest and what you hope to learn..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setView('home')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 transition hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button type="submit" disabled={applying}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg,${C.accent},#d97706)` }}>
            {applying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {applying ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );

  // ── PROGRESS VIEW ────────────────────────────────────────────
  if (view === 'progress') return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="p-2 rounded-xl hover:bg-white/10 transition">
          <ChevronRight size={16} className="text-gray-400 rotate-180" />
        </button>
        <h1 className="text-xl font-black text-white">My Progress</h1>
      </div>

      {enrollment?.taskLogs?.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Clock size={32} className="mx-auto mb-3 opacity-30 text-white" />
          <p className="text-white font-semibold">No tasks submitted yet</p>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Submit tasks from the Resources section</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(enrollment?.taskLogs || []).map((log: any, i: number) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white text-sm">{log.title}</p>
                  {log.description && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{log.description}</p>}
                  {log.url && <a href={log.url} target="_blank" rel="noreferrer" className="text-xs mt-1 block" style={{ color: C.accent }}>{log.url}</a>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                    Week {log.week}
                  </span>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    {log.submittedAt ? new Date(log.submittedAt).toLocaleDateString('en-IN') : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── RESOURCES VIEW ───────────────────────────────────────────
  if (view === 'resources') return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="p-2 rounded-xl hover:bg-white/10 transition">
          <ChevronRight size={16} className="text-gray-400 rotate-180" />
        </button>
        <h1 className="text-xl font-black text-white">Learning Resources</h1>
      </div>
      <ResourcesList enrollment={enrollment} />
    </div>
  );

  return null;
}

function ResourcesList({ enrollment }: any) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const C = PORTAL_COLORS.instStudent;

  useEffect(() => {
    instStudentInternshipApi.getResources()
      .then(r => setResources(r.data || []))
      .catch(() => toast.error('Failed to load resources'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.accent} transparent transparent transparent` }} /></div>;

  if (!resources.length) return (
    <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <BookOpen size={32} className="mx-auto mb-3 opacity-30 text-white" />
      <p className="text-white">No resources available yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {resources.map((r: any) => (
        <div key={r.id} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                  Week {r.week}
                </span>
                <span className="text-xs" style={{ color: '#64748b' }}>{r.type}</span>
              </div>
              <p className="font-semibold text-white text-sm">{r.title}</p>
              {r.description && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{r.description}</p>}
            </div>
            {r.url && (
              <a href={r.url} target="_blank" rel="noreferrer"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition"
                style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                Open →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
