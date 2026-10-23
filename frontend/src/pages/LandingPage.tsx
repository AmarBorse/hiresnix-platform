// src/pages/LandingPage.tsx
// Public landing page — Hiresnix as an AI-powered software development company.
// Business services come first; internships and the AI Academy sit lower on the page.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';
import { HiresnixChatbot } from '../components/HiresnixChatbot';

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

// ── Hero trajectory ────────────────────────────────────────────────
function Trajectory() {
  const milestones = [
    { x: 88.7, y: 385.2, label: 'Discovery', sub: 'Goals and scope', lx: 70, ly: 350, anchor: 'start' as const },
    { x: 257, y: 329, label: 'Design', sub: 'Screens you approve', lx: 232, ly: 296, anchor: 'end' as const },
    { x: 373.4, y: 233.9, label: 'Build', sub: 'AI where it helps', lx: 350, ly: 200, anchor: 'end' as const },
    { x: 442.4, y: 128.4, label: 'Launch', sub: 'Then ongoing support', lx: 420, ly: 96, anchor: 'end' as const },
  ];
  return (
    <svg className="hx-traj" viewBox="0 0 500 420" role="img" aria-label="How a project moves: discovery, design, build, launch and support">
      <defs>
        <pattern id="hx-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1.1" fill="var(--dots)" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="500" height="420" fill="url(#hx-dots)" />
      <path className="hx-traj-path" pathLength={1} d="M30 390 C 230 385, 390 270, 458 92" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
      <path className="hx-traj-head" d="M430 108 L462 84 L466 124" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="hx-traj-dot" cx="482" cy="58" r="11" fill="var(--accent)" />
      {milestones.map((m, i) => (
        <g key={m.label} className="hx-traj-stop" style={{ animationDelay: `${0.35 + i * 0.3}s` }}>
          <circle cx={m.x} cy={m.y} r="7" fill="var(--paper)" stroke="var(--accent)" strokeWidth="3" />
          <text x={m.lx} y={m.ly} textAnchor={m.anchor} className="hx-traj-label">{m.label}</text>
          <text x={m.lx} y={m.ly} dy="1.4em" textAnchor={m.anchor} className="hx-traj-sub">{m.sub}</text>
        </g>
      ))}
    </svg>
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

// ── Page ───────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [landingClients, setLandingClients] = useState<any[]>([]);
  const [presetInterest, setPresetInterest] = useState('');

  // Keep the existing copy/right-click protection on the marketing page
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

  // Client case studies managed from the admin panel
  useEffect(() => {
    client.get('/clients')
      .then(r => setLandingClients(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {});
  }, []);

  useScrollReveal([landingClients.length]);

  const goTo = (id: string) => {
    setMenuOpen(false);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  const applyNow = () => navigate('/auth?tab=register');
  const contactFor = (interest: string) => { setPresetInterest(interest); goTo('contact'); };

  const publicClients = landingClients.filter((c: any) => !c.nda_protected);
  const ndaClients = [...NDA_CLIENTS, ...landingClients.filter((c: any) => c.nda_protected).map((c: any) => c.industry || 'NDA client')];
  // Every client for the scrolling strip: Focktix, clients added in the admin panel, then NDA clients
  const allClients: ClientChip[] = [
    { name: 'Focktix Limited', industry: 'Digital marketing', nda: false },
    ...publicClients.filter((c: any) => c?.name).map((c: any) => ({ name: String(c.name), industry: c.industry || 'Client', nda: false })),
    ...ndaClients.map(industry => ({ name: industry, industry, nda: true })),
  ];

  const NAV: [string, string][] = [['services', 'Services'], ['ai', 'AI solutions'], ['work', 'Work'], ['products', 'Products'], ['internships', 'Internships'], ['contact', 'Contact']];

  return (
    <div className="hx-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <style>{CSS}</style>

      {/* ── Navigation ── */}
      <header className="hx-nav">
        <div className="hx-wrap hx-nav-inner">
          <a href="#top" className="hx-nav-brand" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0 }); }}><BrandMark /></a>
          <nav className="hx-nav-links" aria-label="Main">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); goTo(id); }}>{label}</a>
            ))}
          </nav>
          <div className="hx-nav-actions">
            <button className="hx-btn hx-btn-ghost hx-hide-sm" type="button" onClick={() => navigate('/auth')}>Log in</button>
            <button className="hx-btn hx-btn-primary" type="button" onClick={() => contactFor('Software Development')}>Start a project</button>
            <button className="hx-menu-btn" type="button" aria-expanded={menuOpen} aria-controls="hx-mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(o => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="hx-mobile-menu" className="hx-mobile-menu" aria-label="Mobile">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); goTo(id); }}>{label}</a>
            ))}
            <button className="hx-btn hx-btn-ghost hx-btn-block" type="button" onClick={() => navigate('/auth')}>Log in</button>
          </nav>
        )}
      </header>

      <main id="top">
        {/* ── Hero ── */}
        <section className="hx-hero">
          <div className="hx-wrap hx-hero-grid">
            <div className="hx-hero-copy">
              <h1 className="hx-h1">AI-powered software development for growing businesses.</h1>
              <p className="hx-lead">
                Hiresnix designs, builds and maintains web apps, mobile apps and AI products for startups, businesses
                and institutions across India, from the first sketch to support after launch.
              </p>
              <div className="hx-hero-ctas">
                <button className="hx-btn hx-btn-primary hx-btn-lg" type="button" onClick={() => contactFor('Software Development')}>Start a project</button>
                <button className="hx-btn hx-btn-ghost hx-btn-lg" type="button" onClick={() => goTo('services')}>See our services</button>
              </div>
              <p className="hx-hero-login">
                Looking for an internship? <a href="#internships" onClick={e => { e.preventDefault(); goTo('internships'); }}>Explore internships</a>
              </p>
            </div>
            <div className="hx-hero-visual"><Trajectory /></div>
          </div>
          <div className="hx-wrap">
            <dl className="hx-facts">
              <div><dt>Clients served</dt><dd><CountUp value="50+" /></dd></div>
              <div><dt>Services, design to support</dt><dd><CountUp value="9" /></dd></div>
              <div><dt>Industries</dt><dd><CountUp value="7" /></dd></div>
              <div><dt>Developers trained</dt><dd><CountUp value="500+" /></dd></div>
            </dl>
          </div>
          <div className="hx-clients-band">
            <div className="hx-wrap"><p className="hx-clients-title" data-reveal>Businesses we have built software for</p></div>
            <ClientMarquee clients={allClients} />
          </div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="hx-section hx-section-panel">
          <div className="hx-wrap">
            <div className="hx-section-head" data-reveal>
              <h2 className="hx-h2">What we build</h2>
              <p className="hx-lead">
                One team for the whole job: product design, engineering, AI and the support that keeps it running.
              </p>
            </div>
            <dl className="hx-services">
              {SERVICES.map(([t, d], i) => (
                <div key={t} data-reveal style={{ ['--d' as any]: `${(i % 3) * 80 + Math.floor(i / 3) * 60}ms` }}><dt>{t}</dt><dd>{d}</dd></div>
              ))}
            </dl>
            <p className="hx-industries" data-reveal>
              Industries we have worked in: education, healthcare, retail, manufacturing, finance, e-commerce and startups.
            </p>
          </div>
        </section>

        {/* ── AI solutions ── */}
        <section id="ai" className="hx-section">
          <div className="hx-wrap">
            <div className="hx-section-head" data-reveal>
              <h2 className="hx-h2">AI that does real work</h2>
              <p className="hx-lead">
                We add AI where it saves your team time or makes you money, and we tell you plainly when it won't.
              </p>
            </div>
            <div className="hx-ai">
              {AI_CAPABILITIES.map(([title, desc, proof], i) => (
                <div key={title} className="hx-ai-item" data-reveal style={{ ['--d' as any]: `${i * 90}ms` }}>
                  <h3 className="hx-h3">{title}</h3>
                  <p className="hx-muted">{desc}</p>
                  <p className="hx-ai-proof">{proof}</p>
                </div>
              ))}
            </div>
            <div className="hx-cta-row">
              <button className="hx-btn hx-btn-primary" type="button" onClick={() => contactFor('AI Solutions')}>Discuss an AI project</button>
            </div>
          </div>
        </section>

        {/* ── Process ── */}
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

        {/* ── Client work ── */}
        <section id="work" className="hx-section">
          <div className="hx-wrap">
            <div className="hx-section-head" data-reveal>
              <h2 className="hx-h2">Client work</h2>
              <p className="hx-lead">Software we have delivered for growing businesses across India.</p>
            </div>

            <article className="hx-case" data-reveal>
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
                <article key={c.id} className="hx-case" data-reveal>
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

        {/* ── Our own products ── */}
        <section id="products" className="hx-section hx-section-panel">
          <div className="hx-wrap">
            <div className="hx-section-head" data-reveal>
              <h2 className="hx-h2">Products we run</h2>
              <p className="hx-lead">We build and operate our own AI products too, so the tools we recommend are ones we use every day.</p>
            </div>
            <div className="hx-split hx-split-even">
              <article className="hx-product" data-reveal>
                <h3 className="hx-h3">AI Academy</h3>
                <p className="hx-muted">
                  Sixteen self-paced programming courses with an AI teacher for every lesson, a code runner in the browser and quizzes.
                </p>
                <ul className="hx-courses" aria-label="Courses">
                  {ACADEMY_COURSES.map(c => <li key={c}>{c}</li>)}
                </ul>
              </article>
              <article className="hx-product" data-reveal style={{ ['--d' as any]: `120ms` }}>
                <h3 className="hx-h3">Institution portal</h3>
                <p className="hx-muted">
                  Colleges and training institutes manage batches, import students from a CSV file, track attendance and
                  issue certificates their students can verify online.
                </p>
                <button className="hx-btn hx-btn-ghost" type="button" onClick={() => contactFor('Partnership')}>Talk to us about your institute</button>
              </article>
            </div>
          </div>
        </section>

        {/* ── Internships (kept lower on the page) ── */}
        <section id="internships" className="hx-section">
          <div className="hx-wrap">
            <div className="hx-section-head" data-reveal>
              <h2 className="hx-h2">Internships</h2>
              <p className="hx-lead">
                We train developers on the same kind of work we ship for clients. Choose a domain and a duration from
                1 to 6 months, build three projects that get harder as you go, and finish with documents anyone can verify.
              </p>
            </div>

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

        {/* ── Contact ── */}
        <section id="contact" className="hx-section hx-section-panel">
          <div className="hx-wrap hx-split">
            <div data-reveal>
              <h2 className="hx-h2">Start a project</h2>
              <p className="hx-lead">Tell us what you need built. We reply within 24 hours.</p>
              <p className="hx-muted hx-contact-alt">
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
      </main>

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
              <li><a href="#services" onClick={e => { e.preventDefault(); goTo('services'); }}>What we build</a></li>
              <li><a href="#ai" onClick={e => { e.preventDefault(); goTo('ai'); }}>AI solutions</a></li>
              <li><a href="#work" onClick={e => { e.preventDefault(); goTo('work'); }}>Client work</a></li>
              <li><a href="#contact" onClick={e => { e.preventDefault(); contactFor('Software Development'); }}>Start a project</a></li>
            </ul>
          </div>
          <div>
            <h4>Students</h4>
            <ul>
              <li><a href="#internships" onClick={e => { e.preventDefault(); goTo('internships'); }}>Internships</a></li>
              <li><a href="#products" onClick={e => { e.preventDefault(); goTo('products'); }}>AI Academy</a></li>
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

// ── Styles ─────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600;700&display=swap');

.hx-root{
  --paper:#FFFFFF; --mist:#F6F7F5; --line:#E4E6E2; --dots:#D9DCD6;
  --ink:#15171A; --text:#2B2E33; --muted:#62666D;
  --accent:#0B7A55; --accent-press:#08613F; --accent-soft:#E8F4EE;
  --display:'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif;
  --body:'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif;
  background:var(--paper); color:var(--text); font-family:var(--body); font-size:17px; line-height:1.6;
  overflow-x:clip; -webkit-font-smoothing:antialiased;
}
body{margin:0;background:#FFFFFF;}
/* The app adds a tinted mesh behind every page (GlobalAnimations); keep the landing page pure white */
body.lp-readonly{background:#FFFFFF !important;}
body.lp-readonly::before{display:none !important;}
.lp-readonly, .lp-readonly *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
.lp-readonly input, .lp-readonly textarea, .lp-readonly select{-webkit-user-select:auto;user-select:auto;}
.hx-root *{box-sizing:border-box;}
.hx-root a{color:inherit;}
.hx-root :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px;}
html{scroll-padding-top:84px;}

.hx-wrap{width:100%;max-width:1160px;margin:0 auto;padding:0 24px;}

/* Type */
.hx-h1{font-family:var(--display);font-weight:700;color:var(--ink);font-size:clamp(2.2rem,4.4vw,3.55rem);line-height:1.04;letter-spacing:-0.035em;margin:0 0 24px;max-width:17ch;}
.hx-h2{font-family:var(--display);font-weight:700;color:var(--ink);font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-0.025em;margin:0 0 14px;}
.hx-h3{font-family:var(--display);font-weight:600;color:var(--ink);font-size:1.2rem;line-height:1.3;letter-spacing:-0.01em;margin:0 0 8px;}
.hx-lead{font-size:clamp(1.03rem,1.6vw,1.16rem);color:var(--text);max-width:62ch;margin:0;}
.hx-muted{color:var(--muted);margin:0;}
.hx-link{color:var(--accent);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;}
.hx-link:hover{color:var(--accent-press);text-decoration-thickness:2px;}

/* Buttons */
.hx-btn{font-family:var(--body);font-weight:600;font-size:0.95rem;border-radius:999px;padding:10px 20px;cursor:pointer;border:1px solid transparent;line-height:1.2;transition:background-color .15s ease,border-color .15s ease,color .15s ease;white-space:nowrap;}
.hx-btn-lg{font-size:1.02rem;padding:14px 26px;}
.hx-btn-block{width:100%;}
.hx-btn-primary{background:var(--accent);color:#fff;}
.hx-btn-primary:hover{background:var(--accent-press);}
.hx-btn-primary:disabled{opacity:.6;cursor:progress;}
.hx-btn-ghost{background:var(--paper);color:var(--ink);border-color:#CFD2CC;}
.hx-btn-ghost:hover{border-color:var(--ink);}

/* Nav */
.hx-nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}
.hx-nav-inner{display:flex;align-items:center;gap:28px;height:68px;}
.hx-nav-brand{text-decoration:none;display:flex;}
.hx-brand{display:inline-flex;align-items:center;gap:10px;}
.hx-brand-word{font-family:var(--display);font-weight:700;font-size:1rem;letter-spacing:0.16em;color:var(--ink);}
.hx-nav-links{display:flex;gap:26px;margin-left:8px;}
.hx-nav-links a{text-decoration:none;color:var(--muted);font-size:0.95rem;font-weight:500;}
.hx-nav-links a:hover{color:var(--ink);}
.hx-nav-actions{display:flex;gap:10px;align-items:center;margin-left:auto;}
.hx-menu-btn{display:none;width:42px;height:42px;border-radius:999px;border:1px solid #CFD2CC;background:var(--paper);cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:4px;}
.hx-menu-btn span{display:block;width:16px;height:2px;background:var(--ink);border-radius:2px;}
.hx-mobile-menu{display:flex;flex-direction:column;gap:2px;padding:12px 24px 20px;border-top:1px solid var(--line);background:var(--paper);}
.hx-mobile-menu a{text-decoration:none;padding:10px 0;font-weight:500;color:var(--ink);}
.hx-mobile-menu .hx-btn{margin-top:8px;}

/* Hero */
.hx-hero{padding:80px 0 0;}
.hx-hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:40px;align-items:center;}
.hx-hero-ctas{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;}
.hx-hero-login{margin:20px 0 0;color:var(--muted);font-size:0.95rem;}
.hx-hero-login a{color:var(--accent);font-weight:600;}
.hx-traj{width:100%;height:auto;display:block;}
.hx-traj-label{font-family:var(--body);font-weight:700;font-size:16px;fill:var(--ink);}
.hx-traj-sub{font-family:var(--body);font-size:13px;fill:var(--muted);}
.hx-traj-path{stroke-dasharray:1;stroke-dashoffset:1;animation:hxDraw 1.5s cubic-bezier(.45,.05,.25,1) .15s forwards;}
.hx-traj-head,.hx-traj-dot{opacity:0;animation:hxFade .4s ease 1.55s forwards;}
.hx-traj-stop{opacity:0;animation:hxFade .45s ease forwards;}
@keyframes hxDraw{to{stroke-dashoffset:0;}}
@keyframes hxFade{to{opacity:1;}}

.hx-facts{display:grid;grid-template-columns:repeat(4,1fr);margin:64px 0 0;border-top:1px solid var(--line);}
.hx-facts > div{padding:26px 0 34px;display:flex;flex-direction:column-reverse;gap:2px;}
.hx-facts > div + div{padding-left:24px;border-left:1px solid var(--line);}
.hx-facts dd{margin:0;font-family:var(--display);font-weight:700;font-size:clamp(1.7rem,2.8vw,2.3rem);letter-spacing:-0.02em;color:var(--ink);}
.hx-facts dt{color:var(--muted);font-size:0.93rem;}

/* Sections */
.hx-section{padding:100px 0;}
.hx-section-panel{background:var(--mist);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.hx-section-head{margin-bottom:44px;}
.hx-split{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:56px;align-items:start;}

/* Domain explorer */
.hx-explorer{display:grid;grid-template-columns:260px minmax(0,1fr);border:1px solid var(--line);border-radius:20px;background:var(--paper);overflow:hidden;}
.hx-tabs{display:flex;flex-direction:column;border-right:1px solid var(--line);padding:10px;}
.hx-tab{all:unset;cursor:pointer;padding:11px 14px;border-radius:12px;color:var(--muted);font-weight:500;font-size:0.96rem;}
.hx-tab:hover{color:var(--ink);}
.hx-tab[aria-selected="true"]{color:var(--accent-press);background:var(--accent-soft);font-weight:600;}
.hx-tab:focus-visible{outline:2px solid var(--accent);outline-offset:-2px;}
.hx-panel{padding:34px 38px;}
.hx-panel-title{font-family:var(--display);font-weight:700;color:var(--ink);font-size:1.6rem;letter-spacing:-0.02em;margin:0 0 6px;}
.hx-panel-blurb{color:var(--text);margin:0 0 24px;}
.hx-panel-note{color:var(--muted);font-size:0.92rem;margin:0 0 10px;}
.hx-ladder{list-style:none;margin:0 0 28px;padding:0;position:relative;}
.hx-ladder::before{content:"";position:absolute;left:7px;top:20px;bottom:20px;width:2px;background:var(--line);}
.hx-rung{position:relative;padding:12px 0 12px 32px;display:grid;grid-template-columns:120px minmax(0,1fr);column-gap:16px;row-gap:2px;}
.hx-rung::before{content:"";position:absolute;left:1px;top:19px;width:14px;height:14px;border-radius:50%;background:var(--paper);border:3px solid #B9BDB5;}
.hx-rung:last-child::before{border-color:var(--accent);background:var(--accent);}
.hx-rung-level{color:var(--muted);font-size:0.9rem;grid-row:span 2;padding-top:2px;}
.hx-rung-title{font-weight:700;color:var(--ink);}
.hx-rung-tech{color:var(--muted);font-size:0.9rem;}

.hx-steps-title{margin-top:68px;margin-bottom:20px;}
.hx-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:28px;}
.hx-steps li{border-top:1px solid #CFD2CC;padding-top:18px;}
.hx-steps strong{display:block;margin:12px 0 6px;font-size:1.03rem;color:var(--ink);}
.hx-steps p{margin:0;color:var(--muted);font-size:0.95rem;}
.hx-step-n{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;font-weight:700;font-size:0.82rem;}
.hx-cta-row{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:44px;}

/* ── Motion ──
   Hero: copy rises in on load, alongside the curve drawing itself.
   Sections: [data-reveal] elements rise in once as they scroll into view (see useScrollReveal). */
.hx-hero-copy > *{animation:hxRise .7s cubic-bezier(.2,.7,.2,1) both;}
.hx-hero-copy > :nth-child(1){animation-delay:.05s;}
.hx-hero-copy > :nth-child(2){animation-delay:.18s;}
.hx-hero-copy > :nth-child(3){animation-delay:.3s;}
.hx-hero-copy > :nth-child(4){animation-delay:.42s;}
.hx-facts{animation:hxRise .7s cubic-bezier(.2,.7,.2,1) .55s both;}
@keyframes hxRise{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:none;}}

/* Uses the separate 'translate' property so hover effects that use 'transform' still work */
[data-reveal]{opacity:0;}
[data-reveal].is-in{animation:hxReveal .75s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--d,0ms);}
@keyframes hxReveal{from{opacity:0;translate:0 26px;}to{opacity:1;translate:0 0;}}

/* Hover lift on cards and buttons */
.hx-btn{transition:background-color .15s ease,border-color .15s ease,color .15s ease,transform .2s ease,box-shadow .2s ease;}
.hx-btn:hover{transform:translateY(-1px);}
.hx-btn-primary:hover{box-shadow:0 8px 20px -8px rgba(11,122,85,.55);}
.hx-btn:active{transform:translateY(0);}
.hx-case,.hx-product{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;}
.hx-case:hover,.hx-product:hover{transform:translateY(-3px);box-shadow:0 18px 40px -24px rgba(21,23,26,.28);border-color:#D3D6D0;}
.hx-chip{transition:border-color .2s ease,transform .2s ease;}
.hx-chip:hover{border-color:var(--accent);transform:translateY(-2px);}
.hx-services > div{transition:background-color .2s ease;}
.hx-services > div dt{transition:color .2s ease;}
.hx-services > div:hover dt{color:var(--accent-press);}
.hx-nav-links a{position:relative;}
.hx-nav-links a::after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;background:var(--accent);transform:scaleX(0);transform-origin:left;transition:transform .25s ease;}
.hx-nav-links a:hover::after{transform:scaleX(1);}

/* Domain switcher: content slides in, project steps appear one after another */
.hx-panel{animation:hxPanelIn .35s ease both;}
@keyframes hxPanelIn{from{opacity:0;transform:translateX(10px);}to{opacity:1;transform:none;}}
.hx-rung{animation:hxRise .45s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0) * 110ms + 120ms);}
.hx-tab{transition:background-color .2s ease,color .2s ease;}

/* Mobile menu */
.hx-mobile-menu{animation:hxMenu .22s ease both;}
@keyframes hxMenu{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}

/* Client marquee */
.hx-clients-band{border-top:1px solid var(--line);padding:28px 0 32px;}
.hx-clients-title{margin:0 0 16px;color:var(--muted);font-size:0.95rem;font-weight:500;}
.hx-marquee{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);}
.hx-marquee-track{display:flex;width:max-content;animation:hxMarquee var(--hx-marquee-time,40s) linear infinite;}
.hx-marquee:hover .hx-marquee-track,.hx-marquee:focus-within .hx-marquee-track{animation-play-state:paused;}
.hx-marquee-list{display:flex;gap:12px;list-style:none;margin:0;padding:0 12px 0 0;}
@keyframes hxMarquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
.hx-chip{display:flex;align-items:center;gap:12px;padding:10px 18px 10px 10px;border:1px solid var(--line);border-radius:999px;background:var(--paper);white-space:nowrap;}
.hx-chip-mark{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:var(--ink);color:#fff;font-family:var(--display);font-weight:700;font-size:1rem;flex-shrink:0;}
.hx-chip-nda .hx-chip-mark{background:var(--mist);color:var(--muted);border:1px solid var(--line);}
.hx-chip-text{display:flex;flex-direction:column;line-height:1.2;}
.hx-chip-name{font-weight:700;color:var(--ink);font-size:0.95rem;}
.hx-chip-meta{color:var(--muted);font-size:0.82rem;}
.hx-chip:not(.hx-chip-nda) .hx-chip-meta{color:var(--accent-press);}

/* AI solutions */
.hx-ai{display:grid;grid-template-columns:repeat(2,1fr);gap:0;border-top:1px solid var(--line);}
.hx-ai-item{padding:30px 32px 30px 0;border-bottom:1px solid var(--line);}
.hx-ai-item:nth-child(2n){padding-left:32px;padding-right:0;border-left:1px solid var(--line);}
.hx-ai-item .hx-muted{margin:0 0 12px;max-width:52ch;}
.hx-ai-proof{margin:0;font-size:0.92rem;font-weight:600;color:var(--accent-press);}
.hx-section-tight{padding:56px 0;}
.hx-section-tight .hx-h3{margin-bottom:20px;}
.hx-split-even{grid-template-columns:1fr 1fr;gap:24px;}
.hx-product{border:1px solid var(--line);border-radius:20px;padding:30px;background:var(--paper);}
.hx-product .hx-muted{margin:0 0 20px;}
.hx-product .hx-courses{margin:0;}

/* Academy */
.hx-courses{list-style:none;padding:0;margin:28px 0 32px;display:flex;flex-wrap:wrap;gap:8px;}
.hx-courses li{border:1px solid var(--line);background:var(--paper);border-radius:999px;padding:6px 14px;font-size:0.9rem;color:var(--text);}
.hx-aside{border:1px solid var(--line);border-radius:20px;padding:30px;background:var(--mist);}
.hx-aside .hx-muted{margin:0 0 22px;}

/* Services */
.hx-services{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:0;border-top:1px solid var(--line);}
.hx-services > div{padding:26px 28px 26px 0;border-bottom:1px solid var(--line);}
.hx-services > div:not(:nth-child(3n+1)){padding-left:28px;border-left:1px solid var(--line);}
.hx-services dt{font-weight:700;color:var(--ink);margin-bottom:6px;}
.hx-services dd{margin:0;color:var(--muted);font-size:0.95rem;}
.hx-industries{color:var(--text);margin:28px 0 0;}
.hx-process{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:14px 30px;}
.hx-process li{display:flex;align-items:center;gap:10px;font-weight:600;color:var(--ink);}

/* Client work */
.hx-case{border:1px solid var(--line);border-radius:20px;padding:34px;margin-bottom:20px;background:var(--paper);}
.hx-case-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px;}
.hx-badge{font-size:0.82rem;font-weight:600;color:var(--accent-press);background:var(--accent-soft);border-radius:999px;padding:5px 12px;white-space:nowrap;}
.hx-case-built{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-bottom:20px;}
.hx-case-built strong{display:block;margin-bottom:4px;color:var(--ink);}
.hx-case-built p{margin:0;color:var(--muted);font-size:0.94rem;}
.hx-case-stack{color:var(--muted);font-size:0.94rem;margin:0 0 20px;}
.hx-case-results{display:flex;flex-wrap:wrap;gap:44px;margin:0;padding-top:22px;border-top:1px solid var(--line);}
.hx-case-results > div{display:flex;flex-direction:column;}
.hx-case-results dd{margin:0;font-family:var(--display);font-weight:700;font-size:1.8rem;letter-spacing:-0.02em;color:var(--ink);}
.hx-case-results dt{color:var(--muted);font-size:0.9rem;}
.hx-nda{color:var(--muted);margin:28px 0 0;max-width:80ch;}
.hx-nda strong{color:var(--ink);font-weight:600;}

/* Form */
.hx-form{border:1px solid var(--line);border-radius:20px;padding:30px;background:var(--paper);}
.hx-form-done .hx-muted{margin:0 0 20px;}
.hx-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.hx-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.hx-form-grid .hx-field{margin-bottom:0;}
.hx-field > span{font-size:0.9rem;font-weight:600;color:var(--ink);}
.hx-field em{font-style:normal;color:var(--muted);font-weight:400;}
.hx-field input,.hx-field select,.hx-field textarea{font:inherit;font-size:0.96rem;color:var(--ink);background:var(--paper);border:1px solid #CFD2CC;border-radius:12px;padding:11px 13px;outline:none;width:100%;}
.hx-field input,.hx-field select{min-height:46px;}
.hx-field textarea{resize:vertical;}
.hx-field input::placeholder,.hx-field textarea::placeholder{color:#9A9EA5;}
.hx-field input:focus,.hx-field select:focus,.hx-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(11,122,85,.15);}
.hx-contact-alt{margin-top:20px;}

/* Social */
.hx-social{list-style:none;margin:0;padding:0;display:flex;gap:10px;}
.hx-social a{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;border:1px solid #CFD2CC;color:var(--ink);background:var(--paper);text-decoration:none;transition:border-color .15s ease,color .15s ease,background-color .15s ease;}
.hx-social a:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft);}
.hx-contact-social{display:flex;align-items:center;gap:14px;margin-top:24px;}
.hx-footer .hx-social{flex-direction:row;gap:10px;}
.hx-footer .hx-social a{color:var(--ink);}

/* Footer */
.hx-footer{border-top:1px solid var(--line);padding:60px 0 32px;background:var(--paper);}
.hx-footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:32px;}
.hx-footer-blurb{margin:14px 0 12px;max-width:34ch;font-size:0.95rem;}
.hx-footer h4{font-size:0.95rem;font-weight:700;color:var(--ink);margin:0 0 12px;}
.hx-footer ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
.hx-footer ul a{text-decoration:none;color:var(--muted);font-size:0.94rem;}
.hx-footer ul a:hover{color:var(--ink);}
.hx-footer-legal{margin-top:40px;padding-top:24px;border-top:1px solid var(--line);color:var(--muted);font-size:0.85rem;}

/* Responsive */
@media (max-width: 1100px){
  .hx-nav-links{display:none;}
  .hx-menu-btn{display:inline-flex;}
}
@media (max-width: 960px){
  .hx-menu-btn{display:inline-flex;}
  .hx-hero-grid{grid-template-columns:1fr;}
  .hx-hero-visual{max-width:520px;}
  .hx-split{grid-template-columns:1fr;gap:40px;}
  .hx-split-even{grid-template-columns:1fr;gap:20px;}
  .hx-steps{grid-template-columns:1fr 1fr;}
  .hx-services{grid-template-columns:1fr 1fr;}
  .hx-services > div{padding:22px 20px 22px 0 !important;border-left:none !important;}
  .hx-services > div:nth-child(2n){padding-left:20px !important;border-left:1px solid var(--line) !important;}
  .hx-footer-grid{grid-template-columns:1fr 1fr;}
}
@media (max-width: 720px){
  .hx-root{font-size:16px;}
  .hx-hide-sm{display:none;}
  .hx-traj-label{font-size:21px;}
  .hx-traj-sub{font-size:17px;}
  .hx-hero{padding-top:44px;}
  .hx-section{padding:72px 0;}
  .hx-facts{grid-template-columns:1fr 1fr;}
  .hx-facts > div:nth-child(3){padding-left:0;border-left:none;}
  .hx-facts > div:nth-child(n+3){border-top:1px solid var(--line);}
  .hx-explorer{grid-template-columns:1fr;}
  .hx-tabs{flex-direction:row;overflow-x:auto;border-right:none;border-bottom:1px solid var(--line);scrollbar-width:none;}
  .hx-tab{white-space:nowrap;}
  .hx-panel{padding:24px 20px;}
  .hx-rung{grid-template-columns:1fr;}
  .hx-rung-level{grid-row:auto;}
  .hx-steps{grid-template-columns:1fr;}
  .hx-services{grid-template-columns:1fr;}
  .hx-ai{grid-template-columns:1fr;}
  .hx-ai-item,.hx-ai-item:nth-child(2n){padding:24px 0;border-left:none;}
  .hx-services > div,.hx-services > div:nth-child(2n){padding:20px 0 !important;border-left:none !important;}
  .hx-form-grid{grid-template-columns:1fr;}
  .hx-case{padding:24px 20px;}
  .hx-footer-grid{grid-template-columns:1fr;}
}
@media (max-width: 420px){
  .hx-nav-actions .hx-btn-primary{padding:9px 14px;font-size:0.88rem;}
  .hx-brand-word{display:none;}
}
@media (prefers-reduced-motion: reduce){
  .hx-hero-copy > *,.hx-facts,.hx-panel,.hx-rung,.hx-mobile-menu{animation:none !important;}
  [data-reveal],[data-reveal].is-in{opacity:1 !important;animation:none !important;}
  .hx-btn:hover,.hx-case:hover,.hx-product:hover,.hx-chip:hover{transform:none;}
  .hx-marquee{-webkit-mask-image:none;mask-image:none;}
  .hx-marquee-track{animation:none;width:auto;padding:0 24px;}
  .hx-marquee-list{flex-wrap:wrap;}
  .hx-marquee-list[aria-hidden="true"]{display:none;}
  .hx-chip-repeat{display:none;}
  .hx-traj-path{animation:none;stroke-dashoffset:0;}
  .hx-traj-head,.hx-traj-dot,.hx-traj-stop{animation:none;opacity:1;}
  .hx-btn{transition:none;}
}
`;