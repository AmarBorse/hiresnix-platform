// src/pages/student/StudentRoadmap.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, CheckCircle2, Circle, Clock, X, BookOpen, Video, Link2, ExternalLink, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface RoadmapIndex { slug: string; name: string; emoji: string; topicCount: number; }
interface Resource { type: string; title: string; url: string; }
interface TopicContent { title: string; description: string; resources: Resource[]; }
interface Topic { id: string; label: string; type: 'topic' | 'subtopic'; x: number; y: number; content?: TopicContent; }
type TopicStatus = 'done' | 'learning' | 'skip' | null;

const STORAGE_KEY = 'hx_roadmap_progress';
function loadProgress(): Record<string, Record<string, TopicStatus>> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(p: Record<string, Record<string, TopicStatus>>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

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
  'machine-learning': { color: '#e879f9', bg: 'rgba(232,121,249,0.12)' },
};
function getColor(slug: string) {
  return CATEGORY_MAP[slug] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|playlist\?list=)|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

function getResourceIcon(type: string) {
  if (type === 'video') return <Video size={12} style={{ color: '#f87171' }} />;
  if (type === 'course') return <BookOpen size={12} style={{ color: '#a78bfa' }} />;
  return <Link2 size={12} style={{ color: '#60a5fa' }} />;
}

// ── Topic Detail Panel ────────────────────────────────────────────
function TopicPanel({ topic, status, onStatusChange, onClose, color }: {
  topic: Topic; status: TopicStatus;
  onStatusChange: (id: string, s: TopicStatus) => void;
  onClose: () => void; color: string;
}) {
  const content = topic.content;
  const videos = content?.resources.filter(r => r.type === 'video') || [];
  const articles = content?.resources.filter(r => r.type === 'article' || r.type === 'feed') || [];
  const courses = content?.resources.filter(r => r.type === 'course' || r.type === 'opensource') || [];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md shadow-2xl"
      style={{ background: 'linear-gradient(180deg,#0f1729,#0d1b35)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex-1 min-w-0 pr-3">
          <h2 className="font-black text-white text-base leading-tight">{topic.label}</h2>
          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{content?.resources.length || 0} resources</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 flex-shrink-0"><X size={16} /></button>
      </div>

      {/* Status buttons */}
      <div className="flex gap-2 px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { s: 'done' as TopicStatus, label: '✅ Done', active: 'bg-green-500/20 text-green-400 border-green-500/40' },
          { s: 'learning' as TopicStatus, label: '⏳ In Progress', active: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
          { s: 'skip' as TopicStatus, label: '⏭️ Skip', active: 'bg-gray-500/20 text-gray-400 border-gray-500/40' },
        ].map(({ s, label, active }) => (
          <button key={s} onClick={() => onStatusChange(topic.id, status === s ? null : s)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-all ${status === s ? active : 'border-white/10 text-gray-500 hover:bg-white/5'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Description */}
        {content?.description && (
          <div>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{content.description}</p>
          </div>
        )}

        {!content && (
          <p className="text-sm text-center py-8" style={{ color: '#334155' }}>No resources available for this topic.</p>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#f87171' }}>
              <Video size={12} /> Videos ({videos.length})
            </h3>
            <div className="space-y-2">
              {videos.map((r, i) => {
                const ytId = getYouTubeId(r.url);
                return (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    {ytId && (
                      <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={r.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full"
                          style={{ border: 'none' }}
                        />
                      </div>
                    )}
                    <a href={r.url} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between px-3 py-2 hover:bg-white/5 transition"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-xs font-medium truncate" style={{ color: '#e2e8f0' }}>{r.title}</span>
                      <ExternalLink size={11} className="text-gray-500 flex-shrink-0 ml-2" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Articles */}
        {articles.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#60a5fa' }}>
              <Link2 size={12} /> Articles ({articles.length})
            </h3>
            <div className="space-y-1.5">
              {articles.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 transition group"
                  style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {getResourceIcon(r.type)}
                  <span className="text-xs flex-1 truncate group-hover:text-white transition" style={{ color: '#94a3b8' }}>{r.title}</span>
                  <ExternalLink size={10} className="text-gray-600 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#a78bfa' }}>
              <BookOpen size={12} /> Courses & Resources ({courses.length})
            </h3>
            <div className="space-y-1.5">
              {courses.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 transition group"
                  style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {getResourceIcon(r.type)}
                  <span className="text-xs flex-1 truncate group-hover:text-white transition" style={{ color: '#94a3b8' }}>{r.title}</span>
                  <ExternalLink size={10} className="text-gray-600 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Roadmap Detail View ───────────────────────────────────────────
function RoadmapDetail({ roadmap, onBack }: { roadmap: RoadmapIndex; onBack: () => void }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, TopicStatus>>({});
  const [search, setSearch] = useState('');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const { color } = getColor(roadmap.slug);

  useEffect(() => {
    fetch(`/roadmaps/${roadmap.slug}.json`)
      .then(r => r.json())
      .then(data => setTopics(data.topics || []))
      .catch(() => toast.error('Failed to load roadmap'))
      .finally(() => setLoading(false));
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

  const activeTopic = activeTopicId ? topics.find(t => t.id === activeTopicId) || null : null;

  // Group topics
  const grouped: { topic: Topic; subtopics: Topic[] }[] = [];
  let current: { topic: Topic; subtopics: Topic[] } | null = null;
  for (const t of filtered) {
    if (t.type === 'topic') {
      if (current) grouped.push(current);
      current = { topic: t, subtopics: [] };
    } else if (current) {
      current.subtopics.push(t);
    }
  }
  if (current) grouped.push(current);

  const statusStyle = (s: TopicStatus) =>
    s === 'done' ? { border: '1.5px solid #34d399', background: 'rgba(52,211,153,0.12)', color: '#34d399' }
    : s === 'learning' ? { border: '1.5px solid #f59e0b', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
    : s === 'skip' ? { border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#334155', opacity: 0.5 }
    : { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#94a3b8' };

  const TopicRow = ({ t, sub = false }: { t: Topic; sub?: boolean }) => {
    const s = progress[t.id] || null;
    const active = activeTopicId === t.id;
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all select-none"
        style={{
          ...statusStyle(s),
          marginLeft: sub ? 20 : 0,
          fontSize: sub ? 12 : 13,
          fontWeight: sub ? 400 : 600,
          outline: active ? `1.5px solid ${color}` : 'none',
        }}
        onClick={() => setActiveTopicId(active ? null : t.id)}
      >
        {s === 'done' ? <CheckCircle2 size={13} style={{ color: '#34d399', flexShrink: 0 }} />
          : s === 'learning' ? <Clock size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
          : <Circle size={13} style={{ color: '#334155', flexShrink: 0 }} />}
        <span className="flex-1 truncate">{t.label}</span>
        {t.content?.resources.length ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color: '#475569' }}>
            {t.content.resources.length}
          </span>
        ) : null}
        <ChevronRight size={11} style={{ color: '#334155', flexShrink: 0 }} />
      </div>
    );
  };

  return (
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Left: topic list */}
      <div className={`flex-1 space-y-4 transition-all ${activeTopic ? 'pr-2' : ''}`} style={{ minWidth: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition text-gray-400">
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '1.4rem' }}>{roadmap.emoji}</span>
          <div>
            <h1 className="text-lg font-black text-white">{roadmap.name}</h1>
            <p className="text-xs" style={{ color: '#64748b' }}>{total} topics</p>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4 text-xs">
              <span><span className="text-white font-bold">{done}</span> <span style={{ color: '#64748b' }}>done</span></span>
              <span><span className="text-white font-bold">{learning}</span> <span style={{ color: '#64748b' }}>in progress</span></span>
              <span><span style={{ color: '#64748b' }}>{total - done - learning} left</span></span>
            </div>
            <span className="text-base font-black" style={{ color }}>{pct}%</span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: '#334155' }}>Click any topic to see resources & videos</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input type="text" placeholder="Search topics..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-600" /></button>}
        </div>

        {/* Topics */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${color} transparent transparent transparent` }} />
          </div>
        ) : (
          <div className="space-y-1.5 pb-10">
            {search ? filtered.map(t => <TopicRow key={t.id} t={t} />) : (
              grouped.map(({ topic, subtopics }) => (
                <div key={topic.id}>
                  <TopicRow t={topic} />
                  {subtopics.length > 0 && (
                    <div className="mt-0.5 space-y-0.5 pl-2">
                      {subtopics.map(st => <TopicRow key={st.id} t={st} sub />)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right panel — topic detail */}
      {activeTopic && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setActiveTopicId(null)} style={{ background: 'rgba(0,0,0,0.5)' }} />
          <TopicPanel
            topic={activeTopic}
            status={progress[activeTopic.id] || null}
            onStatusChange={handleStatusChange}
            onClose={() => setActiveTopicId(null)}
            color={color}
          />
        </>
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

  const totalStarted = roadmaps.filter(r => Object.keys(progress[r.slug] || {}).length > 0).length;
  const totalDone = roadmaps.reduce((acc, r) => acc + Object.values(progress[r.slug] || {}).filter(s => s === 'done').length, 0);

  if (selected) {
    return <RoadmapDetail roadmap={selected} onBack={() => { setSelected(null); setProgress(loadProgress()); }} />;
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#818cf8' }}>Hiresnix</p>
        <h1 className="text-2xl font-black text-white">Career Roadmaps</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>{roadmaps.length} roadmaps · Click any topic to see videos & articles</p>
        {totalStarted > 0 && (
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span><span className="text-white font-bold">{totalStarted}</span> <span style={{ color: '#64748b' }}>roadmaps started</span></span>
            <span><span className="text-white font-bold">{totalDone}</span> <span style={{ color: '#64748b' }}>topics completed</span></span>
          </div>
        )}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Search roadmaps..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#818cf8 transparent transparent transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(r => {
            const { color, bg } = getColor(r.slug);
            const pct = getRoadmapPct(r.slug, r.topicCount);
            const started = Object.keys(progress[r.slug] || {}).length > 0;
            return (
              <div key={r.slug} onClick={() => setSelected(r)}
                className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 group"
                style={{ background: started ? bg : 'rgba(255,255,255,0.04)', border: `1px solid ${started ? color + '44' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="flex items-start justify-between mb-3">
                  <span style={{ fontSize: '1.8rem' }}>{r.emoji}</span>
                  {started && pct > 0 && <span className="text-xs font-black" style={{ color }}>{pct}%</span>}
                </div>
                <p className="font-bold text-white text-sm mb-1">{r.name}</p>
                <p className="text-xs mb-3" style={{ color: '#475569' }}>{r.topicCount} topics</p>
                {started && (
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                )}
                {!started && (
                  <div className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition" style={{ color }}>Start →</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}