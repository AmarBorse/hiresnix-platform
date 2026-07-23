// src/pages/student/StudentRoadmap.tsx
// Career Roadmaps — powered by Hiresnix
import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, CheckCircle2, Circle, Clock, X, BookOpen, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import client from '../../api/client';

// ── Types ─────────────────────────────────────────────────────────
interface RoadmapIndex {
  slug: string; name: string; emoji: string; topicCount: number;
}
interface Topic {
  id: string; label: string; type: 'topic' | 'subtopic'; x: number; y: number;
}
type TopicStatus = 'done' | 'learning' | 'skip' | null;

// ── Progress storage key ──────────────────────────────────────────
const STORAGE_KEY = 'hx_roadmap_progress';

function loadProgress(): Record<string, Record<string, TopicStatus>> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveProgress(p: Record<string, Record<string, TopicStatus>>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ── Category colors ────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, { color: string; bg: string }> = {
  'frontend': { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  'backend': { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  'full-stack': { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'devops': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'computer-science': { color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  'python': { color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  'javascript': { color: '#fde68a', bg: 'rgba(253,230,138,0.12)' },
  'react': { color: '#67e8f9', bg: 'rgba(103,232,249,0.12)' },
  'nodejs': { color: '#6ee7b7', bg: 'rgba(110,231,183,0.12)' },
  'typescript': { color: '#93c5fd', bg: 'rgba(147,197,253,0.12)' },
  'cyber-security': { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  'ai-data-scientist': { color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  'machine-learning': { color: '#e879f9', bg: 'rgba(232,121,249,0.12)' },
};
function getColor(slug: string) {
  return CATEGORY_MAP[slug] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
}

// ── Topic Node Component ──────────────────────────────────────────
function TopicNode({ topic, status, onStatusChange, color }: {
  topic: Topic;
  status: TopicStatus;
  onStatusChange: (id: string, s: TopicStatus) => void;
  color: string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isSubtopic = topic.type === 'subtopic';

  const statusStyle = status === 'done'
    ? { border: `1.5px solid #34d399`, background: 'rgba(52,211,153,0.15)', color: '#34d399' }
    : status === 'learning'
    ? { border: `1.5px solid #f59e0b`, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }
    : status === 'skip'
    ? { border: `1.5px solid #475569`, background: 'rgba(71,85,105,0.1)', color: '#475569', opacity: 0.6 }
    : { border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: '#e2e8f0' };

  return (
    <div className="relative" style={{ marginLeft: isSubtopic ? 24 : 0 }}>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:scale-[1.01] select-none"
        style={{ ...statusStyle, fontSize: isSubtopic ? 12 : 13, fontWeight: isSubtopic ? 400 : 600 }}
        onClick={() => setShowMenu(!showMenu)}
      >
        {status === 'done' ? <CheckCircle2 size={13} style={{ color: '#34d399', flexShrink: 0 }} />
          : status === 'learning' ? <Clock size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
          : <Circle size={13} style={{ color: '#475569', flexShrink: 0 }} />}
        <span className="truncate">{topic.label}</span>
      </div>

      {showMenu && (
        <div className="absolute left-0 top-full mt-1 z-50 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.12)', minWidth: 180 }}>
          {[
            { s: 'done' as TopicStatus, label: '✅ Mark Done', color: '#34d399' },
            { s: 'learning' as TopicStatus, label: '⏳ In Progress', color: '#f59e0b' },
            { s: 'skip' as TopicStatus, label: '⏭️ Skip', color: '#64748b' },
            { s: null, label: '⭕ Reset', color: '#94a3b8' },
          ].map(({ s, label, color: c }) => (
            <button key={String(s)} onClick={() => { onStatusChange(topic.id, s); setShowMenu(false); }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/10 transition"
              style={{ color: c }}>
              {label}
            </button>
          ))}
          <button onClick={() => setShowMenu(false)}
            className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-white/5 transition border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Roadmap Detail View ───────────────────────────────────────────
function RoadmapDetail({ roadmap, onBack }: { roadmap: RoadmapIndex; onBack: () => void }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, TopicStatus>>({});
  const [search, setSearch] = useState('');
  const { color } = getColor(roadmap.slug);

  useEffect(() => {
    // Load roadmap topics
    fetch(`/roadmaps/${roadmap.slug}.json`)
      .then(r => r.json())
      .then(data => { setTopics(data.topics || []); })
      .catch(() => toast.error('Failed to load roadmap'))
      .finally(() => setLoading(false));

    // Load saved progress
    const all = loadProgress();
    setProgress(all[roadmap.slug] || {});
  }, [roadmap.slug]);

  const handleStatusChange = useCallback((topicId: string, status: TopicStatus) => {
    setProgress(prev => {
      const updated = { ...prev };
      if (status === null) delete updated[topicId];
      else updated[topicId] = status;
      const all = loadProgress();
      all[roadmap.slug] = updated;
      saveProgress(all);
      return updated;
    });
  }, [roadmap.slug]);

  const done = Object.values(progress).filter(s => s === 'done').length;
  const learning = Object.values(progress).filter(s => s === 'learning').length;
  const total = topics.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const filtered = topics.filter(t =>
    !search || t.label.toLowerCase().includes(search.toLowerCase())
  );

  // Group topics/subtopics
  const grouped: { topic: Topic; subtopics: Topic[] }[] = [];
  let current: { topic: Topic; subtopics: Topic[] } | null = null;
  for (const t of filtered) {
    if (t.type === 'topic') {
      if (current) grouped.push(current);
      current = { topic: t, subtopics: [] };
    } else if (t.type === 'subtopic' && current) {
      current.subtopics.push(t);
    }
  }
  if (current) grouped.push(current);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition text-gray-400">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '1.5rem' }}>{roadmap.emoji}</span>
          <div>
            <h1 className="text-lg font-black text-white">{roadmap.name}</h1>
            <p className="text-xs" style={{ color: '#64748b' }}>{total} topics · Hiresnix Career Roadmap</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} style={{ color: '#34d399' }} /><span className="text-white font-bold">{done}</span><span style={{ color: '#64748b' }}>done</span></span>
            <span className="flex items-center gap-1.5"><Clock size={12} style={{ color: '#f59e0b' }} /><span className="text-white font-bold">{learning}</span><span style={{ color: '#64748b' }}>in progress</span></span>
            <span className="text-xs" style={{ color: '#64748b' }}>{total - done - learning} remaining</span>
          </div>
          <span className="text-lg font-black" style={{ color }}>{pct}%</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
        <p className="text-[10px] mt-2" style={{ color: '#334155' }}>Click any topic to mark it as Done / In Progress / Skip</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Search topics..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
          <X size={14} className="text-gray-500" />
        </button>}
      </div>

      {/* Topics */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${color} transparent transparent transparent` }} />
        </div>
      ) : (
        <div className="space-y-2 pb-8">
          {search ? (
            // Flat list when searching
            filtered.map(t => (
              <TopicNode key={t.id} topic={t} status={progress[t.id] || null}
                onStatusChange={handleStatusChange} color={color} />
            ))
          ) : (
            // Grouped view
            grouped.map(({ topic, subtopics }) => (
              <div key={topic.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <TopicNode topic={topic} status={progress[topic.id] || null}
                  onStatusChange={handleStatusChange} color={color} />
                {subtopics.length > 0 && (
                  <div className="space-y-0.5 px-2 pb-2 pt-0.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {subtopics.map(st => (
                      <TopicNode key={st.id} topic={st} status={progress[st.id] || null}
                        onStatusChange={handleStatusChange} color={color} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: '#475569' }}>No topics found for "{search}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export function StudentRoadmap() {
  const [roadmaps, setRoadmaps] = useState<RoadmapIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RoadmapIndex | null>(null);
  const [progress, setProgress] = useState<Record<string, Record<string, TopicStatus>>>({});

  useEffect(() => {
    fetch('/roadmaps/index.json')
      .then(r => r.json())
      .then(data => setRoadmaps(data))
      .catch(() => toast.error('Failed to load roadmaps'))
      .finally(() => setLoading(false));
    setProgress(loadProgress());
  }, []);

  const filtered = roadmaps.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const getRoadmapPct = (slug: string, total: number) => {
    const p = progress[slug] || {};
    const done = Object.values(p).filter(s => s === 'done').length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const totalStarted = roadmaps.filter(r => {
    const p = progress[r.slug] || {};
    return Object.keys(p).length > 0;
  }).length;

  const totalDone = roadmaps.reduce((acc, r) => {
    const p = progress[r.slug] || {};
    return acc + Object.values(p).filter(s => s === 'done').length;
  }, 0);

  if (selected) {
    return <RoadmapDetail roadmap={selected} onBack={() => { setSelected(null); setProgress(loadProgress()); }} />;
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right,rgba(99,102,241,0.1),transparent 60%)' }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#818cf8' }}>Hiresnix</p>
          <h1 className="text-2xl font-black text-white">Career Roadmaps</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {roadmaps.length} roadmaps · Track your learning journey
          </p>
          {totalStarted > 0 && (
            <div className="flex items-center gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1.5">
                <BookOpen size={12} style={{ color: '#818cf8' }} />
                <span className="text-white font-bold">{totalStarted}</span>
                <span style={{ color: '#64748b' }}>roadmaps started</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} style={{ color: '#34d399' }} />
                <span className="text-white font-bold">{totalDone}</span>
                <span style={{ color: '#64748b' }}>topics completed</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Search roadmaps..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
      </div>

      {/* Roadmap Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#818cf8 transparent transparent transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(r => {
            const { color, bg } = getColor(r.slug);
            const pct = getRoadmapPct(r.slug, r.topicCount);
            const p = progress[r.slug] || {};
            const started = Object.keys(p).length > 0;

            return (
              <div key={r.slug} onClick={() => setSelected(r)}
                className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 group"
                style={{ background: started ? bg : 'rgba(255,255,255,0.04)', border: `1px solid ${started ? color + '44' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="flex items-start justify-between mb-3">
                  <span style={{ fontSize: '1.8rem' }}>{r.emoji}</span>
                  {started && pct > 0 && (
                    <span className="text-xs font-black" style={{ color }}>{pct}%</span>
                  )}
                </div>
                <p className="font-bold text-white text-sm mb-1 leading-tight">{r.name}</p>
                <p className="text-xs mb-3" style={{ color: '#475569' }}>{r.topicCount} topics</p>

                {started && (
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                )}

                {!started && (
                  <div className="flex items-center gap-1 text-xs font-semibold group-hover:opacity-100 opacity-0 transition-opacity" style={{ color }}>
                    Start →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <p className="text-center py-12 text-sm" style={{ color: '#475569' }}>No roadmaps found for "{search}"</p>
      )}
    </div>
  );
}
