// src/pages/student/StudentProfile.tsx
import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/student';
import { authApi } from '../../api/auth';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { Upload, Save, X, Plus, Loader2, FileText, CheckCircle, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { DOMAIN_OPTIONS } from '../../lib/domains';

const DEPARTMENT_OPTIONS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'MCA',
  'MBA',
  'Other',
];

export function StudentProfile() {
  const { user } = useAuthStore();
  const { data: rawProfile, loading, error, refetch } = useFetch(
    () => studentApi.getProfile()
  );

  const p = (rawProfile as any)?.data?.data || (rawProfile as any)?.data || rawProfile || {};

  const [form, setForm] = useState({
    cgpa: '', department: '', domain: '', year: '', skills: [] as string[], projects: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (p && Object.keys(p).length > 0) {
      setForm({
        cgpa: p.cgpa?.toString() || '',
        department: p.department || '',
        domain: p.domain || '',
        year: p.year?.toString() || '',
        skills: p.skills || [],
        projects: p.projects || [],
      });
    }
  }, [rawProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await studentApi.updateProfile({
        cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
        department: form.department || null,
        domain: form.domain || null,
        year: form.year ? parseInt(form.year) : null,
        skills: form.skills,
        projects: form.projects,
      });
      toast.success('Profile updated!');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setUploading(true);
    try {
      await studentApi.uploadResume(resumeFile);
      toast.success('Resume uploaded!');
      setResumeFile(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !form.skills.includes(newSkill.trim())) {
      setForm(p => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const passwordErrors = {
    currentPassword: passwordForm.currentPassword ? '' : 'Current password is required',
    newPassword: passwordForm.newPassword && passwordForm.newPassword.length < 8 ? 'Password must be at least 8 characters' : '',
    confirmPassword: passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword ? 'Passwords do not match' : '',
  };
  const canChangePassword =
    !!passwordForm.currentPassword &&
    passwordForm.newPassword.length >= 8 &&
    passwordForm.confirmPassword === passwordForm.newPassword &&
    !changingPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canChangePassword) return;

    setChangingPassword(true);
    try {
      await authApi.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Keep your profile updated to improve job matching</p>
      </div>

      {/* User card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-xl">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">{user?.name}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {p?.placementStatus === 'Placed' && (
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-semibold">
              <CheckCircle size={13} /> Placed at {p.placedCompany}
            </div>
          )}
        </div>
      </div>

      {/* Resume */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={16} /> Resume</h3>
        {p?.resumeUrl ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-green-700 font-medium">{p.resumeFilename}</span>
            </div>
            <a
              href={`${((import.meta as any).env.VITE_API_URL || '').replace('/api', '')}/${p.resumeUrl}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              View →
            </a>
          </div>
        ) : (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            No resume uploaded. Upload your resume to apply for jobs.
          </p>
        )}
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={e => setResumeFile(e.target.files?.[0] || null)}
            className="flex-1 text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:text-xs file:font-semibold hover:file:bg-blue-100 transition"
          />
          <button
            onClick={handleResumeUpload}
            disabled={!resumeFile || uploading}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload
          </button>
        </div>
      </div>

      {/* Academic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Academic Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">CGPA</label>
            <input
              type="number" step="0.01" min="0" max="10"
              value={form.cgpa}
              onChange={e => setForm(p => ({ ...p, cgpa: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. 8.5"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
            <select
              value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">Select department</option>
              {DEPARTMENT_OPTIONS.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year</label>
            <select
              value={form.year}
              onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">Select year</option>
              {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Learning Domain</label>
            <select
              value={form.domain}
              onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">Select domain</option>
              {DOMAIN_OPTIONS.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.skills.map(s => (
            <span key={s} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
              {s}
              <button onClick={() => setForm(p => ({ ...p, skills: p.skills.filter(sk => sk !== s) }))}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text" placeholder="Add a skill..."
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button onClick={addSkill} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition">
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Lock size={16} /> Change Password</h3>
        <form onSubmit={handleChangePassword} className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Enter current password"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                className={`w-full border ${passwordErrors.newPassword ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500`}
                placeholder="Minimum 8 characters"
              />
              {passwordErrors.newPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className={`w-full border ${passwordErrors.confirmPassword ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500`}
                placeholder="Re-enter new password"
              />
              {passwordErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>}
            </div>
          </div>
          <button
            type="submit"
            disabled={!canChangePassword}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition sm:w-fit"
          >
            {changingPassword ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            Change Password
          </button>
        </form>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save Profile
      </button>
    </div>
  );
}
