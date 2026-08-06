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
  const [certPaid, setCertPaid] = useState<boolean | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

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
      // Check payment status
      try {
        const ps = await client.get('/iplatform/cert-payment-status');
        setCertPaid(ps.data?.paid || false);
      } catch { setCertPaid(false); }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setApplying(true);
    try {
      // Validate Career ID if institution selected
      if (form.institutionName && !form.careerId.trim()) {
        toast.error('Career ID is required for institution students');
        setApplying(false);
        return;
      }
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

  const triggerDownload = async (type: string, enrollId: number | string, name: string) => {
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

  const downloadDoc = async (type: string, enrollId: number | string, name: string) => {
    if (type === 'offer-letter') { triggerDownload(type, enrollId, name); return; }
    if (certPaid) { triggerDownload(type, enrollId, name); return; }
    setPaymentLoading(true);
    try {
      const res = await client.post('/iplatform/cert-payment-order');
      const { orderId, keyId, amount } = res.data?.data || {};
      if (!orderId || !keyId) { toast.error('Payment service unavailable. Contact hr@hiresnix.co.in'); return; }
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load payment gateway'));
        document.head.appendChild(s);
      });
      const rzp = new (window as any).Razorpay({
        key: keyId, amount, currency: 'INR',
        name: 'Hiresnix', description: 'Internship Certificate Download',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await client.post('/iplatform/cert-payment-verify', response);
            toast.success('Payment successful! Downloading...');
            setCertPaid(true);
            setTimeout(() => triggerDownload(type, enrollId, name), 500);
          } catch { toast.error('Payment verification failed. Contact support.'); }
        },
        prefill: { name },
        theme: { color: '#3b82f6' },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payment gateway');
    } finally { setPaymentLoading(false); }
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

        </div>
      )}

      {/* ── NEW EXTENDED SECTIONS (added below existing content) ── */}
      {/* Exception Contact — top */}
      {enrollment && (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-center text-xs text-gray-500 dark:text-gray-400">
          If additional verification is required (College Verification or Email Verification), please contact us at{' '}
          <a href="mailto:hr@hiresnix.co.in" className="text-blue-500 font-semibold hover:underline">hr@hiresnix.co.in</a>
        </div>
      )}
      {enrollment && <InternshipExtendedSections enrollment={enrollment} app={app} onReload={load} />}

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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Career ID / Student ID <span className="text-red-500">*</span></label>
              <input required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                placeholder="e.g. HX-ABC-2026-0001"
                value={form.careerId} onChange={e => setForm(p => ({ ...p, careerId: e.target.value.toUpperCase() }))} />
              <p className="text-xs text-red-500 mt-1">⚠️ Career ID is mandatory for institution students</p>
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
      {/* Attractive Automation Banner */}
      <div className="mb-5 rounded-2xl overflow-hidden border border-indigo-200 shadow-lg shadow-indigo-500/10">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚡</span>
            <h3 className="font-black text-white text-lg tracking-tight">100% Automated Internship Platform</h3>
          </div>
          <p className="text-indigo-100 text-sm font-medium">Apply once — everything happens automatically. No manual steps needed!</p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🎓', text: 'Instant Enrollment' },
            { icon: '📄', text: 'Auto Offer Letter' },
            { icon: '📊', text: 'Live Progress Tracking' },
            { icon: '🏆', text: 'Auto Certificates' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 px-5 py-2.5 border-t border-indigo-100 dark:border-indigo-800">
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium text-center">
            ✅ Offer Letter &nbsp;•&nbsp; ✅ Daily Logs &nbsp;•&nbsp; ✅ Completion Certificate &nbsp;•&nbsp; ✅ LOR &nbsp;•&nbsp; ✅ QR Verification — All on this portal!
          </p>
          <p className="text-xs text-indigo-500 dark:text-indigo-400 text-center mt-1">
            Having trouble? Contact us on <a href="tel:9322690710" className="font-bold text-indigo-700 dark:text-indigo-300 hover:underline">📞 9322690710</a>
          </p>
        </div>
      </div>

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

// Batch August 2026 — 84 students mapped by email
const STUDENT_AUG_PROJECTS: Record<string, any> = {
  "gopal@gmail.com": {
    name: "gopal",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "COVID-19 India State Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-level case/death/recovery data, choropleth map, peak identification." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Indian Stock Market EDA & Forecast", tech: "Python, Pandas, yfinance, Prophet, Plotly", desc: "NSE multi-stock OHLCV, 30-day forecast, sector performance comparison." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Social Mobility & Income Inequality Study", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "World Bank + OECD data, Gini index trend, mobility predictor, interactive report." },
    ],
  },
  "sumitpangavhane5@gmail.com": {
    name: "SUMIT SANJAY PANGAVHANE",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Static Site Hosting with CDN on AWS", tech: "AWS S3, CloudFront, Route53", desc: "Deploy React app to S3, CloudFront distribution, custom domain, SSL cert." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Containerized Microservices on AWS", tech: "Docker, AWS ECS, ECR, ALB", desc: "Dockerize 3 microservices, push to ECR, deploy via ECS Fargate, ALB routing." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Region Disaster Recovery Setup", tech: "AWS Route53, RDS, S3, CloudFormation", desc: "Active-passive DR, RDS cross-region replica, Route53 health-check failover." },
    ],
  },
  "jayupatil2005@gmail.com": {
    name: "Jayesh  Sunil Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Dockerize a Web Application", tech: "Docker, Docker Compose, Nginx", desc: "Dockerfile for Node.js app, docker-compose with DB, Nginx reverse proxy." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "CI/CD Pipeline with Jenkins", tech: "Jenkins, Docker, GitHub, Maven", desc: "Multibranch pipeline, build/test/deploy stages, Slack notification, rollback." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Full DevOps Pipeline on AWS", tech: "Jenkins, Docker, EKS, Terraform, Helm", desc: "IaC infra, containerized app, CI/CD to K8s, monitoring, security scan." },
    ],
  },
  "kalpeshrpatil18@gmail.com": {
    name: "Kalpesh Rajendra Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Linux Server Setup & Hardening", tech: "Ubuntu, bash, ufw, fail2ban", desc: "User management, SSH key auth, firewall rules, fail2ban, cron jobs." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Kubernetes Cluster Setup", tech: "Kubernetes, kubectl, Helm, Minikube", desc: "Deployment/service/ingress, HPA, ConfigMaps, secrets, rolling update." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Service Mesh with Istio", tech: "Istio, Kubernetes, Kiali, Jaeger", desc: "Traffic management, mTLS, circuit breaker, distributed tracing, dashboards." },
    ],
  },
  "pareshmahirrao06@gmail.com": {
    name: "Paresh Sunil Mahirrao",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Superstore Sales Performance Report", tech: "Python, Pandas, Plotly, Power BI", desc: "Kaggle Superstore data, regional KPIs, top-product bar chart, manager summary PDF." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Retail Store Footfall Insights", tech: "Python, Pandas, Plotly, Power BI", desc: "Hourly footfall + sales data, peak-hour analysis, conversion rate, staff optimizer." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Sales Command Center", tech: "Python, Pandas, Streamlit, Plotly, SQL", desc: "Live DB connection, auto-refreshing KPI tiles, drill-down by region/rep/product." },
    ],
  },
  "itzharshal07@gmail.com": {
    name: "Hitesh Pravin Bhamare",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Netflix Content EDA", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Genre distribution, country treemap, release-year trend analysis." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crime Pattern Analysis Dashboard", tech: "Python, Pandas, Folium, Plotly, Streamlit", desc: "City crime dataset, type/time/location EDA, monthly trend, hotspot map." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Smart City Sensor Data Analysis", tech: "Python, Pandas, Plotly, Folium, Prophet", desc: "IoT sensor dataset (air/noise/traffic), anomaly detection, zone comparison, forecast." },
    ],
  },
  "nikitapatil110307@gmail.com": {
    name: "NIKITA PATIL",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Personal Task Manager App", tech: "React.js, Node.js, MySQL, JWT", desc: "Task CRUD, priority tags, due-date filter, completion toggle, user auth." },
      { stage: "Stage 2 \u2014 Medium", title: "Job Application Tracker", tech: "React.js, Node.js, PostgreSQL, Chart.js, JWT", desc: "Track applications by status, Kanban view, deadline alerts, stats dashboard." },
      { stage: "Stage 3 \u2014 Hard", title: "Multi-Tenant Project Management SaaS", tech: "React.js, Node.js, PostgreSQL, Socket.io, Stripe", desc: "Org/workspace/board/card CRUD, real-time updates, role access, Stripe billing." },
    ],
  },
  "gayatrigaikwad36108@gmail.com": {
    name: "Gayatri Arun Gaikwad",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Superstore Sales Performance Report", tech: "Python, Pandas, Plotly, Power BI", desc: "Kaggle Superstore data, regional KPIs, top-product bar chart, manager summary PDF." },
      { stage: "Stage 2 \u2014 Medium", title: "Retail Store Footfall Insights", tech: "Python, Pandas, Plotly, Power BI", desc: "Hourly footfall + sales data, peak-hour analysis, conversion rate, staff optimizer." },
      { stage: "Stage 3 \u2014 Hard", title: "Real-Time Sales Command Center", tech: "Python, Pandas, Streamlit, Plotly, SQL", desc: "Live DB connection, auto-refreshing KPI tiles, drill-down by region/rep/product." },
    ],
  },
  "jayshrigirase2006@gmail.com": {
    name: "Jayshri Girase",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Iris Flower Species Classifier", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Logistic Regression on Iris dataset, confusion matrix, species predictor UI." },
      { stage: "Stage 2 \u2014 Medium", title: "Crop Yield Prediction System", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Regression on crop dataset, soil+weather inputs, district-level yield map." },
      { stage: "Stage 3 \u2014 Hard", title: "Real-Time Pose Estimation Trainer", tech: "Python, MediaPipe, TensorFlow, Flask, Socket.io", desc: "Live webcam pose detection, rep counter for exercises, form feedback API." },
    ],
  },
  "anushkaghat03@gmail.com": {
    name: "anushka ghat",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Titanic Survival Predictor", tech: "Python, Pandas, Scikit-learn, Streamlit", desc: "Binary classification, feature engineering, ROC curve, Streamlit input form." },
      { stage: "Stage 2 \u2014 Medium", title: "Fake Job Posting Detector", tech: "Python, NLTK, TF-IDF, Scikit-learn, Streamlit", desc: "Binary NLP classifier on EMSCAD dataset, keyword explainability." },
      { stage: "Stage 3 \u2014 Hard", title: "Multimodal Product Review Analyzer", tech: "Python, CLIP HuggingFace, FastAPI, React", desc: "Image + text review inputs, sentiment + quality score, REST API." },
    ],
  },
  "suyogahire1214@gmail.com": {
    name: "Suyog Ahire",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Notes & Bookmarks Web App", tech: "React.js, Express, MongoDB, JWT", desc: "Create/edit/delete notes, tag system, URL bookmark saver, search filter." },
      { stage: "Stage 2 \u2014 Medium", title: "Online Quiz Platform", tech: "React.js, Node.js, MongoDB, Socket.io", desc: "Question bank, timed quiz, live leaderboard, auto-grade, result analytics." },
      { stage: "Stage 3 \u2014 Hard", title: "E-Learning Platform with Certificates", tech: "React.js, Node.js, MongoDB, Cloudinary, Stripe", desc: "Course builder, video streaming, quiz engine, progress tracking, PDF cert generator." },
    ],
  },
  "gadekarkiran27@gmail.com": {
    name: "Kiran Suresh Gadekar",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Keyword-Based FAQ Chatbot", tech: "Python, NLTK, Flask, Bootstrap", desc: "Intent matching on custom FAQ dataset, response retrieval, multi-turn conversation log." },
      { stage: "Stage 2 \u2014 Medium", title: "AI Interview Question Generator", tech: "Python, Gemini API, FastAPI, React", desc: "Upload JD/resume, generate role-specific questions by difficulty, PDF export." },
      { stage: "Stage 3 \u2014 Hard", title: "Multi-Agent Task Automation System", tech: "Python, LangChain Agents, FastAPI, React", desc: "Planner + executor agents, multi-step task decomposition, tool use (search/code/file), audit log." },
    ],
  },
  "ankitapatil9411@gmail.com": {
    name: "Ankita Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "AI Text Summarizer Tool", tech: "Python, HuggingFace Transformers BART, Streamlit", desc: "Paste article \u2192 abstractive summary, length slider, copy button." },
      { stage: "Stage 2 \u2014 Medium", title: "AI Product Description Writer", tech: "Python, Gemini API, FastAPI, React", desc: "Enter product name + features, generate 3 tone-varied descriptions, SEO score." },
      { stage: "Stage 3 \u2014 Hard", title: "AI Video Scene Describer", tech: "Python, CLIP HuggingFace, OpenCV, FastAPI", desc: "Upload video, keyframe extraction, CLIP caption per scene, narrative summary." },
    ],
  },
  "sameekshanerkar1@gmail.com": {
    name: "Sameeksha Nerkar",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "HR Headcount & Turnover Dashboard", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Employee dataset, dept headcount, attrition rate chart, YoY trend." },
      { stage: "Stage 2 \u2014 Medium", title: "Product Profitability Analysis", tech: "Python, Pandas, Plotly, Seaborn", desc: "Revenue \u2013 COGS model, margin by SKU/category, waterfall P&L chart, pricing levers." },
      { stage: "Stage 3 \u2014 Hard", title: "Predictive Churn Cohort Tracker", tech: "Python, Pandas, Scikit-learn, Plotly, Power BI", desc: "Cohort CLV + ML churn risk, early-warning segment filter, retention action log." },
    ],
  },
  "shrutiborse17@gmail.com": {
    name: "Shruti Borse",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Network Vulnerability Scanner", tech: "Python, Nmap, Flask, Bootstrap", desc: "Port scanning on local subnet, open-port risk rating, CVE lookup, HTML report." },
      { stage: "Stage 2 \u2014 Medium", title: "Password Strength Analyzer & Generator", tech: "Python, Flask, zxcvbn, React", desc: "Strength scoring, crack-time estimate, secure password generator, breach-check API." },
      { stage: "Stage 3 \u2014 Hard", title: "Web Application Penetration Testing Report", tech: "Python, OWASP ZAP, Burp Suite, Markdown", desc: "Automated scan on demo app, XSS/SQLi/CSRF findings, CVSS scoring, remediation PDF." },
    ],
  },
  "vishakhachaudhari7709@gmail.com": {
    name: "vishakha kailas chaudhari",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Personal Portfolio Website", tech: "React.js, CSS3, EmailJS", desc: "Animated hero, projects grid, skills bar, contact form, dark/light toggle." },
      { stage: "Stage 2 \u2014 Medium", title: "Job Board UI with Filters", tech: "React.js, Tailwind CSS, Context API", desc: "Job card listing, search + multi-filter, bookmark, pagination, skeleton loader." },
      { stage: "Stage 3 \u2014 Hard", title: "Real-Time Collaborative Notes App", tech: "React.js, Socket.io, Tailwind, Quill.js", desc: "Multi-user note editing, live cursor, undo/redo, room links, export PDF." },
    ],
  },
  "np7881374@gmail.com": {
    name: "Neha Ravindra Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "COVID-19 India State Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-level case/death/recovery data, choropleth, peak identification, wave analysis." },
      { stage: "Stage 2 \u2014 Medium", title: "Indian Stock Market EDA & Forecast", tech: "Python, Pandas, yfinance, Prophet, Plotly", desc: "NSE multi-stock OHLCV, 30-day forecast, sector performance comparison." },
      { stage: "Stage 3 \u2014 Hard", title: "Social Mobility & Income Inequality Study", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "World Bank + OECD data, Gini index trend, mobility predictor, interactive report." },
    ],
  },
  "aditisawale61@gmail.com": {
    name: "Aditi Rajesh Sawale",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Wine Quality Classifier", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "Multi-class RF on UCI Wine, accuracy comparison, feature importance chart." },
      { stage: "Stage 2 \u2014 Medium", title: "Twitter Sentiment Dashboard", tech: "Python, Tweepy, TextBlob, Plotly, Streamlit", desc: "Real-time tweet sentiment, trending keyword cloud, sentiment timeline." },
      { stage: "Stage 3 \u2014 Hard", title: "Autonomous Stock Trading Bot", tech: "Python, yfinance, RL Stable-Baselines3, Streamlit", desc: "PPO agent on historical data, portfolio simulation, cumulative return chart." },
    ],
  },
  "gayatridhurkunde21@gmail.com": {
    name: "Gayatri Kailas Dhurkunde",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Diabetes Risk Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Logistic Regression on Pima dataset, patient form, recall-optimized threshold." },
      { stage: "Stage 2 \u2014 Medium", title: "House Rent Price Predictor", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Feature engineering on rental dataset, neighborhood filter, rent estimator." },
      { stage: "Stage 3 \u2014 Hard", title: "AI-Powered Resume Parser & Ranker", tech: "Python, spaCy, BERT, FastAPI, React", desc: "Batch resume upload, JD matching, ranked shortlist, skills gap PDF report." },
    ],
  },
  "waghkhushi52@gmail.com": {
    name: "Yashwi Vijay wagh",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "World Population Growth Analysis", tech: "Python, Pandas, Plotly, Seaborn", desc: "UN population data, country growth rate chart, density map, 2050 projection line." },
      { stage: "Stage 2 \u2014 Medium", title: "Crime Pattern Analysis Dashboard", tech: "Python, Pandas, Folium, Plotly, Streamlit", desc: "City crime dataset, type/time/location EDA, monthly trend, hotspot map." },
      { stage: "Stage 3 \u2014 Hard", title: "Smart City Sensor Data Analysis", tech: "Python, Pandas, Plotly, Folium, Prophet", desc: "IoT sensor dataset (air/noise/traffic), anomaly detection, zone comparison, forecast." },
    ],
  },
  "anjaliamrutkar1526@gmail.com": {
    name: "Anjali Amrutkar",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Titanic Survival EDA", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Classic Titanic dataset, passenger survival factors, age/class/gender breakdown." },
      { stage: "Stage 2 \u2014 Medium", title: "Climate Change & Extreme Events EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "NOAA/NASA dataset, temperature anomaly, extreme events correlation, 2040 projection." },
      { stage: "Stage 3 \u2014 Hard", title: "NLP-Powered Financial Report Analyzer", tech: "Python, spaCy, Gensim, Plotly, Streamlit", desc: "Scrape annual report PDFs, topic extraction, sentiment trend, KPI comparison." },
    ],
  },
  "premsinggirase585@gmail.com": {
    name: "Anjali Premsing Girase",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Indian Premier League EDA", tech: "Python, Pandas, Plotly, Streamlit", desc: "IPL ball-by-ball data, player strike rate, team win %, venue run-rate chart." },
      { stage: "Stage 2 \u2014 Medium", title: "Healthcare Cost Driver Analysis", tech: "Python, Pandas, Plotly, Scikit-learn", desc: "Insurance + hospital cost data, driver regression, cost by diagnosis dashboard." },
      { stage: "Stage 3 \u2014 Hard", title: "Geospatial Urban Sprawl Study", tech: "Python, Geopandas, OSMnx, Folium, Plotly", desc: "Satellite-derived urban boundary data, expansion rate, green cover loss, 3-city compare." },
    ],
  },
  "sairaj.eleventh@gmail.com": {
    name: "Mandlik Sairaj Sunil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Boston Housing Price Estimator", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Linear/Ridge regression, RMSE/R\u00b2, residual plot, feature coefficient chart." },
      { stage: "Stage 2 \u2014 Medium", title: "Product Review Sentiment Classifier", tech: "Python, DistilBERT, Scikit-learn, Flask", desc: "Fine-tune DistilBERT on product reviews, star-rating predictor, live demo." },
      { stage: "Stage 3 \u2014 Hard", title: "Medical Report Summarizer", tech: "Python, T5 HuggingFace, LangChain, FastAPI", desc: "Upload clinical report PDF, abstractive summary, key findings extraction." },
    ],
  },
  "gayatrichopade1206@gmail.com": {
    name: "Gayatri Chopade",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "E-Commerce Return Rate Analyzer", tech: "Python, Pandas, Plotly, Streamlit", desc: "Returns dataset, reason categorization, SKU-level return rate, seller report." },
      { stage: "Stage 2 \u2014 Medium", title: "Customer Cohort Retention Dashboard", tech: "Python, Pandas, Plotly, Streamlit", desc: "Monthly cohort table, retention heatmap, churn inflection finder, segment filter." },
      { stage: "Stage 3 \u2014 Hard", title: "Multi-Source Data Pipeline Dashboard", tech: "Python, Pandas, SQLAlchemy, Plotly, Airflow", desc: "ETL from 3 sources (CSV, API, DB), unified dashboard, scheduled refresh." },
    ],
  },
  "dgchaudhari7250@gmail.com": {
    name: "Dipak Chaudhari",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "AI Grammar Correction Assistant", tech: "Python, LanguageTool API, Flask, React", desc: "Text input, error highlighting, corrected output, confidence color-code." },
      { stage: "Stage 2 \u2014 Medium", title: "AI-Powered Bug Fixer", tech: "Python, Gemini API, FastAPI, React", desc: "Paste buggy code, AI identifies errors, suggests fixed code, diff viewer." },
      { stage: "Stage 3 \u2014 Hard", title: "Autonomous Data Analysis Agent", tech: "Python, LangChain, Pandas, Streamlit", desc: "Upload CSV, agent auto-detects columns, runs EDA, generates insights report without prompting." },
    ],
  },
  "komalvarude415@gmail.com": {
    name: "Komal Gopal Varude",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Netflix Movies & Shows EDA", tech: "Python, Pandas, Seaborn, WordCloud", desc: "Content catalog data, genre distribution, country treemap, release-year trend." },
      { stage: "Stage 2 \u2014 Medium", title: "Startup Ecosystem India Report", tech: "Python, Pandas, Plotly, NetworkX, Streamlit", desc: "Funding + sector data, investor network graph, city startup map, YoY trend." },
      { stage: "Stage 3 \u2014 Hard", title: "Multi-Year Education Outcome Study", tech: "Python, Pandas, Plotly, Scikit-learn, Geopandas", desc: "DISE/ASER data, learning outcome regression, district map, policy scenario." },
    ],
  },
  "snehal123e@gmail.com": {
    name: "Mankar Snehal Venunath",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Movie Rating Predictor", tech: "Python, Pandas, Scikit-learn, Streamlit", desc: "Regression on IMDB features, genre/runtime/budget inputs, prediction confidence." },
      { stage: "Stage 2 \u2014 Medium", title: "Stock Market Volatility Predictor", tech: "Python, yfinance, Scikit-learn, Plotly", desc: "GARCH features, RF volatility classifier, multi-stock comparison chart." },
      { stage: "Stage 3 \u2014 Hard", title: "Sign Language to Text Converter", tech: "Python, MediaPipe, LSTM, TensorFlow, Gradio", desc: "Real-time hand gesture capture, sequence-to-text decoder, accuracy chart." },
    ],
  },
  "riteshpanpatil123@gmail.com": {
    name: "Ritesh Parmeshwar Panpatil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "AI Joke & Story Generator", tech: "Python, Gemini API, Streamlit", desc: "Genre/mood selector, AI-generated jokes or short stories, regenerate button, share card." },
      { stage: "Stage 2 \u2014 Medium", title: "Conversational Language Tutor", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Choose language + level, AI conducts lesson, grammar correction, vocab quiz." },
      { stage: "Stage 3 \u2014 Hard", title: "AI Legal Contract Analyzer", tech: "Python, GPT-4o/Gemini, LangChain, Streamlit", desc: "Upload contract PDF, clause extraction, risk flagging, plain-English summary, negotiation tips." },
    ],
  },
  "tanujadkinge@gmail.com": {
    name: "Tanuja Kinge",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Spam SMS Detector", tech: "Python, NLTK, Naive Bayes, Streamlit", desc: "TF-IDF on SMS Spam Collection, ROC curve, live message tester." },
      { stage: "Stage 2 \u2014 Medium", title: "Electricity Consumption Predictor", tech: "Python, Prophet, Pandas, Streamlit", desc: "Household power dataset, daily consumption forecast, anomaly flagging." },
      { stage: "Stage 3 \u2014 Hard", title: "3D Object Reconstruction from 2D", tech: "Python, OpenCV, Open3D, Flask", desc: "Multi-angle image upload, point-cloud reconstruction, 3D viewer, depth map export." },
    ],
  },
  "shraddhapatill1106@gmail.com": {
    name: "Shraddha  Pradeep Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Bank Customer Churn Classifier", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "LR + DT on banking dataset, feature heatmap, churn probability output." },
      { stage: "Stage 2 \u2014 Medium", title: "Road Traffic Volume Predictor", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Traffic dataset, time + weather features, city intersection heatmap." },
      { stage: "Stage 3 \u2014 Hard", title: "Sarcasm Detection in Social Media", tech: "Python, RoBERTa HuggingFace, FastAPI, React", desc: "Fine-tune on Reddit sarcasm dataset, confidence score, batch CSV API." },
    ],
  },
  "uditanshmishra191@gmail.com": {
    name: "Uditansh Mishra",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "AI Quote & Motivation Generator", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Topic input, AI generates 5 quotes, mood filter, save-to-favourites, copy button." },
      { stage: "Stage 2 \u2014 Medium", title: "AI Document Classifier", tech: "Python, spaCy, BERT, FastAPI", desc: "Multi-class document type tagger (invoice/contract/report), confidence, batch CSV API." },
      { stage: "Stage 3 \u2014 Hard", title: "AI-Powered Mock Interview Coach", tech: "Python, Whisper ASR, Gemini API, React, Flask", desc: "Voice-based interview, speech-to-text, AI follow-up questions, answer scoring, report." },
    ],
  },
  "kapadnisgayatri38@gmail.com": {
    name: "Gayatri Kapadnis",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Global Unemployment Trends", tech: "Python, Pandas, Plotly, Geopandas", desc: "World Bank data, country unemployment choropleth, age/gender breakdown, 10-year trend." },
      { stage: "Stage 2 \u2014 Medium", title: "Airbnb Price Determinant Study", tech: "Python, Pandas, Plotly, Scikit-learn", desc: "Listing data, price regression, amenity impact, neighbourhood map." },
      { stage: "Stage 3 \u2014 Hard", title: "Predictive Population Health Dashboard", tech: "Python, Pandas, Scikit-learn, Prophet, Plotly", desc: "District health data, disease burden forecast, risk stratification, intervention planner." },
    ],
  },
  "avantizore7777@gmail.com": {
    name: "Avanti kailas zore",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "AI Recipe Generator from Ingredients", tech: "Python, Gemini API, Streamlit", desc: "Enter available ingredients, AI suggests 3 recipes with steps, dietary filter toggle." },
      { stage: "Stage 2 \u2014 Medium", title: "Agentic Research Assistant", tech: "Python, LangChain, DuckDuckGo Tool, Streamlit", desc: "Input research topic, agent searches + summarizes web sources, cited report." },
      { stage: "Stage 3 \u2014 Hard", title: "RAG Chatbot on Custom Knowledge Base", tech: "Python, LangChain, ChromaDB, Gemini API, Streamlit", desc: "Multi-PDF ingestion, vector embeddings, semantic search, source citation, multi-turn." },
    ],
  },
  "rbbhau123@gmail.com": {
    name: "Rohit Birare",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "AI Cover Letter Writer", tech: "Python, Gemini API, FastAPI, React", desc: "Upload resume + JD, AI generates tailored cover letter, tone selector, download as PDF." },
      { stage: "Stage 2 \u2014 Medium", title: "AI Social Media Post Generator", tech: "Python, Gemini API, FastAPI, React", desc: "Input topic + platform, generate 5 post variations, hashtag suggester, tone picker." },
      { stage: "Stage 3 \u2014 Hard", title: "AI Autonomous Web Scraper Agent", tech: "Python, LangChain Agents, Playwright, FastAPI", desc: "LLM-driven agent navigates sites, extracts structured data, CSV export, REST trigger." },
    ],
  },
  "bohrimohammad5253@gmail.com": {
    name: "Bohri Mohammad",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Monthly Revenue Trend Analyzer", tech: "Python, Pandas, Plotly, Excel", desc: "Sales transaction data, MoM revenue chart, growth rate table, forecast line." },
      { stage: "Stage 2 \u2014 Medium", title: "Fraud Incident Analysis Report", tech: "Python, Pandas, Plotly, Power BI", desc: "Banking transaction log, fraud pattern by time/location, loss quantification dashboard." },
      { stage: "Stage 3 \u2014 Hard", title: "Supply Chain Analytics Command Center", tech: "Python, Pandas, Plotly, NetworkX, Streamlit", desc: "End-to-end supply chain data, bottleneck detection, vendor performance scoring." },
    ],
  },
  "bansodapurva31@gmail.com": {
    name: "Apurva Niranjankumar Bansod",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Customer Satisfaction Survey Analyzer", tech: "Python, Pandas, Matplotlib, WordCloud", desc: "NPS survey data, score distribution, open-comment word cloud, segment heatmap." },
      { stage: "Stage 2 \u2014 Medium", title: "Logistics Delivery Performance Tracker", tech: "Python, Pandas, Folium, Plotly", desc: "Shipment dataset, on-time vs delayed %, carrier comparison, city delay heatmap." },
      { stage: "Stage 3 \u2014 Hard", title: "Customer 360 Analytics Platform", tech: "Python, Pandas, Scikit-learn, Plotly, Streamlit", desc: "Multi-source customer data merge, segment profiling, propensity scoring dashboard." },
    ],
  },
  "nidhipatil1405@gmail.com": {
    name: "Nidhi Gopal Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "AI Flashcard Generator", tech: "Python, Gemini API, Streamlit", desc: "Paste study topic text, AI creates Q&A flashcards, quiz mode, export to PDF." },
      { stage: "Stage 2 \u2014 Medium", title: "AI Meeting Minutes Generator", tech: "Python, Whisper ASR, Gemini API, Streamlit", desc: "Upload audio/transcript, AI extracts action items, decisions, summary, export DOCX." },
      { stage: "Stage 3 \u2014 Hard", title: "AI Personal Finance Advisor", tech: "Python, Gemini API, LangChain, Streamlit", desc: "Upload bank statement PDF, transaction categorization, savings suggestions, Q&A on spending." },
    ],
  },
  "mansinbn23@gmail.com": {
    name: "Mansi Jadhav",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Amazon Top-50 Bestsellers Analysis", tech: "Python, Pandas, Seaborn, Plotly", desc: "Bestsellers dataset, genre/price/rating scatter, fiction vs non-fiction KPIs." },
      { stage: "Stage 2 \u2014 Medium", title: "Football Player Performance EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "FBRef dataset, top scorer/passer/dribbler charts, radar comparison, club analysis." },
      { stage: "Stage 3 \u2014 Hard", title: "Open Government Data Story Dashboard", tech: "Python, Pandas, Plotly, Geopandas, Streamlit", desc: "Central/state open data portal, 5-year trend story, annotation layer, shareable embed." },
    ],
  },
  "dipalibadgujar53@gmail.com": {
    name: "Dipali Manohar Badgujar",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "AI News Headline Summarizer", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Enter news URL, AI fetches + summarizes in 3 bullet points, share button." },
      { stage: "Stage 2 \u2014 Medium", title: "AI Personalized Study Planner", tech: "Python, Gemini API, FastAPI, React", desc: "Input subjects + exam date, AI generates day-wise study plan, progress tracker, reminder setup." },
      { stage: "Stage 3 \u2014 Hard", title: "Multimodal Image Caption Generator", tech: "Python, BLIP-2 HuggingFace, FastAPI, React", desc: "Upload image \u2192 generate descriptive caption, style selector (formal/casual/SEO), batch API." },
    ],
  },
  "salunkenikita2206@gmail.com": {
    name: "Nikita Prakash Salunke",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "E-Commerce Mobile App Redesign", tech: "Figma, FigJam, Maze", desc: "User research (5 interviews), affinity map, wireframes, hi-fi prototype, usability test report." },
      { stage: "Stage 2 \u2014 Medium", title: "Healthcare Patient Portal UX", tech: "Figma, Maze, Miro", desc: "Personas, patient journey map, accessibility audit, interactive prototype, A/B test plan." },
      { stage: "Stage 3 \u2014 Hard", title: "AI Product Dashboard Design System", tech: "Figma, Tokens Studio, Storybook (handoff)", desc: "Design tokens, component library (50+ atoms), dark/light mode, dev handoff specs, motion guide." },
    ],
  },
  "mohitkarankal2006@gmail.com": {
    name: "Mohit Karankal",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Student Result Portal", tech: "React.js, Node.js, PostgreSQL, JWT", desc: "Admin uploads results, student login views own grades, semester GPA chart." },
      { stage: "Stage 2 \u2014 Medium", title: "Blog Publishing Platform", tech: "Next.js, Node.js, MongoDB, Cloudinary, MDX", desc: "Rich text editor, image upload, tag system, comment section, author dashboard." },
      { stage: "Stage 3 \u2014 Hard", title: "Healthcare Appointment System", tech: "Next.js, Node.js, PostgreSQL, Twilio, Google Calendar API", desc: "Doctor search, availability calendar, SMS reminder, prescription notes, admin panel." },
    ],
  },
  "ashwinipatil542005@gmail.com": {
    name: "Ashwini Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Contact Directory App", tech: "React.js, Node.js, MySQL, JWT", desc: "Add/edit/delete contacts, search, group filter, import/export CSV, profile photo upload." },
      { stage: "Stage 2 \u2014 Medium", title: "Budget Tracking Web App", tech: "React.js, Node.js, PostgreSQL, Chart.js", desc: "Income/expense CRUD, category budget, monthly summary chart, CSV export." },
      { stage: "Stage 3 \u2014 Hard", title: "Freelance Marketplace Platform", tech: "Next.js, Node.js, MongoDB, Stripe Connect, Socket.io", desc: "Gig listing/bidding, milestone payments, client-freelancer chat, review system." },
    ],
  },
  "aakashpatil93700@gmail.com": {
    name: "Aakash Pradeep Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Simple Blog Platform", tech: "React.js, Express, MongoDB, JWT", desc: "Write/publish/delete posts, categories, comment section, author dashboard, rich text editor." },
      { stage: "Stage 2 \u2014 Medium", title: "Service Booking Portal", tech: "Next.js, Node.js, PostgreSQL, Nodemailer", desc: "Service listing, slot selection, email confirmation, booking history, admin panel." },
      { stage: "Stage 3 \u2014 Hard", title: "Real-Time Online Auction Platform", tech: "React.js, Node.js, Socket.io, PostgreSQL, Stripe", desc: "Live bidding, countdown timers, bid history, Stripe escrow, push notification." },
    ],
  },
  "borsekrushnai349@gmail.com": {
    name: "Krushnai Chandrashekhar Borse",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Currency Converter App", tech: "React.js, ExchangeRate API, CSS3", desc: "Real-time currency conversion, 10-currency selector, rate history mini chart." },
      { stage: "Stage 2 \u2014 Medium", title: "Pomodoro Productivity Timer", tech: "React.js, Tailwind, Framer Motion", desc: "Work/break cycle timer, session log, progress ring animation, sound alert, dark mode." },
      { stage: "Stage 3 \u2014 Hard", title: "3D Interactive Portfolio", tech: "React.js, Three.js, Tailwind, GSAP", desc: "3D scene hero, scroll-triggered animations, interactive project cards, WebGL background." },
    ],
  },
  "ishitapatercpit21@gmail.com": {
    name: "Ishita Pate",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "BMI Calculator with Chart", tech: "React.js, Chart.js, Tailwind CSS", desc: "Height/weight inputs, BMI result, healthy-range bar chart, category badge." },
      { stage: "Stage 2 \u2014 Medium", title: "Crypto Price Tracker Dashboard", tech: "React.js, CoinGecko API, Chart.js, Tailwind", desc: "Live crypto prices, 7-day sparkline, watchlist, gainers/losers cards." },
      { stage: "Stage 3 \u2014 Hard", title: "Travel Itinerary Planner", tech: "React.js, Mapbox GL JS, Tailwind, LocalStorage", desc: "Destination search, day-wise drag-drop planner, map pin plotting, PDF itinerary export." },
    ],
  },
  "devkhairnar23@gmail.com": {
    name: "Devang Bhavesh Khairnar",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Google Play Store App Analysis", tech: "Python, Pandas, Plotly, Seaborn", desc: "App metadata, category distribution, rating histogram, installs vs reviews scatter." },
      { stage: "Stage 2 \u2014 Medium", title: "Global Inflation Impact Study", tech: "Python, Pandas, Plotly, Geopandas", desc: "IMF CPI data, country inflation choropleth, commodity correlation, policy comparison." },
      { stage: "Stage 3 \u2014 Hard", title: "Sports Analytics Deep Dive Platform", tech: "Python, Pandas, Plotly, Scikit-learn, Streamlit", desc: "Multi-season player + match data, performance clustering, scouting score, radar charts." },
    ],
  },
  "swap0817@gmail.com": {
    name: "Shubham Wagh",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Museum Visitors Data Analysis", tech: "Python, Pandas, Matplotlib, Plotly", desc: "Attendance data by year/exhibit, peak period finder, visitor growth chart." },
      { stage: "Stage 2 \u2014 Medium", title: "Road Safety in India Analysis", tech: "Python, Pandas, Folium, Plotly", desc: "MoRTH accident data, state-level fatality map, cause breakdown, seasonal trend." },
      { stage: "Stage 3 \u2014 Hard", title: "Food Security & Hunger Index EDA", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "GHI dataset, calorie availability, drought correlation, 2030 risk forecast map." },
    ],
  },
  "priyankaspatil21012006@gmail.com": {
    name: "Priyanka Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Zomato Pune Restaurant EDA", tech: "Python, Pandas, Seaborn, Folium", desc: "Local restaurant data, locality cuisine map, cost vs rating scatter, top-rated list." },
      { stage: "Stage 2 \u2014 Medium", title: "E-Commerce Funnel Drop-off Study", tech: "Python, Pandas, Plotly, Streamlit", desc: "Clickstream + purchase data, funnel conversion, drop-off root-cause, A/B segment." },
      { stage: "Stage 3 \u2014 Hard", title: "Trade & Export Pattern Analyzer", tech: "Python, Pandas, Plotly, NetworkX, Geopandas", desc: "UN Comtrade data, trade flow Sankey, commodity dependency, partner diversification score." },
    ],
  },
  "adityapagare3012@gmail.com": {
    name: "Aditya Pagare",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Website Traffic Analytics Dashboard", tech: "Python, Pandas, Plotly, Streamlit", desc: "GA-export style dataset, sessions/bounce/CTR KPIs, traffic source pie, time-series." },
      { stage: "Stage 2 \u2014 Medium", title: "Ad Spend Attribution Analyzer", tech: "Python, Pandas, Plotly, Streamlit", desc: "Multi-touch attribution model on ad data, channel ROAS, budget reallocation table." },
      { stage: "Stage 3 \u2014 Hard", title: "HR Analytics & Workforce Planning Tool", tech: "Python, Pandas, Plotly, Scikit-learn, Power BI", desc: "Headcount forecast, attrition ML model, hiring pipeline tracker, cost projection." },
    ],
  },
  "sakshishimpi11@gmail.com": {
    name: "Sakshi Shimpi",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "WHO Global Health Statistics EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "Life expectancy, mortality, disease burden data, country ranking chart, decade trend." },
      { stage: "Stage 2 \u2014 Medium", title: "Electric Vehicle Adoption Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "EV registration data, charging station map, brand growth trend, range comparison." },
      { stage: "Stage 3 \u2014 Hard", title: "Environmental Pollution Trends Study", tech: "Python, Pandas, Plotly, Folium, Prophet", desc: "CPCB AQI + water quality data, pollution hotspot map, season decomposition, 2027 forecast." },
    ],
  },
  "rushekesh456@gmail.com": {
    name: "Rushekesh Dusane",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Containerized Microservices on AWS", tech: "AWS ECS, Docker, ECR, ALB, Terraform, CloudWatch", desc: "3 microservices (auth/product/order), Docker build+push, ECS Fargate deploy, ALB routing, auto-scaling, CloudWatch logs." },
      { stage: "Stage 2 \u2014 Medium", title: "Multi-Region Disaster Recovery Setup", tech: "AWS EC2, RDS, S3, Route53, CloudFormation", desc: "Primary + failover region, RDS read replica, S3 cross-region replication, Route53 health-check failover, RTO/RPO report." },
      { stage: "Stage 3 \u2014 Hard", title: "Serverless Event-Driven Architecture", tech: "AWS Lambda, EventBridge, SQS, DynamoDB, API Gateway, CDK", desc: "Event bus triggers Lambdas, SQS fanout, DynamoDB CRUD, CDK IaC, end-to-end integration test." },
    ],
  },
  "chaudharidhanshri910@gmail.com": {
    name: "Dhanshri Prashant Chaudhari",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Bike Sharing Demand Forecaster", tech: "Python, Scikit-learn, Pandas, Plotly", desc: "Time-feature regression on Kaggle Bike dataset, hourly demand chart." },
      { stage: "Stage 2 \u2014 Medium", title: "E-Learning Course Recommender", tech: "Python, Surprise, Pandas, Streamlit", desc: "Collaborative filtering on Coursera-style data, personalized course list." },
      { stage: "Stage 3 \u2014 Hard", title: "Driver Drowsiness Detection System", tech: "Python, OpenCV, Dlib, Flask, Socket.io", desc: "Eye-aspect-ratio fatigue detector, real-time webcam alert, event log dashboard." },
    ],
  },
  "tanvipatil3434@gmail.com": {
    name: "Tanvi Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Expense Split App", tech: "React.js, Node.js, PostgreSQL, JWT", desc: "Group expense entry, smart split calculation, settlement tracker, email summary." },
      { stage: "Stage 2 \u2014 Medium", title: "College Event Management System", tech: "React.js, Node.js, MySQL, QR Code, Nodemailer", desc: "Event creation, student registration, QR pass, attendance scan, organizer dashboard." },
      { stage: "Stage 3 \u2014 Hard", title: "Corporate HR & Payroll System", tech: "React.js, Node.js, PostgreSQL, PDF-lib, JWT", desc: "Employee records, attendance, leave management, payslip PDF generator, HR admin." },
    ],
  },
  "aishwaryasisodiya20@gmail.com": {
    name: "Aishwarya Prashant Sisodiya",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Poll & Voting App", tech: "React.js, Node.js, MongoDB, Socket.io", desc: "Create polls, real-time vote count, result chart, share link, expiry timer." },
      { stage: "Stage 2 \u2014 Medium", title: "Fitness Goal Tracker App", tech: "React.js, Node.js, PostgreSQL, Chart.js", desc: "Workout log, goal setter, streak calendar, progress chart, notification reminder." },
      { stage: "Stage 3 \u2014 Hard", title: "Supply Chain Tracking Platform", tech: "Next.js, Node.js, MongoDB, Mapbox, QR Code", desc: "Shipment creation, QR scan checkpoints, live map route, ETA prediction, stakeholder portal." },
    ],
  },
  "harshadamore.415@gmail.com": {
    name: "Harshada Jagdish More",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Kaggle Survey Data Science Trends", tech: "Python, Pandas, Plotly, Seaborn", desc: "Annual Kaggle survey data, tool popularity, salary by country, experience distribution." },
      { stage: "Stage 2 \u2014 Medium", title: "Mental Health & Workplace Survey EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "OSMI survey data, industry breakdown, treatment-seeking rate, remote work impact." },
      { stage: "Stage 3 \u2014 Hard", title: "Demographic Dividend Analysis", tech: "Python, Pandas, Plotly, Geopandas, Statsmodels", desc: "Census data, age pyramid animation, dependency ratio, workforce projection." },
    ],
  },
  "omwalke850@gmail.com": {
    name: "Om Jalindar Walke",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Recipe Book Web App", tech: "React.js, Node.js, MySQL, Cloudinary", desc: "Add/edit recipes, ingredient list, step-by-step view, image upload, search by ingredient." },
      { stage: "Stage 2 \u2014 Medium", title: "Online Polling & Survey Platform", tech: "React.js, Node.js, MongoDB, Chart.js", desc: "Create surveys, multi-type questions, real-time results, export to CSV, share link." },
      { stage: "Stage 3 \u2014 Hard", title: "Crowdfunding Platform", tech: "Next.js, Node.js, MongoDB, Stripe, Socket.io", desc: "Campaign creation, reward tiers, Stripe pledge, live funding meter, backer notifications." },
    ],
  },
  "madhurakulkarni559@gmail.com": {
    name: "MADHURA KULKARNI",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Manual Test Plan for E-Commerce Site", tech: "Excel/Notion, Jira, Zephyr", desc: "Test scenarios for cart/checkout/auth, test cases, defect log, traceability matrix, execution report." },
      { stage: "Stage 2 \u2014 Medium", title: "Automated UI Testing with Selenium", tech: "Python, Selenium, Pytest, Allure", desc: "Page Object Model, 30 test cases for web app, CI run on GitHub Actions, Allure report." },
      { stage: "Stage 3 \u2014 Hard", title: "API Testing & Performance Dashboard", tech: "Postman, Newman, k6, Grafana", desc: "REST API collection (50 endpoints), schema validation, k6 load test (500 VU), Grafana metrics board." },
    ],
  },
  "prachimahajan2005@gmail.com": {
    name: "Prachi Anil Mahajan",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Breast Cancer Diagnosis Classifier", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "SVM on Wisconsin dataset, SHAP summary, diagnosis probability output." },
      { stage: "Stage 2 \u2014 Medium", title: "Resume Skill Gap Analyzer", tech: "Python, spaCy, Scikit-learn, Streamlit", desc: "NER on resume text, JD comparison, missing skill radar chart." },
      { stage: "Stage 3 \u2014 Hard", title: "Multilingual Sentiment Analyzer", tech: "Python, mBERT HuggingFace, FastAPI, React", desc: "5-language sentiment classification, language auto-detect, confidence dashboard." },
    ],
  },
  "khairnarharshada756@gmail.com": {
    name: "Harshada Jayprakash Khairnar",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Heart Attack Risk Screener", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "LR on Cleveland dataset, ROC-AUC, patient input widget." },
      { stage: "Stage 2 \u2014 Medium", title: "Grocery Demand Forecaster", tech: "Python, Prophet, Pandas, Plotly", desc: "Product-level time-series on Kaggle grocery data, 30-day demand forecast." },
      { stage: "Stage 3 \u2014 Hard", title: "AI-Powered Code Auto-Completer", tech: "Python, GPT-2 Fine-tuned, FastAPI, React", desc: "Train on GitHub code corpus, token-level prediction, inline IDE widget." },
    ],
  },
  "pujaaher2006@gmail.com": {
    name: "Pooja Aher",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Marketing Campaign Performance Report", tech: "Python, Pandas, Seaborn, Plotly", desc: "Multi-channel campaign data, ROI comparison, conversion funnel, A/B result table." },
      { stage: "Stage 2 \u2014 Medium", title: "Employee Productivity Score Card", tech: "Python, Pandas, Plotly, Excel", desc: "Task completion + attendance data, individual score, dept ranking, KPI drilldown." },
      { stage: "Stage 3 \u2014 Hard", title: "Executive KPI Scorecard Builder", tech: "Python, Pandas, Plotly, ReportLab, Streamlit", desc: "Auto-generate PDF KPI scorecards from uploaded data, drill-down filters, delta indicators." },
    ],
  },
  "sarthaksonje@gmail.com": {
    name: "Sarthak Mahesh Sonje",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Inventory Turnover Analysis", tech: "Python, Pandas, Plotly, Excel", desc: "Stock + sales data, days-on-hand metric, slow-mover alert, category comparison." },
      { stage: "Stage 2 \u2014 Medium", title: "Pricing Competitiveness Report", tech: "Python, Pandas, Seaborn, Plotly", desc: "Scraped competitor price data, price index by category, under/over-priced flag." },
      { stage: "Stage 3 \u2014 Hard", title: "Omnichannel Sales Attribution Dashboard", tech: "Python, Pandas, Plotly, Scikit-learn, Streamlit", desc: "Multi-channel order data, attribution modelling, revenue contribution chart, ROI optimizer." },
    ],
  },
  "pranalipatil9518@gmail.com": {
    name: "Pranali Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Student Grade Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Multiple regression on student features, grade range output, study-hours analyzer." },
      { stage: "Stage 2 \u2014 Medium", title: "Water Potability Classifier", tech: "Python, XGBoost, SHAP, Streamlit", desc: "Multi-feature water quality dataset, potability score, parameter importance." },
      { stage: "Stage 3 \u2014 Hard", title: "Generative Adversarial Image Synthesizer", tech: "Python, TensorFlow GAN, Flask, React", desc: "Train DCGAN on CelebA subset, latent space slider, image grid gallery." },
    ],
  },
  "pratikagrawal5065@gmail.com": {
    name: "pratik agrawal",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Stack Overflow Developer Survey EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "Developer survey data, language popularity, remote work trend, salary distribution." },
      { stage: "Stage 2 \u2014 Medium", title: "EdTech Platform Engagement EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "MOOC engagement dataset, course completion rate, dropout pattern, learner segment." },
      { stage: "Stage 3 \u2014 Hard", title: "Disaster Risk & Resilience Dashboard", tech: "Python, Pandas, Plotly, Folium, Scikit-learn", desc: "EM-DAT disaster data, economic loss regression, country resilience score, risk map." },
    ],
  },
  "siddhipc97@gmail.com": {
    name: "Siddhi",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Indian Railways Punctuality Study", tech: "Python, Pandas, Plotly, Folium", desc: "Train delay dataset, route-wise OTP analysis, busiest station map, seasonal trend." },
      { stage: "Stage 2 \u2014 Medium", title: "GST Revenue Collection Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-wise GST collection data, sector contribution, compliance rate trend, monthly pattern." },
      { stage: "Stage 3 \u2014 Hard", title: "Healthcare Infrastructure Gap Study", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "HMIS facility data, doctor-patient ratio map, underserved district finder, need score." },
    ],
  },
  "kirtipatilgcld17@gmail.com": {
    name: "Kirti Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Attendance & Punctuality Tracker", tech: "Python, Pandas, Matplotlib, Excel", desc: "Employee log data, late-arrival rate, dept comparison chart, monthly heatmap." },
      { stage: "Stage 2 \u2014 Medium", title: "Budget vs Actual Variance Dashboard", tech: "Python, Pandas, Plotly, Power BI", desc: "Finance dataset, dept-wise variance, overspend flag, waterfall variance chart." },
      { stage: "Stage 3 \u2014 Hard", title: "Demand Forecasting & Inventory Optimizer", tech: "Python, Prophet, Pandas, Plotly, Streamlit", desc: "Product-level demand forecast, reorder point calculator, overstock/understock alert." },
    ],
  },
  "pandhareharshal45@gmail.com": {
    name: "Harshal Pandhare",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Static Site Hosting with CDN on AWS", tech: "AWS S3, CloudFront, Route53, ACM, Terraform", desc: "Deploy static React app to S3, CloudFront distribution, custom domain via Route53, SSL cert, cache invalidation." },
      { stage: "Stage 2 \u2014 Medium", title: "Cloud Cost Optimization Dashboard", tech: "AWS Cost Explorer API, Python, Grafana, Terraform", desc: "Fetch billing data, visualize spend by service/tag, anomaly alert, right-sizing recommendation report." },
      { stage: "Stage 3 \u2014 Hard", title: "Full CI/CD Pipeline with Kubernetes", tech: "GitHub Actions, Docker, Amazon EKS, Helm, Prometheus, Grafana", desc: "Full CI pipeline, rolling deployments, Helm charts, Grafana monitoring dashboard, alert rules." },
    ],
  },
  "harshalbhaisare0611@gmail.com": {
    name: "Harshal Kishor Bhaisare",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Car Price Estimator", tech: "Python, Scikit-learn, Pandas, Plotly", desc: "Regression on car dataset, mileage/brand/year inputs, residual analysis." },
      { stage: "Stage 2 \u2014 Medium", title: "Earthquake Risk Zone Mapper", tech: "Python, Scikit-learn, Pandas, Folium", desc: "USGS seismic data, magnitude regression, risk choropleth, alert setter." },
      { stage: "Stage 3 \u2014 Hard", title: "Vehicle License Plate OCR System", tech: "Python, YOLOv8, PaddleOCR, Flask", desc: "Detect + read plates from images/video, confidence score, CSV export." },
    ],
  },
  "sakshivyavahare20@gmail.com": {
    name: "Sakshi Sandipan Vyavhare",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Swiggy/Zomato Delivery Time EDA", tech: "Python, Pandas, Seaborn, Plotly", desc: "Food delivery dataset, avg delivery time by area, weather impact, partner performance." },
      { stage: "Stage 2 \u2014 Medium", title: "E-Waste Generation & Recycling EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "Global e-waste dataset, country production rate, recycling gap, 2030 projection." },
      { stage: "Stage 3 \u2014 Hard", title: "Agricultural Market Price Analyzer", tech: "Python, Pandas, Prophet, Plotly, Streamlit", desc: "AGMARKNET mandi price data, commodity price forecast, seasonal pattern, state comparison." },
    ],
  },
  "palakpawar556@gmail.com": {
    name: "Palak Ramchandra Pawar",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Air Quality Index India EDA", tech: "Python, Pandas, Plotly, Folium", desc: "CPCB AQI city dataset, pollutant breakdown, season comparison, worst city ranking." },
      { stage: "Stage 2 \u2014 Medium", title: "Indian Tourism & Travel Trends EDA", tech: "Python, Pandas, Plotly, Folium", desc: "Domestic/international tourist data, top destination map, seasonal pattern, revenue analysis." },
      { stage: "Stage 3 \u2014 Hard", title: "Women Workforce Participation Study", tech: "Python, Pandas, Plotly, Geopandas, Seaborn", desc: "ILO + Census data, sector-wise participation, wage gap analysis, decade trend map." },
    ],
  },
  "devyanichavhan67@gmail.com": {
    name: "Dhanshri Prakash Chavhan",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Age Calculator App", tech: "React.js, Tailwind CSS", desc: "DOB input, exact age in years/months/days, next birthday countdown, zodiac sign display." },
      { stage: "Stage 2 \u2014 Medium", title: "Trivia Quiz Game", tech: "React.js, Open Trivia DB API, Framer Motion, Tailwind", desc: "Category/difficulty picker, timed questions, score animation, share card." },
      { stage: "Stage 3 \u2014 Hard", title: "Music Player with Visualizer", tech: "React.js, Web Audio API, Canvas, CSS3", desc: "Upload MP3, frequency bar visualizer, waveform display, playlist, equalizer, keyboard controls." },
    ],
  },
  "pratikshatarnge567@gmail.com": {
    name: "Pratiksha Tarange",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Bollywood Box Office EDA", tech: "Python, Pandas, Seaborn, Plotly", desc: "2000-2024 movie data, genre revenue trend, actor/director impact, OTT vs theatre compare." },
      { stage: "Stage 2 \u2014 Medium", title: "Banking NPA & Loan Default EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "RBI/banking NPA dataset, sector-wise default rate, trend analysis, recovery rate compare." },
      { stage: "Stage 3 \u2014 Hard", title: "Public Transport Efficiency Dashboard", tech: "Python, Pandas, Plotly, Folium, Scikit-learn", desc: "GTFS transit data, route coverage, ridership forecast, underserved zone identifier." },
    ],
  },
  "saniyapatil316@gmail.com": {
    name: "Saniya Sudharma Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Complaint Management Portal", tech: "React.js, Node.js, PostgreSQL, Nodemailer", desc: "Submit complaint, status tracking, admin resolve panel, email notification, report export." },
      { stage: "Stage 2 \u2014 Medium", title: "Student Attendance Management System", tech: "React.js, Node.js, MySQL, Chart.js, JWT", desc: "Teacher marks attendance, student view, monthly report, absentee alert email." },
      { stage: "Stage 3 \u2014 Hard", title: "Online Examination Portal", tech: "React.js, Node.js, PostgreSQL, Socket.io", desc: "Question bank, timed exam, auto-grading, plagiarism detection, result analytics." },
    ],
  },
  "pratikmagar2006@gmail.com": {
    name: "Pratik Magar",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Paytm/UPI Transaction Trend EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "Digital payment trend data, transaction volume growth, category split, city-wise adoption." },
      { stage: "Stage 2 \u2014 Medium", title: "Crop Minimum Support Price Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "MSP historical data, commodity price trend, procurement vs production gap, state map." },
      { stage: "Stage 3 \u2014 Hard", title: "Digital India Adoption Tracker", tech: "Python, Pandas, Plotly, Geopandas, Prophet", desc: "TRAI + MEITY data, internet penetration trend, state comparison, 2030 projection." },
    ],
  },
  "darshanakhadmal20@gmail.com": {
    name: "Darshan Akhadmal",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Employee Salary Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Ridge regression on HR dataset, role/experience/location inputs, salary band output." },
      { stage: "Stage 2 \u2014 Medium", title: "Video Game Genre Classifier", tech: "Python, Scikit-learn, NLP, Streamlit", desc: "Text + metadata features on game descriptions, multi-class genre tagger." },
      { stage: "Stage 3 \u2014 Hard", title: "Real-Time Emotion Recognition Camera", tech: "Python, TensorFlow, OpenCV, Flask, Socket.io", desc: "FER2013 CNN, live webcam emotion overlay, session emotion timeline chart." },
    ],
  },
  "panchalnishita776@gmail.com": {
    name: "Nisheeta Panchal",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "NEET/JEE Exam Performance EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "Entrance exam result dataset, state-wise performance, score distribution, category analysis." },
      { stage: "Stage 2 \u2014 Medium", title: "Mobile App Usage Pattern EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "App usage log dataset, session length distribution, retention rate, top feature usage, hour-of-day pattern." },
      { stage: "Stage 3 \u2014 Hard", title: "Cost of Living Comparative Study", tech: "Python, Pandas, Plotly, Seaborn, Streamlit", desc: "Numbeo + govt data, city-wise cost index, purchasing power comparison, affordability score." },
    ],
  },
  "nikamharshada27@gmail.com": {
    name: "Nikam Harshada Shankarrao",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Loan Approval Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Binary classifier on loan dataset, approval probability, explainability report." },
      { stage: "Stage 2 \u2014 Medium", title: "Customer Lifetime Value Predictor", tech: "Python, Lifetimes, Pandas, Plotly", desc: "BG/NBD model on retail transaction data, CLV segment dashboard." },
      { stage: "Stage 3 \u2014 Hard", title: "Predictive Maintenance System", tech: "Python, XGBoost, SHAP, FastAPI, React", desc: "Sensor time-series, failure probability, remaining useful life estimator dashboard." },
    ],
  },
  "mayuripatil5111@gmail.com": {
    name: "Mayuri Santosh Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Flight Price Predictor", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "Regression on flight booking data, airline/stops/date inputs, fare estimate." },
      { stage: "Stage 2 \u2014 Medium", title: "Medical Cost Prediction Model", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Regression on insurance dataset, risk-factor inputs, premium estimator." },
      { stage: "Stage 3 \u2014 Hard", title: "AI Document QA Bot", tech: "Python, LangChain, FAISS, Gemini API, Streamlit", desc: "Multi-PDF ingestion, semantic search, cited answer generation, history log." },
    ],
  },
  "soham6351patil@gmail.com": {
    name: "Soham patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Supermarket Sales Forecaster", tech: "Python, Scikit-learn, Pandas, Plotly", desc: "Linear regression on grocery data, product-line revenue chart, seasonality note." },
      { stage: "Stage 2 \u2014 Medium", title: "Shipping Delay Classifier", tech: "Python, XGBoost, Pandas, Plotly", desc: "E-commerce supply chain dataset, delay risk predictor, dashboard." },
      { stage: "Stage 3 \u2014 Hard", title: "Object Counting in Crowd Images", tech: "Python, YOLOv8, OpenCV, Streamlit", desc: "Fine-tune on crowd dataset, density map, zone-based count overlay." },
    ],
  },
  "poonamnanapatil29@gmail.com": {
    name: "Poonam Nana Patil",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Penguin Species Classifier", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "KNN on Palmer Penguins, 3-class confusion matrix, species image map." },
      { stage: "Stage 2 \u2014 Medium", title: "Energy Usage Anomaly Detector", tech: "Python, Isolation Forest, Pandas, Plotly", desc: "Smart meter data, unsupervised anomaly detection, alert timeline." },
      { stage: "Stage 3 \u2014 Hard", title: "Time Series Anomaly Detection Dashboard", tech: "Python, LSTM Autoencoder, Keras, Streamlit", desc: "Encode-decode reconstruction error, anomaly threshold, multi-sensor dashboard." },
    ],
  },
  "chaudharih480@gmail.com": {
    name: "Hemangi Chaudhari",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Customer Purchase Intent Predictor", tech: "Python, Pandas, Scikit-learn, Seaborn", desc: "Logistic Regression on online shoppers dataset, intent probability, session features." },
      { stage: "Stage 2 \u2014 Medium", title: "Forest Fire Risk Classifier", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Algerian forest fire dataset, weather features, risk zone map overlay." },
      { stage: "Stage 3 \u2014 Hard", title: "AI Caption Generator for Accessibility", tech: "Python, BLIP-2 HuggingFace, gTTS, FastAPI", desc: "Image \u2192 descriptive caption \u2192 audio TTS, accessibility download bundle." },
    ],
  },
  "aaditirane18@gmail.com": {
    name: "Aaditi Rane",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Rain Tomorrow Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Binary weather classifier on Australia dataset, precision-recall, tomorrow prediction form." },
      { stage: "Stage 2 \u2014 Medium", title: "News Category Classifier", tech: "Python, TF-IDF, Scikit-learn, Flask", desc: "Multi-class classifier on AG News, REST API, live headline tagger." },
      { stage: "Stage 3 \u2014 Hard", title: "Explainable AI Dashboard XAI", tech: "Python, SHAP, LIME, Plotly, Streamlit", desc: "Multi-model explanations (RF, XGB, NN), SHAP waterfall + force plots, LIME text." },
    ],
  },
  "omc894806@gmail.com": {
    name: "Om Dnyaneshwar Chaudhari",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Air Passenger Count Forecaster", tech: "Python, Statsmodels ARIMA, Pandas, Matplotlib", desc: "Classic airline dataset, ARIMA fit, 12-month forecast chart." },
      { stage: "Stage 2 \u2014 Medium", title: "Sentiment Analysis on Product Feedback", tech: "Python, VADER, Scikit-learn, Streamlit", desc: "Customer feedback CSV, positive/negative/neutral classifier, word cloud, topic trend chart." },
      { stage: "Stage 3 \u2014 Hard", title: "Hate Speech Detection API", tech: "Python, BERT HuggingFace, FastAPI, React", desc: "Fine-tune on hate speech dataset, category scores, moderation webhook." },
    ],
  },
  "vidhiborse369@gmail.com": {
    name: "Vidhi Borse",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Social Media KPI Tracker", tech: "Python, Pandas, Plotly, Streamlit", desc: "Platform metrics dataset, follower growth, engagement rate, post-type performance." },
      { stage: "Stage 2 \u2014 Medium", title: "Customer Complaint Root-Cause Report", tech: "Python, Pandas, LDA, Plotly", desc: "Support ticket text + category, complaint cluster, resolution-time trend, priority matrix." },
      { stage: "Stage 3 \u2014 Hard", title: "Financial Risk Exposure Dashboard", tech: "Python, Pandas, Plotly, Scikit-learn, Streamlit", desc: "Portfolio data, VaR calculation, sector concentration, stress-test scenario builder." },
    ],
  },
  "darshanshinde2326@gmail.com": {
    name: "Darshan Shinde",
    projects: [
      { stage: "Stage 1 \u2014 Simple", title: "Indian Agriculture Production EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-wise crop production data, seasonal pattern, yield per hectare, top producing states." },
      { stage: "Stage 2 \u2014 Medium", title: "Indian Startup Unicorn Study", tech: "Python, Pandas, Plotly, NetworkX", desc: "Unicorn company data, sector breakdown, funding journey, founding year trend, city concentration map." },
      { stage: "Stage 3 \u2014 Hard", title: "Youth Unemployment Crisis EDA", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "ILO youth employment data, skill mismatch index, district risk map, policy gap finder." },
    ],
  },
};

// Batch July 2026 — students mapped by email, domain-wise projects assigned
const STUDENT_EMAIL_PROJECTS: Record<string, any> = {
  "ap@hiresnix.co.in": {
    name: "AP",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "BMI Calculator App", tech: "Flutter, Dart", desc: "Height/weight input, BMI result, category color, history list, dark mode." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Expense Tracker App", tech: "Flutter, Dart, SQLite, Charts", desc: "Income/expense CRUD, category budget, monthly trend chart, PDF report." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Food Delivery App", tech: "Flutter, Dart, Firebase, Google Maps", desc: "Restaurant listing, live tracking, real-time orders, driver app, ratings." },
    ],
  },
  "amar@gmail.com": {
    name: "Amar BorsePatil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Keyword-Based FAQ Chatbot", tech: "Python, NLTK, Flask, Bootstrap", desc: "Intent matching on custom FAQ dataset, response retrieval, multi-turn conversation log." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Interview Question Generator", tech: "Python, Gemini API, FastAPI, React", desc: "Upload JD/resume, generate role-specific questions by difficulty, PDF export." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Agent Task Automation System", tech: "Python, LangChain Agents, FastAPI, React", desc: "Planner + executor agents, multi-step task decomposition, tool use (search/code/file)." },
    ],
  },
  "rohanrpatil1204@gmail.com": {
    name: "Rohan Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Personal Portfolio Website", tech: "React.js, CSS3, EmailJS", desc: "Animated hero, projects grid, skills bar, contact form, dark/light toggle." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Job Board UI with Filters", tech: "React.js, Tailwind CSS, Context API", desc: "Job card listing, search + multi-filter, bookmark, pagination, skeleton loader." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Collaborative Notes App", tech: "React.js, Socket.io, Tailwind, Quill.js", desc: "Multi-user note editing, live cursor, undo/redo, room links, export PDF." },
    ],
  },
  "girnaresumit@gmail.com": {
    name: "Sumit Girnare",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Personal Task Manager App", tech: "React.js, Node.js, MySQL, JWT", desc: "Task CRUD, priority tags, due-date filter, completion toggle, user auth." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Job Application Tracker", tech: "React.js, Node.js, PostgreSQL, Chart.js, JWT", desc: "Track applications by status, Kanban view, deadline alerts, stats dashboard." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Tenant Project Management SaaS", tech: "React.js, Node.js, PostgreSQL, Socket.io, Stripe", desc: "Org/workspace/board/card CRUD, real-time updates, role access, Stripe billing." },
    ],
  },
  "chaudhariom217@gmail.com": {
    name: "Om Chaudhari",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Iris Flower Species Classifier", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Logistic Regression on Iris dataset, confusion matrix, species predictor UI." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crop Yield Prediction System", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Regression on crop dataset, soil+weather inputs, district-level yield map." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Pose Estimation Trainer", tech: "Python, MediaPipe, TensorFlow, Flask, Socket.io", desc: "Live webcam pose detection, rep counter for exercises, form feedback API." },
    ],
  },
  "chaudharidhanshri900@gmail.com": {
    name: "Dhanshri Prashant Chaudhari",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Diabetes Risk Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Logistic Regression on Pima dataset, patient form, recall-optimized threshold." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "House Rent Price Predictor", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Feature engineering on rental dataset, neighborhood filter, rent estimator." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI-Powered Resume Parser & Ranker", tech: "Python, spaCy, BERT, FastAPI, React", desc: "Batch resume upload, JD matching, ranked shortlist, skills gap PDF report." },
    ],
  },
  "tanishkashivnikar@gmail.com": {
    name: "Tanishka Shivanikar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Currency Converter App", tech: "React.js, Exchange Rate API, Tailwind", desc: "Real-time rates, 150+ currencies, swap button, conversion history." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crypto Price Tracker Dashboard", tech: "React.js, CoinGecko API, Chart.js, Tailwind", desc: "Live prices, 7-day sparkline, portfolio tracker, price alert toggle." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "3D Interactive Portfolio", tech: "React.js, Three.js, GSAP, Tailwind", desc: "3D scene hero, scroll animations, project showcase, particle effects." },
    ],
  },
  "kumbhardarshana1308@gmail.com": {
    name: "Darshana Hari Kumbhar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Text Summarizer Tool", tech: "Python, HuggingFace BART, Streamlit", desc: "Paste article \u2192 abstractive summary, length slider, copy button." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Product Description Writer", tech: "Python, Gemini API, FastAPI, React", desc: "Enter product name + features, generate 3 tone-varied descriptions, SEO score." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "RAG Chatbot on Custom Knowledge Base", tech: "Python, LangChain, ChromaDB, Gemini API, Streamlit", desc: "Multi-PDF ingestion, vector embeddings, semantic search, source citation, multi-turn." },
    ],
  },
  "magarleena5@gmail.com": {
    name: "Leena Magar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "BMI Calculator with Chart", tech: "React.js, Chart.js, Tailwind CSS", desc: "Height/weight input, BMI result, category indicator, trend line chart." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Travel Itinerary Planner", tech: "React.js, Google Maps API, Tailwind", desc: "Trip builder, day-wise stops, map view, distance calculator, PDF export." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "E-Commerce Frontend with Cart", tech: "React.js, Redux, Stripe.js, Tailwind", desc: "Product listing, filters, cart, checkout flow, order confirmation, wishlist." },
    ],
  },
  "ervinaykulkarni@gmail.com": {
    name: "Vinay Kulkarni",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Boston Housing Price Estimator", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Linear/Ridge regression, RMSE/R\u00b2, residual plot, feature coefficient chart." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Road Traffic Volume Predictor", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Traffic dataset, time + weather features, city intersection heatmap." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sign Language to Text Converter", tech: "Python, MediaPipe, LSTM, TensorFlow, Gradio", desc: "Real-time hand gesture capture, sequence-to-text decoder, accuracy chart." },
    ],
  },
  "hemangirajput297@gmail.com": {
    name: "Rajput Hemangi Pravinsing",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Titanic Survival Predictor", tech: "Python, Pandas, Scikit-learn, Streamlit", desc: "Binary classification, feature engineering, ROC curve, Streamlit input form." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Twitter Sentiment Dashboard", tech: "Python, Tweepy, TextBlob, Plotly, Streamlit", desc: "Real-time tweet sentiment, trending keyword cloud, sentiment timeline." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Predictive Maintenance System", tech: "Python, Scikit-learn, Pandas, Plotly, Streamlit", desc: "Sensor time-series, failure prediction, maintenance schedule optimizer." },
    ],
  },
  "chanchalyogeshpatil@gmail.com": {
    name: "Chanchal Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "COVID-19 India State Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-level case/death/recovery data, choropleth map, peak identification." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Indian Stock Market EDA & Forecast", tech: "Python, Pandas, yfinance, Prophet, Plotly", desc: "NSE multi-stock OHLCV, 30-day forecast, sector performance comparison." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Social Mobility & Income Inequality Study", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "World Bank + OECD data, Gini index trend, mobility predictor, interactive report." },
    ],
  },
  "mrpaulr09@gmail.com": {
    name: "Rahul Paul",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Notes & Bookmarks Web App", tech: "React.js, Express, MongoDB, JWT", desc: "Create/edit/delete notes, tag system, URL bookmark saver, search filter." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Online Quiz Platform", tech: "React.js, Node.js, MongoDB, Socket.io", desc: "Question bank, timed quiz, live leaderboard, auto-grade, result analytics." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "E-Learning Platform with Certificates", tech: "React.js, Node.js, MongoDB, Cloudinary, Stripe", desc: "Course builder, video streaming, quiz engine, progress tracking, PDF cert generator." },
    ],
  },
  "sanket1904patil@gmail.com": {
    name: "Sanket Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Netflix Content EDA", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Genre distribution, country treemap, release-year trend analysis." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crime Pattern Analysis Dashboard", tech: "Python, Pandas, Folium, Plotly, Streamlit", desc: "City crime dataset, type/time/location EDA, monthly trend, hotspot map." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Smart City Sensor Data Analysis", tech: "Python, Pandas, Plotly, Folium, Prophet", desc: "IoT sensor dataset (air/noise/traffic), anomaly detection, zone comparison, forecast." },
    ],
  },
  "dhandekhushi05@gmail.com": {
    name: "Khushi Dhande",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Wine Quality Classifier", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "Multi-class RF on UCI Wine, accuracy comparison, feature importance chart." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Electricity Consumption Predictor", tech: "Python, Prophet, Pandas, Streamlit", desc: "Household power dataset, daily consumption forecast, anomaly flagging." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sarcasm Detection in Social Media", tech: "Python, RoBERTa HuggingFace, FastAPI, React", desc: "Fine-tune on Reddit sarcasm dataset, confidence score, batch CSV API." },
    ],
  },
  "gunjan.bhamare06@gmail.com": {
    name: "Gunjan Bhamare",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "World Population Growth Study", tech: "Python, Pandas, Plotly", desc: "UN population data, country growth rate chart, 2050 projection." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Air Quality Index India EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "AQI data across cities, pollutant trend, seasonal pattern analysis." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "NLP-Powered Financial Report Analyzer", tech: "Python, spaCy, Gensim, Plotly, Streamlit", desc: "Scrape annual report PDFs, topic extraction, sentiment trend, KPI comparison." },
    ],
  },
  "divyapatil30112006@gmail.com": {
    name: "Divya Sagar Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Spam SMS Detector", tech: "Python, NLTK, Naive Bayes, Streamlit", desc: "TF-IDF on SMS Spam Collection, ROC curve, live message tester." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Fake Job Posting Detector", tech: "Python, NLTK, TF-IDF, Scikit-learn, Streamlit", desc: "Binary NLP classifier on EMSCAD dataset, keyword explainability." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Driver Drowsiness Detection System", tech: "Python, OpenCV, MediaPipe, Keras, Flask", desc: "Real-time eye/face detection, drowsiness alert system, video feed demo." },
    ],
  },
  "sanumahajan7779@gmail.com": {
    name: "Sanika Yogesh Mahajan",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Iris Flower Species Classifier", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Logistic Regression on Iris dataset, confusion matrix, species predictor UI." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crop Yield Prediction System", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Regression on crop dataset, soil+weather inputs, district-level yield map." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Pose Estimation Trainer", tech: "Python, MediaPipe, TensorFlow, Flask, Socket.io", desc: "Live webcam pose detection, rep counter for exercises, form feedback API." },
    ],
  },
  "khairnarshailesh79@gmail.com": {
    name: "Shailesh Yogesh Khairnar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Quote & Motivation Generator", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Topic input, AI generates 5 quotes, mood filter, save-to-favourites." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Conversational Language Tutor", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Choose language + level, AI conducts lesson, grammar correction, vocab quiz." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Legal Contract Analyzer", tech: "Python, GPT-4o/Gemini, LangChain, Streamlit", desc: "Upload contract PDF, clause extraction, risk flagging, plain-English summary." },
    ],
  },
  "tawarevaishnavi7@gmail.com": {
    name: "Vaishnavi Taware",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Diabetes Risk Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Logistic Regression on Pima dataset, patient form, recall-optimized threshold." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "House Rent Price Predictor", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Feature engineering on rental dataset, neighborhood filter, rent estimator." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI-Powered Resume Parser & Ranker", tech: "Python, spaCy, BERT, FastAPI, React", desc: "Batch resume upload, JD matching, ranked shortlist, skills gap PDF report." },
    ],
  },
  "akshaysaitwal9@gmail.com": {
    name: "SAITWAL  AKSHAY  MADHUKAR",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Boston Housing Price Estimator", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Linear/Ridge regression, RMSE/R\u00b2, residual plot, feature coefficient chart." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Road Traffic Volume Predictor", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Traffic dataset, time + weather features, city intersection heatmap." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sign Language to Text Converter", tech: "Python, MediaPipe, LSTM, TensorFlow, Gradio", desc: "Real-time hand gesture capture, sequence-to-text decoder, accuracy chart." },
    ],
  },
  "dhangarmayuri97@gmail.com": {
    name: "Mayuri Arun Dhangar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Titanic Survival Predictor", tech: "Python, Pandas, Scikit-learn, Streamlit", desc: "Binary classification, feature engineering, ROC curve, Streamlit input form." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Twitter Sentiment Dashboard", tech: "Python, Tweepy, TextBlob, Plotly, Streamlit", desc: "Real-time tweet sentiment, trending keyword cloud, sentiment timeline." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Predictive Maintenance System", tech: "Python, Scikit-learn, Pandas, Plotly, Streamlit", desc: "Sensor time-series, failure prediction, maintenance schedule optimizer." },
    ],
  },
  "raj.zore24@pcu.edu.in": {
    name: "Raj Suresh Zore",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Recipe Generator from Ingredients", tech: "Python, Gemini API, Streamlit", desc: "Enter available ingredients, AI suggests 3 recipes with steps, dietary filter." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Document Classifier", tech: "Python, spaCy, BERT, FastAPI", desc: "Multi-class document type tagger (invoice/contract/report), confidence, batch CSV API." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI-Powered Mock Interview Coach", tech: "Python, Whisper ASR, Gemini API, React, Flask", desc: "Voice-based interview, speech-to-text, AI follow-up questions, answer scoring, report." },
    ],
  },
  "chandrashekharkate21@gmail.com": {
    name: "chandrashekhar kate",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Wine Quality Classifier", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "Multi-class RF on UCI Wine, accuracy comparison, feature importance chart." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Electricity Consumption Predictor", tech: "Python, Prophet, Pandas, Streamlit", desc: "Household power dataset, daily consumption forecast, anomaly flagging." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sarcasm Detection in Social Media", tech: "Python, RoBERTa HuggingFace, FastAPI, React", desc: "Fine-tune on Reddit sarcasm dataset, confidence score, batch CSV API." },
    ],
  },
  "gavalineha913@gmail.com": {
    name: "Neha Gavali",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Spam SMS Detector", tech: "Python, NLTK, Naive Bayes, Streamlit", desc: "TF-IDF on SMS Spam Collection, ROC curve, live message tester." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Fake Job Posting Detector", tech: "Python, NLTK, TF-IDF, Scikit-learn, Streamlit", desc: "Binary NLP classifier on EMSCAD dataset, keyword explainability." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Driver Drowsiness Detection System", tech: "Python, OpenCV, MediaPipe, Keras, Flask", desc: "Real-time eye/face detection, drowsiness alert system, video feed demo." },
    ],
  },
  "bidketilak55@gmail.com": {
    name: "Tilak Rajendra Bidake",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Grammar Correction Assistant", tech: "Python, LanguageTool API, Flask, React", desc: "Text input, error highlighting, corrected output, confidence color-code." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Agentic Research Assistant", tech: "Python, LangChain, DuckDuckGo Tool, Streamlit", desc: "Input research topic, agent searches + summarizes web sources, cited report." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Autonomous Data Analysis Agent", tech: "Python, LangChain, Pandas, Streamlit", desc: "Upload CSV, agent auto-detects columns, runs EDA, generates insights report." },
    ],
  },
  "nandini20.kumawat@gmail.com": {
    name: "Nandini Kumawat",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Iris Flower Species Classifier", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Logistic Regression on Iris dataset, confusion matrix, species predictor UI." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crop Yield Prediction System", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Regression on crop dataset, soil+weather inputs, district-level yield map." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Pose Estimation Trainer", tech: "Python, MediaPipe, TensorFlow, Flask, Socket.io", desc: "Live webcam pose detection, rep counter for exercises, form feedback API." },
    ],
  },
  "kunal878818@gmail.com": {
    name: "Kunal Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "IPL Cricket Data Analysis", tech: "Python, Pandas, Plotly, Streamlit", desc: "Ball-by-ball data, player strike rate, team win%, venue run-rate." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Startup Ecosystem India Report", tech: "Python, Pandas, Plotly, NetworkX", desc: "Funding + sector data, investor network graph, city startup map." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Predictive Population Health Dashboard", tech: "Python, Pandas, Scikit-learn, Prophet, Plotly", desc: "District health data, disease burden forecast, risk stratification, intervention planner." },
    ],
  },
  "omdipakpatil02@gmail.com": {
    name: "Om Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Joke & Story Generator", tech: "Python, Gemini API, Streamlit", desc: "Genre/mood selector, AI-generated jokes or short stories, regenerate button." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Meeting Minutes Generator", tech: "Python, Whisper ASR, Gemini API, Streamlit", desc: "Upload audio recording, transcription, action items extraction, summary PDF." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Video Scene Describer", tech: "Python, CLIP HuggingFace, OpenCV, FastAPI", desc: "Upload video, keyframe extraction, CLIP caption per scene, narrative summary." },
    ],
  },
  "anushkabhamre55@gmail.com": {
    name: "Anushka Shamkant Bhamare",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Diabetes Risk Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Logistic Regression on Pima dataset, patient form, recall-optimized threshold." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "House Rent Price Predictor", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Feature engineering on rental dataset, neighborhood filter, rent estimator." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI-Powered Resume Parser & Ranker", tech: "Python, spaCy, BERT, FastAPI, React", desc: "Batch resume upload, JD matching, ranked shortlist, skills gap PDF report." },
    ],
  },
  "payaljawale4@gmail.com": {
    name: "Payal Jawale",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Age Calculator App", tech: "React.js, date-fns, Tailwind CSS", desc: "DOB input, exact age (years/months/days), next birthday countdown." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Music Player with Visualizer", tech: "React.js, Web Audio API, Canvas, Tailwind", desc: "Playlist CRUD, frequency visualizer, equalizer, waveform display." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Social Media Dashboard", tech: "React.js, Socket.io, Redux, Tailwind", desc: "Feed, stories, likes/comments real-time, notifications, dark mode." },
    ],
  },
  "vrushaliwadile0@gmail.com": {
    name: "Vrushali Wadile",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Boston Housing Price Estimator", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Linear/Ridge regression, RMSE/R\u00b2, residual plot, feature coefficient chart." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Road Traffic Volume Predictor", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Traffic dataset, time + weather features, city intersection heatmap." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sign Language to Text Converter", tech: "Python, MediaPipe, LSTM, TensorFlow, Gradio", desc: "Real-time hand gesture capture, sequence-to-text decoder, accuracy chart." },
    ],
  },
  "keshettycharan@gmail.com": {
    name: "Keshetty charan",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Titanic Survival EDA", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Passenger survival factors, age/class/gender breakdown." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Healthcare Cost Driver Analysis", tech: "Python, Pandas, Plotly, Scikit-learn", desc: "Insurance + hospital cost data, driver regression, cost by diagnosis." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Geospatial Urban Sprawl Study", tech: "Python, Geopandas, OSMnx, Folium, Plotly", desc: "Satellite-derived urban boundary data, expansion rate, green cover loss, 3-city compare." },
    ],
  },
  "dvsalunkhe495@gmail.com": {
    name: "Darshan Vijay Salunkhe",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Zomato Restaurant EDA", tech: "Python, Pandas, Plotly, Streamlit", desc: "Restaurant ratings, cuisine trends, price analysis by city." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Electric Vehicle Adoption Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "EV registration data, state-wise adoption, charging infra correlation." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Agricultural Market Price Analyzer", tech: "Python, Pandas, Plotly, Prophet, Streamlit", desc: "APMC mandi price data, crop price forecast, seasonal trend, district comparison." },
    ],
  },
  "badgujaryash876@gmail.com": {
    name: "Yash Badgujar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Contact Directory App", tech: "React.js, Node.js, PostgreSQL, JWT", desc: "CRUD contacts, search/filter, import CSV, profile photos, dark mode." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Budget Tracking Web App", tech: "React.js, Node.js, PostgreSQL, Chart.js", desc: "Income/expense CRUD, category budgets, monthly trend chart, PDF report." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Healthcare Appointment System", tech: "React.js, Node.js, PostgreSQL, Socket.io, Nodemailer", desc: "Doctor/patient portal, slot booking, video consult, prescription PDF, reminders." },
    ],
  },
  "kajalpatils1206@gmail.com": {
    name: "Kajal Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "COVID-19 India State Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-level case/death/recovery data, choropleth map, peak identification." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Indian Stock Market EDA & Forecast", tech: "Python, Pandas, yfinance, Prophet, Plotly", desc: "NSE multi-stock OHLCV, 30-day forecast, sector performance comparison." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Social Mobility & Income Inequality Study", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "World Bank + OECD data, Gini index trend, mobility predictor, interactive report." },
    ],
  },
  "prathmeshpawar790@gmail.com": {
    name: "Prathmesh Vijay Pawar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Titanic Survival Predictor", tech: "Python, Pandas, Scikit-learn, Streamlit", desc: "Binary classification, feature engineering, ROC curve, Streamlit input form." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Twitter Sentiment Dashboard", tech: "Python, Tweepy, TextBlob, Plotly, Streamlit", desc: "Real-time tweet sentiment, trending keyword cloud, sentiment timeline." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Predictive Maintenance System", tech: "Python, Scikit-learn, Pandas, Plotly, Streamlit", desc: "Sensor time-series, failure prediction, maintenance schedule optimizer." },
    ],
  },
  "giraseswapnil5@gmail.com": {
    name: "Girase Swapnil Devising",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Wine Quality Classifier", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "Multi-class RF on UCI Wine, accuracy comparison, feature importance chart." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Electricity Consumption Predictor", tech: "Python, Prophet, Pandas, Streamlit", desc: "Household power dataset, daily consumption forecast, anomaly flagging." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sarcasm Detection in Social Media", tech: "Python, RoBERTa HuggingFace, FastAPI, React", desc: "Fine-tune on Reddit sarcasm dataset, confidence score, batch CSV API." },
    ],
  },
  "dhananjaypawar665@gmail.com": {
    name: "Dhananjay Pawar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Simple Blog Platform", tech: "React.js, Node.js, MongoDB, JWT", desc: "Create/edit posts, markdown editor, tags, comments, user profiles." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Student Attendance Management", tech: "React.js, Node.js, MySQL, JWT, Chart.js", desc: "QR code check-in, absent alerts, attendance report, teacher dashboard." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Online Auction Platform", tech: "React.js, Node.js, PostgreSQL, Socket.io, Stripe", desc: "Live bidding, countdown timer, auto-outbid, payment, seller dashboard." },
    ],
  },
  "bhaktishete24@gmail.com": {
    name: "Bhakti Shete",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Spam SMS Detector", tech: "Python, NLTK, Naive Bayes, Streamlit", desc: "TF-IDF on SMS Spam Collection, ROC curve, live message tester." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Fake Job Posting Detector", tech: "Python, NLTK, TF-IDF, Scikit-learn, Streamlit", desc: "Binary NLP classifier on EMSCAD dataset, keyword explainability." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Driver Drowsiness Detection System", tech: "Python, OpenCV, MediaPipe, Keras, Flask", desc: "Real-time eye/face detection, drowsiness alert system, video feed demo." },
    ],
  },
  "jidnyasabpatil08@gmail.com": {
    name: "Jidnyasa Brijlal Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Iris Flower Species Classifier", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Logistic Regression on Iris dataset, confusion matrix, species predictor UI." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crop Yield Prediction System", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Regression on crop dataset, soil+weather inputs, district-level yield map." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Pose Estimation Trainer", tech: "Python, MediaPipe, TensorFlow, Flask, Socket.io", desc: "Live webcam pose detection, rep counter for exercises, form feedback API." },
    ],
  },
  "yash11gaikwad@gmail.com": {
    name: "Yash Gaikwad",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Diabetes Risk Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Logistic Regression on Pima dataset, patient form, recall-optimized threshold." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "House Rent Price Predictor", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Feature engineering on rental dataset, neighborhood filter, rent estimator." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI-Powered Resume Parser & Ranker", tech: "Python, spaCy, BERT, FastAPI, React", desc: "Batch resume upload, JD matching, ranked shortlist, skills gap PDF report." },
    ],
  },
  "shubhangiyajgar12@gmail.com": {
    name: "Shubhangi Nanaso Yajgar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Recipe Book Web App", tech: "React.js, Express, MongoDB", desc: "Add/search recipes, ingredient list, step-by-step cooking mode, favorites." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Expense Split App", tech: "React.js, Node.js, MongoDB, Socket.io", desc: "Group expenses, auto-split, settle-up tracker, real-time balance update." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Freelance Marketplace Platform", tech: "React.js, Node.js, PostgreSQL, Stripe, Socket.io", desc: "Gig listing, proposal system, escrow payment, review/rating, chat." },
    ],
  },
  "patiltanuja781@gmail.com": {
    name: "PATIL TANUJA DHANRAJ",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Boston Housing Price Estimator", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Linear/Ridge regression, RMSE/R\u00b2, residual plot, feature coefficient chart." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Road Traffic Volume Predictor", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Traffic dataset, time + weather features, city intersection heatmap." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sign Language to Text Converter", tech: "Python, MediaPipe, LSTM, TensorFlow, Gradio", desc: "Real-time hand gesture capture, sequence-to-text decoder, accuracy chart." },
    ],
  },
  "np3493201@gmail.com": {
    name: "Nilesh Someshwar Patil",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Static Site Hosting with CDN on AWS", tech: "AWS S3, CloudFront, Route53", desc: "Deploy React app to S3, CloudFront distribution, custom domain, SSL cert." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Containerized Microservices on AWS", tech: "Docker, AWS ECS, ECR, ALB", desc: "Dockerize 3 microservices, push to ECR, deploy via ECS Fargate, ALB routing." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Region Disaster Recovery Setup", tech: "AWS Route53, RDS, S3, CloudFormation", desc: "Active-passive DR, RDS cross-region replica, Route53 health-check failover." },
    ],
  },
  "anirudhnarayanan2007@gmail.com": {
    name: "Anirudh.L",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Poll & Voting App", tech: "React.js, Node.js, PostgreSQL, Socket.io", desc: "Create polls, real-time vote count, results chart, expiry timer." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "College Event Management System", tech: "React.js, Node.js, PostgreSQL, Cloudinary", desc: "Event CRUD, registration, seat booking, QR ticket, attendance report." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Corporate HR & Payroll System", tech: "React.js, Node.js, PostgreSQL, PDFKit, JWT", desc: "Employee CRUD, leave management, payroll calculator, payslip PDF, role access." },
    ],
  },
  "deepashamahajan2006@gmail.com": {
    name: "Dipasha Pravin Mahajan",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "To-Do List App", tech: "Flutter, Dart, SQLite", desc: "Task CRUD, priority, due date, completion toggle, local storage." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Fitness Tracker App", tech: "Flutter, Dart, SQLite, HealthKit", desc: "Workout log, step counter, calorie burn, progress chart, goal setting." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Telemedicine App", tech: "Flutter, Dart, Firebase, Agora SDK", desc: "Doctor/patient portal, video consultation, prescription, appointment booking." },
    ],
  },
  "vishal89@gmail.com": {
    name: "Vishal VR",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Personal Task Manager App", tech: "React.js, Node.js, MySQL, JWT", desc: "Task CRUD, priority tags, due-date filter, completion toggle, user auth." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Job Application Tracker", tech: "React.js, Node.js, PostgreSQL, Chart.js, JWT", desc: "Track applications by status, Kanban view, deadline alerts, stats dashboard." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Tenant Project Management SaaS", tech: "React.js, Node.js, PostgreSQL, Socket.io, Stripe", desc: "Org/workspace/board/card CRUD, real-time updates, role access, Stripe billing." },
    ],
  },
  "tanviyeole1124@gmail.com": {
    name: "Tanvi Dipak Yeole",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Weather App", tech: "Flutter, Dart, OpenWeather API", desc: "Location-based weather, 5-day forecast, condition icons, unit toggle." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Recipe App with Offline Support", tech: "Flutter, Dart, SQLite, REST API", desc: "Search recipes, save offline, step-by-step cook mode, shopping list." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Social Media App", tech: "Flutter, Dart, Firebase, Cloud Functions", desc: "Feed, stories, real-time likes/comments, DM, notifications, explore page." },
    ],
  },
  "sanskrutipawar117@gmail.com": {
    name: "Sanskruti Pawar",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Currency Converter App", tech: "Flutter, Dart, Exchange Rate API", desc: "Real-time rates, swap currencies, conversion history, offline support." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Chat Application", tech: "Flutter, Dart, Firebase", desc: "Real-time messaging, read receipts, image sharing, push notifications." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Ride-Sharing App", tech: "Flutter, Dart, Firebase, Google Maps, Stripe", desc: "Driver/rider app, live tracking, fare calculator, payment, ratings." },
    ],
  },
  "conqueringtheworld05@gmail.com": {
    name: "Om Rajput",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Netflix Content EDA", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Genre distribution, country treemap, release-year trend analysis." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crime Pattern Analysis Dashboard", tech: "Python, Pandas, Folium, Plotly, Streamlit", desc: "City crime dataset, type/time/location EDA, monthly trend, hotspot map." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Smart City Sensor Data Analysis", tech: "Python, Pandas, Plotly, Folium, Prophet", desc: "IoT sensor dataset (air/noise/traffic), anomaly detection, zone comparison, forecast." },
    ],
  },
  "jagrutid455@gmail.com": {
    name: "jagruti pramod deshmukh",
    projects: [
      { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Pomodoro Productivity Timer", tech: "React.js, Tailwind, Web Audio API", desc: "25/5 min timer, custom intervals, session counter, break alarm sound." },
      { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Recipe Finder App", tech: "React.js, Spoonacular API, Tailwind", desc: "Ingredient-based search, dietary filter, nutrition info, save favorites." },
      { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Online Code Editor", tech: "React.js, Monaco Editor, Tailwind, Piston API", desc: "Multi-language support, syntax highlight, run code, share snippet, themes." },
    ],
  },
};

const STUDENT_PROJECTS: Record<string, any> = {
  'NIK001': { name: "NIKITA PATIL", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Personal Task Manager App", tech: "React.js, Node.js, MySQL, JWT", desc: "Task CRUD, priority tags, due-date filter, completion toggle, user auth." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Job Application Tracker", tech: "React.js, Node.js, PostgreSQL, Chart.js, JWT", desc: "Track applications by status, Kanban view, deadline alerts, stats dashboard." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Tenant Project Management SaaS", tech: "React.js, Node.js, PostgreSQL, Socket.io, Stripe", desc: "Org/workspace/board/card CRUD, real-time updates, role access, Stripe billing." },
  ]},
  'GAY002': { name: "Gayatri Arun Gaikwad", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Superstore Sales Performance Report", tech: "Python, Pandas, Plotly, Power BI", desc: "Kaggle Superstore data, regional KPIs, top-product bar chart, manager summary PDF." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Retail Store Footfall Insights", tech: "Python, Pandas, Plotly, Power BI", desc: "Hourly footfall + sales data, peak-hour analysis, conversion rate, staff optimizer." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Sales Command Center", tech: "Python, Pandas, Streamlit, Plotly, SQL", desc: "Live DB connection, auto-refreshing KPI tiles, drill-down by region/rep/product." },
  ]},
  'JAY003': { name: "Jayshri Girase", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Iris Flower Species Classifier", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Logistic Regression on Iris dataset, confusion matrix, species predictor UI." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crop Yield Prediction System", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Regression on crop dataset, soil+weather inputs, district-level yield map." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Pose Estimation Trainer", tech: "Python, MediaPipe, TensorFlow, Flask, Socket.io", desc: "Live webcam pose detection, rep counter for exercises, form feedback API." },
  ]},
  'ANU004': { name: "anushka ghat", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Titanic Survival Predictor", tech: "Python, Pandas, Scikit-learn, Streamlit", desc: "Binary classification, feature engineering, ROC curve, Streamlit input form." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Fake Job Posting Detector", tech: "Python, NLTK, TF-IDF, Scikit-learn, Streamlit", desc: "Binary NLP classifier on EMSCAD dataset, keyword explainability." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multimodal Product Review Analyzer", tech: "Python, CLIP HuggingFace, FastAPI, React", desc: "Image + text review inputs, sentiment + quality score, REST API." },
  ]},
  'SUY005': { name: "Suyog Ahire", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Notes & Bookmarks Web App", tech: "React.js, Express, MongoDB, JWT", desc: "Create/edit/delete notes, tag system, URL bookmark saver, search filter." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Online Quiz Platform", tech: "React.js, Node.js, MongoDB, Socket.io", desc: "Question bank, timed quiz, live leaderboard, auto-grade, result analytics." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "E-Learning Platform with Certificates", tech: "React.js, Node.js, MongoDB, Cloudinary, Stripe", desc: "Course builder, video streaming, quiz engine, progress tracking, PDF cert generator." },
  ]},
  'KIR006': { name: "Kiran Suresh Gadekar", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Keyword-Based FAQ Chatbot", tech: "Python, NLTK, Flask, Bootstrap", desc: "Intent matching on custom FAQ dataset, response retrieval, multi-turn conversation log." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Interview Question Generator", tech: "Python, Gemini API, FastAPI, React", desc: "Upload JD/resume, generate role-specific questions by difficulty, PDF export." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Agent Task Automation System", tech: "Python, LangChain Agents, FastAPI, React", desc: "Planner + executor agents, multi-step task decomposition, tool use (search/code/file), audit log." },
  ]},
  'ANK007': { name: "Ankita Patil", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Text Summarizer Tool", tech: "Python, HuggingFace Transformers BART, Streamlit", desc: "Paste article \u2192 abstractive summary, length slider, copy button." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Product Description Writer", tech: "Python, Gemini API, FastAPI, React", desc: "Enter product name + features, generate 3 tone-varied descriptions, SEO score." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Video Scene Describer", tech: "Python, CLIP HuggingFace, OpenCV, FastAPI", desc: "Upload video, keyframe extraction, CLIP caption per scene, narrative summary." },
  ]},
  'SAM008': { name: "Sameeksha Nerkar", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "HR Headcount & Turnover Dashboard", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Employee dataset, dept headcount, attrition rate chart, YoY trend." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Product Profitability Analysis", tech: "Python, Pandas, Plotly, Seaborn", desc: "Revenue \u2013 COGS model, margin by SKU/category, waterfall P&L chart, pricing levers." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Predictive Churn Cohort Tracker", tech: "Python, Pandas, Scikit-learn, Plotly, Power BI", desc: "Cohort CLV + ML churn risk, early-warning segment filter, retention action log." },
  ]},
  'SHR009': { name: "Shruti Borse", domain: "cyber security", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Network Vulnerability Scanner", tech: "Python, Nmap, Flask, Bootstrap", desc: "Port scanning on local subnet, open-port risk rating, CVE lookup, HTML report." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Password Strength Analyzer & Generator", tech: "Python, Flask, zxcvbn, React", desc: "Strength scoring, crack-time estimate, secure password generator, breach-check API." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Web Application Penetration Testing Report", tech: "Python, OWASP ZAP, Burp Suite, Markdown", desc: "Automated scan on demo app, XSS/SQLi/CSRF findings, CVSS scoring, remediation PDF." },
  ]},
  'VIS010': { name: "vishakha kailas chaudhari", domain: "front end development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Personal Portfolio Website", tech: "React.js, CSS3, EmailJS", desc: "Animated hero, projects grid, skills bar, contact form, dark/light toggle." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Job Board UI with Filters", tech: "React.js, Tailwind CSS, Context API", desc: "Job card listing, search + multi-filter, bookmark, pagination, skeleton loader." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Collaborative Notes App", tech: "React.js, Socket.io, Tailwind, Quill.js", desc: "Multi-user note editing, live cursor, undo/redo, room links, export PDF." },
  ]},
  'NEH011': { name: "Neha Ravindra Patil", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "COVID-19 India State Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-level case/death/recovery data, choropleth, peak identification, wave analysis." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Indian Stock Market EDA & Forecast", tech: "Python, Pandas, yfinance, Prophet, Plotly", desc: "NSE multi-stock OHLCV, 30-day forecast, sector performance comparison." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Social Mobility & Income Inequality Study", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "World Bank + OECD data, Gini index trend, mobility predictor, interactive report." },
  ]},
  'ADI012': { name: "Aditi Rajesh Sawale", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Wine Quality Classifier", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "Multi-class RF on UCI Wine, accuracy comparison, feature importance chart." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Twitter Sentiment Dashboard", tech: "Python, Tweepy, TextBlob, Plotly, Streamlit", desc: "Real-time tweet sentiment, trending keyword cloud, sentiment timeline." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Autonomous Stock Trading Bot", tech: "Python, yfinance, RL Stable-Baselines3, Streamlit", desc: "PPO agent on historical data, portfolio simulation, cumulative return chart." },
  ]},
  'GAY013': { name: "Gayatri Kailas Dhurkunde", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Diabetes Risk Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Logistic Regression on Pima dataset, patient form, recall-optimized threshold." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "House Rent Price Predictor", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Feature engineering on rental dataset, neighborhood filter, rent estimator." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI-Powered Resume Parser & Ranker", tech: "Python, spaCy, BERT, FastAPI, React", desc: "Batch resume upload, JD matching, ranked shortlist, skills gap PDF report." },
  ]},
  'YAS014': { name: "Yashwi Vijay wagh", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "World Population Growth Analysis", tech: "Python, Pandas, Plotly, Seaborn", desc: "UN population data, country growth rate chart, density map, 2050 projection line." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crime Pattern Analysis Dashboard", tech: "Python, Pandas, Folium, Plotly, Streamlit", desc: "City crime dataset, type/time/location EDA, monthly trend, hotspot map." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Smart City Sensor Data Analysis", tech: "Python, Pandas, Plotly, Folium, Prophet", desc: "IoT sensor dataset (air/noise/traffic), anomaly detection, zone comparison, forecast." },
  ]},
  'ANJ015': { name: "Anjali Amrutkar", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Titanic Survival EDA", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Classic Titanic dataset, passenger survival factors, age/class/gender breakdown." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Climate Change & Extreme Events EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "NOAA/NASA dataset, temperature anomaly, extreme events correlation, 2040 projection." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "NLP-Powered Financial Report Analyzer", tech: "Python, spaCy, Gensim, Plotly, Streamlit", desc: "Scrape annual report PDFs, topic extraction, sentiment trend, KPI comparison." },
  ]},
  'ANJ016': { name: "Anjali Premsing Girase", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Indian Premier League EDA", tech: "Python, Pandas, Plotly, Streamlit", desc: "IPL ball-by-ball data, player strike rate, team win %, venue run-rate chart." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Healthcare Cost Driver Analysis", tech: "Python, Pandas, Plotly, Scikit-learn", desc: "Insurance + hospital cost data, driver regression, cost by diagnosis dashboard." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Geospatial Urban Sprawl Study", tech: "Python, Geopandas, OSMnx, Folium, Plotly", desc: "Satellite-derived urban boundary data, expansion rate, green cover loss, 3-city compare." },
  ]},
  'MAN017': { name: "Mandlik Sairaj Sunil", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Boston Housing Price Estimator", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Linear/Ridge regression, RMSE/R\u00b2, residual plot, feature coefficient chart." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Product Review Sentiment Classifier", tech: "Python, DistilBERT, Scikit-learn, Flask", desc: "Fine-tune DistilBERT on product reviews, star-rating predictor, live demo." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Medical Report Summarizer", tech: "Python, T5 HuggingFace, LangChain, FastAPI", desc: "Upload clinical report PDF, abstractive summary, key findings extraction." },
  ]},
  'GAY018': { name: "Gayatri Chopade", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "E-Commerce Return Rate Analyzer", tech: "Python, Pandas, Plotly, Streamlit", desc: "Returns dataset, reason categorization, SKU-level return rate, seller report." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Customer Cohort Retention Dashboard", tech: "Python, Pandas, Plotly, Streamlit", desc: "Monthly cohort table, retention heatmap, churn inflection finder, segment filter." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Source Data Pipeline Dashboard", tech: "Python, Pandas, SQLAlchemy, Plotly, Airflow", desc: "ETL from 3 sources (CSV, API, DB), unified dashboard, scheduled refresh." },
  ]},
  'DIP019': { name: "Dipak Chaudhari", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Grammar Correction Assistant", tech: "Python, LanguageTool API, Flask, React", desc: "Text input, error highlighting, corrected output, confidence color-code." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI-Powered Bug Fixer", tech: "Python, Gemini API, FastAPI, React", desc: "Paste buggy code, AI identifies errors, suggests fixed code, diff viewer." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Autonomous Data Analysis Agent", tech: "Python, LangChain, Pandas, Streamlit", desc: "Upload CSV, agent auto-detects columns, runs EDA, generates insights report without prompting." },
  ]},
  'KOM020': { name: "Komal Gopal Varude", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Netflix Movies & Shows EDA", tech: "Python, Pandas, Seaborn, WordCloud", desc: "Content catalog data, genre distribution, country treemap, release-year trend." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Startup Ecosystem India Report", tech: "Python, Pandas, Plotly, NetworkX, Streamlit", desc: "Funding + sector data, investor network graph, city startup map, YoY trend." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multi-Year Education Outcome Study", tech: "Python, Pandas, Plotly, Scikit-learn, Geopandas", desc: "DISE/ASER data, learning outcome regression, district map, policy scenario." },
  ]},
  'SNE021': { name: "Mankar Snehal Venunath", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Movie Rating Predictor", tech: "Python, Pandas, Scikit-learn, Streamlit", desc: "Regression on IMDB features, genre/runtime/budget inputs, prediction confidence." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Stock Market Volatility Predictor", tech: "Python, yfinance, Scikit-learn, Plotly", desc: "GARCH features, RF volatility classifier, multi-stock comparison chart." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sign Language to Text Converter", tech: "Python, MediaPipe, LSTM, TensorFlow, Gradio", desc: "Real-time hand gesture capture, sequence-to-text decoder, accuracy chart." },
  ]},
  'RIT022': { name: "Ritesh Parmeshwar Panpatil", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Joke & Story Generator", tech: "Python, Gemini API, Streamlit", desc: "Genre/mood selector, AI-generated jokes or short stories, regenerate button, share card." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Conversational Language Tutor", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Choose language + level, AI conducts lesson, grammar correction, vocab quiz." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Legal Contract Analyzer", tech: "Python, GPT-4o/Gemini, LangChain, Streamlit", desc: "Upload contract PDF, clause extraction, risk flagging, plain-English summary, negotiation tips." },
  ]},
  'TAN023': { name: "Tanuja Kinge", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Spam SMS Detector", tech: "Python, NLTK, Naive Bayes, Streamlit", desc: "TF-IDF on SMS Spam Collection, ROC curve, live message tester." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Electricity Consumption Predictor", tech: "Python, Prophet, Pandas, Streamlit", desc: "Household power dataset, daily consumption forecast, anomaly flagging." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "3D Object Reconstruction from 2D", tech: "Python, OpenCV, Open3D, Flask", desc: "Multi-angle image upload, point-cloud reconstruction, 3D viewer, depth map export." },
  ]},
  'SHA024': { name: "Shraddha Pradeep Patil", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Bank Customer Churn Classifier", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "LR + DT on banking dataset, feature heatmap, churn probability output." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Road Traffic Volume Predictor", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Traffic dataset, time + weather features, city intersection heatmap." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sarcasm Detection in Social Media", tech: "Python, RoBERTa HuggingFace, FastAPI, React", desc: "Fine-tune on Reddit sarcasm dataset, confidence score, batch CSV API." },
  ]},
  'UDI025': { name: "Uditansh Mishra", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Quote & Motivation Generator", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Topic input, AI generates 5 quotes, mood filter, save-to-favourites, copy button." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Document Classifier", tech: "Python, spaCy, BERT, FastAPI", desc: "Multi-class document type tagger (invoice/contract/report), confidence, batch CSV API." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI-Powered Mock Interview Coach", tech: "Python, Whisper ASR, Gemini API, React, Flask", desc: "Voice-based interview, speech-to-text, AI follow-up questions, answer scoring, report." },
  ]},
  'GAY026': { name: "Gayatri Kapadnis", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Global Unemployment Trends", tech: "Python, Pandas, Plotly, Geopandas", desc: "World Bank data, country unemployment choropleth, age/gender breakdown, 10-year trend." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Airbnb Price Determinant Study", tech: "Python, Pandas, Plotly, Scikit-learn", desc: "Listing data, price regression, amenity impact, neighbourhood map." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Predictive Population Health Dashboard", tech: "Python, Pandas, Scikit-learn, Prophet, Plotly", desc: "District health data, disease burden forecast, risk stratification, intervention planner." },
  ]},
  'AVA027': { name: "Avanti kailas zore", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Recipe Generator from Ingredients", tech: "Python, Gemini API, Streamlit", desc: "Enter available ingredients, AI suggests 3 recipes with steps, dietary filter toggle." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Agentic Research Assistant", tech: "Python, LangChain, DuckDuckGo Tool, Streamlit", desc: "Input research topic, agent searches + summarizes web sources, cited report." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "RAG Chatbot on Custom Knowledge Base", tech: "Python, LangChain, ChromaDB, Gemini API, Streamlit", desc: "Multi-PDF ingestion, vector embeddings, semantic search, source citation, multi-turn." },
  ]},
  'ROH028': { name: "Rohit Birare", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Cover Letter Writer", tech: "Python, Gemini API, FastAPI, React", desc: "Upload resume + JD, AI generates tailored cover letter, tone selector, download as PDF." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Social Media Post Generator", tech: "Python, Gemini API, FastAPI, React", desc: "Input topic + platform, generate 5 post variations, hashtag suggester, tone picker." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Autonomous Web Scraper Agent", tech: "Python, LangChain Agents, Playwright, FastAPI", desc: "LLM-driven agent navigates sites, extracts structured data, CSV export, REST trigger." },
  ]},
  'BOH029': { name: "Bohri Mohammad", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Monthly Revenue Trend Analyzer", tech: "Python, Pandas, Plotly, Excel", desc: "Sales transaction data, MoM revenue chart, growth rate table, forecast line." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Fraud Incident Analysis Report", tech: "Python, Pandas, Plotly, Power BI", desc: "Banking transaction log, fraud pattern by time/location, loss quantification dashboard." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Supply Chain Analytics Command Center", tech: "Python, Pandas, Plotly, NetworkX, Streamlit", desc: "End-to-end supply chain data, bottleneck detection, vendor performance scoring." },
  ]},
  'APU030': { name: "Apurva Niranjankumar Bansod", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Customer Satisfaction Survey Analyzer", tech: "Python, Pandas, Matplotlib, WordCloud", desc: "NPS survey data, score distribution, open-comment word cloud, segment heatmap." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Logistics Delivery Performance Tracker", tech: "Python, Pandas, Folium, Plotly", desc: "Shipment dataset, on-time vs delayed %, carrier comparison, city delay heatmap." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Customer 360 Analytics Platform", tech: "Python, Pandas, Scikit-learn, Plotly, Streamlit", desc: "Multi-source customer data merge, segment profiling, propensity scoring dashboard." },
  ]},
  'NID031': { name: "Nidhi Gopal Patil", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI Flashcard Generator", tech: "Python, Gemini API, Streamlit", desc: "Paste study topic text, AI creates Q&A flashcards, quiz mode, export to PDF." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Meeting Minutes Generator", tech: "Python, Whisper ASR, Gemini API, Streamlit", desc: "Upload audio/transcript, AI extracts action items, decisions, summary, export DOCX." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Personal Finance Advisor", tech: "Python, Gemini API, LangChain, Streamlit", desc: "Upload bank statement PDF, transaction categorization, savings suggestions, Q&A on spending." },
  ]},
  'MAN032': { name: "Mansi Jadhav", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Amazon Top-50 Bestsellers Analysis", tech: "Python, Pandas, Seaborn, Plotly", desc: "Bestsellers dataset, genre/price/rating scatter, fiction vs non-fiction KPIs." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Football Player Performance EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "FBRef dataset, top scorer/passer/dribbler charts, radar comparison, club analysis." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Open Government Data Story Dashboard", tech: "Python, Pandas, Plotly, Geopandas, Streamlit", desc: "Central/state open data portal, 5-year trend story, annotation layer, shareable embed." },
  ]},
  'DIP033': { name: "Dipali Manohar Badgujar", domain: "artificial intelligence", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "AI News Headline Summarizer", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Enter news URL, AI fetches + summarizes in 3 bullet points, share button." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "AI Personalized Study Planner", tech: "Python, Gemini API, FastAPI, React", desc: "Input subjects + exam date, AI generates day-wise study plan, progress tracker, reminder setup." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multimodal Image Caption Generator", tech: "Python, BLIP-2 HuggingFace, FastAPI, React", desc: "Upload image \u2192 generate descriptive caption, style selector (formal/casual/SEO), batch API." },
  ]},
  'NIK034': { name: "Nikita Prakash Salunke", domain: "ui/ux design", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "E-Commerce Mobile App Redesign", tech: "Figma, FigJam, Maze", desc: "User research (5 interviews), affinity map, wireframes, hi-fi prototype, usability test report." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Healthcare Patient Portal UX", tech: "Figma, Maze, Miro", desc: "Personas, patient journey map, accessibility audit, interactive prototype, A/B test plan." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Product Dashboard Design System", tech: "Figma, Tokens Studio, Storybook (handoff)", desc: "Design tokens, component library (50+ atoms), dark/light mode, dev handoff specs, motion guide." },
  ]},
  'MOH035': { name: "Mohit Karankal", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Student Result Portal", tech: "React.js, Node.js, PostgreSQL, JWT", desc: "Admin uploads results, student login views own grades, semester GPA chart." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Blog Publishing Platform", tech: "Next.js, Node.js, MongoDB, Cloudinary, MDX", desc: "Rich text editor, image upload, tag system, comment section, author dashboard." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Healthcare Appointment System", tech: "Next.js, Node.js, PostgreSQL, Twilio, Google Calendar API", desc: "Doctor search, availability calendar, SMS reminder, prescription notes, admin panel." },
  ]},
  'ASH036': { name: "Ashwini Patil", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Contact Directory App", tech: "React.js, Node.js, MySQL, JWT", desc: "Add/edit/delete contacts, search, group filter, import/export CSV, profile photo upload." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Budget Tracking Web App", tech: "React.js, Node.js, PostgreSQL, Chart.js", desc: "Income/expense CRUD, category budget, monthly summary chart, CSV export." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Freelance Marketplace Platform", tech: "Next.js, Node.js, MongoDB, Stripe Connect, Socket.io", desc: "Gig listing/bidding, milestone payments, client-freelancer chat, review system." },
  ]},
  'AAK037': { name: "Aakash Pradeep Patil", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Simple Blog Platform", tech: "React.js, Express, MongoDB, JWT", desc: "Write/publish/delete posts, categories, comment section, author dashboard, rich text editor." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Service Booking Portal", tech: "Next.js, Node.js, PostgreSQL, Nodemailer", desc: "Service listing, slot selection, email confirmation, booking history, admin panel." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Online Auction Platform", tech: "React.js, Node.js, Socket.io, PostgreSQL, Stripe", desc: "Live bidding, countdown timers, bid history, Stripe escrow, push notification." },
  ]},
  'KRU038': { name: "Krushnai Chandrashekhar Borse", domain: "front end development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Currency Converter App", tech: "React.js, ExchangeRate API, CSS3", desc: "Real-time currency conversion, 10-currency selector, rate history mini chart." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Pomodoro Productivity Timer", tech: "React.js, Tailwind, Framer Motion", desc: "Work/break cycle timer, session log, progress ring animation, sound alert, dark mode." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "3D Interactive Portfolio", tech: "React.js, Three.js, Tailwind, GSAP", desc: "3D scene hero, scroll-triggered animations, interactive project cards, WebGL background." },
  ]},
  'ISH039': { name: "Ishita Pate", domain: "front end development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "BMI Calculator with Chart", tech: "React.js, Chart.js, Tailwind CSS", desc: "Height/weight inputs, BMI result, healthy-range bar chart, category badge." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crypto Price Tracker Dashboard", tech: "React.js, CoinGecko API, Chart.js, Tailwind", desc: "Live crypto prices, 7-day sparkline, watchlist, gainers/losers cards." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Travel Itinerary Planner", tech: "React.js, Mapbox GL JS, Tailwind, LocalStorage", desc: "Destination search, day-wise drag-drop planner, map pin plotting, PDF itinerary export." },
  ]},
  'DEV040': { name: "Devang Bhavesh Khairnar", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Google Play Store App Analysis", tech: "Python, Pandas, Plotly, Seaborn", desc: "App metadata, category distribution, rating histogram, installs vs reviews scatter." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Global Inflation Impact Study", tech: "Python, Pandas, Plotly, Geopandas", desc: "IMF CPI data, country inflation choropleth, commodity correlation, policy comparison." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Sports Analytics Deep Dive Platform", tech: "Python, Pandas, Plotly, Scikit-learn, Streamlit", desc: "Multi-season player + match data, performance clustering, scouting score, radar charts." },
  ]},
  'SHU041': { name: "Shubham Wagh", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Museum Visitors Data Analysis", tech: "Python, Pandas, Matplotlib, Plotly", desc: "Attendance data by year/exhibit, peak period finder, visitor growth chart." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Road Safety in India Analysis", tech: "Python, Pandas, Folium, Plotly", desc: "MoRTH accident data, state-level fatality map, cause breakdown, seasonal trend." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Food Security & Hunger Index EDA", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "GHI dataset, calorie availability, drought correlation, 2030 risk forecast map." },
  ]},
  'PRI042': { name: "Priyanka Patil", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Zomato Pune Restaurant EDA", tech: "Python, Pandas, Seaborn, Folium", desc: "Local restaurant data, locality cuisine map, cost vs rating scatter, top-rated list." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "E-Commerce Funnel Drop-off Study", tech: "Python, Pandas, Plotly, Streamlit", desc: "Clickstream + purchase data, funnel conversion, drop-off root-cause, A/B segment." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Trade & Export Pattern Analyzer", tech: "Python, Pandas, Plotly, NetworkX, Geopandas", desc: "UN Comtrade data, trade flow Sankey, commodity dependency, partner diversification score." },
  ]},
  'ADI043': { name: "Aditya Pagare", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Website Traffic Analytics Dashboard", tech: "Python, Pandas, Plotly, Streamlit", desc: "GA-export style dataset, sessions/bounce/CTR KPIs, traffic source pie, time-series." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Ad Spend Attribution Analyzer", tech: "Python, Pandas, Plotly, Streamlit", desc: "Multi-touch attribution model on ad data, channel ROAS, budget reallocation table." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "HR Analytics & Workforce Planning Tool", tech: "Python, Pandas, Plotly, Scikit-learn, Power BI", desc: "Headcount forecast, attrition ML model, hiring pipeline tracker, cost projection." },
  ]},
  'SAK044': { name: "Sakshi Shimpi", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "WHO Global Health Statistics EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "Life expectancy, mortality, disease burden data, country ranking chart, decade trend." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Electric Vehicle Adoption Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "EV registration data, charging station map, brand growth trend, range comparison." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Environmental Pollution Trends Study", tech: "Python, Pandas, Plotly, Folium, Prophet", desc: "CPCB AQI + water quality data, pollution hotspot map, season decomposition, 2027 forecast." },
  ]},
  'RUS045': { name: "Rushekesh Dusane", domain: "cloud computing", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Containerized Microservices on AWS", tech: "AWS ECS, Docker, ECR, ALB, Terraform, CloudWatch", desc: "3 microservices (auth/product/order), Docker build+push, ECS Fargate deploy, ALB routing, auto-scaling, CloudWatch logs." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Multi-Region Disaster Recovery Setup", tech: "AWS EC2, RDS, S3, Route53, CloudFormation", desc: "Primary + failover region, RDS read replica, S3 cross-region replication, Route53 health-check failover, RTO/RPO report." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Serverless Event-Driven Architecture", tech: "AWS Lambda, EventBridge, SQS, DynamoDB, API Gateway, CDK", desc: "Event bus triggers Lambdas, SQS fanout, DynamoDB CRUD, CDK IaC, end-to-end integration test." },
  ]},
  'DHA046': { name: "Dhanshri Prashant Chaudhari", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Bike Sharing Demand Forecaster", tech: "Python, Scikit-learn, Pandas, Plotly", desc: "Time-feature regression on Kaggle Bike dataset, hourly demand chart." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "E-Learning Course Recommender", tech: "Python, Surprise, Pandas, Streamlit", desc: "Collaborative filtering on Coursera-style data, personalized course list." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Driver Drowsiness Detection System", tech: "Python, OpenCV, Dlib, Flask, Socket.io", desc: "Eye-aspect-ratio fatigue detector, real-time webcam alert, event log dashboard." },
  ]},
  'TAN047': { name: "Tanvi Patil", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Expense Split App", tech: "React.js, Node.js, PostgreSQL, JWT", desc: "Group expense entry, smart split calculation, settlement tracker, email summary." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "College Event Management System", tech: "React.js, Node.js, MySQL, QR Code, Nodemailer", desc: "Event creation, student registration, QR pass, attendance scan, organizer dashboard." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Corporate HR & Payroll System", tech: "React.js, Node.js, PostgreSQL, PDF-lib, JWT", desc: "Employee records, attendance, leave management, payslip PDF generator, HR admin." },
  ]},
  'AIS048': { name: "Aishwarya Prashant Sisodiya", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Poll & Voting App", tech: "React.js, Node.js, MongoDB, Socket.io", desc: "Create polls, real-time vote count, result chart, share link, expiry timer." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Fitness Goal Tracker App", tech: "React.js, Node.js, PostgreSQL, Chart.js", desc: "Workout log, goal setter, streak calendar, progress chart, notification reminder." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Supply Chain Tracking Platform", tech: "Next.js, Node.js, MongoDB, Mapbox, QR Code", desc: "Shipment creation, QR scan checkpoints, live map route, ETA prediction, stakeholder portal." },
  ]},
  'HAR049': { name: "Harshada Jagdish More", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Kaggle Survey Data Science Trends", tech: "Python, Pandas, Plotly, Seaborn", desc: "Annual Kaggle survey data, tool popularity, salary by country, experience distribution." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Mental Health & Workplace Survey EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "OSMI survey data, industry breakdown, treatment-seeking rate, remote work impact." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Demographic Dividend Analysis", tech: "Python, Pandas, Plotly, Geopandas, Statsmodels", desc: "Census data, age pyramid animation, dependency ratio, workforce projection." },
  ]},
  'OMW050': { name: "Om Jalindar Walke", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Recipe Book Web App", tech: "React.js, Node.js, MySQL, Cloudinary", desc: "Add/edit recipes, ingredient list, step-by-step view, image upload, search by ingredient." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Online Polling & Survey Platform", tech: "React.js, Node.js, MongoDB, Chart.js", desc: "Create surveys, multi-type questions, real-time results, export to CSV, share link." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Crowdfunding Platform", tech: "Next.js, Node.js, MongoDB, Stripe, Socket.io", desc: "Campaign creation, reward tiers, Stripe pledge, live funding meter, backer notifications." },
  ]},
  'MAD051': { name: "MADHURA KULKARNI", domain: "software testing (qa)", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Manual Test Plan for E-Commerce Site", tech: "Excel/Notion, Jira, Zephyr", desc: "Test scenarios for cart/checkout/auth, test cases, defect log, traceability matrix, execution report." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Automated UI Testing with Selenium", tech: "Python, Selenium, Pytest, Allure", desc: "Page Object Model, 30 test cases for web app, CI run on GitHub Actions, Allure report." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "API Testing & Performance Dashboard", tech: "Postman, Newman, k6, Grafana", desc: "REST API collection (50 endpoints), schema validation, k6 load test (500 VU), Grafana metrics board." },
  ]},
  'PRA052': { name: "Prachi Anil Mahajan", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Breast Cancer Diagnosis Classifier", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "SVM on Wisconsin dataset, SHAP summary, diagnosis probability output." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Resume Skill Gap Analyzer", tech: "Python, spaCy, Scikit-learn, Streamlit", desc: "NER on resume text, JD comparison, missing skill radar chart." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Multilingual Sentiment Analyzer", tech: "Python, mBERT HuggingFace, FastAPI, React", desc: "5-language sentiment classification, language auto-detect, confidence dashboard." },
  ]},
  'HAR053': { name: "Harshada Jayprakash Khairnar", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Heart Attack Risk Screener", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "LR on Cleveland dataset, ROC-AUC, patient input widget." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Grocery Demand Forecaster", tech: "Python, Prophet, Pandas, Plotly", desc: "Product-level time-series on Kaggle grocery data, 30-day demand forecast." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI-Powered Code Auto-Completer", tech: "Python, GPT-2 Fine-tuned, FastAPI, React", desc: "Train on GitHub code corpus, token-level prediction, inline IDE widget." },
  ]},
  'POO054': { name: "Pooja Aher", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Marketing Campaign Performance Report", tech: "Python, Pandas, Seaborn, Plotly", desc: "Multi-channel campaign data, ROI comparison, conversion funnel, A/B result table." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Employee Productivity Score Card", tech: "Python, Pandas, Plotly, Excel", desc: "Task completion + attendance data, individual score, dept ranking, KPI drilldown." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Executive KPI Scorecard Builder", tech: "Python, Pandas, Plotly, ReportLab, Streamlit", desc: "Auto-generate PDF KPI scorecards from uploaded data, drill-down filters, delta indicators." },
  ]},
  'SAR055': { name: "Sarthak Mahesh Sonje", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Inventory Turnover Analysis", tech: "Python, Pandas, Plotly, Excel", desc: "Stock + sales data, days-on-hand metric, slow-mover alert, category comparison." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Pricing Competitiveness Report", tech: "Python, Pandas, Seaborn, Plotly", desc: "Scraped competitor price data, price index by category, under/over-priced flag." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Omnichannel Sales Attribution Dashboard", tech: "Python, Pandas, Plotly, Scikit-learn, Streamlit", desc: "Multi-channel order data, attribution modelling, revenue contribution chart, ROI optimizer." },
  ]},
  'PRA056': { name: "Pranali Patil", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Student Grade Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Multiple regression on student features, grade range output, study-hours analyzer." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Water Potability Classifier", tech: "Python, XGBoost, SHAP, Streamlit", desc: "Multi-feature water quality dataset, potability score, parameter importance." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Generative Adversarial Image Synthesizer", tech: "Python, TensorFlow GAN, Flask, React", desc: "Train DCGAN on CelebA subset, latent space slider, image grid gallery." },
  ]},
  'PRT057': { name: "pratik agrawal", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Stack Overflow Developer Survey EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "Developer survey data, language popularity, remote work trend, salary distribution." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "EdTech Platform Engagement EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "MOOC engagement dataset, course completion rate, dropout pattern, learner segment." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Disaster Risk & Resilience Dashboard", tech: "Python, Pandas, Plotly, Folium, Scikit-learn", desc: "EM-DAT disaster data, economic loss regression, country resilience score, risk map." },
  ]},
  'SID058': { name: "Siddhi", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Indian Railways Punctuality Study", tech: "Python, Pandas, Plotly, Folium", desc: "Train delay dataset, route-wise OTP analysis, busiest station map, seasonal trend." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "GST Revenue Collection Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-wise GST collection data, sector contribution, compliance rate trend, monthly pattern." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Healthcare Infrastructure Gap Study", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "HMIS facility data, doctor-patient ratio map, underserved district finder, need score." },
  ]},
  'KIR059': { name: "Kirti Patil", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Attendance & Punctuality Tracker", tech: "Python, Pandas, Matplotlib, Excel", desc: "Employee log data, late-arrival rate, dept comparison chart, monthly heatmap." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Budget vs Actual Variance Dashboard", tech: "Python, Pandas, Plotly, Power BI", desc: "Finance dataset, dept-wise variance, overspend flag, waterfall variance chart." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Demand Forecasting & Inventory Optimizer", tech: "Python, Prophet, Pandas, Plotly, Streamlit", desc: "Product-level demand forecast, reorder point calculator, overstock/understock alert." },
  ]},
  'HRS060': { name: "Harshal Pandhare", domain: "cloud computing", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Static Site Hosting with CDN on AWS", tech: "AWS S3, CloudFront, Route53, ACM, Terraform", desc: "Deploy static React app to S3, CloudFront distribution, custom domain via Route53, SSL cert, cache invalidation." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Cloud Cost Optimization Dashboard", tech: "AWS Cost Explorer API, Python, Grafana, Terraform", desc: "Fetch billing data, visualize spend by service/tag, anomaly alert, right-sizing recommendation report." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Full CI/CD Pipeline with Kubernetes", tech: "GitHub Actions, Docker, Amazon EKS, Helm, Prometheus, Grafana", desc: "Full CI pipeline, rolling deployments, Helm charts, Grafana monitoring dashboard, alert rules." },
  ]},
  'HRB061': { name: "Harshal Kishor Bhaisare", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Car Price Estimator", tech: "Python, Scikit-learn, Pandas, Plotly", desc: "Regression on car dataset, mileage/brand/year inputs, residual analysis." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Earthquake Risk Zone Mapper", tech: "Python, Scikit-learn, Pandas, Folium", desc: "USGS seismic data, magnitude regression, risk choropleth, alert setter." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Vehicle License Plate OCR System", tech: "Python, YOLOv8, PaddleOCR, Flask", desc: "Detect + read plates from images/video, confidence score, CSV export." },
  ]},
  'SAK062': { name: "Sakshi Sandipan Vyavhare", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Swiggy/Zomato Delivery Time EDA", tech: "Python, Pandas, Seaborn, Plotly", desc: "Food delivery dataset, avg delivery time by area, weather impact, partner performance." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "E-Waste Generation & Recycling EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "Global e-waste dataset, country production rate, recycling gap, 2030 projection." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Agricultural Market Price Analyzer", tech: "Python, Pandas, Prophet, Plotly, Streamlit", desc: "AGMARKNET mandi price data, commodity price forecast, seasonal pattern, state comparison." },
  ]},
  'PAL063': { name: "Palak Ramchandra Pawar", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Air Quality Index India EDA", tech: "Python, Pandas, Plotly, Folium", desc: "CPCB AQI city dataset, pollutant breakdown, season comparison, worst city ranking." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Indian Tourism & Travel Trends EDA", tech: "Python, Pandas, Plotly, Folium", desc: "Domestic/international tourist data, top destination map, seasonal pattern, revenue analysis." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Women Workforce Participation Study", tech: "Python, Pandas, Plotly, Geopandas, Seaborn", desc: "ILO + Census data, sector-wise participation, wage gap analysis, decade trend map." },
  ]},
  'DHA064': { name: "Dhanshri Prakash Chavhan", domain: "front end development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Age Calculator App", tech: "React.js, Tailwind CSS", desc: "DOB input, exact age in years/months/days, next birthday countdown, zodiac sign display." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Trivia Quiz Game", tech: "React.js, Open Trivia DB API, Framer Motion, Tailwind", desc: "Category/difficulty picker, timed questions, score animation, share card." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Music Player with Visualizer", tech: "React.js, Web Audio API, Canvas, CSS3", desc: "Upload MP3, frequency bar visualizer, waveform display, playlist, equalizer, keyboard controls." },
  ]},
  'PRT065': { name: "Pratiksha Tarange", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Bollywood Box Office EDA", tech: "Python, Pandas, Seaborn, Plotly", desc: "2000-2024 movie data, genre revenue trend, actor/director impact, OTT vs theatre compare." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Banking NPA & Loan Default EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "RBI/banking NPA dataset, sector-wise default rate, trend analysis, recovery rate compare." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Public Transport Efficiency Dashboard", tech: "Python, Pandas, Plotly, Folium, Scikit-learn", desc: "GTFS transit data, route coverage, ridership forecast, underserved zone identifier." },
  ]},
  'SAN066': { name: "Saniya Sudharma Patil", domain: "full stack development", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Complaint Management Portal", tech: "React.js, Node.js, PostgreSQL, Nodemailer", desc: "Submit complaint, status tracking, admin resolve panel, email notification, report export." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Student Attendance Management System", tech: "React.js, Node.js, MySQL, Chart.js, JWT", desc: "Teacher marks attendance, student view, monthly report, absentee alert email." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Online Examination Portal", tech: "React.js, Node.js, PostgreSQL, Socket.io", desc: "Question bank, timed exam, auto-grading, plagiarism detection, result analytics." },
  ]},
  'PRT067': { name: "Pratik Magar", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Paytm/UPI Transaction Trend EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "Digital payment trend data, transaction volume growth, category split, city-wise adoption." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Crop Minimum Support Price Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "MSP historical data, commodity price trend, procurement vs production gap, state map." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Digital India Adoption Tracker", tech: "Python, Pandas, Plotly, Geopandas, Prophet", desc: "TRAI + MEITY data, internet penetration trend, state comparison, 2030 projection." },
  ]},
  'DAR068': { name: "Darshan Akhadmal", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Employee Salary Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Ridge regression on HR dataset, role/experience/location inputs, salary band output." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Video Game Genre Classifier", tech: "Python, Scikit-learn, NLP, Streamlit", desc: "Text + metadata features on game descriptions, multi-class genre tagger." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Real-Time Emotion Recognition Camera", tech: "Python, TensorFlow, OpenCV, Flask, Socket.io", desc: "FER2013 CNN, live webcam emotion overlay, session emotion timeline chart." },
  ]},
  'NIS069': { name: "Nisheeta Panchal", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "NEET/JEE Exam Performance EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "Entrance exam result dataset, state-wise performance, score distribution, category analysis." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Mobile App Usage Pattern EDA", tech: "Python, Pandas, Plotly, Seaborn", desc: "App usage log dataset, session length distribution, retention rate, top feature usage, hour-of-day pattern." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Cost of Living Comparative Study", tech: "Python, Pandas, Plotly, Seaborn, Streamlit", desc: "Numbeo + govt data, city-wise cost index, purchasing power comparison, affordability score." },
  ]},
  'NIH070': { name: "Nikam Harshada Shankarrao", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Loan Approval Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Binary classifier on loan dataset, approval probability, explainability report." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Customer Lifetime Value Predictor", tech: "Python, Lifetimes, Pandas, Plotly", desc: "BG/NBD model on retail transaction data, CLV segment dashboard." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Predictive Maintenance System", tech: "Python, XGBoost, SHAP, FastAPI, React", desc: "Sensor time-series, failure probability, remaining useful life estimator dashboard." },
  ]},
  'MAY071': { name: "Mayuri Santosh Patil", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Flight Price Predictor", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "Regression on flight booking data, airline/stops/date inputs, fare estimate." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Medical Cost Prediction Model", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Regression on insurance dataset, risk-factor inputs, premium estimator." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Document QA Bot", tech: "Python, LangChain, FAISS, Gemini API, Streamlit", desc: "Multi-PDF ingestion, semantic search, cited answer generation, history log." },
  ]},
  'SOH072': { name: "Soham patil", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Supermarket Sales Forecaster", tech: "Python, Scikit-learn, Pandas, Plotly", desc: "Linear regression on grocery data, product-line revenue chart, seasonality note." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Shipping Delay Classifier", tech: "Python, XGBoost, Pandas, Plotly", desc: "E-commerce supply chain dataset, delay risk predictor, dashboard." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Object Counting in Crowd Images", tech: "Python, YOLOv8, OpenCV, Streamlit", desc: "Fine-tune on crowd dataset, density map, zone-based count overlay." },
  ]},
  'POO073': { name: "Poonam Nana Patil", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Penguin Species Classifier", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "KNN on Palmer Penguins, 3-class confusion matrix, species image map." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Energy Usage Anomaly Detector", tech: "Python, Isolation Forest, Pandas, Plotly", desc: "Smart meter data, unsupervised anomaly detection, alert timeline." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Time Series Anomaly Detection Dashboard", tech: "Python, LSTM Autoencoder, Keras, Streamlit", desc: "Encode-decode reconstruction error, anomaly threshold, multi-sensor dashboard." },
  ]},
  'HEM074': { name: "Hemangi Chaudhari", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Customer Purchase Intent Predictor", tech: "Python, Pandas, Scikit-learn, Seaborn", desc: "Logistic Regression on online shoppers dataset, intent probability, session features." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Forest Fire Risk Classifier", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Algerian forest fire dataset, weather features, risk zone map overlay." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "AI Caption Generator for Accessibility", tech: "Python, BLIP-2 HuggingFace, gTTS, FastAPI", desc: "Image \u2192 descriptive caption \u2192 audio TTS, accessibility download bundle." },
  ]},
  'AAD075': { name: "Aaditi Rane", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Rain Tomorrow Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Binary weather classifier on Australia dataset, precision-recall, tomorrow prediction form." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "News Category Classifier", tech: "Python, TF-IDF, Scikit-learn, Flask", desc: "Multi-class classifier on AG News, REST API, live headline tagger." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Explainable AI Dashboard XAI", tech: "Python, SHAP, LIME, Plotly, Streamlit", desc: "Multi-model explanations (RF, XGB, NN), SHAP waterfall + force plots, LIME text." },
  ]},
  'OMC076': { name: "Om Dnyaneshwar Chaudhari", domain: "machine learning", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Air Passenger Count Forecaster", tech: "Python, Statsmodels ARIMA, Pandas, Matplotlib", desc: "Classic airline dataset, ARIMA fit, 12-month forecast chart." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Sentiment Analysis on Product Feedback", tech: "Python, VADER, Scikit-learn, Streamlit", desc: "Customer feedback CSV, positive/negative/neutral classifier, word cloud, topic trend chart." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Hate Speech Detection API", tech: "Python, BERT HuggingFace, FastAPI, React", desc: "Fine-tune on hate speech dataset, category scores, moderation webhook." },
  ]},
  'VID077': { name: "Vidhi Borse", domain: "data analyst", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Social Media KPI Tracker", tech: "Python, Pandas, Plotly, Streamlit", desc: "Platform metrics dataset, follower growth, engagement rate, post-type performance." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Customer Complaint Root-Cause Report", tech: "Python, Pandas, LDA, Plotly", desc: "Support ticket text + category, complaint cluster, resolution-time trend, priority matrix." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Financial Risk Exposure Dashboard", tech: "Python, Pandas, Plotly, Scikit-learn, Streamlit", desc: "Portfolio data, VaR calculation, sector concentration, stress-test scenario builder." },
  ]},
  'DAR078': { name: "Darshan Shinde", domain: "data science", projects: [
    { stage: "\ud83d\udfe2 Stage 1 \u2014 Simple", title: "Indian Agriculture Production EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-wise crop production data, seasonal pattern, yield per hectare, top producing states." },
    { stage: "\ud83d\udfe1 Stage 2 \u2014 Medium", title: "Indian Startup Unicorn Study", tech: "Python, Pandas, Plotly, NetworkX", desc: "Unicorn company data, sector breakdown, funding journey, founding year trend, city concentration map." },
    { stage: "\ud83d\udd34 Stage 3 \u2014 Hard", title: "Youth Unemployment Crisis EDA", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "ILO youth employment data, skill mismatch index, district risk map, policy gap finder." },
  ]},
};

// Domain → project mapping — 15 domains, 235+ projects
const DOMAIN_PROJECTS: Record<string, any> = {
  "data science": {
    title: "Data Science Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "COVID-19 India State Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "State-level case/death/recovery data, choropleth map, peak identification." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Netflix Content EDA", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Genre distribution, country treemap, release-year trend analysis." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "World Population Growth Study", tech: "Python, Pandas, Plotly", desc: "UN population data, country growth rate chart, 2050 projection." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "IPL Cricket Data Analysis", tech: "Python, Pandas, Plotly, Streamlit", desc: "Ball-by-ball data, player strike rate, team win%, venue run-rate." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Titanic Survival EDA", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Passenger survival factors, age/class/gender breakdown." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Zomato Restaurant EDA", tech: "Python, Pandas, Plotly, Streamlit", desc: "Restaurant ratings, cuisine trends, price analysis by city." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Indian Stock Market EDA & Forecast", tech: "Python, Pandas, yfinance, Prophet, Plotly", desc: "NSE multi-stock OHLCV, 30-day forecast, sector performance comparison." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Crime Pattern Analysis Dashboard", tech: "Python, Pandas, Folium, Plotly, Streamlit", desc: "City crime dataset, type/time/location EDA, monthly trend, hotspot map." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Air Quality Index India EDA", tech: "Python, Pandas, Plotly, Geopandas", desc: "AQI data across cities, pollutant trend, seasonal pattern analysis." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Startup Ecosystem India Report", tech: "Python, Pandas, Plotly, NetworkX", desc: "Funding + sector data, investor network graph, city startup map." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Healthcare Cost Driver Analysis", tech: "Python, Pandas, Plotly, Scikit-learn", desc: "Insurance + hospital cost data, driver regression, cost by diagnosis." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Electric Vehicle Adoption Analysis", tech: "Python, Pandas, Plotly, Geopandas", desc: "EV registration data, state-wise adoption, charging infra correlation." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Social Mobility & Income Inequality Study", tech: "Python, Pandas, Plotly, Geopandas, Scikit-learn", desc: "World Bank + OECD data, Gini index trend, mobility predictor, interactive report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Smart City Sensor Data Analysis", tech: "Python, Pandas, Plotly, Folium, Prophet", desc: "IoT sensor dataset (air/noise/traffic), anomaly detection, zone comparison, forecast." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "NLP-Powered Financial Report Analyzer", tech: "Python, spaCy, Gensim, Plotly, Streamlit", desc: "Scrape annual report PDFs, topic extraction, sentiment trend, KPI comparison." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Predictive Population Health Dashboard", tech: "Python, Pandas, Scikit-learn, Prophet, Plotly", desc: "District health data, disease burden forecast, risk stratification, intervention planner." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Geospatial Urban Sprawl Study", tech: "Python, Geopandas, OSMnx, Folium, Plotly", desc: "Satellite-derived urban boundary data, expansion rate, green cover loss, 3-city compare." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Agricultural Market Price Analyzer", tech: "Python, Pandas, Plotly, Prophet, Streamlit", desc: "APMC mandi price data, crop price forecast, seasonal trend, district comparison." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "machine learning": {
    title: "Machine Learning Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Iris Flower Species Classifier", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Logistic Regression on Iris dataset, confusion matrix, species predictor UI." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Diabetes Risk Predictor", tech: "Python, Scikit-learn, Pandas, Streamlit", desc: "Logistic Regression on Pima dataset, patient form, recall-optimized threshold." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Boston Housing Price Estimator", tech: "Python, Scikit-learn, Pandas, Matplotlib", desc: "Linear/Ridge regression, RMSE/R\u00b2, residual plot, feature coefficient chart." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Titanic Survival Predictor", tech: "Python, Pandas, Scikit-learn, Streamlit", desc: "Binary classification, feature engineering, ROC curve, Streamlit input form." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Wine Quality Classifier", tech: "Python, Scikit-learn, Pandas, Seaborn", desc: "Multi-class RF on UCI Wine, accuracy comparison, feature importance chart." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Spam SMS Detector", tech: "Python, NLTK, Naive Bayes, Streamlit", desc: "TF-IDF on SMS Spam Collection, ROC curve, live message tester." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Crop Yield Prediction System", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Regression on crop dataset, soil+weather inputs, district-level yield map." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "House Rent Price Predictor", tech: "Python, XGBoost, Pandas, Streamlit", desc: "Feature engineering on rental dataset, neighborhood filter, rent estimator." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Road Traffic Volume Predictor", tech: "Python, Scikit-learn, Pandas, Folium", desc: "Traffic dataset, time + weather features, city intersection heatmap." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Twitter Sentiment Dashboard", tech: "Python, Tweepy, TextBlob, Plotly, Streamlit", desc: "Real-time tweet sentiment, trending keyword cloud, sentiment timeline." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Electricity Consumption Predictor", tech: "Python, Prophet, Pandas, Streamlit", desc: "Household power dataset, daily consumption forecast, anomaly flagging." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Fake Job Posting Detector", tech: "Python, NLTK, TF-IDF, Scikit-learn, Streamlit", desc: "Binary NLP classifier on EMSCAD dataset, keyword explainability." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Real-Time Pose Estimation Trainer", tech: "Python, MediaPipe, TensorFlow, Flask, Socket.io", desc: "Live webcam pose detection, rep counter for exercises, form feedback API." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI-Powered Resume Parser & Ranker", tech: "Python, spaCy, BERT, FastAPI, React", desc: "Batch resume upload, JD matching, ranked shortlist, skills gap PDF report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Sign Language to Text Converter", tech: "Python, MediaPipe, LSTM, TensorFlow, Gradio", desc: "Real-time hand gesture capture, sequence-to-text decoder, accuracy chart." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Predictive Maintenance System", tech: "Python, Scikit-learn, Pandas, Plotly, Streamlit", desc: "Sensor time-series, failure prediction, maintenance schedule optimizer." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Sarcasm Detection in Social Media", tech: "Python, RoBERTa HuggingFace, FastAPI, React", desc: "Fine-tune on Reddit sarcasm dataset, confidence score, batch CSV API." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Driver Drowsiness Detection System", tech: "Python, OpenCV, MediaPipe, Keras, Flask", desc: "Real-time eye/face detection, drowsiness alert system, video feed demo." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "artificial intelligence": {
    title: "Artificial Intelligence Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Keyword-Based FAQ Chatbot", tech: "Python, NLTK, Flask, Bootstrap", desc: "Intent matching on custom FAQ dataset, response retrieval, multi-turn conversation log." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "AI Text Summarizer Tool", tech: "Python, HuggingFace BART, Streamlit", desc: "Paste article \u2192 abstractive summary, length slider, copy button." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "AI Quote & Motivation Generator", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Topic input, AI generates 5 quotes, mood filter, save-to-favourites." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "AI Recipe Generator from Ingredients", tech: "Python, Gemini API, Streamlit", desc: "Enter available ingredients, AI suggests 3 recipes with steps, dietary filter." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "AI Grammar Correction Assistant", tech: "Python, LanguageTool API, Flask, React", desc: "Text input, error highlighting, corrected output, confidence color-code." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "AI Joke & Story Generator", tech: "Python, Gemini API, Streamlit", desc: "Genre/mood selector, AI-generated jokes or short stories, regenerate button." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "AI Interview Question Generator", tech: "Python, Gemini API, FastAPI, React", desc: "Upload JD/resume, generate role-specific questions by difficulty, PDF export." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "AI Product Description Writer", tech: "Python, Gemini API, FastAPI, React", desc: "Enter product name + features, generate 3 tone-varied descriptions, SEO score." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Conversational Language Tutor", tech: "Python, Gemini API, Flask, Bootstrap", desc: "Choose language + level, AI conducts lesson, grammar correction, vocab quiz." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "AI Document Classifier", tech: "Python, spaCy, BERT, FastAPI", desc: "Multi-class document type tagger (invoice/contract/report), confidence, batch CSV API." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Agentic Research Assistant", tech: "Python, LangChain, DuckDuckGo Tool, Streamlit", desc: "Input research topic, agent searches + summarizes web sources, cited report." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "AI Meeting Minutes Generator", tech: "Python, Whisper ASR, Gemini API, Streamlit", desc: "Upload audio recording, transcription, action items extraction, summary PDF." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Multi-Agent Task Automation System", tech: "Python, LangChain Agents, FastAPI, React", desc: "Planner + executor agents, multi-step task decomposition, tool use (search/code/file)." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "RAG Chatbot on Custom Knowledge Base", tech: "Python, LangChain, ChromaDB, Gemini API, Streamlit", desc: "Multi-PDF ingestion, vector embeddings, semantic search, source citation, multi-turn." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI Legal Contract Analyzer", tech: "Python, GPT-4o/Gemini, LangChain, Streamlit", desc: "Upload contract PDF, clause extraction, risk flagging, plain-English summary." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI-Powered Mock Interview Coach", tech: "Python, Whisper ASR, Gemini API, React, Flask", desc: "Voice-based interview, speech-to-text, AI follow-up questions, answer scoring, report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Autonomous Data Analysis Agent", tech: "Python, LangChain, Pandas, Streamlit", desc: "Upload CSV, agent auto-detects columns, runs EDA, generates insights report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI Video Scene Describer", tech: "Python, CLIP HuggingFace, OpenCV, FastAPI", desc: "Upload video, keyframe extraction, CLIP caption per scene, narrative summary." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "full stack development": {
    title: "Full Stack Development Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Personal Task Manager App", tech: "React.js, Node.js, MySQL, JWT", desc: "Task CRUD, priority tags, due-date filter, completion toggle, user auth." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Notes & Bookmarks Web App", tech: "React.js, Express, MongoDB, JWT", desc: "Create/edit/delete notes, tag system, URL bookmark saver, search filter." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Contact Directory App", tech: "React.js, Node.js, PostgreSQL, JWT", desc: "CRUD contacts, search/filter, import CSV, profile photos, dark mode." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Simple Blog Platform", tech: "React.js, Node.js, MongoDB, JWT", desc: "Create/edit posts, markdown editor, tags, comments, user profiles." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Recipe Book Web App", tech: "React.js, Express, MongoDB", desc: "Add/search recipes, ingredient list, step-by-step cooking mode, favorites." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Poll & Voting App", tech: "React.js, Node.js, PostgreSQL, Socket.io", desc: "Create polls, real-time vote count, results chart, expiry timer." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Job Application Tracker", tech: "React.js, Node.js, PostgreSQL, Chart.js, JWT", desc: "Track applications by status, Kanban view, deadline alerts, stats dashboard." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Online Quiz Platform", tech: "React.js, Node.js, MongoDB, Socket.io", desc: "Question bank, timed quiz, live leaderboard, auto-grade, result analytics." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Budget Tracking Web App", tech: "React.js, Node.js, PostgreSQL, Chart.js", desc: "Income/expense CRUD, category budgets, monthly trend chart, PDF report." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Student Attendance Management", tech: "React.js, Node.js, MySQL, JWT, Chart.js", desc: "QR code check-in, absent alerts, attendance report, teacher dashboard." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Expense Split App", tech: "React.js, Node.js, MongoDB, Socket.io", desc: "Group expenses, auto-split, settle-up tracker, real-time balance update." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "College Event Management System", tech: "React.js, Node.js, PostgreSQL, Cloudinary", desc: "Event CRUD, registration, seat booking, QR ticket, attendance report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Multi-Tenant Project Management SaaS", tech: "React.js, Node.js, PostgreSQL, Socket.io, Stripe", desc: "Org/workspace/board/card CRUD, real-time updates, role access, Stripe billing." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "E-Learning Platform with Certificates", tech: "React.js, Node.js, MongoDB, Cloudinary, Stripe", desc: "Course builder, video streaming, quiz engine, progress tracking, PDF cert generator." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Healthcare Appointment System", tech: "React.js, Node.js, PostgreSQL, Socket.io, Nodemailer", desc: "Doctor/patient portal, slot booking, video consult, prescription PDF, reminders." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Real-Time Online Auction Platform", tech: "React.js, Node.js, PostgreSQL, Socket.io, Stripe", desc: "Live bidding, countdown timer, auto-outbid, payment, seller dashboard." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Freelance Marketplace Platform", tech: "React.js, Node.js, PostgreSQL, Stripe, Socket.io", desc: "Gig listing, proposal system, escrow payment, review/rating, chat." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Corporate HR & Payroll System", tech: "React.js, Node.js, PostgreSQL, PDFKit, JWT", desc: "Employee CRUD, leave management, payroll calculator, payslip PDF, role access." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "data analyst": {
    title: "Data Analyst Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Superstore Sales Performance Report", tech: "Python, Pandas, Plotly, Power BI", desc: "Kaggle Superstore data, regional KPIs, top-product bar chart, manager summary PDF." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "HR Headcount & Turnover Dashboard", tech: "Python, Pandas, Seaborn, Matplotlib", desc: "Employee dataset, dept headcount, attrition rate chart, YoY trend." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "E-Commerce Return Rate Analyzer", tech: "Python, Pandas, Plotly, Streamlit", desc: "Returns dataset, reason categorization, SKU-level return rate, seller report." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Website Traffic Analytics Dashboard", tech: "Python, Pandas, Plotly, Streamlit", desc: "GA export data, session/bounce/conversion trend, channel breakdown." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Attendance & Punctuality Tracker", tech: "Python, Pandas, Openpyxl, Plotly", desc: "Employee check-in data, late arrival pattern, dept comparison, monthly PDF." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Monthly Revenue Trend Analyzer", tech: "Python, Pandas, Plotly, Power BI", desc: "Revenue CSV, MoM growth, product mix chart, top-10 customers." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Retail Store Footfall Insights", tech: "Python, Pandas, Plotly, Power BI", desc: "Hourly footfall + sales data, peak-hour analysis, conversion rate, staff optimizer." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Product Profitability Analysis", tech: "Python, Pandas, Plotly, Seaborn", desc: "Revenue \u2013 COGS model, margin by SKU/category, waterfall P&L chart, pricing levers." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Customer Cohort Retention Dashboard", tech: "Python, Pandas, Plotly, Streamlit", desc: "Monthly cohort table, retention heatmap, churn inflection finder, segment filter." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Ad Spend Attribution Analyzer", tech: "Python, Pandas, Plotly, Streamlit", desc: "Multi-channel ad data, ROAS by channel, attribution model comparison." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Inventory Turnover Analysis", tech: "Python, Pandas, Plotly, Openpyxl", desc: "Stock movement data, turnover ratio, slow-mover alert, reorder point calculator." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Employee Productivity Score Card", tech: "Python, Pandas, Plotly, Streamlit", desc: "Task completion, quality score, peer review data, monthly performance card." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Real-Time Sales Command Center", tech: "Python, Pandas, Streamlit, Plotly, SQL", desc: "Live DB connection, auto-refreshing KPI tiles, drill-down by region/rep/product." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Predictive Churn Cohort Tracker", tech: "Python, Pandas, Scikit-learn, Plotly, Power BI", desc: "Cohort CLV + ML churn risk, early-warning segment filter, retention action log." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Multi-Source Data Pipeline Dashboard", tech: "Python, Pandas, SQLAlchemy, Plotly, Airflow", desc: "ETL from 3 sources (CSV, API, DB), unified dashboard, scheduled refresh." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "HR Analytics & Workforce Planning Tool", tech: "Python, Pandas, Plotly, Scikit-learn, Streamlit", desc: "Headcount forecast, skill gap analysis, succession planning matrix, org chart." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Omnichannel Sales Attribution Dashboard", tech: "Python, Pandas, Plotly, SQL, Streamlit", desc: "Online + offline sales merge, touchpoint attribution, ROAS by channel, exec report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Financial Risk Exposure Dashboard", tech: "Python, Pandas, Plotly, Scikit-learn", desc: "Portfolio data, VaR calculation, stress test scenarios, risk heatmap." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "front end development": {
    title: "Front End Development Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Personal Portfolio Website", tech: "React.js, CSS3, EmailJS", desc: "Animated hero, projects grid, skills bar, contact form, dark/light toggle." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Currency Converter App", tech: "React.js, Exchange Rate API, Tailwind", desc: "Real-time rates, 150+ currencies, swap button, conversion history." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "BMI Calculator with Chart", tech: "React.js, Chart.js, Tailwind CSS", desc: "Height/weight input, BMI result, category indicator, trend line chart." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Age Calculator App", tech: "React.js, date-fns, Tailwind CSS", desc: "DOB input, exact age (years/months/days), next birthday countdown." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Pomodoro Productivity Timer", tech: "React.js, Tailwind, Web Audio API", desc: "25/5 min timer, custom intervals, session counter, break alarm sound." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Trivia Quiz Game", tech: "React.js, Open Trivia API, Tailwind", desc: "Category/difficulty selector, 10 questions, score tracker, leaderboard." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Job Board UI with Filters", tech: "React.js, Tailwind CSS, Context API", desc: "Job card listing, search + multi-filter, bookmark, pagination, skeleton loader." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Crypto Price Tracker Dashboard", tech: "React.js, CoinGecko API, Chart.js, Tailwind", desc: "Live prices, 7-day sparkline, portfolio tracker, price alert toggle." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Travel Itinerary Planner", tech: "React.js, Google Maps API, Tailwind", desc: "Trip builder, day-wise stops, map view, distance calculator, PDF export." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Music Player with Visualizer", tech: "React.js, Web Audio API, Canvas, Tailwind", desc: "Playlist CRUD, frequency visualizer, equalizer, waveform display." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Recipe Finder App", tech: "React.js, Spoonacular API, Tailwind", desc: "Ingredient-based search, dietary filter, nutrition info, save favorites." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Movie Recommendation App", tech: "React.js, TMDB API, Tailwind, Redux", desc: "Search/browse movies, genre filter, similar movies, watchlist, ratings." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Real-Time Collaborative Notes App", tech: "React.js, Socket.io, Tailwind, Quill.js", desc: "Multi-user note editing, live cursor, undo/redo, room links, export PDF." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "3D Interactive Portfolio", tech: "React.js, Three.js, GSAP, Tailwind", desc: "3D scene hero, scroll animations, project showcase, particle effects." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "E-Commerce Frontend with Cart", tech: "React.js, Redux, Stripe.js, Tailwind", desc: "Product listing, filters, cart, checkout flow, order confirmation, wishlist." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Social Media Dashboard", tech: "React.js, Socket.io, Redux, Tailwind", desc: "Feed, stories, likes/comments real-time, notifications, dark mode." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Online Code Editor", tech: "React.js, Monaco Editor, Tailwind, Piston API", desc: "Multi-language support, syntax highlight, run code, share snippet, themes." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Kanban Project Board", tech: "React.js, DnD-Kit, Socket.io, Tailwind", desc: "Drag-drop cards, multi-board, real-time sync, labels, due dates, members." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "cloud computing": {
    title: "Cloud Computing Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Static Site Hosting with CDN on AWS", tech: "AWS S3, CloudFront, Route53", desc: "Deploy React app to S3, CloudFront distribution, custom domain, SSL cert." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Serverless Image Resizer", tech: "AWS Lambda, S3, API Gateway, Python", desc: "Upload image \u2192 Lambda resizes to 3 sizes \u2192 S3 storage, presigned URL response." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Cloud File Storage App", tech: "AWS S3, EC2, Node.js, React", desc: "Upload/download/delete files via S3, file listing UI, file type filter." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Auto-Scaling Web Server", tech: "AWS EC2, Auto Scaling, ALB, CloudWatch", desc: "Launch template, scaling policy, health checks, load balancer, dashboard." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "RDS MySQL Setup with Backups", tech: "AWS RDS, EC2, MySQL, CloudWatch", desc: "Multi-AZ RDS, automated backups, parameter group, monitoring alarms." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Containerized Microservices on AWS", tech: "Docker, AWS ECS, ECR, ALB", desc: "Dockerize 3 microservices, push to ECR, deploy via ECS Fargate, ALB routing." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "CI/CD Pipeline with GitHub Actions", tech: "GitHub Actions, AWS EC2, S3, CodeDeploy", desc: "Push-to-deploy pipeline, staging + prod environments, rollback mechanism." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Cloud Cost Optimization Dashboard", tech: "AWS Cost Explorer, Lambda, S3, QuickSight", desc: "Daily cost report, unused resource detector, savings recommendation, PDF." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "VPC with Public/Private Subnets", tech: "AWS VPC, NAT Gateway, EC2, Security Groups", desc: "3-tier VPC architecture, bastion host, NAT gateway, NACLs, flow logs." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Kubernetes Cluster on EKS", tech: "AWS EKS, kubectl, Helm, CloudWatch", desc: "EKS cluster setup, deploy sample app, HPA, ingress controller, monitoring." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "CloudFormation Infrastructure Stack", tech: "AWS CloudFormation, EC2, RDS, S3, SNS", desc: "Full infra as code, nested stacks, parameters, outputs, change sets." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Multi-Region Disaster Recovery Setup", tech: "AWS Route53, RDS, S3, CloudFormation", desc: "Active-passive DR, RDS cross-region replica, Route53 health-check failover." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Serverless Event-Driven Architecture", tech: "AWS Lambda, SQS, SNS, DynamoDB, API Gateway", desc: "Order processing pipeline, fan-out with SNS, dead-letter queue, CloudWatch." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Full CI/CD Pipeline with Kubernetes", tech: "Jenkins, Docker, Kubernetes, AWS EKS, Helm", desc: "Multi-stage pipeline, Docker build, Helm deploy to EKS, Slack notifications." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Data Lake on AWS", tech: "AWS S3, Glue, Athena, QuickSight, Lambda", desc: "Raw/curated/processed zones, Glue ETL jobs, Athena queries, BI dashboard." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "ML Model Deployment on AWS", tech: "AWS SageMaker, Lambda, API Gateway, S3", desc: "Train model in SageMaker, deploy endpoint, REST API, A/B testing, monitoring." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Zero-Trust Security Architecture", tech: "AWS IAM, Cognito, WAF, Shield, GuardDuty", desc: "Identity-based access, MFA enforcement, WAF rules, threat detection, audit." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Hybrid Cloud with AWS Direct Connect", tech: "AWS Direct Connect, VPN, Transit Gateway, VPC", desc: "On-prem to AWS connectivity, BGP routing, failover VPN, latency testing." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "cyber security": {
    title: "Cyber Security Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Network Vulnerability Scanner", tech: "Python, Nmap, Flask, Bootstrap", desc: "Port scanning on local subnet, open-port risk rating, CVE lookup, HTML report." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Password Strength Analyzer", tech: "Python, Flask, zxcvbn, React", desc: "Strength scoring, crack-time estimate, secure password generator." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Phishing Email Detector", tech: "Python, NLTK, Scikit-learn, Flask", desc: "ML classifier on email dataset, phishing URL checker, confidence score." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "File Integrity Monitor", tech: "Python, hashlib, Flask, SQLite", desc: "SHA-256 baseline, tamper detection, alert log, scheduled scan." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Basic Firewall Rules Simulator", tech: "Python, iptables, Flask, Bootstrap", desc: "Rule builder UI, traffic allow/block simulation, rule priority, log viewer." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Web Application Firewall (WAF) Tool", tech: "Python, Flask, regex, SQLite", desc: "XSS/SQLi pattern detection, request logging, block list management." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Security Audit Report Generator", tech: "Python, OpenVAS, Nmap, Jinja2, PDFKit", desc: "Automated scan, severity classification, remediation steps, PDF report." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Honeypot Deployment & Analysis", tech: "Python, Cowrie, ELK Stack, Kibana", desc: "SSH honeypot, attacker IP log, command analysis, Kibana dashboard." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Malware Sample Analyzer", tech: "Python, YARA, VirusTotal API, Flask", desc: "Static analysis, YARA rule matching, VT hash lookup, threat report." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Encrypted Chat Application", tech: "Python, RSA/AES, Flask, Socket.io", desc: "End-to-end encryption, key exchange, message integrity, secure login." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "OSINT Reconnaissance Tool", tech: "Python, Shodan API, WHOIS, Flask", desc: "Domain/IP OSINT, subdomain enum, email harvesting, risk report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Web Application Penetration Testing Report", tech: "Python, OWASP ZAP, Burp Suite, Markdown", desc: "Automated scan on demo app, XSS/SQLi/CSRF findings, CVSS scoring, PDF." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "SIEM Dashboard with Threat Detection", tech: "Python, ELK Stack, Kibana, Wazuh", desc: "Log ingestion from 5 sources, correlation rules, alert dashboard, incident response." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Zero-Day Vulnerability Research Report", tech: "Python, GDB, Ghidra, Metasploit", desc: "Binary analysis, exploit development, CVE documentation, responsible disclosure." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Blockchain-Based Digital Evidence System", tech: "Python, Ethereum, Web3.py, Flask", desc: "Evidence hash on blockchain, chain of custody, tamper-proof audit trail." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI-Powered Intrusion Detection System", tech: "Python, Scikit-learn, Kafka, ELK, Flask", desc: "Network traffic ML classifier, real-time streaming detection, alert + block." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Red Team Simulation Report", tech: "Python, Metasploit, Cobalt Strike, Nmap", desc: "Full kill-chain simulation, lateral movement, data exfil demo, blue team debrief." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "software testing (qa)": {
    title: "Software Testing (Qa) Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Manual Test Plan for E-Commerce Site", tech: "Excel, JIRA, TestRail", desc: "Test cases for cart/checkout/payment, bug reports, severity classification." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Mobile App Manual Testing Report", tech: "Android Studio, TestRail, JIRA", desc: "Functional + UI test cases for Android app, defect log, regression checklist." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "API Testing with Postman", tech: "Postman, Newman, Excel", desc: "REST API test collection, status/schema/response validation, HTML report." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Database Testing Report", tech: "MySQL, Excel, JIRA", desc: "Data integrity, constraint validation, stored procedure testing, test cases." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Regression Test Suite Document", tech: "Excel, JIRA, TestRail", desc: "Full regression suite, priority matrix, pass/fail tracking, release report." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Automated UI Testing with Selenium", tech: "Python, Selenium, pytest, Allure", desc: "Page Object Model, cross-browser test suite, CI integration, HTML report." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Performance Testing with JMeter", tech: "Apache JMeter, Grafana, InfluxDB", desc: "Load/stress/spike tests, throughput/latency metrics, bottleneck analysis." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Mobile Automation with Appium", tech: "Python, Appium, pytest, Android", desc: "Native Android app automation, gesture simulation, screenshot on failure." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "BDD Testing with Cucumber", tech: "Java, Cucumber, Selenium, Maven", desc: "Gherkin feature files, step definitions, scenario outline, CI integration." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Security Testing Checklist & Report", tech: "OWASP ZAP, Burp Suite, Excel", desc: "OWASP Top 10 checks, XSS/SQLi/CSRF findings, severity rating, fix recommendations." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "CI Testing Pipeline Setup", tech: "Jenkins, GitHub Actions, Selenium, pytest", desc: "Auto-trigger on PR, parallel test execution, Slack notification, test report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "API Testing & Performance Dashboard", tech: "Postman, k6, Grafana, Jenkins", desc: "REST API test collection, load test with k6, performance dashboard, CI pipeline." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "End-to-End Test Automation Framework", tech: "Python, Playwright, pytest, Docker, CI", desc: "Multi-browser E2E framework, parallel execution, Docker container, CI/CD." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Chaos Engineering Experiment", tech: "Chaos Monkey, AWS, Grafana, Prometheus", desc: "Failure injection on prod-like env, resilience validation, recovery SLA report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI-Assisted Test Case Generator", tech: "Python, Gemini API, Selenium, FastAPI", desc: "Input requirements \u2192 AI generates test cases \u2192 auto-execute \u2192 results dashboard." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Quality Metrics Dashboard", tech: "Python, JIRA API, Plotly, Streamlit", desc: "Defect density, test coverage, MTTR, release quality trend, exec report." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "app development": {
    title: "App Development Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "BMI Calculator App", tech: "Flutter, Dart", desc: "Height/weight input, BMI result, category color, history list, dark mode." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "To-Do List App", tech: "Flutter, Dart, SQLite", desc: "Task CRUD, priority, due date, completion toggle, local storage." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Weather App", tech: "Flutter, Dart, OpenWeather API", desc: "Location-based weather, 5-day forecast, condition icons, unit toggle." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Currency Converter App", tech: "Flutter, Dart, Exchange Rate API", desc: "Real-time rates, swap currencies, conversion history, offline support." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Quiz App", tech: "Flutter, Dart, SQLite", desc: "Category/difficulty selector, timer, score tracker, results screen." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Expense Tracker App", tech: "Flutter, Dart, SQLite, Charts", desc: "Income/expense CRUD, category budget, monthly trend chart, PDF report." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Fitness Tracker App", tech: "Flutter, Dart, SQLite, HealthKit", desc: "Workout log, step counter, calorie burn, progress chart, goal setting." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Recipe App with Offline Support", tech: "Flutter, Dart, SQLite, REST API", desc: "Search recipes, save offline, step-by-step cook mode, shopping list." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Chat Application", tech: "Flutter, Dart, Firebase", desc: "Real-time messaging, read receipts, image sharing, push notifications." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "News Reader App", tech: "Flutter, Dart, News API, SQLite", desc: "Category filter, bookmarks, offline reading, dark mode, share." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "E-Commerce App", tech: "Flutter, Dart, Firebase, Stripe", desc: "Product listing, cart, wishlist, checkout, order tracking, reviews." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Food Delivery App", tech: "Flutter, Dart, Firebase, Google Maps", desc: "Restaurant listing, live tracking, real-time orders, driver app, ratings." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Telemedicine App", tech: "Flutter, Dart, Firebase, Agora SDK", desc: "Doctor/patient portal, video consultation, prescription, appointment booking." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Social Media App", tech: "Flutter, Dart, Firebase, Cloud Functions", desc: "Feed, stories, real-time likes/comments, DM, notifications, explore page." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Ride-Sharing App", tech: "Flutter, Dart, Firebase, Google Maps, Stripe", desc: "Driver/rider app, live tracking, fare calculator, payment, ratings." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI-Powered Personal Assistant App", tech: "Flutter, Dart, Gemini API, Firebase", desc: "Voice commands, calendar integration, smart reminders, task automation." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "ui/ux design": {
    title: "Ui/Ux Design Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Personal Portfolio Redesign", tech: "Figma", desc: "Audit existing site, redesign hero + projects + contact, mobile-first layout." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Restaurant Menu App UI", tech: "Figma, Adobe XD", desc: "Menu browsing, item detail, cart flow, order confirmation screens." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Login & Onboarding Flow", tech: "Figma", desc: "5-screen onboarding, login/signup, error states, success animation." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Dashboard UI Design", tech: "Figma, Tailwind CSS reference", desc: "Admin dashboard, KPI cards, charts, sidebar nav, light/dark theme." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Mobile Banking App UI", tech: "Figma", desc: "Home, transfer, history, settings screens, accessibility compliant." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "E-Commerce Mobile App Redesign", tech: "Figma, Adobe XD, Maze", desc: "Audit existing app UX, redesign product listing + cart flow, usability test." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Healthcare Patient Portal UX", tech: "Figma, Maze, FigJam", desc: "User research, journey map, hi-fi prototype, accessibility audit WCAG 2.1." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "EdTech Platform UX Research", tech: "Figma, Maze, Google Forms", desc: "User interviews, affinity mapping, persona, lo-fi + hi-fi wireframes." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Food Delivery App Redesign", tech: "Figma, Principle", desc: "IA audit, user flow redesign, micro-interactions, prototype, usability test." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "SaaS Dashboard Design System", tech: "Figma, Tokens Studio", desc: "Design tokens, component library, responsive grid, interactive prototype." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Accessibility Audit & Redesign", tech: "Figma, Axe, WAVE", desc: "WCAG audit of existing site, severity report, redesigned accessible components." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI Product Dashboard Design System", tech: "Figma, Storybook, Tokens Studio", desc: "Component library with design tokens, responsive grid, dark/light themes, docs." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Full App Design Sprint", tech: "Figma, FigJam, Maze, Principle", desc: "5-day sprint: problem framing, ideation, prototype, test, iteration report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Design System for Fintech App", tech: "Figma, Zeroheight, Tokens Studio", desc: "Color/typography/spacing system, 50+ components, do/don't guidelines, Zeroheight docs." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AR/VR UX Prototype", tech: "Figma, Spline, Unity (concept)", desc: "Spatial UI design, 3D component concepts, interaction model, usability study." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "devops": {
    title: "Devops Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Dockerize a Web Application", tech: "Docker, Docker Compose, Nginx", desc: "Dockerfile for Node.js app, docker-compose with DB, Nginx reverse proxy." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Linux Server Setup & Hardening", tech: "Ubuntu, bash, ufw, fail2ban", desc: "User management, SSH key auth, firewall rules, fail2ban, cron jobs." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Git Workflow Setup", tech: "Git, GitHub, GitFlow", desc: "Branch strategy, PR templates, commit conventions, tag releases, .gitignore." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Basic Monitoring with Prometheus", tech: "Prometheus, Grafana, Node Exporter", desc: "Node exporter setup, Prometheus scrape config, Grafana dashboard." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Nginx Load Balancer Setup", tech: "Nginx, Docker, 3 Node.js instances", desc: "Round-robin load balancing, health checks, upstream config, access logs." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "CI/CD Pipeline with Jenkins", tech: "Jenkins, Docker, GitHub, Maven", desc: "Multibranch pipeline, build/test/deploy stages, Slack notification, rollback." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Kubernetes Cluster Setup", tech: "Kubernetes, kubectl, Helm, Minikube", desc: "Deployment/service/ingress, HPA, ConfigMaps, secrets, rolling update." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Infrastructure as Code with Terraform", tech: "Terraform, AWS, HCL", desc: "VPC + EC2 + RDS + S3 IaC, state management, modules, plan/apply workflow." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "ELK Stack Log Management", tech: "Elasticsearch, Logstash, Kibana, Filebeat", desc: "Log ingestion from 3 sources, index patterns, Kibana dashboards, alerts." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Ansible Configuration Management", tech: "Ansible, YAML, SSH, AWS EC2", desc: "Playbooks for web server setup, idempotent tasks, inventory management." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "GitOps with ArgoCD", tech: "ArgoCD, Kubernetes, Helm, GitHub", desc: "App deployment via Git, sync policies, rollback, multi-env management." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Full DevOps Pipeline on AWS", tech: "Jenkins, Docker, EKS, Terraform, Helm", desc: "IaC infra, containerized app, CI/CD to K8s, monitoring, security scan." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Service Mesh with Istio", tech: "Istio, Kubernetes, Kiali, Jaeger", desc: "Traffic management, mTLS, circuit breaker, distributed tracing, dashboards." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Platform Engineering with Backstage", tech: "Backstage, Kubernetes, GitHub, AWS", desc: "Developer portal, software catalog, scaffolder templates, TechDocs." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "SRE Runbook & SLO Dashboard", tech: "Prometheus, Grafana, PagerDuty, Python", desc: "SLI/SLO definition, error budget, alerting rules, runbook, incident review." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Multi-Cloud Deployment Strategy", tech: "Terraform, AWS, GCP, Azure, Kubernetes", desc: "Cloud-agnostic IaC, workload portability, cost comparison, failover demo." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "blockchain development": {
    title: "Blockchain Development Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Hello World Smart Contract", tech: "Solidity, Hardhat, Ethers.js", desc: "Deploy ERC-20-like contract to testnet, interact via script, verify on Etherscan." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Cryptocurrency Wallet UI", tech: "React.js, MetaMask, Ethers.js", desc: "Connect wallet, display balance, send ETH, transaction history." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Token Airdrop Contract", tech: "Solidity, Hardhat, OpenZeppelin", desc: "ERC-20 token, whitelist airdrop, claim function, event logging." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Simple Voting DApp", tech: "Solidity, Hardhat, React.js, Ethers.js", desc: "Create proposals, cast votes, prevent double voting, result display." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "NFT Minting Platform", tech: "Solidity, IPFS, React.js, Ethers.js", desc: "ERC-721 contract, IPFS metadata, mint UI, gallery, OpenSea compatible." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Decentralized Crowdfunding DApp", tech: "Solidity, Hardhat, React.js, Ethers.js", desc: "Campaign CRUD, ETH contributions, goal/deadline, refund mechanism." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Token Swap Interface", tech: "Solidity, Uniswap V2, React.js, Ethers.js", desc: "Token pair selection, price quote, slippage setting, swap execution." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Multi-Signature Wallet", tech: "Solidity, Hardhat, React.js, Ethers.js", desc: "N-of-M signature requirement, proposal/approve/execute flow, event log." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Supply Chain Tracker on Blockchain", tech: "Solidity, Hardhat, React.js, IPFS", desc: "Product lifecycle on-chain, QR scan to verify, tamper-proof history." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "DAO Governance Contract", tech: "Solidity, OpenZeppelin Governor, React.js", desc: "Proposal creation, token-weighted voting, timelock execution, dashboard." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "DeFi Lending Protocol", tech: "Solidity, Hardhat, Aave fork, React.js", desc: "Deposit/borrow/repay/liquidate, interest rate model, price oracle, dashboard." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Cross-Chain Bridge", tech: "Solidity, Hardhat, Chainlink CCIP, React.js", desc: "Lock-and-mint bridge between 2 testnets, relayer, proof verification." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Decentralized Exchange (DEX)", tech: "Solidity, AMM, Hardhat, React.js", desc: "Liquidity pool, constant product formula, swap, LP token, fee distribution." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "NFT Marketplace", tech: "Solidity, IPFS, React.js, Ethers.js, Stripe", desc: "List/buy/auction NFTs, royalties, featured drops, creator dashboard." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "ZK-Proof Voting System", tech: "Solidity, Circom, snarkjs, React.js", desc: "Anonymous voting with ZK proof, nullifier to prevent double vote, verifier contract." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  "hr assistant": {
    title: "Hr Assistant Projects (3 Stages)",
    projects: [
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Employee Onboarding Checklist App", tech: "React.js, Node.js, MongoDB", desc: "Onboarding task list, progress tracker, document upload, manager sign-off." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Leave Management System", tech: "React.js, Node.js, PostgreSQL", desc: "Leave request, approval workflow, balance tracker, calendar view, email alert." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Job Description Generator", tech: "Python, Gemini API, Streamlit", desc: "Role/level/skills input, AI generates JD, tone selector, export to Word." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Interview Scheduler Tool", tech: "React.js, Node.js, Google Calendar API", desc: "Candidate booking, panel availability, Zoom link gen, reminder email." },
      { stage: "\ud83d\udfe2 Stage \u2014 Simple", title: "Employee Directory App", tech: "React.js, Node.js, PostgreSQL", desc: "Staff profiles, org chart, department filter, search, export CSV." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "HR Chatbot for Policy Queries", tech: "Python, Gemini API, LangChain, Streamlit", desc: "Upload HR policy PDF, RAG chatbot answers employee queries, escalation flow." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Performance Review System", tech: "React.js, Node.js, PostgreSQL, PDFKit", desc: "360\u00b0 review form, rating aggregation, manager comments, PDF appraisal." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Recruitment Pipeline Tracker", tech: "React.js, Node.js, PostgreSQL, Chart.js", desc: "Job posting, applicant Kanban, stage tracking, source analytics, offer letter." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Payroll Calculator Dashboard", tech: "React.js, Node.js, PostgreSQL, PDFKit", desc: "CTC breakdown, deduction calculator, payslip generator, bulk processing." },
      { stage: "\ud83d\udfe1 Stage \u2014 Medium", title: "Training & Development Tracker", tech: "React.js, Node.js, MongoDB, Chart.js", desc: "Course assignment, completion tracking, skill matrix, L&D budget dashboard." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI Resume Screening System", tech: "Python, spaCy, BERT, FastAPI, React", desc: "Bulk resume upload, JD matching, ranked shortlist, bias detection, report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "HR Analytics Dashboard", tech: "Python, Pandas, Plotly, Scikit-learn, Streamlit", desc: "Headcount forecast, attrition prediction, diversity metrics, workforce planning." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "Compensation Benchmarking Tool", tech: "Python, Pandas, Plotly, React, FastAPI", desc: "Market salary data, pay equity analysis, band setting, pay gap report." },
      { stage: "\ud83d\udd34 Stage \u2014 Hard", title: "AI-Powered Succession Planning", tech: "Python, Gemini API, React, FastAPI, PostgreSQL", desc: "Talent mapping, role criticality, successor identification, development plan." },
    ],
    submission: 'hr@hiresnix.co.in',
  },
  'default': {
    title: 'Internship Capstone Projects (3 Stages)',
    projects: [
      { stage: '🟢 Stage — Simple', title: 'Foundation Project', tech: 'Domain-specific stack', desc: 'Build a foundational project showcasing core skills of your domain.' },
      { stage: '🟡 Stage — Medium', title: 'Core Project', tech: 'Domain-specific stack', desc: 'Intermediate project with real-world data and APIs.' },
      { stage: '🔴 Stage — Hard', title: 'Capstone Project', tech: 'Domain-specific stack', desc: 'Production-level capstone project for your portfolio.' },
    ],
    submission: 'hr@hiresnix.co.in',
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
  const domainKey = (enrollment.domain?.name || '').toLowerCase();
  
  // Match by email first (most reliable), then name, then domain default
  const studentEmail = (enrollment.email || '').toLowerCase().trim();
  const studentName = (enrollment.studentName || '').toLowerCase().trim();

  // 1. Email match from batch files (July + August)
  const emailMatch = studentEmail ? (STUDENT_AUG_PROJECTS[studentEmail] || STUDENT_EMAIL_PROJECTS[studentEmail]) : null;
  
  // 2. Name match from assignment sheet
  const nameMatch = !emailMatch ? Object.values(STUDENT_PROJECTS).find((s: any) => {
    const dbName = s.name.toLowerCase().trim();
    if (dbName === studentName) return true;
    const dbParts = dbName.split(' ');
    const nameParts = studentName.split(' ');
    return dbParts[0] === nameParts[0] && dbParts.length > 1 && nameParts.length > 1 && dbParts[dbParts.length-1] === nameParts[nameParts.length-1];
  }) as any : null;

  const projectData = emailMatch || nameMatch || null;
  const projects = projectData?.projects?.length 
    ? projectData.projects 
    : (DOMAIN_PROJECTS[domainKey] || DOMAIN_PROJECTS['default']).projects;
  const title = projectData
    ? `Assigned Projects — ${enrollment.studentName}`
    : (DOMAIN_PROJECTS[domainKey] || DOMAIN_PROJECTS['default']).title;

  return sectionCard('Assigned Project', <Target size={17} className="text-orange-500" />,
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-bold text-gray-900 dark:text-gray-100 text-base">{title}</h5>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">Optional — Submission Not Mandatory</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {projects.map((p: any, i: number) => (
          <div key={i} className={`rounded-xl p-3 border ${
            i === 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
            i === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
            'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{p.stage}</span>
            </div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{p.title}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">🛠 {p.tech}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">📨 Submit your project to</p>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">hr@hiresnix.co.in</p>
      </div>

      <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <p className="text-xs text-green-800 dark:text-green-300 flex items-start gap-1.5">
          <CheckCircle size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
          <span><strong>Note:</strong> Project completion is recommended for your portfolio. Whether you submit or not, your Internship Completion Certificate and documents will be generated automatically once internship duration is completed.</span>
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
              <button key={type}
                onClick={async () => {
                  try {
                    const endpoints = type === 'completion'
                      ? [`/iplatform/completion-letter/${enrollment.id}/pdf`, `/iplatform/completion/${enrollment.id}/pdf`]
                      : [`/iplatform/${type}/${enrollment.id}/pdf`];
                    let res; let success = false;
                    for (const url of endpoints) {
                      try { res = await (await import('../../api/client')).default.get(url, { responseType: 'blob' }); success = true; break; } catch {}
                    }
                    if (!success || !res) { alert('Not available yet'); return; }
                    const urlObj = URL.createObjectURL(res.data);
                    const a = document.createElement('a');
                    a.href = urlObj; a.download = `hiresnix-${type}-${enrollment.studentName || ''}.pdf`; a.click();
                    URL.revokeObjectURL(urlObj);
                  } catch { alert('Download failed. Try again.'); }
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition group">
                <span style={{ fontSize: '1.6rem' }}>{emoji}</span>
                <span className="text-xs font-semibold text-green-800 dark:text-green-300 text-center">{label}</span>
                <Download size={12} className="text-green-600 group-hover:scale-110 transition" />
              </button>
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
  const [openTab, setOpenTab] = React.useState<string | null>(null);
  const toggle = (tab: string) => setOpenTab(prev => prev === tab ? null : tab);

  const tabs = [
    { id: 'overview', label: '📋 Overview', icon: null },
    { id: 'timeline', label: '📈 Timeline', icon: null },
    { id: 'project', label: '🎯 Project', icon: null },
    { id: 'log', label: '📝 Daily Log', icon: null, hide: enrollment.status === 'Completed' },
    { id: 'progress', label: '📊 Progress', icon: null },
    { id: 'certificates', label: '🏆 Certificates', icon: null, hide: enrollment.status !== 'Completed' },
  ].filter(t => !t.hide);

  return (
    <div className="mt-3 space-y-2">
      {tabs.map(tab => (
        <div key={tab.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => toggle(tab.id)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
            <span>{tab.label}</span>
            <span className={`text-gray-400 transition-transform duration-200 ${openTab === tab.id ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {openTab === tab.id && (
            <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
              {tab.id === 'overview' && <InternshipOverview enrollment={enrollment} app={app} />}
              {tab.id === 'timeline' && <InternshipTimeline enrollment={enrollment} />}
              {tab.id === 'project' && <AssignedProject enrollment={enrollment} />}
              {tab.id === 'log' && <DailyInternshipLog enrollment={enrollment} />}
              {tab.id === 'progress' && <ProgressTracker enrollment={enrollment} />}
              {tab.id === 'certificates' && <CertificatePaymentSection enrollment={enrollment} />}
            </div>
          )}
        </div>
      ))}
      <ExceptionContact />
      <CommunitySection />
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