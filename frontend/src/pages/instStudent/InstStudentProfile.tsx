// src/pages/instStudent/InstStudentProfile.tsx
import React, { useEffect, useState } from 'react';
import { GraduationCap, Key, Eye, EyeOff } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { toast } from 'sonner';

export function InstStudentProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    instStudentApi.getMe().then(r => setProfile(r.data)).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPwd !== pwdForm.confirm) { toast.error('New passwords do not match'); return; }
    if (pwdForm.newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await instStudentApi.changePassword(pwdForm.current, pwdForm.newPwd);
      toast.success('Password changed successfully!');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-gray-900">My Profile</h1>

      {/* Career ID Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-5 text-white flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <GraduationCap size={24} />
        </div>
        <div>
          <p className="text-indigo-200 text-xs uppercase tracking-wider">Hiresnix Career ID</p>
          <p className="text-2xl font-mono font-bold">{profile?.careerId}</p>
          {profile?.isInternshipEligible && (
            <span className="text-xs bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full mt-1 inline-block">
              ✓ Internship Eligible
            </span>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Full Name',    profile?.name],
            ['Email',        profile?.email],
            ['Mobile',       profile?.mobile],
            ['Gender',       profile?.gender],
            ['Date of Birth',profile?.dob],
            ['Department',   profile?.department],
            ['Roll Number',  profile?.rollNumber],
            ['Year',         profile?.year ? `Year ${profile.year}` : null],
          ].map(([l, v]) => v && (
            <div key={l as string}>
              <p className="text-xs text-gray-400 mb-0.5">{l}</p>
              <p className="text-sm font-medium text-gray-800">{v as string}</p>
            </div>
          ))}
        </div>

        {(profile?.skills?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((sk: string) => (
                <span key={sk} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">{sk}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Institution Info */}
      {profile?.institution && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3">My Institution</h2>
          <p className="text-gray-800 font-medium">{profile.institution.institutionName}</p>
          {profile.institution.city && <p className="text-sm text-gray-400">{profile.institution.city}, {profile.institution.state}</p>}
          {profile.institution.isPartner && (
            <span className="mt-2 inline-block text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              ✓ Hiresnix Partner Institution
            </span>
          )}
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Key size={16} className="text-indigo-500" /> Change Password
        </h2>
        <form onSubmit={handleChangePwd} className="space-y-3">
          {[
            { label: 'Current Password', key: 'current' },
            { label: 'New Password',     key: 'newPwd' },
            { label: 'Confirm New',      key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={(pwdForm as any)[key]}
                  onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-10"
                />
                {key === 'current' && (
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
