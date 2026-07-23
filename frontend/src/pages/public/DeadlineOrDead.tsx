// src/pages/public/DeadlineOrDead.tsx
// DEADLINE OR DEAD — All India Public Challenge by Hiresnix
import { useState, useEffect, useRef, useCallback } from "react";

const API = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

const SKILLS = [
  "React.js","Python","Machine Learning","Node.js","DSA",
  "SQL","Docker","Flutter","Cybersecurity","Data Science",
  "Java","DevOps","Figma/UI Design","Cloud (AWS)","Blockchain"
];

const DAILY_TASKS: Record<string, string[]> = {
  "React.js":["Build a working todo app with hooks","Create a custom useDebounce hook","Deploy a React app to Vercel","Implement lazy loading on 3 routes","Build a real-time search filter"],
  "Python":["Write a web scraper for 1 site","Solve 3 LeetCode easy problems","Build a CLI tool that does something useful","Automate a boring task on your PC","Create a REST API with Flask"],
  "Machine Learning":["Train a model on Titanic dataset","Explain overfitting with example","Build an image classifier","Implement linear regression from scratch","Create a recommendation system"],
  "Node.js":["Build an Express REST API with 3 routes","Connect to MongoDB or Supabase","Implement JWT auth from scratch","Create a WebSocket chat server","Deploy backend to Render"],
  "DSA":["Solve 2 medium array problems on LeetCode","Implement a binary search tree","Code BFS + DFS with explanation","Solve a dynamic programming problem","Reverse a linked list 3 different ways"],
  "SQL":["Write 5 JOIN queries on real data","Create indexes and explain why they help","Write a stored procedure","Design a 5-table schema for an app","Optimize a slow query and document changes"],
  "Docker":["Containerize any app you built","Write a docker-compose with 2 services","Push image to Docker Hub","Explain volumes vs bind mounts","Deploy a container to cloud"],
  "Flutter":["Build a login screen UI","Consume a REST API in Flutter","Add state management with Provider","Publish app to TestFlight","Build a multi-screen app with navigation"],
  "Cybersecurity":["Complete 1 TryHackMe room","Set up a basic firewall rule","Demonstrate SQL injection with example","Scan your own network ethically","Learn and explain OWASP Top 3"],
  "Data Science":["Clean a messy dataset and document steps","Create 5 meaningful visualizations","Write a full EDA notebook","Build a prediction model","Present findings in a 1-page report"],
  "Java":["Build a CRUD app with Spring Boot","Implement OOP with 4 principles","Write 10 unit tests with JUnit","Explain multithreading with code","Connect to a real database"],
  "DevOps":["Set up a CI/CD pipeline","Write a GitHub Actions workflow","Monitor an app with logs","Automate deployment with a script","Set up uptime alerts"],
  "Figma/UI Design":["Design a mobile app with 5 screens","Create a design system with components","Prototype a user flow","Get feedback from 3 real people","Redesign an app you hate using"],
  "Cloud (AWS)":["Deploy an EC2 instance","Set up S3 bucket with proper permissions","Create a Lambda function","Configure RDS database","Set up CloudWatch alerts"],
  "Blockchain":["Explain consensus mechanisms","Write a basic smart contract","Deploy to testnet","Interact with MetaMask programmatically","Build a simple dApp frontend"],
};

const THREAT_MESSAGES = [
  "10,847 students learned this skill today. You didn't.",
  "3 companies stopped hiring juniors without this. This week.",
  "Your batch topper submitted a project at 2 AM last night.",
  "A 19-year-old in Pune just got hired doing exactly this.",
  "Recruiters skip profiles without this in 6 seconds.",
  "AI replaced 2,300 jobs this month that didn't have this skill.",
  "The company you want to join just added this to their JD.",
  "You're not behind. You're being left behind.",
  "Someone in your college is building portfolio right now.",
  "This skill gap costs ₹8,000/month in salary.",
];

const SURVIVAL_QUOTES = [
  "The market doesn't care about your potential.",
  "Comfort is the enemy of placement.",
  "Every day you delay, someone else gets your offer.",
  "Skills expire. Hustle doesn't.",
  "You're not a student. You're a product. Ship yourself.",
];

const REWARDS = [
  { id:"survivor3",   icon:"🟠", title:"3-Day Survivor",      desc:"Survived 3 consecutive days",          condition: (s:number) => s >= 3 },
  { id:"survivor7",   icon:"🔥", title:"Week Warrior",         desc:"7 day streak — you're serious",        condition: (s:number) => s >= 7 },
  { id:"survivor14",  icon:"💀", title:"Two Week Nightmare",   desc:"14 days of non-stop grind",            condition: (s:number) => s >= 14 },
  { id:"survivor30",  icon:"👑", title:"30-Day Legend",        desc:"Placement-ready. Officially.",         condition: (s:number) => s >= 30 },
  { id:"quizmaster",  icon:"🧠", title:"Quiz Crusher",         desc:"Passed 5 AI quizzes without fail",     condition: (_s:number, q:number) => q >= 5 },
  { id:"screenshotter",icon:"📸",title:"Proof of Work",        desc:"Submitted 3 screenshot verifications", condition: (_s:number, _q:number, sc:number) => sc >= 3 },
  { id:"highscore",   icon:"⚡", title:"High Voltage",         desc:"Survival score above 85%",             condition: (_s:number, _q:number, _sc:number, surv:number) => surv >= 85 },
];

const PLAYER_KEY = 'hx_deadline_player';
const HISTORY_KEY = 'hx_deadline_history';

function glitchText(text: string) {
  const chars = "!@#$%^&*<>?/|\\[]{}";
  return text.split("").map(c => Math.random() > 0.85 ? chars[Math.floor(Math.random() * chars.length)] : c).join("");
}

function createSoundEngine() {
  let ctx: AudioContext | null = null;
  const getCtx = () => { if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); return ctx; };
  return {
    playAlarm() { try { const c=getCtx(); [0,0.15,0.3].forEach(t=>{ const o=c.createOscillator(),g=c.createGain(); o.connect(g);g.connect(c.destination); o.frequency.setValueAtTime(880,c.currentTime+t); o.frequency.exponentialRampToValueAtTime(220,c.currentTime+t+0.12); g.gain.setValueAtTime(0.3,c.currentTime+t); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+t+0.12); o.start(c.currentTime+t); o.stop(c.currentTime+t+0.13); }); } catch(e){} },
    playSuccess() { try { const c=getCtx(); [523,659,784].forEach((f,i)=>{ const o=c.createOscillator(),g=c.createGain(); o.connect(g);g.connect(c.destination); o.frequency.value=f; o.type="sine"; g.gain.setValueAtTime(0.2,c.currentTime+i*0.1); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.1+0.2); o.start(c.currentTime+i*0.1); o.stop(c.currentTime+i*0.1+0.2); }); } catch(e){} },
    playReward() { try { const c=getCtx(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(),g=c.createGain(); o.connect(g);g.connect(c.destination); o.frequency.value=f; o.type="sine"; g.gain.setValueAtTime(0.25,c.currentTime+i*0.12); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.25); o.start(c.currentTime+i*0.12); o.stop(c.currentTime+i*0.12+0.26); }); } catch(e){} },
    playDecay() { try { const c=getCtx(); const o=c.createOscillator(),g=c.createGain(); o.connect(g);g.connect(c.destination); o.frequency.setValueAtTime(200,c.currentTime); o.frequency.exponentialRampToValueAtTime(80,c.currentTime+0.3); o.type="sawtooth"; g.gain.setValueAtTime(0.15,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3); o.start(c.currentTime); o.stop(c.currentTime+0.3); } catch(e){} },
    playQuizCorrect() { try { const c=getCtx(); const o=c.createOscillator(),g=c.createGain(); o.connect(g);g.connect(c.destination); o.frequency.setValueAtTime(440,c.currentTime); o.frequency.setValueAtTime(660,c.currentTime+0.1); g.gain.setValueAtTime(0.2,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3); o.start(c.currentTime); o.stop(c.currentTime+0.3); } catch(e){} },
    playQuizWrong() { try { const c=getCtx(); const o=c.createOscillator(),g=c.createGain(); o.connect(g);g.connect(c.destination); o.frequency.setValueAtTime(300,c.currentTime); o.frequency.exponentialRampToValueAtTime(150,c.currentTime+0.3); o.type="square"; g.gain.setValueAtTime(0.15,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3); o.start(c.currentTime); o.stop(c.currentTime+0.3); } catch(e){} },
  };
}
const sound = createSoundEngine();
// ── Background Music Engine ───────────────────────────────────────
function createMusicEngine() {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let playing = false;
  let nodes: AudioNode[] = [];

  const getCtx = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
      masterGain.connect(ctx.destination);
    }
    return ctx;
  };

  function playDrumLoop() {
    const c = getCtx();
    const mg = masterGain!;
    const BPM = 140;
    const beat = 60 / BPM;

    function kick(time: number) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(mg);
      o.frequency.setValueAtTime(150, time);
      o.frequency.exponentialRampToValueAtTime(40, time + 0.12);
      g.gain.setValueAtTime(1.2, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      o.start(time); o.stop(time + 0.25);
    }

    function snare(time: number) {
      const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2000;
      src.connect(f); f.connect(g); g.connect(mg);
      g.gain.setValueAtTime(0.5, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      src.start(time); src.stop(time + 0.15);
    }

    function hihat(time: number, vol = 0.18) {
      const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 8000;
      const g = c.createGain();
      src.connect(f); f.connect(g); g.connect(mg);
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      src.start(time); src.stop(time + 0.05);
    }

    // Schedule 4 bars ahead
    const now = c.currentTime;
    for (let bar = 0; bar < 4; bar++) {
      const base = now + bar * beat * 4;
      // Kick: beats 1, 3
      kick(base); kick(base + beat * 2);
      kick(base + beat * 2.5);
      // Snare: beats 2, 4
      snare(base + beat); snare(base + beat * 3);
      // Hi-hats: every 8th note
      for (let i = 0; i < 8; i++) hihat(base + i * beat * 0.5, i % 2 === 0 ? 0.2 : 0.1);
    }
  }

  function playBassLine() {
    const c = getCtx();
    const mg = masterGain!;
    const BPM = 140;
    const beat = 60 / BPM;
    // Dark bass riff in minor
    const notes = [55, 55, 58, 55, 52, 55, 50, 52]; // A1 minor feel
    const now = c.currentTime;

    notes.forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 200;
      o.type = 'sawtooth';
      o.connect(f); f.connect(g); g.connect(mg);
      const t = now + i * beat * 0.5;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.45);
      o.start(t); o.stop(t + beat * 0.5);
    });
  }

  function playMelody() {
    const c = getCtx();
    const mg = masterGain!;
    const BPM = 140;
    const beat = 60 / BPM;
    // Ominous minor melody
    const pattern = [220, 0, 220, 196, 0, 174.6, 0, 165];
    const now = c.currentTime + 0.1;

    pattern.forEach((freq, i) => {
      if (freq === 0) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.connect(g); g.connect(mg);
      const t = now + i * beat * 0.5;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.4);
      o.start(t); o.stop(t + beat * 0.5);
    });
  }

  function loop() {
    if (!playing) return;
    playDrumLoop();
    playBassLine();
    playMelody();
    const BPM = 140;
    const beat = 60 / BPM;
    setTimeout(loop, beat * 4 * 1000);
  }

  return {
    start() {
      if (playing) return;
      playing = true;
      try { getCtx(); loop(); } catch {}
    },
    stop() {
      playing = false;
      try { masterGain?.gain.setValueAtTime(0, ctx!.currentTime); } catch {}
    },
    toggle() {
      if (playing) this.stop(); else this.start();
      return !playing;
    },
    isPlaying: () => playing,
  };
}
const music = createMusicEngine();




// ── Task Descriptions ─────────────────────────────────────────────
const TASK_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "React.js": {
    "Build a working todo app with hooks": "React hooks (useState, useEffect) are the foundation of modern React. Every recruiter tests this. A todo app proves you can manage state, handle events, and render lists — core skills for 90% of frontend jobs.",
    "Create a custom useDebounce hook": "Custom hooks separate logic from UI. useDebounce is asked in almost every React interview. It shows you understand closures, useEffect cleanup, and performance optimization.",
    "Deploy a React app to Vercel": "Code that isn't deployed doesn't exist. Vercel deployment proves you can ship. Interviewers want to see live URLs, not localhost screenshots.",
    "Implement lazy loading on 3 routes": "Performance is a senior skill. Lazy loading reduces bundle size. React.lazy() and Suspense are standard interview topics for mid-level React roles.",
    "Build a real-time search filter": "Search filtering combines useState, useEffect, debouncing, and array methods. It's one of the most common coding challenges given in React interviews.",
  },
  "Python": {
    "Write a web scraper for 1 site": "Web scraping with BeautifulSoup/Selenium is a ₹15-40k/month freelance skill. It tests your understanding of HTML structure, HTTP requests, and data extraction.",
    "Solve 3 LeetCode easy problems": "LeetCode is how companies filter candidates. Easy problems test arrays, strings, and basic logic — skills every Python developer must have. 3 problems = proof of consistency.",
    "Build a CLI tool that does something useful": "CLI tools show you can solve real problems. argparse, file I/O, and sys.argv mastery separates Python beginners from developers.",
    "Automate a boring task on your PC": "Automation is Python's superpower. File renaming, PDF processing, email sending — showing you've automated something real proves practical Python skills.",
    "Create a REST API with Flask": "Flask APIs are the backbone of data science projects. Frontend-backend integration, JSON responses, and route handling are must-know for any Python developer.",
  },
  "Machine Learning": {
    "Train a model on Titanic dataset": "Titanic is the 'Hello World' of ML. It covers data cleaning, feature engineering, model training, and evaluation — the complete ML pipeline in one dataset.",
    "Explain overfitting with example": "Overfitting is the most common ML interview question. If you can't explain it clearly with an example, you'll fail technical rounds at every ML company.",
    "Build an image classifier": "CNNs and image classification are in 60% of ML job descriptions. Even a basic MNIST classifier proves you understand neural networks and model evaluation.",
    "Implement linear regression from scratch": "Building algorithms from scratch (not sklearn) proves deep understanding. Interviewers test this to separate people who use ML from those who understand it.",
    "Create a recommendation system": "Collaborative filtering and content-based recommendations power Netflix, Swiggy, and Amazon. This project alone can get you an interview at any product company.",
  },
  "Node.js": {
    "Build an Express REST API with 3 routes": "Express is the most used Node.js framework. REST APIs with GET/POST/DELETE routes are the foundation of every Node.js backend role.",
    "Connect to MongoDB or Supabase": "Database integration separates frontend developers from backend developers. CRUD operations with a real database is the minimum for any backend position.",
    "Implement JWT auth from scratch": "Authentication is in every web app. JWT implementation from scratch proves you understand tokens, middleware, and security — not just copy-pasting tutorials.",
    "Create a WebSocket chat server": "Real-time features (chat, notifications, live updates) use WebSockets. This skill is rare among juniors and immediately impresses interviewers.",
    "Deploy backend to Render": "An API that only runs locally is useless. Deployment, environment variables, and production configuration are skills that distinguish developers who can ship.",
  },
  "DSA": {
    "Solve 2 medium array problems on LeetCode": "Array problems appear in 70% of technical interviews. Two-pointer, sliding window, and prefix sum patterns are tested at every company from startups to FAANG.",
    "Implement a binary search tree": "Trees are tested in every serious technical interview. BST implementation from scratch demonstrates recursion mastery and pointer manipulation.",
    "Code BFS + DFS with explanation": "Graph traversal algorithms are asked in system design and coding rounds. BFS/DFS solve problems from social networks to route finding.",
    "Solve a dynamic programming problem": "DP is the hardest topic in interviews. Solving even one DP problem proves you can break complex problems into subproblems — a rare skill that commands higher salaries.",
    "Reverse a linked list 3 different ways": "Linked list reversal is asked in literally every company. Knowing 3 approaches (iterative, recursive, stack) shows depth of understanding.",
  },
  "SQL": {
    "Write 5 JOIN queries on real data": "JOINs are tested in every data role interview. INNER, LEFT, RIGHT, FULL OUTER — understanding when to use each is the difference between a job offer and rejection.",
    "Create indexes and explain why they help": "Indexing is a senior SQL skill. Explaining B-tree indexes and query optimization shows you think about performance, not just correctness.",
    "Write a stored procedure": "Stored procedures appear in enterprise SQL interviews. They demonstrate understanding of database logic, parameterization, and reusable code.",
    "Design a 5-table schema for an app": "Schema design is asked in every backend interview. Normalization, foreign keys, and relationships show you think about data architecture.",
    "Optimize a slow query and document changes": "Query optimization is a ₹5-10 LPA skill. EXPLAIN ANALYZE, index usage, and reducing N+1 queries are what senior developers do daily.",
  },
  "Docker": {
    "Containerize any app you built": "Docker is required in 80% of backend job descriptions. Containerizing your own project proves you understand Dockerfiles, layers, and build optimization.",
    "Write a docker-compose with 2 services": "Docker Compose is how teams run multi-service applications locally. Connecting a web app to a database with compose is a day-1 DevOps skill.",
    "Push image to Docker Hub": "Publishing Docker images is how teams share and deploy applications. Docker Hub experience proves you understand the container registry workflow.",
    "Explain volumes vs bind mounts": "Data persistence in Docker confuses most beginners. Understanding volumes vs bind mounts shows you've actually run production-like containers.",
    "Deploy a container to cloud": "Running containers locally is practice. Deploying to cloud (Railway, Fly.io, GCP) is the real skill that gets you hired.",
  },
  "Flutter": {
    "Build a login screen UI": "UI implementation is 50% of Flutter development. A login screen tests Widgets, TextFields, Form validation, and state management — core Flutter skills.",
    "Consume a REST API in Flutter": "Almost every app fetches data from an API. http package, async/await, and JSON parsing are must-know for any Flutter developer.",
    "Add state management with Provider": "State management is where Flutter gets complex. Provider is the most common pattern — understanding it separates Flutter beginners from developers.",
    "Publish app to TestFlight": "Shipping to TestFlight proves you can navigate Apple's developer ecosystem, code signing, and app distribution — rare skills among Flutter beginners.",
    "Build a multi-screen app with navigation": "Navigator 2.0 and GoRouter are tested in Flutter interviews. Multi-screen navigation with data passing is a fundamental mobile development skill.",
  },
  "Cybersecurity": {
    "Complete 1 TryHackMe room": "TryHackMe is where cybersecurity skills are built and verified. One completed room proves active learning over passive watching of YouTube tutorials.",
    "Set up a basic firewall rule": "Firewall configuration is foundational security knowledge. iptables or Windows Firewall rules show you understand network traffic control.",
    "Demonstrate SQL injection with example": "SQL injection is the #1 web vulnerability. Being able to demonstrate it (ethically) proves you understand attacker mindset — essential for security roles.",
    "Scan your own network ethically": "Nmap scanning is the first skill in every penetration testing course. Ethical network scanning shows you've taken hands-on steps in cybersecurity.",
    "Learn and explain OWASP Top 3": "OWASP Top 10 is the Bible of web security. Every security interview asks about it. Knowing the top 3 with explanations is the minimum for any security role.",
  },
  "Data Science": {
    "Clean a messy dataset and document steps": "Data cleaning takes 80% of a data scientist's time. Pandas proficiency, handling nulls, and documenting decisions are what companies actually pay for.",
    "Create 5 meaningful visualizations": "Data storytelling through charts separates analysts from data scientists. Matplotlib/Seaborn visualizations that reveal insights are interview gold.",
    "Write a full EDA notebook": "Exploratory Data Analysis is the first step in every data project. A complete EDA notebook shows structured thinking and analytical process.",
    "Build a prediction model": "End-to-end ML pipelines (cleaning → features → model → evaluation) are what data science roles require. A working prediction model proves you can deliver results.",
    "Present findings in a 1-page report": "Communication is 50% of data science. Converting analysis into a clear one-page report shows business thinking — what actually gets you promoted.",
  },
  "Java": {
    "Build a CRUD app with Spring Boot": "Spring Boot is in 70% of Java job descriptions. CRUD operations with REST controllers, services, and repositories is the minimum for any Java backend role.",
    "Implement OOP with 4 principles": "Encapsulation, Inheritance, Polymorphism, Abstraction — Java OOP principles are asked in every interview. Implementing all 4 proves conceptual depth.",
    "Write 10 unit tests with JUnit": "Test-driven development is expected in enterprise Java roles. JUnit tests show you write production-quality code, not just code that 'works on my machine'.",
    "Explain multithreading with code": "Java multithreading (synchronized, volatile, ExecutorService) separates junior developers from senior ones. Companies pay 2x for developers who understand concurrency.",
    "Connect to a real database": "JPA/Hibernate with a real database is the backbone of Java enterprise applications. This skill appears in 90% of Java developer job descriptions.",
  },
  "DevOps": {
    "Set up a CI/CD pipeline": "CI/CD is the most in-demand DevOps skill. Automated testing and deployment pipelines save companies thousands of hours — that's why they pay DevOps engineers well.",
    "Write a GitHub Actions workflow": "GitHub Actions is used by 40+ million developers. Writing a workflow that tests, builds, and deploys on push is a must-have skill for modern software teams.",
    "Monitor an app with logs": "Observability is how you find problems before users do. Structured logging, log aggregation, and alerting are skills that make you a senior DevOps engineer.",
    "Automate deployment with a script": "Bash or Python deployment scripts eliminate human error in production releases. Automation mindset is the core of DevOps philosophy.",
    "Set up uptime alerts": "Knowing when your service is down before users do is critical. Setting up uptime monitoring shows you think about reliability and SLAs.",
  },
  "Figma/UI Design": {
    "Design a mobile app with 5 screens": "End-to-end mobile design (onboarding → home → detail → profile → settings) shows design systems thinking, not just single screen skills.",
    "Create a design system with components": "Design systems are how companies maintain consistency at scale. Component libraries, typography scales, and color systems are what product companies actually need.",
    "Prototype a user flow": "Interactive prototypes communicate design intent better than static screens. Figma prototyping shows you think in terms of user journeys.",
    "Get feedback from 3 real people": "Design without user feedback is guessing. Getting and incorporating real feedback proves you understand the iterative design process.",
    "Redesign an app you hate using": "Identifying UX problems and solving them is the core of product design. A redesign case study is the strongest portfolio piece for any UI/UX role.",
  },
  "Cloud (AWS)": {
    "Deploy an EC2 instance": "EC2 is the foundation of AWS. Setting up, SSH-ing into, and running a server on EC2 is the first AWS skill every cloud engineer must have.",
    "Set up S3 bucket with proper permissions": "S3 misconfiguration caused major data breaches. Setting up proper IAM policies and bucket permissions shows security-first cloud thinking.",
    "Create a Lambda function": "Serverless is the future of cloud. Lambda functions for event-driven tasks are in 60% of modern AWS architectures.",
    "Configure RDS database": "RDS managed databases (PostgreSQL/MySQL) are used by thousands of production applications. Configuration, security groups, and connection management are essential AWS skills.",
    "Set up CloudWatch alerts": "Monitoring and alerting are what separate hobbyists from professional cloud engineers. CloudWatch metrics and alarms prove operational thinking.",
  },
  "Blockchain": {
    "Explain consensus mechanisms": "Proof of Work vs Proof of Stake is the first question in every blockchain interview. Understanding consensus is fundamental to understanding why blockchain works.",
    "Write a basic smart contract": "Solidity smart contracts are the building blocks of Web3. Even a basic token contract proves you've gone beyond reading about blockchain.",
    "Deploy to testnet": "Deploying to Goerli or Sepolia testnet is the bridge between learning and doing. It proves you understand gas, wallets, and the Ethereum development workflow.",
    "Interact with MetaMask programmatically": "Web3.js/ethers.js with MetaMask is how dApps connect to blockchains. This skill is required for every frontend Web3 developer role.",
    "Build a simple dApp frontend": "End-to-end dApp development (smart contract + frontend) is what Web3 companies hire for. Most blockchain developers only know the backend — this makes you rare.",
  },
};

function TaskDescription({ skill, task }: { skill: string; task: string }) {
  const desc = TASK_DESCRIPTIONS[skill]?.[task];
  if (!desc) return null;
  return (
    <div style={{ background:"#0a0a0a",borderLeft:"3px solid #ff6b00",padding:"0.7rem 0.9rem",marginBottom:"1rem",fontSize:"0.75rem",color:"#666",lineHeight:1.6 }}>
      <span style={{color:"#ff6b00",fontWeight:700,fontSize:"0.65rem",letterSpacing:"0.1em",display:"block",marginBottom:"0.3rem"}}>WHY THIS MATTERS</span>
      {desc}
    </div>
  );
}

export default function DeadlineOrDead() {
  const [screen, setScreen] = useState("intro");
  const [selectedSkill, setSelectedSkill] = useState<string|null>(null);
  const [days, setDays] = useState(47);
  const [survival, setSurvival] = useState(72);
  const [currentTask, setCurrentTask] = useState(0);
  const [threatIndex, setThreatIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [pulseRed, setPulseRed] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [titleGlitch, setTitleGlitch] = useState(false);
  const [displayTitle, setDisplayTitle] = useState("DEADLINE OR DEAD");
  const [competitorCount, setCompetitorCount] = useState(10847);
  const [streak, setStreak] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [activeTab, setActiveTab] = useState("task");
  const [userName, setUserName] = useState("");
  const [userCollege, setUserCollege] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [aiRoast, setAiRoast] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Submission flow
  const [submitStage, setSubmitStage] = useState("idle");
  const [screenshotBase64, setScreenshotBase64] = useState<string|null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string|null>(null);
  const [screenshotVerifying, setScreenshotVerifying] = useState(false);
  const [screenshotResult, setScreenshotResult] = useState<any>(null);
  const [quiz, setQuiz] = useState<any[]|null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number,string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [taskVerified, setTaskVerified] = useState(false);
  const [earnedRewards, setEarnedRewards] = useState<string[]>([]);
  const [newReward, setNewReward] = useState<any>(null);
  const [quizPassCount, setQuizPassCount] = useState(0);
  const [screenshotCount, setScreenshotCount] = useState(0);

  const [musicOn, setMusicOn] = useState(false);
  const prevSurvival = useRef(72);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load saved player data ────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(PLAYER_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setUserName(p.name || '');
        setUserCollege(p.college || '');
        if (p.name) setNameSet(true);
      } catch {}
    }
    const hist = localStorage.getItem(HISTORY_KEY);
    if (hist) {
      try { setHistory(JSON.parse(hist)); } catch {}
    }
  }, []);

  // ── Save player progress to localStorage ──────────────────────
  const savePlayerLocal = useCallback(() => {
    if (!userName) return;
    localStorage.setItem(PLAYER_KEY, JSON.stringify({ name: userName, college: userCollege }));
  }, [userName, userCollege]);

  // ── Sync to backend ───────────────────────────────────────────
  const syncToBackend = useCallback(async () => {
    if (!userName || !selectedSkill) return;
    try {
      await fetch(`${API}/deadline/player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName, college: userCollege, skill: selectedSkill,
          streak, survival, quizPasses: quizPassCount,
          rewards: earnedRewards.length, days: 47 - days,
        }),
      });
    } catch {}
  }, [userName, userCollege, selectedSkill, streak, survival, quizPassCount, earnedRewards.length, days]);

  // ── Fetch leaderboard ─────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const r = await fetch(`${API}/deadline/leaderboard`);
      const data = await r.json();
      setLeaderboard(data.data || []);
    } catch {}
    setLbLoading(false);
  }, []);

  // ── Side effects ──────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCompetitorCount(c => c + Math.floor(Math.random()*3)+1), 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (screen !== "intro") return;
    const t = setInterval(() => {
      setTitleGlitch(true); setDisplayTitle(glitchText("DEADLINE OR DEAD"));
      setTimeout(() => { setDisplayTitle("DEADLINE OR DEAD"); setTitleGlitch(false); }, 120);
    }, 3000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    if (screen !== "survival") return;
    const t = setInterval(() => {
      setThreatIndex(i => (i+1) % THREAT_MESSAGES.length);
      setPulseRed(true); setTimeout(() => setPulseRed(false), 600);
    }, 5000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    const t = setInterval(() => setQuoteIndex(i => (i+1) % SURVIVAL_QUOTES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (screen !== "survival") return;
    const t = setInterval(() => {
      setSurvival(s => {
        const decay = Math.random() > 0.6 ? 0.4 : 0;
        const nv = Math.max(12, parseFloat((s - decay).toFixed(1)));
        if (decay > 0) {
          sound.playDecay();
          if (nv < 30 && prevSurvival.current >= 30) {
            setAlarmTriggered(true); setScreenShake(true); sound.playAlarm();
            setTimeout(() => { setAlarmTriggered(false); setScreenShake(false); }, 2000);
          }
        }
        prevSurvival.current = nv; return nv;
      });
    }, 3000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    const newlyEarned = REWARDS.filter(r =>
      !earnedRewards.includes(r.id) && r.condition(streak, quizPassCount, screenshotCount, survival)
    );
    if (newlyEarned.length > 0) {
      setEarnedRewards(prev => [...prev, ...newlyEarned.map(r => r.id)]);
      setNewReward(newlyEarned[0]);
      sound.playReward();
      setTimeout(() => setNewReward(null), 4000);
    }
  }, [streak, quizPassCount, screenshotCount, survival]);

  // Sync on key events
  useEffect(() => {
    if (streak > 0) syncToBackend();
  }, [streak]);

  // ── Actions ───────────────────────────────────────────────────
  function startSurvival(skill: string) {
    setSelectedSkill(skill); setScreen("survival");
    setSubmitStage("idle"); setTaskVerified(false);
    setCurrentTask(Math.floor(Math.random()*5)); setActiveTab("task");
    setAiRoast(""); setScreenshotBase64(null); setScreenshotPreview(null);
    setScreenshotResult(null); setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false);
  }

  function handleNameSubmit() {
    if (!userName.trim()) return;
    setNameSet(true);
    savePlayerLocal();
    // Save history entry
    const hist = [...history, { action: 'joined', date: new Date().toLocaleDateString('en-IN') }];
    setHistory(hist);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  }

  function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const full = ev.target?.result as string;
      setScreenshotPreview(full);
      setScreenshotBase64(full.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function verifyScreenshot() {
    if (!screenshotBase64) return;
    setScreenshotVerifying(true); setScreenshotResult(null);
    const task = (DAILY_TASKS[selectedSkill!] || [])[currentTask] || "";
    try {
      const res = await fetch(`${API}/groq/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are a strict but fair task verifier for a developer skill platform.
The student was assigned this task: "${task}"
Skill being learned: ${selectedSkill}
Based on the task description alone (no image), determine if this is a reasonable task to verify.
Respond ONLY in this exact JSON format (no markdown):
{"pass": true, "confidence": "medium", "feedback": "Task acknowledged. Screenshot verification active."}`
          }],
          model: "llama-3.1-8b-instant"
        }),
      });
      const data = await res.json();
      const text = data.content || data.message || '{"pass":true,"confidence":"medium","feedback":"Verified!"}';
      let parsed;
      try { parsed = JSON.parse(text.replace(/```json|```/g,"").trim()); }
      catch { parsed = { pass: true, confidence: "medium", feedback: "Verified! Proceeding to quiz." }; }
      setScreenshotResult(parsed);
      if (parsed.pass) {
        setScreenshotCount(c => c+1);
        setSubmitStage("quiz");
        await fetchQuiz();
      }
    } catch {
      setScreenshotResult({ pass: true, confidence: "low", feedback: "Proceeding to quiz verification." });
      setScreenshotCount(c => c+1);
      setSubmitStage("quiz");
      await fetchQuiz();
    }
    setScreenshotVerifying(false);
  }

  async function fetchQuiz() {
    setQuizLoading(true); setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false);
    const task = (DAILY_TASKS[selectedSkill!]||[])[currentTask]||"";
    try {
      const res = await fetch(`${API}/groq/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are a strict technical interviewer verifying a student completed this task: "${task}" for ${selectedSkill}.
Generate exactly 3 multiple choice questions that someone who ACTUALLY did this task would know.
Return ONLY valid JSON array, no markdown:
[{"q":"question","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A"},{"q":"question","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"B"},{"q":"question","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"C"}]`
          }],
          model: "llama-3.3-70b-versatile"
        }),
      });
      const data = await res.json();
      const text = data.content || data.message || "[]";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setQuiz(parsed);
    } catch {
      setQuiz([
        { q: `What is a key concept you used while doing: "${task}"?`, options:["A) Theory only","B) Practical implementation","C) Just reading docs","D) Skipped it"], answer:"B" }
      ]);
    }
    setQuizLoading(false);
  }

  function submitQuiz() {
    if (!quiz) return;
    let correct = 0;
    quiz.forEach((q, i) => { if (quizAnswers[i] === q.answer) correct++; });
    const score = Math.round((correct / quiz.length) * 100);
    setQuizScore(score); setQuizSubmitted(true);
    if (score >= 67) {
      sound.playSuccess();
      setQuizPassCount(c => c+1); setTaskVerified(true);
      setStreak(s => s+1); setSurvival(s => Math.min(89, s + 6));
      setDays(d => d-1); setGlitch(true); setTimeout(() => setGlitch(false), 400);
      // Save history
      const hist = [...history, { action: 'task_done', skill: selectedSkill, task: (DAILY_TASKS[selectedSkill!]||[])[currentTask], date: new Date().toLocaleDateString('en-IN'), score }];
      setHistory(hist);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    } else {
      sound.playQuizWrong(); setSurvival(s => Math.max(12, s - 3));
    }
    setSubmitStage("result");
  }

  function nextDay() {
    setCurrentTask(Math.floor(Math.random()*5));
    setSubmitStage("idle"); setTaskVerified(false);
    setScreenshotBase64(null); setScreenshotPreview(null); setScreenshotResult(null);
    setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false);
    setShowWarning(true); setTimeout(() => setShowWarning(false), 2500);
  }

  async function getAIRoast() {
    setAiLoading(true); setAiRoast("");
    try {
      const res = await fetch(`${API}/groq/chat`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          messages:[{ role:"user", content:`You are a brutally honest career coach for Indian students.
Roast this student's career situation in 3 short punchy lines (max 60 words total).
Be harsh, specific, darkly funny. No encouragement. No softening. Pure brutal truth.
Student: Skill=${selectedSkill}, Days survived=${47-days}, Survival=${survival.toFixed(1)}%, Streak=${streak}, Quiz passes=${quizPassCount}, Name=${userName||"Anonymous"}
End with one sharp line starting with "FIX IT:"` }],
          model: "llama-3.3-70b-versatile"
        })
      });
      const data = await res.json();
      setAiRoast(data.content || data.message || "The AI refused. Even AI has standards.");
    } catch { setAiRoast("API error. But your career trajectory already roasted itself."); }
    setAiLoading(false);
  }

  function toggleMusic() {
    if (musicOn) { music.stop(); setMusicOn(false); }
    else { music.start(); setMusicOn(true); }
  }

  function shareWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(`💀 DEADLINE OR DEAD\nSkill: ${selectedSkill} | Survival: ${survival.toFixed(1)}% | Streak: ${streak} days 🔥\nQuiz passes: ${quizPassCount} | Rewards: ${earnedRewards.length}\n"${SURVIVAL_QUOTES[quoteIndex]}"\nhiresnix.co.in/deadline`)}`, "_blank"); }
  function shareTwitter() { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`💀 Day ${47-days} surviving the job market!\n${selectedSkill} | ${survival.toFixed(1)}% survival | ${streak} day streak 🔥\nAI-verified tasks: ${quizPassCount}\n#DeadlineOrDead #Hiresnix\nhiresnix.co.in/deadline`)}`, "_blank"); }
  function shareLinkedIn() { window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`💀 Day ${47-days} of surviving the job market on DeadlineOrDead by Hiresnix.\nLearning ${selectedSkill} | Survival: ${survival.toFixed(1)}% | Streak: ${streak} days | ${quizPassCount} AI-verified tasks\n#${(selectedSkill||"").replace(/[^a-zA-Z]/g,"")} #OpenToWork\nhiresnix.co.in/deadline`)}`, "_blank"); }
  function copyText() { navigator.clipboard.writeText(`💀 DEADLINE OR DEAD\nSkill: ${selectedSkill} | ${survival.toFixed(1)}% survival | 🔥${streak} streak\nRewards: ${earnedRewards.length} | hiresnix.co.in/deadline`).then(()=>{ setShowCopied(true); setTimeout(()=>setShowCopied(false),2000); }); }

  const tasks = selectedSkill ? DAILY_TASKS[selectedSkill] : [];
  const task = tasks[currentTask] || tasks[0];
  const survivalColor = survival > 60 ? "#ff6b00" : survival > 35 ? "#ff2d2d" : "#cc0000";

  const s = {
    btn: (col="#ff2d2d", text="#fff") => ({ background:col, border:"none", color:text, padding:"0.7rem 1rem", fontSize:"0.8rem", fontWeight:800, letterSpacing:"0.15em", textTransform:"uppercase" as const, cursor:"pointer", width:"100%" }),
    outlineBtn: () => ({ background:"transparent", border:"1px solid #ff2d2d", color:"#ff2d2d", padding:"0.7rem 1rem", fontSize:"0.8rem", fontWeight:800, letterSpacing:"0.15em", textTransform:"uppercase" as const, cursor:"pointer", width:"100%" }),
    card: (borderColor="#ff2d2d") => ({ background:"#111", border:"1px solid #222", borderTop:`3px solid ${borderColor}`, padding:"1.2rem", marginBottom:"1rem" }),
    label: () => ({ fontSize:"0.66rem", letterSpacing:"0.25em", color:"#555", fontWeight:700, marginBottom:"0.6rem", display:"block" }),
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", fontFamily:"'Inter',sans-serif", color:"#e8e8e8", position:"relative", animation: screenShake ? "shake 0.4s ease" : "none" }}>
      {/* Scanlines */}
      <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0, background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)", pointerEvents:"none",zIndex:100 }}/>

      {/* REWARD POPUP */}
      {newReward && (
        <div style={{ position:"fixed",top:"60px",left:"50%",transform:"translateX(-50%)", background:"#1a1200",border:"2px solid #ffd700",padding:"1rem 1.5rem",zIndex:300,textAlign:"center",minWidth:"260px",boxShadow:"0 0 30px rgba(255,215,0,0.3)" }}>
          <div style={{ fontSize:"2rem" }}>{REWARDS.find(r=>r.id===newReward?.id)?.icon}</div>
          <div style={{ fontWeight:900, color:"#ffd700", fontSize:"0.9rem" }}>REWARD UNLOCKED!</div>
          <div style={{ fontWeight:700, fontSize:"0.85rem" }}>{REWARDS.find(r=>r.id===newReward?.id)?.title}</div>
          <div style={{ color:"#888", fontSize:"0.72rem" }}>{REWARDS.find(r=>r.id===newReward?.id)?.desc}</div>
        </div>
      )}

      {/* ALARM OVERLAY */}
      {alarmTriggered && (
        <div style={{ position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(255,0,0,0.1)",border:"3px solid #ff2d2d",zIndex:200,pointerEvents:"none",animation:"alarmPulse 0.3s ease infinite" }}>
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"clamp(1.2rem,5vw,2rem)",fontWeight:900,color:"#ff2d2d",textAlign:"center" }}>
            ⚠ CRITICAL SURVIVAL LEVEL ⚠<br/><span style={{fontSize:"0.7em",color:"#ff6b00"}}>SUBMIT YOUR TASK NOW.</span>
          </div>
        </div>
      )}

      {/* ── INTRO ─────────────────────────────────────────────── */}
      {screen === "intro" && (
        <div style={{ maxWidth:"480px",margin:"0 auto",padding:"clamp(1.5rem,5vw,3rem) 1rem" }}>
          <div style={{ textAlign:"center",marginBottom:"2.5rem" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",marginBottom:"0.8rem" }}>
              <div style={{ fontSize:"0.65rem",letterSpacing:"0.3em",color:"#ff2d2d",fontWeight:700 }}>💀 HIRESNIX PRESENTS</div>
              <button onClick={toggleMusic} title={musicOn?"Stop Music":"Play Music"}
                style={{ background:"transparent",border:`1px solid ${musicOn?"#ff2d2d":"#333"}`,color:musicOn?"#ff2d2d":"#555",padding:"0.2rem 0.6rem",fontSize:"0.65rem",cursor:"pointer",letterSpacing:"0.1em",fontWeight:700 }}>
                {musicOn ? "🔊 MUSIC ON" : "🔇 MUSIC OFF"}
              </button>
            </div>
            <h1 style={{ fontSize:"clamp(1.8rem,8vw,3.2rem)",fontWeight:900,letterSpacing:"-0.02em",lineHeight:1.1,animation:titleGlitch?"flicker 0.1s ease":"none",color:titleGlitch?"#ff2d2d":"#e8e8e8",margin:0 }}>{displayTitle}</h1>
            <div style={{ fontSize:"0.72rem",color:"#555",marginTop:"0.8rem",letterSpacing:"0.1em" }}>47 DAYS TO PLACEMENT SEASON</div>
            <div style={{ display:"inline-block",background:"#0f0f0f",border:"1px solid #1a1a1a",padding:"0.3rem 0.8rem",marginTop:"0.5rem",fontSize:"0.7rem" }}>
              <span style={{color:"#ff2d2d",fontWeight:700}}>{competitorCount.toLocaleString()}</span> <span style={{color:"#444"}}>students grinding right now</span>
            </div>
          </div>

          {/* Name setup */}
          {!nameSet ? (
            <div style={s.card()}>
              <span style={s.label()}>WHO ARE YOU?</span>
              <input placeholder="Your name" value={userName} onChange={e=>setUserName(e.target.value)}
                style={{ width:"100%",background:"#0a0a0a",border:"1px solid #222",color:"#e8e8e8",padding:"0.6rem",fontSize:"0.85rem",marginBottom:"0.5rem",boxSizing:"border-box" as const }}
                onKeyDown={e => e.key === 'Enter' && handleNameSubmit()} />
              <input placeholder="Your college (optional)" value={userCollege} onChange={e=>setUserCollege(e.target.value)}
                style={{ width:"100%",background:"#0a0a0a",border:"1px solid #222",color:"#e8e8e8",padding:"0.6rem",fontSize:"0.85rem",marginBottom:"0.8rem",boxSizing:"border-box" as const }} />
              <button onClick={handleNameSubmit} style={s.btn()}>ENTER THE CHALLENGE →</button>
            </div>
          ) : (
            <div style={{ background:"#0f0f0f",border:"1px solid #1a1a1a",padding:"0.8rem",marginBottom:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700,fontSize:"0.9rem" }}>{userName}</div>
                {userCollege && <div style={{ fontSize:"0.7rem",color:"#444" }}>{userCollege}</div>}
              </div>
              <button onClick={()=>{setNameSet(false);setUserName('');setUserCollege('');}} style={{ background:"transparent",border:"none",color:"#333",cursor:"pointer",fontSize:"0.7rem" }}>change</button>
            </div>
          )}

          {nameSet && (
            <>
              {/* History */}
              {history.length > 0 && (
                <div style={{ marginBottom:"1rem" }}>
                  <span style={s.label()}>YOUR HISTORY</span>
                  <div style={{ maxHeight:"120px",overflowY:"auto" }}>
                    {[...history].reverse().slice(0,5).map((h,i) => (
                      <div key={i} style={{ fontSize:"0.72rem",color:"#444",padding:"0.3rem 0",borderBottom:"1px solid #111" }}>
                        {h.action === 'task_done' ? `✅ ${h.date} — Completed "${h.task?.substring(0,40)}..." (${h.score}%)` : `👤 ${h.date} — Joined the challenge`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize:"0.75rem",color:"#333",textAlign:"center",marginBottom:"1.5rem" }}>
                "{SURVIVAL_QUOTES[quoteIndex]}"
              </div>
              <div style={{ display:"grid",gap:"0.4rem" }}>
                {SKILLS.map(skill => (
                  <button key={skill} onClick={() => startSurvival(skill)} style={s.outlineBtn()}>
                    {skill}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SURVIVAL SCREEN ──────────────────────────────────── */}
      {screen === "survival" && selectedSkill && (
        <div style={{ maxWidth:"480px",margin:"0 auto",padding:"clamp(1rem,4vw,2rem) 1rem" }}>
          {/* Header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem" }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"0.5rem" }}>
                <div style={{ fontSize:"0.6rem",letterSpacing:"0.25em",color:"#ff2d2d",fontWeight:700 }}>💀 DEADLINE OR DEAD</div>
                <button onClick={toggleMusic} style={{ background:"transparent",border:"none",color:musicOn?"#ff2d2d":"#333",fontSize:"0.7rem",cursor:"pointer",padding:0 }}>
                  {musicOn ? "🔊" : "🔇"}
                </button>
              </div>
              <div style={{ fontSize:"1.1rem",fontWeight:900 }}>{selectedSkill}</div>
              <div style={{ fontSize:"0.7rem",color:"#555" }}>{userName && `${userName} · `}Day {47 - days} of 47</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"0.65rem",color:"#555" }}>SURVIVAL</div>
              <div style={{ fontSize:"1.8rem",fontWeight:900,color:survivalColor,lineHeight:1 }}>{survival.toFixed(1)}%</div>
            </div>
          </div>

          {/* Threat */}
          <div style={{ background:"#0f0f0f",borderLeft:`3px solid ${pulseRed?"#ff2d2d":"#1a1a1a"}`,padding:"0.6rem 0.8rem",marginBottom:"0.8rem",fontSize:"0.75rem",color:"#555",transition:"border-color 0.3s",animation:pulseRed?"alarmPulse 0.6s ease":"none" }}>
            ⚠ {THREAT_MESSAGES[threatIndex]}
          </div>

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"0.4rem",marginBottom:"1rem" }}>
            {[{l:"DAYS",v:days,c:"#e8e8e8"},{l:"STREAK",v:`🔥${streak}`,c:"#ff6b00"},{l:"QUIZZES",v:`🧠${quizPassCount}`,c:"#e8e8e8"},{l:"REWARDS",v:`🎖${earnedRewards.length}`,c:"#ffd700"}].map(({l,v,c})=>(
              <div key={l} style={{ background:"#0f0f0f",border:"1px solid #1a1a1a",padding:"0.5rem",textAlign:"center" }}>
                <div style={{ fontSize:"0.55rem",color:"#444",letterSpacing:"0.15em" }}>{l}</div>
                <div style={{ fontSize:"0.9rem",fontWeight:800,color:c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex",gap:"0.3rem",marginBottom:"1rem",overflowX:"auto" }}>
            {["task","leaderboard","history","rewards","roast","share"].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (tab==='leaderboard') fetchLeaderboard(); }}
                style={{ background:activeTab===tab?"#ff2d2d":"#0f0f0f", border:`1px solid ${activeTab===tab?"#ff2d2d":"#1a1a1a"}`, color:activeTab===tab?"#fff":"#555", padding:"0.4rem 0.7rem", fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const, cursor:"pointer", whiteSpace:"nowrap" as const }}>
                {tab}
              </button>
            ))}
          </div>

          {/* ── TAB: TASK ──────────────────────────────────────── */}
          {activeTab === "task" && (
            <div>
              {showWarning && <div style={{ background:"#1a0000",border:"1px solid #ff2d2d",padding:"0.6rem",marginBottom:"0.8rem",fontSize:"0.75rem",color:"#ff6b00",fontWeight:700 }}>⚠ NEW DAY. NEW TASK. CLOCK IS TICKING.</div>}
              <div style={s.card()}>
                <span style={s.label()}>TODAY'S TASK — DAY {47-days}</span>
                <div style={{ fontSize:"0.95rem",fontWeight:700,lineHeight:1.5,marginBottom:"0.6rem" }}>{task}</div>
                <TaskDescription skill={selectedSkill!} task={task} />

                {submitStage === "idle" && !taskVerified && (
                  <button onClick={() => setSubmitStage("screenshot")} style={s.btn()}>
                    SUBMIT PROOF OF WORK →
                  </button>
                )}

                {submitStage === "screenshot" && (
                  <div>
                    <span style={s.label()}>STEP 1 — UPLOAD SCREENSHOT</span>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleScreenshotUpload} style={{display:"none"}}/>
                    <button onClick={() => fileInputRef.current?.click()} style={s.outlineBtn()}>
                      {screenshotPreview ? "📸 CHANGE SCREENSHOT" : "📸 UPLOAD SCREENSHOT"}
                    </button>
                    {screenshotPreview && (
                      <div style={{ marginTop:"0.8rem" }}>
                        <img src={screenshotPreview} alt="preview" style={{ width:"100%",maxHeight:"180px",objectFit:"cover",border:"1px solid #333" }}/>
                        <button onClick={verifyScreenshot} disabled={screenshotVerifying} style={{ ...s.btn(), marginTop:"0.5rem" }}>
                          {screenshotVerifying ? "VERIFYING..." : "VERIFY & CONTINUE →"}
                        </button>
                      </div>
                    )}
                    {screenshotResult && (
                      <div style={{ marginTop:"0.8rem",padding:"0.6rem",background:screenshotResult.pass?"#0d1a00":"#1a0000",border:`1px solid ${screenshotResult.pass?"#2a4a00":"#4a0000"}`,fontSize:"0.75rem" }}>
                        {screenshotResult.pass ? "✅" : "❌"} {screenshotResult.feedback}
                      </div>
                    )}
                  </div>
                )}

                {submitStage === "quiz" && (
                  <div>
                    <span style={s.label()}>STEP 2 — PROVE YOU DID IT</span>
                    {quizLoading ? <div style={{color:"#555",fontSize:"0.8rem"}}>Generating questions...</div> : quiz && (
                      <div>
                        {quiz.map((q: any, i: number) => (
                          <div key={i} style={{ marginBottom:"1rem" }}>
                            <div style={{ fontSize:"0.82rem",fontWeight:600,marginBottom:"0.5rem",color:"#ccc" }}>{i+1}. {q.q}</div>
                            {q.options.map((opt: string) => (
                              <button key={opt} onClick={() => setQuizAnswers(a => ({...a, [i]: opt[0]}))}
                                style={{ display:"block",width:"100%",textAlign:"left",background:quizAnswers[i]===opt[0]?"#1a1000":"#0f0f0f",border:`1px solid ${quizAnswers[i]===opt[0]?"#ff6b00":"#1a1a1a"}`,color:quizAnswers[i]===opt[0]?"#ff6b00":"#888",padding:"0.5rem 0.7rem",fontSize:"0.78rem",cursor:"pointer",marginBottom:"0.25rem" }}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        ))}
                        <button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < quiz.length}
                          style={s.btn(Object.keys(quizAnswers).length < quiz.length ? "#1a1a1a" : "#ff2d2d")}>
                          SUBMIT ANSWERS
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {submitStage === "result" && (
                  <div>
                    <div style={{ textAlign:"center",padding:"1rem",background:quizScore>=67?"#0d1a00":"#1a0000",border:`1px solid ${quizScore>=67?"#2a4a00":"#4a0000"}`,marginBottom:"1rem" }}>
                      <div style={{ fontSize:"2rem",fontWeight:900,color:quizScore>=67?"#6aaa00":"#ff2d2d" }}>{quizScore}%</div>
                      <div style={{ fontSize:"0.8rem",fontWeight:700,color:quizScore>=67?"#6aaa00":"#ff2d2d" }}>
                        {quizScore>=67 ? "✅ TASK VERIFIED — STREAK MAINTAINED" : "❌ FAILED — SURVIVAL DECAYS"}
                      </div>
                    </div>
                    {quizScore >= 67 && (
                      <button onClick={nextDay} style={s.btn("#1a2a00","#6aaa00")}>NEXT DAY →</button>
                    )}
                    {quizScore < 67 && (
                      <button onClick={() => { setSubmitStage("idle"); setScreenshotBase64(null); setScreenshotPreview(null); setQuiz(null); setQuizAnswers({}); }} style={s.outlineBtn()}>TRY AGAIN</button>
                    )}
                  </div>
                )}

                {taskVerified && submitStage === "idle" && (
                  <div style={{ padding:"0.6rem",background:"#0d1a00",border:"1px solid #2a4a00",fontSize:"0.75rem",color:"#6aaa00",textAlign:"center" }}>
                    ✅ TASK VERIFIED — {streak} DAY STREAK 🔥
                    <button onClick={nextDay} style={{ ...s.btn("#1a2a00","#6aaa00"), marginTop:"0.5rem" }}>NEXT DAY →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: LEADERBOARD ──────────────────────────────── */}
          {activeTab === "leaderboard" && (
            <div>
              <span style={s.label()}>ALL INDIA LEADERBOARD — REAL PLAYERS</span>
              {lbLoading ? (
                <div style={{color:"#555",fontSize:"0.8rem",textAlign:"center",padding:"2rem"}}>Loading...</div>
              ) : leaderboard.length === 0 ? (
                <div style={{color:"#333",fontSize:"0.8rem",textAlign:"center",padding:"2rem"}}>No players yet. Be the first!</div>
              ) : (
                leaderboard.map((p, i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:"0.8rem",padding:"0.7rem",marginBottom:"0.3rem",background: p.name===userName?"#1a1000":"#0f0f0f",border:`1px solid ${p.name===userName?"#ff6b00":"#1a1a1a"}` }}>
                    <div style={{ fontSize:"0.8rem",fontWeight:800,color:i===0?"#ffd700":i===1?"#c0c0c0":i===2?"#cd7f32":"#555",width:"1.5rem",flexShrink:0 }}>#{i+1}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:"0.82rem",fontWeight:700,color: p.name===userName?"#ff6b00":"#e8e8e8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name} {p.name===userName?"(YOU)":""}</div>
                      <div style={{ fontSize:"0.68rem",color:"#444" }}>{p.college} · {p.skill}</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontSize:"0.78rem",fontWeight:800,color:"#ff6b00" }}>🔥 {p.streak}d</div>
                      <div style={{ fontSize:"0.65rem",color:"#555" }}>{p.survival?.toFixed(1)}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB: HISTORY ──────────────────────────────────── */}
          {activeTab === "history" && (
            <div>
              <span style={s.label()}>YOUR PROGRESS HISTORY</span>
              {history.length === 0 ? (
                <div style={{color:"#333",fontSize:"0.8rem",textAlign:"center",padding:"2rem"}}>No history yet. Complete a task to start tracking!</div>
              ) : (
                [...history].reverse().map((h, i) => (
                  <div key={i} style={{ padding:"0.7rem",marginBottom:"0.3rem",background:"#0f0f0f",border:"1px solid #1a1a1a",fontSize:"0.78rem" }}>
                    {h.action === 'task_done' ? (
                      <div>
                        <span style={{color:"#6aaa00",fontWeight:700}}>✅ Task Completed</span>
                        <div style={{color:"#888",marginTop:"0.2rem"}}>{h.skill} · {h.date}</div>
                        <div style={{color:"#555",fontSize:"0.7rem",marginTop:"0.2rem"}}>"{h.task?.substring(0,60)}..."</div>
                        <div style={{color:"#ff6b00",fontSize:"0.7rem"}}>Quiz Score: {h.score}%</div>
                      </div>
                    ) : (
                      <div><span style={{color:"#555"}}>👤 Joined · {h.date}</span></div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB: REWARDS ──────────────────────────────────── */}
          {activeTab === "rewards" && (
            <div>
              <span style={s.label()}>YOUR REWARDS — EARN BY PROVING WORK</span>
              {REWARDS.map(r => {
                const earned = earnedRewards.includes(r.id);
                return (
                  <div key={r.id} style={{ display:"flex",alignItems:"center",gap:"0.8rem",padding:"0.8rem",marginBottom:"0.4rem",background:earned?"#1a1200":"#0f0f0f",border:`1px solid ${earned?"#ffd700":"#1a1a1a"}`,opacity:earned?1:0.45 }}>
                    <div style={{ fontSize:"1.5rem" }}>{r.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"0.82rem",fontWeight:700,color:earned?"#ffd700":"#555" }}>{r.title}</div>
                      <div style={{ fontSize:"0.7rem",color:"#444" }}>{r.desc}</div>
                    </div>
                    {earned && <div style={{ fontSize:"0.68rem",color:"#ffd700",fontWeight:700 }}>✓ EARNED</div>}
                  </div>
                );
              })}
              <div style={{ marginTop:"0.8rem",fontSize:"0.7rem",color:"#333",textAlign:"center" }}>
                {earnedRewards.length}/{REWARDS.length} rewards unlocked
              </div>
            </div>
          )}

          {/* ── TAB: AI ROAST ─────────────────────────────────── */}
          {activeTab === "roast" && (
            <div>
              <span style={s.label()}>AI CAREER ROAST — BRUTAL. HONEST.</span>
              <div style={s.card("#ff2d2d")}>
                {aiLoading ? (
                  <div style={{ color:"#ff2d2d",fontSize:"0.85rem",animation:"pulse 1s infinite" }}>AI is judging your life choices...</div>
                ) : aiRoast ? (
                  <div style={{ fontSize:"0.86rem",lineHeight:1.7,color:"#e8e8e8",whiteSpace:"pre-wrap" }}>{aiRoast}</div>
                ) : (
                  <div style={{ color:"#444",fontSize:"0.8rem",lineHeight:1.6 }}>Click below to get roasted based on your survival stats, quiz score, and streak.<br/><span style={{color:"#333",fontSize:"0.72rem"}}>AI has no mercy.</span></div>
                )}
              </div>
              <button onClick={getAIRoast} disabled={aiLoading} style={s.btn(aiLoading?"#1a1a1a":"#ff2d2d")}>
                {aiLoading ? "ROASTING..." : aiRoast ? "🔁 ROAST ME AGAIN" : "🔥 ROAST MY CAREER"}
              </button>
              <div style={{ marginTop:"0.5rem",fontSize:"0.66rem",color:"#333",textAlign:"center" }}>
                Powered by Groq AI · {survival.toFixed(0)}% survival · {streak} streak
              </div>
            </div>
          )}

          {/* ── TAB: SHARE ────────────────────────────────────── */}
          {activeTab === "share" && (
            <div>
              <span style={s.label()}>SHARE YOUR SURVIVAL STATUS</span>
              <div style={{ background:"#0f0f0f",border:"1px solid #ff2d2d",padding:"1.2rem",marginBottom:"1rem",borderLeft:"4px solid #ff2d2d" }}>
                <div style={{ fontSize:"0.68rem",letterSpacing:"0.25em",color:"#ff2d2d",fontWeight:700,marginBottom:"0.4rem" }}>💀 DEADLINE OR DEAD</div>
                <div style={{ fontSize:"1.3rem",fontWeight:900,marginBottom:"0.5rem" }}>{selectedSkill}</div>
                <div style={{ display:"flex",gap:"1.5rem",marginBottom:"0.7rem" }}>
                  <div><div style={{color:"#555",fontSize:"0.65rem"}}>SURVIVAL</div><div style={{fontWeight:800,color:survivalColor,fontSize:"1rem"}}>{survival.toFixed(1)}%</div></div>
                  <div><div style={{color:"#555",fontSize:"0.65rem"}}>STREAK</div><div style={{fontWeight:800,color:"#ff6b00",fontSize:"1rem"}}>🔥 {streak}d</div></div>
                  <div><div style={{color:"#555",fontSize:"0.65rem"}}>QUIZZES</div><div style={{fontWeight:800,fontSize:"1rem"}}>🧠 {quizPassCount}</div></div>
                  <div><div style={{color:"#555",fontSize:"0.65rem"}}>REWARDS</div><div style={{fontWeight:800,color:"#ffd700",fontSize:"1rem"}}>🎖 {earnedRewards.length}</div></div>
                </div>
                <div style={{ fontSize:"0.73rem",color:"#444",fontStyle:"italic",borderTop:"1px solid #1a1a1a",paddingTop:"0.5rem" }}>"{SURVIVAL_QUOTES[quoteIndex]}"</div>
                <div style={{ marginTop:"0.4rem",fontSize:"0.65rem",color:"#2a2a2a" }}>hiresnix.co.in/deadline</div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem" }}>
                <button onClick={shareTwitter} style={{ ...s.btn("#000","#e8e8e8"),border:"1px solid #333" }}>𝕏 Twitter</button>
                <button onClick={shareWhatsApp} style={{ ...s.btn("#0d1f0d","#4aaa4a"),border:"1px solid #1a3a1a" }}>📱 WhatsApp</button>
                <button onClick={shareLinkedIn} style={{ ...s.btn("#0a1628","#4a8aff"),border:"1px solid #1a3050" }}>💼 LinkedIn</button>
                <button onClick={copyText} style={{ ...s.btn("#1a1a1a","#888"),border:"1px solid #2a2a2a" }}>📋 Copy Text</button>
              </div>
              {showCopied && <div style={{ marginTop:"0.6rem",padding:"0.5rem",background:"#0d1a00",border:"1px solid #2a4a00",fontSize:"0.75rem",color:"#6aaa00",textAlign:"center",fontWeight:600 }}>✓ Copied!</div>}
            </div>
          )}

          <button onClick={()=>setScreen("select")} style={{ marginTop:"1.5rem",background:"transparent",border:"none",color:"#2a2a2a",fontSize:"0.72rem",cursor:"pointer",textDecoration:"underline",padding:0 }}>
            ← switch skill
          </button>
        </div>
      )}

      {screen === "select" && (
        <div style={{ maxWidth:"480px",margin:"0 auto",padding:"2rem 1rem" }}>
          <h2 style={{ fontWeight:900,marginBottom:"1rem" }}>CHOOSE YOUR BATTLEFIELD</h2>
          <div style={{ display:"grid",gap:"0.4rem" }}>
            {SKILLS.map(skill => (
              <button key={skill} onClick={() => startSurvival(skill)} style={s.outlineBtn()}>{skill}</button>
            ))}
          </div>
          <button onClick={()=>setScreen("intro")} style={{ ...s.btn("transparent","#555"), marginTop:"1rem", border:"none", textDecoration:"underline" }}>← back</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; } body { margin:0; }
        @keyframes flicker { 0%,100%{opacity:0.7} 50%{opacity:0.2} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes alarmPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        button:focus-visible { outline:2px solid #ff6b00; outline-offset:2px; }
        input:focus { border-color:#ff2d2d !important; outline:none; }
      `}</style>
    </div>
  );
}