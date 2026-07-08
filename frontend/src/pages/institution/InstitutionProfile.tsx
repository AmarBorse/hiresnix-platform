// src/pages/institution/InstitutionProfile.tsx
import React, { useEffect, useState } from 'react';
import { Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';

export function InstitutionProfile() {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    institutionApi.getProfile().then(r => setForm(r.data)).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await institutionApi.updateProfile(form); toast.success('Profile updated'); }
    catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const Field = ({ label, k, type = 'text', span = 1 }: any) => (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={form[k] || ''} onChange={f(k)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Institution Profile</h1>
        <p className="text-sm text-gray-500">Manage your institution information</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Building2 size={28} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{form.institutionName || '—'}</h2>
            <p className="text-sm text-gray-400">{form.city && form.state ? `${form.city}, ${form.state}` : 'Location not set'}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${form.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {form.isVerified ? '✓ Verified Partner' : 'Pending Verification'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <Field label="Institution Name *" k="institutionName" span={2} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select value={form.type || ''} onChange={f('type')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Select type</option>
                {['University','College','Institute','Training Center','School','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Affiliated To" k="affiliatedTo" />
            <Field label="Website" k="website" type="url" />
            <Field label="Phone" k="phone" />
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <textarea value={form.address || ''} onChange={f('address')} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <Field label="City" k="city" />
            <Field label="State" k="state" />
            <Field label="Pincode" k="pincode" />
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Person</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Field label="Contact Name" k="contactName" />
            <Field label="Contact Email" k="contactEmail" type="email" />
            <Field label="Contact Phone" k="contactPhone" />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description || ''} onChange={f('description')} rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
