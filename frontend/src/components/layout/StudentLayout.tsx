// src/components/layout/StudentLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Briefcase, BookOpen, Award, FileText,
  User, Menu, X, LogOut, Flame, BotMessageSquare, Send
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NAV = [
  { to: '/student/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/internships',  icon: Briefcase,       label: 'Internships' },
  { to: '/student/jobs',         icon: Send,            label: 'Jobs' },
  { to: '/student/applications', icon: FileText,        label: 'Applications' },
  { to: '/student/resources',    icon: BookOpen,        label: 'Resources' },
  { to: '/student/mock-interview', icon: BotMessageSquare, label: 'Mock Interview' },
  { to: '/student/certificates', icon: Award,           label: 'Certificates' },
  { to: '/student/profile',      icon: User,            label: 'Profile' },
];

export function StudentLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1C1E] flex flex-col transform transition-transform duration-200
        md:static md:translate-x-0 md:flex
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{height:38,objectFit:"contain",filter:"drop-shadow(0 0 8px rgba(59,130,246,0.5))"}} />
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold truncate max-w-[140px]">{user?.name}</p>
              <p className="text-gray-500 text-[10px] uppercase font-medium tracking-wider">Student</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} onClick={() => setOpen(false)} />
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-red-400 rounded-lg transition text-sm"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black text-xs">H</div>
            <span className="font-bold text-gray-900">Hirenix</span>
          </div>
          <button onClick={() => setOpen(true)}><Menu size={20} className="text-gray-600" /></button>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex h-14 items-center justify-between px-8 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">Student Portal</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{user?.email}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) {
  const location = useLocation();
  const active = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}
