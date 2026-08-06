// src/pages/student/StudentInternships.tsx
// ⚠️ EXISTING CODE PRESERVED — only extended below with new sections
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Clock, Users, ChevronRight, Loader2, GraduationCap, CheckCircle,
  BookOpen, Download, Brain, Calendar, Target, FileText, Award,
  Linkedin, MessageCircle, AlertCircle, TrendingUp, Briefcase,
  ExternalLink, Github, ClipboardList, Flame, BarChart2, Lock, Unlock,
} from 'lucide-react';
import client from '../../api/client';
import { instInternshipClient } from '../../api/instStudent';
import { LogicBuilder } from './LogicBuilder';

// ═══════════════════════════════════════════════════════════════════
// ── EXISTING IPLATFORM PANEL (UNCHANGED) ──────────────────────────
// ═══════════════════════════════════════════════════════════════════
function IPlatformPanel() {
  const [domains, setDomains]     = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [myApp, setMyApp]         = useState<any>(null);
  const [selected, setSelected]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [applying, setApplying]   = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: '', college: '', year: '4th Year', whyJoin: '', institutionName: '', careerId: '', startDate: '', duration: '6', endDate: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', url: '', week: 1 });
  const [submittingTask, setSubmittingTask] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [resources, setResources] = useState<any[]>([]);

  const load = async () => {
    const token = localStorage.getItem('hirenix_token') || localStorage.getItem('hx_student_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [d, a, p, instApp, instList] = await Promise.all([
        client.get('/iplatform/domains', { headers }).then(r => r.data),
        client.get('/iplatform/my-application', { headers }).then(r => r.data).catch(() => ({ data: null })),
        client.get('/iplatform/my-progress', { headers }).then(r => r.data).catch(() => ({ data: null })),
        client.get('/iplatform/institution-student-app', { headers }).then(r => r.data).catch(() => ({ data: null })),
        client.get('/public/institutions-list', { headers }).then(r => r.data).catch(() => ({ data: [] })),
      ]);
      setDomains(d.data || []);
      setInstitutions(instList.data || []);

      if (a.data) {
        setMyApp(a.data);
      } else if (instApp?.data) {
        const instAppData = instApp.data;
        let enrollmentData = null;
        if (instAppData.status === 'Approved') {
          try {
            const enrollRes = await client.get('/enrollments/my').then(r => r.data);
            const enrollments = enrollRes?.data || enrollRes || [];
            if (Array.isArray(enrollments) && enrollments.length > 0) {
              enrollmentData = enrollments[0];
            }
          } catch {}
        }
        setMyApp({
          application: {
            status: instAppData.status || 'Pending',
            domain: { name: instAppData.domain || 'Internship Program' },
            isInstitutionApply: instAppData.status !== 'Approved',
            institutionName: instAppData.institutionName,
            adminNote: instAppData.status === 'Approved' ? null : 'Applied via institution portal',
          },
          enrollment: enrollmentData,
        });
      }
      setResources(p.data?.resources || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setApplying(true);
    try {
      const instToken = localStorage.getItem('hx_inst_student_token');
      const studentToken = localStorage.getItem('hx_student_token') || localStorage.getItem('hirenix_token');
      const isInstStudent = !!instToken && !studentToken;
      const headers = studentToken ? { Authorization: `Bearer ${studentToken}` } : {};
      const payload = {
        domainId: selected.id,
        phone: form.phone,
        college: form.college,
        year: form.year,
        whyJoin: form.whyJoin,
        ...(form.institutionName && { institutionName: form.institutionName }),
        ...(form.careerId && { careerId: form.careerId }),
        ...(form.startDate && { startDate: form.startDate }),
        duration: form.duration !== 'custom' ? form.duration : undefined,
        ...(form.duration === 'custom' && form.endDate && { endDate: form.endDate }),
      };
      if (isInstStudent) {
        await instInternshipClient.post('/iplatform/apply', payload);
      } else {
        await client.post('/iplatform/apply', payload, { headers });
      }
      toast.success('Application submitted! Admin will review soon.');
      load();
      setSelected(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally { setApplying(false); }
  };

  const downloadDoc = async (type: string, enrollId: number | string, name: string) => {
    setDownloading(`${type}-${enrollId}`);
    try {
      let res;
      const endpoints = type === 'completion'
        ? [`/iplatform/completion-letter/${enrollId}/pdf`, `/iplatform/completion/${enrollId}/pdf`, `/iplatform/completion-letter/${enrollId}`, `/iplatform/completion/${enrollId}`]
        : type === 'offer-letter'
        ? [`/iplatform/offer-letter/${enrollId}/pdf`, `/iplatform/generate-offer-pdf/${enrollId}`]
        : [`/iplatform/${type}/${enrollId}/pdf`, `/iplatform/${type}/${enrollId}`];

      let success = false;
      for (const url of endpoints) {
        try { res = await client.get(url, { responseType: 'blob' }); success = true; break; } catch {}
      }
      if (!success || !res) throw new Error('Not available yet');
      const urlObj = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = urlObj; a.download = `hiresnix-${type}-${name}.pdf`; a.click();
      URL.revokeObjectURL(urlObj);
      toast.success('PDF downloaded!');
    } catch { toast.error('Not available yet'); }
    finally { setDownloading(null); }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return toast.error('Task title is required');
    setSubmittingTask(true);
    try {
      await client.post('/iplatform/task-submit', taskForm);
      toast.success('Task submitted successfully!');
      setTaskForm({ title: '', description: '', url: '', week: 1 });
      setShowTaskForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit task');
    } finally { setSubmittingTask(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={28} /></div>;

  const app = myApp?.application;
  const enrollment = myApp?.enrollment;

  if (app) return (
    <div className="max-w-2xl mx-auto">
      {app.isInstitutionApply && (
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div style={{ fontSize: '2rem' }}>🏫</div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Applied via Institution Portal</h3>
              <p className="text-gray-600 text-sm">{app.domain?.name}</p>
            </div>
            <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
              app.status === 'Approved' ? 'bg-green-100 text-green-700' :
              app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>{app.status}</span>
          </div>
          <p className="text-sm text-gray-600">
            You have already applied through <strong>{app.institutionName || 'your institution'}</strong>.
            Your application is being reviewed. You cannot apply again from here.
          </p>
        </div>
      )}

      {!app.isInstitutionApply && <div className={`rounded-2xl border-2 p-6 mb-4 ${
        app.status === 'Approved' ? 'border-green-200 bg-green-50' :
        app.status === 'Rejected' ? 'border-red-200 bg-red-50' :
        'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ fontSize: '2rem' }}>{app.status === 'Approved' ? '✅' : app.status === 'Rejected' ? '❌' : '⏳'}</div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {app.status === "Approved" ? "You're Enrolled!" : app.status === "Rejected" ? "Application Rejected" : "Application Under Review"}
            </h3>
            <p className="text-gray-600 text-sm">{app.domain?.name} Internship</p>
            {app.status !== "Approved" && app.status !== "Rejected" && (
              <>
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Profile Verification</h4>
                  <p className="text-sm text-gray-700">Please send the following on <strong>WhatsApp</strong> or <strong>Email</strong>:</p>
                  <ul className="mt-2 list-disc ml-5 text-sm text-gray-700 space-y-1">
                    <li>Updated Resume (PDF)</li>
                    <li>LinkedIn Profile URL</li>
                    <li>GitHub Profile URL (if available)</li>
                    <li>Brief Introduction (Skills, Projects & Career Interests)</li>
                  </ul>
                  <div className="mt-3 text-sm text-gray-800">
                    <p><strong>📱 WhatsApp:</strong> +91 95291 20977</p>
                    <p><strong>📧 Email:</strong> hr@hiresnix.co.in</p>
                  </div>
                  <p className="mt-3 text-xs text-gray-600">
                    Please mention your <strong>Full Name</strong> and <strong>Registered Email Address</strong> while sending your documents <strong>after Profile Verification</strong> You will receive your <strong>Offer Letter</strong> From Hiresnix Team.
                  </p>
                </div>
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="font-semibold text-green-900 mb-2">🚀 Internship Benefits</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>✅ 3 Industry-Level Projects</li>
                    <li>✅ Professional Portfolio Building</li>
                    <li>✅ Internship Dashboard Access</li>
                    <li>✅ Daily Work Log Tracking</li>
                    <li>✅ Internship Completion Certificate (Eligibility Based)</li>
                    <li>✅ Internship Completion Letter (Eligibility Based)</li>
                    <li>✅ Performance-Based Letter of Recommendation</li>
                    <li>✅ Job Assistance After Successful Completion</li>
                  </ul>
                </div>
              </>
            )}
            <p className="text-gray-600 text-sm">{app.domain?.name} Internship</p>
          </div>
          <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${
            app.status === 'Approved' ? 'bg-green-100 text-green-700' :
            app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`}>{app.status}</span>
        </div>
        {app.adminNote && <p className="text-sm text-gray-600 italic">Note: {app.adminNote}</p>}
      </div>}

      {enrollment && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><BookOpen size={16} /> Training Progress</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Overall Progress</span>
            <span className="text-sm font-bold text-blue-600">{enrollment.progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
            <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-gray-500 block">Status</span>
              <span className={`font-semibold ${enrollment.status === 'Completed' ? 'text-green-600' : 'text-blue-600'}`}>{enrollment.status}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="text-gray-500 block">Tasks Submitted</span>
              <span className="font-semibold text-gray-800">{(enrollment.taskLogs || []).length}</span>
            </div>
          </div>
          {/* Offer Letter — visible to all enrolled students */}
          {app?.offerLetterId && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-1"><Download size={14} className="text-blue-500" /> Your Offer Letter</h5>
              <button
                onClick={() => downloadDoc('offer-letter', app.offerLetterId, enrollment.studentName || '')}
                disabled={downloading === `offer-letter-${app.offerLetterId}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-50 text-sm font-semibold text-blue-800">
                {downloading === `offer-letter-${app.offerLetterId}`
                  ? <Loader2 size={14} className="animate-spin text-blue-600" />
                  : <span>📄</span>}
                Download Offer Letter
              </button>
              <p className="text-xs text-amber-600 mt-2 font-semibold">⚠️ Post your Offer Letter on LinkedIn within 48 hours and tag Hiresnix!</p>
            </div>
          )}

          {enrollment.status !== 'Completed' && (
            <div className="mt-3">
              <button onClick={() => setShowTaskForm(!showTaskForm)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5 font-semibold">
                Submit Daily Task <ChevronRight size={11} className={`transition-transform ${showTaskForm ? 'rotate-90' : ''}`} />
              </button>
              {showTaskForm && (
                <form onSubmit={handleTaskSubmit} className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex gap-2">
                    <input required type="text" placeholder="Task Title *" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <select value={taskForm.week} onChange={e => setTaskForm(p => ({ ...p, week: Number(e.target.value) }))} className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-500">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(w => <option key={w} value={w}>Week {w}</option>)}
                    </select>
                  </div>
                  <textarea rows={2} placeholder="What did you work on today?" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                  <input type="url" placeholder="Project Link / GitHub URL (Optional)" value={taskForm.url} onChange={e => setTaskForm(p => ({ ...p, url: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  <button type="submit" disabled={submittingTask} className="w-full flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-lg transition mt-1">
                    {submittingTask && <Loader2 size={11} className="animate-spin" />} Submit Task
                  </button>
                </form>
              )}
            </div>
          )}
          {resources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-1"><BookOpen size={16} className="text-blue-500" /> Study Resources</h5>
              <div className="space-y-2">
                {resources.map(res => (
                  <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="block p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-800">{res.title}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Week {res.week}</span>
                    </div>
                    {res.description && <p className="text-xs text-gray-500 mt-1">{res.description}</p>}
                  </a>
                ))}
              </div>
            </div>
          )}
          {enrollment.status === 'Completed' && (
            <div>
              <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Download Your Documents</h5>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'certificate', label: 'Certificate', emoji: '🏆' },
                  { type: 'completion', label: 'Completion Letter', emoji: '📄' },
                  { type: 'lor', label: 'LOR', emoji: '✉️' },
                ].map(({ type, label, emoji }) => (
                  <button key={type}
                    onClick={() => downloadDoc(type, enrollment.id, enrollment.studentName || '')}
                    disabled={downloading === `${type}-${enrollment.id}`}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all active:scale-95 disabled:opacity-50">
                    {downloading === `${type}-${enrollment.id}`
                      ? <Loader2 size={18} className="animate-spin text-green-600" />
                      : <span style={{ fontSize: '1.4rem' }}>{emoji}</span>}
                    <span className="text-xs font-semibold text-green-800 text-center">{label}</span>
                    <Download size={11} className="text-green-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NEW EXTENDED SECTIONS (added below existing content) ── */}
      {enrollment && <InternshipExtendedSections enrollment={enrollment} app={app} onReload={load} />}

      {/* Community Section — shown for all enrolled students */}
      <CommunitySection />
    </div>
  );

  if (selected) return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-6">
      <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-sm mb-4 flex items-center gap-1">← Back to domains</button>
      <div className="flex items-center gap-3 mb-5 p-4 bg-blue-50 rounded-xl">
        <span style={{ fontSize: '2rem' }}>{selected.icon}</span>
        <div>
          <h3 className="font-bold text-gray-900">{selected.name}</h3>
          <p className="text-blue-600 text-sm">{selected.duration}</p>
        </div>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Application Form</h2>
      <form onSubmit={handleApply} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
          <input required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="9876543210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">College / University</label>
          <input required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Your college name" value={form.college} onChange={e => setForm(p => ({ ...p, college: e.target.value }))} />
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 space-y-3">
          <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">🏫 Institution Details <span className="font-normal text-blue-400">(Optional)</span></p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Institution</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              value={form.institutionName} onChange={e => setForm(p => ({ ...p, institutionName: e.target.value }))}>
              <option value="">-- Not from any institution --</option>
              {institutions.map((inst: any) => (
                <option key={inst.id} value={inst.institutionName}>{inst.institutionName}</option>
              ))}
            </select>
          </div>
          {form.institutionName && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Career ID / Student ID</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                placeholder="e.g. HX-ABC-2026-0001"
                value={form.careerId} onChange={e => setForm(p => ({ ...p, careerId: e.target.value.toUpperCase() }))} />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Year</label>
          <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
            {['1st Year','2nd Year','3rd Year','4th Year','Final Year / Passout'].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Why do you want to join?</label>
          <textarea required rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Tell us about your motivation..." value={form.whyJoin} onChange={e => setForm(p => ({ ...p, whyJoin: e.target.value }))} />
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 space-y-3">
          <p className="text-xs text-blue-600 font-semibold">📅 Internship Schedule <span className="font-normal text-blue-400">(Optional)</span></p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Preferred Start Date</label>
            <input type="date" min={new Date().toISOString().slice(0,10)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Internship Duration</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}>
              <option value="6">6 Months (Recommended)</option>
              <option value="1">1 Month</option>
              <option value="2">2 Months</option>
              <option value="3">3 Months</option>
              <option value="4">4 Months</option>
              <option value="5">5 Months</option>
              <option value="custom">Custom End Date</option>
            </select>
          </div>
          {form.duration === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Custom End Date</label>
              <input type="date" min={form.startDate || new Date().toISOString().slice(0,10)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
          )}
          <p className="text-xs text-gray-400">
            {form.duration === 'custom'
              ? form.endDate ? `End Date: ${new Date(form.endDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}` : 'Please select end date'
              : (() => {
                  const sd = form.startDate ? new Date(form.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                  const ed = new Date(sd); ed.setMonth(ed.getMonth() + parseInt(form.duration || '6'));
                  return `End Date: ${ed.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}`;
                })()
            }
          </p>
        </div>
        <button type="submit" disabled={applying}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
          {applying ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />} Submit Application
        </button>
      </form>
    </div>
  );

  return (
    <div>
      <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><GraduationCap size={18} className="text-blue-600" /> Hiresnix Internship Program</h3>
        <p className="text-sm text-gray-600 mt-1">Select a domain, apply, get approved, and earn certificates upon completion!</p>
      </div>
      {domains.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
          <p>No domains available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((d: any) => {
            const seatsLeft = d.totalSeats - d.filledSeats;
            const full = seatsLeft <= 0;
            return (
              <button key={d.id} onClick={() => !full && setSelected(d)} disabled={full}
                className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 ${full ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 active:scale-95'}`}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{d.icon || '💻'}</div>
                <h3 className="font-bold text-gray-900 mb-1">{d.name}</h3>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">{d.description || 'Industry-curated curriculum with hands-on projects.'}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={11} />{d.duration}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{seatsLeft} seats</span>
                </div>
                {!full && <div className="mt-3 text-blue-600 text-xs font-semibold flex items-center gap-1">Apply Now <ChevronRight size={12} /></div>}
                {full && <div className="mt-3 text-red-500 text-xs font-semibold">Seats Full</div>}
              </button>
            );
          })}
        </div>
      )}
      {/* Community section shown on domain listing too */}
      <div className="mt-6"><CommunitySection /></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ── NEW: EXTENDED INTERNSHIP SECTIONS ─────────────────────────────
// ═══════════════════════════════════════════════════════════════════

// Domain → project mapping
const DOMAIN_PROJECTS: Record<string, any> = {
  default: {
    title: 'Capstone Portfolio Project',
    description: 'Build a comprehensive project showcasing all skills learned during your internship. This will be a key piece of your professional portfolio.',
    resources: ['Your domain study resources', 'GitHub documentation', 'Hiresnix resource library'],
    github: '',
    submission: 'hr@hiresnix.co.in',
    deadline: 'Before internship end date',
  },
  'cloud computing': {
    title: 'Cloud Infrastructure Setup & Deployment',
    description: 'Design and deploy a scalable cloud infrastructure using AWS/GCP/Azure. Implement auto-scaling, load balancing, and CI/CD pipelines.',
    resources: ['AWS Free Tier', 'Google Cloud Skills Boost', 'Azure Learn'],
    github: 'https://github.com/hiresnix-commits',
    submission: 'hr@hiresnix.co.in',
    deadline: 'Before internship end date',
  },
  'full stack development': {
    title: 'Full Stack Web Application',
    description: 'Build a production-ready full stack app with React frontend, Node.js backend, and PostgreSQL database. Include authentication, CRUD operations, and deployment.',
    resources: ['React Docs', 'Node.js Docs', 'Supabase Quickstart'],
    github: 'https://github.com/hiresnix-commits',
    submission: 'hr@hiresnix.co.in',
    deadline: 'Before internship end date',
  },
  'data science': {
    title: 'End-to-End Data Analysis Project',
    description: 'Perform EDA, build ML models, and create a dashboard showcasing insights from a real-world dataset. Present findings in a Jupyter Notebook.',
    resources: ['Kaggle Datasets', 'Scikit-learn Docs', 'Matplotlib/Seaborn'],
    github: 'https://github.com/hiresnix-commits',
    submission: 'hr@hiresnix.co.in',
    deadline: 'Before internship end date',
  },
};

function getProjectForDomain(domainName: string) {
  const key = (domainName || '').toLowerCase();
  return DOMAIN_PROJECTS[key] || DOMAIN_PROJECTS['default'];
}

function sectionCard(title: string, icon: React.ReactNode, children: React.ReactNode) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mt-5">
      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 text-base">
        {icon}{title}
      </h4>
      {children}
    </div>
  );
}

// ── Internship Overview ───────────────────────────────────────────
function InternshipOverview({ enrollment, app }: { enrollment: any; app: any }) {
  const domainName = enrollment.domain?.name || app?.domain?.name || 'Internship';
  const startDate = enrollment.startDate ? new Date(enrollment.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Calculate end date from duration field
  // Calculate actual duration from startDate + 6 months (or from offerEndDate if available)
  let endDateDisplay = '—';
  let durationDisplay = '6 Months';
  if (enrollment.startDate) {
    const sd = new Date(enrollment.startDate);
    // Use offerEndDate from application if available, else startDate + 6 months
    const appEndDate = app?.offerEndDate;
    const ed = appEndDate ? new Date(appEndDate) : new Date(sd);
    if (!appEndDate) ed.setMonth(ed.getMonth() + 6);
    endDateDisplay = ed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    // Calculate actual months difference
    const months = (ed.getFullYear() - sd.getFullYear()) * 12 + (ed.getMonth() - sd.getMonth());
    durationDisplay = months > 0 ? `${months} Month${months === 1 ? '' : 's'}` : '6 Months';
  }

  const internshipId = `HX-INT-${String(enrollment.id).padStart(5, '0')}`;
  const batchId = `HX-BATCH-${new Date(enrollment.createdAt || Date.now()).getFullYear()}-${String(Math.ceil((new Date(enrollment.createdAt || Date.now()).getMonth() + 1) / 1)).padStart(2, '0')}`;

  const stats = [
    { label: 'Internship ID', value: internshipId, icon: '🆔' },
    { label: 'Batch ID', value: batchId, icon: '📦' },
    { label: 'Domain', value: domainName, icon: '💻' },
    { label: 'Duration', value: durationDisplay, icon: '⏱️' },
    { label: 'Start Date', value: startDate, icon: '🗓️' },
    { label: 'End Date', value: endDateDisplay, icon: '🏁' },
    { label: 'Mode', value: 'Remote', icon: '🌐' },
    { label: 'Status', value: enrollment.status, icon: enrollment.status === 'Completed' ? '✅' : '🔄' },
  ];

  return sectionCard('Internship Overview', <Briefcase size={17} className="text-blue-500" />,
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{s.icon} {s.label}</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Internship Timeline ───────────────────────────────────────────
function InternshipTimeline({ enrollment }: { enrollment: any }) {
  const steps = [
    { label: 'Application Submitted', done: true, icon: '📝', desc: 'You applied for the internship' },
    { label: 'Application Approved', done: true, icon: '✅', desc: 'Admin reviewed and approved your application' },
    { label: 'Offer Letter Issued', done: !!enrollment.startDate, icon: '📄', desc: 'Internship offer letter generated' },
    { label: 'Internship Started', done: !!enrollment.startDate, icon: '🚀', desc: 'Internship officially commenced' },
    { label: 'In Progress', done: enrollment.progress > 20, icon: '⚙️', desc: 'Actively working on tasks and logs' },
    { label: 'Internship Completed', done: enrollment.status === 'Completed', icon: '🎓', desc: 'All tasks completed successfully' },
    { label: 'Certificates Generated', done: enrollment.status === 'Completed', icon: '🏆', desc: 'Completion certificate & documents ready' },
  ];

  return sectionCard('Internship Timeline', <TrendingUp size={17} className="text-purple-500" />,
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-600" />
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-4 relative">
            <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 ${
              step.done ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
            }`}>
              {step.done ? <CheckCircle size={14} /> : <span className="text-xs text-gray-400">{i + 1}</span>}
            </div>
            <div className="pt-1 pb-1">
              <p className={`font-semibold text-sm ${step.done ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>{step.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Assigned Project ─────────────────────────────────────────────
function AssignedProject({ enrollment }: { enrollment: any }) {
  const project = getProjectForDomain(enrollment.domain?.name || '');

  return sectionCard('Assigned Project', <Target size={17} className="text-orange-500" />,
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-bold text-gray-900 dark:text-gray-100 text-base">{project.title}</h5>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">Optional — Submission Not Mandatory</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1"><BookOpen size={12} /> Resources</p>
          <ul className="space-y-1">
            {project.resources.map((r: string, i: number) => (
              <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />{r}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          {project.github && (
            <a href={project.github} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
              <Github size={13} className="text-gray-600" /> View GitHub Repository <ExternalLink size={11} />
            </a>
          )}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">📨 Submission Email</p>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{project.submission}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-600 dark:text-amber-400">⏰ Recommended Deadline</p>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{project.deadline}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <p className="text-xs text-green-800 dark:text-green-300 flex items-start gap-1.5">
          <CheckCircle size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
          <span><strong>Note:</strong> Project completion is recommended for your portfolio. However, whether you submit the project or not, your Internship Completion Certificate and documents will be generated automatically once the internship duration is successfully completed.</span>
        </p>
      </div>
    </div>
  );
}

// ── Daily Internship Log ──────────────────────────────────────────
function DailyInternshipLog({ enrollment }: { enrollment: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ todaysWork: '', hoursWorked: '', learning: '', challenges: '', tomorrowPlan: '' });

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find(l => l.logDate === today);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await client.get('/iplatform/daily-logs');
      setLogs(res.data?.data || []);
    } catch { setLogs([]); }
    finally { setLoadingLogs(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Pre-fill with today's log if exists
  useEffect(() => {
    if (todayLog) {
      setForm({
        todaysWork: todayLog.todaysWork || '',
        hoursWorked: todayLog.hoursWorked || '',
        learning: todayLog.learning || '',
        challenges: todayLog.challenges || '',
        tomorrowPlan: todayLog.tomorrowPlan || '',
      });
    }
  }, [todayLog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.todaysWork) return toast.error("Today's work is required");
    setSubmitting(true);
    try {
      await client.post('/iplatform/daily-logs', form);
      toast.success(todayLog ? "Today's log updated!" : "Daily log saved!");
      fetchLogs();
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save log');
    } finally { setSubmitting(false); }
  };

  const totalHours = logs.reduce((acc, l) => acc + parseFloat(l.hoursWorked || 0), 0);
  const streak = (() => {
    if (!logs.length) return 0;
    const sorted = [...logs].sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
    let s = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (const log of sorted) {
      const ld = new Date(log.logDate);
      ld.setHours(0, 0, 0, 0);
      const diff = Math.round((cursor.getTime() - ld.getTime()) / 86400000);
      if (diff <= 1) { s++; cursor = ld; }
      else break;
    }
    return s;
  })();

  if (enrollment.status === 'Completed') return null; // hide log form after completion

  return sectionCard('Daily Internship Log', <ClipboardList size={17} className="text-teal-500" />,
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-teal-600">{logs.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Logs</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">{streak}<Flame size={16} /></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Day Streak</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-blue-600">{totalHours.toFixed(0)}h</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Hours</p>
        </div>
      </div>

      {/* Today's log button */}
      <button onClick={() => setShowForm(!showForm)}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition mb-4 ${
          todayLog ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-teal-500 text-white hover:bg-teal-600'
        }`}>
        <ClipboardList size={15} />
        {todayLog ? "✏️ Update Today's Log" : "📝 Submit Today's Log"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 border border-teal-200 dark:border-teal-800 rounded-xl p-4 bg-teal-50 dark:bg-teal-900/20 mb-4">
          <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
          {[
            { key: 'todaysWork', label: "Today's Work *", placeholder: "What did you work on today?" },
            { key: 'learning', label: 'Key Learnings', placeholder: 'What did you learn today?' },
            { key: 'challenges', label: 'Challenges Faced', placeholder: 'Any blockers or challenges?' },
            { key: 'tomorrowPlan', label: "Tomorrow's Plan", placeholder: 'What will you work on tomorrow?' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{field.label}</label>
              <textarea rows={2} placeholder={field.placeholder}
                value={(form as any)[field.key]}
                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none text-gray-800 dark:text-gray-200" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Hours Worked Today</label>
            <input type="number" min="0" max="24" step="0.5" placeholder="e.g. 4"
              value={form.hoursWorked}
              onChange={e => setForm(p => ({ ...p, hoursWorked: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 text-gray-800 dark:text-gray-200" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-lg transition">
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {submitting ? 'Saving...' : todayLog ? 'Update Log' : 'Save Log'}
          </button>
        </form>
      )}

      {/* Past logs */}
      {loadingLogs ? (
        <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-teal-400" /></div>
      ) : logs.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Previous Logs</p>
          {logs.slice(0, 5).map(log => (
            <div key={log.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {new Date(log.logDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {log.hoursWorked > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{log.hoursWorked}h</span>
                )}
              </div>
              {log.todaysWork && <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{log.todaysWork}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-400 py-3">No logs submitted yet. Start tracking your daily progress!</p>
      )}
    </div>
  );
}

// ── Progress Tracker ──────────────────────────────────────────────
function ProgressTracker({ enrollment }: { enrollment: any }) {
  const taskLogs = enrollment.taskLogs || [];
  const progress = enrollment.progress || 0;

  const durationStr: string = enrollment.domain?.duration || '8 Weeks';
  const durationMatch = durationStr.match(/(\d+)/);
  const durationNum = durationMatch ? parseInt(durationMatch[1]) : 8;
  const isMonths = /month/i.test(durationStr);
  const totalDays = isMonths ? durationNum * 30 : durationNum * 7;

  let daysElapsed = 0;
  if (enrollment.startDate) {
    const sd = new Date(enrollment.startDate);
    const now = new Date();
    daysElapsed = Math.min(totalDays, Math.max(0, Math.round((now.getTime() - sd.getTime()) / 86400000)));
  }
  const timeProgress = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0;

  return sectionCard('Progress Tracker', <BarChart2 size={17} className="text-indigo-500" />,
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Task Completion</span>
          <span className="text-xs font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
          <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Time Elapsed</span>
          <span className="text-xs font-bold text-purple-600">{timeProgress}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
          <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${timeProgress}%` }} />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{daysElapsed} of {totalDays} days completed</p>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
          <p className="text-xl font-black text-indigo-600">{taskLogs.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Done</p>
        </div>
        <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p className="text-xl font-black text-green-600">{daysElapsed}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Days In</p>
        </div>
        <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
          <p className="text-xl font-black text-amber-600">{Math.max(0, totalDays - daysElapsed)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Days Left</p>
        </div>
      </div>

      {enrollment.status === 'Completed' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">🎉 Internship Successfully Completed!</p>
        </div>
      )}
    </div>
  );
}

// ── Certificate Payment Gate ─────────────────────────────────────
function CertificatePaymentSection({ enrollment }: { enrollment: any }) {
  const [checking, setChecking] = useState(true);
  const [paid, setPaid] = useState(false);
  const [isLegacy, setIsLegacy] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (enrollment.status !== 'Completed') return;
    client.get('/iplatform/cert-payment-status')
      .then(r => {
        setPaid(r.data?.paid || false);
        setIsLegacy(r.data?.isLegacy || false);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [enrollment.status]);

  if (enrollment.status !== 'Completed') return null;
  if (checking) return (
    <div className="mt-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex justify-center">
      <Loader2 size={20} className="animate-spin text-indigo-400" />
    </div>
  );

  const handlePayment = async () => {
    setProcessingPayment(true);
    try {
      const res = await client.post('/iplatform/cert-payment-order');
      const { orderId, keyId, amount } = res.data?.data || {};
      if (!orderId || !keyId) {
        toast.error('Payment service unavailable. Contact hr@hiresnix.co.in');
        return;
      }
      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        name: 'Hiresnix',
        description: 'Internship Certificate Download',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await client.post('/iplatform/cert-payment-verify', response);
            toast.success('🎉 Payment successful! Certificates unlocked!');
            setPaid(true);
          } catch { toast.error('Payment verification failed. Contact support.'); }
        },
        prefill: { name: enrollment.studentName, email: enrollment.email || '' },
        theme: { color: '#3b82f6' },
      };
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        // Load Razorpay script
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load payment gateway'));
          document.head.appendChild(s);
        });
      }
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Payment initialization failed');
    } finally { setProcessingPayment(false); }
  };

  return sectionCard('Internship Certificates', <Award size={17} className="text-yellow-500" />,
    <div>
      {(paid || isLegacy) ? (
        <div>
          {isLegacy && (
            <div className="mb-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <Unlock size={13} /> Your certificates are free as an existing student. No payment required!
              </p>
            </div>
          )}
          <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-3 flex items-center gap-2">
            <CheckCircle size={15} /> Certificates unlocked — download anytime!
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'certificate', label: 'Completion Certificate', emoji: '🏆' },
              { type: 'completion', label: 'Completion Letter', emoji: '📄' },
              { type: 'lor', label: 'Letter of Recommendation', emoji: '✉️' },
            ].map(({ type, label, emoji }) => (
              <a key={type}
                href={`/api/iplatform/${type === 'completion' ? 'completion' : type}/${enrollment.id}/pdf`}
                target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition group">
                <span style={{ fontSize: '1.6rem' }}>{emoji}</span>
                <span className="text-xs font-semibold text-green-800 dark:text-green-300 text-center">{label}</span>
                <Download size={12} className="text-green-600 group-hover:scale-110 transition" />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
            <Lock size={20} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300 text-sm">Certificates Generated & Ready!</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Your Completion Certificate, Completion Letter, and LOR have been automatically generated. Click below to unlock all downloads.</p>
            </div>
          </div>
          <button onClick={handlePayment} disabled={processingPayment}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-blue-500/20">
            {processingPayment ? <Loader2 size={15} className="animate-spin" /> : <Unlock size={15} />}
            {processingPayment ? 'Opening Payment...' : 'Unlock All Certificates — ₹100'}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">One-time payment • Unlimited downloads • QR Verification activated</p>
        </div>
      )}
    </div>
  );
}

// ── Community Section ─────────────────────────────────────────────
function CommunitySection() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-5 mt-5">
      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
        <MessageCircle size={17} className="text-green-600" /> Hiresnix Community
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Connect with fellow interns and stay updated</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <a href="https://chat.whatsapp.com/IhxnCopKJSy7phOcU3qCCE?s=cl&p=a&ilr=4" target="_blank" rel="noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl bg-green-500 hover:bg-green-600 text-white transition group">
          <MessageCircle size={20} className="flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">WhatsApp Community</p>
            <p className="text-xs opacity-80">Join official Hiresnix group</p>
          </div>
          <ExternalLink size={13} className="ml-auto opacity-70 group-hover:opacity-100" />
        </a>
        <a href="https://www.linkedin.com/company/hiresnix/" target="_blank" rel="noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition group">
          <Linkedin size={20} className="flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Follow on LinkedIn</p>
            <p className="text-xs opacity-80">@Hiresnix</p>
          </div>
          <ExternalLink size={13} className="ml-auto opacity-70 group-hover:opacity-100" />
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
          <AlertCircle size={13} /> Important Notice
        </p>
        <p className="text-xs text-gray-700 dark:text-gray-300">
          Students are required to <strong>post their Internship Offer Letter on LinkedIn within 48 hours</strong> of receiving it and <strong>tag Hiresnix</strong> in the post.
        </p>
      </div>
    </div>
  );
}

// ── Exception Contact Section ────────────────────────────────────
function ExceptionContact() {
  return (
    <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        If additional verification is required (College Verification or Email Verification), please contact us at{' '}
        <a href="mailto:hr@hiresnix.co.in" className="text-blue-500 font-semibold hover:underline">hr@hiresnix.co.in</a>
      </p>
    </div>
  );
}

// ── Wrapper for all new sections ─────────────────────────────────
function InternshipExtendedSections({ enrollment, app, onReload }: { enrollment: any; app: any; onReload: () => void }) {
  return (
    <div className="mt-2">
      <InternshipOverview enrollment={enrollment} app={app} />
      <InternshipTimeline enrollment={enrollment} />
      <AssignedProject enrollment={enrollment} />
      <DailyInternshipLog enrollment={enrollment} />
      <ProgressTracker enrollment={enrollment} />
      <CertificatePaymentSection enrollment={enrollment} />
      <ExceptionContact />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT (UNCHANGED) ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export function StudentInternships() {
  const [activeTab, setActiveTab] = useState<'internship' | 'logic'>('internship');

  const tabs = [
    { id: 'internship' as const, label: '🎓 Internship Program', desc: 'Apply & track your internship' },
    { id: 'logic' as const,      label: '🧠 Logic Builder', desc: 'Think before you code', badge: 'NEW' },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Internships</h1>
        <p className="text-sm text-gray-500 mt-1">Gain real-world experience with structured internship programs</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
            }`}>
            {t.label}
            {t.badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'internship' && <IPlatformPanel />}
      {activeTab === 'logic' && <LogicBuilder />}
    </div>
  );
}