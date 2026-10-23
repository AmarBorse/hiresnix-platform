// src/pages/LandingPage.tsx
// Public landing page — Hiresnix as an AI-powered software development company.
// Design: the hero is a "project starter" — visitors pick what they want built and can send a pre-filled enquiry.
// Business services come first; internships and the AI Academy sit lower on the page.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';
import { HiresnixChatbot } from '../components/HiresnixChatbot';

const ENQUIRY_RESPONSE_TIMEOUT_MS = 8000;
const INTEREST_OPTIONS = ['Software Development', 'AI Solutions', 'SaaS Product', 'Web Development', 'Mobile App', 'UI/UX Design', 'Internship Platform', 'Partnership', 'Other'];

const AI_MESSAGE = 'We would like to add AI to our business. ';

// ── Project starter (hero) ──────────────────────────────────────────
// `interest` must be one of INTEREST_OPTIONS so the enquiry form can pre-select it.
const PROJECT_TYPES = [
  { id: 'web', label: 'Web app', noun: 'a web app', interest: 'Web Development',
    gets: ['A fast web app that works on phones, tablets and laptops', 'An admin panel so your team can manage content and users', 'Hosting, domain and launch handled for you'],
    phases: [['Discovery', 'Goals, users and scope'], ['Design', 'Screens you approve before we code'], ['Build', 'Weekly demos of working software'], ['Launch', 'Go live, then ongoing support']] },
  { id: 'mobile', label: 'Mobile app', noun: 'a mobile app', interest: 'Mobile App',
    gets: ['One app for both Android and iOS', 'Play Store and App Store release', 'Push notifications and usage analytics'],
    phases: [['Discovery', 'Features and target users'], ['Design', 'Clickable prototype on your phone'], ['Build', 'Test builds you can install'], ['Release', 'Store listing, launch and updates']] },
  { id: 'ai', label: 'AI assistant', noun: 'an AI assistant', interest: 'AI Solutions',
    gets: ['Answers that come from your own documents and data', 'Works on your website or inside your internal tools', 'You review its answers before customers see them'],
    phases: [['Collect', 'Your documents, FAQs and data'], ['Build', 'Search, answers and guardrails'], ['Test', 'Your team checks real questions'], ['Launch', 'Go live and track answer quality']] },
  { id: 'saas', label: 'SaaS product', noun: 'a SaaS product', interest: 'SaaS Product',
    gets: ['Sign-up, teams and subscription billing', 'Dashboards for your customers', 'Built to add customers without a rewrite'],
    phases: [['Discovery', 'Pricing, plans and core workflow'], ['Design', 'The product, screen by screen'], ['Build', 'Working releases every sprint'], ['Launch', 'First customers, then growth features']] },
  { id: 'custom', label: 'Custom software', noun: 'custom software', interest: 'Software Development',
    gets: ['CRM, ERP or workflow tools built around how you work', 'Connects to the tools you already use', 'Maintenance and new features after launch'],
    phases: [['Discovery', 'How your team works today'], ['Design', 'The new workflow, on screen'], ['Build', 'Rolled out module by module'], ['Support', 'Training, fixes and improvements']] },
];

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

type Preset = { interest: string; message: string; key: number };

// ── Brand mark (arrow rising to a dot, as in the logo) ──────────────
function BrandMark({ light = false }: { light?: boolean }) {
  const ink = light ? '#FFFFFF' : 'var(--ink)';
  return (
    <span className="hx-brand" aria-label="Hiresnix">
      <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
        <path d="M1 22 C 10 21, 17 16, 21 7" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        <path d="M15 8 L22 4.5 L23.5 12.5" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27" cy="3" r="2.6" fill="var(--accent-bright)" />
      </svg>
      <span className="hx-brand-word">Hiresnix</span>
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

// ── Project starter (the hero's interactive panel) ─────────────────
function ProjectStarter({ onPlan }: { onPlan: (interest: string, message: string) => void }) {
  const [active, setActive] = useState(PROJECT_TYPES[0].id);
  const type = PROJECT_TYPES.find(t => t.id === active) || PROJECT_TYPES[0];

  return (
    <div className="hx-starter">
      <p className="hx-starter-q" id="hx-starter-q">What do you want to build?</p>
      <div className="hx-starter-types" role="group" aria-labelledby="hx-starter-q">
        {PROJECT_TYPES.map(t => (
          <button
            key={t.id} type="button" className="hx-type" aria-pressed={t.id === active}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="hx-starter-body" key={type.id} aria-live="polite">
        <div className="hx-starter-gets">
          <h2 className="hx-starter-h">What you get</h2>
          <ul>
            {type.gets.map(g => <li key={g}>{g}</li>)}
          </ul>
        </div>
        <div className="hx-starter-flow">
          <h2 className="hx-starter-h">How it runs</h2>
          <ol>
            {type.phases.map(([name, note], i) => (
              <li key={name} style={{ ['--i' as any]: i }}>
                <span className="hx-phase-n" aria-hidden="true">{i + 1}</span>
                <span className="hx-phase-name">{name}</span>
                <span className="hx-phase-note">{note}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="hx-starter-foot">
        <button
          className="hx-btn hx-btn-primary hx-btn-lg" type="button"
          onClick={() => onPlan(type.interest, `We'd like to build ${type.noun}. `)}
        >
          Plan this project
        </button>
        <span className="hx-muted">Free first call. We reply within 24 hours.</span>
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
        <p className="hx-panel-note">The three projects you build, from first to last:</p>
        <ol className="hx-ladder">
          {domain.projects.map(([title, tech], i) => (
            <li key={title} className="hx-rung">
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

// ── Case study ─────────────────────────────────────────────────────
type CaseData = { name: string; meta: string; built: { title: string; desc: string }[]; stack: string[]; results: { value: string; label: string }[] };

function CaseStudy({ c }: { c: CaseData }) {
  return (
    <article className="hx-case">
      <div className="hx-case-main">
        <h3 className="hx-case-name">{c.name}</h3>
        {c.meta && <p className="hx-muted">{c.meta}</p>}
        {c.built.length > 0 && (
          <dl className="hx-case-built">
            {c.built.map((w, i) => <div key={i}><dt>{w.title}</dt><dd>{w.desc}</dd></div>)}
          </dl>
        )}
        {c.stack.length > 0 && <p className="hx-case-stack">Built with {c.stack.join(', ')}.</p>}
      </div>
      {c.results.length > 0 && (
        <dl className="hx-case-results">
          {c.results.map((r, i) => <div key={i}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
        </dl>
      )}
    </article>
  );
}

// ── Enquiry form (same submission behaviour as before) ─────────────
function EnquiryForm({ preset }: { preset: Preset | null }) {
  const empty = { name: '', email: '', phone: '', interest: 'Software Development', message: '' };
  const [form, setForm] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!preset) return;
    setSubmitted(false);
    setForm(p => ({
      ...p,
      interest: preset.interest || p.interest,
      // Only pre-fill the message if the visitor hasn't started typing their own
      message: preset.message && (!p.message.trim() || PROJECT_TYPES.some(t => p.message.startsWith(`We'd like to build ${t.noun}.`)) || p.message === AI_MESSAGE) ? preset.message : p.message,
    }));
  }, [preset]);
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
        <textarea id="hx-message" required rows={5} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Tell us about your project or requirement" />
      </label>
      <button type="submit" disabled={loading} className="hx-btn hx-btn-primary hx-btn-lg hx-btn-block">
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
  const [preset, setPreset] = useState<Preset | null>(null);

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

  const reduceMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const goTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  };
  const applyNow = () => navigate('/auth?tab=register');
  const contactFor = (interest: string, message = '') => {
    setPreset({ interest, message, key: Date.now() });
    goTo('contact');
    // Put the cursor in the message box once the scroll has finished
    if (message) setTimeout(() => document.getElementById('hx-message')?.focus({ preventScroll: true }), reduceMotion() ? 0 : 700);
  };

  const publicClients = landingClients.filter((c: any) => !c.nda_protected && c?.name);
  const ndaClients = [...NDA_CLIENTS, ...landingClients.filter((c: any) => c.nda_protected).map((c: any) => c.industry || 'NDA client')];

  const cases: CaseData[] = [
    {
      name: 'Focktix Limited', meta: 'Digital marketing agency, Maharashtra',
      built: [
        { title: 'Custom CRM system', desc: "Client and lead management built around the agency's workflow." },
        { title: 'Campaign dashboard', desc: 'Live analytics for ad performance across platforms.' },
        { title: 'AI lead scoring', desc: 'Machine learning that ranks leads so the team calls the best ones first.' },
      ],
      stack: ['React.js', 'Node.js', 'PostgreSQL', 'Groq AI', 'REST APIs', 'Vercel'],
      results: [{ value: '3×', label: 'lead conversion' }, { value: '60%', label: 'less manual work' }, { value: '99.9%', label: 'uptime' }],
    },
    ...publicClients.map((c: any) => ({
      name: String(c.name),
      meta: [c.industry, c.location].filter(Boolean).join(', '),
      built: parseList(c.what_we_built).filter((w: any) => w?.title).map((w: any) => ({ title: String(w.title), desc: String(w.desc || '') })),
      stack: parseList(c.tech_stack).filter(Boolean).map(String),
      results: parseList(c.results).filter((r: any) => r?.value).map((r: any) => ({ value: String(r.value), label: String(r.label || '') })),
    })),
  ];
  const clientNames = cases.map(c => c.name);

  const NAV: [string, string][] = [['services', 'Services'], ['ai', 'AI solutions'], ['work', 'Work'], ['products', 'Products'], ['internships', 'Internships'], ['contact', 'Contact']];
  const navLink = (id: string, label: string) => (
    <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); goTo(id); }}>{label}</a>
  );

  return (
    <div className="hx-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <style>{CSS}</style>

      {/* ── Navigation ── */}
      <header className="hx-nav">
        <div className="hx-wrap hx-nav-inner">
          <a href="#top" className="hx-nav-brand" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0 }); }}><BrandMark /></a>
          <nav className="hx-nav-links" aria-label="Main">
            {NAV.map(([id, label]) => navLink(id, label))}
          </nav>
          <div className="hx-nav-actions">
            <button className="hx-btn hx-btn-quiet hx-hide-sm" type="button" onClick={() => navigate('/auth')}>Log in</button>
            <button className="hx-btn hx-btn-primary" type="button" onClick={() => contactFor('Software Development')}>Start a project</button>
            <button className="hx-menu-btn" type="button" aria-expanded={menuOpen} aria-controls="hx-mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(o => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="hx-mobile-menu" className="hx-mobile-menu" aria-label="Mobile">
            {NAV.map(([id, label]) => navLink(id, label))}
            <button className="hx-btn hx-btn-ghost hx-btn-block" type="button" onClick={() => navigate('/auth')}>Log in</button>
          </nav>
        )}
      </header>

      <main id="top">
        {/* ── Hero ── */}
        <section className="hx-hero">
          <div className="hx-wrap">
            <h1 className="hx-h1">
              <span className="hx-h1-line">We build software</span>{' '}
              <span className="hx-h1-line">and AI products for</span>{' '}
              <span className="hx-h1-line">growing businesses.</span>
            </h1>
            <div className="hx-hero-sub">
              <p className="hx-lead">
                Hiresnix designs, builds and looks after web apps, mobile apps and AI tools for startups, businesses
                and institutions across India, from the first sketch to support after launch.
              </p>
              <p className="hx-hero-students">
                Looking for an internship?{' '}
                <a href="#internships" className="hx-link" onClick={e => { e.preventDefault(); goTo('internships'); }}>See domains and projects</a>
              </p>
            </div>
            <ProjectStarter onPlan={contactFor} />
          </div>
        </section>

        {/* ── Proof strip ── */}
        <section className="hx-proof" aria-label="Hiresnix in numbers">
          <div className="hx-wrap">
            <dl className="hx-facts">
              <div><dt>clients served</dt><dd>50+</dd></div>
              <div><dt>services, design to support</dt><dd>9</dd></div>
              <div><dt>industries</dt><dd>7</dd></div>
              <div><dt>developers trained</dt><dd>500+</dd></div>
            </dl>
            <p className="hx-clients-line">
              <span className="hx-muted">Software we have built for </span>
              {clientNames.join(', ')}
              <span className="hx-muted">, and {ndaClients.length} more clients under NDA.</span>
            </p>
          </div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="hx-section">
          <div className="hx-wrap hx-aside-layout">
            <div className="hx-aside">
              <h2 className="hx-h2">What we build</h2>
              <p className="hx-lead">One team for the whole job: product design, engineering, AI and the support that keeps it running.</p>
              <button className="hx-btn hx-btn-ghost" type="button" onClick={() => contactFor('Software Development')}>Talk to us about your project</button>
            </div>
            <div>
              <dl className="hx-services">
                {SERVICES.map(([t, d]) => (
                  <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
                ))}
              </dl>
              <p className="hx-industries">
                Industries we have worked in: education, healthcare, retail, manufacturing, finance, e-commerce and startups.
              </p>
            </div>
          </div>
        </section>

        {/* ── AI solutions (forest band) ── */}
        <section id="ai" className="hx-section hx-forest">
          <div className="hx-wrap">
            <div className="hx-section-head">
              <h2 className="hx-h2">AI that does real work</h2>
              <p className="hx-lead">We add AI where it saves your team time or makes you money, and we tell you plainly when it won't.</p>
            </div>
            <div className="hx-ai">
              {AI_CAPABILITIES.map(([title, desc, proof]) => (
                <div key={title} className="hx-ai-item">
                  <h3 className="hx-h3">{title}</h3>
                  <p>{desc}</p>
                  <p className="hx-ai-proof">{proof}</p>
                </div>
              ))}
            </div>
            <div className="hx-cta-row">
              <button className="hx-btn hx-btn-light hx-btn-lg" type="button" onClick={() => contactFor('AI Solutions', AI_MESSAGE)}>Discuss an AI project</button>
            </div>
          </div>
        </section>

        {/* ── Process ── */}
        <section className="hx-section hx-section-tight">
          <div className="hx-wrap">
            <h2 className="hx-h3">How every project runs</h2>
            <ol className="hx-process">
              {PROCESS.map((p, i) => (
                <li key={p}><span className="hx-step-n" aria-hidden="true">{i + 1}</span><span>{p}</span></li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Client work ── */}
        <section id="work" className="hx-section hx-panel-bg">
          <div className="hx-wrap">
            <div className="hx-section-head">
              <h2 className="hx-h2">Client work</h2>
              <p className="hx-lead">Software we have delivered for growing businesses across India.</p>
            </div>
            <div className="hx-cases">
              {cases.map(c => <CaseStudy key={c.name} c={c} />)}
            </div>
            <p className="hx-nda"><strong>Other clients, under NDA:</strong> {ndaClients.join(', ')}.</p>
          </div>
        </section>

        {/* ── Our own products ── */}
        <section id="products" className="hx-section">
          <div className="hx-wrap">
            <div className="hx-section-head">
              <h2 className="hx-h2">Products we run</h2>
              <p className="hx-lead">We build and operate our own AI products too, so the tools we recommend are ones we use every day.</p>
            </div>
            <div className="hx-products">
              <article className="hx-product">
                <h3 className="hx-h3">AI Academy</h3>
                <p className="hx-muted">Sixteen self-paced programming courses with an AI teacher for every lesson, a code runner in the browser and quizzes.</p>
                <ul className="hx-courses" aria-label="Courses">
                  {ACADEMY_COURSES.map(c => <li key={c}>{c}</li>)}
                </ul>
              </article>
              <article className="hx-product">
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
        <section id="internships" className="hx-section hx-panel-bg">
          <div className="hx-wrap">
            <div className="hx-section-head">
              <h2 className="hx-h2">Internships</h2>
              <p className="hx-lead">
                We train developers on the same kind of work we ship for clients. Choose a domain and a duration from
                1 to 6 months, build three projects that get harder as you go, and finish with documents anyone can verify.
              </p>
            </div>

            <DomainExplorer onApply={applyNow} />

            <h3 className="hx-h3 hx-steps-title">How the internship works</h3>
            <ol className="hx-steps">
              {INTERN_STEPS.map(([title, desc], i) => (
                <li key={title}>
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
        <section id="contact" className="hx-section">
          <div className="hx-wrap hx-contact">
            <div>
              <h2 className="hx-h2">Start a project</h2>
              <p className="hx-lead">Tell us what you need built. We reply within 24 hours.</p>
              <dl className="hx-contact-list">
                <div><dt>Email</dt><dd><a className="hx-link" href="mailto:hr@hiresnix.co.in">hr@hiresnix.co.in</a></dd></div>
                <div><dt>Phone</dt><dd><a className="hx-link" href="tel:+919529120977">+91 95291 20977</a></dd></div>
                <div><dt>Office</dt><dd>Shirpur, Dhule, Maharashtra</dd></div>
              </dl>
              <SocialLinks />
            </div>
            <EnquiryForm preset={preset} />
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="hx-footer">
        <div className="hx-wrap hx-footer-grid">
          <div>
            <BrandMark light />
            <p className="hx-footer-blurb">AI-powered software development for startups, businesses and institutions.</p>
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
@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&display=swap');

.hx-root{
  --paper:#FBFBF8; --panel:#F1F4EF; --line:#DCE3DE; --line-strong:#C3CEC7;
  --ink:#102A22; --text:#33403B; --muted:#5C6964;
  --accent:#0B7A55; --accent-press:#08613F; --accent-soft:#E3F1EA; --accent-bright:#1FA874;
  --forest:#0E3B2C; --forest-line:rgba(255,255,255,.16); --forest-text:#D5E6DD;
  --font:'Schibsted Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --wrap:1200px; --gutter:clamp(20px,4vw,40px);
  background:var(--paper); color:var(--text);
  font-family:var(--font); font-size:17px; line-height:1.6;
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
  min-height:100vh; position:relative; isolation:isolate;
}
/* Resets use :where() so they never out-rank the component classes below */
:where(.hx-root) *, :where(.hx-root) *::before, :where(.hx-root) *::after{ box-sizing:border-box; }
:where(.hx-root) :where(h1, h2, h3, h4, p, dl, dd, ol, ul){ margin:0; padding:0; }
:where(.hx-root) :where(ol, ul){ list-style:none; }
:where(.hx-root) a{ color:inherit; text-decoration:none; }
:where(.hx-root) button{ font:inherit; cursor:pointer; }
.hx-root :focus-visible{ outline:3px solid var(--accent); outline-offset:3px; border-radius:6px; }
.hx-forest :focus-visible, .hx-footer :focus-visible{ outline-color:#8FE0BC; }

.hx-wrap{ width:100%; max-width:var(--wrap); margin:0 auto; padding:0 var(--gutter); }

/* ── Type ── */
.hx-h1{
  color:var(--ink); font-weight:800;
  font-size:clamp(2.5rem, 6vw, 5.25rem); line-height:.98; letter-spacing:-.045em;
  max-width:17ch; text-wrap:balance;
}
.hx-h1-line{ display:inline; }
.hx-h2{ color:var(--ink); font-weight:700; font-size:clamp(2rem, 3.6vw, 3rem); line-height:1.04; letter-spacing:-.035em; text-wrap:balance; }
.hx-h3{ color:var(--ink); font-weight:700; font-size:1.25rem; line-height:1.25; letter-spacing:-.015em; }
.hx-lead{ font-size:clamp(1.06rem, 1.4vw, 1.2rem); line-height:1.55; color:var(--text); max-width:56ch; }
.hx-muted{ color:var(--muted); }
.hx-link{ color:var(--accent); font-weight:600; text-decoration:underline; text-decoration-thickness:1.5px; text-underline-offset:3px; }
.hx-link:hover{ color:var(--accent-press); }

/* ── Buttons ── */
.hx-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  min-height:44px; padding:10px 20px; border-radius:10px; border:1.5px solid transparent;
  font-weight:600; font-size:.97rem; line-height:1.2; white-space:nowrap;
  transition:background-color .15s ease, border-color .15s ease, color .15s ease;
}
.hx-btn-lg{ min-height:52px; padding:14px 26px; font-size:1.02rem; }
.hx-btn-block{ width:100%; }
.hx-btn-primary{ background:var(--accent); color:#fff; }
.hx-btn-primary:hover{ background:var(--accent-press); }
.hx-btn-primary:disabled{ opacity:.6; cursor:wait; }
.hx-btn-ghost{ background:transparent; color:var(--ink); border-color:var(--line-strong); }
.hx-btn-ghost:hover{ border-color:var(--ink); }
.hx-btn-quiet{ background:transparent; color:var(--ink); }
.hx-btn-quiet:hover{ background:var(--panel); }
.hx-btn-light{ background:#fff; color:var(--forest); }
.hx-btn-light:hover{ background:var(--accent-soft); }

/* ── Navigation ── */
.hx-nav{ position:sticky; top:0; z-index:40; background:rgba(251,251,248,.92); backdrop-filter:saturate(1.4) blur(10px); -webkit-backdrop-filter:saturate(1.4) blur(10px); border-bottom:1px solid var(--line); }
.hx-nav-inner{ display:flex; align-items:center; gap:24px; height:68px; }
.hx-brand{ display:inline-flex; align-items:center; gap:10px; }
.hx-brand-word{ font-weight:800; font-size:1.2rem; letter-spacing:-.03em; color:var(--ink); }
.hx-nav-links{ display:flex; gap:4px; margin:0 auto; }
.hx-nav-links a{ padding:8px 12px; border-radius:8px; font-weight:500; font-size:.95rem; color:var(--text); }
.hx-nav-links a:hover{ color:var(--ink); background:var(--panel); }
.hx-nav-actions{ display:flex; align-items:center; gap:8px; }
.hx-menu-btn{ display:none; width:44px; height:44px; border:1.5px solid var(--line-strong); border-radius:10px; background:transparent; flex-direction:column; align-items:center; justify-content:center; gap:4px; }
.hx-menu-btn span{ display:block; width:18px; height:2px; background:var(--ink); border-radius:2px; }
.hx-mobile-menu{ display:flex; flex-direction:column; gap:2px; padding:12px var(--gutter) 20px; border-top:1px solid var(--line); background:var(--paper); }
.hx-mobile-menu a{ padding:12px 4px; font-weight:600; color:var(--ink); border-bottom:1px solid var(--line); }
.hx-mobile-menu .hx-btn{ margin-top:12px; }

/* ── Hero ── */
.hx-hero{ padding:clamp(48px, 7vw, 88px) 0 clamp(48px, 6vw, 72px); }
.hx-hero-sub{ display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:end; gap:24px 48px; margin:clamp(24px, 3vw, 36px) 0 clamp(36px, 5vw, 56px); }
.hx-hero-students{ font-size:.95rem; color:var(--muted); text-align:right; }

/* Project starter: the one bold element on the page */
.hx-starter{ background:#fff; border:1.5px solid var(--ink); border-radius:20px; padding:clamp(20px, 3vw, 36px); box-shadow:8px 8px 0 var(--accent-soft); }
.hx-starter-q{ color:var(--ink); font-weight:700; font-size:1.15rem; letter-spacing:-.01em; margin-bottom:14px; }
.hx-starter-types{ display:flex; flex-wrap:wrap; gap:8px; padding-bottom:24px; border-bottom:1px solid var(--line); }
.hx-type{ min-height:44px; padding:9px 18px; border-radius:999px; border:1.5px solid var(--line-strong); background:#fff; color:var(--ink); font-weight:600; font-size:.97rem; transition:background-color .15s ease, border-color .15s ease, color .15s ease; }
.hx-type:hover{ border-color:var(--ink); }
.hx-type[aria-pressed="true"]{ background:var(--ink); border-color:var(--ink); color:#fff; }
.hx-starter-body{ display:grid; grid-template-columns:minmax(0, 5fr) minmax(0, 7fr); gap:clamp(24px, 4vw, 56px); padding:28px 0; }
.hx-starter-h{ font-size:.92rem; font-weight:600; color:var(--muted); letter-spacing:0; margin-bottom:12px; }
.hx-starter-gets li{ position:relative; padding:8px 0 8px 30px; color:var(--ink); font-weight:500; line-height:1.4; border-bottom:1px solid var(--line); }
.hx-starter-gets li:last-child{ border-bottom:0; }
.hx-starter-gets li::before{ content:''; position:absolute; left:2px; top:13px; width:14px; height:8px; border-left:2.5px solid var(--accent); border-bottom:2.5px solid var(--accent); transform:rotate(-45deg); }
.hx-starter-flow ol{ display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; position:relative; }
.hx-starter-flow li{ position:relative; display:flex; flex-direction:column; gap:4px; padding-top:44px; }
.hx-starter-flow li::before{ content:''; position:absolute; top:15px; left:34px; right:-12px; height:2px; background:var(--line-strong); }
.hx-starter-flow li:last-child::before{ display:none; }
.hx-phase-n{ position:absolute; top:0; left:0; width:32px; height:32px; border-radius:50%; display:grid; place-items:center; background:var(--accent-soft); color:var(--accent-press); font-weight:700; font-size:.9rem; }
.hx-starter-flow li:last-child .hx-phase-n{ background:var(--accent); color:#fff; }
.hx-phase-name{ color:var(--ink); font-weight:700; line-height:1.25; }
.hx-phase-note{ color:var(--muted); font-size:.9rem; line-height:1.4; }
.hx-starter-foot{ display:flex; flex-wrap:wrap; align-items:center; gap:12px 20px; padding-top:24px; border-top:1px solid var(--line); }
.hx-starter-foot .hx-muted{ font-size:.95rem; }

/* The page's single orchestrated motion moment: hero load + project switch */
@media (prefers-reduced-motion: no-preference){
  .hx-h1-line{ display:inline-block; animation:hx-rise .7s cubic-bezier(.2,.7,.2,1) both; }
  .hx-h1-line:nth-child(2){ animation-delay:.08s; }
  .hx-h1-line:nth-child(3){ animation-delay:.16s; }
  .hx-hero-sub{ animation:hx-fade .6s .3s ease both; }
  .hx-starter{ animation:hx-rise .7s .4s cubic-bezier(.2,.7,.2,1) both; }
  .hx-starter-gets li, .hx-starter-flow li{ animation:hx-fade .35s ease both; }
  .hx-starter-flow li{ animation-delay:calc(var(--i, 0) * 60ms); }
}
@keyframes hx-rise{ from{ opacity:0; transform:translateY(18px); } to{ opacity:1; transform:none; } }
@keyframes hx-fade{ from{ opacity:0; } to{ opacity:1; } }

/* ── Proof strip ── */
.hx-proof{ border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:32px 0; }
.hx-facts{ display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); }
.hx-facts > div{ display:flex; flex-direction:column-reverse; gap:2px; padding:4px 24px; border-left:1px solid var(--line); }
.hx-facts > div:first-child{ border-left:0; padding-left:0; }
.hx-facts dd{ color:var(--ink); font-weight:800; font-size:clamp(1.8rem, 3vw, 2.4rem); letter-spacing:-.04em; line-height:1.1; font-variant-numeric:tabular-nums; }
.hx-facts dt{ color:var(--muted); font-size:.93rem; }
.hx-clients-line{ margin-top:24px; padding-top:20px; border-top:1px solid var(--line); color:var(--ink); font-weight:600; font-size:.97rem; }
.hx-clients-line .hx-muted{ font-weight:400; }

/* ── Sections ── */
.hx-section{ padding:clamp(72px, 9vw, 120px) 0; }
.hx-section-tight{ padding:clamp(48px, 6vw, 72px) 0; }
.hx-panel-bg{ background:var(--panel); }
.hx-section-head{ display:flex; flex-direction:column; gap:16px; margin-bottom:clamp(36px, 5vw, 56px); max-width:760px; }
.hx-cta-row{ display:flex; flex-wrap:wrap; align-items:center; gap:16px 24px; margin-top:clamp(32px, 4vw, 48px); }

/* Services: sticky intro + list */
.hx-aside-layout{ display:grid; grid-template-columns:minmax(0, 4fr) minmax(0, 7fr); gap:clamp(32px, 6vw, 96px); align-items:start; }
.hx-aside{ position:sticky; top:100px; display:flex; flex-direction:column; align-items:flex-start; gap:20px; }
.hx-services > div{ display:grid; grid-template-columns:minmax(0, 2fr) minmax(0, 3fr); gap:8px 32px; padding:20px 0; border-top:1px solid var(--line); }
.hx-services > div:last-child{ border-bottom:1px solid var(--line); }
.hx-services dt{ color:var(--ink); font-weight:700; font-size:1.08rem; letter-spacing:-.01em; }
.hx-services dd{ color:var(--muted); line-height:1.5; }
.hx-industries{ margin-top:24px; color:var(--muted); font-size:.97rem; }

/* AI: forest band */
.hx-forest{ background:var(--forest); color:var(--forest-text); }
.hx-forest .hx-h2, .hx-forest .hx-h3{ color:#fff; }
.hx-forest .hx-lead{ color:var(--forest-text); }
.hx-ai{ display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); border-top:1px solid var(--forest-line); }
.hx-ai-item{ display:flex; flex-direction:column; gap:10px; padding:32px 40px 32px 0; border-bottom:1px solid var(--forest-line); }
.hx-ai-item:nth-child(even){ padding:32px 0 32px 40px; border-left:1px solid var(--forest-line); }
.hx-ai-item p{ max-width:46ch; line-height:1.55; }
.hx-ai-proof{ margin-top:auto; padding-top:8px; color:#8FE0BC; font-weight:600; font-size:.95rem; }

/* Process: a real sequence, so numbered */
.hx-process{ display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:12px; margin-top:28px; }
.hx-process li{ position:relative; display:flex; flex-direction:column; gap:12px; color:var(--ink); font-weight:600; }
.hx-process li::after{ content:''; position:absolute; top:17px; left:44px; right:-6px; height:2px; background:var(--line-strong); }
.hx-process li:last-child::after{ display:none; }
.hx-step-n{ width:36px; height:36px; flex:none; border-radius:50%; display:grid; place-items:center; border:2px solid var(--accent); color:var(--accent-press); background:var(--paper); font-weight:700; font-size:.92rem; }

/* Client work */
.hx-cases{ display:flex; flex-direction:column; gap:20px; }
.hx-case{ display:grid; grid-template-columns:minmax(0, 8fr) minmax(0, 3fr); gap:clamp(24px, 4vw, 64px); background:#fff; border:1px solid var(--line); border-radius:20px; padding:clamp(24px, 4vw, 44px); }
.hx-case-name{ color:var(--ink); font-weight:800; font-size:clamp(1.6rem, 2.6vw, 2.1rem); letter-spacing:-.035em; line-height:1.1; margin-bottom:4px; }
.hx-case-built{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:24px; margin-top:28px; }
.hx-case-built dt{ color:var(--ink); font-weight:700; margin-bottom:4px; }
.hx-case-built dd{ color:var(--muted); font-size:.95rem; line-height:1.5; }
.hx-case-stack{ margin-top:24px; color:var(--muted); font-size:.93rem; }
.hx-case-results{ display:flex; flex-direction:column; justify-content:center; border-left:1px solid var(--line); padding-left:clamp(24px, 3vw, 40px); }
.hx-case-results > div{ display:flex; flex-direction:column-reverse; padding:12px 0; border-bottom:1px solid var(--line); }
.hx-case-results > div:last-child{ border-bottom:0; }
.hx-case-results dd{ color:var(--accent); font-weight:800; font-size:clamp(2rem, 3.4vw, 2.8rem); letter-spacing:-.045em; line-height:1; }
.hx-case-results dt{ color:var(--muted); font-size:.93rem; margin-top:4px; }
.hx-nda{ margin-top:28px; color:var(--muted); }
.hx-nda strong{ color:var(--ink); }

/* Products */
.hx-products{ display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); border-top:1.5px solid var(--ink); }
.hx-product{ display:flex; flex-direction:column; align-items:flex-start; gap:14px; padding:32px 48px 0 0; }
.hx-product + .hx-product{ padding:32px 0 0 48px; border-left:1px solid var(--line); }
.hx-courses{ display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
.hx-courses li{ padding:5px 12px; border-radius:999px; background:var(--panel); color:var(--text); font-size:.88rem; font-weight:500; }

/* Internships: domain explorer */
.hx-explorer{ display:grid; grid-template-columns:minmax(220px, 3fr) minmax(0, 7fr); background:#fff; border:1px solid var(--line); border-radius:20px; overflow:hidden; }
.hx-tabs{ display:flex; flex-direction:column; padding:12px; border-right:1px solid var(--line); background:var(--paper); }
.hx-tab{ text-align:left; padding:12px 14px; border:0; border-radius:10px; background:transparent; color:var(--text); font-weight:500; font-size:.97rem; }
.hx-tab:hover{ background:var(--panel); color:var(--ink); }
.hx-tab[aria-selected="true"]{ background:var(--ink); color:#fff; font-weight:600; }
.hx-panel{ display:flex; flex-direction:column; align-items:flex-start; gap:10px; padding:clamp(24px, 4vw, 44px); }
.hx-panel-title{ color:var(--ink); font-weight:800; font-size:clamp(1.5rem, 2.4vw, 1.9rem); letter-spacing:-.03em; line-height:1.1; }
.hx-panel-blurb{ color:var(--text); }
.hx-panel-note{ margin-top:12px; color:var(--muted); font-size:.93rem; }
.hx-ladder{ align-self:stretch; display:flex; flex-direction:column; margin-bottom:20px; }
.hx-rung{ display:grid; grid-template-columns:120px minmax(0, 1fr); gap:2px 20px; padding:14px 0; border-top:1px solid var(--line); }
.hx-rung:last-child{ border-bottom:1px solid var(--line); }
.hx-rung-level{ grid-row:span 2; color:var(--accent-press); font-weight:700; font-size:.93rem; }
.hx-rung-title{ color:var(--ink); font-weight:700; }
.hx-rung-tech{ color:var(--muted); font-size:.92rem; }
.hx-steps-title{ margin:clamp(48px, 6vw, 72px) 0 24px; }
.hx-steps{ display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:32px; }
.hx-steps li{ display:flex; flex-direction:column; gap:8px; }
.hx-steps .hx-step-n{ background:var(--panel); margin-bottom:6px; }
.hx-steps strong{ color:var(--ink); font-weight:700; }
.hx-steps p{ color:var(--muted); font-size:.95rem; line-height:1.5; }

/* Contact */
.hx-contact{ display:grid; grid-template-columns:minmax(0, 5fr) minmax(0, 7fr); gap:clamp(32px, 6vw, 96px); align-items:start; }
.hx-contact > div:first-child{ display:flex; flex-direction:column; gap:20px; }
.hx-contact-list{ display:flex; flex-direction:column; margin-top:8px; }
.hx-contact-list > div{ display:grid; grid-template-columns:80px minmax(0, 1fr); gap:16px; padding:14px 0; border-top:1px solid var(--line); }
.hx-contact-list > div:last-child{ border-bottom:1px solid var(--line); }
.hx-contact-list dt{ color:var(--muted); font-size:.93rem; }
.hx-contact-list dd{ color:var(--ink); font-weight:500; }
.hx-social{ display:flex; gap:8px; }
.hx-social a{ width:42px; height:42px; display:grid; place-items:center; border-radius:10px; border:1.5px solid var(--line-strong); color:var(--ink); }
.hx-social a:hover{ border-color:var(--ink); }
.hx-form{ display:flex; flex-direction:column; gap:16px; background:#fff; border:1px solid var(--line); border-radius:20px; padding:clamp(20px, 3vw, 36px); }
.hx-form-done{ align-items:flex-start; gap:12px; }
.hx-form-grid{ display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; }
.hx-field{ display:flex; flex-direction:column; gap:6px; }
.hx-field > span{ color:var(--ink); font-weight:600; font-size:.93rem; }
.hx-field em{ color:var(--muted); font-style:normal; font-weight:400; }
.hx-field input, .hx-field select, .hx-field textarea{
  width:100%; min-height:48px; padding:12px 14px; border:1.5px solid var(--line-strong); border-radius:10px;
  background:var(--paper); color:var(--ink); font:inherit; font-size:1rem;
}
.hx-field textarea{ resize:vertical; min-height:128px; line-height:1.5; }
.hx-field input::placeholder, .hx-field textarea::placeholder{ color:#87928D; }
.hx-field input:focus, .hx-field select:focus, .hx-field textarea:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); background:#fff; }

/* Footer */
.hx-footer{ background:var(--forest); color:var(--forest-text); padding:72px 0 32px; }
.hx-footer .hx-brand-word{ color:#fff; }
.hx-footer-grid{ display:grid; grid-template-columns:minmax(0, 2fr) repeat(3, minmax(0, 1fr)); gap:40px; }
.hx-footer-blurb{ margin:16px 0 20px; max-width:34ch; font-size:.95rem; }
.hx-footer h4{ color:#fff; font-weight:700; font-size:.97rem; margin:0 0 14px; }
.hx-footer li{ margin-bottom:8px; }
.hx-footer li a{ font-size:.93rem; color:var(--forest-text); }
.hx-footer li a:hover{ color:#fff; text-decoration:underline; text-underline-offset:3px; }
.hx-footer .hx-social a{ color:#fff; border-color:var(--forest-line); }
.hx-footer .hx-social a:hover{ border-color:#fff; }
.hx-footer-legal{ margin-top:56px; padding-top:24px; border-top:1px solid var(--forest-line); font-size:.85rem; color:#A9C4B7; }

/* ── Responsive ── */
@media (max-width: 1080px){
  .hx-nav-links{ display:none; }
  .hx-nav-actions{ margin-left:auto; }
  .hx-menu-btn{ display:inline-flex; }
  .hx-process{ grid-template-columns:repeat(4, minmax(0, 1fr)); row-gap:28px; }
  .hx-process li:nth-child(4)::after{ display:none; }
  .hx-case{ grid-template-columns:1fr; }
  .hx-case-results{ flex-direction:row; border-left:0; padding-left:0; border-top:1px solid var(--line); padding-top:12px; gap:24px; }
  .hx-case-results > div{ border-bottom:0; flex:1; }
  .hx-footer-grid{ grid-template-columns:repeat(3, minmax(0, 1fr)); }
  .hx-footer-grid > div:first-child{ grid-column:1 / -1; }
}
@media (max-width: 860px){
  .hx-hero-sub{ grid-template-columns:1fr; }
  .hx-hero-students{ text-align:left; }
  .hx-starter-body{ grid-template-columns:1fr; }
  .hx-facts{ grid-template-columns:repeat(2, minmax(0, 1fr)); row-gap:20px; }
  .hx-facts > div:nth-child(3){ border-left:0; padding-left:0; }
  .hx-aside-layout, .hx-contact{ grid-template-columns:1fr; }
  .hx-aside{ position:static; }
  .hx-ai{ grid-template-columns:1fr; }
  .hx-ai-item, .hx-ai-item:nth-child(even){ padding:28px 0; border-left:0; }
  .hx-case-built{ grid-template-columns:1fr; gap:16px; }
  .hx-products{ grid-template-columns:1fr; }
  .hx-product, .hx-product + .hx-product{ padding:32px 0; border-left:0; }
  .hx-product + .hx-product{ border-top:1px solid var(--line); }
  .hx-explorer{ grid-template-columns:1fr; }
  .hx-tabs{ flex-direction:row; overflow-x:auto; border-right:0; border-bottom:1px solid var(--line); gap:4px; scrollbar-width:thin; }
  .hx-tab{ white-space:nowrap; flex:none; }
  .hx-steps{ grid-template-columns:repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px){
  .hx-root{ font-size:16px; }
  .hx-hide-sm{ display:none; }
  .hx-nav-actions .hx-btn-primary{ padding:10px 14px; font-size:.92rem; }
  .hx-starter{ box-shadow:5px 5px 0 var(--accent-soft); }
  .hx-starter-flow ol{ grid-template-columns:1fr; gap:0; }
  .hx-starter-flow li{ padding:6px 0 18px 48px; min-height:56px; }
  .hx-starter-flow li::before{ top:36px; bottom:0; left:15px; right:auto; width:2px; height:auto; }
  .hx-starter-foot .hx-btn{ width:100%; }
  .hx-services > div{ grid-template-columns:1fr; }
  .hx-process{ grid-template-columns:1fr; gap:0; }
  .hx-process li{ flex-direction:row; align-items:center; gap:16px; padding-bottom:16px; }
  .hx-process li::after{ top:40px; bottom:0; left:17px; right:auto; width:2px; height:auto; display:block; }
  .hx-process li:nth-child(4)::after{ display:block; }
  .hx-process li:last-child::after{ display:none; }
  .hx-case-results{ flex-direction:column; gap:0; }
  .hx-rung{ grid-template-columns:1fr; }
  .hx-rung-level{ grid-row:auto; }
  .hx-steps{ grid-template-columns:1fr; gap:24px; }
  .hx-form-grid{ grid-template-columns:1fr; }
  .hx-footer-grid{ grid-template-columns:1fr 1fr; }
}
`;