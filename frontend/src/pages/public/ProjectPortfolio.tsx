// src/pages/public/ProjectPortfolio.tsx
// Public portfolio at /projects/:username — what a recruiter or college sees.
// Bento layout: intro, contact, certificate, experience, skills (logo marquee), links, education,
// then the work. Dark by default with a light theme switch. Motion: one load sequence,
// rotating skill in the headline, the skills marquee, a cursor glow on tiles, a gentle tilt on
// project cards and the contact dialog. All motion stops when the visitor prefers reduced motion.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

const API = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

/* ── helpers ─────────────────────────────────────────────────────── */
const monthYear = (d?: string) => {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};
const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
const toList = (v: any): string[] =>
  !v ? [] : (Array.isArray(v) ? v : String(v).split(',')).map((s: any) => String(s).trim()).filter(Boolean);

// Skill name → Simple Icons slug (logos load from cdn.simpleicons.org; unknown skills show a letter)
const ICONS: Record<string, string> = {
  python: 'python', javascript: 'javascript', js: 'javascript', typescript: 'typescript', ts: 'typescript',
  react: 'react', 'react.js': 'react', reactjs: 'react', 'next.js': 'nextdotjs', nextjs: 'nextdotjs', next: 'nextdotjs',
  'node.js': 'nodedotjs', nodejs: 'nodedotjs', node: 'nodedotjs', express: 'express', 'express.js': 'express',
  mongodb: 'mongodb', mysql: 'mysql', postgresql: 'postgresql', postgres: 'postgresql', sqlite: 'sqlite', redis: 'redis',
  html: 'html5', html5: 'html5', css: 'css', css3: 'css', sass: 'sass', tailwind: 'tailwindcss', 'tailwind css': 'tailwindcss', tailwindcss: 'tailwindcss',
  bootstrap: 'bootstrap', redux: 'redux', vue: 'vuedotjs', 'vue.js': 'vuedotjs', angular: 'angular', svelte: 'svelte',
  pandas: 'pandas', numpy: 'numpy', 'scikit-learn': 'scikitlearn', sklearn: 'scikitlearn', scikitlearn: 'scikitlearn',
  tensorflow: 'tensorflow', pytorch: 'pytorch', keras: 'keras', opencv: 'opencv', jupyter: 'jupyter', streamlit: 'streamlit',
  plotly: 'plotly', django: 'django', flask: 'flask', fastapi: 'fastapi',
  java: 'openjdk', c: 'c', 'c++': 'cplusplus', cpp: 'cplusplus', 'c#': 'dotnet', php: 'php', laravel: 'laravel', go: 'go', golang: 'go',
  rust: 'rust', kotlin: 'kotlin', swift: 'swift', dart: 'dart', flutter: 'flutter', android: 'android',
  git: 'git', github: 'github', gitlab: 'gitlab', docker: 'docker', kubernetes: 'kubernetes', linux: 'linux', ubuntu: 'ubuntu',
  firebase: 'firebase', supabase: 'supabase', vercel: 'vercel', netlify: 'netlify', render: 'render', postman: 'postman',
  figma: 'figma', canva: 'canva', wordpress: 'wordpress', graphql: 'graphql', prisma: 'prisma',
  npm: 'npm', vite: 'vite', webpack: 'webpack', jest: 'jest', 'three.js': 'threedotjs',
};
const iconFor = (s: string) => ICONS[s.toLowerCase()] || ICONS[s.toLowerCase().replace(/\s+/g, '')] || null;

const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ── styles ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Geist:wght@400;500;600&display=swap');
.pf{
  --display:'Bricolage Grotesque','Segoe UI',system-ui,sans-serif;
  --text:'Geist','Segoe UI',system-ui,-apple-system,sans-serif;
  --bg:#070b09; --tile:#0e1512; --tile-2:#121b17; --ink:#eef4f0; --muted:#9fb0a6; --faint:#62736a;
  --line:#1d2a24; --line-2:#2a3a33; --green:#3fd394; --green-2:#1fa870; --glow:rgba(63,211,148,.16);
  position:relative; z-index:1; isolation:isolate; min-height:100vh;
  background:var(--bg); color:var(--ink); font-family:var(--text); -webkit-font-smoothing:antialiased; overflow-x:hidden;
}
.pf[data-theme="light"]{
  --bg:#f4f7f5; --tile:#ffffff; --tile-2:#f7faf8; --ink:#10201a; --muted:#56675e; --faint:#8a988f;
  --line:#e1e8e4; --line-2:#cfdad4; --green:#0e7a53; --green-2:#0a5c3e; --glow:rgba(14,122,83,.10);
}
.pf *{box-sizing:border-box}
.pf :where(a){color:inherit}
.pf :focus-visible{outline:2px solid var(--green); outline-offset:3px; border-radius:8px}
.pf-wrap{max-width:1180px; margin:0 auto; padding:0 24px}

/* faint grid behind the top of the page */
.pf::before{content:''; position:fixed; inset:0; z-index:-1; pointer-events:none;
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:56px 56px; -webkit-mask-image:radial-gradient(ellipse at 50% 0%,#000 0%,transparent 70%); mask-image:radial-gradient(ellipse at 50% 0%,#000 0%,transparent 70%); opacity:.55}

/* top bar */
.pf-top{position:sticky; top:0; z-index:20; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  background:color-mix(in srgb,var(--bg) 78%,transparent); border-bottom:1px solid var(--line)}
.pf-top .pf-wrap{display:flex; align-items:center; justify-content:space-between; height:64px; gap:12px}
.pf-brand{display:inline-flex; align-items:center; gap:9px; text-decoration:none; font-family:var(--display); font-weight:800; font-size:17px}
.pf-brand i{width:28px; height:28px; border-radius:8px; background:var(--green); color:var(--bg); display:grid; place-items:center; font-style:normal; font-size:14px}
.pf-top-right{display:flex; align-items:center; gap:8px}
.pf-icon-btn{width:38px; height:38px; border-radius:10px; border:1px solid var(--line-2); background:var(--tile); color:var(--ink); display:grid; place-items:center; cursor:pointer}
.pf-icon-btn:hover{border-color:var(--green)}
.pf-pill{display:inline-flex; align-items:center; gap:8px; height:38px; padding:0 14px; border-radius:10px; font-size:14px; font-weight:600;
  border:1px solid var(--line-2); background:var(--tile); color:var(--ink); text-decoration:none; cursor:pointer; font-family:var(--text)}
.pf-pill:hover{border-color:var(--green)}
.pf .pf-pill-main{background:var(--green); border-color:var(--green); color:var(--bg)}
.pf .pf-pill-main:hover{background:var(--green-2); border-color:var(--green-2)}

/* hero headline */
.pf-hero{padding:72px 0 40px}
.pf-status{display:inline-flex; align-items:center; gap:10px; font-size:14px; color:var(--muted); margin-bottom:22px}
.pf-dot{width:9px; height:9px; border-radius:50%; background:var(--green); animation:pf-pulse 2.2s infinite}
@keyframes pf-pulse{0%{box-shadow:0 0 0 0 rgba(63,211,148,.55)}70%{box-shadow:0 0 0 10px rgba(63,211,148,0)}100%{box-shadow:0 0 0 0 rgba(63,211,148,0)}}
.pf-h1{font-family:var(--display); font-weight:800; letter-spacing:-.04em; line-height:.92; margin:0; font-size:clamp(46px,9vw,118px)}
.pf-h1-line2{display:flex; flex-wrap:wrap; align-items:baseline; gap:0 .28em; color:var(--muted)}
.pf-rot{position:relative; display:inline-grid; color:var(--green); min-width:2ch}
.pf-rot span{grid-area:1/1; white-space:nowrap}
.pf-rot .in{animation:pf-word-in .55s cubic-bezier(.2,.8,.2,1) both}
.pf-rot .out{animation:pf-word-out .45s cubic-bezier(.4,0,.6,1) both}
@keyframes pf-word-in{from{opacity:0; transform:translateY(.45em); filter:blur(6px)}to{opacity:1; transform:none; filter:none}}
@keyframes pf-word-out{from{opacity:1; transform:none}to{opacity:0; transform:translateY(-.45em); filter:blur(6px)}}
.pf-sub{max-width:58ch; font-size:18px; line-height:1.6; color:var(--muted); margin:26px 0 0}

/* bento */
.pf-bento{display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:14px; padding-bottom:64px}
.pf-tile{position:relative; grid-column:span 4; background:var(--tile); border:1px solid var(--line); border-radius:22px; padding:24px; overflow:hidden; --mx:50%; --my:50%}
.pf-tile::before{content:''; position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity .3s;
  background:radial-gradient(420px circle at var(--mx) var(--my),var(--glow),transparent 60%)}
.pf-tile:hover::before{opacity:1}
.pf-tile h2{font-family:var(--display); font-weight:700; font-size:20px; letter-spacing:-.02em; margin:0 0 14px}
.pf-tile p{margin:0}
.pf-span-4{grid-column:span 4} .pf-span-6{grid-column:span 6} .pf-span-8{grid-column:span 8} .pf-span-12{grid-column:span 12}
@media (max-width:960px){ .pf-tile.pf-span-4,.pf-tile.pf-span-6,.pf-tile.pf-span-8{grid-column:span 6} .pf-tile.pf-span-8{grid-column:span 12} }
@media (max-width:640px){ .pf-bento{grid-template-columns:1fr} .pf-bento .pf-tile{grid-column:auto} .pf-hero{padding:44px 0 28px} }

/* load sequence */
.pf-seq{opacity:0; transform:translateY(14px) scale(.985); animation:pf-rise .7s cubic-bezier(.2,.75,.2,1) forwards; animation-delay:calc(var(--i,0) * 70ms + 120ms)}
@keyframes pf-rise{to{opacity:1; transform:none}}

/* intro tile */
.pf-intro{display:grid; grid-template-columns:auto 1fr; gap:22px; align-items:center}
@media (max-width:640px){ .pf-intro{grid-template-columns:1fr} .pf-ticket-body{padding-right:96px} .pf-ticket::after{right:98px} .pf .pf-verify{width:72px; height:72px; right:14px} }
.pf-photo,.pf-initials{width:104px; height:104px; border-radius:26px; object-fit:cover; display:block}
.pf-initials{display:grid; place-items:center; background:linear-gradient(135deg,var(--green),var(--green-2)); color:var(--bg); font-family:var(--display); font-weight:800; font-size:38px}
.pf-intro-name{font-family:var(--display); font-weight:800; font-size:30px; letter-spacing:-.03em; margin:0 0 4px !important}
.pf-intro-role{color:var(--green); font-weight:600; margin:0 0 10px !important}
.pf-facts{display:flex; flex-wrap:wrap; gap:6px 16px; color:var(--muted); font-size:14px}
.pf-intro-actions{display:flex; flex-wrap:wrap; gap:8px; margin-top:18px}

/* contact tile */
.pf-mail{display:block; font-family:var(--display); font-weight:700; font-size:clamp(18px,2.1vw,24px); letter-spacing:-.02em; word-break:break-all; text-decoration:none; margin:6px 0 16px}
.pf-mail:hover{color:var(--green)}
.pf-mini{font-size:14px; color:var(--muted)}

/* certificate ticket */
.pf-tile.pf-ticket{background:linear-gradient(135deg,#1a8f5f,#0b4a33); color:#fff; border-color:transparent}
.pf[data-theme="light"] .pf-tile.pf-ticket{background:linear-gradient(135deg,#0e7a53,#0a5c3e)}
.pf-ticket::after{content:''; position:absolute; top:0; bottom:0; right:118px; border-left:2px dashed rgba(255,255,255,.3)}
.pf-ticket h2{color:#fff}
.pf-ticket-body{padding-right:120px}
.pf-ticket p{color:rgba(255,255,255,.85); font-size:14px; line-height:1.55}
.pf-ticket b{color:#fff; letter-spacing:.03em}
.pf .pf-verify{position:absolute; right:18px; top:50%; transform:translateY(-50%); z-index:1; display:grid; place-items:center; width:84px; height:84px; border-radius:50%;
  background:#fff; color:#0a5c3e; font-weight:700; font-size:13px; text-decoration:none; text-align:center; line-height:1.15; transition:transform .25s}
.pf .pf-verify:hover{transform:translateY(-50%) rotate(-8deg) scale(1.05)}

/* experience */
.pf-exp-row{display:flex; gap:14px; align-items:flex-start}
.pf-logo{width:44px; height:44px; flex:none; border-radius:12px; background:var(--green); color:var(--bg); display:grid; place-items:center; font-family:var(--display); font-weight:800}
.pf-exp-row h3{margin:0 0 3px; font-size:16px; font-weight:600}
.pf-exp-row p{color:var(--muted); font-size:14px}
.pf-chip{display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; padding:4px 10px; border-radius:999px; border:1px solid var(--line-2); color:var(--muted); margin-top:10px}
.pf-chip-on{color:var(--green); border-color:color-mix(in srgb,var(--green) 40%,transparent); background:color-mix(in srgb,var(--green) 10%,transparent)}

/* skills marquee */
.pf-marquee{position:relative; overflow:hidden; margin:0 -24px; display:grid; gap:6px;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent); mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
.pf-track{display:flex; gap:10px; width:max-content; padding:4px 0; animation:pf-slide var(--dur,32s) linear infinite}
.pf-track.rev{animation-direction:reverse}
.pf-marquee:hover .pf-track{animation-play-state:paused}
.pf-skills-tile{display:flex; flex-direction:column}
.pf-skills-tile .pf-marquee{flex:1; align-content:center}
@keyframes pf-slide{to{transform:translateX(-50%)}}
.pf-skill{display:inline-flex; align-items:center; gap:9px; height:44px; padding:0 16px; border-radius:12px; border:1px solid var(--line-2); background:var(--tile-2); font-size:14px; font-weight:500; white-space:nowrap}
.pf-skill img{width:20px; height:20px; display:block}
.pf-skill-letter{width:20px; height:20px; border-radius:6px; display:grid; place-items:center; font-size:11px; font-weight:700; background:var(--line-2); color:var(--ink)}

/* links tile */
.pf-links{display:grid; gap:8px}
.pf-link{display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 14px; border-radius:12px; border:1px solid var(--line); background:var(--tile-2); text-decoration:none; font-weight:500; font-size:15px}
.pf-link:hover{border-color:var(--green)}
.pf-link svg{transition:transform .2s; color:var(--muted)}
.pf-link:hover svg{transform:translate(2px,-2px); color:var(--green)}

/* education */
.pf-edu{display:grid; gap:14px}
.pf-edu h3{margin:0 0 2px; font-size:16px; font-weight:600}
.pf-edu p{color:var(--muted); font-size:14px}

/* work */
.pf-work-head{display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin:8px 0 20px}
.pf-h2{font-family:var(--display); font-weight:800; font-size:clamp(34px,5vw,56px); letter-spacing:-.035em; margin:0}
.pf-count{color:var(--faint); font-size:15px}
.pf-work{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; padding-bottom:72px; perspective:1200px}
@media (max-width:760px){ .pf-work{grid-template-columns:1fr} }
.pf-card{position:relative; border-radius:22px; border:1px solid var(--line); background:var(--tile); overflow:hidden; transform-style:preserve-3d; transition:transform .25s ease, border-color .25s}
.pf-card:hover{border-color:var(--line-2)}
.pf-card-media{aspect-ratio:16/9; position:relative; overflow:hidden; background:var(--tile-2)}
.pf-card-media img{width:100%; height:100%; object-fit:cover; display:block; transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.pf-card:hover .pf-card-media img{transform:scale(1.04)}
.pf-art{position:absolute; inset:0; display:grid; place-items:center; font-family:var(--display); font-weight:800; font-size:96px; letter-spacing:-.05em; color:var(--green);
  background:radial-gradient(circle at 30% 20%,color-mix(in srgb,var(--green) 22%,transparent),transparent 55%),
             repeating-linear-gradient(135deg,var(--tile-2) 0 14px,var(--tile) 14px 28px)}
.pf-badges{position:absolute; top:14px; left:14px; display:flex; gap:6px}
.pf-badge{font-size:12px; font-weight:700; padding:5px 10px; border-radius:999px; background:color-mix(in srgb,var(--bg) 70%,transparent); backdrop-filter:blur(8px); border:1px solid var(--line-2)}
.pf-badge-live{color:var(--green)}
.pf-card-body{padding:20px 22px 22px}
.pf-card-body h3{font-family:var(--display); font-weight:700; font-size:22px; letter-spacing:-.02em; margin:0 0 8px}
.pf-card-body p{color:var(--muted); font-size:15px; line-height:1.6; margin:0 0 14px}
.pf-stack{display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px}
.pf-stack span{font-size:12px; padding:4px 9px; border-radius:7px; border:1px solid var(--line); color:var(--muted)}
.pf-card-links{display:flex; flex-wrap:wrap; gap:8px}
.pf-empty-work{grid-column:1/-1; border:1px dashed var(--line-2); border-radius:22px; padding:36px; text-align:center; color:var(--muted)}

/* closing call to action */
.pf-cta{border-top:1px solid var(--line); padding:80px 0}
.pf-cta h2{font-family:var(--display); font-weight:800; letter-spacing:-.04em; line-height:.95; font-size:clamp(40px,7.5vw,96px); margin:0 0 26px; max-width:14ch}
.pf-foot{border-top:1px solid var(--line); padding:22px 0; color:var(--faint); font-size:14px}
.pf-foot .pf-wrap{display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px}
.pf-foot a{color:var(--green); font-weight:600; text-decoration:none}

/* contact dialog */
.pf-modal{position:fixed; inset:0; z-index:50; display:grid; place-items:center; padding:20px; background:rgba(0,0,0,.55); backdrop-filter:blur(6px); animation:pf-fade .2s ease both}
.pf-dialog{width:min(440px,100%); background:var(--tile); border:1px solid var(--line-2); border-radius:24px; padding:26px; animation:pf-pop .32s cubic-bezier(.2,.9,.25,1.15) both}
@keyframes pf-fade{from{opacity:0}to{opacity:1}}
@keyframes pf-pop{from{opacity:0; transform:translateY(12px) scale(.96)}to{opacity:1; transform:none}}
.pf-dialog-head{display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px}
.pf-dialog h2{font-family:var(--display); font-weight:800; font-size:26px; letter-spacing:-.03em; margin:0}
.pf-dialog .pf-mini{margin:0 0 18px}
.pf-opt{display:flex; align-items:center; gap:14px; width:100%; padding:14px; border-radius:14px; border:1px solid var(--line); background:var(--tile-2); color:var(--ink); text-decoration:none; text-align:left; cursor:pointer; font:inherit; margin-bottom:8px}
.pf-opt:hover{border-color:var(--green)}
.pf-opt-ic{width:40px; height:40px; flex:none; border-radius:11px; display:grid; place-items:center; background:color-mix(in srgb,var(--green) 14%,transparent); color:var(--green)}
.pf-opt b{display:block; font-weight:600; font-size:15px}
.pf-opt small{display:block; color:var(--muted); font-size:13px; margin-top:2px; word-break:break-all}

.pf-center{min-height:100vh; display:grid; place-items:center; text-align:center; padding:24px}
.pf-spin{width:34px; height:34px; border-radius:50%; border:3px solid var(--line-2); border-top-color:var(--green); animation:pf-spin .8s linear infinite}
@keyframes pf-spin{to{transform:rotate(360deg)}}

@media (prefers-reduced-motion: reduce){
  .pf *, .pf *::before, .pf *::after{animation:none !important; transition:none !important}
  .pf .pf-seq{opacity:1; transform:none}
}
`;

/* ── small icons ─────────────────────────────────────────────────── */
const svg = (d: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const Arrow = () => svg(<path d="M7 17 17 7M8 7h9v9" />);
const Sun = () => svg(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
const Moon = () => svg(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />);
const Mail = () => svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>);
const Chat = () => svg(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />);
const FileIc = () => svg(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>);
const CopyIc = () => svg(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>);
const Close = () => svg(<path d="M6 6l12 12M18 6 6 18" />);

/* ── pieces ──────────────────────────────────────────────────────── */
function RotatingWord({ words }: { words: string[] }) {
  const [state, setState] = useState<{ i: number; prev: number | null }>({ i: 0, prev: null });
  useEffect(() => {
    if (words.length < 2 || reduceMotion()) return;
    const t = setInterval(() => setState(s => ({ i: (s.i + 1) % words.length, prev: s.i })), 2400);
    return () => clearInterval(t);
  }, [words.length]);
  const { i, prev } = state;
  return (
    <span className="pf-rot">
      {prev !== null && prev !== i && <span key={`o${prev}-${i}`} className="out" aria-hidden="true">{words[prev]}</span>}
      <span key={`i${i}`} className="in">{words[i] || ''}</span>
    </span>
  );
}

function SkillChip({ name, iconColor }: { name: string; iconColor: string }) {
  const slug = iconFor(name);
  const [failed, setFailed] = useState(false);
  return (
    <span className="pf-skill">
      {slug && !failed
        ? <img src={`https://cdn.simpleicons.org/${slug}/${iconColor}`} alt="" loading="lazy" onError={() => setFailed(true)} />
        : <span className="pf-skill-letter" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}
      {name}
    </span>
  );
}

// Cursor glow on bento tiles
const glow = (e: MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

// Gentle 3D tilt on project cards (mouse only)
const tilt = (e: MouseEvent<HTMLElement>) => {
  if (reduceMotion() || !window.matchMedia?.('(pointer:fine)').matches) return;
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-3px)`;
};
const untilt = (e: MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = ''; };

/* ── page ────────────────────────────────────────────────────────── */
export function ProjectPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return localStorage.getItem('hx-portfolio-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch(`${API}/projects/u/${username}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => { try { localStorage.setItem('hx-portfolio-theme', theme); } catch { /* private mode */ } }, [theme]);

  useEffect(() => {
    if (!data?.user?.name) return;
    document.title = `${data.user.name} · ${data.student?.domain || 'Developer'} · Portfolio`;
  }, [data]);

  useEffect(() => {
    if (!contactOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContactOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contactOpen]);

  const derived = useMemo(() => {
    if (!data) return null;
    const { user, student = {}, projects = [], enrollment, certificate } = data;
    const name: string = user?.name || username || '';
    const skills = toList(student.skills);
    const role: string = student.domain || (enrollment?.domain_name ? `${enrollment.domain_name} intern` : 'Developer');
    const ordered = [...projects].sort((a: any, b: any) =>
      (Number(!!b.featured) - Number(!!a.featured)) || (Number(b.status === 'live') - Number(a.status === 'live')));
    const stackWords = Array.from(new Set<string>(projects.flatMap((p: any) => toList(p.techStack))));
    const words = (skills.length ? skills : stackWords).slice(0, 6);
    return {
      user, student, enrollment, certificate, name, skills, role, ordered,
      firstName: name.split(' ')[0],
      initials: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      words,
      education: Array.isArray(student.education) ? student.education : [],
      phone: student.phone ? String(student.phone).replace(/\D/g, '').slice(-10) : '',
    };
  }, [data, username]);

  const shell = (body: ReactNode) => (
    <div className="pf" data-theme={theme}><style>{CSS}</style>{body}</div>
  );

  if (loading) return shell(<div className="pf-center"><div className="pf-spin" role="status" aria-label="Loading portfolio" /></div>);
  if (notFound || !derived) return shell(
    <div className="pf-center">
      <div>
        <h1 className="pf-h1" style={{ fontSize: 'clamp(40px,7vw,72px)' }}>No portfolio here</h1>
        <p className="pf-sub" style={{ margin: '18px auto 26px' }}>There's no Hiresnix portfolio for @{username}. Check the link, or make your own.</p>
        <a className="pf-pill pf-pill-main" href="/auth">Make your portfolio</a>
      </div>
    </div>,
  );

  const { user, student, enrollment, certificate, name, skills, role, ordered, firstName, initials, words, education, phone } = derived;
  const iconColor = theme === 'dark' ? 'e8efe9' : '1a2a22';
  const half = Math.ceil(skills.length / 2);
  const rowA = skills.length > 5 ? skills.slice(0, half) : skills;
  const rowB = skills.length > 5 ? skills.slice(half) : [];
  const study = [student.department, student.college].filter(Boolean).join(', ');
  const internshipWhen = enrollment
    ? [monthYear(enrollment.startDate), enrollment.completedAt ? monthYear(enrollment.completedAt) : 'now'].filter(Boolean).join(' – ')
    : '';
  const links = [
    student.githubUrl && { label: 'GitHub', href: student.githubUrl },
    student.linkedinUrl && { label: 'LinkedIn', href: student.linkedinUrl },
    phone && { label: 'WhatsApp', href: `https://wa.me/91${phone}` },
    student.resumeUrl && { label: 'Résumé', href: student.resumeUrl },
  ].filter(Boolean) as { label: string; href: string }[];

  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(user.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* not allowed */ }
  };

  let order = 3; // position in the load sequence (0–2 are the headline)
  const tile = (span: string, extra = ''): { className: string; style: CSSProperties; onMouseMove: typeof glow } =>
    ({ className: `pf-tile pf-seq ${span} ${extra}`.trim(), style: { ['--i' as any]: order++ }, onMouseMove: glow });

  return shell(
    <>
      <header className="pf-top">
        <div className="pf-wrap">
          <a className="pf-brand" href="/" aria-label="Hiresnix home"><i aria-hidden="true">H</i>Hiresnix</a>
          <div className="pf-top-right">
            <button type="button" className="pf-icon-btn" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <button type="button" className="pf-pill pf-pill-main" onClick={() => setContactOpen(true)}>Get in touch</button>
          </div>
        </div>
      </header>

      <main className="pf-wrap">
        {/* Headline */}
        <section className="pf-hero">
          <div className="pf-status pf-seq" style={{ ['--i' as any]: 0 }}><span className="pf-dot" aria-hidden="true" />Open to internships and roles</div>
          <h1 className="pf-h1 pf-seq" style={{ ['--i' as any]: 1 }}>
            Hi, I'm {firstName}.
            {words.length
              ? <span className="pf-h1-line2">I work with <RotatingWord words={words} /></span>
              : <span className="pf-h1-line2">{/^[aeiou]/i.test(role) ? "I'm an" : "I'm a"} <span className="pf-rot">{role.toLowerCase()}</span></span>}
          </h1>
          {student.bio && <p className="pf-sub pf-seq" style={{ ['--i' as any]: 2 }}>{student.bio}</p>}
        </section>

        {/* Bento */}
        <section className="pf-bento" aria-label={`About ${name}`}>
          <div {...tile('pf-span-8')}>
            <div className="pf-intro">
              {student.profilePic
                ? <img className="pf-photo" src={student.profilePic} alt={name} />
                : <div className="pf-initials" aria-hidden="true">{initials}</div>}
              <div>
                <p className="pf-intro-name">{name}</p>
                <p className="pf-intro-role">{role}</p>
                <div className="pf-facts">
                  {study && <span>{study}{student.year ? `, year ${student.year}` : ''}</span>}
                  {student.location && <span>{student.location}</span>}
                </div>
                <div className="pf-intro-actions">
                  <button type="button" className="pf-pill pf-pill-main" onClick={() => setContactOpen(true)}>Get in touch</button>
                  {student.resumeUrl && <a className="pf-pill" href={student.resumeUrl} target="_blank" rel="noopener noreferrer">Download CV</a>}
                </div>
              </div>
            </div>
          </div>

          <div {...tile('pf-span-4')}>
            <h2>Say hello</h2>
            <a className="pf-mail" href={`mailto:${user.email}`}>{user.email}</a>
            <button type="button" className="pf-pill" onClick={copyEmail}><CopyIc /> {copied ? 'Copied' : 'Copy email'}</button>
          </div>

          {certificate && (
            <div {...tile('pf-span-6', 'pf-ticket')}>
              <div className="pf-ticket-body">
                <h2>Internship completion certificate</h2>
                <p>Issued by Hiresnix{certificate.domain_name ? ` for ${certificate.domain_name}` : ''}{certificate.issuedAt ? `, ${monthYear(certificate.issuedAt)}` : ''}.</p>
                <p style={{ marginTop: 10 }}>Certificate ID <b>{certificate.certificateNo}</b></p>
              </div>
              <a className="pf-verify" href={`https://hiresnix.co.in/verify/${certificate.certificateNo}`} target="_blank" rel="noopener noreferrer">Verify<br />it</a>
            </div>
          )}

          {enrollment && (
            <div {...tile(certificate ? 'pf-span-6' : 'pf-span-12')}>
              <h2>Experience</h2>
              <div className="pf-exp-row">
                <div className="pf-logo" aria-hidden="true">H</div>
                <div>
                  <h3>{enrollment.domain_name || 'Technology'} intern</h3>
                  <p>Hiresnix, remote{internshipWhen ? `, ${internshipWhen}` : ''}</p>
                  <span className={`pf-chip ${enrollment.status === 'Completed' ? 'pf-chip-on' : ''}`}>
                    {enrollment.status === 'Completed' ? 'Completed' : 'In progress'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div {...tile(links.length ? 'pf-span-8' : 'pf-span-12', 'pf-skills-tile')}>
              <h2>Skills and tools</h2>
              <div className="pf-marquee">
                <div className="pf-track" style={{ ['--dur' as any]: `${Math.max(18, rowA.length * 5)}s` }}>
                  {[...rowA, ...rowA, ...rowA, ...rowA].map((k, i) => <SkillChip key={`a${i}`} name={k} iconColor={iconColor} />)}
                </div>
                {rowB.length > 0 && (
                  <div className="pf-track rev" style={{ ['--dur' as any]: `${Math.max(18, rowB.length * 5)}s` }}>
                    {[...rowB, ...rowB, ...rowB, ...rowB].map((k, i) => <SkillChip key={`b${i}`} name={k} iconColor={iconColor} />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {links.length > 0 && (
            <div {...tile('pf-span-4')}>
              <h2>Find me on</h2>
              <div className="pf-links">
                {links.map(l => (
                  <a key={l.label} className="pf-link" href={l.href} target="_blank" rel="noopener noreferrer">{l.label} <Arrow /></a>
                ))}
              </div>
            </div>
          )}

          {(education.length > 0 || student.college) && (
            <div {...tile('pf-span-12')}>
              <h2>Education</h2>
              <div className="pf-edu">
                {education.length > 0 ? education.map((e: any, i: number) => (
                  <div key={i}>
                    <h3>{e.degree || e.course || 'Degree'}</h3>
                    <p>{[e.institution || e.college, e.year].filter(Boolean).join(', ')}</p>
                  </div>
                )) : (
                  <div>
                    <h3>{student.department || 'Engineering'}</h3>
                    <p>{[student.college, student.year ? `year ${student.year}` : '', student.cgpa ? `CGPA ${student.cgpa}` : ''].filter(Boolean).join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Work */}
        <section aria-labelledby="pf-work">
          <div className="pf-work-head">
            <h2 className="pf-h2" id="pf-work">Selected work</h2>
            {ordered.length > 0 && <span className="pf-count">{ordered.length} project{ordered.length > 1 ? 's' : ''}</span>}
          </div>
          <div className="pf-work">
            {ordered.length === 0 && <div className="pf-empty-work">{firstName}'s projects will show here once they're added.</div>}
            {ordered.map((p: any) => {
              const stack = toList(p.techStack);
              return (
                <article key={p.id} className="pf-card" onMouseMove={tilt} onMouseLeave={untilt}>
                  <div className="pf-card-media">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt="" loading="lazy" />
                      : <div className="pf-art" aria-hidden="true">{String(p.title || '?').trim().slice(0, 2)}</div>}
                    {(p.status === 'live' || p.featured) && (
                      <div className="pf-badges">
                        {p.status === 'live' && <span className="pf-badge pf-badge-live">● Live</span>}
                        {p.featured && <span className="pf-badge">Featured</span>}
                      </div>
                    )}
                  </div>
                  <div className="pf-card-body">
                    <h3>{p.title}</h3>
                    {p.description && <p>{p.description}</p>}
                    {stack.length > 0 && <div className="pf-stack">{stack.map(t => <span key={t}>{t}</span>)}</div>}
                    {(p.liveUrl || p.githubUrl) && (
                      <div className="pf-card-links">
                        {p.liveUrl && <a className="pf-pill pf-pill-main" href={p.liveUrl} target="_blank" rel="noopener noreferrer" title={host(p.liveUrl)}>View live <Arrow /></a>}
                        {p.githubUrl && <a className="pf-pill" href={p.githubUrl} target="_blank" rel="noopener noreferrer">Source code</a>}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Closing */}
      <section className="pf-cta">
        <div className="pf-wrap">
          <h2>Have a role or project for {firstName}?</h2>
          <button type="button" className="pf-pill pf-pill-main" style={{ height: 48, padding: '0 22px', fontSize: 15 }} onClick={() => setContactOpen(true)}>Get in touch</button>
        </div>
      </section>

      <footer className="pf-foot">
        <div className="pf-wrap">
          <span>Portfolio made on Hiresnix</span>
          <a href="/auth">Make yours, it's free</a>
        </div>
      </footer>

      {/* Contact dialog */}
      {contactOpen && (
        <div className="pf-modal" onClick={() => setContactOpen(false)}>
          <div className="pf-dialog" role="dialog" aria-modal="true" aria-labelledby="pf-contact-title" onClick={e => e.stopPropagation()}>
            <div className="pf-dialog-head">
              <h2 id="pf-contact-title">Get in touch</h2>
              <button ref={closeRef} type="button" className="pf-icon-btn" onClick={() => setContactOpen(false)} aria-label="Close"><Close /></button>
            </div>
            <p className="pf-mini">Pick how you'd like to reach {firstName}.</p>
            <a className="pf-opt" href={`mailto:${user.email}`}>
              <span className="pf-opt-ic"><Mail /></span>
              <span><b>Email</b><small>{user.email}</small></span>
            </a>
            <button type="button" className="pf-opt" onClick={copyEmail}>
              <span className="pf-opt-ic"><CopyIc /></span>
              <span><b>{copied ? 'Email copied' : 'Copy email address'}</b><small>Paste it into any mail app</small></span>
            </button>
            {phone && (
              <a className="pf-opt" href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer">
                <span className="pf-opt-ic"><Chat /></span>
                <span><b>WhatsApp</b><small>Send a message</small></span>
              </a>
            )}
            {student.resumeUrl && (
              <a className="pf-opt" href={student.resumeUrl} target="_blank" rel="noopener noreferrer">
                <span className="pf-opt-ic"><FileIc /></span>
                <span><b>Download CV</b><small>Opens in a new tab</small></span>
              </a>
            )}
          </div>
        </div>
      )}
    </>,
  );
}