// src/pages/instStudent/InstStudentLogin.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, GraduationCap, ArrowLeft } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { useInstStudentStore } from '../../store/useInstStudentStore';

export function InstStudentLogin() {
  const navigate = useNavigate();
  const { setAuth } = useInstStudentStore();
  const [form, setForm]         = useState({ careerId: '', password: '' });
  const [errors, setErrors]     = useState({ careerId: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = { careerId: '', password: '' };
    let hasErr = false;
    if (!form.careerId) { errs.careerId = 'Career ID required'; hasErr = true; }
    if (!form.password) { errs.password = 'Password required'; hasErr = true; }
    setErrors(errs);
    if (hasErr) return;
    setLoading(true);
    try {
      const res = await instStudentApi.login(form.careerId.trim().toUpperCase(), form.password);
      setAuth(res.student, res.token);
      toast.success(`Welcome, ${res.student.name}!`);
      navigate('/inst-student/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid Career ID or password');
    } finally { setLoading(false); }
  };

  const inputCls = (err?: string) =>
    `w-full border ${err ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition`;

  const bg07 = { background: 'rgba(255,255,255,0.07)' };
  const cardStyle = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', borderRadius:20, border:'1px solid rgba(255,255,255,0.09)', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.5)' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg,#060910,#0f172a,#060910)', position: 'relative' }}>
      <style>{`body { margin:0; background:#060910; }`}</style>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,rgba(99,102,241,0.07) 1px,transparent 1px)', backgroundSize:'30px 30px' }} />
      <div style={{ position:'absolute', top:-200, right:-100, width:500, height:500, borderRadius:'50%', background:'rgba(99,102,241,0.06)', filter:'blur(80px)' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-7">
          <Link to="/">
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height:90, objectFit:'contain', margin:'0 auto 0.75rem', filter:'drop-shadow(0 0 25px rgba(99,102,241,0.6))', display:'block', cursor:'pointer' }} />
          </Link>
          <p className="text-gray-500 text-sm" style={{ fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.05em' }}>
            Institution Student Portal
          </p>
        </div>

        <div style={cardStyle}>
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <GraduationCap size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{showForgot ? 'Forgot Password?' : 'Student Login'}</p>
              <p className="text-gray-500 text-xs">{showForgot ? 'Contact your institution admin' : 'Use your Career ID & password'}</p>
            </div>
          </div>

          <div className="p-6">
            {/* ── Forgot Password Screen ── */}
            {showForgot ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <p className="text-gray-400 text-sm">Password reset ke liye apne institution admin se contact karo.</p>
                </div>

                <div style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, padding:'1rem' }}>
                  <p className="text-indigo-300 text-sm font-semibold mb-2">📞 Kaise reset hoga?</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    1. Institution admin se contact karo<br/>
                    2. Admin temporary password set karega<br/>
                    3. Login karo → <strong className="text-white">Profile → Change Password</strong><br/>
                    4. Apna naya password set karo ✅
                  </p>
                </div>

                <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'0.75rem' }} className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Hiresnix Support</p>
                  <a href="mailto:hr@hiresnix.co.in" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
                    hr@hiresnix.co.in
                  </a>
                </div>

                <button type="button" onClick={() => setShowForgot(false)}
                  className="w-full text-gray-500 hover:text-gray-300 text-sm transition flex items-center justify-center gap-1">
                  <ArrowLeft size={12} /> Back to Login
                </button>
              </div>
            ) : (
              /* ── Login Form ── */
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Career ID</label>
                  <input type="text" value={form.careerId}
                    onChange={e => { setForm(p => ({ ...p, careerId: e.target.value })); if (errors.careerId) setErrors(p => ({ ...p, careerId: '' })); }}
                    style={bg07} className={inputCls(errors.careerId)} placeholder="HX-2026-000001" />
                  {errors.careerId && <p className="text-red-400 text-xs mt-1">{errors.careerId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => { setForm(p => ({ ...p, password: e.target.value })); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
                      style={bg07} className={inputCls(errors.password) + ' pr-10'} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Forgot password link */}
                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowForgot(true)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">
                    Forgot password?
                  </button>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                  <p className="text-indigo-300 text-xs">
                    🎓 Career ID aur default password aapke institution admin ne share kiya hoga.
                  </p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Login to Student Portal
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center mt-4">
          <Link to="/auth" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            ← Main Login Page
          </Link>
        </p>
      </div>
    </div>
  );
}