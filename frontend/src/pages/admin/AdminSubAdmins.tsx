// src/pages/admin/AdminSubAdmins.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, ToggleLeft, ToggleRight, KeyRound, ShieldHalf, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const API = (import.meta as any).env.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('hx_admin_token') || localStorage.getItem('hirenix_token')}` }
});

export function AdminSubAdmins() {
  const [subAdmins, setSubAdmins]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [resetId, setResetId]         = useState<number | null>(null);
  const [newPass, setNewPass]         = useState('');
  const [form, setForm]               = useState({ name: '', email: '', password: '' });
  const [creating, setCreating]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/admin/sub-admins`, authHeaders());
      setSubAdmins(r.data.data || []);
    } catch { toast.error('Failed to load sub-admins'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    setCreating(true);
    try {
      await axios.post(`${API}/admin/sub-admins`, form, authHeaders());
      toast.success('Sub-admin created!');
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create');
    }
    setCreating(false);
  };

  const toggle = async (id: number) => {
    try {
      const r = await axios.put(`${API}/admin/sub-admins/${id}/toggle`, {}, authHeaders());
      toast.success(r.data.message);
      load();
    } catch { toast.error('Failed to toggle'); }
  };

  const resetPassword = async (id: number) => {
    if (!newPass || newPass.length < 6) return toast.error('Min 6 characters');
    try {
      await axios.put(`${API}/admin/sub-admins/${id}/reset-password`, { newPassword: newPass }, authHeaders());
      toast.success('Password reset!');
      setResetId(null);
      setNewPass('');
    } catch { toast.error('Failed to reset'); }
  };

  const deleteSubAdmin = async (id: number, name: string) => {
    if (!confirm(`Delete sub-admin "${name}"?`)) return;
    try {
      await axios.delete(`${API}/admin/sub-admins/${id}`, authHeaders());
      toast.success('Sub-admin deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldHalf size={22} style={{ color: '#A78BFA' }} />
            Sub-Admin Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage sub-admin accounts with limited access</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
          <UserPlus size={15} />
          {showForm ? 'Cancel' : 'Add Sub-Admin'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="p-5 rounded-2xl border space-y-4"
          style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.2)' }}>
          <h3 className="font-bold text-white text-sm">New Sub-Admin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-semibold uppercase tracking-wide">Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Employee Name"
                className="w-full px-3 py-2 rounded-xl text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-semibold uppercase tracking-wide">Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="employee@hiresnix.co.in" type="email"
                className="w-full px-3 py-2 rounded-xl text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-semibold uppercase tracking-wide">Password</label>
              <div className="relative">
                <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters" type={showPass ? 'text' : 'password'}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white pr-9"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={creating}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
              {creating ? 'Creating...' : 'Create Sub-Admin'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              Cancel
            </button>
          </div>
          <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <p className="text-purple-400 font-bold mb-1">🔒 Sub-Admin Access:</p>
            <p className="text-gray-400">✅ Dashboard, Students, Jobs, Applications, Internships, Institutions, Companies, Certificates, Enquiries, Resources, Hiresnix Intern</p>
            <p className="text-red-400 mt-1">❌ Analytics, Settings, Documents, Clients, Import Tool, Logic Builder — NOT accessible</p>
          </div>
        </div>
      )}

      {/* Sub-admins list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subAdmins.length === 0 ? (
        <div className="text-center py-16">
          <ShieldHalf size={40} className="mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500 font-semibold">No sub-admins yet</p>
          <p className="text-gray-600 text-sm mt-1">Click "Add Sub-Admin" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subAdmins.map(sa => (
            <div key={sa.id} className="p-4 rounded-2xl border flex items-center gap-4"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: sa.isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)' }}>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                style={{ background: sa.isActive ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(255,255,255,0.08)' }}>
                {sa.name?.charAt(0)?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm">{sa.name}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: sa.isActive ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)', color: sa.isActive ? '#A78BFA' : '#475569' }}>
                    {sa.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{sa.email}</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  Created: {new Date(sa.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Reset Password inline */}
              {resetId === sa.id && (
                <div className="flex items-center gap-2">
                  <input value={newPass} onChange={e => setNewPass(e.target.value)}
                    placeholder="New password" type="password"
                    className="px-3 py-1.5 rounded-lg text-sm text-white w-36"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
                  <button onClick={() => resetPassword(sa.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: '#059669' }}>Save</button>
                  <button onClick={() => { setResetId(null); setNewPass(''); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>Cancel</button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle active */}
                <button onClick={() => toggle(sa.id)}
                  title={sa.isActive ? 'Disable' : 'Enable'}
                  className="p-2 rounded-lg transition hover:bg-white/10">
                  {sa.isActive
                    ? <ToggleRight size={20} style={{ color: '#A78BFA' }} />
                    : <ToggleLeft size={20} className="text-gray-500" />}
                </button>

                {/* Reset password */}
                <button onClick={() => { setResetId(resetId === sa.id ? null : sa.id); setNewPass(''); }}
                  title="Reset Password"
                  className="p-2 rounded-lg transition hover:bg-white/10">
                  <KeyRound size={16} className="text-yellow-500" />
                </button>

                {/* Delete */}
                <button onClick={() => deleteSubAdmin(sa.id, sa.name)}
                  title="Delete"
                  className="p-2 rounded-lg transition hover:bg-red-500/10">
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="p-4 rounded-xl text-sm"
        style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <p className="text-purple-400 font-bold mb-2">ℹ️ Sub-Admin Portal</p>
        <p className="text-gray-500 text-xs">Sub-admins login at <span className="text-purple-400 font-medium">hiresnix.co.in/auth</span> with their email & password. They will be redirected to <span className="text-purple-400 font-medium">hiresnix.co.in/sub-admin/dashboard</span> automatically.</p>
      </div>
    </div>
  );
}
