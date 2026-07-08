// src/pages/admin/AdminInstitutions.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Eye, Trash2, Search, GraduationCap, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminInstitutionApi } from '../../api/institution';

const STATUS_TABS = ['all', 'pending', 'approved'] as const;

export function AdminInstitutions() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [search, setSearch] = useState('');
  const [viewInst, setViewInst] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    adminInstitutionApi.getAll({ status: tab === 'all' ? undefined : tab })
      .then(r => { setInstitutions(r.data); setTotal(r.total); })
      .catch(() => toast.error('Failed to load institutions'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [tab]);

  const filtered = institutions.filter(i =>
    !search || i.institutionName.toLowerCase().includes(search.toLowerCase()) || i.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async (inst: any) => {
    try { await adminInstitutionApi.approve(inst.id); toast.success(`${inst.institutionName} approved`); load(); }
    catch { toast.error('Failed to approve'); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try { await adminInstitutionApi.reject(rejectModal.id, rejectReason); toast.success('Institution rejected'); setRejectModal(null); setRejectReason(''); load(); }
    catch { toast.error('Failed to reject'); }
  };

  const handleDelete = async (inst: any) => {
    if (!confirm(`Delete "${inst.institutionName}"? This cannot be undone.`)) return;
    try { await adminInstitutionApi.delete(inst.id); toast.success('Institution deleted'); load(); }
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
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No institutions found</td></tr>
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
                    <button onClick={() => setViewInst(inst)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="View"><Eye size={15} /></button>
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
            <div className="p-5 space-y-3 text-sm">
              {[
                ['Institution Name', viewInst.institutionName],
                ['Type', viewInst.type],
                ['Affiliated To', viewInst.affiliatedTo],
                ['City', viewInst.city],
                ['State', viewInst.state],
                ['Pincode', viewInst.pincode],
                ['Website', viewInst.website],
                ['Phone', viewInst.phone],
                ['Contact Name', viewInst.contactName],
                ['Contact Email', viewInst.contactEmail],
                ['Contact Phone', viewInst.contactPhone],
                ['Admin Name', viewInst.user?.name],
                ['Admin Email', viewInst.user?.email],
                ['Registered', new Date(viewInst.createdAt).toLocaleDateString('en-IN')],
              ].map(([l, v]) => v && (
                <div key={l as string} className="flex items-start justify-between gap-4">
                  <span className="text-gray-500 shrink-0">{l}</span>
                  <span className="text-gray-800 font-medium text-right">{v as string}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-gray-500">Status</span>
                <span className={`font-semibold ${viewInst.user?.isApproved ? 'text-emerald-600' : 'text-yellow-600'}`}>
                  {viewInst.user?.isApproved ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
              {viewInst.rejectionReason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600"><strong>Rejection reason:</strong> {viewInst.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-3 justify-end">
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
              <p className="text-sm text-gray-600">Rejecting <strong>{rejectModal.institutionName}</strong>. Provide a reason (optional):</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Reason for rejection..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleReject} className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
