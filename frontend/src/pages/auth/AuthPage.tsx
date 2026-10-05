// src/pages/auth/AuthPage.tsx
// Login / register — white, clean design matching the landing page.
// All authentication logic is unchanged from the previous version.
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Role } from '../../types';
import { Eye, EyeOff, Loader2, ArrowLeft, Check } from 'lucide-react';

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

// Page frame: left info panel (desktop) + right content
function Shell({ title, intro, points, children }: { title: string; intro: string; points: string[]; children: React.ReactNode }) {
  // Turn off the app-wide tinted background while this page is open
  useEffect(() => {
    document.body.classList.add('au-light');
    return () => document.body.classList.remove('au-light');
  }, []);

  return (
    <div className="au-root">
      <style>{AUTH_CSS}</style>
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
        <p className="au-side-foot">Hiresnix · Shirpur, Maharashtra</p>
      </aside>
      <main className="au-main">
        <div className="au-mobile-brand"><Link to="/" className="au-home-link"><BrandMark /></Link></div>
        <div className="au-card">{children}</div>
        <Link to="/" className="au-back"><ArrowLeft size={14} /> Back to home</Link>
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

const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600;700&display=swap');

body.au-light{background:#FFFFFF !important;}
body.au-light::before{display:none !important;}

.au-root{
  --paper:#FFFFFF; --mist:#F6F7F5; --line:#E4E6E2; --field:#CFD2CC;
  --ink:#15171A; --text:#2B2E33; --muted:#62666D;
  --accent:#0B7A55; --accent-press:#08613F; --accent-soft:#E8F4EE; --danger:#C2362B;
  --display:'Bricolage Grotesque','Helvetica Neue',Arial,sans-serif;
  --body:'Figtree',system-ui,-apple-system,'Segoe UI',sans-serif;
  min-height:100vh; display:grid; grid-template-columns:minmax(0,5fr) minmax(0,7fr);
  background:var(--paper); color:var(--text); font-family:var(--body); font-size:16px; line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
.au-root *{box-sizing:border-box;}
.au-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px;}

/* Brand */
.au-home-link{text-decoration:none;display:inline-flex;}
.au-brand{display:inline-flex;align-items:center;gap:10px;}
.au-brand-word{font-family:var(--display);font-weight:700;font-size:1rem;letter-spacing:0.16em;color:var(--ink);}

/* Left panel */
.au-side{background:var(--mist);border-right:1px solid var(--line);padding:40px 48px;display:flex;flex-direction:column;}
.au-side-body{margin:auto 0;padding:40px 0;max-width:420px;}
.au-side-title{font-family:var(--display);font-weight:700;color:var(--ink);font-size:clamp(2rem,3.4vw,2.8rem);line-height:1.05;letter-spacing:-0.03em;margin:0 0 14px;}
.au-side-intro{font-size:1.08rem;margin:0 0 28px;color:var(--text);}
.au-points{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px;}
.au-points li{display:flex;align-items:center;gap:12px;color:var(--ink);font-weight:500;}
.au-check{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--accent);color:#fff;flex-shrink:0;}
.au-side-foot{color:var(--muted);font-size:0.88rem;margin:0;}

/* Right side */
.au-main{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;}
.au-mobile-brand{display:none;}
.au-card{width:100%;max-width:420px;}
.au-back{display:inline-flex;align-items:center;gap:6px;margin-top:28px;color:var(--muted);font-size:0.9rem;text-decoration:none;}
.au-back:hover{color:var(--ink);}

/* Tabs */
.au-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--mist);border:1px solid var(--line);border-radius:999px;padding:4px;margin-bottom:32px;}
.au-tab{all:unset;text-align:center;cursor:pointer;padding:9px 12px;border-radius:999px;font-weight:600;font-size:0.94rem;color:var(--muted);}
.au-tab:hover{color:var(--ink);}
.au-tab[aria-selected="true"]{background:var(--paper);color:var(--ink);box-shadow:0 1px 2px rgba(21,23,26,.08),0 0 0 1px var(--line);}
.au-tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}

/* Form */
.au-title{font-family:var(--display);font-weight:700;color:var(--ink);font-size:1.6rem;letter-spacing:-0.02em;line-height:1.15;margin:0 0 22px;}
.au-sub{color:var(--text);margin:-10px 0 20px;}
.au-form{display:flex;flex-direction:column;}
.au-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.au-label{font-size:0.9rem;font-weight:600;color:var(--ink);}
.au-label em{font-style:normal;font-weight:400;color:var(--muted);}
.au-input{font:inherit;font-size:0.97rem;color:var(--ink);background:var(--paper);border:1px solid var(--field);border-radius:12px;padding:11px 14px;min-height:46px;width:100%;outline:none;transition:border-color .15s ease,box-shadow .15s ease;}
.au-input::placeholder{color:#9A9EA5;}
.au-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(11,122,85,.15);}
.au-input-err{border-color:var(--danger);}
.au-input-err:focus{box-shadow:0 0 0 3px rgba(194,54,43,.15);border-color:var(--danger);}
.au-error{color:var(--danger);font-size:0.86rem;}
.au-pass{position:relative;display:block;}
.au-pass .au-input{padding-right:44px;}
.au-eye{all:unset;cursor:pointer;position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--muted);display:flex;padding:4px;border-radius:6px;}
.au-eye:hover{color:var(--ink);}
.au-row-end{display:flex;justify-content:flex-end;margin:-6px 0 20px;}

.au-roles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.au-role{all:unset;text-align:center;cursor:pointer;padding:10px 6px;border:1px solid var(--field);border-radius:12px;font-weight:600;font-size:0.93rem;color:var(--text);}
.au-role:hover{border-color:var(--ink);}
.au-role[aria-checked="true"]{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-press);}
.au-role:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}

/* Buttons & links */
.au-btn{font-family:var(--body);font-weight:600;font-size:0.98rem;border-radius:999px;padding:13px 22px;cursor:pointer;border:1px solid transparent;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:background-color .15s ease,border-color .15s ease;}
.au-btn-block{width:100%;}
.au-btn-primary{background:var(--accent);color:#fff;}
.au-btn-primary:hover{background:var(--accent-press);}
.au-btn-primary:disabled{opacity:.6;cursor:progress;}
.au-btn-ghost{background:var(--paper);color:var(--ink);border-color:var(--field);}
.au-btn-ghost:hover{border-color:var(--ink);}
.au-link{color:var(--accent);font-weight:600;text-decoration:none;}
.au-link:hover{color:var(--accent-press);text-decoration:underline;text-underline-offset:3px;}
.au-link-btn{all:unset;cursor:pointer;color:var(--accent);font-weight:600;}
.au-link-btn:hover{color:var(--accent-press);text-decoration:underline;text-underline-offset:3px;}
.au-switch{text-align:center;color:var(--muted);font-size:0.94rem;margin:22px 0 0;}
.au-alt{text-align:center;color:var(--muted);font-size:0.9rem;margin:10px 0 0;padding-top:18px;border-top:1px solid var(--line);margin-top:20px;}
.au-note{background:var(--mist);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:0.9rem;color:var(--text);margin:0 0 18px;}
.au-steps{list-style:decimal;margin:0 0 20px;padding-left:20px;color:var(--text);display:flex;flex-direction:column;gap:6px;}
.au-steps strong{color:var(--ink);}
.au-spin{animation:auSpin 1s linear infinite;}
@keyframes auSpin{to{transform:rotate(360deg);}}

/* Responsive */
@media (max-width: 900px){
  .au-root{grid-template-columns:1fr;}
  .au-side{display:none;}
  .au-main{justify-content:flex-start;padding:28px 20px 40px;}
  .au-mobile-brand{display:block;width:100%;max-width:420px;margin-bottom:32px;}
}
@media (prefers-reduced-motion: reduce){
  .au-btn,.au-input{transition:none;}
  .au-spin{animation-duration:2s;}
}
`;