// src/pages/admin/AdminEnquiries.tsx
import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { CheckCircle, Trash2, Mail, Loader2, Phone } from 'lucide-react';
import client from '../../api/client';

export function AdminEnquiries() {
  const { data: result, loading, error, refetch } = useFetch(
    () => client.get('/admin/enquiries').then(r => r.data)
  );

  const [actioning, setActioning] = useState<number | null>(null);

  // Safely extract data array
  const enquiries: any[] = Array.isArray(result) ? result : (result as any)?.data || [];

  const handleMarkRead = async (id: number) => {
    setActioning(id);
    try {
      await client.put(`/admin/enquiries/${id}/read`);
      toast.success('Marked as read');
      refetch();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update');
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    setActioning(id);
    try {
      await client.delete(`/admin/enquiries/${id}`);
      toast.success('Enquiry deleted');
      refetch();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    } finally {
      setActioning(null);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Platform Enquiries</h1>
        <p className="text-sm text-gray-500 mt-1">{enquiries.length} total enquiries</p>
      </div>

      {enquiries.length === 0 ? <EmptyState title="No enquiries yet" description="When users submit the contact form, they will appear here." /> : (
        <div className="space-y-3">
          {enquiries.map((enq: any) => (
            <div key={enq.id} className={`bg-white rounded-2xl border ${enq.isRead ? 'border-gray-100' : 'border-blue-200 shadow-md'} p-5 transition`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{enq.name}</h3>
                    {!enq.isRead && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>}
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md font-medium">{enq.interest}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Mail size={14} /> <a href={`mailto:${enq.email}`} className="hover:text-blue-600">{enq.email}</a></span>
                    {enq.phone && <span className="flex items-center gap-1"><Phone size={14} /> <a href={`tel:${enq.phone}`} className="hover:text-blue-600">{enq.phone}</a></span>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                    {enq.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-3">
                    Received on {new Date(enq.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {!enq.isRead && (
                    <button onClick={() => handleMarkRead(enq.id)} disabled={actioning === enq.id} className="flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition disabled:opacity-50">
                      {actioning === enq.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Mark Read
                    </button>
                  )}
                  <button onClick={() => handleDelete(enq.id)} disabled={actioning === enq.id} className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-lg transition disabled:opacity-50">
                    {actioning === enq.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}