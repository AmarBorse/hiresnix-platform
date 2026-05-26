// src/pages/admin/AdminEnquiries.tsx
import React, { useState, useEffect } from 'react';
import { Download, Search, Mail, Phone, MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function downloadCSV(data: any[], filename: string) {
  if (!data.length) { toast.error('No enquiries to export'); return; }
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => {
    const val = row[k] ?? '';
    return `"${String(val).replace(/"/g, '""')}"`;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success('Downloaded!');
}

const INTEREST_COLORS: Record<string, string> = {
  'Internship':   'bg-blue-100 text-blue-700',
  'Job Portal':   'bg-purple-100 text-purple-700',
  'Both':         'bg-emerald-100 text-emerald-700',
  'Partnership':  'bg-amber-100 text-amber-700',
  'Other':        'bg-gray-100 text-gray-600',
};

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const load = () => {
    try {
      const raw = localStorage.getItem('hiresnix_enquiries') || '[]';
      setEnquiries(JSON.parse(raw).reverse());
    } catch { setEnquiries([]); }
  };

  useEffect(() => { load(); }, []);

  const filtered = enquiries.filter(e => {
    const q = search.toLowerCase();
    return (!search || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) ||
      e.message?.toLowerCase().includes(q)) && (!filter || e.interest === filter);
  });

  const handleDelete = (id: string) => {
    const updated = enquiries.filter(e => e.id !== id);
    localStorage.setItem('hiresnix_enquiries', JSON.stringify([...updated].reverse()));
    setEnquiries(updated);
    toast.success('Enquiry removed');
  };

  const handleMarkRead = (id: string) => {
    const updated = enquiries.map(e => e.id === id ? { ...e, read: true } : e);
    localStorage.setItem('hiresnix_enquiries', JSON.stringify([...updated].reverse()));
    setEnquiries(updated);
  };

  const handleDownload = () => {
    downloadCSV(filtered.map(e => ({
      Name: e.name, Email: e.email, Phone: e.phone || '',
      Interest: e.interest, Message: e.message,
      ReceivedOn: new Date(e.createdAt).toLocaleString(),
    })), `enquiries_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const unread = enquiries.filter(e => !e.read).length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            Enquiries
            {unread > 0 && <span className="text-sm font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{unread} new</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{enquiries.length} total from landing page form</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition">
            <RefreshCw size={15} />
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search name, email, message..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white">
          <option value="">All Interests</option>
          {Object.keys(INTEREST_COLORS).map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
          <MessageSquare size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-medium">
            {enquiries.length === 0 ? 'No enquiries yet. They will appear when someone fills the landing page form.' : 'No enquiries match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e: any) => (
            <div key={e.id} onClick={() => !e.read && handleMarkRead(e.id)}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition cursor-pointer hover:shadow-md ${!e.read ? 'border-emerald-200 border-l-4 border-l-emerald-500' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${!e.read ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                    {e.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{e.name}</p>
                      {!e.read && <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                      {e.interest && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${INTEREST_COLORS[e.interest] || 'bg-gray-100 text-gray-600'}`}>
                          {e.interest}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <a href={`mailto:${e.email}`} onClick={ev => ev.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <Mail size={11} /> {e.email}
                      </a>
                      {e.phone && (
                        <a href={`tel:${e.phone}`} onClick={ev => ev.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                          <Phone size={11} /> {e.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleDateString()}</p>
                  <button onClick={ev => { ev.stopPropagation(); handleDelete(e.id); }}
                    className="text-gray-300 hover:text-red-500 transition p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 ml-13 pl-0">
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{e.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
