import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { COMPANY } from '../../lib/companyInfo';

export function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060910] text-slate-100">
      <header className="border-b border-white/10 bg-[#060910]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/hiresnix-logo.png" alt="Hiresnix" className="h-10 w-auto drop-shadow-[0_0_12px_rgba(59,130,246,0.45)]" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-blue-400/50 hover:text-white">
            <ArrowLeft size={16} />
            Home
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/10 bg-[#060910] px-5 py-8">
        <div className="mx-auto max-w-6xl text-sm text-slate-500">
          <p className="font-semibold text-slate-300">© 2026 Hiresnix</p>
          <p className="mt-2">A Brand Operated by {COMPANY.legalName}</p>
          <p>CIN: {COMPANY.cin}</p>
          <p>All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
