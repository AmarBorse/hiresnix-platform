// src/pages/auth/AuthPage.tsx
// Login / register — white, clean design matching the landing page.
// All authentication logic is unchanged from the previous version.
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Role } from '../../types';
import { Eye, EyeOff, Loader2, ArrowLeft, Check, Sun, Moon } from 'lucide-react';

type Tab = 'login' | 'register';
type RegisterRole = 'student' | 'company' | 'institution';

const ROLE_OPTIONS: { role: RegisterRole; label: string }[] = [
  { role: 'student', label: 'Student' },
  { role: 'company', label: 'Company' },
  { role: 'institution', label: 'Institution' },
];
const INDUSTRIES = ['IT/Software', 'Finance', 'Healthcare', 'E-commerce', 'Manufacturing', 'Consulting', 'Media', 'Education', 'Other'];
const INSTITUTION_TYPES = ['University', 'College', 'Institute', 'Training Center', 'School', 'Other'];

// Brand mark: arrow rising to a dot (same as the landing page)
function BrandMark() {
  return (
    <span className="au-brand" aria-label="Hiresnix">
      <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
        <path d="M1 22 C 10 21, 17 16, 21 7" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <path d="M15 8 L22 4.5 L23.5 12.5" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27" cy="3" r="2.6" fill="var(--accent)" />
      </svg>
      <span className="au-brand-word">HIRESNIX</span>
    </span>
  );
}

// Day / night mode — same setting as the public site (key 'hx-site-mode')
type SiteMode = 'light' | 'dark';
const MODE_KEY = 'hx-site-mode';
const initialMode = (): SiteMode => {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Page frame: left info panel (desktop) + right content, glass style like the landing page
function Shell({ title, intro, points, children }: { title: string; intro: string; points: string[]; children: React.ReactNode }) {
  const [mode, setMode] = useState<SiteMode>(initialMode);

  // Turn off the app-wide tinted background while this page is open
  useEffect(() => {
    document.body.classList.add('au-light');
    return () => document.body.classList.remove('au-light');
  }, []);

  // Remember day / night and colour the page behind the layout too
  useEffect(() => {
    try { localStorage.setItem(MODE_KEY, mode); } catch { /* storage blocked */ }
    document.body.dataset.hxMode = mode;
    return () => { delete document.body.dataset.hxMode; };
  }, [mode]);

  // index.html's older global light/dark switch restyles headers and cards in its light mode;
  // keep it neutral while this page is open (the landing page and student portal do the same)
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-theme');
    html.setAttribute('data-theme', 'dark');
    return () => { if (prev) html.setAttribute('data-theme', prev); else html.removeAttribute('data-theme'); };
  }, []);

  const toggle = (
    <button
      type="button" className="au-mode" onClick={() => setMode(m => (m === 'dark' ? 'light' : 'dark'))}
      aria-label={mode === 'dark' ? 'Switch to day mode' : 'Switch to night mode'} title={mode === 'dark' ? 'Day mode' : 'Night mode'}
    >
      {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  return (
    <div className="au-root" data-mode={mode}>
      <style>{AUTH_CSS}</style>
      {/* Soft colour fields behind the glass (decorative) */}
      <div className="au-bg" aria-hidden="true"><span className="au-blob au-blob-a" /><span className="au-blob au-blob-b" /><span className="au-blob au-blob-c" /></div>

      <aside className="au-side">
        <Link to="/" className="au-home-link"><BrandMark /></Link>
        <div className="au-side-body">
          <h1 className="au-side-title">{title}</h1>
          <p className="au-side-intro">{intro}</p>
          <ul className="au-points">
            {points.map(p => (
              <li key={p}><span className="au-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>{p}</li>
            ))}
          </ul>
        </div>
        <svg className="au-side-mark" viewBox="0 0 240 200" aria-hidden="true">
          <path className="au-side-mark-line" pathLength={1} d="M12 186 C 100 184, 168 140, 196 52" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="8" strokeLinecap="round" />
          <path className="au-side-mark-head" d="M168 70 L200 44 L210 84" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="au-side-mark-head" cx="226" cy="20" r="11" fill="#4FD1A0" />
        </svg>
        <p className="au-side-foot">Hiresnix · Shirpur, Maharashtra</p>
      </aside>

      <main className="au-main">
        <div className="au-topbar">
          <div className="au-mobile-brand"><Link to="/" className="au-home-link"><BrandMark /></Link></div>
          {toggle}
        </div>
        <div className="au-center">
          <div className="au-card">{children}</div>
          <Link to="/" className="au-back"><ArrowLeft size={14} /> Back to home</Link>
        </div>
      </main>
    </div>
  );
}

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="au-field">
      <span className="au-label">{label}{hint && <em> {hint}</em>}</span>
      {children}
      {error && <span className="au-error" role="alert">{error}</span>}
    </label>
  );
}

export function AuthPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const routeState  = location.state as { message?: string } | null;

  // Shown after the 3-day inactivity auto-logout
  useEffect(() => {
    if (new URLSearchParams(location.search).get('reason') === 'inactive') {
      toast.info('You were logged out after 3 days of inactivity. Please log in again.');
    }
  }, [location.search]);
  const { setAuth } = useAuthStore();
  // ?tab=register (e.g. from the landing page "Apply for an internship" button) opens the sign-up form
  const [tab, setTab]           = useState<Tab>(() => new URLSearchParams(location.search).get('tab') === 'register' ? 'register' : 'login');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [registerRole, setRegisterRole] = useState<RegisterRole>('student');
  const [showForgot, setShowForgot]     = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const [loginForm, setLoginForm]         = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors]     = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm]   = useState({ name: '', email: '', password: '', companyName: '', industry: '', institutionName: '', institutionType: '' });
  const [registerErrors, setRegisterErrors] = useState({ name: '', email: '', password: '', companyName: '', institutionName: '' });

  const roleRedirect: Record<string, string> = {
    student: '/student/dashboard', company: '/company/dashboard',
    admin: '/admin/dashboard', institution: '/institution/dashboard',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    const errors = { email: '', password: '' };
    const cleanEmail = loginForm.email.trim();
    if (!cleanEmail) { errors.email = 'Email is required'; hasError = true; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { errors.email = 'Please enter a valid email'; hasError = true; }
    if (!loginForm.password) { errors.password = 'Password is required'; hasError = true; }
    setLoginErrors(errors);
    if (hasError) return;
    setLoading(true);
    try {
      const res = await authApi.login({ ...loginForm, email: cleanEmail });
      setAuth(res.user, res.token);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate(roleRedirect[res.user.role] || '/');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    const errors = { name: '', email: '', password: '', companyName: '', institutionName: '' };
    const cleanEmail = registerForm.email.trim();
    if (!registerForm.name) { errors.name = 'Name is required'; hasError = true; }
    if (!cleanEmail) { errors.email = 'Email is required'; hasError = true; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { errors.email = 'Please enter a valid email'; hasError = true; }
    if (!registerForm.password || registerForm.password.length < 6) { errors.password = 'Password must be at least 6 characters'; hasError = true; }
    if (registerRole === 'company' && !registerForm.companyName) { errors.companyName = 'Company name is required'; hasError = true; }
    if (registerRole === 'institution' && !registerForm.institutionName) { errors.institutionName = 'Institution name is required'; hasError = true; }
    setRegisterErrors(errors);
    if (hasError) return;
    setLoading(true);
    try {
      const payload: any = { name: registerForm.name, email: cleanEmail, password: registerForm.password, role: registerRole };
      if (registerRole === 'company') { payload.companyName = registerForm.companyName; payload.industry = registerForm.industry; }
      if (registerRole === 'institution') { payload.institutionName = registerForm.institutionName; payload.type = registerForm.institutionType; }
      const res = await authApi.register(payload);
      if (res.pendingApproval) { setPendingApproval(true); return; }
      if (res.token && res.user) {
        setAuth(res.user, res.token);
        toast.success(`Account created! Welcome, ${res.user.name}!`);
        navigate(roleRedirect[res.user.role] || '/');
      }
    } catch (err: any) { toast.error(err.response?.data?.message || err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  // Forgot password screen
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotSent, setForgotSent]       = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try { await new Promise(r => setTimeout(r, 800)); setForgotSent(true); }
    finally { setForgotLoading(false); }
  };

  const sideCopy = tab === 'login'
    ? { title: 'Welcome back', intro: 'Log in to continue your internship, courses and applications.',
        points: ['Your internship tasks and daily logs', 'Offer letter, certificate and LOR downloads', 'AI Academy courses and progress'] }
    : { title: 'Start with Hiresnix', intro: 'One account for internships, AI Academy courses and job applications.',
        points: ['Internships in 8 domains, 1 to 6 months', 'Three real projects, starter to advanced', 'QR-verifiable certificate and LOR'] };

  // ── Forgot password ──
  if (showForgot) return (
    <Shell title="Reset your password" intro="Password resets are handled by the Hiresnix team." points={['Contact the admin', 'Get a temporary password', 'Set a new one from your profile']}>
      <h2 className="au-title">Forgot password?</h2>
      <p className="au-sub">Password reset ke liye Hiresnix admin se contact karo.</p>
      <ol className="au-steps">
        <li>Hiresnix admin se contact karo</li>
        <li>Admin temporary password set karega</li>
        <li>Login karo, phir <strong>Profile → Change Password</strong></li>
        <li>Apna naya password set karo</li>
      </ol>
      <div className="au-note">
        Contact us at <a href="mailto:hr@hiresnix.co.in" className="au-link">hr@hiresnix.co.in</a>
      </div>
      <button type="button" onClick={() => setShowForgot(false)} className="au-btn au-btn-ghost au-btn-block">
        <ArrowLeft size={14} /> Back to log in
      </button>
    </Shell>
  );

  // ── Institution registration pending approval ──
  if (pendingApproval) return (
    <Shell title="Almost there" intro="Institution accounts are reviewed before they go live." points={['Registration received', 'Waiting for admin review', "You'll be notified on approval"]}>
      <h2 className="au-title">Registration submitted</h2>
      <p className="au-sub">
        Your institution registration is pending admin approval. You will be able to log in once your account has been reviewed and approved.
      </p>
      <button type="button" onClick={() => { setPendingApproval(false); setTab('login'); setRegisterRole('student'); }} className="au-btn au-btn-primary au-btn-block">
        Back to log in
      </button>
    </Shell>
  );

  const submitLabel = registerRole === 'company' ? 'Register company' : registerRole === 'institution' ? 'Register institution' : 'Create student account';

  return (
    <Shell title={sideCopy.title} intro={sideCopy.intro} points={sideCopy.points}>
      <div className="au-tabs" role="tablist" aria-label="Log in or create an account">
        {(['login', 'register'] as Tab[]).map(t => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="au-tab">
            {t === 'login' ? 'Log in' : 'Create account'}
          </button>
        ))}
      </div>

      {/* LOGIN */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} noValidate className="au-form">
          <h2 className="au-title">Log in to your account</h2>
          <Field label="Email" error={loginErrors.email}>
            <input type="email" required autoComplete="email" value={loginForm.email}
              onChange={e => { setLoginForm(p => ({ ...p, email: e.target.value })); if (loginErrors.email) setLoginErrors(p => ({ ...p, email: '' })); }}
              className={`au-input${loginErrors.email ? ' au-input-err' : ''}`} placeholder="you@example.com" />
          </Field>
          <Field label="Password" error={loginErrors.password}>
            <span className="au-pass">
              <input type={showPass ? 'text' : 'password'} required autoComplete="current-password" value={loginForm.password}
                onChange={e => { setLoginForm(p => ({ ...p, password: e.target.value })); if (loginErrors.password) setLoginErrors(p => ({ ...p, password: '' })); }}
                className={`au-input${loginErrors.password ? ' au-input-err' : ''}`} placeholder="Your password" />
              <button type="button" className="au-eye" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </Field>
          <div className="au-row-end">
            <button type="button" onClick={() => setShowForgot(true)} className="au-link au-link-btn">Forgot password?</button>
          </div>
          <button type="submit" disabled={loading} className="au-btn au-btn-primary au-btn-block">
            {loading && <Loader2 size={15} className="au-spin" />} Log in
          </button>
          <p className="au-switch">
            New to Hiresnix?{' '}
            <button type="button" onClick={() => setTab('register')} className="au-link au-link-btn">Create an account</button>
          </p>
          <p className="au-alt">
            Institution student? <Link to="/inst-login" className="au-link">Log in with your Career ID</Link>
          </p>
        </form>
      )}

      {/* REGISTER */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} noValidate className="au-form">
          <h2 className="au-title">Create your account</h2>
          <div className="au-field">
            <span className="au-label" id="au-role-label">I am a</span>
            <div className="au-roles" role="radiogroup" aria-labelledby="au-role-label">
              {ROLE_OPTIONS.map(({ role: r, label }) => (
                <button key={r} type="button" role="radio" aria-checked={registerRole === r} onClick={() => setRegisterRole(r)} className="au-role">
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Full name" error={registerErrors.name}>
            <input type="text" required autoComplete="name" value={registerForm.name}
              onChange={e => { setRegisterForm(p => ({ ...p, name: e.target.value })); if (registerErrors.name) setRegisterErrors(p => ({ ...p, name: '' })); }}
              className={`au-input${registerErrors.name ? ' au-input-err' : ''}`} placeholder="Your full name" />
          </Field>
          <Field label="Email" error={registerErrors.email}>
            <input type="email" required autoComplete="email" value={registerForm.email}
              onChange={e => { setRegisterForm(p => ({ ...p, email: e.target.value })); if (registerErrors.email) setRegisterErrors(p => ({ ...p, email: '' })); }}
              className={`au-input${registerErrors.email ? ' au-input-err' : ''}`} placeholder="you@example.com" />
          </Field>
          <Field label="Password" error={registerErrors.password}>
            <span className="au-pass">
              <input type={showPass ? 'text' : 'password'} required autoComplete="new-password" value={registerForm.password}
                onChange={e => { setRegisterForm(p => ({ ...p, password: e.target.value })); if (registerErrors.password) setRegisterErrors(p => ({ ...p, password: '' })); }}
                className={`au-input${registerErrors.password ? ' au-input-err' : ''}`} placeholder="At least 6 characters" />
              <button type="button" className="au-eye" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </Field>

          {registerRole === 'company' && (
            <>
              <Field label="Company name" error={registerErrors.companyName}>
                <input type="text" required value={registerForm.companyName}
                  onChange={e => { setRegisterForm(p => ({ ...p, companyName: e.target.value })); if (registerErrors.companyName) setRegisterErrors(p => ({ ...p, companyName: '' })); }}
                  className={`au-input${registerErrors.companyName ? ' au-input-err' : ''}`} placeholder="Your company name" />
              </Field>
              <Field label="Industry">
                <select value={registerForm.industry} onChange={e => setRegisterForm(p => ({ ...p, industry: e.target.value }))} className="au-input">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
            </>
          )}

          {registerRole === 'institution' && (
            <>
              <Field label="Institution name" error={registerErrors.institutionName}>
                <input type="text" required value={registerForm.institutionName}
                  onChange={e => { setRegisterForm(p => ({ ...p, institutionName: e.target.value })); if (registerErrors.institutionName) setRegisterErrors(p => ({ ...p, institutionName: '' })); }}
                  className={`au-input${registerErrors.institutionName ? ' au-input-err' : ''}`} placeholder="e.g. ABC Institute of Technology" />
              </Field>
              <Field label="Institution type">
                <select value={registerForm.institutionType} onChange={e => setRegisterForm(p => ({ ...p, institutionType: e.target.value }))} className="au-input">
                  <option value="">Select type</option>
                  {INSTITUTION_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <p className="au-note">Institution accounts need admin approval before you can log in. We'll notify you once it's reviewed.</p>
            </>
          )}

          <button type="submit" disabled={loading} className="au-btn au-btn-primary au-btn-block">
            {loading && <Loader2 size={15} className="au-spin" />} {submitLabel}
          </button>
          <p className="au-switch">
            Already have an account?{' '}
            <button type="button" onClick={() => setTab('login')} className="au-link au-link-btn">Log in</button>
          </p>
        </form>
      )}
    </Shell>
  );
}

// Glass style matching the landing page; two modes on .au-root[data-mode]
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&display=swap');

body.au-light{background:#EDF4EF !important;}
body.au-light[data-hx-mode="dark"]{background:#06130E !important;}
body.au-light::before{display:none !important;}

.au-root{
  --accent:#0B7A55; --accent-press:#08613F; --accent-soft:rgba(11,122,85,.12); --danger:#B42318; --danger-soft:rgba(180,35,24,.14);
  --btn-bg:#0B7A55; --btn-bg-hover:#08613F; --btn-text:#FFFFFF;
  --bg:#EDF4EF; --ink:#0D2A20; --text:#2C3B35; --muted:#4F5F58; --line:rgba(13,42,32,.12);
  --glass:rgba(255,255,255,.55); --glass-strong:rgba(255,255,255,.78); --glass-soft:rgba(255,255,255,.3);
  --glass-border:rgba(255,255,255,.78);
  --glass-shadow:0 20px 50px -24px rgba(13,42,32,.3), inset 0 1px 0 rgba(255,255,255,.75);
  --field:rgba(255,255,255,.72); --field-border:rgba(13,42,32,.18);
  --blob-a:#9EE8C6; --blob-b:#9BD9E3; --blob-c:#D3F2B0; --blob-opacity:.75;
  --font:'Schibsted Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color-scheme:light;
  position:relative; isolation:isolate; min-height:100vh; display:grid; grid-template-columns:minmax(0,5fr) minmax(0,7fr);
  gap:0; padding:16px; background:var(--bg); color:var(--text); font-family:var(--font); font-size:16px; line-height:1.55;
  -webkit-font-smoothing:antialiased; overflow-x:clip; transition:background-color .4s ease,color .4s ease;
}
.au-root[data-mode="dark"]{
  --accent:#3FD39A; --accent-press:#6BE3B4; --accent-soft:rgba(63,211,154,.14); --danger:#FF8A80; --danger-soft:rgba(255,138,128,.16);
  --btn-bg:#3FD39A; --btn-bg-hover:#6BE3B4; --btn-text:#04241A;
  --bg:#06130E; --ink:#EEF7F2; --text:#C6D6CF; --muted:#9AAEA6; --line:rgba(255,255,255,.12);
  --glass:rgba(255,255,255,.06); --glass-strong:rgba(255,255,255,.1); --glass-soft:rgba(255,255,255,.03);
  --glass-border:rgba(255,255,255,.13);
  --glass-shadow:0 24px 60px -24px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.08);
  --field:rgba(255,255,255,.06); --field-border:rgba(255,255,255,.2);
  --blob-a:#0F6B4C; --blob-b:#0B5161; --blob-c:#2D6B1F; --blob-opacity:.55;
  color-scheme:dark;
}
.au-root *{box-sizing:border-box;}
/* index.html forces a default cursor on links; keep links and buttons looking clickable */
.au-root a, .au-root button{cursor:pointer !important;}
.au-root :focus-visible{outline:3px solid var(--accent);outline-offset:2px;border-radius:8px;}

/* Background colour fields */
.au-bg{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;}
.au-blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:var(--blob-opacity);transition:background-color .6s ease;}
.au-blob-a{width:56vmax;height:56vmax;left:-16vmax;top:-20vmax;background:var(--blob-a);animation:auFloat 18s ease-in-out infinite;}
.au-blob-b{width:46vmax;height:46vmax;right:-14vmax;top:10vh;background:var(--blob-b);animation:auFloat 22s ease-in-out infinite reverse;}
.au-blob-c{width:40vmax;height:40vmax;left:30vw;bottom:-24vmax;background:var(--blob-c);animation:auFloat 26s ease-in-out infinite;}
@keyframes auFloat{0%,100%{transform:translate3d(0,0,0);}50%{transform:translate3d(3vmax,-2vmax,0);}}

/* Brand */
.au-home-link{text-decoration:none;display:inline-flex;}
.au-brand{display:inline-flex;align-items:center;gap:10px;}
.au-brand-word{font-weight:800;font-size:1rem;letter-spacing:0.14em;color:var(--ink);}

/* Left panel: deep green glass */
.au-side{position:sticky;top:16px;height:calc(100vh - 32px);height:calc(100svh - 32px);align-self:start;overflow:hidden;border-radius:28px;padding:40px 44px;display:flex;flex-direction:column;color:#D5E6DD;
  background:radial-gradient(120% 90% at 85% 10%, rgba(27,106,78,.95) 0%, rgba(14,59,44,.95) 55%, rgba(10,46,34,.96) 100%);
  border:1px solid rgba(255,255,255,.16); box-shadow:0 40px 80px -40px rgba(9,46,34,.7), inset 0 1px 0 rgba(255,255,255,.16);
  -webkit-backdrop-filter:blur(18px); backdrop-filter:blur(18px);}
.au-side::before{content:"";position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,.1) 1.2px, transparent 1.3px);background-size:24px 24px;
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 40%,#000);mask-image:linear-gradient(180deg,transparent,#000 40%,#000);}
.au-side > *{position:relative;}
.au-side .au-brand-word{color:#fff;}
.au-side .au-brand path{stroke:#fff;}
.au-side .au-brand circle{fill:#4FD1A0;}
.au-side-body{margin:auto 0;padding:40px 0;max-width:420px;animation:auRise .7s cubic-bezier(.2,.7,.2,1) both;}
.au-side-title{font-weight:800;color:#fff;font-size:clamp(2rem,3.4vw,2.9rem);line-height:1.04;letter-spacing:-0.04em;margin:0 0 14px;text-wrap:balance;}
.au-side-intro{font-size:1.08rem;margin:0 0 28px;color:#D5E6DD;}
.au-points{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;}
.au-points li{display:flex;align-items:center;gap:12px;color:#fff;font-weight:500;padding:10px 14px;border-radius:14px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);animation:auRise .6s cubic-bezier(.2,.7,.2,1) both;}
.au-points li:nth-child(1){animation-delay:.15s;} .au-points li:nth-child(2){animation-delay:.25s;}
.au-points li:nth-child(3){animation-delay:.35s;} .au-points li:nth-child(4){animation-delay:.45s;}
.au-check{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#4FD1A0;color:#04241A;flex-shrink:0;}
.au-side-mark{position:absolute;right:28px;bottom:56px;width:150px;height:auto;opacity:.5;}
.au-side-mark-line{stroke-dasharray:1;stroke-dashoffset:1;animation:auDraw 1.4s cubic-bezier(.45,.05,.25,1) .3s forwards;}
.au-side-mark-head{opacity:0;animation:auFade .35s ease 1.6s forwards;}
.au-side-foot{color:#A9C4B7;font-size:0.88rem;margin:0;}

/* Right side */
.au-main{display:flex;flex-direction:column;padding:8px 8px 24px 32px;min-width:0;}
.au-topbar{display:flex;align-items:center;justify-content:flex-end;gap:12px;min-height:52px;}
.au-mobile-brand{display:none;margin-right:auto;}
.au-mode{width:44px;height:44px;border-radius:12px;border:1px solid var(--glass-border);background:var(--glass);color:var(--ink);display:grid;place-items:center;
  box-shadow:var(--glass-shadow);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);transition:background-color .2s ease,transform .3s ease;}
.au-mode:hover{background:var(--glass-strong);transform:rotate(-12deg);}
.au-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 0;}
.au-card{width:100%;max-width:460px;padding:clamp(24px,4vw,40px);border-radius:28px;background:var(--glass);border:1px solid var(--glass-border);
  box-shadow:var(--glass-shadow);-webkit-backdrop-filter:blur(22px) saturate(1.5);backdrop-filter:blur(22px) saturate(1.5);
  animation:auRise .7s cubic-bezier(.2,.7,.2,1) .1s both;}
.au-back{display:inline-flex;align-items:center;gap:6px;margin-top:24px;color:var(--muted);font-size:0.92rem;text-decoration:none;padding:6px 10px;border-radius:10px;}
.au-back:hover{color:var(--ink);background:var(--glass);}

/* Tabs */
.au-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--glass-soft);border:1px solid var(--glass-border);border-radius:14px;padding:4px;margin-bottom:28px;}
.au-tab{all:unset;text-align:center;cursor:pointer;padding:10px 12px;border-radius:10px;font-weight:600;font-size:0.95rem;color:var(--muted);transition:background-color .2s ease,color .2s ease;}
.au-tab:hover{color:var(--ink);}
.au-tab[aria-selected="true"]{background:var(--glass-strong);color:var(--ink);box-shadow:0 6px 16px -10px rgba(0,0,0,.35);}
.au-tab:focus-visible{outline:3px solid var(--accent);outline-offset:2px;}

/* Form */
.au-title{font-weight:800;color:var(--ink);font-size:1.7rem;letter-spacing:-0.03em;line-height:1.15;margin:0 0 22px;}
.au-sub{color:var(--text);margin:-10px 0 20px;}
.au-form{display:flex;flex-direction:column;}
.au-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.au-label{font-size:0.92rem;font-weight:600;color:var(--ink);}
.au-label em{font-style:normal;font-weight:400;color:var(--muted);}
.au-input{font:inherit;font-size:1rem;color:var(--ink);background:var(--field);border:1px solid var(--field-border);border-radius:12px;padding:12px 14px;min-height:48px;width:100%;outline:none;
  transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease;}
.au-input::placeholder{color:var(--muted);opacity:.8;}
.au-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft);}
select.au-input option{background:#FFFFFF;color:#0D2A20;}
.au-root[data-mode="dark"] select.au-input option{background:#0C2018;color:#EEF7F2;}
.au-input-err{border-color:var(--danger);}
.au-input-err:focus{box-shadow:0 0 0 4px var(--danger-soft);border-color:var(--danger);}
.au-error{color:var(--danger);font-size:0.86rem;font-weight:500;}
.au-pass{position:relative;display:block;}
.au-pass .au-input{padding-right:46px;}
.au-eye{all:unset;cursor:pointer;position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--muted);display:flex;padding:6px;border-radius:8px;}
.au-eye:hover{color:var(--ink);background:var(--glass);}
.au-row-end{display:flex;justify-content:flex-end;margin:-6px 0 20px;}

.au-roles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.au-role{all:unset;text-align:center;cursor:pointer;padding:11px 6px;border:1px solid var(--field-border);border-radius:12px;background:var(--field);font-weight:600;font-size:0.93rem;color:var(--text);
  transition:border-color .2s ease,background-color .2s ease,color .2s ease;}
.au-role:hover{border-color:var(--accent);}
.au-role[aria-checked="true"]{border-color:var(--accent);background:var(--accent-soft);color:var(--accent);}
.au-role:focus-visible{outline:3px solid var(--accent);outline-offset:2px;}

/* Buttons & links */
.au-btn{font-family:var(--font);font-weight:600;font-size:1rem;border-radius:12px;min-height:50px;padding:13px 22px;border:1px solid transparent;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  transition:background-color .2s ease,border-color .2s ease,transform .2s ease,box-shadow .2s ease;}
.au-btn-block{width:100%;}
.au-btn-primary{background:var(--btn-bg);color:var(--btn-text);box-shadow:0 12px 26px -14px var(--btn-bg), inset 0 1px 0 rgba(255,255,255,.25);}
.au-btn-primary:hover{background:var(--btn-bg-hover);transform:translateY(-2px);}
.au-btn-primary:disabled{opacity:.6;cursor:progress;transform:none;}
.au-btn-ghost{background:var(--glass);color:var(--ink);border-color:var(--glass-border);}
.au-btn-ghost:hover{background:var(--glass-strong);}
.au-link{color:var(--accent);font-weight:600;text-decoration:none;}
.au-link:hover{color:var(--accent-press);text-decoration:underline;text-underline-offset:3px;}
.au-link-btn{all:unset;cursor:pointer;color:var(--accent);font-weight:600;}
.au-link-btn:hover{color:var(--accent-press);text-decoration:underline;text-underline-offset:3px;}
.au-link-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px;border-radius:4px;}
.au-switch{text-align:center;color:var(--muted);font-size:0.95rem;margin:22px 0 0;}
.au-alt{text-align:center;color:var(--muted);font-size:0.92rem;padding-top:18px;border-top:1px solid var(--line);margin:20px 0 0;}
.au-note{background:var(--glass-soft);border:1px solid var(--glass-border);border-radius:12px;padding:12px 14px;font-size:0.92rem;color:var(--text);margin:0 0 18px;}
.au-steps{list-style:decimal;margin:0 0 20px;padding-left:20px;color:var(--text);display:flex;flex-direction:column;gap:6px;}
.au-steps strong{color:var(--ink);}
.au-spin{animation:auSpin 1s linear infinite;}
@keyframes auSpin{to{transform:rotate(360deg);}}
@keyframes auRise{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;}}
@keyframes auDraw{to{stroke-dashoffset:0;}}
@keyframes auFade{to{opacity:1;}}

/* Solid fallback where blur isn't supported */
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .au-root{--glass:rgba(255,255,255,.9);--glass-strong:rgba(255,255,255,.96);}
  .au-root[data-mode="dark"]{--glass:rgba(14,34,27,.94);--glass-strong:rgba(18,42,33,.97);}
}

/* Responsive */
@media (max-width: 900px){
  .au-root{grid-template-columns:1fr;padding:0;}
  .au-side{display:none;}
  .au-main{padding:16px 20px 32px;}
  .au-mobile-brand{display:block;}
  .au-center{justify-content:flex-start;padding-top:24px;}
}
@media (prefers-reduced-motion: reduce){
  .au-btn,.au-input,.au-root{transition:none;}
  .au-blob,.au-side-body,.au-points li,.au-card{animation:none;}
  .au-side-mark-line{animation:none;stroke-dashoffset:0;}
  .au-side-mark-head{animation:none;opacity:1;}
  .au-btn-primary:hover,.au-mode:hover{transform:none;}
  .au-spin{animation-duration:2s;}
}
`;