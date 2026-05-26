// src/pages/admin/AdminCompanies.tsx
import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { CheckCircle, Globe, Building2, Loader2, Search, Download, ExternalLink } from 'lucide-react';

function downloadCSV(data: any[], filename: string) {
  if (!data.length) { toast.error('No data to export'); return; }
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => {
    const val = row[k] ?? '';
    return `"${String(typeof val === 'object' ? JSON.stringify(val) : val).replace(/"/g, '""')}"`;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success('Downloaded!');
}

export function AdminCompanies() {
  const [verifying, setVerifying] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'verified'|'pending'>('all');

  const { data: result, loading, error, refetch } = useFetch(() => adminApi.getAllCompanies());
  const companies: any[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    return (
      (!search || c.companyName?.toLowerCase().includes(q) || c.user?.email?.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q)) &&
      (filter === 'all' || (filter === 'verified' && c.isVerified) || (filter === 'pending' && !c.isVerified))
    );
  });

  const handleVerify = async (id: number) => {
    setVerifying(id);
    try { await adminApi.verifyCompany(id); toast.success('Company verified!'); refetch(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed to verify'); }
    finally { setVerifying(null); }
  };

  const handleDownload = () => {
    const rows = filtered.map(c => ({
      CompanyName: c.companyName || '', Industry: c.industry || '',
      Email: c.user?.email || '', ContactName: c.contactName || '',
      ContactPhone: c.contactPhone || '', Headquarters: c.headquarters || '',
      EmployeeCount: c.employeeCount || '', Website: c.website || '',
      Verified: c.isVerified ? 'Yes' : 'No',
    }));
    downloadCSV(rows, `companies_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;

  const pendingCount = companies.filter(c => !c.isVerified).length;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-1">{companies.length} registered · {pendingCount} pending verification</p>
        </div>
        <button onClick={handleDownload}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search company, email, industry..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
        </div>
        <div className="flex gap-2">
          {(['all','verified','pending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl border transition capitalize ${filter === f ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'}`}>
              {f} {f === 'pending' && pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1">{pendingCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState title="No companies found" description="Try adjusting filters" /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c: any) => (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition ${!c.isVerified ? 'border-l-4 border-l-amber-400' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    {c.logo ? <img src={c.logo} alt="" className="w-full h-full rounded-xl object-cover" /> : <Building2 size={20} className="text-violet-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{c.companyName || c.user?.name}</h3>
                    <p className="text-xs text-gray-500">{c.industry || 'Industry not set'}</p>
                    <p className="text-xs text-gray-400">{c.user?.email}</p>
                  </div>
                </div>
                <div>
                  {c.isVerified ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle size={11} /> Verified
                    </span>
                  ) : (
                    <button onClick={() => handleVerify(c.id)} disabled={verifying === c.id}
                      className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition">
                      {verifying === c.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Verify
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {c.headquarters && <span className="flex items-center gap-1">📍 {c.headquarters}</span>}
                {c.employeeCount && <span>👥 {c.employeeCount}</span>}
                {c.contactPhone && <span>📞 {c.contactPhone}</span>}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:underline">
                    <Globe size={10} /> Website <ExternalLink size={9} />
                  </a>
                )}
              </div>
              {c.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.description}</p>}
              {!c.isVerified && <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ Pending verification — click Verify to approve</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
