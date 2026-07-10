// src/components/layout/AdminLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Briefcase, FileText, GraduationCap, Building2,
  BookOpen, Award, BarChart3, Settings, Users, Menu, X, LogOut,
  ShieldCheck, MessageSquare, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { PORTAL_STYLES, PORTAL_COLORS } from './PortalTheme';

const C = PORTAL_COLORS.admin;

const NAV = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/admin/iplatform',    icon: GraduationCap,   label: 'Hiresnix Intern', badge: 'NEW' },
  { to: '/admin/jobs',         icon: Briefcase,       label: 'Jobs'             },
  { to: '/admin/applications', icon: FileText,        label: 'Applications'     },
  { to: '/admin/internships',  icon: BookOpen,        label: 'Programs'         },
  { to: '/admin/students',     icon: Users,           label: 'Students'         },
  { to: '/admin/companies',    icon: Building2,       label: 'Companies'        },
  { to: '/admin/institutions', icon: GraduationCap,   label: 'Institutions'     },
  { to: '/admin/resources',    icon: BookOpen,        label: 'Resources'        },
  { to: '/admin/certificates', icon: Award,           label: 'Certificates'     },
  { to: '/admin/enquiries',    icon: MessageSquare,   label: 'Enquiries'        },
  { to: '/admin/analytics',    icon: BarChart3,       label: 'Analytics'        },
  { to: '/admin/settings',     icon: Settings,        label: 'Settings'         },
];

function NavItem({ to, icon: Icon, label, badge, onClick }: any) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link to={to} onClick={onClick} className="nav-item"
      style={active ? {
        background: `linear-gradient(135deg, ${C.glow}, rgba(255,255,255,0.03))`,
        color: C.accent, borderLeft: `2px solid ${C.accent}`, paddingLeft: '10px',
      } : {}}>
      <div className="flex items-center gap-2.5">
        <Icon size={15} style={active ? { color: C.accent } : {}} />
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        {badge && <span className="portal-badge" style={{ background: C.accent, color: '#fff' }}>{badge}</span>}
        {active && <ChevronRight size={11} style={{ color: C.accent }} />}
      </div>
    </Link>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen font-sans" style={{ background: '#0D1117' }}>
      <style>{PORTAL_STYLES}</style>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transform transition-transform duration-300 md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg,#0B0F1A 0%,#0D1117 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 32, objectFit: 'contain', filter: `drop-shadow(0 0 10px ${C.ring})` }} />
          <button className="md:hidden p-1 rounded-lg hover:bg-white/10" onClick={() => setOpen(false)}><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="mx-3 my-3 p-3 rounded-xl" style={{ background: `linear-gradient(135deg,${C.glow},rgba(255,255,255,0.03))`, border: `1px solid ${C.ring}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg,${C.accent},${C.accent}99)` }}>
              <ShieldCheck size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.accent }}>Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />)}
        </nav>

        <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => { logout(); navigate('/auth'); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition text-xs font-medium">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: '#0B0F1A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 26, objectFit: 'contain' }} />
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Menu size={18} className="text-gray-300" />
          </button>
        </header>
        <header className="hidden md:flex h-12 items-center justify-between px-6 sticky top-0 z-10"
          style={{ background: 'rgba(13,17,23,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }} />
            <span className="text-xs font-semibold text-gray-400">Admin Portal</span>
          </div>
          <span className="text-xs text-gray-600">{user?.email}</span>
        </header>
        <main key={pathname} className="flex-1 p-4 sm:p-6 overflow-auto animate-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}