// src/pages/instStudent/AcademyPage.tsx
// Hiresnix AI Academy — Clean Edition v3
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, CheckCircle, ArrowLeft, Send,
  Mic, MicOff, Volume2, VolumeX, Loader2, RefreshCw,
  FileText, Zap, ArrowLeftRight, Terminal, Sparkles,
  Trophy, Flame, Star, Play, Lock, Award, Download
} from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { useInstStudentStore } from '../../store/useInstStudentStore';

const GROQ = (import.meta as any).env.VITE_GROQ_API_KEY || '';

// ── YouTube Video IDs (freeCodeCamp & trusted channels) ──────────
const YT: Record<string,string> = {
  // PYTHON - freeCodeCamp full course chapters
  "What is Python?":"rfscVS0vtbw","Setting Up Python":"rfscVS0vtbw","Your First Program":"rfscVS0vtbw",
  "Variables & Data Types":"rfscVS0vtbw","Type Conversion":"rfscVS0vtbw","Arithmetic Operators":"rfscVS0vtbw",
  "Comparison Operators":"rfscVS0vtbw","Logical Operators":"rfscVS0vtbw","If-Else Statements":"rfscVS0vtbw",
  "For Loops":"rfscVS0vtbw","While Loops":"rfscVS0vtbw","Break & Continue":"rfscVS0vtbw",
  "Functions":"rfscVS0vtbw","Parameters & Return":"rfscVS0vtbw","Lambda Functions":"rfscVS0vtbw",
  "Recursion":"rfscVS0vtbw","Decorators":"rfscVS0vtbw","Lists":"rfscVS0vtbw","Tuples":"rfscVS0vtbw",
  "Dictionaries":"rfscVS0vtbw","Sets":"rfscVS0vtbw","List Comprehensions":"rfscVS0vtbw",
  "String Methods":"rfscVS0vtbw","File Handling":"rfscVS0vtbw","Exception Handling":"rfscVS0vtbw",
  "Classes & Objects":"rfscVS0vtbw","Inheritance":"rfscVS0vtbw","Encapsulation":"rfscVS0vtbw",
  "Polymorphism":"rfscVS0vtbw","Modules & Packages":"rfscVS0vtbw","pip & Libraries":"rfscVS0vtbw",
  "Generators":"rfscVS0vtbw","Regular Expressions":"rfscVS0vtbw",
  "Build a Calculator":"rfscVS0vtbw","Build a To-Do App":"rfscVS0vtbw","Build a Quiz Game":"rfscVS0vtbw",
  "Build a Web Scraper":"rfscVS0vtbw","Final Python Project":"rfscVS0vtbw",

  // JAVASCRIPT - freeCodeCamp
  "What is JavaScript?":"PkZNo7MFNFg","Variables (let/const/var)":"PkZNo7MFNFg","JS Data Types":"PkZNo7MFNFg",
  "Template Literals":"PkZNo7MFNFg","JS Functions":"PkZNo7MFNFg","Arrow Functions":"PkZNo7MFNFg",
  "Arrays":"PkZNo7MFNFg","Objects":"PkZNo7MFNFg","Destructuring":"PkZNo7MFNFg",
  "Spread & Rest":"PkZNo7MFNFg","DOM Manipulation":"PkZNo7MFNFg","Event Listeners":"PkZNo7MFNFg",
  "Fetch API":"PkZNo7MFNFg","Promises":"PkZNo7MFNFg","Async Await":"PkZNo7MFNFg",
  "Error Handling":"PkZNo7MFNFg","ES6+ Features":"PkZNo7MFNFg","Local Storage":"PkZNo7MFNFg",
  "Build a Todo App (JS)":"PkZNo7MFNFg","Build a Weather App":"PkZNo7MFNFg","Final JS Project":"PkZNo7MFNFg",

  // JAVA - freeCodeCamp
  "What is Java?":"grEKMHGYyns","Java Setup & Hello World":"grEKMHGYyns","Java Variables":"grEKMHGYyns",
  "Java Data Types":"grEKMHGYyns","Java Operators":"grEKMHGYyns","Java If-Else":"grEKMHGYyns",
  "Java Loops":"grEKMHGYyns","Java Arrays":"grEKMHGYyns","Java Methods":"grEKMHGYyns",
  "Java OOP - Classes":"grEKMHGYyns","Java Inheritance":"grEKMHGYyns","Java Polymorphism":"grEKMHGYyns",
  "Java Interfaces":"grEKMHGYyns","Java Exception Handling":"grEKMHGYyns","Java Collections":"grEKMHGYyns",
  "Java Generics":"grEKMHGYyns","Java File I/O":"grEKMHGYyns","Java Threads":"grEKMHGYyns",
  "Java Streams":"grEKMHGYyns","Java Lambda":"grEKMHGYyns",
  "Build a Bank App":"grEKMHGYyns","Build a Student DB":"grEKMHGYyns","Final Java Project":"grEKMHGYyns",

  // C++ - freeCodeCamp
  "What is C++?":"8jLOx1hD3_o","C++ Setup":"8jLOx1hD3_o","C++ Variables":"8jLOx1hD3_o",
  "C++ Data Types":"8jLOx1hD3_o","C++ Operators":"8jLOx1hD3_o","C++ If-Else":"8jLOx1hD3_o",
  "C++ Loops":"8jLOx1hD3_o","C++ Arrays":"8jLOx1hD3_o","C++ Functions":"8jLOx1hD3_o",
  "C++ Pointers":"8jLOx1hD3_o","C++ References":"8jLOx1hD3_o","C++ OOP":"8jLOx1hD3_o",
  "C++ Inheritance":"8jLOx1hD3_o","C++ Polymorphism":"8jLOx1hD3_o","C++ STL":"8jLOx1hD3_o",
  "C++ File Handling":"8jLOx1hD3_o",
  "Build a Calculator (C++)":"8jLOx1hD3_o","Final C++ Project":"8jLOx1hD3_o",

  // DSA - freeCodeCamp
  "Arrays & Big O":"pkYVOmU3MgA","Two Pointers":"pkYVOmU3MgA","Sliding Window":"pkYVOmU3MgA",
  "Prefix Sum":"pkYVOmU3MgA","Strings":"pkYVOmU3MgA","Linked List":"pkYVOmU3MgA",
  "Stack":"pkYVOmU3MgA","Queue":"pkYVOmU3MgA","Binary Tree":"pkYVOmU3MgA","BST":"pkYVOmU3MgA",
  "Heap":"pkYVOmU3MgA","Graphs":"pkYVOmU3MgA","Bubble Sort":"pkYVOmU3MgA","Merge Sort":"pkYVOmU3MgA",
  "Quick Sort":"pkYVOmU3MgA","Binary Search":"pkYVOmU3MgA","Dynamic Programming":"pkYVOmU3MgA",
  "Greedy Algorithms":"pkYVOmU3MgA","Backtracking":"pkYVOmU3MgA",

  // SQL - freeCodeCamp
  "What is SQL?":"HXV3zeQKqGY","SELECT & FROM":"HXV3zeQKqGY","WHERE & AND/OR":"HXV3zeQKqGY",
  "ORDER BY & LIMIT":"HXV3zeQKqGY","INSERT UPDATE DELETE":"HXV3zeQKqGY","JOINS":"HXV3zeQKqGY",
  "GROUP BY & HAVING":"HXV3zeQKqGY","Subqueries":"HXV3zeQKqGY","Window Functions":"HXV3zeQKqGY",
  "Indexes":"HXV3zeQKqGY","Views & CTEs":"HXV3zeQKqGY","Transactions":"HXV3zeQKqGY",
  "Stored Procedures":"HXV3zeQKqGY","SQL Project":"HXV3zeQKqGY",

  // WEB DEV - freeCodeCamp
  "HTML Basics":"mU6anWqZJcc","HTML Forms":"mU6anWqZJcc","Semantic HTML":"mU6anWqZJcc",
  "CSS Basics":"OXGznpKZ_sA","Box Model":"OXGznpKZ_sA","Flexbox":"OXGznpKZ_sA",
  "CSS Grid":"OXGznpKZ_sA","Responsive Design":"OXGznpKZ_sA","JavaScript for Web":"PkZNo7MFNFg",
  "DOM & Events":"PkZNo7MFNFg","What is React?":"bMknfKXIFA8","React Components":"bMknfKXIFA8",
  "React Props & State":"bMknfKXIFA8","React Hooks":"bMknfKXIFA8","React Router":"bMknfKXIFA8",
  "API Integration":"bMknfKXIFA8","Node.js Basics":"Oe421EPjeBE","Express.js":"Oe421EPjeBE",
  "MongoDB Basics":"ofme2o29wY8","Build Full Stack App":"nu_pCVPKzTk","Deploy Your App":"nu_pCVPKzTk",

  // GIT
  "What is Git?":"RGOj5yH7evk","Git Installation":"RGOj5yH7evk","Git Branches":"RGOj5yH7evk",

  // DOCKER
  "What is Docker?":"fqMOX6JJhGo","Docker Containers":"fqMOX6JJhGo",

  // ML / DS
  "What is Machine Learning?":"i_LwzRVP7bg","What is Data Science?":"i_LwzRVP7bg",
  "What is NumPy?":"QUT1VHiLrmI","What is Pandas?":"vmEHCKcdykY",
};
function getYT(l: string) { return YT[l] || 'dQw4w9WgXcQ'; }

// ── Courses ───────────────────────────────────────────────────────
const COURSES = [
  { id:'python', title:'Python Programming', icon:'🐍', accent:'#6366f1', codeLanguage:'python', tag:'Most Popular', tagColor:'#f59e0b', desc:'Zero to real Python projects', modules:[
    { title:'Getting Started', lessons:['What is Python?','Setting Up Python','Your First Program','Variables & Data Types','Type Conversion'] },
    { title:'Operators & Control Flow', lessons:['Arithmetic Operators','Comparison Operators','Logical Operators','If-Else Statements','For Loops','While Loops','Break & Continue'] },
    { title:'Functions', lessons:['Functions','Parameters & Return','Lambda Functions','Recursion','Decorators'] },
    { title:'Data Structures', lessons:['Lists','Tuples','Dictionaries','Sets','List Comprehensions','String Methods'] },
    { title:'File & Error Handling', lessons:['File Handling','Exception Handling','Modules & Packages','pip & Libraries'] },
    { title:'OOP', lessons:['Classes & Objects','Inheritance','Encapsulation','Polymorphism','Generators'] },
    { title:'Advanced', lessons:['Regular Expressions'] },
    { title:'Projects', lessons:['Build a Calculator','Build a To-Do App','Build a Quiz Game','Build a Web Scraper','Final Python Project'] },
  ]},
  { id:'javascript', title:'JavaScript', icon:'⚡', accent:'#f59e0b', codeLanguage:'javascript', tag:'Web Dev', tagColor:'#10b981', desc:'Basics to modern ES6+', modules:[
    { title:'Basics', lessons:['What is JavaScript?','Variables (let/const/var)','JS Data Types','Template Literals','JS Functions','Arrow Functions'] },
    { title:'Data', lessons:['Arrays','Objects','Destructuring','Spread & Rest','Error Handling'] },
    { title:'Browser', lessons:['DOM Manipulation','Event Listeners','Local Storage'] },
    { title:'Async', lessons:['Fetch API','Promises','Async Await'] },
    { title:'Projects', lessons:['Build a Todo App (JS)','Build a Weather App','Final JS Project'] },
  ]},
  { id:'java', title:'Java', icon:'☕', accent:'#ef4444', codeLanguage:'java', tag:'Industry', tagColor:'#6366f1', desc:'Core Java to advanced OOP', modules:[
    { title:'Basics', lessons:['What is Java?','Java Setup & Hello World','Java Variables','Java Data Types','Java Operators'] },
    { title:'Control Flow', lessons:['Java If-Else','Java Loops','Java Arrays','Java Methods'] },
    { title:'OOP', lessons:['Java OOP - Classes','Java Inheritance','Java Polymorphism','Java Interfaces','Java Exception Handling'] },
    { title:'Advanced', lessons:['Java Collections','Java Generics','Java File I/O','Java Threads','Java Streams','Java Lambda'] },
    { title:'Projects', lessons:['Build a Bank App','Build a Student DB','Final Java Project'] },
  ]},
  { id:'cpp', title:'C++', icon:'⚙️', accent:'#06b6d4', codeLanguage:'c++', tag:'Performance', tagColor:'#8b5cf6', desc:'C++ from scratch to STL', modules:[
    { title:'Basics', lessons:['What is C++?','C++ Setup','C++ Variables','C++ Data Types','C++ Operators'] },
    { title:'Control Flow', lessons:['C++ If-Else','C++ Loops','C++ Arrays','C++ Functions'] },
    { title:'Pointers', lessons:['C++ Pointers','C++ References'] },
    { title:'OOP & STL', lessons:['C++ OOP','C++ Inheritance','C++ Polymorphism','C++ STL','C++ File Handling'] },
    { title:'Projects', lessons:['Build a Calculator (C++)','Final C++ Project'] },
  ]},
  { id:'c', title:'C Programming', icon:'🔵', accent:'#3b82f6', codeLanguage:'c', tag:'Foundation', tagColor:'#f59e0b', desc:'Mother of all languages', modules:[
    { title:'Basics', lessons:['What is C?','C Setup','Variables in C','Data Types in C','Operators in C'] },
    { title:'Control Flow', lessons:['If-Else in C','Loops in C','Switch Statement','Break & Continue in C'] },
    { title:'Functions & Arrays', lessons:['Functions in C','Arrays in C','Strings in C','Pointers in C'] },
    { title:'Advanced', lessons:['Structures in C','File Handling in C','Dynamic Memory','C Programs'] },
  ]},
  { id:'dsa', title:'DSA', icon:'🧠', accent:'#8b5cf6', codeLanguage:'python', tag:'Interview', tagColor:'#ec4899', desc:'Data Structures & Algorithms', modules:[
    { title:'Arrays', lessons:['Arrays & Big O','Two Pointers','Sliding Window','Prefix Sum'] },
    { title:'Strings & Lists', lessons:['Strings','Linked List'] },
    { title:'Trees & Heap', lessons:['Stack','Queue','Binary Tree','BST','Heap'] },
    { title:'Graphs', lessons:['Graphs'] },
    { title:'Sorting', lessons:['Bubble Sort','Merge Sort','Quick Sort','Binary Search'] },
    { title:'Advanced', lessons:['Dynamic Programming','Greedy Algorithms','Backtracking'] },
  ]},
  { id:'sql', title:'SQL & Databases', icon:'🗄️', accent:'#10b981', codeLanguage:'python', tag:'Data', tagColor:'#6366f1', desc:'SQL basics to advanced queries', modules:[
    { title:'Basics', lessons:['What is SQL?','SELECT & FROM','WHERE & AND/OR','ORDER BY & LIMIT','INSERT UPDATE DELETE'] },
    { title:'Joins', lessons:['JOINS','GROUP BY & HAVING','Subqueries'] },
    { title:'Advanced', lessons:['Window Functions','Indexes','Views & CTEs','Transactions','Stored Procedures'] },
    { title:'Projects', lessons:['SQL Project'] },
  ]},
  { id:'webdev', title:'Full Stack Web Dev', icon:'🌐', accent:'#ec4899', codeLanguage:'javascript', tag:'Full Stack', tagColor:'#f59e0b', desc:'HTML to React to Node.js', modules:[
    { title:'HTML', lessons:['HTML Basics','HTML Forms','Semantic HTML'] },
    { title:'CSS', lessons:['CSS Basics','Box Model','Flexbox','CSS Grid','Responsive Design'] },
    { title:'JS for Web', lessons:['JavaScript for Web','DOM & Events'] },
    { title:'React', lessons:['What is React?','React Components','React Props & State','React Hooks','React Router','API Integration'] },
    { title:'Backend', lessons:['Node.js Basics','Express.js','MongoDB Basics'] },
    { title:'Deploy', lessons:['Build Full Stack App','Deploy Your App'] },
  ]},
  { id:'react', title:'React.js', icon:'⚛️', accent:'#61dafb', codeLanguage:'javascript', tag:'Frontend', tagColor:'#ec4899', desc:'Master React hooks & patterns', modules:[
    { title:'Basics', lessons:['What is React?','React Components','React Props & State','React Hooks','React Router'] },
    { title:'Advanced', lessons:['API Integration','Context API'] },
    { title:'Projects', lessons:['Build a Todo App (JS)','Build a Weather App'] },
  ]},
  { id:'nodejs', title:'Node.js & Express', icon:'🟢', accent:'#68a063', codeLanguage:'javascript', tag:'Backend', tagColor:'#f59e0b', desc:'Backend with Node.js & Express', modules:[
    { title:'Node.js', lessons:['Node.js Basics','Express.js','MongoDB Basics'] },
    { title:'API', lessons:['Fetch API','Async Await','Error Handling'] },
    { title:'Projects', lessons:['Build Full Stack App','Deploy Your App'] },
  ]},
  { id:'datascience', title:'Data Science', icon:'📊', accent:'#f97316', codeLanguage:'python', tag:'Data Science', tagColor:'#8b5cf6', desc:'Python for data analysis', modules:[
    { title:'NumPy', lessons:['What is NumPy?','What is Data Science?'] },
    { title:'Pandas', lessons:['What is Pandas?','File Handling'] },
    { title:'Visualization', lessons:['What is Machine Learning?'] },
  ]},
  { id:'ml', title:'Machine Learning', icon:'🤖', accent:'#a855f7', codeLanguage:'python', tag:'AI/ML', tagColor:'#10b981', desc:'ML algorithms & implementation', modules:[
    { title:'ML Basics', lessons:['What is Machine Learning?','What is Data Science?'] },
    { title:'Algorithms', lessons:['Dynamic Programming','Backtracking'] },
    { title:'Projects', lessons:['Final Python Project'] },
  ]},
  { id:'git', title:'Git & GitHub', icon:'🐙', accent:'#f05032', codeLanguage:'javascript', tag:'DevOps', tagColor:'#10b981', desc:'Version control for developers', modules:[
    { title:'Git Basics', lessons:['What is Git?','Git Installation','Git Branches'] },
    { title:'GitHub', lessons:['API Integration','Deploy Your App'] },
  ]},
  { id:'docker', title:'Docker & DevOps', icon:'🐳', accent:'#2496ed', codeLanguage:'javascript', tag:'DevOps', tagColor:'#6366f1', desc:'Containerization & deployment', modules:[
    { title:'Docker', lessons:['What is Docker?','Docker Containers'] },
    { title:'CI/CD', lessons:['Deploy Your App','Build Full Stack App'] },
  ]},
  { id:'cybersecurity', title:'Cybersecurity', icon:'🔒', accent:'#22c55e', codeLanguage:'python', tag:'Security', tagColor:'#ef4444', desc:'Ethical hacking fundamentals', modules:[
    { title:'Basics', lessons:['What is Python?','File Handling','Exception Handling'] },
    { title:'Web Security', lessons:['What is JavaScript?','DOM Manipulation','Error Handling'] },
  ]},
  { id:'flutter', title:'Flutter & Dart', icon:'💙', accent:'#54c5f8', codeLanguage:'javascript', tag:'Mobile', tagColor:'#f59e0b', desc:'Build iOS & Android apps', modules:[
    { title:'Dart', lessons:['What is Java?','Java Variables','Java Functions'] },
    { title:'Flutter', lessons:['What is React?','React Components','React Props & State'] },
  ]},
];

type Msg = { role:'user'|'assistant'; content:string };

// ── Progress Storage ──────────────────────────────────────────────
function saveProgress(sid: string, cid: string, data: any) {
  localStorage.setItem(`hx_academy_${sid}_${cid}`, JSON.stringify(data));
  const k = `hx_academy_enrolled_${sid}`;
  const e: string[] = JSON.parse(localStorage.getItem(k)||'[]');
  if (!e.includes(cid)) { e.push(cid); localStorage.setItem(k, JSON.stringify(e)); }
}
function loadProgress(sid: string, cid: string) {
  try { const r = localStorage.getItem(`hx_academy_${sid}_${cid}`); return r ? JSON.parse(r) : null; } catch { return null; }
}

// ── XP & Levels ───────────────────────────────────────────────────
const LEVELS = [
  { name:'Beginner', min:0, icon:'🌱' }, { name:'Explorer', min:100, icon:'🔍' },
  { name:'Learner', min:300, icon:'📚' }, { name:'Coder', min:600, icon:'💻' },
  { name:'Pro', min:1000, icon:'🚀' }, { name:'Expert', min:1500, icon:'⭐' },
  { name:'Master', min:2500, icon:'👑' },
];
function getLevel(xp: number) { for (let i = LEVELS.length-1; i >= 0; i--) if (xp >= LEVELS[i].min) return LEVELS[i]; return LEVELS[0]; }

// ── Groq API ──────────────────────────────────────────────────────
async function groq(prompt: string): Promise<string> {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ}`},
      body:JSON.stringify({ model:'llama-3.1-8b-instant', messages:[{role:'user',content:prompt}], temperature:0.7, max_tokens:2000 }),
    });
    const d = await r.json();
    return d?.choices?.[0]?.message?.content || 'No response';
  } catch { return 'Error. Please try again.'; }
}

async function groqStream(prompt: string, onChunk: (t:string)=>void) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ}`},
      body:JSON.stringify({ model:'llama-3.3-70b-versatile', messages:[{role:'user',content:prompt}], temperature:0.7, max_tokens:1500, stream:true }),
    });
    const reader = r.body!.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
        try { const d = JSON.parse(line.slice(6)); const t = d.choices?.[0]?.delta?.content||''; full += t; onChunk(full); } catch {}
      }
    }
    return full;
  } catch { return 'Error connecting to AI.'; }
}

// ── Piston Code Runner ────────────────────────────────────────────
const LANG_CFG: Record<string,{lang:string,ver:string,ext:string,starter:string}> = {
  python:     {lang:'python',     ver:'3.10.0',  ext:'py',   starter:'# Write Python code here\nprint("Hello World!")'},
  javascript: {lang:'javascript', ver:'18.15.0', ext:'js',   starter:'// Write JS code here\nconsole.log("Hello World!");'},
  java:       {lang:'java',       ver:'15.0.2',  ext:'java', starter:'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World!");\n  }\n}'},
  'c++':      {lang:'c++',        ver:'10.2.0',  ext:'cpp',  starter:'#include<iostream>\nusing namespace std;\nint main(){\n  cout<<"Hello World!"<<endl;\n}'},
  c:          {lang:'c',          ver:'10.2.0',  ext:'c',    starter:'#include<stdio.h>\nint main(){\n  printf("Hello World!\\n");\n  return 0;\n}'},
};
async function runCode(language: string, code: string) {
  const cfg = LANG_CFG[language] || LANG_CFG.python;
  const GROQ_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
  try {
    const prompt = `Execute this ${cfg.lang} code and return ONLY the exact output. No explanation, no markdown, just raw output:\n\`\`\`${cfg.lang}\n${code}\n\`\`\``;
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},
      body:JSON.stringify({ model:'llama-3.1-8b-instant', messages:[{role:'user',content:prompt}], temperature:0, max_tokens:500 }),
    });
    const d = await r.json();
    const out = d?.choices?.[0]?.message?.content?.trim() || '(no output)';
    return { out, err: out.toLowerCase().includes('error') || out.toLowerCase().includes('exception') };
  } catch (e:any) { return { out:`Error: ${e.message}`, err:true }; }
}

// ── CATALOG ───────────────────────────────────────────────────────
function Catalog({ onSelect }: { onSelect:(c:any)=>void }) {
  const [hov, setHov] = useState<string|null>(null);
  const { student } = useInstStudentStore();
  const sid = student?.id?.toString() || student?.careerId || 'guest';
  const totalL = COURSES.reduce((a,c) => a + c.modules.reduce((b,m) => b + m.lessons.length,0),0);

  const prog = COURSES.reduce((acc,c) => {
    const s = loadProgress(sid, c.id);
    const total = c.modules.reduce((a,m)=>a+m.lessons.length,0);
    const done = s?.completed?.length || 0;
    acc[c.id] = { done, total, pct: total>0 ? Math.round((done/total)*100):0, cert: s?.claimedCert||false };
    return acc;
  }, {} as Record<string,any>);

  const started = Object.values(prog).filter((p:any)=>p.done>0).length;
  const completed = Object.values(prog).filter((p:any)=>p.pct===100).length;

  return (
    <div style={{minHeight:'100vh',background:'#080b12',padding:'40px 32px',fontFamily:'system-ui,sans-serif'}}>
      <style>{`
        @keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .ccard{transition:all 0.25s!important}.ccard:hover{transform:translateY(-5px)!important}
      `}</style>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'48px',animation:'slide-up 0.5s ease'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'5px 16px',borderRadius:'20px',background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.25)',marginBottom:'20px'}}>
            <Sparkles size={13} style={{color:'#818cf8'}}/><span style={{color:'#818cf8',fontSize:'12px',fontWeight:700}}>100% Free · AI-Powered · Groq</span>
          </div>
          <h1 style={{fontSize:'48px',fontWeight:900,color:'#fff',margin:'0 0 12px',letterSpacing:'-0.03em',lineHeight:1.05}}>
            🎓 Hiresnix<br/><span style={{background:'linear-gradient(135deg,#6366f1,#ec4899,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AI Academy</span>
          </h1>
          <p style={{color:'#64748b',fontSize:'17px',margin:'0 0 20px'}}>Personal AI teacher · Basic to Project Building</p>
          <div style={{display:'flex',justifyContent:'center',gap:'24px',flexWrap:'wrap',marginBottom:'16px'}}>
            {[['🎬','Video Lectures'],['🤖','AI Teacher'],['⌨️','Live Code'],['❓','20 Quizzes'],['🏆','Certificates']].map(([i,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:'5px',color:'#475569',fontSize:'12px',fontWeight:600}}><span>{i}</span>{l}</div>
            ))}
          </div>
          <div style={{color:'#334155',fontSize:'12px'}}>{COURSES.length} Courses · {totalL}+ Lessons</div>
          {started > 0 && (
            <div style={{display:'flex',justifyContent:'center',gap:'16px',marginTop:'16px'}}>
              {[{l:'Started',v:started,c:'#818cf8'},{l:'Completed',v:completed,c:'#34d399'},{l:'Certified',v:Object.values(prog).filter((p:any)=>p.cert).length,c:'#f59e0b'}].map(s=>(
                <div key={s.l} style={{padding:'10px 18px',borderRadius:'12px',background:`rgba(255,255,255,0.04)`,border:'1px solid rgba(255,255,255,0.08)'}}>
                  <p style={{color:s.c,fontWeight:800,fontSize:'20px',margin:0}}>{s.v}</p>
                  <p style={{color:'#475569',fontSize:'11px',margin:0}}>{s.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'18px'}}>
          {COURSES.map((c,i)=>{
            const p = prog[c.id];
            return (
              <div key={c.id} className="ccard" onClick={()=>onSelect(c)} onMouseEnter={()=>setHov(c.id)} onMouseLeave={()=>setHov(null)}
                style={{background:hov===c.id?'linear-gradient(135deg,rgba(20,25,50,0.98),rgba(15,20,40,0.98))':'linear-gradient(135deg,rgba(13,17,28,0.98),rgba(11,15,23,0.98))',border:`1px solid ${hov===c.id?c.accent+'44':'rgba(255,255,255,0.07)'}`,borderRadius:'18px',padding:'24px',cursor:'pointer',animation:`slide-up 0.5s ease ${i*0.04}s both`,boxShadow:hov===c.id?`0 16px 48px ${c.accent}1a`:undefined,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-30,right:-30,width:80,height:80,borderRadius:'50%',background:c.accent,opacity:hov===c.id?0.07:0.02,filter:'blur(25px)',transition:'opacity 0.3s'}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                  <span style={{fontSize:'34px',animation:hov===c.id?'float 2s ease infinite':undefined}}>{c.icon}</span>
                  <span style={{fontSize:'10px',fontWeight:800,padding:'3px 10px',borderRadius:'20px',background:`${c.tagColor}1a`,color:c.tagColor,textTransform:'uppercase',letterSpacing:'0.05em'}}>{c.tag}</span>
                </div>
                <h2 style={{fontSize:'17px',fontWeight:800,color:'#fff',margin:'0 0 5px'}}>{c.title}</h2>
                <p style={{fontSize:'12px',color:'#475569',margin:'0 0 12px',lineHeight:1.5}}>{c.desc}</p>
                <div style={{display:'flex',gap:'10px',marginBottom:'14px'}}>
                  <span style={{fontSize:'11px',color:'#334155'}}>📚 {c.modules.length} Modules</span>
                  <span style={{fontSize:'11px',color:'#334155'}}>📖 {c.modules.reduce((a,m)=>a+m.lessons.length,0)} Lessons</span>
                </div>
                {p?.done > 0 && (
                  <div style={{marginBottom:'14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                      <span style={{fontSize:'10px',color:'#64748b'}}>Progress</span>
                      <span style={{fontSize:'10px',fontWeight:700,color:c.accent}}>{p.pct}%</span>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.06)',borderRadius:'3px',height:'4px',overflow:'hidden'}}>
                      <div style={{width:`${p.pct}%`,height:'100%',background:c.accent,transition:'width 0.5s'}}/>
                    </div>
                  </div>
                )}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    {p?.cert ? <span style={{fontSize:'12px',fontWeight:700,color:'#f59e0b'}}>🏆 Certified!</span>
                    : p?.pct===100 ? <span style={{fontSize:'12px',fontWeight:700,color:'#34d399'}}>✅ Complete</span>
                    : <div style={{display:'flex',gap:'2px'}}>{[...Array(5)].map((_,k)=><Star key={k} size={10} fill={c.accent} style={{color:c.accent}}/>)}</div>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',fontWeight:700,color:c.accent}}>
                    {p?.done>0?'Continue':'Start'} <ChevronRight size={12}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── LESSON PAGE ───────────────────────────────────────────────────
function LessonPage({ course, onBack }: { course:any; onBack:()=>void }) {
  const { student } = useInstStudentStore();
  const sid = student?.id?.toString() || student?.careerId || 'guest';
  const saved = loadProgress(sid, course.id);

  const [activeMod, setActiveMod] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expanded, setExpanded] = useState<number[]>([0]);
  const [tab, setTab] = useState<'video'|'teacher'|'code'|'backward'|'forward'|'quiz'|'notes'>('video');
  const [completed, setCompleted] = useState<Set<string>>(new Set(saved?.completed||[]));
  const [xp, setXp] = useState(saved?.xp||0);
  const [showXpGain, setShowXpGain] = useState<string|null>(null);
  const [claimedCerts, setClaimedCerts] = useState<Set<string>>(saved?.claimedCert?new Set([course.id]):new Set());
  const [showCertModal, setShowCertModal] = useState<string|null>(null);

  const [teacherText, setTeacherText] = useState('');
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [codeText, setCodeText] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [codeOut, setCodeOut] = useState('');
  const [codeErr, setCodeErr] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [backward, setBackward] = useState('');
  const [forward, setForward] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [quizAll, setQuizAll] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAns, setSelectedAns] = useState<number|null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const [mentorMsgs, setMentorMsgs] = useState<Msg[]>([{role:'assistant',content:`Hi! 👋 I'm your AI Mentor. Ask me anything!`}]);
  const [mentorInput, setMentorInput] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [waveBars, setWaveBars] = useState<number[]>(Array(16).fill(4));
  const micRef = useRef<any>(null);
  const waveRef = useRef<any>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const lesson = course.modules[activeMod]?.lessons[activeLesson] || '';
  const totalL = course.modules.reduce((a:number,m:any)=>a+m.lessons.length,0);
  const progress = Math.round((completed.size/totalL)*100);
  const ACC = course.accent;

  const SYSTEM = `You are Alex, a friendly AI teacher at Hiresnix Academy teaching "${course.title}". Lesson: "${lesson}". Simple English. Be clear, encouraging, beginner-friendly.`;

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  },[]);

  const startWave = () => { clearInterval(waveRef.current); waveRef.current = setInterval(()=>setWaveBars(Array(16).fill(0).map(()=>Math.random()*28+4)),100); };
  const stopWave = () => { clearInterval(waveRef.current); setWaveBars(Array(16).fill(4)); };

  const speak = useCallback((text:string)=>{
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g,' ').replace(/[#*`_]/g,'').slice(0,500));
    u.lang='en-US'; u.rate=0.88; u.pitch=1.05;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v=>v.lang==='en-US'&&v.name.includes('Google'))||voices.find(v=>v.lang.startsWith('en'))||voices[0];
    if (pref) u.voice=pref;
    u.onstart=()=>{setSpeaking(true);startWave();};
    u.onend=()=>{setSpeaking(false);stopWave();};
    u.onerror=()=>{setSpeaking(false);stopWave();};
    setTimeout(()=>window.speechSynthesis.speak(u),100);
  },[muted]);

  const loadTeacher = useCallback(async()=>{
    setTeacherLoading(true); setTeacherText(''); window.speechSynthesis?.cancel();
    let full = '';
    await groqStream(`You are Alex, an expert AI teacher. Teach "${lesson}" from ${course.title} in Simple English.\n1. Simple definition (1-2 sentences)\n2. Real-world analogy\n3. Key points (3-4 bullets)\n4. Quick tip\nBe conversational. Max 200 words.`,(t)=>{setTeacherText(t);full=t;});
    speak(full); setTeacherLoading(false);
  },[lesson,course.title]);

  const loadCode = useCallback(async()=>{
    setCodeLoading(true); setCodeText(''); setCodeOut(''); setCodeErr(false);
    const cfg = LANG_CFG[course.codeLanguage]||LANG_CFG.python;
    setUserCode(cfg.starter);
    const res = await groq(`Create a clear ${course.codeLanguage} code example for "${lesson}".\nFormat:\n\`\`\`${course.codeLanguage}\n# code with comments\n\`\`\`\nSimple explanation (2-3 sentences).`);
    setCodeText(res);
    const m = res.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (m) setUserCode(m[1].trim());
    setCodeLoading(false);
  },[lesson,course.codeLanguage]);

  const loadTrace = useCallback(async()=>{
    setTraceLoading(true); setBackward(''); setForward('');
    const [bwd,fwd] = await Promise.all([
      groq(`BACKWARD TRACING for "${lesson}" in ${course.title}. Simple English.\nShow output → steps → input in reverse. Use arrows: result ← step ← input`),
      groq(`FORWARD TRACING for "${lesson}" in ${course.title}. Simple English.\nStep-by-step execution. Format:\nStep 1 → [action] → [result]`),
    ]);
    setBackward(bwd); setForward(fwd); setTraceLoading(false);
  },[lesson]);

  const loadNotes = useCallback(async()=>{
    setNotesLoading(true); setNotes('');
    const res = await groq(`Study notes for "${lesson}" in ${course.title}. Simple English.\n📌 Key Concepts\n💻 Syntax\n✅ Examples\n⚠️ Common Mistakes\n⚡ Quick Summary`);
    setNotes(res); setNotesLoading(false);
  },[lesson]);

  const loadQuiz = useCallback(async()=>{
    setQuizLoading(true); setQuizAll([]); setQuizIdx(0); setSelectedAns(null); setQuizScore(0); setQuizDone(false);
    const res = await groq(`Generate 20 MCQ quiz questions about "${lesson}" in ${course.title}. Simple English.\nReturn ONLY valid JSON array (no markdown):\n[{"q":"question","opts":["A","B","C","D"],"ans":0,"exp":"explanation"}]\nMix easy(5),medium(10),hard(5).`);
    try {
      const clean = res.replace(/```json?|```/g,'').trim();
      const s = clean.indexOf('['), e = clean.lastIndexOf(']');
      setQuizAll(JSON.parse(clean.slice(s,e+1)).slice(0,20));
    } catch { setQuizAll([{q:`What is the main use of ${lesson}?`,opts:['Store data','Run loops','Define functions','Import modules'],ans:0,exp:`${lesson} is fundamental in ${course.title}.`}]); }
    setQuizLoading(false);
  },[lesson,course.title]);

  const sendMentor = async(text?:string)=>{
    const q = text||mentorInput.trim(); if (!q) return;
    setMentorInput('');
    const userMsg:Msg = {role:'user',content:q};
    const newMsgs = [...mentorMsgs,userMsg];
    setMentorMsgs(newMsgs); setMentorLoading(true);
    const res = await groq(`You are a helpful AI Mentor for ${course.title}. Lesson: "${lesson}". Simple English.\nStudent: ${q}\nBe clear, short, encouraging. Max 100 words.`);
    setMentorMsgs([...newMsgs,{role:'assistant',content:res}]);
    speak(res.slice(0,200)); setMentorLoading(false);
    setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:'smooth'}),100);
  };

  const runUserCode = async()=>{
    setRunLoading(true); setCodeOut('Running...'); setCodeErr(false);
    const result = await runCode(course.codeLanguage, userCode);
    setCodeOut(result.out); setCodeErr(result.err); setRunLoading(false);
  };

  const toggleMic = ()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if (!SR){alert('Use Chrome for voice');return;}
    if (micOn){micRef.current?.abort();setMicOn(false);return;}
    setMicOn(true);
    const r=new SR(); r.lang='en-US'; r.continuous=false;
    r.onresult=(e:any)=>{sendMentor(e.results[0][0].transcript);};
    r.onend=()=>setMicOn(false); r.onerror=()=>setMicOn(false);
    micRef.current=r; r.start();
  };

  const selectLesson = (mi:number,li:number)=>{
    setActiveMod(mi); setActiveLesson(li); setTab('video');
    setTeacherText(''); setCodeText(''); setBackward(''); setForward(''); setNotes('');
    setQuizAll([]); setQuizIdx(0); setSelectedAns(null); setQuizScore(0); setQuizDone(false);
    setCodeOut(''); window.speechSynthesis?.cancel();
  };

  const markDone = ()=>{
    const key = `${activeMod}-${activeLesson}`;
    if (completed.has(key)) return;
    const next = new Set([...completed,key]);
    setCompleted(next);
    const allKeys = course.modules.flatMap((m:any,mi:number)=>m.lessons.map((_:any,li:number)=>`${mi}-${li}`));
    if (allKeys.every((k:string)=>next.has(k))) setTimeout(()=>setShowCertModal(course.id),500);
    const gain = 10; const newXp = xp+gain;
    setXp(newXp); setShowXpGain(`+${gain} XP`);
    setTimeout(()=>setShowXpGain(null),2000);
    saveProgress(sid, course.id, { completed:[...next], xp:newXp, claimedCert:claimedCerts.has(course.id), lastActive:new Date().toISOString() });
    instStudentApi.saveAcademyProgress({ courseId:course.id, completed:[...next], xp:newXp, claimedCert:claimedCerts.has(course.id) }).catch(()=>{});
    const mod = course.modules[activeMod];
    if (activeLesson < mod.lessons.length-1) selectLesson(activeMod,activeLesson+1);
    else if (activeMod < course.modules.length-1) { setExpanded(p=>[...p,activeMod+1]); selectLesson(activeMod+1,0); }
  };

  useEffect(()=>{
    instStudentApi.getAcademyProgress().then(r=>{
      const d=(r.data||[]).find((p:any)=>p.course_id===course.id);
      if (d) { const c=d.completed||[]; setCompleted(new Set(c)); setXp(d.xp||0); if (d.claimed_cert) setClaimedCerts(new Set([course.id])); }
    }).catch(()=>{});
  },[course.id]);

  useEffect(()=>{ if (tab==='teacher'&&!teacherText&&!teacherLoading) loadTeacher(); },[tab]);
  useEffect(()=>{ if (tab==='code'&&!codeText&&!codeLoading) loadCode(); },[tab]);
  useEffect(()=>{ if ((tab==='backward'||tab==='forward')&&!backward&&!traceLoading) loadTrace(); },[tab]);
  useEffect(()=>{ if (tab==='notes'&&!notes&&!notesLoading) loadNotes(); },[tab]);
  useEffect(()=>{ if (tab==='quiz'&&quizAll.length===0&&!quizLoading) loadQuiz(); },[tab]);
  useEffect(()=>{ setTeacherText(''); setCodeText(''); setBackward(''); setForward(''); setNotes(''); setQuizAll([]); window.speechSynthesis?.cancel(); },[lesson]);
  useEffect(()=>()=>{ window.speechSynthesis?.cancel(); clearInterval(waveRef.current); },[]);

  const isDone=(mi:number,li:number)=>completed.has(`${mi}-${li}`);
  const curQuiz = quizAll[quizIdx];
  const TABS = [{id:'video',label:'🎬 Video'},{id:'teacher',label:'🤖 AI Teacher'},{id:'code',label:'⌨️ Code & Run'},{id:'backward',label:'← Backward'},{id:'forward',label:'→ Forward'},{id:'quiz',label:`❓ Quiz${quizAll.length>0?` (${quizIdx}/${quizAll.length})`:'(20)'}`},{id:'notes',label:'📝 Notes'}];
  const QUICK = [`Explain ${lesson} simply`,`Example of ${lesson}?`,`Common mistakes in ${lesson}?`,`Real use of ${lesson}?`];

  return (
    <div style={{display:'grid',gridTemplateColumns:'230px 1fr 280px',height:'100vh',background:'#080b12',fontFamily:'system-ui,sans-serif',overflow:'hidden'}}>
      <style>{`
        @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.5);opacity:0}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .lbtn:hover{background:rgba(255,255,255,0.07)!important;color:#e2e8f0!important}
        .tbtn:hover{background:rgba(255,255,255,0.09)!important}
        .qq:hover{background:rgba(255,255,255,0.07)!important}
        *::-webkit-scrollbar{width:3px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        textarea{color-scheme:dark;resize:vertical}
      `}</style>

      {/* LEFT SIDEBAR */}
      <div style={{background:'#0b0f1a',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:'5px',color:'#334155',fontSize:'11px',background:'none',border:'none',cursor:'pointer',marginBottom:'10px',padding:0}}>
            <ArrowLeft size={12}/> All Courses
          </button>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <span style={{fontSize:'22px'}}>{course.icon}</span>
            <div><div style={{color:'#fff',fontWeight:800,fontSize:'12px'}}>{course.title}</div><div style={{color:ACC,fontSize:'10px',fontWeight:700}}>{progress}% Complete</div></div>
          </div>
          <div style={{background:'rgba(255,255,255,0.06)',borderRadius:'3px',height:'4px',overflow:'hidden'}}>
            <div style={{width:`${progress}%`,height:'100%',background:`linear-gradient(90deg,${ACC},${ACC}99)`,transition:'width 0.6s'}}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'6px'}}>
          {course.modules.map((mod:any,mi:number)=>(
            <div key={mi}>
              <button onClick={()=>setExpanded(p=>p.includes(mi)?p.filter((x:number)=>x!==mi):[...p,mi])}
                style={{width:'100%',display:'flex',alignItems:'center',gap:'6px',padding:'7px 10px',borderRadius:'7px',background:'none',border:'none',cursor:'pointer',color:'#475569',fontSize:'11px',fontWeight:700,textAlign:'left'}}>
                <span style={{color:ACC,fontSize:'9px'}}>{expanded.includes(mi)?'▼':'▶'}</span>
                <span style={{flex:1}}>{mi+1}. {mod.title}</span>
                <span style={{fontSize:'10px',color:'#1e293b'}}>{mod.lessons.filter((_:any,li:number)=>isDone(mi,li)).length}/{mod.lessons.length}</span>
              </button>
              {expanded.includes(mi) && mod.lessons.map((ls:string,li:number)=>{
                const act=activeMod===mi&&activeLesson===li; const done=isDone(mi,li);
                return (
                  <button key={li} className="lbtn" onClick={()=>selectLesson(mi,li)}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:'7px',padding:'6px 8px 6px 20px',borderRadius:'6px',border:'none',cursor:'pointer',textAlign:'left',fontSize:'11px',marginBottom:'1px',transition:'all 0.15s',background:act?`${ACC}18`:'transparent',color:act?ACC:done?'#34d399':'#334155',borderLeft:act?`2px solid ${ACC}`:'2px solid transparent'}}>
                    {done?<CheckCircle size={10} style={{color:'#34d399',flexShrink:0}}/>:<div style={{width:10,height:10,borderRadius:'50%',border:`1.5px solid ${act?ACC:'rgba(255,255,255,0.1)'}`,flexShrink:0}}/>}
                    <span style={{flex:1,lineHeight:1.35}}>{ls}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
            <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'11px',color:'#f59e0b'}}><Flame size={11}/> {completed.size} done</span>
            <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'11px',color:'#818cf8'}}><Trophy size={11}/> {xp} pts</span>
          </div>
          <div style={{fontSize:'10px',color:'#1e293b',textAlign:'center'}}>{getLevel(xp).icon} {getLevel(xp).name} · Keep going! 🚀</div>
        </div>
      </div>

      {/* CENTER */}
      <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* XP popup */}
        {showXpGain && (
          <div style={{position:'fixed',top:'80px',left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',fontWeight:900,fontSize:'18px',padding:'8px 20px',borderRadius:'20px',boxShadow:'0 8px 24px rgba(245,158,11,0.4)',animation:'fade-in 0.3s ease',pointerEvents:'none'}}>
            {showXpGain} 🎉
          </div>
        )}
        {/* Cert Modal */}
        {showCertModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
            <div style={{background:'linear-gradient(135deg,#0f1729,#1a1040)',border:'1px solid rgba(245,158,11,0.4)',borderRadius:'24px',padding:'40px',maxWidth:'400px',width:'100%',textAlign:'center',boxShadow:'0 32px 80px rgba(245,158,11,0.2)'}}>
              <div style={{fontSize:'60px',marginBottom:'16px',animation:'float 2s ease infinite'}}>🏆</div>
              <h2 style={{color:'#fff',fontWeight:900,fontSize:'22px',margin:'0 0 8px'}}>Course Complete!</h2>
              <p style={{color:'#f59e0b',fontWeight:700,margin:'0 0 20px'}}>{course.title}</p>
              <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'12px',padding:'16px',marginBottom:'20px'}}>
                <p style={{color:'#94a3b8',fontSize:'12px',margin:'0 0 6px'}}>Total XP Earned</p>
                <p style={{color:'#f59e0b',fontSize:'30px',fontWeight:900,margin:0}}>{xp} XP</p>
                <p style={{color:'#64748b',fontSize:'11px',margin:'4px 0 0'}}>{getLevel(xp).icon} {getLevel(xp).name}</p>
              </div>
              <button onClick={()=>{
                const apiBase=(import.meta as any).env.VITE_API_URL||'https://hirenix-backend.onrender.com/api';
                const token=localStorage.getItem('hx_inst_student_token')||'';
                fetch(`${apiBase}/inst-student/academy/certificate/${course.id}`,{headers:{Authorization:`Bearer ${token}`}})
                  .then(r=>r.blob()).then(blob=>{
                    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
                    a.download=`Hiresnix_Academy_${course.title.replace(/\s+/g,'_')}_Certificate.pdf`; a.click();
                    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
                  }).catch(()=>alert('Certificate download failed'));
                setClaimedCerts(prev=>new Set([...prev,course.id]));
                saveProgress(sid,course.id,{completed:[...completed],xp,claimedCert:true,lastActive:new Date().toISOString()});
                setShowCertModal(null);
              }} style={{width:'100%',padding:'13px',borderRadius:'12px',border:'none',background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',fontSize:'14px',fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'10px'}}>
                <Download size={16}/> Download Certificate
              </button>
              <button onClick={()=>setShowCertModal(null)} style={{width:'100%',padding:'9px',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.1)',background:'none',color:'#64748b',fontSize:'13px',cursor:'pointer'}}>Close</button>
            </div>
          </div>
        )}

        {/* Topbar */}
        <div style={{padding:'10px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'rgba(8,11,18,0.95)',backdropFilter:'blur(12px)'}}>
          <div>
            <div style={{color:'#fff',fontWeight:800,fontSize:'15px'}}>{lesson}</div>
            <div style={{color:'#334155',fontSize:'11px',marginTop:'1px'}}>{course.modules[activeMod]?.title}</div>
          </div>
          <div style={{display:'flex',gap:'7px',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 11px',borderRadius:'8px',background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.2)'}}>
              <span style={{fontSize:'12px'}}>{getLevel(xp).icon}</span><span style={{color:'#f59e0b',fontSize:'11px',fontWeight:700}}>{xp} XP</span>
            </div>
            <button onClick={()=>{setMuted(m=>!m);window.speechSynthesis?.cancel();setSpeaking(false);stopWave();}}
              style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 11px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:muted?'#334155':ACC,fontSize:'11px',fontWeight:600,cursor:'pointer'}}>
              {muted?<VolumeX size={13}/>:<Volume2 size={13}/>}
            </button>
            <button onClick={markDone} style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 14px',borderRadius:'8px',border:'none',background:`linear-gradient(135deg,${ACC},${ACC}99)`,color:'#fff',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
              <CheckCircle size={12}/> Mark Done
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'2px',padding:'8px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} className="tbtn" onClick={()=>setTab(t.id as any)}
              style={{padding:'5px 12px',borderRadius:'7px',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:600,transition:'all 0.15s',background:tab===t.id?ACC:'rgba(255,255,255,0.04)',color:tab===t.id?'#fff':'#475569',whiteSpace:'nowrap',flexShrink:0}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:'18px'}}>

          {/* VIDEO */}
          {tab==='video' && (
            <div style={{animation:'fade-in 0.3s ease',display:'flex',flexDirection:'column',gap:'12px'}}>
              <div style={{position:'relative',paddingBottom:'56.25%',height:0,borderRadius:'14px',overflow:'hidden',background:'#000',border:'1px solid rgba(255,255,255,0.08)'}}>
                <iframe
                  key={lesson}
                  src={`https://www.youtube.com/embed/${getYT(lesson)}?rel=0&modestbranding=1&playsinline=1`}
                  title={lesson}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}
                />
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
                <p style={{fontSize:'11px',color:'#475569',margin:0}}>💡 Watch → AI Teacher → Code & Run → Quiz → Mark Done ✅</p>
                <div style={{display:'flex',gap:'6px'}}>
                  <button onClick={()=>setTab('teacher')} style={{padding:'5px 12px',borderRadius:'7px',border:'none',background:`${ACC}22`,color:ACC,fontSize:'11px',fontWeight:700,cursor:'pointer'}}>🤖 AI Teacher</button>
                  <button onClick={()=>setTab('code')} style={{padding:'5px 12px',borderRadius:'7px',border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.08)',color:'#34d399',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>⌨️ Code</button>
                </div>
              </div>
            </div>
          )}

          {/* AI TEACHER */}
          {tab==='teacher' && (
            <div style={{animation:'fade-in 0.3s ease'}}>
              <div style={{background:`linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,25,50,0.98))`,borderRadius:'16px',border:`1px solid ${ACC}33`,padding:'22px',marginBottom:'14px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-50,right:-50,width:120,height:120,borderRadius:'50%',background:ACC,opacity:0.04,filter:'blur(40px)'}}/>
                <div style={{display:'flex',gap:'14px'}}>
                  <div style={{position:'relative',flexShrink:0}}>
                    <div style={{width:58,height:58,borderRadius:'50%',background:`linear-gradient(135deg,${ACC},${ACC}88)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',border:`2px solid ${ACC}55`,boxShadow:speaking?`0 0 20px ${ACC}88`:undefined,transition:'box-shadow 0.3s'}}>🤖</div>
                    {speaking && <>
                      <div style={{position:'absolute',inset:-4,borderRadius:'50%',border:`2px solid ${ACC}44`,animation:'pulse-ring 1s ease-out infinite'}}/>
                      <div style={{position:'absolute',inset:-8,borderRadius:'50%',border:`1px solid ${ACC}22`,animation:'pulse-ring 1s ease-out 0.3s infinite'}}/>
                    </>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                      <span style={{color:ACC,fontSize:'11px',fontWeight:800,letterSpacing:'0.05em'}}>ALEX · AI TEACHER</span>
                      {speaking && <span style={{background:`${ACC}22`,color:ACC,fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'10px'}}>🔊 Speaking</span>}
                    </div>
                    {teacherLoading && !teacherText
                      ? <div style={{display:'flex',alignItems:'center',gap:'8px',color:'#334155',fontSize:'13px'}}><div style={{width:16,height:16,border:`2px solid ${ACC}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/> Preparing lesson...</div>
                      : <div style={{color:'#cbd5e1',fontSize:'13px',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{teacherText}</div>
                    }
                  </div>
                </div>
              </div>
              {speaking && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'3px',height:'36px',marginBottom:'14px'}}>
                  {waveBars.map((h,i)=><div key={i} style={{width:'3px',background:ACC,borderRadius:'2px',height:`${h}px`,transition:'height 0.1s',opacity:0.6+i%3*0.13}}/>)}
                </div>
              )}
              <button onClick={loadTeacher} style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',borderRadius:'9px',border:`1px solid ${ACC}33`,background:`${ACC}0d`,color:ACC,fontSize:'11px',fontWeight:600,cursor:'pointer'}}>
                <RefreshCw size={12}/> Re-explain
              </button>
            </div>
          )}

          {/* CODE & RUN */}
          {tab==='code' && (
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:200,display:'flex',flexDirection:'column',background:'#0d1117'}}>
              {/* Top bar */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',height:'44px',background:'#161b22',borderBottom:'1px solid #30363d',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <button onClick={()=>setTab('teacher')} style={{display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',borderRadius:'6px',border:'1px solid #30363d',background:'transparent',color:'#8b949e',fontSize:'12px',cursor:'pointer'}}>← Back</button>
                  <span style={{color:'#e6edf3',fontWeight:700,fontSize:'13px'}}>{lesson}</span>
                  <span style={{color:'#30363d'}}>·</span>
                  <span style={{color:ACC,fontSize:'11px',fontFamily:'monospace'}}>{course.codeLanguage}</span>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={loadCode} style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'6px',border:'1px solid #30363d',background:'transparent',color:'#8b949e',fontSize:'11px',cursor:'pointer'}}>
                    <RefreshCw size={11}/> New Example
                  </button>
                  <button onClick={runUserCode} disabled={runLoading}
                    style={{display:'flex',alignItems:'center',gap:'6px',padding:'5px 16px',borderRadius:'6px',border:'none',background:'#238636',color:'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer',opacity:runLoading?0.7:1}}>
                    {runLoading?<div style={{width:11,height:11,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:<Play size={11} fill="#fff"/>}
                    {runLoading?'Running...':'▶ Run Code'}
                  </button>
                </div>
              </div>

              {/* Split pane */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',flex:1,overflow:'hidden'}}>
                {/* LEFT — Problem description */}
                <div style={{borderRight:'1px solid #30363d',overflow:'auto',padding:'20px 24px'}}>
                  <div style={{marginBottom:'14px'}}>
                    <span style={{fontSize:'10px',fontWeight:700,color:ACC,letterSpacing:'0.1em',textTransform:'uppercase'}}>Problem</span>
                    <h3 style={{color:'#e6edf3',fontSize:'15px',fontWeight:700,margin:'4px 0 0'}}>{lesson}</h3>
                  </div>
                  {codeLoading
                    ? <div style={{textAlign:'center',padding:'40px',color:'#8b949e'}}><div style={{width:20,height:20,border:`2px solid ${ACC}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 10px'}}/> Loading...</div>
                    : <div style={{color:'#c9d1d9',fontSize:'13px',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{codeText}</div>
                  }
                </div>

                {/* RIGHT — Editor + Output */}
                <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
                  {/* Editor */}
                  <div style={{flex:1,overflow:'auto',background:'#0d1117',position:'relative'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'#161b22',borderBottom:'1px solid #30363d',position:'sticky',top:0}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:'#ef4444'}}/>
                      <div style={{width:10,height:10,borderRadius:'50%',background:'#f59e0b'}}/>
                      <div style={{width:10,height:10,borderRadius:'50%',background:'#22c55e'}}/>
                      <span style={{color:'#8b949e',fontSize:'11px',fontFamily:'monospace',marginLeft:'8px'}}>{`main.${LANG_CFG[course.codeLanguage]?.ext||'py'}`}</span>
                    </div>
                    <textarea value={userCode} onChange={e=>setUserCode(e.target.value)} spellCheck={false}
                      style={{width:'100%',minHeight:'300px',height:'100%',background:'transparent',border:'none',padding:'14px 16px',fontFamily:'"Fira Code","Cascadia Code",monospace',fontSize:'13px',color:'#e6edf3',outline:'none',lineHeight:1.75,boxSizing:'border-box',resize:'none'}}
                      placeholder={`// Write ${course.codeLanguage} code here...`}/>
                  </div>

                  {/* Output */}
                  <div style={{borderTop:'1px solid #30363d',background:'#0d1117',minHeight:'120px',maxHeight:'200px',overflow:'auto',flexShrink:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 14px',background:'#161b22',borderBottom:'1px solid #30363d'}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:codeErr?'#ef4444':'#22c55e'}}/>
                      <span style={{fontSize:'11px',fontWeight:700,color:'#8b949e',letterSpacing:'0.05em'}}>OUTPUT</span>
                    </div>
                    <pre style={{margin:0,padding:'12px 16px',fontFamily:'"Fira Code",monospace',fontSize:'12px',color:codeErr?'#f87171':codeOut?'#a7f3d0':'#4b5563',lineHeight:1.7,whiteSpace:'pre-wrap'}}>
                      {codeOut || '// Click "Run Code" to see output...'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BACKWARD */}
          {tab==='backward' && (
            <div style={{animation:'fade-in 0.3s ease'}}>
              {traceLoading
                ? <div style={{textAlign:'center',padding:'40px',color:'#334155'}}><div style={{width:22,height:22,border:'2px solid #f87171',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/> Analyzing...</div>
                : <div style={{background:'rgba(239,68,68,0.05)',borderRadius:'14px',border:'1px solid rgba(239,68,68,0.18)',padding:'22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'16px'}}>
                    <div style={{width:34,height:34,borderRadius:'9px',background:'rgba(239,68,68,0.12)',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowLeftRight size={15} style={{color:'#f87171'}}/></div>
                    <div><div style={{color:'#f87171',fontWeight:800,fontSize:'13px'}}>← Backward Tracing</div><div style={{color:'#334155',fontSize:'10px'}}>How output was produced in reverse</div></div>
                  </div>
                  <div style={{color:'#e2e8f0',fontSize:'12px',lineHeight:1.85,whiteSpace:'pre-wrap'}}>{backward}</div>
                  <button onClick={loadTrace} style={{display:'flex',alignItems:'center',gap:'5px',marginTop:'14px',padding:'6px 12px',borderRadius:'7px',border:'1px solid rgba(248,113,113,0.25)',background:'rgba(239,68,68,0.07)',color:'#f87171',fontSize:'11px',cursor:'pointer'}}><RefreshCw size={11}/> Regenerate</button>
                </div>
              }
            </div>
          )}

          {/* FORWARD */}
          {tab==='forward' && (
            <div style={{animation:'fade-in 0.3s ease'}}>
              {traceLoading
                ? <div style={{textAlign:'center',padding:'40px',color:'#334155'}}><div style={{width:22,height:22,border:'2px solid #34d399',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/> Analyzing...</div>
                : <div style={{background:'rgba(16,185,129,0.04)',borderRadius:'14px',border:'1px solid rgba(16,185,129,0.18)',padding:'22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'16px'}}>
                    <div style={{width:34,height:34,borderRadius:'9px',background:'rgba(16,185,129,0.12)',display:'flex',alignItems:'center',justifyContent:'center'}}><Zap size={15} style={{color:'#34d399'}}/></div>
                    <div><div style={{color:'#34d399',fontWeight:800,fontSize:'13px'}}>→ Forward Tracing</div><div style={{color:'#334155',fontSize:'10px'}}>Step-by-step execution</div></div>
                  </div>
                  <div style={{color:'#e2e8f0',fontSize:'12px',lineHeight:1.85,whiteSpace:'pre-wrap'}}>{forward}</div>
                  <button onClick={loadTrace} style={{display:'flex',alignItems:'center',gap:'5px',marginTop:'14px',padding:'6px 12px',borderRadius:'7px',border:'1px solid rgba(52,211,153,0.25)',background:'rgba(16,185,129,0.07)',color:'#34d399',fontSize:'11px',cursor:'pointer'}}><RefreshCw size={11}/> Regenerate</button>
                </div>
              }
            </div>
          )}

          {/* QUIZ */}
          {tab==='quiz' && (
            <div style={{animation:'fade-in 0.3s ease'}}>
              {quizLoading
                ? <div style={{textAlign:'center',padding:'48px'}}><div style={{fontSize:'36px',marginBottom:'12px'}}>🎯</div><div style={{width:22,height:22,border:`2px solid ${ACC}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/><div style={{color:'#334155',fontSize:'13px'}}>Generating 20 questions...</div></div>
                : quizDone
                ? <div style={{textAlign:'center',padding:'40px',background:'rgba(255,255,255,0.03)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontSize:'48px',marginBottom:'12px'}}>🏆</div>
                  <div style={{color:'#fff',fontWeight:800,fontSize:'22px',marginBottom:'6px'}}>Quiz Complete!</div>
                  <div style={{color:ACC,fontSize:'32px',fontWeight:900,margin:'16px 0'}}>{quizScore}/{quizAll.length*10} pts</div>
                  <button onClick={loadQuiz} style={{padding:'10px 24px',borderRadius:'12px',border:'none',background:ACC,color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Retake Quiz</button>
                </div>
                : curQuiz && (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'7px'}}><Trophy size={14} style={{color:'#f59e0b'}}/><span style={{color:'#f59e0b',fontWeight:700,fontSize:'13px'}}>Score: {quizScore} pts</span></div>
                      <span style={{color:'#334155',fontSize:'12px'}}>Q {quizIdx+1}/{quizAll.length}</span>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'4px',height:'4px',overflow:'hidden',marginBottom:'20px'}}>
                      <div style={{width:`${(quizIdx/quizAll.length)*100}%`,height:'100%',background:ACC,transition:'width 0.4s'}}/>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.08)',padding:'22px',marginBottom:'14px'}}>
                      <div style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'18px',lineHeight:1.55}}>{curQuiz.q}</div>
                      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                        {curQuiz.opts?.map((opt:string,i:number)=>{
                          const rev=selectedAns!==null; const correct=i===curQuiz.ans; const sel=selectedAns===i;
                          return (
                            <button key={i} onClick={()=>{if(selectedAns!==null)return;setSelectedAns(i);if(correct)setQuizScore(s=>s+10);}}
                              style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 14px',borderRadius:'10px',border:rev?(correct?'1px solid rgba(52,211,153,0.5)':sel?'1px solid rgba(248,113,113,0.5)':'1px solid rgba(255,255,255,0.06)'):'1px solid rgba(255,255,255,0.08)',background:rev?(correct?'rgba(16,185,129,0.1)':sel?'rgba(239,68,68,0.09)':'rgba(255,255,255,0.02)'):'rgba(255,255,255,0.04)',color:rev?(correct?'#34d399':sel?'#f87171':'#334155'):'#94a3b8',cursor:rev?'default':'pointer',textAlign:'left',fontSize:'12px',fontWeight:500,transition:'all 0.15s'}}>
                              <span style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${rev?(correct?'#34d399':sel?'#f87171':'rgba(255,255,255,0.1)'):'rgba(255,255,255,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800,flexShrink:0}}>{String.fromCharCode(65+i)}</span>
                              {opt}
                              {rev&&correct&&<CheckCircle size={13} style={{color:'#34d399',marginLeft:'auto'}}/>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {selectedAns!==null && (
                      <div style={{animation:'fade-in 0.3s ease'}}>
                        <div style={{background:selectedAns===curQuiz.ans?'rgba(16,185,129,0.07)':'rgba(239,68,68,0.07)',borderRadius:'12px',border:`1px solid ${selectedAns===curQuiz.ans?'rgba(52,211,153,0.25)':'rgba(248,113,113,0.25)'}`,padding:'14px 16px',marginBottom:'12px'}}>
                          <div style={{fontWeight:700,marginBottom:'5px',color:selectedAns===curQuiz.ans?'#34d399':'#f87171'}}>{selectedAns===curQuiz.ans?'✅ Correct! +10 pts':'❌ Not quite!'}</div>
                          <div style={{fontSize:'12px',color:'#94a3b8',lineHeight:1.6}}>{curQuiz.exp}</div>
                        </div>
                        <button onClick={()=>{if(quizIdx+1>=quizAll.length)setQuizDone(true);else{setQuizIdx(i=>i+1);setSelectedAns(null);}}}
                          style={{width:'100%',padding:'11px',borderRadius:'11px',border:'none',background:`linear-gradient(135deg,${ACC},${ACC}99)`,color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                          {quizIdx+1>=quizAll.length?'🏆 See Results':'Next Question →'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          )}

          {/* NOTES */}
          {tab==='notes' && (
            <div style={{animation:'fade-in 0.3s ease'}}>
              {notesLoading
                ? <div style={{textAlign:'center',padding:'40px'}}><div style={{width:22,height:22,border:`2px solid ${ACC}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/><div style={{color:'#334155',fontSize:'13px'}}>Generating notes...</div></div>
                : <div style={{background:'rgba(255,255,255,0.02)',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.07)',padding:'22px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'7px'}}><FileText size={14} style={{color:ACC}}/><span style={{color:'#fff',fontWeight:800,fontSize:'13px'}}>Notes — {lesson}</span></div>
                    <button onClick={loadNotes} style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 11px',borderRadius:'7px',border:'1px solid rgba(255,255,255,0.09)',background:'none',color:'#334155',fontSize:'11px',cursor:'pointer'}}><RefreshCw size={10}/> Refresh</button>
                  </div>
                  <div style={{color:'#cbd5e1',fontSize:'12px',lineHeight:1.9,whiteSpace:'pre-wrap'}}>{notes}</div>
                </div>
              }
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR — AI MENTOR */}
      <div style={{background:'#0b0f1a',borderLeft:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:'9px'}}>
          <div style={{position:'relative'}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${ACC},${ACC}88)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',boxShadow:`0 0 12px ${ACC}44`}}>🤖</div>
            <div style={{position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',background:'#34d399',border:'2px solid #0b0f1a'}}/>
          </div>
          <div><div style={{color:'#fff',fontWeight:800,fontSize:'12px'}}>AI Mentor</div><div style={{color:'#34d399',fontSize:'10px'}}>● Online</div></div>
        </div>
        <div style={{padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{fontSize:'10px',color:'#1e293b',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'6px'}}>Quick Questions</div>
          {QUICK.map((q,i)=>(
            <button key={i} className="qq" onClick={()=>sendMentor(q)}
              style={{width:'100%',padding:'6px 9px',borderRadius:'7px',border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.03)',color:'#475569',fontSize:'10px',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px',transition:'all 0.15s',lineHeight:1.4}}>
              <span>{q}</span><ChevronRight size={9} style={{flexShrink:0,marginLeft:'4px',color:'#1e293b'}}/>
            </button>
          ))}
        </div>
        <div style={{padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{fontSize:'10px',color:'#1e293b',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'7px'}}>Voice (English)</div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:'2px',height:'22px'}}>
              {waveBars.slice(0,8).map((h,i)=><div key={i} style={{flex:1,background:speaking?ACC:'rgba(255,255,255,0.07)',borderRadius:'2px',height:`${speaking?h:3}px`,transition:'height 0.1s'}}/>)}
            </div>
            <button onClick={toggleMic} style={{width:40,height:40,borderRadius:'50%',border:'none',background:micOn?'linear-gradient(135deg,#ef4444,#dc2626)':`linear-gradient(135deg,${ACC},${ACC}99)`,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:micOn?'0 0 14px rgba(239,68,68,0.5)':`0 0 10px ${ACC}44`}}>
              {micOn?<MicOff size={15}/>:<Mic size={15}/>}
            </button>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:'2px',height:'22px'}}>
              {waveBars.slice(8,16).map((h,i)=><div key={i} style={{flex:1,background:speaking?ACC:'rgba(255,255,255,0.07)',borderRadius:'2px',height:`${speaking?h:3}px`,transition:'height 0.1s'}}/>)}
            </div>
          </div>
          <div style={{textAlign:'center',fontSize:'10px',color:'#1e293b',marginTop:'4px'}}>{micOn?'🎤 Listening...':'Tap mic to speak'}</div>
        </div>
        <div style={{fontSize:'10px',color:'#1e293b',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',padding:'8px 12px 3px'}}>Chat</div>
        <div style={{flex:1,overflowY:'auto',padding:'0 10px 6px',display:'flex',flexDirection:'column',gap:'7px'}}>
          {mentorMsgs.map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',animation:'fade-in 0.3s ease'}}>
              <div style={{maxWidth:'88%',padding:'8px 11px',borderRadius:m.role==='user'?'13px 13px 2px 13px':'13px 13px 13px 2px',fontSize:'11px',lineHeight:1.55,background:m.role==='user'?`linear-gradient(135deg,${ACC},${ACC}99)`:'rgba(255,255,255,0.06)',color:m.role==='user'?'#fff':'#cbd5e1',border:m.role==='assistant'?'1px solid rgba(255,255,255,0.06)':undefined}}>
                {m.content}
              </div>
            </div>
          ))}
          {mentorLoading && (
            <div style={{display:'flex',gap:'4px',padding:'8px 11px',width:'fit-content',borderRadius:'13px',background:'rgba(255,255,255,0.05)'}}>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:'#475569',animation:`bounce 0.8s ${i*0.15}s infinite`}}/>)}
            </div>
          )}
          <div ref={msgEndRef}/>
        </div>
        <div style={{padding:'10px 12px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:'6px'}}>
          <input value={mentorInput} onChange={e=>setMentorInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMentor()}
            placeholder="Ask anything..." style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'9px',padding:'7px 11px',color:'#fff',fontSize:'11px',outline:'none'}}/>
          <button onClick={()=>sendMentor()} disabled={!mentorInput.trim()||mentorLoading}
            style={{width:32,height:32,borderRadius:'9px',border:'none',background:mentorInput.trim()?ACC:'rgba(255,255,255,0.05)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:(!mentorInput.trim()||mentorLoading)?0.4:1,transition:'all 0.2s',flexShrink:0}}>
            <Send size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Certificate Gate ──────────────────────────────────────────────
function CertificateGate({ onUnlocked }: { onUnlocked:()=>void }) {
  const { student } = useInstStudentStore();
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    instStudentApi.getCertificates()
      .then(r=>{ if ((r.data||[]).length > 0) onUnlocked(); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#080b12',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:32,height:32,border:'3px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/>
        <p style={{color:'#64748b',fontFamily:'system-ui'}}>Checking access...</p>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#080b12',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',padding:'24px'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
      <div style={{maxWidth:'460px',width:'100%',textAlign:'center'}}>
        <div style={{width:90,height:90,borderRadius:'50%',background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.1))',border:'2px solid rgba(99,102,241,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 28px',animation:'float2 3s ease infinite'}}>
          <Lock size={36} style={{color:'#6366f1'}}/>
        </div>
        <h1 style={{fontSize:'26px',fontWeight:900,color:'#fff',margin:'0 0 12px'}}>🔒 Academy Locked</h1>
        <p style={{color:'#64748b',fontSize:'14px',lineHeight:1.7,margin:'0 0 28px'}}>
          AI Academy is available only to students who have completed their institution course and received a certificate.
        </p>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'20px',textAlign:'left'}}>
          {[['✅','Enroll in a batch','Done'],['📚','Complete the course','Attend all classes'],['🏆','Receive certificate','Admin issues it'],['🎓','Access AI Academy','Unlocks automatically!']].map(([icon,step,desc],i)=>(
            <div key={i} style={{display:'flex',gap:'10px',alignItems:'flex-start',marginBottom:i<3?'12px':0}}>
              <span style={{fontSize:'16px',flexShrink:0}}>{icon}</span>
              <div><p style={{color:i<1?'#34d399':'#94a3b8',fontSize:'13px',fontWeight:600,margin:0}}>{step}</p><p style={{color:'#475569',fontSize:'11px',margin:0}}>{desc}</p></div>
            </div>
          ))}
        </div>
        {student && <p style={{color:'#334155',fontSize:'12px',marginTop:'16px'}}>Logged in as: <strong style={{color:'#6366f1'}}>{student.careerId}</strong></p>}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────
export function AcademyPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [course, setCourse] = useState<any>(null);
  if (!unlocked) return <CertificateGate onUnlocked={()=>setUnlocked(true)}/>;
  if (course) return <LessonPage course={course} onBack={()=>setCourse(null)}/>;
  return <Catalog onSelect={setCourse}/>;
}