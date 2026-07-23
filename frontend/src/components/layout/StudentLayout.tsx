// src/components/layout/StudentLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Briefcase, BookOpen, Award, FileText, User, Menu, X, LogOut, BotMessageSquare, Send, BarChart2, Map } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { PORTAL_STYLES, PORTAL_COLORS } from './PortalTheme';

const C = PORTAL_COLORS.student;

const NAV = [
  { to: '/student/dashboard',     icon: LayoutDashboard,  label: 'Dashboard'      },
  { to: '/student/internships',   icon: Briefcase,        label: 'Internships'    },
  { to: '/student/jobs',          icon: Send,             label: 'Jobs'           },
  { to: '/student/applications',  icon: FileText,         label: 'Applications'   },
  { to: '/student/resources',     icon: BookOpen,         label: 'Resources'      },
  { to: '/student/mock-interview', icon: BotMessageSquare, label: 'Mock Interview' },
  { to: '/student/resume-builder', icon: FileText, label: 'Resume AI 🆕' },
  { to: '/student/projects', icon: Briefcase, label: 'My Projects 🆕' },
  { to: '/student/mock-dashboard', icon: BarChart2, label: 'Interview Stats' },
  { to: '/student/roadmap',        icon: Map,       label: 'Career Roadmap 🗺️' },
  { to: '/student/certificates',  icon: Award,            label: 'Certificates'   },
  { to: '/student/profile',       icon: User,             label: 'Profile'        },
];

function NavItem({ to, icon: Icon, label, onClick }: any) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link to={to} onClick={onClick} className="nav-item"
      style={active ? {
        background: `linear-gradient(135deg,${C.glow},rgba(255,255,255,0.03))`,
        color: C.accent, borderLeft: `2px solid ${C.accent}`, paddingLeft: '10px',
      } : {}}>
      <div className="flex items-center gap-2.5">
        <Icon size={15} style={active ? { color: C.accent } : {}} />
        {label}
      </div>
    </Link>
  );
}

export function StudentLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'S';

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
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
              style={{ background: `linear-gradient(135deg,${C.accent},${C.accent}99)` }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.accent }}>Student</p>
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
            <span className="text-xs font-semibold text-gray-400">Student Portal</span>
          </div>
          <span className="text-xs text-gray-600">{user?.email}</span>
        </header>
        <main key={pathname} className="flex-1 p-4 sm:p-6 animate-page" style={{overflowY:"auto"}}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}