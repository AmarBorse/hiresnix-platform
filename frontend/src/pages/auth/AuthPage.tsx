// src/pages/auth/AuthPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Role } from '../../types';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

type Tab = 'login' | 'register';
type RegisterRole = 'student' | 'company';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { message?: string } | null;
  const { setAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [registerRole, setRegisterRole] = useState<RegisterRole>('student');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(routeState?.message || '');
  const [showResendVerification, setShowResendVerification] = useState(
    routeState?.message === 'Please verify your email before logging in.'
  );

  const [loginForm, setLoginForm]     = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', companyName: '', industry: '',
  });
  const [registerErrors, setRegisterErrors] = useState({ name: '', email: '', password: '', companyName: '' });

  const roleRedirect: Record<Role, string> = {
    student: '/student/dashboard',
    company: '/company/dashboard',
    admin:   '/admin/dashboard',
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('studentEmailVerificationToken');
    if (!token) return;

    let mounted = true;
    setVerificationLoading(true);
    authApi.verifyStudentEmail(token)
      .then((res) => {
        if (!mounted) return;
        setTab('login');
        setVerificationMessage(res.message || 'Email verified successfully. You can now log in.');
        setShowResendVerification(false);
        toast.success(res.message || 'Email verified successfully. You can now log in.');
        navigate('/auth', { replace: true });
      })
      .catch((err) => {
        if (!mounted) return;
        const message = err.response?.data?.message || 'Unable to verify email. Please request a new verification email.';
        setVerificationMessage(message);
        setShowResendVerification(true);
        toast.error(message);
        navigate('/auth', { replace: true });
      })
      .finally(() => {
        if (mounted) setVerificationLoading(false);
      });

    return () => { mounted = false; };
  }, [location.search, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Form Validation ──
    let hasError = false;
    const errors = { email: '', password: '' };
    
    const cleanEmail = loginForm.email.trim();
    if (!cleanEmail) {
      errors.email = 'Email is required';
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address';
      hasError = true;
    }
    if (!loginForm.password) {
      errors.password = 'Password is required';
      hasError = true;
    }
    setLoginErrors(errors);
    if (hasError) return;

    setLoading(true);
    try {
      const res = await authApi.login({
        ...loginForm,
        email: cleanEmail
      });
      if (!res.user || !res.token) throw new Error('Invalid login response');
      setAuth(res.user, res.token);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate(roleRedirect[res.user.role as Role]);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid credentials';
      if (message === 'Please verify your email before logging in.') {
        setVerificationMessage(message);
        setShowResendVerification(true);
      }
      toast.error(message);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Form Validation ──
    let hasError = false;
    const errors = { name: '', email: '', password: '', companyName: '' };

    const cleanEmail = registerForm.email.trim();

    if (!registerForm.name) { errors.name = 'Name is required'; hasError = true; }
    if (!cleanEmail) {
      errors.email = 'Email is required'; hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address'; hasError = true;
    }
    if (!registerForm.password || registerForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'; hasError = true;
    }
    if (registerRole === 'company' && !registerForm.companyName) {
      errors.companyName = 'Company name is required'; hasError = true;
    }
    setRegisterErrors(errors);
    if (hasError) return;

    setLoading(true);
    try {
      const payload = {
        name: registerForm.name,
        email: cleanEmail,
        password: registerForm.password,
        role: registerRole,
        ...(registerRole === 'company' && {
          companyName: registerForm.companyName,
          industry: registerForm.industry,
        }),
      };

      const res = await authApi.register(payload);
      if (registerRole === 'student' && res.requiresVerification) {
        const message = res.message || 'Verification email sent. Please check your inbox before logging in.';
        setVerificationMessage(message);
        setShowResendVerification(true);
        setLoginForm(p => ({ ...p, email: cleanEmail, password: '' }));
        setTab('login');
        toast.success(message);
        return;
      }
      if (!res.user || !res.token) throw new Error('Invalid registration response');
      setAuth(res.user, res.token);
      toast.success(`Account created! Welcome, ${res.user.name}!`);
      navigate(roleRedirect[res.user.role as Role]);
    } catch (err: any) {
      console.error('Registration Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleResendVerification = async () => {
    const email = loginForm.email.trim() || registerForm.email.trim();
    if (!email) {
      setLoginErrors(p => ({ ...p, email: 'Email is required to resend verification' }));
      return;
    }

    setResendLoading(true);
    try {
      const res = await authApi.resendStudentVerification(email);
      const message = res.message || 'Verification email sent. Please check your inbox before logging in.';
      setVerificationMessage(message);
      setShowResendVerification(true);
      toast.success(message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unable to resend verification email');
    } finally { setResendLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail);
      setForgotSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch {
      toast.error('Something went wrong');
    } finally { setLoading(false); }
  };

  // ── FORGOT PASSWORD SCREEN ──
  if (showForgot) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#060910,#0f172a,#060910)' }}>
      <style>{`body { margin: 0; background-color: #060910; }`}</style>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(59,130,246,0.08) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 90, objectFit: 'contain', margin: '0 auto 1rem', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.5))' }} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 1.5rem 0' }}>
            <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft size={14} /> Back to Login
            </button>
            <h2 className="text-white font-bold text-xl mb-1">Forgot Password?</h2>
            <p className="text-gray-400 text-sm mb-5">Enter your email — we'll send a reset link</p>
          </div>
          {forgotSent ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📬</div>
              <p className="text-white font-semibold mb-1">Reset link sent!</p>
              <p className="text-gray-400 text-sm mb-4">Check your email for the password reset link.</p>
              <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="text-blue-400 hover:text-blue-300 text-sm">Back to Login</button>
            </div>
          ) : (
            <form onSubmit={handleForgot} style={{ padding: '0 1.5rem 1.5rem' }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  className="w-full border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                  style={{ background: 'rgba(255,255,255,0.08)' }} placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />} Send Reset Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  // ── MAIN AUTH ──
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg,#060910,#0f172a,#060910)', position: 'relative' }}>
      <style>{`body { margin: 0; background-color: #060910; }`}</style>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(59,130,246,0.07) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
      <div style={{ position: 'absolute', top: -200, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: -150, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(80px)' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link to="/">
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 100, objectFit: 'contain', margin: '0 auto 0.75rem', filter: 'drop-shadow(0 0 25px rgba(59,130,246,0.6))', display: 'block', cursor: 'pointer' }} />
          </Link>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.05em' }}>Elevating Talent. Empowering Futures.</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.09)', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
          {/* Tabs — Login & Register both visible */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '1rem', fontSize: '0.88rem', fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.2s', cursor: 'pointer', border: 'none', background: tab === t ? 'rgba(59,130,246,0.15)' : 'transparent', color: tab === t ? '#60a5fa' : '#6b7a99', borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent' }}>
                {t === 'login' ? '🔐 Login' : '✨ Register'}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {verificationMessage && (
              <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                {verificationMessage}
              </div>
            )}

            {verificationLoading && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-300">
                <Loader2 size={14} className="animate-spin" /> Verifying your email...
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" required value={loginForm.email}
                    onChange={e => {
                      setLoginForm(p => ({ ...p, email: e.target.value }));
                      if (loginErrors.email) setLoginErrors(p => ({ ...p, email: '' }));
                    }}
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    className={`w-full border ${loginErrors.email ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition`}
                    placeholder="you@example.com" />
                  {loginErrors.email && <p className="text-red-400 text-xs mt-1.5">{loginErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required value={loginForm.password}
                      onChange={e => {
                        setLoginForm(p => ({ ...p, password: e.target.value }));
                        if (loginErrors.password) setLoginErrors(p => ({ ...p, password: '' }));
                      }}
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                      className={`w-full border ${loginErrors.password ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition pr-10`}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {loginErrors.password && <p className="text-red-400 text-xs mt-1.5">{loginErrors.password}</p>}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowForgot(true)} className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>
                <button type="submit" disabled={loading || verificationLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />} Sign In
                </button>
                {showResendVerification && (
                  <button type="button" onClick={handleResendVerification} disabled={resendLoading || loading}
                    className="w-full border border-white/10 hover:border-blue-400/60 disabled:opacity-60 text-blue-300 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                    {resendLoading && <Loader2 size={14} className="animate-spin" />} Resend Verification Email
                  </button>
                )}
                <p className="text-center text-xs text-gray-600">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setTab('register')} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Register here</button>
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} noValidate className="space-y-3.5">
                {/* Role switcher */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">I am a</label>
                  <div className="flex gap-2">
                    {(['student', 'company'] as RegisterRole[]).map(r => (
                      <button key={r} type="button" onClick={() => setRegisterRole(r)}
                        style={{ flex: 1, padding: '0.6rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize', background: registerRole === r ? '#3b82f6' : 'transparent', borderColor: registerRole === r ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: registerRole === r ? '#fff' : '#6b7a99' }}>
                        {r === 'student' ? '🎓 Student' : '🏢 Company'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" required value={registerForm.name}
                    onChange={e => {
                      setRegisterForm(p => ({ ...p, name: e.target.value }));
                      if (registerErrors.name) setRegisterErrors(p => ({ ...p, name: '' }));
                    }}
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    className={`w-full border ${registerErrors.name ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition`}
                    placeholder="Your full name" />
                  {registerErrors.name && <p className="text-red-400 text-xs mt-1.5">{registerErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" required value={registerForm.email}
                    onChange={e => {
                      setRegisterForm(p => ({ ...p, email: e.target.value }));
                      if (registerErrors.email) setRegisterErrors(p => ({ ...p, email: '' }));
                    }}
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    className={`w-full border ${registerErrors.email ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition`}
                    placeholder="you@example.com" />
                  {registerErrors.email && <p className="text-red-400 text-xs mt-1.5">{registerErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required minLength={6}
                      value={registerForm.password}
                      onChange={e => {
                        setRegisterForm(p => ({ ...p, password: e.target.value }));
                        if (registerErrors.password) setRegisterErrors(p => ({ ...p, password: '' }));
                      }}
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                      className={`w-full border ${registerErrors.password ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition pr-10`}
                      placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {registerErrors.password && <p className="text-red-400 text-xs mt-1.5">{registerErrors.password}</p>}
                </div>

                {registerRole === 'company' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Company Name</label>
                      <input type="text" required value={registerForm.companyName}
                        onChange={e => {
                          setRegisterForm(p => ({ ...p, companyName: e.target.value }));
                          if (registerErrors.companyName) setRegisterErrors(p => ({ ...p, companyName: '' }));
                        }}
                        style={{ background: 'rgba(255,255,255,0.07)' }}
                        className={`w-full border ${registerErrors.companyName ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition`}
                        placeholder="Your company name" />
                      {registerErrors.companyName && <p className="text-red-400 text-xs mt-1.5">{registerErrors.companyName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Industry</label>
                      <select value={registerForm.industry}
                        onChange={e => setRegisterForm(p => ({ ...p, industry: e.target.value }))}
                        style={{ background: '#1e293b' }}
                        className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition">
                        <option value="">Select industry</option>
                        {['IT/Software','Finance','Healthcare','E-commerce','Manufacturing','Consulting','Media','Education','Other'].map(i => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 mt-1">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {registerRole === 'company' ? '🏢 Register Company' : '🎓 Create Account'}
                </button>

                <p className="text-center text-xs text-gray-600">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Login here</button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Back to home */}
        <p className="text-center mt-5">
          <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={12} /> Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
