// src/pages/admin/AdminCertificates.tsx
import React from 'react';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { Award, CheckCircle } from 'lucide-react';

export function AdminCertificates() {
  const { data: result, loading, error, refetch } = useFetch(
    () => adminApi.getAllCertificates()
  );
  const certs = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Certificates</h1>
        <p className="text-sm text-gray-500 mt-1">{certs.length} issued certificates</p>
      </div>

      {certs.length === 0 ? <EmptyState title="No certificates issued yet" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Certificate ID', 'Student', 'Internship', 'Domain', 'Issued', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certs.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{c.certificateId}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.studentName}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.internshipTitle}</td>
                  <td className="px-4 py-3 text-gray-600">{c.domain}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.issuedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-bold w-fit ${c.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle size={12} /> {c.isValid ? 'Valid' : 'Revoked'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
