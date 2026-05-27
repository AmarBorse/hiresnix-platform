import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { PageLoader } from '../components/common/LoadingState';
import { CheckCircle, XCircle, ArrowLeft, Search } from 'lucide-react';

export function VerifyCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const verify = async () => {
      try {
        const res = await client.get(`/iplatform/verify/${id}`); 
        setCertData(res.data.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [id]);

  // Show manual entry form if no ID is present in the URL
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060910' }}>
        <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-8 relative text-center border border-white/10">
          <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-blue-500 to-indigo-500" />
          <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition"><ArrowLeft size={20} /></Link>
          <img src="/hiresnix-logo.png" alt="Hiresnix" className="h-10 mx-auto mb-8" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Verify Certificate</h2>
          <p className="text-gray-500 text-sm mb-6">Enter the Certificate ID provided by the candidate to verify its authenticity.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (inputId.trim()) navigate(`/verify/${inputId.trim()}`); }}>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="e.g. CERT-12345" value={inputId} onChange={e => setInputId(e.target.value)} className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={!inputId.trim()} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">Verify Now</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060910' }}>
      <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-8 relative text-center">
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-blue-500 to-indigo-500" />
        
        <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft size={20} />
        </Link>

        <img src="/hiresnix-logo.png" alt="Hiresnix" className="h-10 mx-auto mb-8" />

        {error || !certData ? (
          <div className="py-8">
            <XCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Invalid Certificate</h2>
            <p className="text-gray-500 text-sm">We couldn't find a certificate matching ID: <strong className="text-gray-800">{id}</strong>. Please check the ID and try again.</p>
          </div>
        ) : (
          <div className="py-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Verified Certificate</h2>
            <p className="text-green-600 font-bold text-[10px] mb-6 uppercase tracking-wider">Authentic Record Found</p>
            
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left space-y-4">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Student Name</p>
                <p className="text-lg font-bold text-gray-900">{certData.studentName}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Program Completed</p>
                <p className="text-sm font-semibold text-blue-600">{certData.domainName || 'Internship Program'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Certificate ID</p>
                <p className="text-xs font-mono font-semibold text-gray-800">{certData.certificateNo || id}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Issue Date</p>
                <p className="text-xs font-semibold text-gray-800">{new Date(certData.issuedAt || certData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}