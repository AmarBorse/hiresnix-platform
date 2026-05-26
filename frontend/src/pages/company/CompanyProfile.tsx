// src/pages/company/CompanyProfile.tsx
import React, { useState, useEffect } from 'react';
import { companyApi } from '../../api/company';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { Save, Loader2, Building2, Globe, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';

export function CompanyProfile() {
  const { data: profile, loading, error, refetch } = useFetch(
    () => companyApi.getProfile().then(r => ({ data: r.data, success: true }))
  );

  const [form, setForm] = useState({
    companyName: '', industry: '', website: '', description: '',
    headquarters: '', employeeCount: '', contactName: '', contactPhone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setForm({
        companyName: p.companyName || '',
        industry: p.industry || '',
        website: p.website || '',
        description: p.description || '',
        headquarters: p.headquarters || '',
        employeeCount: p.employeeCount?.toString() || '',
        contactName: p.contactName || '',
        contactPhone: p.contactPhone || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await companyApi.updateProfile({
        ...form,
        employeeCount: form.employeeCount ? parseInt(form.employeeCount) : null,
      });
      toast.success('Company profile updated!');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const p = profile as any;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Company Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Keep your company info up to date to attract top talent</p>
      </div>

      {/* Verification banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold ${
        p?.isVerified
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-yellow-50 border-yellow-200 text-yellow-700'
      }`}>
        {p?.isVerified
          ? <><CheckCircle size={16} /> Company Verified — your job postings are trusted by students</>
          : <><AlertCircle size={16} /> Pending Verification — an admin will verify your company shortly</>
        }
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><Building2 size={16} /> Company Information</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Company Name</label>
            <input
              type="text"
              value={form.companyName}
              onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              placeholder="Acme Corporation"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Industry</label>
            <input
              type="text"
              value={form.industry}
              onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              placeholder="Technology, Finance, etc."
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              <Globe size={11} className="inline mr-1" />Website
            </label>
            <input
              type="url"
              value={form.website}
              onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              placeholder="https://yourcompany.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              <MapPin size={11} className="inline mr-1" />Headquarters
            </label>
            <input
              type="text"
              value={form.headquarters}
              onChange={e => setForm(p => ({ ...p, headquarters: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              placeholder="Bangalore, India"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            <Users size={11} className="inline mr-1" />Employee Count
          </label>
          <select
            value={form.employeeCount}
            onChange={e => setForm(p => ({ ...p, employeeCount: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 bg-white"
          >
            <option value="">Select range</option>
            {['1-10','11-50','51-200','201-500','501-1000','1000+'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">About the Company</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none"
            placeholder="Tell candidates about your company culture, mission, and what makes you unique..."
          />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Recruiter Contact</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Name</label>
            <input
              type="text"
              value={form.contactName}
              onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              placeholder="HR Manager name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save Profile
      </button>
    </div>
  );
}
