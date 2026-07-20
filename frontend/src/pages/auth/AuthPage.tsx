// src/pages/auth/AuthPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Role } from '../../types';
import { Eye, EyeOff, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';

type Tab = 'login' | 'register';
type RegisterRole = 'student' | 'company' | 'institution';

const inputStyle = (err?: string) =>
  `w-full border ${err ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition auth-input`;
const bg07 = { background: 'rgba(13,18,30,0.6)' };

export function AuthPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const routeState  = location.state as { message?: string } | null;
  const { setAuth } = useAuthStore();
  const [tab, setTab]           = useState<Tab>('login');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [registerRole, setRegisterRole] = useState<RegisterRole>('student');
  const [emailVerifSent, setEmailVerifSent] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [showForgot, setShowForgot]     = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const [loginForm, setLoginForm]         = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors]     = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm]   = useState({ name: '', email: '', password: '', companyName: '', industry: '', institutionName: '', institutionType: '', careerId: '', institutionId: '' });

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
      const payload: any = { name: registerForm.name, email: cleanEmail, password: registerForm.password, role: registerRole, careerId: registerForm.careerId || undefined, institutionId: registerForm.institutionId || undefined };
      if (registerRole === 'company') { payload.companyName = registerForm.companyName; payload.industry = registerForm.industry; }
      if (registerRole === 'institution') { payload.institutionName = registerForm.institutionName; payload.type = registerForm.institutionType; }
      const res = await authApi.register(payload);
      if (res.pendingApproval) { setPendingApproval(true); return; }
      if (res.token && res.user) {
        setAuth(res.user, res.token);
        toast.success(`🎉 Account created! Welcome, ${res.user.name}!`);
        navigate(roleRedirect[res.user.role] || '/');
      } else {
        // Account created but no token returned - redirect to login
        toast.success('✅ Account created successfully! Please login.');
        setTab('login');
      }
    } catch (err: any) { toast.error(err.response?.data?.message || err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };


  // Handle email verification token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('studentEmailVerificationToken');
    if (token) {
      setVerifyingEmail(true);
      fetch(`${(import.meta as any).env.VITE_API_URL}/auth/verify-email?token=${token}`)
          .then(r => r.json())
          .then(data => {
            setVerifyMsg(data.message || 'Email verified!');
            setVerifyingEmail(false);
            window.history.replaceState({}, '', '/auth');
          })
          .catch(() => {
            setVerifyMsg('Verification failed. Link may be expired.');
            setVerifyingEmail(false);
          });
    }
  }, []);

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

  if (showForgot) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#060910,#0f172a,#060910)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <Link to="/"><img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 80, objectFit: 'contain', margin: '0 auto 0.75rem', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.5))', display: 'block' }} /></Link>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.09)', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔐</span>
              </div>
              <h2 className="text-white font-bold text-lg">Forgot Password?</h2>
              <p className="text-gray-400 text-sm mt-1">Password reset ke liye Hiresnix admin se contact karo.</p>
            </div>
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '1rem' }}>
              <p className="text-blue-300 text-sm font-semibold mb-2">📞 Kaise reset hoga?</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                1. Hiresnix admin se contact karo<br/>
                2. Admin temporary password set karega<br/>
                3. Login karo → <strong className="text-white">Profile → Change Password</strong><br/>
                4. Apna naya password set karo ✅
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '0.75rem' }} className="text-center">
              <p className="text-gray-400 text-xs mb-1">Contact us at</p>
              <a href="mailto:hr@hiresnix.co.in" className="text-blue-400 hover:text-blue-300 text-sm font-semibold">hr@hiresnix.co.in</a>
            </div>
            <button type="button" onClick={() => setShowForgot(false)} className="w-full text-gray-500 hover:text-gray-300 text-sm transition flex items-center justify-center gap-1">
              <ArrowLeft size={12} /> Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Pending approval screen for institution
  if (pendingApproval) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#060910,#0f172a,#060910)' }}>
      <div className="w-full max-w-md text-center space-y-6">
        <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 80, objectFit: 'contain', margin: '0 auto', filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))' }} />
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.09)', padding: '2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Registration Submitted!</h2>
          <p className="text-gray-400 text-sm mb-4">Your institution registration is pending admin approval. You will be able to log in once your account has been reviewed and approved.</p>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-5">
            <p className="text-indigo-300 text-xs">✓ Registration received<br />⏳ Waiting for admin review<br />📧 You'll be notified on approval</p>
          </div>
          <button onClick={() => { setPendingApproval(false); setTab('login'); setRegisterRole('student'); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg,#020617,#0f172a,#020617)', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        body { margin: 0; background-color: #020617; }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg);opacity:0.6} 50%{transform:translateY(-30px) rotate(180deg);opacity:0.2} }
        @keyframes pulse-glow { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.1)} }
        @keyframes drift { 0%{transform:translate(0,0)} 25%{transform:translate(30px,-20px)} 50%{transform:translate(-10px,40px)} 75%{transform:translate(-30px,-10px)} 100%{transform:translate(0,0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes card-in { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes logo-pulse { 0%,100%{filter:drop-shadow(0 0 20px rgba(59,130,246,0.5))} 50%{filter:drop-shadow(0 0 35px rgba(59,130,246,0.9)) drop-shadow(0 0 60px rgba(139,92,246,0.4))} }
        .auth-input { transition: border-color 0.2s, box-shadow 0.2s !important; }
        .auth-input:focus { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12), 0 0 16px rgba(59,130,246,0.1) !important; outline: none !important; }
        .auth-btn { transition: all 0.2s !important; }
        .auth-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,0.4) !important; }
        .auth-btn:active { transform: translateY(0); }
        .role-btn { transition: all 0.2s !important; }
        .role-btn:hover { transform: translateY(-1px); }
      `}</style>

      {/* Animated gradient orbs */}
      <div style={{ position:'absolute', top:'-10%', right:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.15),transparent 70%)', filter:'blur(40px)', animation:'drift 12s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:450, height:450, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)', filter:'blur(40px)', animation:'drift 15s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', top:'40%', left:'20%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)', filter:'blur(60px)', animation:'pulse-glow 6s ease-in-out infinite' }} />

      {/* Grid pattern */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,rgba(59,130,246,0.08) 1px,transparent 1px)', backgroundSize:'28px 28px', opacity:0.6 }} />

      {/* Floating particles */}
      {[
        {top:'10%',left:'15%',size:6,delay:'0s',color:'rgba(59,130,246,0.5)'},
        {top:'20%',left:'80%',size:4,delay:'1s',color:'rgba(139,92,246,0.5)'},
        {top:'60%',left:'10%',size:5,delay:'2s',color:'rgba(16,185,129,0.4)'},
        {top:'75%',left:'85%',size:7,delay:'0.5s',color:'rgba(59,130,246,0.4)'},
        {top:'40%',left:'90%',size:4,delay:'3s',color:'rgba(245,158,11,0.4)'},
        {top:'85%',left:'40%',size:5,delay:'1.5s',color:'rgba(139,92,246,0.4)'},
        {top:'5%',left:'50%',size:3,delay:'2.5s',color:'rgba(59,130,246,0.6)'},
        {top:'50%',left:'5%',size:6,delay:'0.8s',color:'rgba(16,185,129,0.3)'},
      ].map((p,i)=>(
        <div key={i} style={{
          position:'absolute', top:p.top, left:p.left,
          width:p.size, height:p.size, borderRadius:'50%',
          background:p.color, filter:'blur(1px)',
          animation:`float ${4+i*0.5}s ease-in-out ${p.delay} infinite`
        }}/>
      ))}

      {/* Top shimmer line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(59,130,246,0.6),rgba(139,92,246,0.6),transparent)', animation:'shimmer 3s linear infinite', backgroundSize:'200% 100%' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-7" style={{animation:'card-in 0.6s ease both'}}>
          <Link to="/"><img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 100, objectFit: 'contain', margin: '0 auto 0.75rem', filter: 'drop-shadow(0 0 25px rgba(59,130,246,0.6))', display: 'block', cursor: 'pointer', animation:'logo-pulse 3s ease-in-out infinite' }} /></Link>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.05em' }}>Elevating Talent. Empowering Futures.</p>
        </div>

        <div style={{ background: 'rgba(13,18,30,0.85)', backdropFilter: 'blur(24px)', borderRadius: 20, border: '1px solid rgba(59,130,246,0.2)', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(59,130,246,0.08)', animation:'card-in 0.7s ease both', position:'relative' }}>
          {/* Card top glow line */}
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(59,130,246,0.8),rgba(139,92,246,0.8),transparent)',animation:'shimmer 2.5s linear infinite',backgroundSize:'200% 100%'}}/>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '1rem', fontSize: '0.88rem', fontWeight: 700, textTransform: 'capitalize', transition: 'all 0.2s', cursor: 'pointer', border: 'none', background: tab === t ? 'rgba(59,130,246,0.15)' : 'transparent', color: tab === t ? '#60a5fa' : '#6b7a99', borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent' }}>
                {t === 'login' ? '🔐 Login' : '✨ Register'}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* LOGIN */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" required value={loginForm.email} onChange={e => { setLoginForm(p => ({ ...p, email: e.target.value })); if (loginErrors.email) setLoginErrors(p => ({ ...p, email: '' })); }}
                    style={bg07} className={inputStyle(loginErrors.email)} placeholder="you@example.com" />
                  {loginErrors.email && <p className="text-red-400 text-xs mt-1.5">{loginErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required value={loginForm.password} onChange={e => { setLoginForm(p => ({ ...p, password: e.target.value })); if (loginErrors.password) setLoginErrors(p => ({ ...p, password: '' })); }}
                      style={bg07} className={inputStyle(loginErrors.password) + ' pr-10'} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {loginErrors.password && <p className="text-red-400 text-xs mt-1.5">{loginErrors.password}</p>}
                </div>
                <div className="flex justify-end">
  <button type="button" onClick={() => setShowForgot(true)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
    Forgot password?
  </button>
</div>
                <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 auth-btn">
                  {loading && <Loader2 size={14} className="animate-spin" />} Sign In
                </button>
                <p className="text-center text-xs text-gray-600">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setTab('register')} className="text-blue-400 hover:text-blue-300 font-semibold">Register here</button>
                </p>
              </form>
            )}

            {/* REGISTER */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} noValidate className="space-y-3.5">
                {/* Role switcher */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">I am a</label>
                  <div className="flex gap-2">
                    {([
                      { role: 'student', label: '🎓 Student' },
                      { role: 'company', label: '🏢 Company' },
                      { role: 'institution', label: '🏫 Institution' },
                    ] as { role: RegisterRole; label: string }[]).map(({ role: r, label }) => (
                      <button key={r} type="button" onClick={() => setRegisterRole(r)}
                        style={{ flex: 1, padding: '0.5rem 0.3rem', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s', background: registerRole === r ? '#3b82f6' : 'transparent', borderColor: registerRole === r ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: registerRole === r ? '#fff' : '#6b7a99' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Common fields */}
                {(['name', 'email', 'password'] as const).map(k => (
                  <div key={k}>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{k === 'name' ? 'Full Name' : k.charAt(0).toUpperCase() + k.slice(1)}</label>
                    <div className="relative">
                      <input type={k === 'password' ? (showPass ? 'text' : 'password') : k === 'email' ? 'email' : 'text'}
                        required value={(registerForm as any)[k]}
                        onChange={e => { setRegisterForm(p => ({ ...p, [k]: e.target.value })); if ((registerErrors as any)[k]) setRegisterErrors(p => ({ ...p, [k]: '' })); }}
                        style={bg07} className={inputStyle((registerErrors as any)[k]) + (k === 'password' ? ' pr-10' : '')}
                        placeholder={k === 'name' ? 'Your full name' : k === 'email' ? 'you@example.com' : 'Min 6 characters'} />
                      {k === 'password' && (
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      )}
                    </div>
                    {(registerErrors as any)[k] && <p className="text-red-400 text-xs mt-1.5">{(registerErrors as any)[k]}</p>}
                  </div>
                ))}

                {/* Company-specific */}
                {registerRole === 'company' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Company Name</label>
                      <input type="text" required value={registerForm.companyName} onChange={e => { setRegisterForm(p => ({ ...p, companyName: e.target.value })); if (registerErrors.companyName) setRegisterErrors(p => ({ ...p, companyName: '' })); }}
                        style={bg07} className={inputStyle(registerErrors.companyName)} placeholder="Your company name" />
                      {registerErrors.companyName && <p className="text-red-400 text-xs mt-1.5">{registerErrors.companyName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Industry</label>
                      <select value={registerForm.industry} onChange={e => setRegisterForm(p => ({ ...p, industry: e.target.value }))} style={{ background: '#1e293b' }}
                        className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Select industry</option>
                        {['IT/Software','Finance','Healthcare','E-commerce','Manufacturing','Consulting','Media','Education','Other'].map(i => <option key={i}>{i}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Institution-specific */}
                {registerRole === 'institution' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Institution Name</label>
                      <input type="text" required value={registerForm.institutionName} onChange={e => { setRegisterForm(p => ({ ...p, institutionName: e.target.value })); if (registerErrors.institutionName) setRegisterErrors(p => ({ ...p, institutionName: '' })); }}
                        style={bg07} className={inputStyle(registerErrors.institutionName)} placeholder="e.g. ABC Institute of Technology" />
                      {registerErrors.institutionName && <p className="text-red-400 text-xs mt-1.5">{registerErrors.institutionName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Institution Type</label>
                      <select value={registerForm.institutionType} onChange={e => setRegisterForm(p => ({ ...p, institutionType: e.target.value }))} style={{ background: '#1e293b' }}
                        className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Select type</option>
                        {['University','College','Institute','Training Center','School','Other'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                      <p className="text-indigo-300 text-xs">🏫 Institution accounts require admin approval before you can log in. You'll be notified once reviewed.</p>
                    </div>
                  </>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 mt-1 auth-btn">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {registerRole === 'company' ? '🏢 Register Company' : registerRole === 'institution' ? '🏫 Register Institution' : '🎓 Create Account'}
                </button>
                <p className="text-center text-xs text-gray-600">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')} className="text-blue-400 hover:text-blue-300 font-semibold">Login here</button>
                </p>
              </form>
            )}
          </div>
        </div>
        <p className="text-center mt-5">
          <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={12} /> Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}