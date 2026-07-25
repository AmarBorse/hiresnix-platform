import { CheckCircle2, Target, Telescope, ShieldCheck, Users, BookOpen, Briefcase, Award, Brain, Map, FileText, Building2, Globe, Phone, Mail, Zap, Star, TrendingUp, Code2, GraduationCap } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { LegalLayout } from '../../components/legal/LegalLayout';
import { COMPANY, registeredOfficeText } from '../../lib/companyInfo';

export function AboutUs() {
  const description = 'Learn about Hiresnix — AI-powered EdTech and HR-Tech platform by SR PATIL INFRASTRUCTURE PRIVATE LIMITED, Shirpur, Maharashtra.';

  return (
    <LegalLayout>
      <SEO title="About Us | Hiresnix" description={description} path="/about-us" structuredData={{ '@type': 'AboutPage', name: 'About Hiresnix', description }} />

      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl space-y-16">

          {/* ── HERO ── */}
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">About Hiresnix</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              AI-Powered Career Platform for India's Next Generation
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">
              Hiresnix is an AI-powered B2B2C EdTech and HR-Tech SaaS platform built specifically for Engineering, BCA, and MCA students in Tier-2 and Tier-3 cities across India. We bridge the gap between academic learning and industry readiness through cutting-edge AI tools, structured internship programs, and institution-level career management systems.
            </p>
            <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
              Operated by <span className="font-semibold text-white">{COMPANY.legalName}</span>, Hiresnix serves students, educational institutions, and companies through a unified platform accessible at <span className="text-blue-400 font-semibold">hiresnix.co.in</span>.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Users, value: '500+', label: 'Active Students', color: 'text-blue-400' },
                { icon: Building2, value: '10+', label: 'Partner Institutions', color: 'text-purple-400' },
                { icon: BookOpen, value: '16', label: 'AI Courses', color: 'text-emerald-400' },
                { icon: Map, value: '29+', label: 'Career Roadmaps', color: 'text-amber-400' },
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center">
                  <Icon className={`mx-auto mb-2 ${color}`} size={22} />
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="mt-1 text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── MISSION VISION TRUST ── */}
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Target, title: 'Mission', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-400/20', text: 'To make career readiness practical, structured, and accessible for every engineering and management student in India — regardless of their college tier or city.' },
              { icon: Telescope, title: 'Vision', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-400/20', text: 'To become India\'s most trusted AI-powered career development ecosystem — empowering 10 lakh+ students, 1,000+ institutions, and 5,000+ companies by 2027.' },
              { icon: ShieldCheck, title: 'Values', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/20', text: 'Transparency, accessibility, and genuine impact. Every certificate we issue is QR-verified. Every internship is structured. Every student deserves a fair shot at their career.' },
            ].map((item) => (
              <div key={item.title} className={`rounded-xl border p-6 ${item.bg}`}>
                <item.icon className={item.color} size={26} />
                <h2 className="mt-4 text-xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>

          {/* ── PLATFORM OVERVIEW ── */}
          <div>
            <h2 className="text-2xl font-black text-white mb-2">The Hiresnix Platform</h2>
            <p className="text-slate-400 text-sm mb-8">A complete career ecosystem — 5 portals, 1 platform, infinite possibilities.</p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: GraduationCap, color: 'text-blue-400', bg: 'border-blue-400/20 bg-blue-500/5',
                  title: 'Student Portal', path: '/student/*',
                  desc: 'The main hub for students — dashboard, internship applications, job listings, AI mock interviews, resume builder, certificates, projects portfolio, and career roadmaps.',
                  features: ['AI Mock Interview', 'Resume AI + ATS Scanner', 'Internship Applications', 'Career Roadmaps (29 domains)', 'Public Portfolio Page', 'Verified Certificates'],
                },
                {
                  icon: Building2, color: 'text-purple-400', bg: 'border-purple-400/20 bg-purple-500/5',
                  title: 'Institution Portal', path: '/institution/*',
                  desc: 'Colleges and training centers manage their students, batches, courses, and track AI Academy progress — all through a dedicated institution dashboard.',
                  features: ['Student Management', 'Batch-wise Tracking', 'Career ID Generation', 'AI Academy Monitoring', 'Certificate Issuance', 'Internship Progress View'],
                },
                {
                  icon: Brain, color: 'text-cyan-400', bg: 'border-cyan-400/20 bg-cyan-500/5',
                  title: 'AI Academy', path: '/inst-student/*',
                  desc: 'Institution students get a dedicated portal with Career ID login, access to 16 AI-powered courses, progress tracking, and verified certificates.',
                  features: ['16 Tech Courses', 'AI Teacher for Every Topic', 'Career ID Login', 'Progress Tracking', 'Batch-wise Certificates', 'Code Editor + Sandbox'],
                },
                {
                  icon: Briefcase, color: 'text-emerald-400', bg: 'border-emerald-400/20 bg-emerald-500/5',
                  title: 'Company Portal', path: '/company/*',
                  desc: 'Companies post jobs, review applicants, and build their talent pipeline directly through Hiresnix — with access to a pool of trained, verified students.',
                  features: ['Job Posting', 'Applicant Management', 'Student Profile Access', 'Verification Status', 'Domain Filtering', 'Direct Hiring'],
                },
                {
                  icon: ShieldCheck, color: 'text-amber-400', bg: 'border-amber-400/20 bg-amber-500/5',
                  title: 'Admin Platform', path: '/admin/*',
                  desc: 'The command center for Hiresnix operations — internship management, document generation, institution approvals, analytics, and full platform oversight.',
                  features: ['Internship Platform (iplatform)', 'Document Generation', 'Institution Management', 'Analytics Dashboard', 'Client Management', 'Enquiry Management'],
                },
                {
                  icon: Globe, color: 'text-pink-400', bg: 'border-pink-400/20 bg-pink-500/5',
                  title: 'Public Tools', path: 'Public',
                  desc: 'Free tools open to all students — career roadmaps, project portfolios, certificate verification, and Deadline or Dead (All India skill challenge).',
                  features: ['Career Roadmaps', 'Portfolio: /projects/name', 'Certificate Verification', 'Deadline or Dead Game', 'Blog & Resources', 'Company Info Pages'],
                },
              ].map((portal) => (
                <div key={portal.title} className={`rounded-xl border p-5 ${portal.bg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <portal.icon className={portal.color} size={22} />
                    <div>
                      <h3 className="font-bold text-white text-sm">{portal.title}</h3>
                      <span className="font-mono text-[10px] text-slate-500">{portal.path}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-5 mb-3">{portal.desc}</p>
                  <div className="space-y-1">
                    {portal.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 size={11} className={portal.color} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── KEY FEATURES ── */}
          <div>
            <h2 className="text-2xl font-black text-white mb-2">Key Features & Capabilities</h2>
            <p className="text-slate-400 text-sm mb-8">Everything a student needs from campus to career — powered by AI.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Brain, title: 'AI Mock Interview', desc: 'Voice + text based mock interviews with instant scoring (0-100), weak topic identification, and downloadable PDF reports. Supports Technical and HR rounds.' },
                { icon: FileText, title: 'AI Resume Builder + ATS Scanner', desc: 'Upload resume → get ATS score → AI suggests improvements → download professional PDF. Keyword analysis for any job description.' },
                { icon: Briefcase, title: 'Structured Internship Platform', desc: '12+ domains including Web Dev, ML, Data Science, Android, UI/UX, DevOps. 8-12 week programs with weekly tasks, mentorship, and admin-approved progress.' },
                { icon: Award, title: 'Verified Document System', desc: 'AI-generated Offer Letter, Appointment Letter, Joining Letter, Completion Certificate, and LOR — all with unique IDs and QR codes verifiable at hiresnix.co.in/verify.' },
                { icon: Globe, title: 'Public Portfolio Pages', desc: 'Every student gets a public portfolio at hiresnix.co.in/projects/username — shareable on LinkedIn and resume, discoverable by recruiters.' },
                { icon: BookOpen, title: 'AI Academy — 16 Courses', desc: 'Python, JavaScript, Java, C++, React, Node.js, DSA, SQL, Docker, ML, Data Science, Flutter, Git, Cybersecurity, and more. AI teacher explains every concept.' },
                { icon: Map, title: 'Career Roadmaps', desc: '29 domain-specific career roadmaps (sourced from roadmap.sh, MIT licensed). Students track progress topic by topic — Done, Learning, or Skip.' },
                { icon: Code2, title: 'Career ID System', desc: 'Institution students get unique Career IDs (HX-{CODE}-{YEAR}-{SEQ}) for verified identity across all Hiresnix portals and documents.' },
                { icon: TrendingUp, title: 'Analytics & Tracking', desc: 'Feature usage analytics, student progress dashboards, batch-wise performance reports, and AI Academy progress monitoring for institutions.' },
                { icon: Star, title: 'Deadline or Dead', desc: 'An all-India gamified skill challenge — daily tasks, AI verification, quiz-based proof of work, streak tracking, and a real-time leaderboard.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 rounded-xl border border-white/08 bg-white/[0.02] p-4 hover:border-blue-400/30 transition-colors">
                  <Icon className="text-blue-400 mt-0.5 shrink-0" size={18} />
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                    <p className="text-xs text-slate-400 leading-5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TECH STACK ── */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2">
              <Code2 className="text-blue-400" size={20} /> Technology Stack
            </h2>
            <p className="text-slate-400 text-sm mb-6">Enterprise-grade tech, built to scale.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Frontend', items: ['React 19 + TypeScript', 'Vite', 'Tailwind CSS', 'Deployed on Vercel'] },
                { label: 'Backend', items: ['Node.js + Express', 'Sequelize ORM', 'JWT Authentication', 'Deployed on Render'] },
                { label: 'Database', items: ['Supabase PostgreSQL', 'Mumbai Region', '22+ Tables', 'Real-time capabilities'] },
                { label: 'AI & Tools', items: ['Groq (Llama 3.3)', 'PDFKit (Documents)', 'QR Code Generation', 'Web Speech API'] },
              ].map(({ label, items }) => (
                <div key={label}>
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">{label}</h3>
                  {items.map(i => (
                    <div key={i} className="text-xs text-slate-400 py-0.5 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-blue-400/60 inline-block shrink-0" />
                      {i}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── WHO WE SERVE ── */}
          <div>
            <h2 className="text-2xl font-black text-white mb-6">Who We Serve</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-400/20', title: 'Students', desc: 'Engineering, BCA, and MCA students in Tier-2/3 cities who want structured career support — from AI mock interviews to verified internship certificates.' },
                { icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/5 border-purple-400/20', title: 'Institutions', desc: 'Colleges, training centers, and coaching institutes that want to provide their students with AI-powered career tools and track their placement readiness.' },
                { icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-400/20', title: 'Companies', desc: 'Startups and businesses looking to hire trained, motivated junior talent with verified skill credentials and internship experience.' },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className={`rounded-xl border p-5 ${bg}`}>
                  <Icon className={color} size={24} />
                  <h3 className="mt-3 font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-6">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── LEGAL INFO ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={20} /> Legal Company Information
              </h2>
              <dl className="space-y-3 text-sm">
                {[
                  ['Brand Name', 'Hiresnix'],
                  ['Legal Company Name', COMPANY.legalName],
                  ['CIN', COMPANY.cin],
                  ['Registered Office','9V3M+JP3 , Ambika Nagar, Shirpur, Dhule, Maharashtra - 425405'],
                  ['Website', 'hiresnix.co.in'],
                  ['Official Email', COMPANY.email],
                  ['Phone', '+91 9529120977'],
                  ['Founded', '2024'],
                  ['Headquarters', 'Shirpur, Maharashtra, India'],
                ].map(([key, val]) => (
                  <div key={key} className="flex gap-3">
                    <dt className="text-slate-500 min-w-[140px] shrink-0">{key}</dt>
                    <dd className="font-medium text-slate-200 break-all">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="text-amber-400" size={20} /> Contact & Support
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'Email', value: 'hr@hiresnix.co.in', href: 'mailto:hr@hiresnix.co.in' },
                  { icon: Phone, label: 'Phone', value: '+91 9529120977', href: 'tel:+919529120977' },
                  { icon: Globe, label: 'Website', value: 'hiresnix.co.in', href: 'https://hiresnix.co.in' },
                ].map(({ icon: Icon, label, value, href }) => (
                  <a key={label} href={href} className="flex items-center gap-3 rounded-lg p-3 hover:bg-white/5 transition-colors group">
                    <Icon className="text-blue-400 shrink-0" size={18} />
                    <div>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{value}</p>
                    </div>
                  </a>
                ))}
                <div className="mt-4 rounded-lg bg-blue-500/10 border border-blue-400/20 p-3">
                  <p className="text-xs text-slate-400">For internship queries, institution partnerships, or technical support — our team typically responds within 24 hours on business days.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── TAGLINE ── */}
          <div className="text-center py-8 border-t border-white/10">
            <p className="text-2xl font-black text-white">Hiresnix</p>
            <p className="text-slate-400 mt-1 italic">Elevating Talent. Empowering Futures. 🌟</p>
          </div>

        </div>
      </section>
    </LegalLayout>
  );
}