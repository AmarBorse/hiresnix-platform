// src/pages/student/StudentOverview.tsx
import React, { useState } from 'react';
import {
  LayoutDashboard, Briefcase, Send, FileText, BookOpen,
  BotMessageSquare, BarChart2, Map, Award, User, CalendarCheck,
  ChevronDown, ChevronUp, Zap, Star, CheckCircle, ArrowRight,
  Clock, Shield, Globe, Target, TrendingUp, Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    icon: LayoutDashboard,
    color: '#3B82F6',
    bg: '#EFF6FF',
    label: 'Dashboard',
    route: '/student/dashboard',
    badge: '',
    tagline: 'Your mission control center',
    what: 'A bird\'s eye view of your entire Hiresnix journey — all key stats in one place.',
    howItWorks: [
      'Shows your internship status, access timer, and quick stats',
      'Displays recent activity across all modules',
      'Progress bars for internship, tasks, and mock interviews',
      'Quick links to most-used features',
    ],
    tip: 'Check dashboard daily to stay on top of deadlines and progress.',
    icon2: '📊',
  },
  {
    icon: CalendarCheck,
    color: '#10B981',
    bg: '#ECFDF5',
    label: 'Attendance',
    route: '/student/attendance',
    badge: '🆕',
    tagline: 'Track your daily internship presence',
    what: 'Mark your daily check-in & check-out for the internship program. Build streaks and track your punctuality.',
    howItWorks: [
      'Check-in when you start working for the day',
      'Check-out when you finish your session',
      'View calendar with your attendance history',
      'Track streaks — consecutive days attended',
      'Apply for leave when needed',
    ],
    tip: 'Maintain 80%+ attendance for a strong LOR recommendation.',
    icon2: '📅',
  },
  {
    icon: Briefcase,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    label: 'Internships',
    route: '/student/internships',
    badge: '',
    tagline: 'Your internship hub — apply, track, complete',
    what: 'The most important section! Apply for internship programs, track your progress, submit daily logs, download offer letters and certificates.',
    howItWorks: [
      '🎓 Apply for any domain (AI, ML, Full Stack, Cloud, etc.)',
      '⚡ Instant auto-approval — no manual review needed',
      '📄 Offer Letter auto-generated — download & post on LinkedIn',
      '📝 Submit Daily Logs to track your work each day',
      '📊 Progress Tracker shows time elapsed and tasks done',
      '🎯 Assigned Project — 3 stage projects (Simple → Medium → Hard)',
      '🏆 On completion — Certificate, Completion Letter & LOR available',
    ],
    tip: 'Post your offer letter on LinkedIn within 48 hours and tag @Hiresnix!',
    icon2: '🚀',
  },
  {
    icon: Send,
    color: '#F59E0B',
    bg: '#FFFBEB',
    label: 'Jobs',
    route: '/student/jobs',
    badge: '',
    tagline: 'Real job opportunities from verified companies',
    what: 'Browse and apply for full-time, part-time, and remote job opportunities posted by companies on Hiresnix.',
    howItWorks: [
      'Browse jobs by domain, location, and type',
      'View job description, requirements, and company details',
      'Apply with one click — your profile auto-fills the form',
      'Track application status in the Applications section',
    ],
    tip: 'Keep your profile complete and resume updated for better job matches.',
    icon2: '💼',
  },
  {
    icon: FileText,
    color: '#EF4444',
    bg: '#FEF2F2',
    label: 'Applications',
    route: '/student/applications',
    badge: '',
    tagline: 'Track all your job applications',
    what: 'See the status of every job application you\'ve submitted — pending, shortlisted, rejected, or selected.',
    howItWorks: [
      'View all applied jobs in one place',
      'See application status (Pending / Shortlisted / Rejected)',
      'Get notified when a company responds',
      'Withdraw application if needed',
    ],
    tip: 'Apply to 5+ jobs per week to maximize your chances.',
    icon2: '📋',
  },
  {
    icon: BookOpen,
    color: '#06B6D4',
    bg: '#ECFEFF',
    label: 'Resources',
    route: '/student/resources',
    badge: '',
    tagline: 'Curated learning materials for your domain',
    what: 'Access domain-specific study materials, videos, articles, and assignments uploaded by the Hiresnix team.',
    howItWorks: [
      'Resources are organized by domain and week',
      'Video tutorials, PDF guides, and article links',
      'Week-wise assignments to practice your skills',
      'Bookmark important resources for later',
    ],
    tip: 'Complete week-wise resources to stay on track with your internship timeline.',
    icon2: '📚',
  },
  {
    icon: BotMessageSquare,
    color: '#7C3AED',
    bg: '#F5F3FF',
    label: 'Mock Interview',
    route: '/student/mock-interview',
    badge: '',
    tagline: 'AI-powered interview practice',
    what: 'Practice real interview questions with an AI interviewer. Get scored on your answers and improve your performance.',
    howItWorks: [
      'Choose interview type — HR, Technical, Aptitude, or Behavioral',
      'Upload your resume for personalized questions',
      'Answer 15 questions in a timed session',
      'AI evaluates your answers and gives a score',
      'Get detailed feedback and weak topic analysis',
      'Downloadable interview report',
    ],
    tip: 'Practice at least 3 mock interviews before applying for jobs.',
    icon2: '🤖',
  },
  {
    icon: FileText,
    color: '#EC4899',
    bg: '#FDF2F8',
    label: 'Resume AI',
    route: '/student/resume-builder',
    badge: '🆕',
    tagline: 'Build an ATS-optimized resume with AI',
    what: 'Create a professional, ATS-friendly resume using AI. Just fill in your details and get a polished resume instantly.',
    howItWorks: [
      'Enter your personal info, education, experience, and skills',
      'AI formats and optimizes your resume for ATS systems',
      'Choose from multiple professional templates',
      'Download as PDF and use for job applications',
    ],
    tip: 'Update your resume every time you complete a new project or skill.',
    icon2: '📝',
  },
  {
    icon: Briefcase,
    color: '#F97316',
    bg: '#FFF7ED',
    label: 'My Projects',
    route: '/student/projects',
    badge: '🆕',
    tagline: 'Showcase your project portfolio',
    what: 'Upload, manage and showcase the projects you\'ve built during your internship and beyond.',
    howItWorks: [
      'Add project title, description, tech stack, and GitHub link',
      'Upload screenshots or demo videos',
      'Projects appear on your public portfolio page',
      'Hiresnix team reviews submitted internship projects',
    ],
    tip: 'Complete all 3 assigned project stages (Simple → Medium → Hard) for a strong portfolio.',
    icon2: '🎯',
  },
  {
    icon: BarChart2,
    color: '#3B82F6',
    bg: '#EFF6FF',
    label: 'Interview Stats',
    route: '/student/mock-dashboard',
    badge: '',
    tagline: 'Analyze your interview performance',
    what: 'Deep analytics on all your mock interview attempts — track improvement, identify weak topics, and maintain streaks.',
    howItWorks: [
      'Overall score trend across all attempts',
      'Weak topic identification by category',
      'Day-wise streak tracker',
      'Best score and average score comparison',
      'Recommendations on what to improve',
    ],
    tip: 'Review your weak topics after each mock interview session.',
    icon2: '📈',
  },
  {
    icon: Map,
    color: '#10B981',
    bg: '#ECFDF5',
    label: 'Career Roadmap',
    route: '/student/roadmap',
    badge: '🗺️',
    tagline: 'Your step-by-step career learning path',
    what: 'Access 29 detailed career roadmaps for different tech domains. Track your learning progress topic by topic.',
    howItWorks: [
      'Choose your domain roadmap (Frontend, Backend, AI, etc.)',
      '3000+ topics organized in a visual tree',
      'Mark topics as done as you learn them',
      'Progress bar shows % completion of the roadmap',
      'Resources linked to each topic',
    ],
    tip: 'Follow your domain\'s roadmap alongside your internship for maximum growth.',
    icon2: '🗺️',
  },
  {
    icon: Award,
    color: '#F59E0B',
    bg: '#FFFBEB',
    label: 'Certificates',
    route: '/student/certificates',
    badge: '',
    tagline: 'All your earned certificates',
    what: 'View and download all certificates you\'ve earned — internship completion, skill assessments, course completions.',
    howItWorks: [
      'Internship Certificate — auto-generated on completion',
      'Completion Letter — formal letter from Hiresnix',
      'LOR — Letter of Recommendation from our team',
      'Each certificate has a unique QR code for verification',
      'Verify any certificate at hiresnix.co.in/verification',
    ],
    tip: 'Add your Hiresnix certificates to your LinkedIn profile for maximum visibility.',
    icon2: '🏆',
  },
  {
    icon: User,
    color: '#64748B',
    bg: '#F8FAFC',
    label: 'Profile',
    route: '/student/profile',
    badge: '',
    tagline: 'Your professional identity on Hiresnix',
    what: 'Complete your profile with education, skills, social links, and portfolio. Your profile is publicly visible to companies.',
    howItWorks: [
      'Add profile photo, bio, and contact details',
      'List your education and work experience',
      'Upload your resume PDF',
      'Add GitHub, LinkedIn, and portfolio links',
      'Skills section shown as a scrolling marquee',
      'Public portfolio URL: hiresnix.co.in/portfolio/your-id',
    ],
    tip: '100% complete profiles get 3x more views from companies.',
    icon2: '👤',
  },
];

function ModuleCard({ module, expanded, onToggle }: { module: typeof MODULES[0]; expanded: boolean; onToggle: () => void }) {
  const navigate = useNavigate();
  const Icon = module.icon;

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      expanded ? 'border-blue-200 shadow-lg shadow-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 hover:shadow-md'
    } bg-white dark:bg-gray-800`}>
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 text-left">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: module.bg }}>
          <Icon size={20} style={{ color: module.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{module.label}</span>
            {module.badge && <span className="text-xs">{module.badge}</span>}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{module.tagline}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); navigate(module.route); }}
            className="hidden sm:flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            style={{ background: module.bg, color: module.color }}>
            Open <ArrowRight size={11} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* What is it */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">📌 What is it?</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{module.what}</p>
            </div>

            {/* How it works */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">⚙️ How it works</p>
              <ul className="space-y-1.5">
                {module.howItWorks.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: module.color }} />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro tip */}
          <div className="mt-4 p-3 rounded-xl border flex items-start gap-2"
            style={{ background: module.bg, borderColor: module.color + '30' }}>
            <Star size={13} className="mt-0.5 flex-shrink-0" style={{ color: module.color }} />
            <p className="text-xs font-semibold" style={{ color: module.color }}>
              Pro Tip: {module.tip}
            </p>
          </div>

          <button onClick={() => navigate(module.route)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: module.color }}>
            Go to {module.label} <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export function StudentOverview() {
  const [expanded, setExpanded] = useState<string | null>('Internships');
  const navigate = useNavigate();

  const stats = [
    { icon: '📦', label: 'Total Modules', value: MODULES.length },
    { icon: '🤖', label: 'AI-Powered', value: '5' },
    { icon: '🏆', label: 'Certificates', value: '3' },
    { icon: '⚡', label: '100% Automated', value: 'Yes' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden border border-indigo-200 shadow-lg">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-6 py-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-xl">Hiresnix Student Portal</h1>
              <p className="text-indigo-200 text-sm">Complete guide to all {MODULES.length} modules</p>
            </div>
          </div>
          <p className="text-indigo-100 text-sm mt-3">
            Everything you need to launch your career — internships, projects, mock interviews, certificates, job applications, and more. All in one place.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-700">
          {stats.map(s => (
            <div key={s.label} className="px-4 py-3 text-center">
              <p className="text-lg font-black text-gray-900 dark:text-gray-100">{s.icon} {s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick tips banner */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: Shield, color: '#10B981', title: 'Fully Secure', desc: 'Your data is protected with JWT authentication and encrypted storage.' },
          { icon: Globe, color: '#3B82F6', title: 'Public Portfolio', desc: 'Your profile & certificates are publicly verifiable via QR code.' },
          { icon: Gift, color: '#F59E0B', title: 'Free for 1 Year', desc: 'Full access to all modules for 365 days from your registration date.' },
        ].map(item => (
          <div key={item.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '20' }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended flow */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-4">
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <TrendingUp size={15} className="text-green-600" /> Recommended Flow for New Students
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {['Complete Profile', 'Apply Internship', 'Download Offer Letter', 'Post on LinkedIn', 'Submit Daily Logs', 'Practice Mock Interview', 'Complete Projects', 'Download Certificates'].map((step, i) => (
            <React.Fragment key={step}>
              <span className="text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg">
                {i + 1}. {step}
              </span>
              {i < 7 && <ArrowRight size={11} className="text-gray-400 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Module cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">All Modules</h2>
          <button onClick={() => setExpanded(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            Collapse all
          </button>
        </div>
        <div className="space-y-3">
          {MODULES.map(module => (
            <ModuleCard
              key={module.label}
              module={module}
              expanded={expanded === module.label}
              onToggle={() => setExpanded(prev => prev === module.label ? null : module.label)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
        Need help? Contact us at{' '}
        <a href="mailto:hr@hiresnix.co.in" className="text-blue-500 font-semibold hover:underline">hr@hiresnix.co.in</a>
        {' '}or{' '}
        <a href="tel:9322690710" className="text-blue-500 font-semibold hover:underline">📞 9322690710</a>
      </div>
    </div>
  );
}
