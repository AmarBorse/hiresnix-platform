// src/pages/student/StudentMockDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Award, TrendingUp, Clock, Flame, Target, ChevronRight, Trash2, RotateCcw } from 'lucide-react';
import client from '../../api/client';

interface Analytics {
  total: number;
  bestScore: number;
  avgScore: number;
  topWeak: string[];
  domainStats: { domain: string; count: number; avgScore: number }[];
  weeklyCount: number;
  streak: number;
  totalTime: number;
}

interface Interview {
  id: number;
  domain: string;
  round: string;
  difficulty: string;
  overallScore: number;
  totalQuestions: number;
  communication: number;
  technical: number;
  confidence: number;
  grammar: number;
  problemSolving: number;
  weakTopics: string[];
  createdAt: string;
  duration: number;
}

const ROUND_LABELS: Record<string, string> = {
  hr: 'HR Round', tech: 'Technical', apt: 'Aptitude', behav: 'Behavioral'
};

const DIFF_COLORS: Record<string, string> = {
  Easy: 'bg-green-900/40 text-green-400',
  Medium: 'bg-amber-900/40 text-amber-400',
  Hard: 'bg-red-900/40 text-red-400',
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:'stroke-dasharray 1s ease'}}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">{score}</text>
    </svg>
  );
}

export function StudentMockDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<{ interviews: Interview[]; analytics: Analytics } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    client.get('/mock-interview/my')
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this interview record?')) return;
    setDeleting(id);
    await client.delete(`/mock-interview/${id}`).catch(() => {});
    setDeleting(null);
    load();
  };

  const fmtTime = (s: number) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`;
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const a = data?.analytics;
  const interviews = data?.interviews || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎯 Mock Interview Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Track your interview performance and progress</p>
        </div>
        <button onClick={() => navigate('/student/mock-interview')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition">
          <RotateCcw size={14}/> Practice Now
        </button>
      </div>

      {interviews.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
          <div className="text-6xl mb-4">🎙️</div>
          <h3 className="text-white font-bold text-lg mb-2">No interviews yet</h3>
          <p className="text-gray-500 text-sm mb-6">Complete your first AI Mock Interview to see analytics here</p>
          <button onClick={() => navigate('/student/mock-interview')}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition">
            Start First Interview →
          </button>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Interviews', value: a?.total || 0, icon: '🎙️', color: 'text-indigo-400' },
              { label: 'Best Score', value: `${a?.bestScore || 0}/100`, icon: '🏆', color: 'text-yellow-400' },
              { label: 'Avg Score', value: `${a?.avgScore || 0}/100`, icon: '📊', color: 'text-blue-400' },
              { label: 'This Week', value: a?.weeklyCount || 0, icon: '📅', color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-gray-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Streak + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-900/30 border border-orange-700/40 flex items-center justify-center">
                <Flame size={22} className="text-orange-400"/>
              </div>
              <div>
                <div className="text-2xl font-black text-orange-400">{a?.streak || 0} days</div>
                <div className="text-gray-500 text-xs">Interview Streak</div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-900/30 border border-blue-700/40 flex items-center justify-center">
                <Clock size={22} className="text-blue-400"/>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-400">{fmtTime(a?.totalTime || 0)}</div>
                <div className="text-gray-500 text-xs">Total Practice Time</div>
              </div>
            </div>
          </div>

          {/* Domain performance */}
          {(a?.domainStats || []).length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Target size={16} className="text-indigo-400"/> Domain Performance
              </h3>
              <div className="space-y-3">
                {(a?.domainStats || []).map(d => (
                  <div key={d.domain}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{d.domain}</span>
                      <span className="text-gray-400 text-xs">{d.count} interview{d.count !== 1 ? 's' : ''} · <span className={`font-bold ${d.avgScore >= 70 ? 'text-green-400' : d.avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{d.avgScore}/100</span></span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${d.avgScore >= 70 ? 'bg-green-500' : d.avgScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${d.avgScore}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak topics */}
          {(a?.topWeak || []).length > 0 && (
            <div className="bg-red-900/15 border border-red-800/30 rounded-2xl p-5">
              <h3 className="text-red-300 font-bold mb-3 flex items-center gap-2">
                <TrendingUp size={15}/> Areas to Improve
              </h3>
              <div className="flex flex-wrap gap-2">
                {(a?.topWeak || []).map((t, i) => (
                  <span key={i} className="text-xs bg-red-900/30 text-red-300 border border-red-800/40 px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Interview history */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-400"/>
              <h3 className="font-bold text-white">Interview History</h3>
              <span className="ml-auto text-xs text-gray-500">{interviews.length} sessions</span>
            </div>
            <div className="divide-y divide-gray-800">
              {interviews.map(iv => (
                <div key={iv.id}>
                  <button onClick={() => setExpanded(expanded === iv.id ? null : iv.id)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-800/50 transition text-left">
                    <ScoreRing score={iv.overallScore} size={56}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">{iv.domain}</span>
                        <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded-full">{ROUND_LABELS[iv.round] || iv.round}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLORS[iv.difficulty] || 'bg-gray-800 text-gray-400'}`}>{iv.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{fmtDate(iv.createdAt)}</span>
                        <span>·</span>
                        <span>{iv.totalQuestions} questions</span>
                        {iv.duration > 0 && <><span>·</span><span>{fmtTime(iv.duration)}</span></>}
                      </div>
                      {/* Mini score bars */}
                      <div className="flex gap-2 mt-2">
                        {[['C', iv.communication], ['T', iv.technical], ['Co', iv.confidence], ['G', iv.grammar], ['P', iv.problemSolving]].map(([l, v]) => (
                          <div key={l as string} className="flex flex-col items-center gap-0.5">
                            <div className="w-6 bg-gray-800 rounded-full h-8 relative overflow-hidden">
                              <div className={`absolute bottom-0 w-full rounded-full transition-all ${(v as number) >= 7 ? 'bg-green-500' : (v as number) >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ height: `${(v as number) * 10}%` }}/>
                            </div>
                            <span className="text-[9px] text-gray-600">{l as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={e => { e.stopPropagation(); handleDelete(iv.id); }}
                        disabled={deleting === iv.id}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition">
                        <Trash2 size={14}/>
                      </button>
                      <ChevronRight size={16} className={`text-gray-600 transition-transform ${expanded === iv.id ? 'rotate-90' : ''}`}/>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expanded === iv.id && (
                    <div className="px-5 pb-4 bg-gray-800/30">
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {[['🗣️', 'Communication', iv.communication], ['💻', 'Technical', iv.technical], ['💪', 'Confidence', iv.confidence], ['📝', 'Grammar', iv.grammar], ['🧠', 'Problem Solving', iv.problemSolving]].map(([icon, label, score]) => (
                          <div key={label as string} className="bg-gray-900 rounded-xl p-2 text-center">
                            <div className="text-lg">{icon as string}</div>
                            <div className={`text-sm font-black ${(score as number) >= 7 ? 'text-green-400' : (score as number) >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{score as number}/10</div>
                            <div className="text-[9px] text-gray-600 mt-0.5">{(label as string).split(' ')[0]}</div>
                          </div>
                        ))}
                      </div>
                      {iv.weakTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-gray-500">Weak:</span>
                          {iv.weakTopics.slice(0, 4).map((t, i) => (
                            <span key={i} className="text-xs bg-red-900/20 text-red-400 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
