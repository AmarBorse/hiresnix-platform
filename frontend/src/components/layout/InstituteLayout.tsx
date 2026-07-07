// src/components/layout/InstituteLayout.tsx
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Users, CalendarDays, BookOpen, ClipboardCheck,
  FileText, Award, Menu, X, LogOut, GraduationCap, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NAV = [
  { to: '/institute/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/institute/students',     icon: Users,           label: 'Student Management' },
  { to: '/institute/batches',      icon: CalendarDays,    label: 'Batch Management' },
  { to: '/institute/courses',      icon: BookOpen,        label: 'Course Management' },
  { to: '/institute/assessments',  icon: ClipboardCheck,  label: 'Assessments' },
  { to: '/institute/assignments',  icon: FileText,        label: 'Assignments' },
  { to: '/institute/certificates', icon: Award,           label: 'Certificate Management' },
];

function NavItem({ to, icon: Icon, label, onClick }: any) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link to={to} onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
        active ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}>
      <div className="flex items-center gap-2.5">
        <Icon size={16} className={active ? 'text-emerald-400' : ''} />
        {label}
      </div>
      {active && <ChevronRight size={12} className="text-emerald-400" />}
    </Link>
  );
}

export function InstituteLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans">
      {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col transform transition-transform duration-200
        md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.4))' }} />
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <div className="px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <GraduationCap size={15} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user?.name}</p>
              <p className="text-emerald-500 text-[10px] uppercase font-bold tracking-wider">Institute Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />)}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <button onClick={() => { logout(); navigate('/auth'); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-red-400 rounded-lg transition text-sm">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 28, objectFit: 'contain' }} />
          </div>
          <button onClick={() => setOpen(true)}><Menu size={20} className="text-gray-600" /></button>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
