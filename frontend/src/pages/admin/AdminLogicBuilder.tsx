// src/pages/admin/AdminLogicBuilder.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Brain, Flame, Trophy, AlertTriangle, TrendingUp, Users, BarChart2 } from 'lucide-react';

const API = (import.meta as any).env.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('hx_admin_token') || localStorage.getItem('hirenix_token') || ''}` } });

const LANG_COLORS: Record<string, string> = {
  Python: '#3B82F6', JavaScript: '#F59E0B', Java: '#EF4444',
  'C++': '#8B5CF6', React: '#06B6D4', DSA: '#10B981',
  SQL: '#F97316', 'Node.js': '#22C55E', Flutter: '#EC4899',
};

function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: '#64748B' }}>{label}</span>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: '#475569' }}>{sub}</div>}
    </div>
  );
}

export function AdminLogicBuilder() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'students' | 'risk'>('overview');

  useEffect(() => {
    axios.get(`${API}/logic-builder/admin/stats`, authHeaders())
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin" style={{ color: '#6366F1' }} />
    </div>
  );

  if (!stats) return (
    <div className="text-center py-24" style={{ color: '#475569' }}>
      <Brain size={40} className="mx-auto mb-3 opacity-30" />
      <p>No data yet. Students haven't started Logic Builder.</p>
    </div>
  );

  const maxLangCount = Math.max(...(stats.langStats || []).map((l: any) => parseInt(l.count)), 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Brain size={22} style={{ color: '#6366F1' }} /> Logic Builder Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Student progress on the "Think Before You Code" journey</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.total} color="#6366F1" sub="All time" />
        <StatCard icon={Flame} label="Active (7 days)" value={stats.active} color="#10B981" sub="Recently active" />
        <StatCard icon={AlertTriangle} label="At Risk" value={stats.atRisk?.length || 0} color="#EF4444" sub="3+ days inactive" />
        <StatCard icon={Trophy} label="Top Score" value={stats.topScorers?.[0] ? `${Math.round(stats.topScorers[0].total_score)}%` : '–'} color="#F59E0B" sub={stats.topScorers?.[0]?.name || ''} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview', 'students', 'risk'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition capitalize"
            style={{ background: tab === t ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: tab === t ? '#818CF8' : '#64748B', border: tab === t ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent' }}>
            {t === 'overview' ? '📊 Overview' : t === 'students' ? '🏆 Leaderboard' : '⚠️ At Risk'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Language distribution */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><BarChart2 size={14} /> Language Distribution</h3>
            <div className="space-y-3">
              {(stats.langStats || []).map((l: any) => {
                const color = LANG_COLORS[l.language] || '#6366F1';
                const pct = Math.round((parseInt(l.count) / maxLangCount) * 100);
                return (
                  <div key={l.language} className="flex items-center gap-3">
                    <span className="w-20 text-xs truncate" style={{ color: '#94A3B8' }}>{l.language}</span>
                    <div className="flex-1 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs font-mono w-6 text-right" style={{ color: '#64748B' }}>{l.count}</span>
                  </div>
                );
              })}
              {(!stats.langStats || stats.langStats.length === 0) && (
                <p className="text-sm text-center py-4" style={{ color: '#475569' }}>No language data yet</p>
              )}
            </div>
          </div>

          {/* Daily completions */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={14} /> Daily Activity (14 days)</h3>
            <div className="flex items-end gap-1 h-32">
              {(stats.dailyRate || []).map((d: any, i: number) => {
                const maxCount = Math.max(...(stats.dailyRate || []).map((x: any) => parseInt(x.completions)), 1);
                const h = Math.max(4, Math.round((parseInt(d.completions) / maxCount) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm transition-all" style={{ height: `${h}%`, background: 'rgba(99,102,241,0.6)', minHeight: 4 }} title={`${d.date}: ${d.completions} active`} />
                    <span className="text-xs" style={{ color: '#334155', fontSize: 9 }}>{new Date(d.date).getDate()}</span>
                  </div>
                );
              })}
              {(!stats.dailyRate || stats.dailyRate.length === 0) && (
                <p className="text-sm text-center w-full py-4" style={{ color: '#475569' }}>No activity yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {tab === 'students' && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-bold text-white">🏆 Top 10 Scorers</h3>
          </div>
          <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
            {(stats.topScorers || []).length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#475569' }}>No scores yet</p>
            )}
            {(stats.topScorers || []).map((s: any, i: number) => (
              <div key={s.user_id} className="flex items-center gap-4 px-5 py-3 transition" style={{ background: i === 0 ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: i === 0 ? 'rgba(245,158,11,0.2)' : i === 1 ? 'rgba(148,163,184,0.1)' : i === 2 ? 'rgba(180,100,60,0.1)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#B4643C' : '#475569' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                  <p className="text-xs truncate" style={{ color: '#475569' }}>{s.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${LANG_COLORS[s.language] || '#6366F1'}18`, color: LANG_COLORS[s.language] || '#818CF8' }}>{s.language}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-black text-white">{Math.round(s.total_score)}%</div>
                  <div className="text-xs flex items-center gap-0.5 justify-end" style={{ color: '#EF4444' }}>
                    <Flame size={10} />{s.streak}d
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* All students table */}
          <div className="px-5 py-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-bold text-white mb-3">All Students</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: '#475569' }}>
                    <th className="text-left pb-2 font-semibold">Name</th>
                    <th className="text-left pb-2 font-semibold">Language</th>
                    <th className="text-center pb-2 font-semibold">Day</th>
                    <th className="text-center pb-2 font-semibold">Streak</th>
                    <th className="text-center pb-2 font-semibold">Score</th>
                    <th className="text-right pb-2 font-semibold">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                  {(stats.allStudents || []).map((s: any) => (
                    <tr key={s.user_id}>
                      <td className="py-2">
                        <div className="font-semibold text-white">{s.name}</div>
                        <div style={{ color: '#475569' }}>{s.email}</div>
                      </td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${LANG_COLORS[s.language] || '#6366F1'}18`, color: LANG_COLORS[s.language] || '#818CF8' }}>
                          {s.language || '–'}
                        </span>
                      </td>
                      <td className="py-2 text-center" style={{ color: '#94A3B8' }}>{s.current_day}</td>
                      <td className="py-2 text-center">
                        <span className="flex items-center justify-center gap-0.5" style={{ color: '#EF4444' }}>
                          <Flame size={10} />{s.streak}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <span className="font-bold" style={{ color: parseFloat(s.total_score) >= 80 ? '#10B981' : parseFloat(s.total_score) >= 50 ? '#F59E0B' : '#94A3B8' }}>
                          {Math.round(s.total_score)}%
                        </span>
                      </td>
                      <td className="py-2 text-right" style={{ color: '#475569' }}>
                        {s.last_active ? new Date(s.last_active).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!stats.allStudents || stats.allStudents.length === 0) && (
                <p className="text-center py-6 text-sm" style={{ color: '#475569' }}>No students yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AT RISK TAB */}
      {tab === 'risk' && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertTriangle size={14} style={{ color: '#EF4444' }} />
            <h3 className="text-sm font-bold" style={{ color: '#FCA5A5' }}>At-Risk Students (3+ days inactive with streak)</h3>
          </div>
          {(stats.atRisk || []).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: '#10B981' }}>✅ All students are active!</p>
            </div>
          ) : (
            <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
              {(stats.atRisk || []).map((s: any) => {
                const daysInactive = Math.floor((Date.now() - new Date(s.last_active).getTime()) / 86400000);
                return (
                  <div key={s.user_id} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      <p className="text-xs" style={{ color: '#475569' }}>{s.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <div className="text-xs font-bold" style={{ color: '#EF4444' }}>{daysInactive} days inactive</div>
                      <div className="text-xs" style={{ color: '#475569' }}>
                        <span style={{ color: LANG_COLORS[s.language] || '#818CF8' }}>{s.language}</span> · Day {s.current_day} · {Math.round(s.total_score)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
