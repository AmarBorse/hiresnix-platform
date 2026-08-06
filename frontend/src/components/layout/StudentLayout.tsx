// src/components/layout/StudentLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Briefcase, BookOpen, Award, FileText, User, Menu, X, LogOut,
  BotMessageSquare, Send, BarChart2, Map, CalendarCheck, Lock, Clock, Info } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { PORTAL_STYLES, PORTAL_COLORS } from './PortalTheme';
import axios from 'axios';

const C = PORTAL_COLORS.student;
const API = (import.meta as any).env.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

// Features that get locked after 1 year
const LOCKED_AFTER_1_YEAR = [
  '/student/resume-builder',
  '/student/mock-interview',
  '/student/mock-dashboard',
  '/student/roadmap',
];

const NAV = [
  { to: '/student/overview',       icon: Info,             label: 'Portal Guide 📖'    },
  { to: '/student/dashboard',      icon: LayoutDashboard,  label: 'Dashboard'         },
  { to: '/student/attendance',     icon: CalendarCheck,    label: 'Attendance 🆕'     },
  { to: '/student/internships',    icon: Briefcase,        label: 'Internships'        },
  { to: '/student/jobs',           icon: Send,             label: 'Jobs'               },
  { to: '/student/applications',   icon: FileText,         label: 'Applications'       },
  { to: '/student/resources',      icon: BookOpen,         label: 'Resources'          },
  { to: '/student/mock-interview', icon: BotMessageSquare, label: 'Mock Interview',  lockable: true },
  { to: '/student/resume-builder', icon: FileText,         label: 'Resume AI 🆕',   lockable: true },
  { to: '/student/projects',       icon: Briefcase,        label: 'My Projects 🆕'    },
  { to: '/student/mock-dashboard', icon: BarChart2,        label: 'Interview Stats', lockable: true },
  { to: '/student/roadmap',        icon: Map,              label: 'Career Roadmap 🗺️', lockable: true },
  { to: '/student/certificates',   icon: Award,            label: 'Certificates'       },
  { to: '/student/profile',        icon: User,             label: 'Profile'            },
];

/* ── Countdown Hook ──────────────────────────────────────────────── */
function useCountdown(startDate: string | null) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number; expired: boolean } | null>(null);

  useEffect(() => {
    if (!startDate) return;

    const calc = () => {
      const start  = new Date(startDate);
      const expiry = new Date(start);
      expiry.setFullYear(expiry.getFullYear() + 1);

      const now  = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0, expired: true });
        return;
      }

      const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs  = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, mins, secs, expired: false });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return timeLeft;
}

/* ── Nav Item ────────────────────────────────────────────────────── */
function NavItem({ to, icon: Icon, label, onClick, locked }: any) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');

  if (locked) {
    return (
      <div className="nav-item opacity-40 cursor-not-allowed select-none"
        style={{ pointerEvents: 'none' }}
        title="Access expired after 1 year">
        <div className="flex items-center gap-2.5">
          <Lock size={13} style={{ color: '#EF4444' }} />
          <span style={{ textDecoration: 'line-through', color: '#475569' }}>{label}</span>
        </div>
        <Lock size={11} style={{ color: '#EF4444' }} />
      </div>
    );
  }

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

/* ── Countdown Bar ───────────────────────────────────────────────── */
function CountdownBar({ timeLeft, startDate }: { timeLeft: any; startDate: string }) {
  const start  = new Date(startDate);
  const expiry = new Date(start);
  expiry.setFullYear(expiry.getFullYear() + 1);
  const total   = expiry.getTime() - start.getTime();
  const elapsed = Date.now() - start.getTime();
  const pct     = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const urgent  = timeLeft?.days < 30;
  const color   = urgent ? '#EF4444' : timeLeft?.days < 90 ? '#F59E0B' : '#10B981';

  if (timeLeft?.expired) {
    return (
      <div style={{
        margin: '0 12px 8px',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '10px',
        padding: '8px 12px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Lock size={12} style={{ color: '#EF4444' }} />
          <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 800 }}>Access Expired</span>
        </div>
        <p style={{ color: '#64748B', fontSize: '10px', marginTop: '2px' }}>1 year internship period ended</p>
      </div>
    );
  }

  return (
    <div style={{
      margin: '0 12px 8px',
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: '10px',
      padding: '8px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} style={{ color }} />
          <span style={{ color, fontSize: '10px', fontWeight: 700 }}>Access Expires In</span>
        </div>
        <span style={{ color: '#64748B', fontSize: '9px' }}>{Math.round(100 - pct)}% left</span>
      </div>

      {/* Countdown digits */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '6px' }}>
        {[
          { val: timeLeft?.days, label: 'D' },
          { val: timeLeft?.hours, label: 'H' },
          { val: timeLeft?.mins, label: 'M' },
          { val: timeLeft?.secs, label: 'S' },
        ].map(({ val, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{
              background: `${color}20`,
              border: `1px solid ${color}40`,
              borderRadius: '6px',
              padding: '3px 6px',
              minWidth: '28px',
            }}>
              <span style={{ color, fontSize: '13px', fontWeight: 900, fontFamily: 'monospace' }}>
                {String(val ?? 0).padStart(2, '0')}
              </span>
            </div>
            <span style={{ color: '#475569', fontSize: '8px', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '3px' }}>
        <div style={{
          width: `${pct}%`,
          height: '3px',
          borderRadius: '4px',
          background: `linear-gradient(90deg, #10B981, ${color})`,
          transition: 'width 1s linear',
        }} />
      </div>
      <p style={{ color: '#475569', fontSize: '9px', marginTop: '4px', textAlign: 'center' }}>
        Started {new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}

/* ── Main Layout ─────────────────────────────────────────────────── */
export function StudentLayout() {
  const [open, setOpen]           = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const { user, logout }          = useAuthStore();
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const initials  = user?.name?.charAt(0)?.toUpperCase() || 'S';
  const timeLeft  = useCountdown(startDate);
  const isExpired = timeLeft?.expired ?? false;

  // Fetch internship start date from offer letter
  useEffect(() => {
    const token = localStorage.getItem('hx_student_token') || localStorage.getItem('hirenix_token');
    if (!token) return;

    axios.get(`${API}/iplatform/my-application`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      const data = r.data?.data;
      // Try offerJoiningDate first, then enrollment startDate
      const date = data?.application?.offerJoiningDate
        || data?.enrollment?.startDate
        || data?.application?.createdAt;
      if (date) setStartDate(date);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen font-sans" style={{ background: '#0D1117' }}>
      <style>{PORTAL_STYLES}</style>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transform transition-transform duration-300 md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg,#0B0F1A 0%,#0D1117 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 32, objectFit: 'contain', filter: `drop-shadow(0 0 10px ${C.ring})` }} />
          <button className="md:hidden p-1 rounded-lg hover:bg-white/10" onClick={() => setOpen(false)}><X size={16} className="text-gray-400" /></button>
        </div>

        {/* User card */}
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

        {/* Countdown bar — show only if internship started */}
        {startDate && timeLeft && (
          <CountdownBar timeLeft={timeLeft} startDate={startDate} />
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <NavItem
              key={item.to}
              {...item}
              onClick={() => setOpen(false)}
              locked={item.lockable && isExpired}
            />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => { logout(); navigate('/auth'); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition text-xs font-medium">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: '#0B0F1A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 26, objectFit: 'contain' }} />
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Menu size={18} className="text-gray-300" />
          </button>
        </header>

        {/* Desktop header with countdown */}
        <header className="hidden md:flex h-12 items-center justify-between px-6 sticky top-0 z-10"
          style={{ background: 'rgba(13,17,23,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }} />
            <span className="text-xs font-semibold text-gray-400">Student Portal</span>
          </div>

          {/* Top bar countdown */}
          {startDate && timeLeft && !timeLeft.expired && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: timeLeft.days < 30 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${timeLeft.days < 30 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}`,
              borderRadius: '8px', padding: '4px 12px',
            }}>
              <Clock size={11} style={{ color: timeLeft.days < 30 ? '#EF4444' : '#10B981' }} />
              <span style={{ color: timeLeft.days < 30 ? '#EF4444' : '#10B981', fontSize: '11px', fontWeight: 700 }}>
                Access: {String(timeLeft.days).padStart(3,'0')}d {String(timeLeft.hours).padStart(2,'0')}h {String(timeLeft.mins).padStart(2,'0')}m {String(timeLeft.secs).padStart(2,'0')}s
              </span>
            </div>
          )}
          {startDate && timeLeft?.expired && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '4px 12px',
            }}>
              <Lock size={11} style={{ color: '#EF4444' }} />
              <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 700 }}>Access Expired</span>
            </div>
          )}

          <span className="text-xs text-gray-600">{user?.email}</span>
        </header>

        <main key={pathname} className="flex-1 p-4 sm:p-6 animate-page" style={{ overflowY: 'auto' }}>
          {/* Show locked overlay if expired and on a locked route */}
          {isExpired && LOCKED_AFTER_1_YEAR.includes(pathname) ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '60vh', gap: '16px', textAlign: 'center',
            }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock size={32} style={{ color: '#EF4444' }} />
              </div>
              <h2 style={{ color: '#EF4444', fontSize: '22px', fontWeight: 900 }}>Feature Locked</h2>
              <p style={{ color: '#64748B', fontSize: '14px', maxWidth: '360px', lineHeight: 1.6 }}>
                Your 1-year internship access period has ended. This feature is no longer available.
              </p>
              <p style={{ color: '#334155', fontSize: '12px' }}>
                Started: {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
              </p>
              <button
                onClick={() => navigate('/student/dashboard')}
                style={{
                  background: 'linear-gradient(135deg,#3B82F6,#2563EB)',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '10px 24px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                }}>
                Go to Dashboard
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}