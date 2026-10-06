// src/components/layout/PortalLight.ts
// Light, clean portal styling that matches the landing page (white, green accent).
// 1) the portal shell (sidebar, top bar)
// 2) light versions of the shared portal classes (stat-card, glass-card, nav-item)
// 3) ".stu-adapt": re-colours pages that were originally built for a dark background

export const PORTAL_LIGHT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600;700&display=swap');

body.stu-light-body{background:#F6F7F5 !important;color:#2B2E33;}
body.stu-light-body::before{display:none !important;}
body.stu-light-body #root{background:#F6F7F5 !important;}

.stu-root{
  --paper:#FFFFFF; --mist:#F6F7F5; --line:#E4E6E2; --field:#CFD2CC;
  --ink:#15171A; --text:#2B2E33; --muted:#62666D;
  --accent:#0B7A55; --accent-press:#08613F; --accent-soft:#E8F4EE;
  --amber:#B45309; --amber-soft:#FEF3E2; --red:#B42318; --red-soft:#FDECEA;
  --display:'Bricolage Grotesque','Helvetica Neue',Arial,sans-serif;
  --body:'Figtree',system-ui,-apple-system,'Segoe UI',sans-serif;
  display:flex; min-height:100vh; background:var(--mist); color:var(--text);
  font-family:var(--body); -webkit-font-smoothing:antialiased;
}
.stu-root *{box-sizing:border-box;}
.stu-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px;}
.stu-root ::-webkit-scrollbar-thumb{background:#D3D6D0;}

/* ── Sidebar ── */
.stu-sidebar{position:sticky;top:0;height:100vh;width:252px;flex-shrink:0;display:flex;flex-direction:column;background:var(--paper);border-right:1px solid var(--line);z-index:50;}
.stu-sidebar-top{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 14px;}
.stu-home{text-decoration:none;display:inline-flex;}
.stu-brand{display:inline-flex;align-items:center;gap:9px;}
.stu-brand-word{font-family:var(--display);font-weight:700;font-size:0.95rem;letter-spacing:0.16em;color:var(--ink);}
.stu-user{display:flex;align-items:center;gap:10px;margin:2px 14px 12px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;}
.stu-avatar{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--ink);color:#fff;font-family:var(--display);font-weight:700;font-size:0.95rem;flex-shrink:0;}
.stu-avatar-sm{width:28px;height:28px;font-size:0.8rem;}
.stu-user-text{display:flex;flex-direction:column;min-width:0;line-height:1.25;}
.stu-user-name{font-weight:700;color:var(--ink);font-size:0.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.stu-user-role{color:var(--muted);font-size:0.8rem;}

.stu-access{margin:0 14px 10px;padding:12px;border-radius:14px;background:var(--accent-soft);color:var(--accent-press);}
.stu-access.is-warn{background:var(--amber-soft);color:var(--amber);}
.stu-access.is-urgent,.stu-access.is-expired{background:var(--red-soft);color:var(--red);}
.stu-access-head{display:flex;align-items:center;gap:6px;font-size:0.8rem;font-weight:600;}
.stu-access-time{margin:4px 0 8px;font-size:0.85rem;color:var(--ink);}
.stu-access-time strong{font-family:var(--display);font-size:1.35rem;font-weight:700;margin-right:2px;}
.stu-access-time span{color:var(--muted);font-variant-numeric:tabular-nums;margin-left:4px;}
.stu-access-bar{height:4px;border-radius:4px;background:rgba(21,23,26,.08);overflow:hidden;}
.stu-access-bar span{display:block;height:100%;background:currentColor;border-radius:4px;transition:width 1s linear;}
.stu-access-note{margin:6px 0 0;font-size:0.75rem;color:var(--muted);}

.stu-nav{flex:1;overflow-y:auto;padding:4px 10px 12px;}
.stu-nav-group{margin-top:10px;}
.stu-nav-title{margin:0 0 4px;padding:0 10px;font-size:0.75rem;font-weight:600;color:#8A8E94;}
.stu-nav-item{display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:10px;color:var(--text);font-size:0.92rem;font-weight:500;text-decoration:none !important;transition:background-color .15s ease,color .15s ease;}
.stu-nav-item svg{color:#8A8E94;flex-shrink:0;transition:color .15s ease;}
.stu-nav-item:hover{background:var(--mist);color:var(--ink);}
.stu-nav-item:hover svg{color:var(--ink);}
.stu-nav-item.is-active{background:var(--accent-soft);color:var(--accent-press);font-weight:600;}
.stu-nav-item.is-active svg{color:var(--accent);}
.stu-nav-item.is-locked{color:#A3A7AD;cursor:not-allowed;}
.stu-nav-item.is-locked .stu-nav-label{text-decoration:line-through;}
.stu-nav-item.is-locked svg{color:var(--red);}
.stu-nav-label{flex:1;min-width:0;}
.stu-badge{font-size:0.68rem;font-weight:700;color:var(--accent-press);background:var(--accent-soft);border-radius:999px;padding:2px 7px;}
.stu-nav-item.is-active .stu-badge{background:#fff;}
.stu-sidebar-foot{padding:10px 12px 14px;border-top:1px solid var(--line);}
.stu-signout{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;color:var(--muted);font-size:0.9rem;font-weight:500;cursor:pointer;}
.stu-signout:hover{background:var(--red-soft);color:var(--red);}

/* ── Main column ── */
.stu-col{flex:1;display:flex;flex-direction:column;min-width:0;}
.stu-topbar{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:12px;height:62px;padding:0 28px;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}
.stu-page-title{margin:0;font-family:var(--display);font-weight:700;font-size:1.15rem;color:var(--ink);letter-spacing:-0.01em;}
.stu-topbar-right{margin-left:auto;display:flex;align-items:center;gap:12px;}
.stu-chip{display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:600;color:var(--accent-press);background:var(--accent-soft);border-radius:999px;padding:5px 12px;font-variant-numeric:tabular-nums;}
.stu-chip.is-urgent{color:var(--red);background:var(--red-soft);}
.stu-top-user{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:var(--muted);font-size:0.88rem;}
.stu-top-user:hover{color:var(--ink);}
.stu-main{flex:1;padding:28px;overflow-y:auto;}
.stu-icon-btn{all:unset;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;border:1px solid var(--line);color:var(--ink);}
.stu-only-mobile{display:none;}
.stu-scrim{position:fixed;inset:0;background:rgba(21,23,26,.35);z-index:45;}

.stu-btn{font-family:var(--body);font-weight:600;font-size:0.92rem;border-radius:999px;padding:10px 20px;cursor:pointer;border:1px solid transparent;display:inline-flex;align-items:center;gap:8px;text-decoration:none;transition:background-color .15s ease,border-color .15s ease;}
.stu-btn-primary{background:var(--accent);color:#fff;}
.stu-btn-primary:hover{background:var(--accent-press);}
.stu-btn-ghost{background:var(--paper);color:var(--ink);border-color:var(--field);}
.stu-btn-ghost:hover{border-color:var(--ink);}

.stu-locked{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:12px;text-align:center;}
.stu-locked-icon{display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;background:var(--red-soft);color:var(--red);}
.stu-locked h2{margin:4px 0 0;font-family:var(--display);font-size:1.6rem;color:var(--ink);}
.stu-locked p{margin:0;color:var(--muted);max-width:380px;}
.stu-locked-date{font-size:0.85rem;}

/* ── Shared portal classes, light versions ── */
.stu-root .stat-card,.stu-root .glass-card{background:var(--paper);border:1px solid var(--line);box-shadow:none;backdrop-filter:none;}
.stu-root .stat-card::before{display:none;}
.stu-root .stat-card:hover,.stu-root .glass-card:hover{background:var(--paper);border-color:#D3D6D0;box-shadow:0 14px 30px -20px rgba(21,23,26,.25);}

/* Light-designed pages: give their headings the landing typography */
.stu-main h1,.stu-main h2{font-family:var(--display);letter-spacing:-0.01em;}

/* ── Adapter for pages originally built dark ── */
/* Surfaces */
.stu-adapt [style*="background: rgba(255, 255, 255, 0.0"],
.stu-adapt [style*="background: rgba(255, 255, 255, 0.1"],
.stu-adapt [style*="background: rgb(30, 41, 59)"],
.stu-adapt [style*="background: rgb(15, 23, 42)"],
.stu-adapt [style*="background: rgb(26, 31, 53)"],
.stu-adapt [style*="background: rgb(17, 24, 39)"],
.stu-adapt [style*="background: rgb(13, 17, 23)"],
.stu-adapt [style*="background: rgb(11, 15, 26)"],
.stu-adapt [style*="background-color: rgba(255, 255, 255, 0.0"],
.stu-adapt .bg-gray-800,.stu-adapt .bg-gray-900,.stu-adapt .bg-slate-800,.stu-adapt .bg-slate-900,
.stu-adapt [class*="bg-gray-800/"],.stu-adapt [class*="bg-gray-900/"],.stu-adapt [class*="from-gray-900"]{
  background:var(--paper) !important;
}
.stu-adapt .bg-gray-700,.stu-adapt [class*="bg-gray-700/"],.stu-adapt .bg-white\\/5,.stu-adapt .bg-white\\/10,
.stu-adapt [style*="background: rgba(255, 255, 255, 0.0"] [style*="background: rgba(255, 255, 255, 0.0"]{
  background:var(--mist) !important;
}
/* Borders */
.stu-adapt [style*="solid rgba(255, 255, 255"],.stu-adapt [style*="solid rgb(51, 65, 85)"],
.stu-adapt [style*="solid rgb(30, 41, 59)"],.stu-adapt [style*="border-color: rgba(255, 255, 255"],
.stu-adapt .border-gray-700,.stu-adapt .border-gray-800,.stu-adapt .border-gray-600,.stu-adapt [class*="border-white/"]{
  border-color:var(--line) !important;
}
.stu-adapt .divide-gray-700 > * + *,.stu-adapt .divide-gray-800 > * + *{border-color:var(--line) !important;}
/* Text */
.stu-adapt [style*="color: rgb(241, 245, 249)"],.stu-adapt [style*="color: white"],.stu-adapt [style*="color: rgb(255, 255, 255)"],
.stu-adapt [style*="color: rgb(226, 232, 240)"],.stu-adapt [style*="color: rgba(255, 255, 255, 0.9"],.stu-adapt [style*="color: rgba(255, 255, 255, 0.8"],
.stu-adapt .text-white,.stu-adapt .text-gray-100,.stu-adapt .text-gray-200{
  color:var(--ink) !important;
}
.stu-adapt [style*="color: rgba(255, 255, 255, 0.7"],.stu-adapt [style*="color: rgba(255, 255, 255, 0.6"],
.stu-adapt [style*="color: rgba(255, 255, 255, 0.5"],.stu-adapt [style*="color: rgba(255, 255, 255, 0.4"],
.stu-adapt [style*="color: rgba(255, 255, 255, 0.3"],.stu-adapt [style*="color: rgb(148, 163, 184)"],
.stu-adapt .text-gray-300,.stu-adapt .text-gray-400{
  color:var(--muted) !important;
}
.stu-adapt [style*="color: rgba(255, 255, 255, 0.2"],.stu-adapt [style*="color: rgba(255, 255, 255, 0.1"]{color:#8A8E94 !important;}
.stu-main [style*="color: rgb(16, 185, 129)"],.stu-main [style*="color: rgb(6, 182, 212)"],.stu-main [style*="color: rgb(34, 197, 94)"],
.stu-main .text-emerald-500,.stu-main .text-green-500,.stu-main .text-cyan-500{color:var(--accent-press) !important;}
.stu-adapt [style*="color: rgb(51, 65, 85)"],.stu-adapt [style*="color: rgb(71, 85, 105)"]{color:#8A8E94 !important;}
/* Pastel accents (made for dark) → deeper versions readable on white */
.stu-adapt [style*="color: rgb(52, 211, 153)"],.stu-adapt [style*="color: rgb(74, 222, 128)"],.stu-adapt .text-green-400,.stu-adapt .text-emerald-400{color:#047857 !important;}
.stu-adapt [style*="color: rgb(251, 191, 36)"],.stu-adapt [style*="color: rgb(245, 158, 11)"],.stu-adapt .text-yellow-400,.stu-adapt .text-amber-400{color:#B45309 !important;}
.stu-adapt [style*="color: rgb(248, 113, 113)"],.stu-adapt .text-red-400{color:#B91C1C !important;}
.stu-adapt [style*="color: rgb(251, 146, 60)"],.stu-adapt .text-orange-400{color:#C2410C !important;}
.stu-adapt [style*="color: rgb(167, 139, 250)"],.stu-adapt .text-purple-400,.stu-adapt .text-violet-400{color:#6D28D9 !important;}
/* More pastel tints used as text on dark backgrounds */
.stu-adapt [style*="color: rgb(110, 231, 183)"],.stu-adapt [style*="color: rgb(167, 243, 208)"],.stu-adapt [style*="color: rgb(134, 239, 172)"],
.stu-adapt .text-green-300,.stu-adapt .text-emerald-300{color:#047857 !important;}
.stu-adapt [style*="color: rgb(252, 211, 77)"],.stu-adapt [style*="color: rgb(253, 230, 138)"],.stu-adapt .text-yellow-300,.stu-adapt .text-amber-300{color:#B45309 !important;}
.stu-adapt [style*="color: rgb(252, 165, 165)"],.stu-adapt .text-red-300{color:#B91C1C !important;}
.stu-adapt [style*="color: rgb(196, 181, 253)"],.stu-adapt .text-purple-300,.stu-adapt .text-violet-300{color:#6D28D9 !important;}
.stu-adapt [style*="color: rgb(147, 197, 253)"],.stu-adapt [style*="color: rgb(103, 232, 249)"],.stu-adapt .text-cyan-300,.stu-adapt .text-sky-300{color:var(--accent-press) !important;}
.stu-adapt [style*="color: rgb(249, 168, 212)"],.stu-adapt .text-pink-300{color:#BE185D !important;}
.stu-adapt [style*="color: rgb(230, 237, 243)"],.stu-adapt [style*="color: rgb(203, 213, 225)"],.stu-adapt [style*="color: rgb(209, 213, 219)"]{color:var(--ink) !important;}
.stu-adapt [style*="color: rgb(139, 148, 158)"]{color:var(--muted) !important;}

/* Keep white text white on solid coloured buttons and badges ("rgb(" = solid colour, not a pale "rgba(" tint) */
.stu-adapt [style*="linear-gradient(135deg, rgb("],.stu-adapt [style*="linear-gradient(135deg, rgb("] *,
.stu-adapt .bg-blue-500,.stu-adapt .bg-blue-600,.stu-adapt .bg-indigo-500,.stu-adapt .bg-indigo-600,
.stu-adapt .bg-green-500,.stu-adapt .bg-green-600,.stu-adapt .bg-red-500,.stu-adapt .bg-red-600,
.stu-adapt .bg-purple-600,.stu-adapt .bg-violet-600,.stu-adapt .bg-emerald-600,
.stu-adapt .bg-blue-600 *,.stu-adapt .bg-indigo-600 *,.stu-adapt .bg-green-600 *,.stu-adapt .bg-purple-600 *,
.stu-adapt .bg-blue-500,
.stu-adapt .bg-blue-600,
.stu-adapt .bg-blue-700,
.stu-adapt .bg-indigo-500,
.stu-adapt .bg-indigo-600,
.stu-adapt .bg-indigo-700,
.stu-adapt .bg-violet-500,
.stu-adapt .bg-violet-600,
.stu-adapt .bg-violet-700,
.stu-adapt .bg-purple-500,
.stu-adapt .bg-purple-600,
.stu-adapt .bg-purple-700,
.stu-adapt .bg-green-500,
.stu-adapt .bg-green-600,
.stu-adapt .bg-green-700,
.stu-adapt .bg-emerald-500,
.stu-adapt .bg-emerald-600,
.stu-adapt .bg-emerald-700,
.stu-adapt .bg-teal-500,
.stu-adapt .bg-teal-600,
.stu-adapt .bg-teal-700,
.stu-adapt .bg-red-500,
.stu-adapt .bg-red-600,
.stu-adapt .bg-red-700,
.stu-adapt .bg-rose-500,
.stu-adapt .bg-rose-600,
.stu-adapt .bg-rose-700,
.stu-adapt .bg-orange-500,
.stu-adapt .bg-orange-600,
.stu-adapt .bg-orange-700,
.stu-adapt .bg-amber-500,
.stu-adapt .bg-amber-600,
.stu-adapt .bg-amber-700,
.stu-adapt .bg-yellow-500,
.stu-adapt .bg-yellow-600,
.stu-adapt .bg-yellow-700,
.stu-adapt .bg-pink-500,
.stu-adapt .bg-pink-600,
.stu-adapt .bg-pink-700,
.stu-adapt .bg-sky-500,
.stu-adapt .bg-sky-600,
.stu-adapt .bg-sky-700,
.stu-adapt .bg-cyan-500,
.stu-adapt .bg-cyan-600,
.stu-adapt .bg-cyan-700,
.stu-adapt .bg-fuchsia-500,
.stu-adapt .bg-fuchsia-600,
.stu-adapt .bg-fuchsia-700,
.stu-adapt .bg-lime-500,
.stu-adapt .bg-lime-600,
.stu-adapt .bg-lime-700,
.stu-adapt .bg-blue-500 *,
.stu-adapt .bg-blue-600 *,
.stu-adapt .bg-blue-700 *,
.stu-adapt .bg-indigo-500 *,
.stu-adapt .bg-indigo-600 *,
.stu-adapt .bg-indigo-700 *,
.stu-adapt .bg-violet-500 *,
.stu-adapt .bg-violet-600 *,
.stu-adapt .bg-violet-700 *,
.stu-adapt .bg-purple-500 *,
.stu-adapt .bg-purple-600 *,
.stu-adapt .bg-purple-700 *,
.stu-adapt .bg-green-500 *,
.stu-adapt .bg-green-600 *,
.stu-adapt .bg-green-700 *,
.stu-adapt .bg-emerald-500 *,
.stu-adapt .bg-emerald-600 *,
.stu-adapt .bg-emerald-700 *,
.stu-adapt .bg-teal-500 *,
.stu-adapt .bg-teal-600 *,
.stu-adapt .bg-teal-700 *,
.stu-adapt .bg-red-500 *,
.stu-adapt .bg-red-600 *,
.stu-adapt .bg-red-700 *,
.stu-adapt .bg-rose-500 *,
.stu-adapt .bg-rose-600 *,
.stu-adapt .bg-rose-700 *,
.stu-adapt .bg-orange-500 *,
.stu-adapt .bg-orange-600 *,
.stu-adapt .bg-orange-700 *,
.stu-adapt .bg-amber-500 *,
.stu-adapt .bg-amber-600 *,
.stu-adapt .bg-amber-700 *,
.stu-adapt .bg-yellow-500 *,
.stu-adapt .bg-yellow-600 *,
.stu-adapt .bg-yellow-700 *,
.stu-adapt .bg-pink-500 *,
.stu-adapt .bg-pink-600 *,
.stu-adapt .bg-pink-700 *,
.stu-adapt .bg-sky-500 *,
.stu-adapt .bg-sky-600 *,
.stu-adapt .bg-sky-700 *,
.stu-adapt .bg-cyan-500 *,
.stu-adapt .bg-cyan-600 *,
.stu-adapt .bg-cyan-700 *,
.stu-adapt .bg-fuchsia-500 *,
.stu-adapt .bg-fuchsia-600 *,
.stu-adapt .bg-fuchsia-700 *,
.stu-adapt .bg-lime-500 *,
.stu-adapt .bg-lime-600 *,
.stu-adapt .bg-lime-700 *,
.stu-adapt [class*="bg-gradient-to"].text-white,.stu-adapt [class*="bg-gradient-to"] .text-white{
  color:#fff !important;
}
/* Page roots and panels that painted their own dark background */
.stu-adapt [style*="background: rgb(10, 15, 30)"]{background:transparent !important;}
.stu-adapt [style*="background: rgb(15, 20, 40)"],
.stu-adapt [style*="background: linear-gradient(rgb(15, 23, 41)"],
.stu-adapt [style*="background: linear-gradient(135deg, rgb(15, 23, 41)"]{background:var(--paper) !important;}

/* ── Brand colour: blue / indigo / violet accents become the landing-page green (all portal pages) ── */
.stu-main [style*="linear-gradient(135deg, rgb(99, 102, 241)"],
.stu-main [style*="linear-gradient(135deg, rgb(59, 130, 246)"],
.stu-main [style*="linear-gradient(135deg, rgb(139, 92, 246)"],
.stu-main .bg-blue-500,.stu-main .bg-blue-600,.stu-main .bg-indigo-500,.stu-main .bg-indigo-600,
.stu-main .bg-violet-600,.stu-main .bg-purple-600,
.stu-main [class*="from-blue-6"],.stu-main [class*="from-indigo-6"],.stu-main [class*="from-violet-6"],.stu-main [class*="from-purple-6"]{
  background:var(--accent) !important;color:#fff;
}
.stu-main .bg-green-500,.stu-main .bg-emerald-500,.stu-main .bg-teal-500,
.stu-main [style*="background: rgb(16, 185, 129)"],.stu-main [style*="background: rgb(34, 197, 94)"],
.stu-main [style*="linear-gradient(135deg, rgb(16, 185, 129)"]{background:var(--accent) !important;}
.stu-main .hover\\:bg-green-600:hover,.stu-main .hover\\:bg-emerald-600:hover{background:var(--accent-press) !important;}
.stu-main .hover\\:bg-blue-600:hover,.stu-main .hover\\:bg-blue-700:hover,.stu-main .hover\\:bg-indigo-700:hover{background:var(--accent-press) !important;}
.stu-main [style*="linear-gradient(135deg, rgba(99, 102, 241"],
.stu-main [style*="linear-gradient(135deg, rgba(59, 130, 246"],
.stu-main [style*="linear-gradient(135deg, rgba(139, 92, 246"],
.stu-main [style*="background: rgba(99, 102, 241"],.stu-main [style*="background: rgba(59, 130, 246"],
.stu-main .bg-blue-50,.stu-main .bg-blue-100,.stu-main .bg-indigo-50,.stu-main .bg-indigo-100{
  background:var(--accent-soft) !important;
}
.stu-main [style*="solid rgba(99, 102, 241"],.stu-main [style*="solid rgba(59, 130, 246"],
.stu-main .border-blue-100,.stu-main .border-blue-200,.stu-main .border-blue-300,.stu-main .border-indigo-200{
  border-color:#CFE5DA !important;
}
.stu-main .border-blue-500,.stu-main .border-blue-600,.stu-main .border-indigo-500,.stu-main .border-indigo-600,
.stu-main .focus\\:border-blue-500:focus{border-color:var(--accent) !important;}
.stu-main .text-blue-500,.stu-main .text-blue-600,.stu-main .text-blue-700,
.stu-main .text-indigo-500,.stu-main .text-indigo-600,.stu-main .text-indigo-700,
.stu-main [style*="color: rgb(99, 102, 241)"],.stu-main [style*="color: rgb(59, 130, 246)"],.stu-main [style*="color: rgb(37, 99, 235)"]{
  color:var(--accent-press) !important;
}
.stu-adapt [style*="color: rgb(165, 180, 252)"],.stu-adapt [style*="color: rgb(129, 140, 248)"],.stu-adapt .text-indigo-300,.stu-adapt .text-indigo-400,
.stu-adapt [style*="color: rgb(96, 165, 250)"],.stu-adapt .text-blue-300,.stu-adapt .text-blue-400{color:var(--accent-press) !important;}

/* Form fields */
.stu-adapt input,.stu-adapt textarea,.stu-adapt select{background:var(--paper) !important;color:var(--ink) !important;border-color:var(--field) !important;}
.stu-adapt input::placeholder,.stu-adapt textarea::placeholder{color:#9A9EA5 !important;}
.stu-adapt select option{background:#fff;color:var(--ink);}

/* ── Responsive ── */
@media (max-width: 860px){
  .stu-sidebar{position:fixed;inset:0 auto 0 0;transform:translateX(-100%);transition:transform .25s ease;box-shadow:0 20px 50px -20px rgba(21,23,26,.35);}
  .stu-sidebar.is-open{transform:none;}
  .stu-only-mobile{display:inline-flex;}
  .stu-topbar{padding:0 16px;}
  .stu-top-email{display:none;}
  .stu-main{padding:18px 16px;}
}
@media (max-width: 480px){
  .stu-chip{display:none;}
}
@media (prefers-reduced-motion: reduce){
  .stu-sidebar,.stu-nav-item,.stu-access-bar span{transition:none;}
}
`;
