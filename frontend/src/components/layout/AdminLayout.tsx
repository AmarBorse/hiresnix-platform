// src/components/layout/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Briefcase, FileText, GraduationCap, Building2,
  BookOpen, Award, BarChart3, Settings, Users, Menu, X, LogOut,
  ShieldCheck, MessageSquare, Download, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NAV = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard',     badge: null },
  { to: '/admin/iplatform',    icon: GraduationCap,   label: 'Hiresnix Intern', badge: 'NEW' },
  { to: '/admin/jobs',         icon: Briefcase,       label: 'Jobs',          badge: null },
  { to: '/admin/applications', icon: FileText,        label: 'Applications',  badge: null },
  { to: '/admin/internships',  icon: BookOpen,        label: 'Programs',      badge: null },
  { to: '/admin/students',     icon: Users,           label: 'Students',      badge: null },
  { to: '/admin/institutions',  icon: Building2,       label: 'Institutions',  badge: 'NEW' },
  { to: '/admin/companies',    icon: Building2,       label: 'Companies',     badge: null },
  { to: '/admin/resources',    icon: BookOpen,        label: 'Resources',     badge: null },
  { to: '/admin/certificates', icon: Award,           label: 'Certificates',  badge: null },
  { to: '/admin/enquiries',    icon: MessageSquare,   label: 'Enquiries',     badge: null },
  { to: '/admin/analytics',    icon: BarChart3,       label: 'Analytics',     badge: null },
  { to: '/admin/settings',     icon: Settings,        label: 'Settings',      badge: null },
];

function NavItem({ to, icon: Icon, label, badge, onClick }: any) {
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
      <div className="flex items-center gap-1">
        {badge && <span className="text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">{badge}</span>}
        {active && <ChevronRight size={12} className="text-emerald-400" />}
      </div>
    </Link>
  );
}

export function AdminLayout() {
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
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.4))' }} />
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        {/* User */}
        <div className="px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user?.name}</p>
              <p className="text-emerald-500 text-[10px] uppercase font-bold tracking-wider">Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />)}
        </nav>

        {/* Logout */}
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
