// src/components/layout/StudentLayout.tsx
// Student portal shell — white, clean design matching the landing page.
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Briefcase, BookOpen, Award, FileText, User, Menu, X, LogOut,
  BotMessageSquare, Send, BarChart2, Map, CalendarCheck, Lock, Clock, Info, Sparkles, FolderGit2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { PORTAL_STYLES } from './PortalTheme';
import { PORTAL_LIGHT_CSS } from './PortalLight';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

// Features that get locked after 1 year
const LOCKED_AFTER_1_YEAR = [
  '/student/resume-builder',
  '/student/mock-interview',
  '/student/mock-dashboard',
  '/student/roadmap',
];

// Pages originally built for a dark background: the light adapter re-colours them
const ADAPTED_PAGES = [
  '/student/attendance',
  '/student/mock-interview',
  '/student/resume-builder',
  '/student/projects',
  '/student/mock-dashboard',
  '/student/roadmap',
];

type NavEntry = { to: string; icon: any; label: string; badge?: string; lockable?: boolean };
const NAV_GROUPS: { title: string; items: NavEntry[] }[] = [
  { title: 'Overview', items: [
    { to: '/student/dashboard',      icon: LayoutDashboard,  label: 'Dashboard' },
    { to: '/student/overview',       icon: Info,             label: 'Portal guide' },
  ] },
  { title: 'Internship', items: [
    { to: '/student/internships',    icon: Briefcase,        label: 'Internships' },
    { to: '/student/attendance',     icon: CalendarCheck,    label: 'Attendance',      badge: 'New' },
    { to: '/student/projects',       icon: FolderGit2,       label: 'My projects',     badge: 'New' },
    { to: '/student/certificates',   icon: Award,            label: 'Certificates' },
  ] },
  { title: 'Career', items: [
    { to: '/student/jobs',           icon: Send,             label: 'Jobs' },
    { to: '/student/applications',   icon: FileText,         label: 'Applications' },
    { to: '/student/resume-builder', icon: FileText,         label: 'Resume AI',       badge: 'New', lockable: true },
    { to: '/student/mock-interview', icon: BotMessageSquare, label: 'Mock interview',  lockable: true },
    { to: '/student/mock-dashboard', icon: BarChart2,        label: 'Interview stats', lockable: true },
    { to: '/student/roadmap',        icon: Map,              label: 'Career roadmap',  lockable: true },
  ] },
  { title: 'Learn', items: [
    { to: '/student/academy',        icon: Sparkles,         label: 'AI Academy',      badge: 'New' },
    { to: '/student/resources',      icon: BookOpen,         label: 'Resources' },
  ] },
  { title: 'Account', items: [
    { to: '/student/profile',        icon: User,             label: 'Profile' },
  ] },
];
const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap(g => g.items.map(i => [i.to, i.label]))
);

/* ── Countdown hook (unchanged logic) ── */
function useCountdown(startDate: string | null) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number; expired: boolean } | null>(null);
  useEffect(() => {
    if (!startDate) return;
    const calc = () => {
      const start = new Date(startDate);
      const expiry = new Date(start);
      expiry.setFullYear(expiry.getFullYear() + 1);
      const diff = expiry.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0, expired: true }); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [startDate]);
  return timeLeft;
}

/* ── Brand mark (same as landing page) ── */
function BrandMark() {
  return (
    <span className="stu-brand" aria-label="Hiresnix">
      <svg width="28" height="22" viewBox="0 0 30 24" aria-hidden="true">
        <path d="M1 22 C 10 21, 17 16, 21 7" fill="none" stroke="#15171A" strokeWidth="3" strokeLinecap="round" />
        <path d="M15 8 L22 4.5 L23.5 12.5" fill="none" stroke="#15171A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27" cy="3" r="2.6" fill="#0B7A55" />
      </svg>
      <span className="stu-brand-word">HIRESNIX</span>
    </span>
  );
}

function NavItem({ to, icon: Icon, label, badge, locked, onClick }: NavEntry & { locked?: boolean; onClick: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  if (locked) {
    return (
      <span className="stu-nav-item is-locked" title="Access expired after 1 year" aria-disabled="true">
        <Lock size={15} aria-hidden="true" />
        <span className="stu-nav-label">{label}</span>
      </span>
    );
  }
  return (
    <Link to={to} onClick={onClick} className={`stu-nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
      <Icon size={16} aria-hidden="true" />
      <span className="stu-nav-label">{label}</span>
      {badge && <span className="stu-badge">{badge}</span>}
    </Link>
  );
}

/* ── Access countdown (sidebar) ── */
function AccessCard({ timeLeft, startDate }: { timeLeft: any; startDate: string }) {
  if (timeLeft?.expired) {
    return (
      <div className="stu-access is-expired">
        <div className="stu-access-head"><Lock size={13} aria-hidden="true" /> Access expired</div>
        <p className="stu-access-note">Your 1-year internship period has ended.</p>
      </div>
    );
  }
  const start = new Date(startDate);
  const expiry = new Date(start); expiry.setFullYear(expiry.getFullYear() + 1);
  const pctLeft = Math.max(0, Math.min(100, ((expiry.getTime() - Date.now()) / (expiry.getTime() - start.getTime())) * 100));
  const tone = timeLeft.days < 30 ? 'is-urgent' : timeLeft.days < 90 ? 'is-warn' : '';
  return (
    <div className={`stu-access ${tone}`}>
      <div className="stu-access-head"><Clock size={13} aria-hidden="true" /> Access ends in</div>
      <p className="stu-access-time">
        <strong>{timeLeft.days}</strong> days <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.mins).padStart(2, '0')}:{String(timeLeft.secs).padStart(2, '0')}</span>
      </p>
      <div className="stu-access-bar" role="progressbar" aria-valuenow={Math.round(pctLeft)} aria-valuemin={0} aria-valuemax={100} aria-label="Access time left">
        <span style={{ width: `${pctLeft}%` }} />
      </div>
      <p className="stu-access-note">
        Started {start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}

/* ── Main layout ── */
export function StudentLayout() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'S';
  const timeLeft = useCountdown(startDate);
  const isExpired = timeLeft?.expired ?? false;
  const adapted = ADAPTED_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'));
  const title = PAGE_TITLES[pathname] || 'Student portal';

  // Internship start date (offer letter) drives the 1-year access countdown
  useEffect(() => {
    const token = localStorage.getItem('hx_student_token') || localStorage.getItem('hirenix_token');
    if (!token) return;
    axios.get(`${API}/iplatform/my-application`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const data = r.data?.data;
        const date = data?.application?.offerJoiningDate || data?.enrollment?.startDate || data?.application?.createdAt;
        if (date) setStartDate(date);
      })
      .catch(() => {});
  }, []);

  // The portal is always light now: turn off the old dark page tint while it's open
  // Also neutralise the old global light/dark toggle in index.html: its blanket overrides
  // (e.g. turning every .text-white dark) fight this design. Restored when leaving the portal.
  useEffect(() => {
    document.body.classList.add('stu-light-body');
    const html = document.documentElement;
    const prevTheme = html.getAttribute('data-theme');
    html.setAttribute('data-theme', 'dark');
    return () => {
      document.body.classList.remove('stu-light-body');
      if (prevTheme) html.setAttribute('data-theme', prevTheme); else html.removeAttribute('data-theme');
    };
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="stu-root">
      <style>{PORTAL_STYLES}</style>
      <style>{PORTAL_LIGHT_CSS}</style>

      {open && <div className="stu-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      {/* Sidebar (div, not <aside>, so the old global dark/light overrides don't touch it) */}
      <div className={`stu-sidebar${open ? ' is-open' : ''}`} role="navigation" aria-label="Student portal">
        <div className="stu-sidebar-top">
          <Link to="/student/dashboard" className="stu-home"><BrandMark /></Link>
          <button className="stu-icon-btn stu-only-mobile" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <div className="stu-user">
          <span className="stu-avatar" aria-hidden="true">{initials}</span>
          <span className="stu-user-text">
            <span className="stu-user-name">{user?.name}</span>
            <span className="stu-user-role">Student</span>
          </span>
        </div>

        {startDate && timeLeft && <AccessCard timeLeft={timeLeft} startDate={startDate} />}

        <nav className="stu-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="stu-nav-group">
              <p className="stu-nav-title">{group.title}</p>
              {group.items.map(item => (
                <NavItem key={item.to} {...item} locked={item.lockable && isExpired} onClick={() => setOpen(false)} />
              ))}
            </div>
          ))}
        </nav>

        <div className="stu-sidebar-foot">
          <button className="stu-signout" onClick={() => { logout(); navigate('/auth'); }}>
            <LogOut size={15} aria-hidden="true" /> Sign out
          </button>
        </div>
      </div>

      {/* Main column */}
      <div className="stu-col">
        <div className="stu-topbar" role="banner">
          <button className="stu-icon-btn stu-only-mobile" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <h1 className="stu-page-title">{title}</h1>
          <div className="stu-topbar-right">
            {startDate && timeLeft && !timeLeft.expired && (
              <span className={`stu-chip${timeLeft.days < 30 ? ' is-urgent' : ''}`}>
                <Clock size={12} aria-hidden="true" />
                {timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.mins).padStart(2, '0')}m left
              </span>
            )}
            {startDate && timeLeft?.expired && (
              <span className="stu-chip is-urgent"><Lock size={12} aria-hidden="true" /> Access expired</span>
            )}
            <Link to="/student/profile" className="stu-top-user" title={user?.email || ''}>
              <span className="stu-avatar stu-avatar-sm" aria-hidden="true">{initials}</span>
              <span className="stu-top-email">{user?.email}</span>
            </Link>
          </div>
        </div>

        <div key={pathname} role="main" className={`stu-main animate-page${adapted ? ' stu-adapt' : ''}`}>
          {isExpired && LOCKED_AFTER_1_YEAR.includes(pathname) ? (
            <div className="stu-locked">
              <span className="stu-locked-icon"><Lock size={28} aria-hidden="true" /></span>
              <h2>Feature locked</h2>
              <p>Your 1-year internship access period has ended. This feature is no longer available.</p>
              <p className="stu-locked-date">
                Started: {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
              </p>
              <button className="stu-btn stu-btn-primary" onClick={() => navigate('/student/dashboard')}>Go to dashboard</button>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}