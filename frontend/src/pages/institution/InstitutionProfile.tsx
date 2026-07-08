// src/pages/institution/InstitutionProfile.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Save, Building2, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import client from '../../api/client';

// ── Profile Form ──────────────────────────────────────────────────
function ProfileForm({ initial }: { initial: any }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: any = {};
    fd.forEach((v, k) => { data[k] = v; });
    setSaving(true);
    try {
      await institutionApi.updateProfile(data);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Institution Name *</label>
          <input name="institutionName" defaultValue={initial.institutionName || ''} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select name="type" defaultValue={initial.type || ''}
            className={inp}>
            <option value="">Select type</option>
            {['University','College','Institute','Training Center','School','Other'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Affiliated To</label>
          <input name="affiliatedTo" defaultValue={initial.affiliatedTo || ''} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
          <input name="website" type="url" defaultValue={initial.website || ''} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input name="phone" defaultValue={initial.phone || ''} className={inp} />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
          <textarea name="address" defaultValue={initial.address || ''} rows={2} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <input name="city" defaultValue={initial.city || ''} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
          <input name="state" defaultValue={initial.state || ''} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
          <input name="pincode" defaultValue={initial.pincode || ''} className={inp} />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Person</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
          <input name="contactName" defaultValue={initial.contactName || ''} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
          <input name="contactEmail" type="email" defaultValue={initial.contactEmail || ''} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
          <input name="contactPhone" defaultValue={initial.contactPhone || ''} className={inp} />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea name="description" defaultValue={initial.description || ''} rows={3} className={inp} />
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
        <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

// ── Password Form ─────────────────────────────────────────────────
function PasswordForm() {
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const currentPassword = fd.get('currentPassword') as string;
    const newPassword     = fd.get('newPassword') as string;
    const confirm         = fd.get('confirm') as string;
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    if (newPassword !== confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await client.put('/auth/updatepassword', { currentPassword, newPassword });
      toast.success('Password updated!');
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-10";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      {[
        { label: 'Current Password', name: 'currentPassword', showToggle: true },
        { label: 'New Password',     name: 'newPassword',     showToggle: false },
        { label: 'Confirm New',      name: 'confirm',         showToggle: false },
      ].map(({ label, name, showToggle }) => (
        <div key={name}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <div className="relative">
            <input name={name} type={showPwd ? 'text' : 'password'} placeholder="••••••••" className={inp} />
            {showToggle && (
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
        <Key size={14} /> {saving ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export function InstitutionProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    institutionApi.getProfile()
      .then(r => setProfile(r.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Institution Profile</h1>
        <p className="text-sm text-gray-500">Manage your institution information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Building2 size={28} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{profile?.institutionName || '—'}</h2>
            <p className="text-sm text-gray-400">
              {profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : 'Location not set'}
            </p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${profile?.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {profile?.isVerified ? '✓ Verified Partner' : 'Pending Verification'}
            </span>
          </div>
        </div>

        {/* Use uncontrolled form with defaultValue to avoid re-render focus issues */}
        {profile && <ProfileForm key={profile.id} initial={profile} />}
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Key size={16} className="text-indigo-500" /> Change Password
        </h2>
        <PasswordForm />
      </div>
    </div>
  );
}