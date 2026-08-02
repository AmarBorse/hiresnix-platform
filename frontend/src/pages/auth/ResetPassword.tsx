// src/pages/auth/ResetPassword.tsx
import { useState } from 'react';
import axios from 'axios';

const API = (import.meta as any).env.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

export function ResetPassword() {
  const [email, setEmail]           = useState('');
  const [resetCode, setResetCode]   = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');
  const [showPass, setShowPass]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your registered email.');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (newPassword !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password-direct`, {
        email: email.trim().toLowerCase(),
        newPassword,
        resetCode,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1117 0%, #0B0F1A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, Calibri, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#3B82F6', margin: 0, letterSpacing: 1 }}>
            Hiresnix
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>
            Elevating Talent. Empowering Futures.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '20px',
          padding: '32px',
          backdropFilter: 'blur(10px)',
        }}>
          {success ? (
            /* Success State */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ color: '#10B981', fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>
                Password Updated!
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: '0 0 24px' }}>
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <a
                href="https://hiresnix.co.in/auth"
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg,#3B82F6,#2563EB)',
                  color: '#fff',
                  padding: '12px 32px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                Go to Login →
              </a>
            </div>
          ) : (
            /* Form */
            <>
              <h2 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>
                Reset Password
              </h2>
              <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 24px' }}>
                Enter your registered email and set a new password.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#FCA5A5',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}>
                  ❌ {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Reset Code */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>
                    Reset Code <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    placeholder="Enter code provided by Hiresnix"
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#E2E8F0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>
                    Contact Hiresnix support to get your reset code.
                  </p>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>
                    Registered Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#E2E8F0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* New Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '12px 44px 12px 16px',
                        color: '#E2E8F0',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '16px',
                      }}
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {newPassword && (
                    <div style={{ marginTop: '6px', display: 'flex', gap: '4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '3px', borderRadius: '2px',
                          background: newPassword.length >= i * 3
                            ? (newPassword.length >= 10 ? '#10B981' : newPassword.length >= 6 ? '#F59E0B' : '#EF4444')
                            : 'rgba(255,255,255,0.1)',
                        }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    style={{
                      width: '100%',
                      background: confirm && confirm !== newPassword ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${confirm && confirm !== newPassword ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#E2E8F0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {confirm && confirm !== newPassword && (
                    <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</p>
                  )}
                  {confirm && confirm === newPassword && (
                    <p style={{ color: '#10B981', fontSize: '12px', marginTop: '4px' }}>✓ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg,#3B82F6,#2563EB)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? '⏳ Updating Password...' : '🔒 Reset Password'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <a
                  href="https://hiresnix.co.in/auth"
                  style={{ color: '#3B82F6', fontSize: '13px', textDecoration: 'none' }}
                >
                  ← Back to Login
                </a>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: '12px', marginTop: '20px' }}>
          © 2026 SR Patil Infrastructure Private Limited · hiresnix.co.in
        </p>
      </div>
    </div>
  );
}