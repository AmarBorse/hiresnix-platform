// src/components/layout/CompanyLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Briefcase, Users, User, Menu, X, LogOut, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NAV = [
  { to: '/company/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/company/jobs',       icon: Briefcase,       label: 'Jobs' },
  { to: '/company/applicants', icon: Users,           label: 'Applicants' },
  { to: '/company/profile',    icon: User,            label: 'Profile' },
];

export function CompanyLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex font-sans">
      {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1C2E] flex flex-col transform transition-transform duration-200
        md:static md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{height:36,objectFit:"contain",filter:"drop-shadow(0 0 8px rgba(139,92,246,0.5))"}} />
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold truncate max-w-[140px]">{user?.name}</p>
              <p className="text-gray-500 text-[10px] uppercase font-medium tracking-wider">Company</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <CompanyNavItem key={to} to={to} icon={Icon} label={label} onClick={() => setOpen(false)} />
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={() => { logout(); navigate('/auth'); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-red-400 rounded-lg transition text-sm"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{height:30,objectFit:"contain"}} />
          </div>
          <button onClick={() => setOpen(true)}><Menu size={20} className="text-gray-600" /></button>
        </header>

        <header className="hidden md:flex h-14 items-center justify-between px-8 bg-white border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Company Portal</span>
          <span className="text-sm text-gray-400">{user?.email}</span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function CompanyNavItem({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) {
  const location = useLocation();
  const active = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}
