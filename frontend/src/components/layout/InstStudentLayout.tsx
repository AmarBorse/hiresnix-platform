// src/components/layout/InstStudentLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Award, User, Menu, X, LogOut, GraduationCap, BookOpen, Layers } from 'lucide-react';
import { useInstStudentStore } from '../../store/useInstStudentStore';

const NAV = [
  { to: '/inst-student/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inst-student/profile',      icon: User,            label: 'My Profile' },
  { to: '/inst-student/courses',      icon: BookOpen,        label: 'My Courses' },
  { to: '/inst-student/batches',      icon: Layers,          label: 'My Batch' },
  { to: '/inst-student/certificates', icon: Award,           label: 'My Certificates' },
];

function NavItem({ to, icon: Icon, label, onClick }: any) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link to={to} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}>
      <Icon size={17} className={active ? 'text-indigo-400' : ''} />
      {label}
    </Link>
  );
}

export function InstStudentLayout() {
  const [open, setOpen] = useState(false);
  const { student, logout } = useInstStudentStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex font-sans">
      {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col transform transition-transform duration-200 md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height:36, objectFit:'contain', filter:'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />
          <button className="md:hidden text-gray-400" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <div className="px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <GraduationCap size={15} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold truncate max-w-[140px]">{student?.name}</p>
              <p className="text-indigo-400 text-[10px] font-mono tracking-wider">{student?.careerId}</p>
            </div>
          </div>
          <p className="text-gray-600 text-[10px] mt-1.5 truncate">{student?.institutionName}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(n => <NavItem key={n.to} {...n} onClick={() => setOpen(false)} />)}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <button onClick={() => { logout(); navigate('/inst-login'); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-red-400 rounded-lg transition text-sm">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height:30, objectFit:'contain' }} />
          <button onClick={() => setOpen(true)}><Menu size={20} className="text-gray-600" /></button>
        </header>
        <header className="hidden md:flex h-14 items-center justify-between px-8 bg-white border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Student Portal</span>
          <span className="text-sm font-mono text-indigo-600">{student?.careerId}</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
