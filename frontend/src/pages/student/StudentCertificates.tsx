// src/pages/student/StudentCertificates.tsx
import React from 'react';
import client from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { Certificate } from '../../types';
import { Award, CheckCircle, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function StudentCertificates() {
  const { user } = useAuthStore();
  const { data: result, loading, error, refetch } = useFetch(
    () => client.get('/iplatform/my-certificates')
  );

  const rawData: any[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  // Map the data to ensure it handles both standard Certificates and nested Internship Enrollments
  const certs: Certificate[] = rawData.map((item: any) => {
    if (item.certificate) {
      return {
        id: item.id,
        certificateId: item.certificate.certificateNo || item.certificate.certificateId || `CERT-${item.id}`,
        internshipTitle: item.domain?.name ? `${item.domain.name} Internship` : 'Internship Program',
        domain: item.domain?.name || item.domainName || 'Technology',
        issuedAt: item.certificate.issuedAt || item.completedAt || item.createdAt || new Date().toISOString(),
        studentName: user?.name || '',
        isValid: true
      } as unknown as Certificate; // Force cast to avoid strict Type mismatch errors
    }
    return item as unknown as Certificate;
  });

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">My Certificates</h1>
        <p className="text-sm text-gray-500 mt-1">Certificates earned by completing internship programs</p>
      </div>

      {certs.length === 0 ? (
        <EmptyState title="No certificates yet" description="Complete internship programs to earn verifiable certificates" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certs.map(cert => (
            <div key={cert.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <Award size={128} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Award size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Certificate of Completion</p>
                    <p className="text-[10px] text-gray-500">{cert.certificateId}</p>
                  </div>
                </div>

                <h3 className="font-black text-gray-900 text-lg leading-tight">{cert.internshipTitle}</h3>
                <p className="text-sm text-gray-600 font-medium mt-1">{user?.name}</p>
                <p className="text-xs text-blue-600 mt-0.5">{cert.domain}</p>

                <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                  <Calendar size={12} />
                  Issued {new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                    <CheckCircle size={13} />
                    Verified
                  </div>
                  <a
                    href={`/verify/${cert.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    View verification →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
