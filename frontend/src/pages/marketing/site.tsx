// src/pages/marketing/site.tsx
// Shared building blocks for the public marketing site: the landing page and the
// Services, AI solutions, Work, Products, Internships and Contact pages.
// Holds the content, the nav + footer layout (SiteLayout), every section and the styles.
// Business services come first; internships and the AI Academy sit lower on the page.
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../../api/client';
import { HiresnixChatbot } from '../../components/HiresnixChatbot';

const ENQUIRY_RESPONSE_TIMEOUT_MS = 8000;
const INTEREST_OPTIONS = ['Software Development', 'AI Solutions', 'SaaS Product', 'Web Development', 'Mobile App', 'UI/UX Design', 'Internship Platform', 'Partnership', 'Other'];

// ── Content ─────────────────────────────────────────────────────────
// Project paths are the real three-stage projects interns build on the platform.
const DOMAINS = [
  { id: 'fullstack', name: 'Full stack development', blurb: 'Build complete web apps with React, Node.js and PostgreSQL.',
    projects: [
      ['Personal Task Manager App', 'React.js, Node.js, MySQL, JWT'],
      ['Job Application Tracker', 'React.js, Node.js, PostgreSQL, Chart.js'],
      ['Multi-Tenant Project Management SaaS', 'React.js, Node.js, PostgreSQL, Socket.io, Stripe'],
    ] },
  { id: 'frontend', name: 'Front end development', blurb: 'Build fast, responsive interfaces in React.',
    projects: [
      ['Personal Portfolio Website', 'React.js, CSS3, EmailJS'],
      ['Job Board UI with Filters', 'React.js, Tailwind CSS, Context API'],
      ['Real-Time Collaborative Notes App', 'React.js, Socket.io, Tailwind, Quill.js'],
    ] },
  { id: 'datascience', name: 'Data science', blurb: 'Clean real datasets, find patterns and forecast what comes next.',
    projects: [
      ['COVID-19 India State Analysis', 'Python, Pandas, Plotly, Geopandas'],
      ['Indian Stock Market EDA & Forecast', 'Python, Pandas, yfinance, Prophet'],
      ['Social Mobility & Income Inequality Study', 'Python, Pandas, Geopandas, Scikit-learn'],
    ] },
  { id: 'analytics', name: 'Data analytics', blurb: 'Turn business data into reports and dashboards people use.',
    projects: [
      ['Superstore Sales Performance Report', 'Python, Pandas, Plotly, Power BI'],
      ['Retail Store Footfall Insights', 'Python, Pandas, Plotly, Power BI'],
      ['Real-Time Sales Command Center', 'Python, Streamlit, Plotly, SQL'],
    ] },
  { id: 'ml', name: 'Machine learning', blurb: 'Train models, measure them and ship them as working apps.',
    projects: [
      ['Iris Flower Species Classifier', 'Python, Scikit-learn, Pandas'],
      ['Crop Yield Prediction System', 'Python, XGBoost, Pandas, Streamlit'],
      ['Real-Time Pose Estimation Trainer', 'Python, MediaPipe, TensorFlow, Flask'],
    ] },
  { id: 'ai', name: 'Artificial intelligence', blurb: 'Build products on top of LLMs, agents and retrieval.',
    projects: [
      ['AI Recipe Generator from Ingredients', 'Python, Gemini API, Streamlit'],
      ['Agentic Research Assistant', 'Python, LangChain, Streamlit'],
      ['RAG Chatbot on Custom Knowledge Base', 'Python, LangChain, ChromaDB, Gemini API'],
    ] },
  { id: 'security', name: 'Cyber security', blurb: 'Scan, test and write up real security findings.',
    projects: [
      ['Network Vulnerability Scanner', 'Python, Nmap, Flask'],
      ['Password Strength Analyzer & Generator', 'Python, Flask, zxcvbn, React'],
      ['Web Application Penetration Testing Report', 'OWASP ZAP, Burp Suite'],
    ] },
  { id: 'cloud', name: 'Cloud & DevOps', blurb: 'Deploy, scale and recover applications on AWS.',
    projects: [
      ['Static Site Hosting with CDN on AWS', 'AWS S3, CloudFront, Route53'],
      ['Containerized Microservices on AWS', 'Docker, AWS ECS, ECR, ALB'],
      ['Multi-Region Disaster Recovery Setup', 'AWS Route53, RDS, S3, CloudFormation'],
    ] },
];
const LEVELS = ['Starter', 'Intermediate', 'Advanced'];

const INTERN_STEPS = [
  ['Apply', 'Create a student account, pick a domain and choose 1 to 6 months.'],
  ['Get your offer letter', 'Download it from your dashboard once you are enrolled.'],
  ['Build and log your work', 'Complete your three projects and submit a short daily log.'],
  ['Finish with proof', 'Download your certificate and letter of recommendation. Each has a QR code that opens our verification page.'],
];

const ACADEMY_COURSES = ['Python Programming', 'JavaScript', 'Java', 'C++', 'C Programming', 'DSA', 'SQL & Databases', 'Full Stack Web Dev', 'React.js', 'Node.js & Express', 'Data Science', 'Machine Learning', 'Git & GitHub', 'Docker & DevOps', 'Cybersecurity', 'Flutter & Dart'];

const SERVICES = [
  ['Custom software', 'End-to-end software built for your exact business needs, from architecture to deployment.'],
  ['Web development', 'Fast, responsive and scalable web applications on modern frameworks.'],
  ['Mobile apps', 'Cross-platform apps that work smoothly on iOS and Android.'],
  ['AI & machine learning', 'NLP, predictive models and AI features built into your product.'],
  ['SaaS platforms', 'Multi-tenant products with subscriptions, dashboards and room to scale.'],
  ['UI/UX design', 'Wireframes, prototypes and interfaces designed to convert.'],
  ['APIs & integrations', 'REST and GraphQL APIs built for performance, security and third-party use.'],
  ['Cloud & DevOps', 'Cloud architecture, migration and deployment pipelines you can rely on.'],
  ['Maintenance & support', 'Monitoring, fixes and new features after launch.'],
];

const AI_CAPABILITIES = [
  ['Assistants on your own data', 'Chatbots that answer from your documents, policies and product data instead of guessing.', 'We run AI teachers and interview coaches in our own products.'],
  ['Scoring and prediction', 'Models that rank leads, forecast demand or flag risk, built into the tools your team already uses.', 'AI lead scoring for Focktix tripled lead conversion.'],
  ['Document and resume processing', 'Read, classify and extract data from PDFs, forms and resumes automatically.', 'Resume parsing and ranking for hiring workflows.'],
  ['Workflow automation', 'Agents that take repetitive multi-step work off your team, with a human approving what matters.', 'Built on LangChain, Groq and Gemini.'],
];

const PROCESS = ['Requirements', 'Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Support'];

const NDA_CLIENTS = ['Digital marketing agency', 'E-commerce platform', 'HR tech startup', 'Mobile app company', 'EdTech platform'];

// SEO structured data (unchanged business details)
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization', '@id': 'https://hiresnix.co.in/#organization', name: 'Hiresnix',
      legalName: 'SR Patil Infrastructure Private Limited', url: 'https://hiresnix.co.in', logo: 'https://hiresnix.co.in/hiresnix-logo.png',
      contactPoint: { '@type': 'ContactPoint', telephone: '+91-9529120977', contactType: 'customer service', email: 'hr@hiresnix.co.in', areaServed: 'IN', availableLanguage: ['English', 'Hindi'] },
      address: { '@type': 'PostalAddress', addressLocality: 'Shirpur', addressRegion: 'Maharashtra', postalCode: '425405', addressCountry: 'IN' },
      sameAs: ['https://www.instagram.com/hiresnix/', 'https://www.linkedin.com/company/hiresnix/'],
    },
    { '@type': 'WebSite', '@id': 'https://hiresnix.co.in/#website', url: 'https://hiresnix.co.in', name: 'Hiresnix',
      description: 'AI-powered software development company building web, mobile and AI products for businesses', publisher: { '@id': 'https://hiresnix.co.in/#organization' } },
    { '@type': 'SoftwareApplication', name: 'Hiresnix Platform', applicationCategory: 'EducationApplication', operatingSystem: 'Web', url: 'https://hiresnix.co.in',
      description: 'AI-powered career platform offering internships, mock interviews, resume builder and AI academy for students',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, provider: { '@id': 'https://hiresnix.co.in/#organization' } },
  ],
};

const parseList = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string' || !v.trim()) return [];
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
};

// ── Motion helpers ─────────────────────────────────────────────────
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Reveals every [data-reveal] element once, the first time it scrolls into view. */
function useScrollReveal(deps: any[] = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.hx-root [data-reveal]:not(.is-in)'));
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Counts a figure like "50+" or "500+" up from zero when it first becomes visible. */
function CountUp({ value }: { value: string }) {
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : '';
  const ref = React.useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const duration = 1200;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setShown(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">{shown === null ? value : `${shown}${suffix}`}</span>
    </span>
  );
}

// ── Brand mark (arrow rising to a dot, as in the logo) ──────────────
function BrandMark() {
  return (
    <span className="hx-brand" aria-label="Hiresnix">
      <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
        <path d="M1 22 C 10 21, 17 16, 21 7" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <path d="M15 8 L22 4.5 L23.5 12.5" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27" cy="3" r="2.6" fill="var(--accent)" />
      </svg>
      <span className="hx-brand-word">HIRESNIX</span>
    </span>
  );
}

// ── Social links ───────────────────────────────────────────────────
const SOCIAL = [
  {
    name: 'Instagram', href: 'https://www.instagram.com/hiresnix/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn', href: 'https://www.linkedin.com/company/hiresnix/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11.25H3zM9.5 9.75h3.83v1.54h.05c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13V21h-4v-4.98c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.92 1.3-1.92 2.63V21h-4z" />
      </svg>
    ),
  },
];

function SocialLinks() {
  return (
    <ul className="hx-social" aria-label="Hiresnix on social media">
      {SOCIAL.map(s => (
        <li key={s.name}>
          <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Hiresnix on ${s.name}`} title={s.name}>
            {s.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}

// ── Hero scene: an interactive, video-like animation of the Hiresnix arrow ──
// A light pulse travels up the brand curve, lighting each project stage as it passes.
// Visitors can pause it, drag the progress bar to scrub through it, and move the
// pointer to tilt the floating service tags. Respects reduced-motion settings.
const SCENE_PATH = 'M44 404 C 250 400, 420 296, 492 108';
const SCENE_STOPS = [
  { f: 0.1, label: 'Discovery', sub: 'Goals and scope', dx: -4, dy: -44, anchor: 'start' as const },
  { f: 0.42, label: 'Design', sub: 'Screens you approve', dx: -18, dy: -44, anchor: 'end' as const },
  { f: 0.69, label: 'Build', sub: 'AI where it helps', dx: -20, dy: -40, anchor: 'end' as const },
  { f: 0.9, label: 'Launch', sub: 'Then ongoing support', dx: -22, dy: -34, anchor: 'end' as const },
];
// UI/UX terms shown as floating tags; each lights up when its project stage is reached
const SCENE_TAGS = [
  { text: 'User research', x: 5, y: 7, depth: 22, stage: 0 },
  { text: 'User flows', x: 27, y: 16, depth: 30, stage: 0 },
  { text: 'Wireframes', x: 4, y: 25, depth: 16, stage: 1 },
  { text: 'Prototyping', x: 22, y: 36, depth: 34, stage: 1 },
  { text: 'Design system', x: 64, y: 70, depth: 26, stage: 2 },
  { text: 'Usability testing', x: 40, y: 86, depth: 18, stage: 3 },
];
const SCENE_DRAW_MS = 5200;
const SCENE_HOLD_MS = 2400;
const SCENE_CYCLE_MS = SCENE_DRAW_MS + SCENE_HOLD_MS;
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

function HeroScene() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const glowRef = React.useRef<SVGPathElement>(null);
  const coreRef = React.useRef<SVGPathElement>(null);
  const pulseRef = React.useRef<SVGGElement>(null);
  const rangeRef = React.useRef<HTMLInputElement>(null);
  const msRef = React.useRef(0);
  const playingRef = React.useRef(true);
  const visibleRef = React.useRef(true);
  const [stops, setStops] = useState<{ x: number; y: number }[] | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => { playingRef.current = playing; }, [playing]);

  // Positions of the four stages along the curve
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    setStops(SCENE_STOPS.map(s => { const p = path.getPointAtLength(len * s.f); return { x: p.x, y: p.y }; }));
  }, []);

  // Draws the scene for a moment in the cycle (0 … SCENE_CYCLE_MS)
  const paint = React.useCallback((ms: number) => {
    const path = pathRef.current, root = rootRef.current;
    if (!path || !root) return;
    const p = Math.min(1, ms / SCENE_DRAW_MS);
    const e = easeInOut(p);
    const pt = path.getPointAtLength(path.getTotalLength() * e);
    const offset = String(1 - e);
    if (glowRef.current) glowRef.current.style.strokeDashoffset = offset;
    if (coreRef.current) coreRef.current.style.strokeDashoffset = offset;
    if (pulseRef.current) {
      pulseRef.current.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      pulseRef.current.style.opacity = p < 1 && p > 0 ? '1' : '0';
    }
    root.querySelectorAll<SVGGElement>('.hx-scene-stop').forEach((g, i) => {
      g.classList.toggle('is-on', e >= SCENE_STOPS[i].f - 0.004);
    });
    root.querySelectorAll<HTMLLIElement>('.hx-scene-tags li').forEach((li, i) => {
      li.classList.toggle('is-on', e >= SCENE_STOPS[SCENE_TAGS[i].stage].f - 0.004);
    });
    root.classList.toggle('is-launched', p >= 1);
    if (rangeRef.current) rangeRef.current.value = String(Math.round((ms / SCENE_CYCLE_MS) * 1000));
  }, []);

  // Animation loop
  useEffect(() => {
    if (!stops) return;
    if (prefersReducedMotion()) {
      msRef.current = SCENE_DRAW_MS;
      setPlaying(false);
      paint(msRef.current);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (playingRef.current && visibleRef.current && !document.hidden) {
        msRef.current = (msRef.current + dt) % SCENE_CYCLE_MS;
      }
      paint(msRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Pause automatically while the hero is off screen
    let io: IntersectionObserver | undefined;
    if (rootRef.current && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => { visibleRef.current = entry.isIntersecting; }, { threshold: 0.05 });
      io.observe(rootRef.current);
    }
    return () => { cancelAnimationFrame(raf); io?.disconnect(); };
  }, [stops, paint]);

  const onScrub = (e: React.FormEvent<HTMLInputElement>) => {
    msRef.current = (Number(e.currentTarget.value) / 1000) * SCENE_CYCLE_MS;
    setPlaying(false);
    paint(msRef.current);
  };

  // Pointer tilt for the floating tags
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion() || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--mx', '0');
    e.currentTarget.style.setProperty('--my', '0');
  };

  return (
    <div className="hx-scene" ref={rootRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div className="hx-scene-stage">
        <svg className="hx-scene-svg" viewBox="0 0 560 460" role="img" aria-label="How a project moves: discovery, design, build, launch and support">
          <defs>
            <pattern id="hx-scene-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(255,255,255,.11)" />
            </pattern>
            <radialGradient id="hx-scene-pulse">
              <stop offset="0" stopColor="#E9FFF5" />
              <stop offset=".35" stopColor="#4FD1A0" />
              <stop offset="1" stopColor="#4FD1A0" stopOpacity="0" />
            </radialGradient>
            <filter id="hx-scene-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
          </defs>
          <rect width="560" height="460" fill="url(#hx-scene-grid)" />

          {/* Track, glow and lit core of the curve */}
          <path ref={pathRef} d={SCENE_PATH} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="5" strokeLinecap="round" />
          <path ref={glowRef} d={SCENE_PATH} pathLength={1} fill="none" stroke="#4FD1A0" strokeWidth="16" strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1" opacity=".45" filter="url(#hx-scene-blur)" />
          <path ref={coreRef} d={SCENE_PATH} pathLength={1} fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1" />

          {/* Arrow head and the brand's green dot, shown once the project "launches" */}
          <g className="hx-scene-finish">
            <path d="M462 126 L496 100 L502 142" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle className="hx-scene-ring" cx="520" cy="72" r="12" fill="none" stroke="#4FD1A0" strokeWidth="2" />
            <circle cx="520" cy="72" r="12" fill="#4FD1A0" />
          </g>

          {/* Stages */}
          {stops && SCENE_STOPS.map((s, i) => (
            <g key={s.label} className="hx-scene-stop" transform={`translate(${stops[i].x} ${stops[i].y})`}>
              <circle className="hx-scene-halo" r="16" fill="#4FD1A0" opacity="0" />
              <circle className="hx-scene-node" r="7.5" strokeWidth="3" />
              <g className="hx-scene-text">
                <text x={s.dx} y={s.dy} textAnchor={s.anchor} className="hx-scene-label">{s.label}</text>
                <text x={s.dx} y={s.dy} dy="1.35em" textAnchor={s.anchor} className="hx-scene-sub">{s.sub}</text>
              </g>
            </g>
          ))}

          {/* Moving light */}
          <g ref={pulseRef} style={{ opacity: 0 }}>
            <circle r="26" fill="url(#hx-scene-pulse)" />
            <circle r="5" fill="#FFFFFF" />
          </g>
        </svg>

        <ul className="hx-scene-tags" aria-hidden="true">
          {SCENE_TAGS.map(t => (
            <li key={t.text} style={{ left: `${t.x}%`, top: `${t.y}%`, ['--depth' as any]: t.depth }}>
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hx-scene-controls">
        <button
          type="button" className="hx-scene-play" onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Pause animation' : 'Play animation'} aria-pressed={!playing}
        >
          {playing
            ? <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1.5" width="3.4" height="11" rx="1" fill="currentColor" /><rect x="8.6" y="1.5" width="3.4" height="11" rx="1" fill="currentColor" /></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.8 L12 7 L3 12.2 Z" fill="currentColor" /></svg>}
        </button>
        <input
          ref={rangeRef} className="hx-scene-range" type="range" min={0} max={1000} step={1} defaultValue={0}
          aria-label="Animation progress" onInput={onScrub} onChange={() => {}}
        />
      </div>
    </div>
  );
}

// ── Domain explorer ────────────────────────────────────────────────
function DomainExplorer({ onApply }: { onApply: () => void }) {
  const [active, setActive] = useState(DOMAINS[0].id);
  const domain = DOMAINS.find(d => d.id === active) || DOMAINS[0];

  const onKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const next = DOMAINS[(idx + dir + DOMAINS.length) % DOMAINS.length];
    setActive(next.id);
    document.getElementById(`hx-tab-${next.id}`)?.focus();
  };

  return (
    <div className="hx-explorer">
      <div className="hx-tabs" role="tablist" aria-label="Internship domains" aria-orientation="vertical">
        {DOMAINS.map((d, i) => (
          <button
            key={d.id} id={`hx-tab-${d.id}`} role="tab" type="button"
            aria-selected={d.id === active} aria-controls="hx-domain-panel" tabIndex={d.id === active ? 0 : -1}
            className="hx-tab" onClick={() => setActive(d.id)} onKeyDown={e => onKey(e, i)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <div className="hx-panel" id="hx-domain-panel" role="tabpanel" aria-labelledby={`hx-tab-${domain.id}`} key={domain.id}>
        <h3 className="hx-panel-title">{domain.name}</h3>
        <p className="hx-panel-blurb">{domain.blurb}</p>
        <p className="hx-panel-note">Projects interns in this domain have built:</p>
        <ol className="hx-ladder">
          {domain.projects.map(([title, tech], i) => (
            <li key={title} className="hx-rung" style={{ ['--i' as any]: i }}>
              <span className="hx-rung-level">{LEVELS[i]}</span>
              <span className="hx-rung-title">{title}</span>
              <span className="hx-rung-tech">{tech}</span>
            </li>
          ))}
        </ol>
        <button className="hx-btn hx-btn-primary" type="button" onClick={onApply}>Apply for {domain.name.toLowerCase()}</button>
      </div>
    </div>
  );
}

// ── Client marquee ─────────────────────────────────────────────────
type ClientChip = { name: string; industry: string; nda: boolean };

function ClientMarquee({ clients }: { clients: ClientChip[] }) {
  if (!clients.length) return null;
  // Repeat the list until one copy is wide enough to fill the screen, then render it twice for a seamless loop
  let row = [...clients];
  while (row.length < 10) row = [...row, ...clients];
  const seconds = Math.max(30, row.length * 4);

  const chip = (c: ClientChip, i: number) => (
    <li key={i} className={`hx-chip${c.nda ? ' hx-chip-nda' : ''}${i >= clients.length ? ' hx-chip-repeat' : ''}`}>
      <span className="hx-chip-mark" aria-hidden="true">
        {c.nda
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          : c.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="hx-chip-text">
        <span className="hx-chip-name">{c.nda ? c.industry : c.name}</span>
        <span className="hx-chip-meta">{c.nda ? 'Under NDA' : c.industry}</span>
      </span>
    </li>
  );

  return (
    <div className="hx-marquee" style={{ ['--hx-marquee-time' as any]: `${seconds}s` }}>
      <div className="hx-marquee-track">
        <ul className="hx-marquee-list">{row.map(chip)}</ul>
        <ul className="hx-marquee-list" aria-hidden="true">{row.map(chip)}</ul>
      </div>
    </div>
  );
}

// ── Enquiry form (same submission behaviour as before) ─────────────
function EnquiryForm({ presetInterest }: { presetInterest: string }) {
  const empty = { name: '', email: '', phone: '', interest: 'Software Development', message: '' };
  const [form, setForm] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (presetInterest) setForm(p => ({ ...p, interest: presetInterest })); }, [presetInterest]);
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const request = client.post('/public/enquiry', form);
      const timeout = new Promise<{ data: { success: true; message: string; timedOut: true } }>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve({ data: { success: true, message: 'Enquiry received. Our team will get back to you shortly.', timedOut: true } });
        }, ENQUIRY_RESPONSE_TIMEOUT_MS);
      });
      const { data } = await Promise.race([request, timeout]);
      if (data.success) { setSubmitted(true); toast.success(data.message || 'Enquiry sent successfully!'); }
      else { toast.error('Failed to send enquiry. Please try again.'); }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send enquiry. Please try again.');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="hx-form hx-form-done" role="status">
      <h3 className="hx-h3">Message received</h3>
      <p className="hx-muted">Thank you. Our team will get back to you within 24 hours.</p>
      <button className="hx-btn hx-btn-ghost" type="button" onClick={() => { setSubmitted(false); setForm(empty); }}>Send another message</button>
    </div>
  );

  return (
    <form className="hx-form" onSubmit={handleSubmit}>
      <div className="hx-form-grid">
        <label className="hx-field">
          <span>Full name</span>
          <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" autoComplete="name" />
        </label>
        <label className="hx-field">
          <span>Email</span>
          <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="hx-field">
          <span>Phone <em>(optional)</em></span>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Mobile number" autoComplete="tel" />
        </label>
        <label className="hx-field">
          <span>Interested in</span>
          <select value={form.interest} onChange={e => set('interest', e.target.value)}>
            {INTEREST_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      </div>
      <label className="hx-field">
        <span>Message</span>
        <textarea required rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Tell us about your project or requirement" />
      </label>
      <button type="submit" disabled={loading} className="hx-btn hx-btn-primary hx-btn-block">
        {loading ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

// ── Section headings (shared by the landing page sections and each page's header) ──
export const SECTION_COPY = {
  services: { title: 'What we build', lead: 'One team for the whole job: product design, engineering, AI and the support that keeps it running.' },
  ai: { title: 'AI that does real work', lead: "We add AI where it saves your team time or makes you money, and we tell you plainly when it won't." },
  work: { title: 'Client work', lead: 'Software we have delivered for growing businesses across India.' },
  products: { title: 'Products we run', lead: 'We build and operate our own AI products too, so the tools we recommend are ones we use every day.' },
  internships: {
    title: 'Internships',
    lead: 'We train developers on the same kind of work we ship for clients. Choose a domain and a duration from 1 to 6 months, build three projects that get harder as you go, and finish with documents anyone can verify.',
  },
  contact: { title: 'Start a project', lead: 'Tell us what you need built. We reply within 24 hours.' },
};

// ── Site navigation: each item has its own page ──────────────────────
export const NAV_PAGES: { to: string; label: string }[] = [
  { to: '/services', label: 'Services' },
  { to: '/ai-solutions', label: 'AI solutions' },
  { to: '/work', label: 'Work' },
  { to: '/products', label: 'Products' },
  { to: '/internships', label: 'Internships' },
  { to: '/contact', label: 'Contact' },
];

/** Link to the contact page with the "Interested in" field pre-selected */
export const contactPath = (interest = 'Software Development') => `/contact?interest=${encodeURIComponent(interest)}`;

// ── Client data (case studies managed from the admin panel) ─────────
export function useSiteClients() {
  const [landingClients, setLandingClients] = useState<any[]>([]);
  useEffect(() => {
    client.get('/clients')
      .then(r => setLandingClients(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {});
  }, []);
  const publicClients = landingClients.filter((c: any) => !c.nda_protected);
  const ndaClients: string[] = [...NDA_CLIENTS, ...landingClients.filter((c: any) => c.nda_protected).map((c: any) => c.industry || 'NDA client')];
  // Every client for the scrolling strip: Focktix, clients added in the admin panel, then NDA clients
  const allClients: ClientChip[] = [
    { name: 'Focktix Limited', industry: 'Digital marketing', nda: false },
    ...publicClients.filter((c: any) => c?.name).map((c: any) => ({ name: String(c.name), industry: c.industry || 'Client', nda: false })),
    ...ndaClients.map(industry => ({ name: industry, industry, nda: true })),
  ];
  return { landingClients, publicClients, ndaClients, allClients };
}

/** Smooth-scrolls to a section on the current page */
export const scrollToId = (id: string) => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

// ── Layout: nav, footer, styles, copy protection, chatbot ───────────
type SiteLayoutProps = {
  children: React.ReactNode;
  /** Browser tab title; the site default is used when omitted */
  title?: string;
  /** Changes when late-loading content appears, so scroll-reveal picks it up */
  revealKey?: unknown;
  /** What "Start a project" in the nav does; defaults to opening the contact page */
  onStartProject?: () => void;
};

export function SiteLayout({ children, title, revealKey, onStartProject }: SiteLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the existing copy/right-click protection on the marketing pages
  useEffect(() => {
    const preventDefault = (event: Event) => event.preventDefault();
    const preventCopyShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ['a', 'c', 's', 'u', 'p'].includes(key)) event.preventDefault();
    };
    document.body.classList.add('lp-readonly');
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('keydown', preventCopyShortcuts);
    return () => {
      document.body.classList.remove('lp-readonly');
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('keydown', preventCopyShortcuts);
    };
  }, []);

  // Each page opens at the top, with its own tab title
  useEffect(() => {
    setMenuOpen(false);
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);

  useScrollReveal([location.pathname, revealKey]);

  // Cursor spotlight on cards: tells each .hx-glow card where the pointer is
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('.hx-root .hx-glow') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--gx', `${e.clientX - r.left}px`);
      el.style.setProperty('--gy', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);

  const startProject = () => { setMenuOpen(false); if (onStartProject) onStartProject(); else navigate(contactPath('Software Development')); };
  const isActive = (to: string) => location.pathname === to;
  const navLinks = NAV_PAGES.map(item => (
    <Link key={item.to} to={item.to} aria-current={isActive(item.to) ? 'page' : undefined} className={isActive(item.to) ? 'is-active' : undefined} onClick={() => setMenuOpen(false)}>
      {item.label}
    </Link>
  ));

  return (
    <div className="hx-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <style>{CSS}</style>

      {/* ── Navigation ── */}
      <header className="hx-nav">
        <div className="hx-wrap hx-nav-inner">
          <Link to="/" className="hx-nav-brand" onClick={() => { if (location.pathname === '/') window.scrollTo({ top: 0 }); }}><BrandMark /></Link>
          <nav className="hx-nav-links" aria-label="Main">{navLinks}</nav>
          <div className="hx-nav-actions">
            <button className="hx-btn hx-btn-ghost hx-hide-sm" type="button" onClick={() => navigate('/auth')}>Log in</button>
            <button className="hx-btn hx-btn-primary" type="button" onClick={startProject}>Start a project</button>
            <button className="hx-menu-btn" type="button" aria-expanded={menuOpen} aria-controls="hx-mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(o => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="hx-mobile-menu" className="hx-mobile-menu" aria-label="Mobile">
            {navLinks}
            <button className="hx-btn hx-btn-ghost hx-btn-block" type="button" onClick={() => navigate('/auth')}>Log in</button>
          </nav>
        )}
      </header>

      <main id="top">{children}</main>

      {/* ── Footer ── */}
      <footer className="hx-footer">
        <div className="hx-wrap hx-footer-grid">
          <div>
            <BrandMark />
            <p className="hx-muted hx-footer-blurb">AI-powered software development for startups, businesses and institutions.</p>
            <SocialLinks />
          </div>
          <div>
            <h4>Services</h4>
            <ul>
              <li><Link to="/services">What we build</Link></li>
              <li><Link to="/ai-solutions">AI solutions</Link></li>
              <li><Link to="/work">Client work</Link></li>
              <li><Link to={contactPath('Software Development')}>Start a project</Link></li>
            </ul>
          </div>
          <div>
            <h4>Students</h4>
            <ul>
              <li><Link to="/internships">Internships</Link></li>
              <li><Link to="/products">AI Academy</Link></li>
              <li><a href="/verify">Verify a certificate</a></li>
              <li><a href="/internship-policy">Internship policy</a></li>
              <li><a href="/auth">Log in</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="/about-us">About us</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/contact-us">Contact us</a></li>
              <li><a href="/company-information">Company information</a></li>
              <li><a href="/privacy-policy">Privacy policy</a></li>
              <li><a href="/terms-and-conditions">Terms</a></li>
              <li><a href="/refund-policy">Refund policy</a></li>
              <li><a href="/disclaimer">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="hx-wrap hx-footer-legal">
          © 2020 Hiresnix. A brand operated by SR PATIL INFRASTRUCTURE PRIVATE LIMITED. CIN: U42909MH2024PTC429260. All rights reserved.
        </div>
      </footer>

      <HiresnixChatbot />
    </div>
  );
}

// ── Page header (top of each inner page) ────────────────────────────
export function PageHeader({ crumb, title, lead, children }: { crumb: string; title: string; lead: string; children?: React.ReactNode }) {
  return (
    <section className="hx-page-head">
      <div className="hx-wrap hx-page-head-grid">
        <div className="hx-page-head-copy">
          <nav className="hx-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li aria-current="page">{crumb}</li>
            </ol>
          </nav>
          <h1 className="hx-h1 hx-page-title">{title}</h1>
          <p className="hx-lead">{lead}</p>
          {children && <div className="hx-hero-ctas">{children}</div>}
        </div>
        <svg className="hx-page-mark" viewBox="0 0 240 200" aria-hidden="true">
          <path className="hx-page-mark-line" pathLength={1} d="M12 186 C 100 184, 168 140, 196 52" fill="none" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" />
          <path className="hx-page-mark-head" d="M168 70 L200 44 L210 84" fill="none" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="hx-page-mark-dot" cx="226" cy="20" r="12" fill="var(--accent)" />
        </svg>
      </div>
    </section>
  );
}

// ── Closing call to action on inner pages ───────────────────────────
export function CtaBand({ interest = 'Software Development' }: { interest?: string }) {
  const navigate = useNavigate();
  return (
    <section className="hx-section hx-section-tight">
      <div className="hx-wrap">
        <div className="hx-cta-band" data-reveal>
          <div>
            <h2 className="hx-h2">{SECTION_COPY.contact.title}</h2>
            <p className="hx-lead">{SECTION_COPY.contact.lead}</p>
          </div>
          <button className="hx-btn hx-btn-light hx-btn-lg" type="button" onClick={() => navigate(contactPath(interest))}>Start a project</button>
        </div>
      </div>
    </section>
  );
}

// ── Sections (used on the landing page and on each page) ────────────
// `head` shows the section's own heading; inner pages hide it because PageHeader shows it.

export function ServicesSection({ head = true, onContact }: { head?: boolean; onContact: (interest: string) => void }) {
  return (
    <section id="services" className="hx-section hx-section-panel">
      <div className="hx-wrap">
        {head && (
          <div className="hx-section-head" data-reveal>
            <h2 className="hx-h2">{SECTION_COPY.services.title}</h2>
            <p className="hx-lead">{SECTION_COPY.services.lead}</p>
          </div>
        )}
        <dl className="hx-services">
          {SERVICES.map(([t, d], i) => (
            <div key={t} className="hx-glow" data-reveal style={{ ['--d' as any]: `${(i % 3) * 80 + Math.floor(i / 3) * 60}ms` }}><dt>{t}</dt><dd>{d}</dd></div>
          ))}
        </dl>
        <p className="hx-industries" data-reveal>
          Industries we have worked in: education, healthcare, retail, manufacturing, finance, e-commerce and startups.
        </p>
        {!head && (
          <div className="hx-cta-row">
            <button className="hx-btn hx-btn-primary" type="button" onClick={() => onContact('Software Development')}>Start a project</button>
          </div>
        )}
      </div>
    </section>
  );
}

export function AISection({ head = true, onContact }: { head?: boolean; onContact: (interest: string) => void }) {
  return (
    <section id="ai" className="hx-section">
      <div className="hx-wrap">
        {head && (
          <div className="hx-section-head" data-reveal>
            <h2 className="hx-h2">{SECTION_COPY.ai.title}</h2>
            <p className="hx-lead">{SECTION_COPY.ai.lead}</p>
          </div>
        )}
        <div className="hx-ai">
          {AI_CAPABILITIES.map(([title, desc, proof], i) => (
            <div key={title} className="hx-ai-item hx-glow" data-reveal style={{ ['--d' as any]: `${i * 90}ms` }}>
              <h3 className="hx-h3">{title}</h3>
              <p className="hx-muted">{desc}</p>
              <p className="hx-ai-proof">{proof}</p>
            </div>
          ))}
        </div>
        <div className="hx-cta-row">
          <button className="hx-btn hx-btn-primary" type="button" onClick={() => onContact('AI Solutions')}>Discuss an AI project</button>
        </div>
      </div>
    </section>
  );
}

export function ProcessSection() {
  return (
    <section className="hx-section hx-section-panel hx-section-tight">
      <div className="hx-wrap">
        <h2 className="hx-h3">How a project runs</h2>
        <ol className="hx-process">
          {PROCESS.map((p, i) => (
            <li key={p} data-reveal style={{ ['--d' as any]: `${i * 70}ms` }}><span className="hx-step-n" aria-hidden="true">{i + 1}</span>{p}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FactsStrip() {
  return (
    <dl className="hx-facts">
      <div><dt>Clients served</dt><dd><CountUp value="50+" /></dd></div>
      <div><dt>Services, design to support</dt><dd><CountUp value="9" /></dd></div>
      <div><dt>Industries</dt><dd><CountUp value="7" /></dd></div>
      <div><dt>Developers trained</dt><dd><CountUp value="500+" /></dd></div>
    </dl>
  );
}

export function ClientsBand({ clients }: { clients: ClientChip[] }) {
  return (
    <div className="hx-clients-band">
      <div className="hx-wrap"><p className="hx-clients-title" data-reveal>Businesses we have built software for</p></div>
      <ClientMarquee clients={clients} />
    </div>
  );
}

export function WorkSection({ head = true, publicClients, ndaClients }: { head?: boolean; publicClients: any[]; ndaClients: string[] }) {
  return (
    <section id="work" className="hx-section">
      <div className="hx-wrap">
        {head && (
          <div className="hx-section-head" data-reveal>
            <h2 className="hx-h2">{SECTION_COPY.work.title}</h2>
            <p className="hx-lead">{SECTION_COPY.work.lead}</p>
          </div>
        )}

        <article className="hx-case hx-glow" data-reveal>
          <header className="hx-case-head">
            <div>
              <h3 className="hx-h3">Focktix Limited</h3>
              <p className="hx-muted">Digital marketing agency, Maharashtra</p>
            </div>
            <span className="hx-badge">Delivered</span>
          </header>
          <div className="hx-case-built">
            <div><strong>Custom CRM system</strong><p>Client and lead management built around the agency's workflow.</p></div>
            <div><strong>Campaign dashboard</strong><p>Live analytics for ad performance across platforms.</p></div>
            <div><strong>AI lead scoring</strong><p>Machine learning that ranks leads so the team calls the best ones first.</p></div>
          </div>
          <p className="hx-case-stack">Built with React.js, Node.js, PostgreSQL, Groq AI, REST APIs and Vercel.</p>
          <dl className="hx-case-results">
            <div><dd>3×</dd><dt>lead conversion</dt></div>
            <div><dd>60%</dd><dt>less manual work</dt></div>
            <div><dd>99.9%</dd><dt>uptime</dt></div>
          </dl>
        </article>

        {publicClients.map((c: any) => {
          const built = parseList(c.what_we_built);
          const stack = parseList(c.tech_stack).filter(Boolean);
          const results = parseList(c.results);
          return (
            <article key={c.id} className="hx-case hx-glow" data-reveal>
              <header className="hx-case-head">
                <div>
                  <h3 className="hx-h3">{c.name}</h3>
                  <p className="hx-muted">{[c.industry, c.location].filter(Boolean).join(', ')}</p>
                </div>
                <span className="hx-badge">Delivered</span>
              </header>
              {built.length > 0 && (
                <div className="hx-case-built">
                  {built.map((w: any, i: number) => <div key={i}><strong>{w.title}</strong><p>{w.desc}</p></div>)}
                </div>
              )}
              {stack.length > 0 && <p className="hx-case-stack">Built with {stack.join(', ')}.</p>}
              {results.length > 0 && (
                <dl className="hx-case-results">
                  {results.map((r: any, i: number) => <div key={i}><dd>{r.value}</dd><dt>{r.label}</dt></div>)}
                </dl>
              )}
            </article>
          );
        })}

        <p className="hx-nda" data-reveal>
          <strong>Other clients, under NDA:</strong> {ndaClients.join(', ')}.
        </p>
      </div>
    </section>
  );
}

export function ProductsSection({ head = true, onContact }: { head?: boolean; onContact: (interest: string) => void }) {
  return (
    <section id="products" className="hx-section hx-section-panel">
      <div className="hx-wrap">
        {head && (
          <div className="hx-section-head" data-reveal>
            <h2 className="hx-h2">{SECTION_COPY.products.title}</h2>
            <p className="hx-lead">{SECTION_COPY.products.lead}</p>
          </div>
        )}
        <div className="hx-split hx-split-even">
          <article className="hx-product hx-glow" data-reveal>
            <h3 className="hx-h3">AI Academy</h3>
            <p className="hx-muted">
              Sixteen self-paced programming courses with an AI teacher for every lesson, a code runner in the browser and quizzes.
            </p>
            <ul className="hx-courses" aria-label="Courses">
              {ACADEMY_COURSES.map(c => <li key={c}>{c}</li>)}
            </ul>
          </article>
          <article className="hx-product hx-glow" data-reveal style={{ ['--d' as any]: `120ms` }}>
            <h3 className="hx-h3">Institution portal</h3>
            <p className="hx-muted">
              Colleges and training institutes manage batches, import students from a CSV file, track attendance and
              issue certificates their students can verify online.
            </p>
            <button className="hx-btn hx-btn-ghost" type="button" onClick={() => onContact('Partnership')}>Talk to us about your institute</button>
          </article>
        </div>
      </div>
    </section>
  );
}

export function InternshipsSection({ head = true }: { head?: boolean }) {
  const navigate = useNavigate();
  const applyNow = () => navigate('/auth?tab=register');
  return (
    <section id="internships" className="hx-section">
      <div className="hx-wrap">
        {head && (
          <div className="hx-section-head" data-reveal>
            <h2 className="hx-h2">{SECTION_COPY.internships.title}</h2>
            <p className="hx-lead">{SECTION_COPY.internships.lead}</p>
          </div>
        )}

        <div data-reveal><DomainExplorer onApply={applyNow} /></div>

        <h3 className="hx-h3 hx-steps-title">How the internship works</h3>
        <ol className="hx-steps">
          {INTERN_STEPS.map(([title, desc], i) => (
            <li key={title} data-reveal style={{ ['--d' as any]: `${i * 90}ms` }}>
              <span className="hx-step-n" aria-hidden="true">{i + 1}</span>
              <strong>{title}</strong>
              <p>{desc}</p>
            </li>
          ))}
        </ol>

        <div className="hx-cta-row">
          <button className="hx-btn hx-btn-primary hx-btn-lg" type="button" onClick={applyNow}>Apply for an internship</button>
          <a className="hx-link" href="/verify" onClick={e => { e.preventDefault(); navigate('/verify'); }}>Verify a certificate</a>
        </div>
      </div>
    </section>
  );
}

export function ContactSection({ head = true, presetInterest }: { head?: boolean; presetInterest: string }) {
  return (
    <section id="contact" className={`hx-section${head ? ' hx-section-panel' : ''}`}>
      <div className="hx-wrap hx-split">
        <div data-reveal>
          {head && (
            <>
              <h2 className="hx-h2">{SECTION_COPY.contact.title}</h2>
              <p className="hx-lead">{SECTION_COPY.contact.lead}</p>
            </>
          )}
          <p className={`hx-muted${head ? ' hx-contact-alt' : ''}`}>
            Prefer email? Write to <a className="hx-link" href="mailto:hr@hiresnix.co.in">hr@hiresnix.co.in</a> or call{' '}
            <a className="hx-link" href="tel:+919529120977">+91 95291 20977</a>.
          </p>
          <div className="hx-contact-social">
            <span className="hx-muted">Follow us</span>
            <SocialLinks />
          </div>
        </div>
        <div data-reveal style={{ ['--d' as any]: `120ms` }}><EnquiryForm presetInterest={presetInterest} /></div>
      </div>
    </section>
  );
}

export { HeroScene, CountUp, INTEREST_OPTIONS };

// ── Styles ─────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&display=swap');

.hx-root{
  --paper:#FBFBF8; --mist:#F1F4EF; --line:#DCE3DE; --line-strong:#C3CEC7;
  --ink:#102A22; --text:#33403B; --muted:#5C6964;
  --accent:#0B7A55; --accent-press:#08613F; --accent-soft:#E3F1EA; --mint:#4FD1A0;
  --forest:#0E3B2C; --forest-2:#134A37; --forest-line:rgba(255,255,255,.14); --forest-text:#D5E6DD;
  --font:'Schibsted Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background:var(--paper); color:var(--text); font-family:var(--font); font-size:17px; line-height:1.6;
  overflow-x:clip; -webkit-font-smoothing:antialiased;
}
body{margin:0;background:#FBFBF8;}
/* The app adds a tinted mesh behind every page (GlobalAnimations); keep the landing page clean */
body.lp-readonly{background:#FBFBF8 !important;}
body.lp-readonly::before{display:none !important;}
.lp-readonly, .lp-readonly *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
.lp-readonly input, .lp-readonly textarea, .lp-readonly select{-webkit-user-select:auto;user-select:auto;}
:where(.hx-root) *{box-sizing:border-box;}
:where(.hx-root) a{color:inherit;}
.hx-root :focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:6px;}
html{scroll-padding-top:84px;}

.hx-wrap{width:100%;max-width:1320px;margin:0 auto;padding:0 clamp(20px,4vw,40px);}

/* Type */
.hx-h1{font-weight:800;color:var(--ink);font-size:clamp(2.3rem,4.2vw,3.9rem);line-height:1.02;letter-spacing:-0.04em;margin:0 0 24px;max-width:15ch;text-wrap:balance;}
.hx-h2{font-weight:700;color:var(--ink);font-size:clamp(2rem,3.6vw,3rem);line-height:1.05;letter-spacing:-0.035em;margin:0 0 16px;text-wrap:balance;}
.hx-h3{font-weight:700;color:var(--ink);font-size:1.22rem;line-height:1.3;letter-spacing:-0.015em;margin:0 0 8px;}
.hx-lead{font-size:clamp(1.05rem,1.5vw,1.18rem);line-height:1.55;color:var(--text);max-width:58ch;margin:0;}
.hx-muted{color:var(--muted);margin:0;}
.hx-link{color:var(--accent);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1.5px;}
.hx-link:hover{color:var(--accent-press);}

/* Buttons */
.hx-btn{font-family:var(--font);font-weight:600;font-size:0.97rem;border-radius:10px;min-height:44px;padding:10px 20px;cursor:pointer;border:1.5px solid transparent;line-height:1.2;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;transition:background-color .15s ease,border-color .15s ease,color .15s ease,transform .2s ease,box-shadow .2s ease;}
.hx-btn-lg{font-size:1.02rem;min-height:52px;padding:14px 26px;}
.hx-btn-block{width:100%;}
.hx-btn-primary{background:var(--accent);color:#fff;}
.hx-btn-primary:hover{background:var(--accent-press);box-shadow:0 10px 24px -10px rgba(11,122,85,.6);transform:translateY(-1px);}
.hx-btn-primary:disabled{opacity:.6;cursor:progress;transform:none;}
.hx-btn-ghost{background:transparent;color:var(--ink);border-color:var(--line-strong);}
.hx-btn-ghost:hover{border-color:var(--ink);transform:translateY(-1px);}
.hx-btn:active{transform:translateY(0);}

/* Nav */
.hx-nav{position:sticky;top:0;z-index:50;background:rgba(251,251,248,.9);backdrop-filter:saturate(1.4) blur(12px);-webkit-backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--line);}
.hx-nav-inner{display:flex;align-items:center;gap:28px;height:68px;}
.hx-nav-brand{text-decoration:none;display:flex;}
.hx-brand{display:inline-flex;align-items:center;gap:10px;}
.hx-brand-word{font-weight:800;font-size:1.02rem;letter-spacing:0.14em;color:var(--ink);}
.hx-nav-links{display:flex;gap:4px;margin-left:8px;}
.hx-nav-links a{position:relative;text-decoration:none;color:var(--text);font-size:0.95rem;font-weight:500;padding:8px 12px;border-radius:8px;transition:background-color .15s ease,color .15s ease;}
.hx-nav-links a:hover{color:var(--ink);background:var(--mist);}
.hx-nav-actions{display:flex;gap:10px;align-items:center;margin-left:auto;}
.hx-menu-btn{display:none;width:44px;height:44px;border-radius:10px;border:1.5px solid var(--line-strong);background:transparent;cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:4px;}
.hx-menu-btn span{display:block;width:18px;height:2px;background:var(--ink);border-radius:2px;}
.hx-mobile-menu{display:flex;flex-direction:column;gap:2px;padding:12px clamp(20px,4vw,40px) 20px;border-top:1px solid var(--line);background:var(--paper);animation:hxMenu .22s ease both;}
.hx-mobile-menu a{text-decoration:none;padding:12px 0;font-weight:600;color:var(--ink);border-bottom:1px solid var(--line);}
.hx-mobile-menu .hx-btn{margin-top:12px;}
@keyframes hxMenu{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}

/* Hero */
/* Hero fills the first screen (below the 68px nav); copy and animation sit side by side, centred vertically */
.hx-hero{padding:0;}
.hx-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,5vw,72px);align-items:center;min-height:min(calc(100vh - 68px), 960px);min-height:min(calc(100svh - 68px), 960px);padding-block:clamp(40px,6vh,72px);}
.hx-hero-copy{display:flex;flex-direction:column;justify-content:center;}
@media (min-width:1600px){.hx-h1{font-size:4.4rem;}.hx-hero .hx-lead{font-size:1.25rem;}}
.hx-hero-ctas{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;}
.hx-hero-login{margin:22px 0 0;color:var(--muted);font-size:0.95rem;}
.hx-hero-login a{color:var(--accent);font-weight:600;text-decoration:underline;text-underline-offset:3px;}

/* Hero scene (interactive animation) */
.hx-scene{--mx:0;--my:0;position:relative;border-radius:24px;overflow:hidden;color:#fff;
  background:radial-gradient(120% 90% at 85% 10%, #1B6A4E 0%, var(--forest) 55%, #0A2E22 100%);
  box-shadow:0 40px 80px -40px rgba(14,59,44,.65), 0 0 0 1px rgba(14,59,44,.08);}
.hx-scene-stage{position:relative;}
.hx-scene-svg{display:block;width:100%;height:auto;}
.hx-scene-node{fill:var(--forest);stroke:rgba(255,255,255,.45);transition:fill .3s ease,stroke .3s ease;}
.hx-scene-halo{transition:opacity .4s ease;}
.hx-scene-text{opacity:.32;transition:opacity .45s ease,transform .45s cubic-bezier(.2,.7,.2,1);transform:translateY(6px);}
.hx-scene-label{font-family:var(--font);font-weight:700;font-size:17px;fill:#FFFFFF;}
.hx-scene-sub{font-family:var(--font);font-size:13.5px;fill:#B7D4C7;}
.hx-scene-stop.is-on .hx-scene-node{fill:var(--mint);stroke:#FFFFFF;}
.hx-scene-stop.is-on .hx-scene-halo{opacity:.22;}
.hx-scene-stop.is-on .hx-scene-text{opacity:1;transform:none;}
.hx-scene-stop{cursor:default;}
.hx-scene-stop:hover .hx-scene-halo{opacity:.4;}
.hx-scene-finish{opacity:0;transition:opacity .4s ease;}
.hx-scene.is-launched .hx-scene-finish{opacity:1;}
.hx-scene-ring{transform-box:fill-box;transform-origin:center;}
.hx-scene.is-launched .hx-scene-ring{animation:hxRing 1.6s ease-out infinite;}
@keyframes hxRing{from{transform:scale(1);opacity:.9;}to{transform:scale(2.6);opacity:0;}}
.hx-scene-tags{list-style:none;margin:0;padding:0;position:absolute;inset:0;pointer-events:none;}
.hx-scene-tags li{position:absolute;transform:translate(calc(var(--mx) * var(--depth) * -1px), calc(var(--my) * var(--depth) * -1px));transition:transform .5s cubic-bezier(.2,.7,.2,1);}
.hx-scene-tags span{display:inline-block;padding:6px 12px;border-radius:999px;font-size:.8rem;font-weight:600;color:#E6F4ED;white-space:nowrap;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:hxBob 6s ease-in-out infinite;
  opacity:.45;transition:opacity .4s ease,background-color .4s ease,border-color .4s ease,color .4s ease;}
.hx-scene-tags li.is-on span{opacity:1;background:rgba(79,209,160,.16);border-color:rgba(79,209,160,.55);color:#FFFFFF;}
.hx-scene-tags li:nth-child(6) span{animation-delay:-3.7s;}
.hx-scene-tags li:nth-child(2) span{animation-delay:-1.5s;}
.hx-scene-tags li:nth-child(3) span{animation-delay:-3s;}
.hx-scene-tags li:nth-child(4) span{animation-delay:-4.5s;}
.hx-scene-tags li:nth-child(5) span{animation-delay:-2.2s;}
@keyframes hxBob{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
.hx-scene-controls{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--forest-line);background:rgba(0,0,0,.14);}
.hx-scene-play{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;display:grid;place-items:center;cursor:pointer;transition:background-color .15s ease;}
.hx-scene-play:hover{background:rgba(255,255,255,.18);}
.hx-scene-play:focus-visible,.hx-scene-range:focus-visible{outline-color:var(--mint);}
.hx-scene-range{flex:1;height:24px;margin:0;background:transparent;cursor:pointer;-webkit-appearance:none;appearance:none;accent-color:var(--mint);}
.hx-scene-range::-webkit-slider-runnable-track{height:4px;border-radius:4px;background:rgba(255,255,255,.22);}
.hx-scene-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;margin-top:-5px;border-radius:50%;background:var(--mint);border:2px solid #fff;}
.hx-scene-range::-moz-range-track{height:4px;border-radius:4px;background:rgba(255,255,255,.22);}
.hx-scene-range::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--mint);border:2px solid #fff;}

/* Facts */
.hx-facts{display:grid;grid-template-columns:repeat(4,1fr);margin:0;border-top:1px solid var(--line);}
.hx-facts > div{padding:26px 0 30px;display:flex;flex-direction:column-reverse;gap:2px;}
.hx-facts > div + div{padding-left:24px;border-left:1px solid var(--line);}
.hx-facts dd{margin:0;font-weight:800;font-size:clamp(1.9rem,3.2vw,2.6rem);letter-spacing:-0.045em;line-height:1.1;color:var(--ink);font-variant-numeric:tabular-nums;}
.hx-facts dt{color:var(--muted);font-size:0.93rem;}

/* Client marquee */
.hx-clients-band{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:28px 0 32px;}
.hx-clients-title{margin:0 0 16px;color:var(--muted);font-size:0.95rem;font-weight:500;}
.hx-marquee{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);}
.hx-marquee-track{display:flex;width:max-content;animation:hxMarquee var(--hx-marquee-time,40s) linear infinite;}
.hx-marquee:hover .hx-marquee-track,.hx-marquee:focus-within .hx-marquee-track{animation-play-state:paused;}
.hx-marquee-list{display:flex;gap:12px;list-style:none;margin:0;padding:0 12px 0 0;}
@keyframes hxMarquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
.hx-chip{display:flex;align-items:center;gap:12px;padding:10px 18px 10px 10px;border:1px solid var(--line);border-radius:14px;background:#fff;white-space:nowrap;transition:border-color .2s ease,transform .2s ease;}
.hx-chip:hover{border-color:var(--accent);transform:translateY(-2px);}
.hx-chip-mark{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:var(--forest);color:#fff;font-weight:800;font-size:1rem;flex-shrink:0;}
.hx-chip-nda .hx-chip-mark{background:var(--mist);color:var(--muted);border:1px solid var(--line);}
.hx-chip-text{display:flex;flex-direction:column;line-height:1.2;}
.hx-chip-name{font-weight:700;color:var(--ink);font-size:0.95rem;}
.hx-chip-meta{color:var(--muted);font-size:0.82rem;}
.hx-chip:not(.hx-chip-nda) .hx-chip-meta{color:var(--accent-press);}

/* Sections */
.hx-section{padding:clamp(72px,9vw,120px) 0;}
.hx-section-panel{background:var(--mist);}
.hx-section-head{margin-bottom:clamp(36px,5vw,52px);max-width:760px;}
.hx-section-tight{padding:clamp(48px,6vw,72px) 0;}
.hx-section-tight .hx-h3{margin-bottom:24px;}
.hx-split{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(32px,6vw,80px);align-items:start;}
.hx-split-even{grid-template-columns:1fr 1fr;gap:20px;}
.hx-cta-row{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:44px;}

/* Cursor spotlight on cards (position set by the page's pointer handler) */
.hx-glow{position:relative;isolation:isolate;}
.hx-glow::before{content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;opacity:0;transition:opacity .3s ease;
  background:radial-gradient(260px circle at var(--gx,50%) var(--gy,50%), rgba(11,122,85,.10), transparent 70%);}
.hx-glow:hover::before{opacity:1;}

/* Services */
.hx-services{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:0;}
.hx-services > div{padding:26px;border:1px solid var(--line);border-radius:18px;background:#fff;transition:border-color .2s ease,transform .25s ease,box-shadow .25s ease;}
.hx-services > div:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 18px 36px -24px rgba(14,59,44,.35);}
.hx-services dt{font-weight:700;color:var(--ink);font-size:1.06rem;margin-bottom:6px;transition:color .2s ease;}
.hx-services > div:hover dt{color:var(--accent-press);}
.hx-services dd{margin:0;color:var(--muted);font-size:0.95rem;line-height:1.5;}
.hx-industries{color:var(--text);margin:28px 0 0;}

/* AI solutions (forest band) */
#ai.hx-section{background:var(--forest);color:var(--forest-text);}
#ai .hx-h2,#ai .hx-h3{color:#fff;}
#ai .hx-lead,#ai .hx-muted{color:var(--forest-text);}
.hx-ai{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
.hx-ai-item{padding:30px;border-radius:18px;border:1px solid var(--forest-line);background:rgba(255,255,255,.04);transition:border-color .2s ease,background-color .2s ease;}
.hx-ai-item:hover{border-color:rgba(79,209,160,.5);background:rgba(255,255,255,.07);}
.hx-ai-item.hx-glow::before{background:radial-gradient(260px circle at var(--gx,50%) var(--gy,50%), rgba(79,209,160,.16), transparent 70%);}
.hx-ai-item .hx-muted{margin:0 0 14px;max-width:52ch;}
.hx-ai-proof{margin:0;font-size:0.93rem;font-weight:600;color:var(--mint);}
#ai .hx-btn-primary{background:#fff;color:var(--forest);}
#ai .hx-btn-primary:hover{background:var(--accent-soft);box-shadow:none;}

/* Process */
.hx-process{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:12px;}
.hx-process li{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:12px;font-weight:600;color:var(--ink);}
.hx-process li::after{content:"";position:absolute;top:17px;left:44px;right:-6px;height:2px;background:var(--line-strong);}
.hx-process li:last-child::after{display:none;}
.hx-step-n{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;flex:none;border-radius:50%;background:var(--paper);border:2px solid var(--accent);color:var(--accent-press);font-weight:700;font-size:0.9rem;}
.hx-section-panel .hx-step-n{background:var(--mist);}

/* Client work */
.hx-case{border:1px solid var(--line);border-radius:22px;padding:clamp(24px,4vw,40px);margin-bottom:20px;background:#fff;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;}
.hx-case:hover{transform:translateY(-3px);box-shadow:0 24px 48px -30px rgba(14,59,44,.4);border-color:var(--line-strong);}
.hx-case-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px;}
.hx-case-head .hx-h3{font-size:clamp(1.5rem,2.4vw,1.9rem);font-weight:800;letter-spacing:-0.03em;}
.hx-badge{font-size:0.82rem;font-weight:600;color:var(--accent-press);background:var(--accent-soft);border-radius:999px;padding:5px 12px;white-space:nowrap;}
.hx-case-built{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-bottom:20px;}
.hx-case-built strong{display:block;margin-bottom:4px;color:var(--ink);}
.hx-case-built p{margin:0;color:var(--muted);font-size:0.95rem;}
.hx-case-stack{color:var(--muted);font-size:0.94rem;margin:0 0 20px;}
.hx-case-results{display:flex;flex-wrap:wrap;gap:48px;margin:0;padding-top:22px;border-top:1px solid var(--line);}
.hx-case-results > div{display:flex;flex-direction:column;}
.hx-case-results dd{margin:0;font-weight:800;font-size:clamp(2rem,3.4vw,2.6rem);letter-spacing:-0.045em;line-height:1.05;color:var(--accent);}
.hx-case-results dt{color:var(--muted);font-size:0.92rem;}
.hx-nda{color:var(--muted);margin:28px 0 0;max-width:80ch;}
.hx-nda strong{color:var(--ink);font-weight:600;}

/* Products */
.hx-product{border:1px solid var(--line);border-radius:22px;padding:clamp(24px,3vw,34px);background:#fff;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;}
.hx-product:hover{transform:translateY(-3px);box-shadow:0 24px 48px -30px rgba(14,59,44,.4);border-color:var(--line-strong);}
.hx-product .hx-muted{margin:0 0 20px;}
.hx-courses{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px;}
.hx-courses li{border-radius:999px;background:var(--mist);padding:6px 13px;font-size:0.88rem;font-weight:500;color:var(--text);transition:background-color .15s ease,color .15s ease;}
.hx-courses li:hover{background:var(--accent-soft);color:var(--accent-press);}

/* Domain explorer */
.hx-explorer{display:grid;grid-template-columns:260px minmax(0,1fr);border:1px solid var(--line);border-radius:22px;background:#fff;overflow:hidden;}
.hx-tabs{display:flex;flex-direction:column;border-right:1px solid var(--line);padding:12px;background:var(--paper);}
.hx-tab{all:unset;cursor:pointer;padding:12px 14px;border-radius:10px;color:var(--text);font-weight:500;font-size:0.96rem;transition:background-color .2s ease,color .2s ease;}
.hx-tab:hover{color:var(--ink);background:var(--mist);}
.hx-tab[aria-selected="true"]{color:#fff;background:var(--forest);font-weight:600;}
.hx-tab:focus-visible{outline:3px solid var(--accent);outline-offset:-3px;}
.hx-panel{padding:clamp(24px,4vw,40px);animation:hxPanelIn .35s ease both;}
@keyframes hxPanelIn{from{opacity:0;transform:translateX(10px);}to{opacity:1;transform:none;}}
.hx-panel-title{font-weight:800;color:var(--ink);font-size:clamp(1.5rem,2.4vw,1.9rem);letter-spacing:-0.03em;margin:0 0 6px;}
.hx-panel-blurb{color:var(--text);margin:0 0 24px;}
.hx-panel-note{color:var(--muted);font-size:0.92rem;margin:0 0 10px;}
.hx-ladder{list-style:none;margin:0 0 28px;padding:0;position:relative;}
.hx-ladder::before{content:"";position:absolute;left:7px;top:20px;bottom:20px;width:2px;background:var(--line);}
.hx-rung{position:relative;padding:12px 0 12px 32px;display:grid;grid-template-columns:120px minmax(0,1fr);column-gap:16px;row-gap:2px;animation:hxRise .45s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0) * 110ms + 120ms);}
.hx-rung::before{content:"";position:absolute;left:1px;top:19px;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--line-strong);}
.hx-rung:last-child::before{border-color:var(--accent);background:var(--accent);}
.hx-rung-level{color:var(--accent-press);font-weight:600;font-size:0.9rem;grid-row:span 2;padding-top:2px;}
.hx-rung-title{font-weight:700;color:var(--ink);}
.hx-rung-tech{color:var(--muted);font-size:0.9rem;}

.hx-steps-title{margin-top:68px;margin-bottom:24px;}
.hx-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:28px;}
.hx-steps li{border-top:2px solid var(--line-strong);padding-top:20px;}
.hx-steps strong{display:block;margin:12px 0 6px;font-size:1.04rem;color:var(--ink);}
.hx-steps p{margin:0;color:var(--muted);font-size:0.95rem;line-height:1.5;}

/* Form */
.hx-form{border:1px solid var(--line);border-radius:22px;padding:clamp(22px,3vw,34px);background:#fff;}
.hx-form-done .hx-muted{margin:0 0 20px;}
.hx-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.hx-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.hx-form-grid .hx-field{margin-bottom:0;}
.hx-field > span{font-size:0.92rem;font-weight:600;color:var(--ink);}
.hx-field em{font-style:normal;color:var(--muted);font-weight:400;}
.hx-field input,.hx-field select,.hx-field textarea{font:inherit;font-size:1rem;color:var(--ink);background:var(--paper);border:1.5px solid var(--line-strong);border-radius:10px;padding:12px 14px;outline:none;width:100%;}
.hx-field input,.hx-field select{min-height:48px;}
.hx-field textarea{resize:vertical;line-height:1.5;}
.hx-field input::placeholder,.hx-field textarea::placeholder{color:#87928D;}
.hx-field input:focus,.hx-field select:focus,.hx-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);background:#fff;}
.hx-contact-alt{margin-top:20px;}

/* Social */
.hx-social{list-style:none;margin:0;padding:0;display:flex;gap:10px;}
.hx-social a{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;border:1.5px solid var(--line-strong);color:var(--ink);background:transparent;text-decoration:none;transition:border-color .15s ease,color .15s ease,background-color .15s ease;}
.hx-social a:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft);}
.hx-contact-social{display:flex;align-items:center;gap:14px;margin-top:24px;}

/* Footer */
.hx-footer{padding:72px 0 32px;background:var(--forest);color:var(--forest-text);}
.hx-footer .hx-brand-word{color:#fff;}
.hx-footer .hx-brand path{stroke:#fff;}
.hx-footer .hx-muted{color:var(--forest-text);}
.hx-footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:32px;}
.hx-footer-blurb{margin:16px 0 18px;max-width:34ch;font-size:0.95rem;}
.hx-footer h4{font-size:0.97rem;font-weight:700;color:#fff;margin:0 0 14px;}
.hx-footer ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
.hx-footer ul a{text-decoration:none;color:var(--forest-text);font-size:0.94rem;}
.hx-footer ul a:hover{color:#fff;text-decoration:underline;text-underline-offset:3px;}
.hx-footer .hx-social a{color:#fff;border-color:var(--forest-line);}
.hx-footer .hx-social a:hover{border-color:#fff;background:rgba(255,255,255,.08);color:#fff;}
.hx-footer :focus-visible{outline-color:var(--mint);}
.hx-footer-legal{margin-top:48px;padding-top:24px;border-top:1px solid var(--forest-line);color:#A9C4B7;font-size:0.85rem;}

/* ── Inner pages ── */
.hx-nav-links a.is-active{color:var(--ink);background:var(--accent-soft);font-weight:600;}
.hx-mobile-menu a.is-active{color:var(--accent-press);}
.hx-btn-light{background:#fff;color:var(--forest);}
.hx-btn-light:hover{background:var(--accent-soft);transform:translateY(-1px);}
.hx-page-head{padding:clamp(48px,7vw,96px) 0 clamp(48px,6vw,80px);border-bottom:1px solid var(--line);
  background:radial-gradient(70% 120% at 100% 0%, var(--accent-soft) 0%, transparent 60%), var(--paper);}
.hx-page-head-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:clamp(24px,5vw,64px);align-items:center;}
.hx-page-head-copy{animation:hxRise .7s cubic-bezier(.2,.7,.2,1) both;}
.hx-page-title{max-width:18ch;margin-bottom:20px;}
.hx-crumbs ol{list-style:none;margin:0 0 20px;padding:0;display:flex;flex-wrap:wrap;gap:8px;font-size:.92rem;color:var(--muted);}
.hx-crumbs li + li::before{content:"/";margin-right:8px;color:var(--line-strong);}
.hx-crumbs a{color:var(--accent);font-weight:600;text-decoration:none;}
.hx-crumbs a:hover{text-decoration:underline;text-underline-offset:3px;}
.hx-page-mark{width:clamp(160px,18vw,240px);height:auto;}
.hx-page-mark-line{stroke-dasharray:1;stroke-dashoffset:1;animation:hxDraw 1.2s cubic-bezier(.45,.05,.25,1) .2s forwards;}
.hx-page-mark-head,.hx-page-mark-dot{opacity:0;animation:hxFade .35s ease 1.3s forwards;}
.hx-page-mark-dot{transform-box:fill-box;transform-origin:center;}
@keyframes hxDraw{to{stroke-dashoffset:0;}}
@keyframes hxFade{to{opacity:1;}}
.hx-cta-band{display:flex;align-items:center;justify-content:space-between;gap:24px 48px;flex-wrap:wrap;padding:clamp(28px,5vw,56px);border-radius:24px;
  background:radial-gradient(120% 140% at 90% 0%, #1B6A4E 0%, var(--forest) 60%);color:var(--forest-text);}
.hx-cta-band .hx-h2{color:#fff;margin-bottom:8px;}
.hx-cta-band .hx-lead{color:var(--forest-text);}
.hx-page-facts{padding-top:clamp(40px,5vw,64px);}
.hx-page-head + .hx-section{padding-top:clamp(48px,6vw,72px);}
@media (max-width: 720px){
  .hx-page-head-grid{grid-template-columns:1fr;}
  .hx-page-mark{display:none;}
}

/* ── Motion: hero copy rises in; [data-reveal] elements rise in once on scroll (see useScrollReveal) ── */
.hx-hero-copy > *{animation:hxRise .7s cubic-bezier(.2,.7,.2,1) both;}
.hx-hero-copy > :nth-child(1){animation-delay:.05s;}
.hx-hero-copy > :nth-child(2){animation-delay:.18s;}
.hx-hero-copy > :nth-child(3){animation-delay:.3s;}
.hx-hero-copy > :nth-child(4){animation-delay:.42s;}
.hx-hero-visual{animation:hxRise .8s cubic-bezier(.2,.7,.2,1) .2s both;}
.hx-facts{animation:hxRise .7s cubic-bezier(.2,.7,.2,1) .55s both;}
@keyframes hxRise{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:none;}}
[data-reveal]{opacity:0;}
[data-reveal].is-in{animation:hxReveal .75s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--d,0ms);}
@keyframes hxReveal{from{opacity:0;translate:0 26px;}to{opacity:1;translate:0 0;}}

/* Responsive */
@media (max-width: 1100px){
  .hx-nav-links{display:none;}
  .hx-menu-btn{display:inline-flex;}
  .hx-process{grid-template-columns:repeat(4,minmax(0,1fr));row-gap:28px;}
  .hx-process li:nth-child(4)::after{display:none;}
}
@media (max-width: 960px){
  .hx-hero-grid{grid-template-columns:1fr;min-height:0;padding-block:48px 56px;}
  .hx-hero-visual{max-width:640px;width:100%;}
  .hx-h1{max-width:18ch;}
  .hx-split{grid-template-columns:1fr;gap:40px;}
  .hx-split-even{grid-template-columns:1fr;gap:20px;}
  .hx-steps{grid-template-columns:1fr 1fr;}
  .hx-services{grid-template-columns:1fr 1fr;}
  .hx-footer-grid{grid-template-columns:1fr 1fr;}
}
@media (max-width: 720px){
  .hx-root{font-size:16px;}
  .hx-hide-sm{display:none;}
  .hx-scene-label{font-size:21px;}
  .hx-scene-sub{font-size:16px;}
  .hx-scene-tags span{font-size:.72rem;padding:4px 9px;}
  .hx-scene-tags li:nth-child(n+2):nth-child(-n+5){display:none;}
  .hx-facts{grid-template-columns:1fr 1fr;}
  .hx-facts > div:nth-child(3){padding-left:0;border-left:none;}
  .hx-facts > div:nth-child(n+3){border-top:1px solid var(--line);}
  .hx-explorer{grid-template-columns:1fr;}
  .hx-tabs{flex-direction:row;overflow-x:auto;border-right:none;border-bottom:1px solid var(--line);scrollbar-width:none;gap:4px;}
  .hx-tab{white-space:nowrap;}
  .hx-rung{grid-template-columns:1fr;}
  .hx-rung-level{grid-row:auto;}
  .hx-steps{grid-template-columns:1fr;}
  .hx-services{grid-template-columns:1fr;}
  .hx-ai{grid-template-columns:1fr;}
  .hx-process{grid-template-columns:1fr;gap:0;}
  .hx-process li{flex-direction:row;align-items:center;gap:16px;padding-bottom:16px;}
  .hx-process li::after,.hx-process li:nth-child(4)::after{display:block;top:40px;bottom:0;left:17px;right:auto;width:2px;height:auto;}
  .hx-process li:last-child::after{display:none;}
  .hx-case-results{gap:28px;}
  .hx-form-grid{grid-template-columns:1fr;}
  .hx-footer-grid{grid-template-columns:1fr;}
}
@media (max-width: 420px){
  .hx-nav-actions .hx-btn-primary{padding:9px 14px;font-size:0.9rem;}
  .hx-brand-word{display:none;}
}
@media (prefers-reduced-motion: reduce){
  .hx-hero-copy > *,.hx-hero-visual,.hx-facts,.hx-panel,.hx-rung,.hx-mobile-menu{animation:none !important;}
  [data-reveal],[data-reveal].is-in{opacity:1 !important;animation:none !important;}
  .hx-btn:hover,.hx-case:hover,.hx-product:hover,.hx-chip:hover,.hx-services > div:hover{transform:none;}
  .hx-marquee{-webkit-mask-image:none;mask-image:none;}
  .hx-marquee-track{animation:none;width:auto;max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,40px);}
  .hx-marquee-list{flex-wrap:wrap;}
  .hx-marquee-list[aria-hidden="true"]{display:none;}
  .hx-chip-repeat{display:none;}
  .hx-scene-tags span,.hx-scene.is-launched .hx-scene-ring{animation:none;}
  .hx-scene-tags li,.hx-scene-text{transition:none;}
  .hx-btn{transition:none;}
  .hx-page-head-copy{animation:none;}
  .hx-page-mark-line{animation:none;stroke-dashoffset:0;}
  .hx-page-mark-head,.hx-page-mark-dot{animation:none;opacity:1;}
}
`;
