// src/pages/student/StudentInternships.tsx
import React, { useState, useEffect } from 'react';
import { internshipsApi } from '../../api/internships';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { Internship } from '../../types';
import { toast } from 'sonner';
import { Clock, Users, Zap, ChevronRight, Search, Loader2, GraduationCap, CheckCircle, BookOpen, Download } from 'lucide-react';
import client from '../../api/client';

const DIFF_COLORS: Record<string, string> = {
  Beginner:     'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced:     'bg-red-100 text-red-700',
};

// ── DOMAIN APPLICATION PANEL (Hiresnix internship platform) ───────
function IPlatformPanel() {
  const [domains, setDomains]     = useState<any[]>([]);
  const [myApp, setMyApp]         = useState<any>(null);
  const [selected, setSelected]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [applying, setApplying]   = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: '', college: '', year: '4th Year', whyJoin: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', url: '', week: 1 });
  const [submittingTask, setSubmittingTask] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [resources, setResources] = useState<any[]>([]);

  const load = async () => {
    try {
      const [d, a, p] = await Promise.all([
        client.get('/iplatform/domains').then(r => r.data),
        client.get('/iplatform/my-application').then(r => r.data).catch(() => ({ data: null })),
        client.get('/iplatform/my-progress').then(r => r.data).catch(() => ({ data: null })),
      ]);
      setDomains(d.data || []);
      setMyApp(a.data);
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
      await client.post('/iplatform/apply', { domainId: selected.id, ...form });
      toast.success('Application submitted! Admin will review soon.');
      load();
      setSelected(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally { setApplying(false); }
  };

  const downloadDoc = async (type: string, enrollId: number, name: string) => {
    setDownloading(`${type}-${enrollId}`);
    try {
      let res;
      
      // Test multiple possible backend routes to guarantee a match
      const endpoints = type === 'completion' 
        ? [
            `/iplatform/completion-letter/${enrollId}/pdf`,
            `/iplatform/completion/${enrollId}/pdf`,
            `/iplatform/completion-letter/${enrollId}`,
            `/iplatform/completion/${enrollId}`
          ]
        : [
            `/iplatform/${type}/${enrollId}/pdf`,
            `/iplatform/${type}/${enrollId}`
          ];

      let success = false;
      for (const url of endpoints) {
        try {
          res = await client.get(url, { responseType: 'blob' });
          success = true;
          break; // Stop at the first successful endpoint
        } catch (err) {
          // Ignore and try the next fallback URL
        }
      }
      
      if (!success || !res) throw new Error('Not available yet');
      
      const urlObj = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = urlObj; a.download = `hiresnix-${type}-${name}.pdf`; a.click();
      URL.revokeObjectURL(urlObj);
      toast.success('PDF downloaded!');
    } catch (err: any) { 
      console.error('Download error:', err);
      toast.error('Not available yet'); 
    }
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

  // Already has application
  if (app) return (
    <div className="max-w-2xl mx-auto">
      <div className={`rounded-2xl border-2 p-6 mb-4 ${
        app.status === 'Approved' ? 'border-green-200 bg-green-50' :
        app.status === 'Rejected' ? 'border-red-200 bg-red-50' :
        'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ fontSize: '2rem' }}>{app.status === 'Approved' ? '✅' : app.status === 'Rejected' ? '❌' : '⏳'}</div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
  {app.status === "Approved"
    ? "You're Enrolled!"
    : app.status === "Rejected"
    ? "Application Rejected"
    : "Application Under Review"}
</h3>

<p className="text-gray-600 text-sm">
  {app.domain?.name} Internship
</p>

{/* Show only while application is under review */}
{app.status !== "Approved" && app.status !== "Rejected" && (
  <>
    {/* Profile Verification */}
    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h4 className="font-semibold text-blue-900 mb-2">
        📋 Profile Verification
      </h4>

      <p className="text-sm text-gray-700">
        Please send the following on <strong>WhatsApp</strong> or <strong>Email</strong>:
      </p>

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
        Please mention your <strong>Full Name</strong> and <strong>Registered Email Address</strong> while sending your documents.
      </p>
    </div>

    {/* Internship Benefits */}
    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
      <h4 className="font-semibold text-green-900 mb-2">
        🚀 Internship Benefits
      </h4>

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
      </div>

      {/* Enrollment progress */}
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
                  <textarea rows={2} placeholder="What did you work on today? (Description)" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                  <input type="url" placeholder="Project Link / GitHub URL (Optional)" value={taskForm.url} onChange={e => setTaskForm(p => ({ ...p, url: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  
                  <button type="submit" disabled={submittingTask} className="w-full flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-lg transition mt-1">
                    {submittingTask && <Loader2 size={11} className="animate-spin" />} Submit Task
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Study Resources */}
          {resources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-1">
                <BookOpen size={16} className="text-blue-500" /> Study Resources
              </h5>
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

          {/* Download docs if completed */}
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
    </div>
  );

  // No application yet — show domain selection
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
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export function StudentInternships() {
  const [activeTab, setActiveTab] = useState<'hiresnix' | 'programs'>('hiresnix');
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', githubUrl: '', taskId: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: result, loading, error, refetch } = useFetch(
    () => internshipsApi.getInternships({ search: search || undefined, domain: domain || undefined }),
    [search, domain]
  );
  const internships: Internship[] = (result as any)?.data || [];

  const handleEnroll = async (id: number) => {
    setEnrolling(id);
    try {
      await internshipsApi.enroll(id);
      toast.success('Enrolled successfully!');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    } finally { setEnrolling(null); }
  };

  const handleSubmitTask = async (enrollmentId: number) => {
    if (!taskForm.title) { toast.error('Task title is required'); return; }
    setSubmitting(true);
    try {
      await internshipsApi.submitTaskLog(enrollmentId, taskForm);
      toast.success('Task submitted!');
      setTaskForm({ title: '', description: '', githubUrl: '', taskId: '' });
      setExpandedId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Internships</h1>
        <p className="text-sm text-gray-500 mt-1">Gain real-world experience with structured internship programs</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('hiresnix')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'hiresnix' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          🎓 Hiresnix Programs
        </button>
        <button onClick={() => setActiveTab('programs')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'programs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📋 Admin Programs
        </button>
      </div>

      {/* ── Hiresnix Internship Platform ── */}
      {activeTab === 'hiresnix' && <IPlatformPanel />}

      {/* ── Admin Internship Programs ── */}
      {activeTab === 'programs' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search internships..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white" />
            </div>
            <input type="text" placeholder="Filter by domain..."
              value={domain} onChange={e => setDomain(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white sm:w-48" />
          </div>

          {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={refetch} /> :
            internships.length === 0 ? <EmptyState title="No internships available" description="Check back soon for new opportunities" /> : (
              <div className="grid md:grid-cols-2 gap-4">
                {internships.map(internship => {
                  const enrolled = internship.enrollment;
                  const isExpanded = expandedId === internship.id;
                  return (
                    <div key={internship.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{internship.title}</h3>
                          <p className="text-sm text-blue-600 font-medium">{internship.domain}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLORS[internship.difficulty]}`}>{internship.difficulty}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{internship.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Clock size={11} /> {internship.duration}</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {internship.enrollmentCount} enrolled</span>
                        <span className="flex items-center gap-1"><Zap size={11} /> {internship.tasks?.length || 0} tasks</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {internship.technologies?.slice(0, 4).map(t => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      {enrolled ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Progress</span>
                            <span className="text-xs font-black text-blue-600">{enrolled.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${enrolled.progress}%` }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${enrolled.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{enrolled.status}</span>
                            {enrolled.status !== 'Completed' && (
                              <button onClick={() => setExpandedId(isExpanded ? null : internship.id)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
                                Submit Task <ChevronRight size={11} />
                              </button>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="pt-3 border-t border-gray-100 space-y-2">
                              <input type="text" placeholder="Task title *" value={taskForm.title}
                                onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                              <textarea rows={2} placeholder="What did you build/learn?" value={taskForm.description}
                                onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                              <input type="url" placeholder="GitHub URL (optional)" value={taskForm.githubUrl}
                                onChange={e => setTaskForm(p => ({ ...p, githubUrl: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                              <button onClick={() => handleSubmitTask(enrolled.id)} disabled={submitting}
                                className="w-full flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition">
                                {submitting && <Loader2 size={11} className="animate-spin" />} Submit Task Log
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button onClick={() => handleEnroll(internship.id)} disabled={enrolling === internship.id}
                          className="w-full flex items-center justify-center gap-1.5 bg-[#1A1C1E] hover:bg-black disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-lg transition">
                          {enrolling === internship.id && <Loader2 size={11} className="animate-spin" />} Enroll Now
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </>
      )}
    </div>
  );
}
