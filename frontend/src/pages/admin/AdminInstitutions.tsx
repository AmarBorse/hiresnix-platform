// src/pages/admin/AdminInstitutions.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Eye, Trash2, Search, GraduationCap, X, Users, Layers, BookOpen, Award, KeyRound, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminInstitutionApi } from '../../api/institution';
import client from '../../api/client';

const STATUS_TABS = ['all', 'pending', 'approved'] as const;

// ── Password Reset Modal ──────────────────────────────────────────
function ResetPasswordModal({ inst, onClose }: { inst: any; onClose: () => void }) {
  const [tab, setTab]           = useState<'admin' | 'student' | 'all'>('admin');
  const [newPassword, setNewPassword] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading]   = useState(false);
  const [stuLoading, setStuLoading] = useState(false);

  useEffect(() => {
    if (tab === 'student') {
      setStuLoading(true);
      client.get(`/institution/students?limit=200`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hirenix_token')}` }
      }).then(r => setStudents(r.data.data || [])).catch(() => {}).finally(() => setStuLoading(false));
    }
  }, [tab]);

  const handleReset = async () => {
    if (tab !== 'all' && (!newPassword || newPassword.length < 6)) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      if (tab === 'admin') {
        await client.put(`/admin/institutions/${inst.id}/reset-password`, { newPassword });
        toast.success(`Admin password reset for ${inst.institutionName}`);
      } else if (tab === 'student') {
        if (!selectedStudent) { toast.error('Select a student'); setLoading(false); return; }
        await client.put(`/admin/institutions/${inst.id}/reset-student-password`, { studentId: parseInt(selectedStudent), newPassword });
        toast.success('Student password reset successfully');
      } else {
        await client.put(`/admin/institutions/${inst.id}/reset-all-passwords`);
        toast.success('All student passwords reset to default (HX@XXXXXX)');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <KeyRound size={16} className="text-indigo-500" /> Reset Password
          </h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { key: 'admin',   label: '🏫 Admin' },
            { key: 'student', label: '👤 Student' },
            { key: 'all',     label: '👥 All Students' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 py-2.5 text-xs font-medium transition ${tab === t.key ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Admin tab */}
          {tab === 'admin' && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Reset login password for <strong>{inst.institutionName}</strong> admin account.</p>
              <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 6 characters" autoFocus
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          )}

          {/* Individual Student tab */}
          {tab === 'student' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Student</label>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Select student...</option>
                  {stuLoading
                    ? <option disabled>Loading...</option>
                    : students.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.careerId}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
          )}

          {/* All Students tab */}
          {tab === 'all' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-700 font-medium mb-1">⚠️ Reset All Student Passwords</p>
                <p className="text-xs text-amber-600">
                  Sabhi students ka password default pe reset ho jayega:<br />
                  <strong className="font-mono">HX@XXXXXX</strong> (Career ID ke last 6 digits)<br />
                  Example: HX-2026-000001 → <strong className="font-mono">HX@000001</strong>
                </p>
              </div>
              <p className="text-sm text-gray-500">Ye action <strong>{inst.institutionName}</strong> ke sabhi students pe apply hoga.</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleReset} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export function AdminInstitutions() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'all' | 'pending' | 'approved'>('all');
  const [search, setSearch]     = useState('');
  const [viewInst, setViewInst] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [resetModal, setResetModal]   = useState<any | null>(null);

  const load = () => {
    setLoading(true);
    adminInstitutionApi.getAll({ status: tab === 'all' ? undefined : tab })
      .then(r => { setInstitutions(r.data); setTotal(r.total); })
      .catch(() => toast.error('Failed to load institutions'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [tab]);

  const filtered = institutions.filter(i =>
    !search ||
    i.institutionName?.toLowerCase().includes(search.toLowerCase()) ||
    i.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openView = async (inst: any) => {
    setViewInst({ ...inst, _loading: true });
    setViewLoading(true);
    try { const res = await adminInstitutionApi.getOne(inst.id); setViewInst(res.data); }
    catch { setViewInst(inst); }
    finally { setViewLoading(false); }
  };

  const handleApprove = async (inst: any) => {
    try { await adminInstitutionApi.approve(inst.id); toast.success(`${inst.institutionName} approved`); load(); }
    catch { toast.error('Failed to approve'); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await adminInstitutionApi.reject(rejectModal.id, rejectReason);
      toast.success('Institution rejected'); setRejectModal(null); setRejectReason(''); load();
    } catch { toast.error('Failed to reject'); }
  };

  const handleDelete = async (inst: any) => {
    if (!confirm(`Delete "${inst.institutionName}"?`)) return;
    try { await adminInstitutionApi.delete(inst.id); toast.success('Deleted'); load(); setViewInst(null); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Institution Management</h1>
        <p className="text-sm text-gray-500">{total} institutions registered</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${tab === t ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institutions..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="px-4 py-3">Institution</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : filtered.length === 0
              ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No institutions found</td></tr>
              : filtered.map(inst => (
                <tr key={inst.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={15} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{inst.institutionName}</p>
                        <p className="text-xs text-gray-400">{inst.city}{inst.state ? `, ${inst.state}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inst.type || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{inst.user?.name}</p>
                    <p className="text-xs text-gray-400">{inst.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {inst.user?.isApproved
                      ? <span className="flex items-center gap-1 text-emerald-700 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded-full w-fit"><CheckCircle2 size={12} /> Approved</span>
                      : <span className="flex items-center gap-1 text-yellow-700 text-xs font-medium bg-yellow-50 px-2 py-0.5 rounded-full w-fit">Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(inst.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openView(inst)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="View"><Eye size={15} /></button>
                      <button onClick={() => setResetModal(inst)} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500" title="Reset Password"><KeyRound size={15} /></button>
                      {!inst.user?.isApproved && (
                        <button onClick={() => handleApprove(inst)} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Approve"><CheckCircle2 size={15} /></button>
                      )}
                      <button onClick={() => { setRejectModal(inst); setRejectReason(''); }} className="p-1.5 rounded hover:bg-orange-50 text-orange-500" title="Reject"><XCircle size={15} /></button>
                      <button onClick={() => handleDelete(inst)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Institution Details</h2>
              <button onClick={() => setViewInst(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            {viewLoading
              ? <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
              : (
                <div className="p-5 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Students',     value: viewInst.studentCount ?? 0, icon: Users,    color: 'bg-indigo-50 text-indigo-600' },
                      { label: 'Batches',      value: viewInst.batchCount ?? 0,   icon: Layers,   color: 'bg-violet-50 text-violet-600' },
                      { label: 'Courses',      value: viewInst.courseCount ?? 0,  icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
                      { label: 'Certificates', value: viewInst.certCount ?? 0,    icon: Award,    color: 'bg-emerald-50 text-emerald-600' },
                    ].map(s => (
                      <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                        <s.icon size={18} className="mx-auto mb-1" />
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-xs font-medium">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Per Batch Student Count */}
                  {(viewInst.batchesWithCount?.length ?? 0) > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Layers size={13} /> Batch-wise Students
                      </p>
                      <div className="space-y-2">
                        {viewInst.batchesWithCount.map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${b.status === 'Active' ? 'bg-green-500' : b.status === 'Completed' ? 'bg-gray-400' : 'bg-blue-400'}`} />
                              <span className="text-sm font-medium text-gray-800">{b.name}</span>
                              <span className="text-xs text-gray-400">{b.status}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold text-sm">
                              <Users size={13} />
                              {b.studentCount} students
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Details */}
                  <div className="space-y-2.5 text-sm">
                    {[
                      ['Institution Name', viewInst.institutionName],
                      ['Type',             viewInst.type],
                      ['Affiliated To',    viewInst.affiliatedTo],
                      ['City',             viewInst.city],
                      ['State',            viewInst.state],
                      ['Website',          viewInst.website],
                      ['Phone',            viewInst.phone],
                      ['Contact Name',     viewInst.contactName],
                      ['Contact Email',    viewInst.contactEmail],
                      ['Admin Name',       viewInst.user?.name],
                      ['Admin Email',      viewInst.user?.email],
                      ['Registered',       viewInst.createdAt ? new Date(viewInst.createdAt).toLocaleDateString('en-IN') : null],
                    ].map(([l, v]) => v && (
                      <div key={l as string} className="flex items-start justify-between gap-4">
                        <span className="text-gray-400 shrink-0">{l}</span>
                        <span className="text-gray-800 font-medium text-right">{v as string}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-gray-400">Status</span>
                      <span className={`font-semibold ${viewInst.user?.isApproved ? 'text-emerald-600' : 'text-yellow-600'}`}>
                        {viewInst.user?.isApproved ? '✓ Approved' : 'Pending Approval'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            <div className="px-5 pb-5 pt-4 border-t flex gap-2 flex-wrap justify-end">
              <button onClick={() => { setResetModal(viewInst); setViewInst(null); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100">
                <KeyRound size={14} /> Reset Password
              </button>
              {!viewInst.user?.isApproved && (
                <button onClick={() => { handleApprove(viewInst); setViewInst(null); }}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  Approve
                </button>
              )}
              <button onClick={() => { setRejectModal(viewInst); setViewInst(null); }}
                className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">Reject Institution</h2>
              <button onClick={() => setRejectModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600">Rejecting <strong>{rejectModal.institutionName}</strong>. Reason (optional):</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleReject} className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && <ResetPasswordModal inst={resetModal} onClose={() => setResetModal(null)} />}
    </div>
  );
}