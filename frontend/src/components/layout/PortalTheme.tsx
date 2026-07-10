// src/components/layout/PortalTheme.tsx
// Shared glass design system for all portals — inject once per layout

export const PORTAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --glass-bg:      rgba(255,255,255,0.06);
    --glass-border:  rgba(255,255,255,0.10);
    --glass-hover:   rgba(255,255,255,0.10);
    --sidebar-bg:    #0B0F1A;
    --main-bg:       #0D1117;
    --card-bg:       rgba(255,255,255,0.05);
    --card-border:   rgba(255,255,255,0.08);
    --text-primary:  #F1F5F9;
    --text-muted:    #94A3B8;
  }

  /* ── Sidebar glass nav item ── */
  .nav-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 12px; border-radius: 10px;
    font-size: 13px; font-weight: 500;
    transition: all 0.18s ease; cursor: pointer; text-decoration: none;
    color: #94A3B8; letter-spacing: 0.01em;
  }
  .nav-item:hover { background: var(--glass-hover); color: #F1F5F9; transform: translateX(2px); }
  .nav-item.active { color: #fff; }

  /* ── Glass card ── */
  .glass-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    transition: all 0.2s ease;
  }
  .glass-card:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.14);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }

  /* ── Stat card shimmer ── */
  .stat-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.2s ease;
    position: relative; overflow: hidden;
    cursor: pointer; text-decoration: none; display: block;
  }
  .stat-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%);
    pointer-events: none;
  }
  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    border-color: rgba(255,255,255,0.16);
  }

  /* ── Page entry animation ── */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 currentColor; }
    50%       { box-shadow: 0 0 12px 2px currentColor; }
  }
  .animate-page { animation: fadeSlideUp 0.35s ease both; }
  .animate-fade { animation: fadeIn 0.3s ease both; }
  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.10s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.20s; }
  .stagger-5 { animation-delay: 0.25s; }
  .stagger-6 { animation-delay: 0.30s; }

  /* ── Glow dots (sidebar accent) ── */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

  /* ── Badge pill ── */
  .portal-badge {
    font-size: 9px; font-weight: 700; letter-spacing: 0.05em;
    padding: 2px 7px; border-radius: 20px; text-transform: uppercase;
  }
`;

// Portal color configs
export const PORTAL_COLORS = {
  admin:      { accent: '#10B981', glow: 'rgba(16,185,129,0.3)',  bg: 'from-emerald-500/20 to-emerald-600/10', dot: '#10B981', ring: 'rgba(16,185,129,0.4)'  },
  student:    { accent: '#3B82F6', glow: 'rgba(59,130,246,0.3)',  bg: 'from-blue-500/20 to-blue-600/10',       dot: '#3B82F6', ring: 'rgba(59,130,246,0.4)'   },
  institution:{ accent: '#8B5CF6', glow: 'rgba(139,92,246,0.3)',  bg: 'from-violet-500/20 to-violet-600/10',   dot: '#8B5CF6', ring: 'rgba(139,92,246,0.4)'  },
  instStudent:{ accent: '#F59E0B', glow: 'rgba(245,158,11,0.3)',  bg: 'from-amber-500/20 to-amber-600/10',     dot: '#F59E0B', ring: 'rgba(245,158,11,0.4)'   },
  company:    { accent: '#EC4899', glow: 'rgba(236,72,153,0.3)',  bg: 'from-pink-500/20 to-pink-600/10',       dot: '#EC4899', ring: 'rgba(236,72,153,0.4)'   },
};
