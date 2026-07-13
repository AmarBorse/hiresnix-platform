// src/pages/instStudent/AcademyPage.tsx
// Hiresnix AI Academy — Complete Edition
// Free APIs: Groq (AI), Piston (code), Web Speech (voice), YouTube (video)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, CheckCircle, ArrowLeft,
  Send, Mic, MicOff, Volume2, VolumeX, Loader2, RefreshCw,
  FileText, Zap, ArrowLeftRight, Terminal,
  Sparkles, Trophy, Flame, Star, Play, Lock, Award, Download
} from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { useInstStudentStore } from '../../store/useInstStudentStore';

const GROQ = (import.meta as any).env.VITE_GROQ_API_KEY || '';

// ── Progress Storage (localStorage) ──────────────────────────────
function getStorageKey(studentId: string, courseId: string) {
  return `hx_academy_${studentId}_${courseId}`;
}

function saveProgress(studentId: string, courseId: string, data: {
  completed: string[], xp: number, claimedCert: boolean, enrolledAt: string, lastActive: string
}) {
  localStorage.setItem(getStorageKey(studentId, courseId), JSON.stringify(data));
  // Also save enrolled courses list
  const enrolledKey = `hx_academy_enrolled_${studentId}`;
  const enrolled: string[] = JSON.parse(localStorage.getItem(enrolledKey) || '[]');
  if (!enrolled.includes(courseId)) {
    enrolled.push(courseId);
    localStorage.setItem(enrolledKey, JSON.stringify(enrolled));
  }
}

function loadProgress(studentId: string, courseId: string) {
  const raw = localStorage.getItem(getStorageKey(studentId, courseId));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function getEnrolledCourses(studentId: string) {
  const raw = localStorage.getItem(`hx_academy_enrolled_${studentId}`);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function getAllStudentProgress() {
  // Get all academy progress from localStorage (for admin view)
  const allProgress: any[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('hx_academy_') && !key.includes('enrolled')) {
      try {
        const [,, studentId, courseId] = key.split('_');
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        allProgress.push({ studentId, courseId, ...data });
      } catch {}
    }
  }
  return allProgress;
}

// ── YouTube Video Map ─────────────────────────────────────────────
const YT: Record<string, string> = {
  // Python
  "What is Python?": "Y8Tko2YC5hA", "Setting Up Python": "YYXdXT2l-Gg",
  "Your First Program": "oxXAb8tJnQk", "Variables & Data Types": "cQT33yu9pY8",
  "Numbers & Strings": "k9TUPpljBo0", "Type Conversion": "HGOBQPFzWKo",
  "Arithmetic Operators": "v5MR5JyNx_0", "Comparison Operators": "7I9bw5W9WIU",
  "Logical Operators": "ysKnOlKZQUM", "If-Else Statements": "AWek49wXGzI",
  "For Loops": "OnDr4J5BBOM", "While Loops": "6iF8Xb7Z3wQ",
  "Break & Continue": "yCZBnjF4_tU", "Functions": "9Os0IGs9u7E",
  "Parameters & Return": "9Os0IGs9u7E", "Lambda Functions": "25ovCm9jKfA",
  "Lists": "Eaz5e6M33zE", "Tuples": "bdgRT40UUBQ",
  "Dictionaries": "daefaLgNkw0", "Sets": "sBvaPopl4nE",
  "List Comprehensions": "3dt4OGnU5sM", "String Methods": "zdMEn_hZ-KI",
  "File Handling": "Uh2ebFW8OYM", "Exception Handling": "NIWwJbo-9_8",
  "Classes & Objects": "JeznW0oahkk", "Inheritance": "Cn7AkDb4pIU",
  "Encapsulation": "JeznW0oahkk", "Polymorphism": "JeznW0oahkk",
  "Modules & Packages": "GxCXiSkm6no", "pip & Libraries": "U8OtBUFVEFo",
  "Recursion": "ngCos3cnxi8", "Decorators": "r7Dtus7N4pI",
  "Generators": "bD05uGo_sVI", "Regular Expressions": "K86ZkIY5FsM",
  "Build a Calculator": "4OX49nLNPEE", "Build a To-Do App": "DJGzR65BvqM",
  "Build a Quiz Game": "zehwgTB0vV8", "Build a Web Scraper": "XVv6mJpIp8M",
  "Final Python Project": "DLn3jOsNRVE",
  // JavaScript
  "What is JavaScript?": "W6NZfCO5SIk", "Variables (let/const/var)": "edlFjlzxkSI",
  "JS Data Types": "qnDkYs2CnOA", "Template Literals": "DG4obitDvUA",
  "JS Functions": "xUI5Tsl2JpY", "Arrow Functions": "h33Srr5J9nY",
  "Arrays": "R8rmfD9Y5-0", "Objects": "_js_NLAlIqI",
  "Destructuring": "NIq3qLaHCIs", "Spread & Rest": "iLx4ma8ZqvQ",
  "DOM Manipulation": "y17RuWkWdn8", "Event Listeners": "XF1_MlZ5l6M",
  "Fetch API": "drK3bge5eBw", "Promises": "DHvZLI3Mk4E",
  "Async Await": "vn3tm0quoqE", "Error Handling": "cFTFtuEQ-10",
  "ES6+ Features": "NCwa_xi0Uuc", "Local Storage": "AUOzvFzdIk4",
  "Build a Todo App (JS)": "G0jO8kUrg-I", "Build a Weather App": "MIYQR-Ybrn4",
  "Final JS Project": "3PHXvlpOkf4",
  // Java
  "What is Java?": "eIrMbAQSU34", "Java Setup & Hello World": "bm0OyhwFDuY",
  "Java Variables": "EKzNKDhpbhQ", "Java Data Types": "EKzNKDhpbhQ",
  "Java Operators": "Jb39YMrxbSQ", "Java If-Else": "HsDOeIiIVhQ",
  "Java Loops": "efpFoHCKMN8", "Java Arrays": "xzjZy-dHHLw",
  "Java Methods": "vvanI8NsuiQ", "Java OOP - Classes": "IUqKuGNasdM",
  "Java Inheritance": "Zs342ePFvRI", "Java Polymorphism": "jhDUxynEQRI",
  "Java Interfaces": "GhslBwrRVVE", "Java Exception Handling": "1XAfapkBQjk",
  "Java Collections": "GdAon80-0GQ", "Java Generics": "XMvznsY02Mk",
  "Java File I/O": "ScUJx4aToet", "Java Threads": "r_MbozD32NU",
  "Java Streams": "Q93swyQbN80", "Java Lambda": "gpIUfj3KaOc",
  "Build a Bank App": "Nk5YFa4MVNE", "Build a Student DB": "goFcQrFsivY",
  "Final Java Project": "Nk5YFa4MVNE",
  // C++
  "What is C++?": "vLnPwxZdW4Y", "C++ Setup": "vLnPwxZdW4Y",
  "C++ Variables": "Rub-JsjMhWY", "C++ Data Types": "Rub-JsjMhWY",
  "C++ Operators": "E7F-xQlDiaw", "C++ If-Else": "ifElse7zCMw",
  "C++ Loops": "c6N_gkqDsS8", "C++ Arrays": "zB9RI8_5ygM",
  "C++ Functions": "-TkoO8Z07hI", "C++ Pointers": "DTssVzssPV0",
  "C++ References": "IzoFn3dfsPA", "C++ OOP": "wN0x9eZLix4",
  "C++ Inheritance": "X8nYM0wbdiM", "C++ Polymorphism": "oIr-ik3Bg3A",
  "C++ STL": "LyGlTmaWEPs", "C++ File Handling": "EaHFhms1Shw",
  "Build a Calculator (C++)": "BkBVnkl0NF4", "Final C++ Project": "BkBVnkl0NF4",
  // DSA
  "Arrays & Big O": "A37-3lflh8I", "Two Pointers": "On03HWe2tZM",
  "Sliding Window": "p-ss2JNDHLo", "Prefix Sum": "7pJo_rM0z_s",
  "Strings": "Mj_Pyh77sXE", "Linked List": "oiW79L8VYXk",
  "Stack": "I5lq6sCuABE", "Queue": "nqXaPZi99JI",
  "Binary Tree": "fAAZixBzIAI", "BST": "cySVml6e_Fc",
  "Heap": "0wPlzMU-k00", "Graphs": "09_LlHjoEiY",
  "Bubble Sort": "xli-hn4wrWA", "Merge Sort": "TzeBrDU-JaY",
  "Quick Sort": "Hoixgm4-P4M", "Binary Search": "P3YID7pr48E",
  "Dynamic Programming": "oBt53YbR9Kk", "Greedy Algorithms": "HzeK7g8cD0Y",
  "Backtracking": "DKCbsiDBN3c",
  // SQL
  "What is SQL?": "HXV3zeQKqGY", "SELECT & FROM": "HXV3zeQKqGY",
  "WHERE & AND/OR": "HXV3zeQKqGY", "ORDER BY & LIMIT": "HXV3zeQKqGY",
  "INSERT UPDATE DELETE": "gbMSNAOHMV4", "JOINS": "9yeOJ0ZMUYw",
  "GROUP BY & HAVING": "7cjTqE4GwFE", "Subqueries": "K1BKeugY5Xg",
  "Window Functions": "Ww71knvVu_k", "Indexes": "fsG1XaZEa78",
  "Views & CTEs": "K74_FNs6ox8", "Transactions": "P80Js_qClUE",
  "Stored Procedures": "Sggdhd2PiNg", "SQL Project": "p3qvj9hO_Bo",
  // Web Dev
  "HTML Basics": "UB1O30fR-EE", "HTML Forms": "fNcJuPIZ2BE",
  "Semantic HTML": "kGW8Al_cga4", "CSS Basics": "1PnVor36_40",
  "Box Model": "rIO5326FgPE", "Flexbox": "JJSoEo8JSnc",
  "CSS Grid": "EiNiSFIPIQE", "Responsive Design": "srvUrASNj0s",
  "JavaScript for Web": "W6NZfCO5SIk", "DOM & Events": "y17RuWkWdn8",
  "What is React?": "SqcY0GlETPk", "React Components": "Ke90Tje7VS0",
  "React Props & State": "O6P86uwfdR0", "React Hooks": "cF2lQ_gZeA8",
  "React Router": "Law7wfdg_ls", "API Integration": "T3Px88x_PsI",
  "Node.js Basics": "TlB_eWDSMt4", "Express.js": "L72fhnn2tj0",
  "MongoDB Basics": "ofme2o29wY8", "Build Full Stack App": "mrHNSanmqQ4",
  "Deploy Your App": "l134cBALZGY",
};

function getYT(lesson: string) { return YT[lesson] || 'dQw4w9WgXcQ'; }

// ── Groq API (streaming) ──────────────────────────────────────────
async function groqStream(prompt: string, onChunk: (t: string) => void) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7, max_tokens: 1500, stream: true,
      }),
    });
    const reader = r.body!.getReader();
    const dec = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
        try { const d = JSON.parse(line.slice(6)); const t = d.choices?.[0]?.delta?.content||''; full += t; onChunk(full); } catch {}
      }
    }
    return full;
  } catch { return 'Error connecting to AI. Please check your API key.'; }
}

async function groq(prompt: string): Promise<string> {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 2000 }),
    });
    const d = await r.json();
    return d?.choices?.[0]?.message?.content || 'No response';
  } catch { return 'Error. Please try again.'; }
}

// ── Piston code runner ────────────────────────────────────────────
const LANG_CONFIG: Record<string,{lang:string,ver:string,ext:string,starter:string}> = {
  python:     { lang:'python',     ver:'3.10.0',  ext:'py',   starter:'# Write your Python code here\nprint("Hello World!")' },
  javascript: { lang:'javascript', ver:'18.15.0', ext:'js',   starter:'// Write your JS code here\nconsole.log("Hello World!");' },
  java:       { lang:'java',       ver:'15.0.2',  ext:'java', starter:'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}' },
  'c++':      { lang:'c++',        ver:'10.2.0',  ext:'cpp',  starter:'#include<iostream>\nusing namespace std;\nint main(){\n    cout<<"Hello World!"<<endl;\n    return 0;\n}' },
};

async function runCode(language: string, code: string) {
  const cfg = LANG_CONFIG[language] || LANG_CONFIG.python;
  try {
    const r = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: cfg.lang, version: cfg.ver,
        files: [{ name: `main.${cfg.ext}`, content: code }],
        stdin: '', args: [], run_timeout: 5000,
      }),
    });
    if (!r.ok) return { out: `HTTP Error: ${r.status}`, err: true };
    const d = await r.json();
    const stdout = d?.run?.stdout || '';
    const stderr = d?.run?.stderr || d?.compile?.stderr || '';
    return { out: stdout || stderr || '(no output)', err: !!stderr && !stdout };
  } catch (e: any) {
    return { out: `Network error: ${e.message}. Try again.`, err: true };
  }
}

// ── COURSES DATA ──────────────────────────────────────────────────
// ── XP & Level System ────────────────────────────────────────────
const LEVELS = [
  { name: 'Beginner', min: 0, icon: '🌱', color: '#64748b' },
  { name: 'Explorer', min: 100, icon: '🔍', color: '#3b82f6' },
  { name: 'Learner', min: 300, icon: '📚', color: '#8b5cf6' },
  { name: 'Coder', min: 600, icon: '💻', color: '#f59e0b' },
  { name: 'Pro', min: 1000, icon: '🚀', color: '#10b981' },
  { name: 'Expert', min: 1500, icon: '⭐', color: '#ec4899' },
  { name: 'Master', min: 2500, icon: '👑', color: '#f59e0b' },
];

function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

// ── Academy Certificate Generator ────────────────────────────────
function generateCertPDF(studentName: string, courseName: string, completionDate: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 850;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1200, 850);

  // Gold border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 1160, 810);
  ctx.strokeStyle = '#f59e0b33';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, 1140, 790);

  // Header
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('HIRESNIX AI ACADEMY', 600, 80);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px Arial';
  ctx.fillText('Certificate of Completion', 600, 160);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px Arial';
  ctx.fillText('This is to certify that', 600, 230);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 52px Arial';
  ctx.fillText(studentName, 600, 310);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px Arial';
  ctx.fillText('has successfully completed the course', 600, 370);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 38px Arial';
  ctx.fillText(courseName, 600, 440);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px Arial';
  ctx.fillText(`Completion Date: ${completionDate}`, 600, 500);

  // Decorations
  ctx.fillStyle = '#f59e0b22';
  ctx.beginPath(); ctx.arc(150, 700, 80, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(1050, 700, 80, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 40px Arial';
  ctx.fillText('🏆', 600, 640);

  ctx.fillStyle = '#334155';
  ctx.font = '14px Arial';
  const certNo = `HXAC-${Date.now().toString(36).toUpperCase()}`;
  ctx.fillText(`Certificate No: ${certNo} | hiresnix.co.in`, 600, 800);

  // Download
  const link = document.createElement('a');
  link.download = `Hiresnix_Academy_${courseName.replace(/\s+/g,'_')}_Certificate.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

const COURSES = [
  {
    id:'python', title:'Python Programming', icon:'🐍', accent:'#6366f1', codeLanguage:'python',
    tag:'Most Popular', tagColor:'#f59e0b',
    desc:'From absolute zero to building real projects',
    modules:[
      { title:'Getting Started', lessons:['What is Python?','Setting Up Python','Your First Program','Variables & Data Types','Type Conversion'] },
      { title:'Operators & Control Flow', lessons:['Arithmetic Operators','Comparison Operators','Logical Operators','If-Else Statements','For Loops','While Loops','Break & Continue'] },
      { title:'Functions', lessons:['Functions','Parameters & Return','Lambda Functions','Recursion','Decorators'] },
      { title:'Data Structures', lessons:['Lists','Tuples','Dictionaries','Sets','List Comprehensions','String Methods'] },
      { title:'File & Error Handling', lessons:['File Handling','Exception Handling','Modules & Packages','pip & Libraries'] },
      { title:'Object-Oriented Python', lessons:['Classes & Objects','Inheritance','Encapsulation','Polymorphism','Generators'] },
      { title:'Advanced Topics', lessons:['Regular Expressions'] },
      { title:'Build Real Projects', lessons:['Build a Calculator','Build a To-Do App','Build a Quiz Game','Build a Web Scraper','Final Python Project'] },
    ],
  },
  {
    id:'javascript', title:'JavaScript', icon:'⚡', accent:'#f59e0b', codeLanguage:'javascript',
    tag:'Web Dev', tagColor:'#10b981',
    desc:'Master JS from basics to modern ES6+ features',
    modules:[
      { title:'JS Fundamentals', lessons:['What is JavaScript?','Variables (let/const/var)','JS Data Types','Template Literals','JS Functions','Arrow Functions'] },
      { title:'Data & Control', lessons:['Arrays','Objects','Destructuring','Spread & Rest','Error Handling'] },
      { title:'Browser & DOM', lessons:['DOM Manipulation','Event Listeners','Local Storage'] },
      { title:'Async JavaScript', lessons:['Fetch API','Promises','Async Await'] },
      { title:'Modern JavaScript', lessons:['ES6+ Features'] },
      { title:'Build Real Projects', lessons:['Build a Todo App (JS)','Build a Weather App','Final JS Project'] },
    ],
  },
  {
    id:'java', title:'Java', icon:'☕', accent:'#ef4444', codeLanguage:'java',
    tag:'Industry Standard', tagColor:'#6366f1',
    desc:'Core Java to OOP and advanced concepts',
    modules:[
      { title:'Java Basics', lessons:['What is Java?','Java Setup & Hello World','Java Variables','Java Data Types','Java Operators'] },
      { title:'Control Flow', lessons:['Java If-Else','Java Loops','Java Arrays','Java Methods'] },
      { title:'Object-Oriented Java', lessons:['Java OOP - Classes','Java Inheritance','Java Polymorphism','Java Interfaces','Java Exception Handling'] },
      { title:'Advanced Java', lessons:['Java Collections','Java Generics','Java File I/O','Java Threads','Java Streams','Java Lambda'] },
      { title:'Build Real Projects', lessons:['Build a Bank App','Build a Student DB','Final Java Project'] },
    ],
  },
  {
    id:'cpp', title:'C++', icon:'⚙️', accent:'#06b6d4', codeLanguage:'c++',
    tag:'Performance', tagColor:'#8b5cf6',
    desc:'C++ from scratch to OOP and STL',
    modules:[
      { title:'C++ Basics', lessons:['What is C++?','C++ Setup','C++ Variables','C++ Data Types','C++ Operators'] },
      { title:'Control Flow', lessons:['C++ If-Else','C++ Loops','C++ Arrays','C++ Functions'] },
      { title:'Memory & Pointers', lessons:['C++ Pointers','C++ References'] },
      { title:'OOP in C++', lessons:['C++ OOP','C++ Inheritance','C++ Polymorphism','C++ STL','C++ File Handling'] },
      { title:'Build Real Projects', lessons:['Build a Calculator (C++)','Final C++ Project'] },
    ],
  },
  {
    id:'dsa', title:'DSA', icon:'🧠', accent:'#8b5cf6', codeLanguage:'python',
    tag:'Interview Prep', tagColor:'#ec4899',
    desc:'Data Structures & Algorithms from basic to advanced',
    modules:[
      { title:'Array Techniques', lessons:['Arrays & Big O','Two Pointers','Sliding Window','Prefix Sum'] },
      { title:'Strings & Linked Lists', lessons:['Strings','Linked List'] },
      { title:'Stack, Queue & Trees', lessons:['Stack','Queue','Binary Tree','BST','Heap'] },
      { title:'Graphs', lessons:['Graphs'] },
      { title:'Sorting & Searching', lessons:['Bubble Sort','Merge Sort','Quick Sort','Binary Search'] },
      { title:'Advanced Algorithms', lessons:['Dynamic Programming','Greedy Algorithms','Backtracking'] },
    ],
  },
  {
    id:'sql', title:'SQL & Databases', icon:'🗄️', accent:'#10b981', codeLanguage:'python',
    tag:'Data Skills', tagColor:'#6366f1',
    desc:'SQL basics to advanced queries and real projects',
    modules:[
      { title:'SQL Basics', lessons:['What is SQL?','SELECT & FROM','WHERE & AND/OR','ORDER BY & LIMIT','INSERT UPDATE DELETE'] },
      { title:'Joins & Aggregations', lessons:['JOINS','GROUP BY & HAVING','Subqueries'] },
      { title:'Advanced SQL', lessons:['Window Functions','Indexes','Views & CTEs','Transactions','Stored Procedures'] },
      { title:'Build Real Projects', lessons:['SQL Project'] },
    ],
  },
  {
    id:'webdev', title:'Full Stack Web Dev', icon:'🌐', accent:'#ec4899', codeLanguage:'javascript',
    tag:'Full Stack', tagColor:'#f59e0b',
    desc:'HTML to React to Node.js — full stack developer',
    modules:[
      { title:'HTML', lessons:['HTML Basics','HTML Forms','Semantic HTML'] },
      { title:'CSS', lessons:['CSS Basics','Box Model','Flexbox','CSS Grid','Responsive Design'] },
      { title:'JavaScript for Web', lessons:['JavaScript for Web','DOM & Events'] },
      { title:'React.js', lessons:['What is React?','React Components','React Props & State','React Hooks','React Router','API Integration'] },
      { title:'Backend - Node.js', lessons:['Node.js Basics','Express.js','MongoDB Basics'] },
      { title:'Build & Deploy', lessons:['Build Full Stack App','Deploy Your App'] },
    ],
  },
];

type Msg = { role:'user'|'assistant'; content:string };

// ── CATALOG ───────────────────────────────────────────────────────
function Catalog({ onSelect }: { onSelect:(c:any)=>void }) {
  const [hov, setHov] = useState<string|null>(null);
  const { student } = useInstStudentStore();
  const studentId = student?.id?.toString() || student?.careerId || 'guest';
  const totalLessons = COURSES.reduce((a,c) => a + c.modules.reduce((b,m) => b + m.lessons.length, 0), 0);

  // Load progress for all courses
  const courseProgress = COURSES.reduce((acc, c) => {
    const saved = loadProgress(studentId, c.id);
    const totalL = c.modules.reduce((a,m) => a + m.lessons.length, 0);
    const done = saved?.completed?.length || 0;
    acc[c.id] = { done, total: totalL, pct: totalL > 0 ? Math.round((done/totalL)*100) : 0, started: done > 0, cert: saved?.claimedCert || false };
    return acc;
  }, {} as Record<string,{done:number,total:number,pct:number,started:boolean,cert:boolean}>);

  const enrolledCount = Object.values(courseProgress).filter(p => p.started).length;
  const completedCount = Object.values(courseProgress).filter(p => p.pct === 100).length;
  return (
    <div style={{ minHeight:'100vh', background:'#080b12', padding:'40px 32px', fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow-pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}
        .ccard{transition:all 0.25s cubic-bezier(.4,0,.2,1)!important}
        .ccard:hover{transform:translateY(-6px) scale(1.01)!important}
      `}</style>

      <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:'52px', animation:'slide-up 0.5s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'5px 16px', borderRadius:'20px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', marginBottom:'20px' }}>
            <Sparkles size={13} style={{ color:'#818cf8' }} />
            <span style={{ color:'#818cf8', fontSize:'12px', fontWeight:700 }}>100% Free · AI-Powered</span>
          </div>
          <h1 style={{ fontSize:'52px', fontWeight:900, color:'#fff', margin:'0 0 12px', letterSpacing:'-0.03em', lineHeight:1.05 }}>
            🎓 Hiresnix<br />
            <span style={{ background:'linear-gradient(135deg,#6366f1,#ec4899,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>AI Academy</span>
          </h1>
          <p style={{ color:'#64748b', fontSize:'18px', margin:'0 0 28px' }}>Your personal AI teacher — Basic to Project Building</p>
          <div style={{ display:'flex', justifyContent:'center', gap:'28px', flexWrap:'wrap' }}>
            {[['🎬','Video Lectures'],['🤖','AI Teacher'],['⌨️','Live Code'],['❓','20 Quizzes'],['📊','Progress Track'],['🏆','Certificates']].map(([i,l])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:'6px', color:'#475569', fontSize:'13px', fontWeight:600 }}>
                <span style={{ fontSize:'16px' }}>{i}</span>{l}
              </div>
            ))}
          </div>
          <div style={{ marginTop:'16px', color:'#334155', fontSize:'13px' }}>{COURSES.length} Courses · {totalLessons}+ Lessons</div>
          {enrolledCount > 0 && (
            <div style={{ display:'flex', justifyContent:'center', gap:'20px', marginTop:'16px' }}>
              <div style={{ padding:'10px 20px', borderRadius:'12px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)' }}>
                <p style={{ color:'#818cf8', fontWeight:800, fontSize:'22px', margin:0 }}>{enrolledCount}</p>
                <p style={{ color:'#475569', fontSize:'11px', margin:0 }}>Courses Started</p>
              </div>
              <div style={{ padding:'10px 20px', borderRadius:'12px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ color:'#34d399', fontWeight:800, fontSize:'22px', margin:0 }}>{completedCount}</p>
                <p style={{ color:'#475569', fontSize:'11px', margin:0 }}>Completed</p>
              </div>
              <div style={{ padding:'10px 20px', borderRadius:'12px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ color:'#f59e0b', fontWeight:800, fontSize:'22px', margin:0 }}>{Object.values(courseProgress).filter(p=>p.cert).length}</p>
                <p style={{ color:'#475569', fontSize:'11px', margin:0 }}>Certificates</p>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'20px' }}>
          {COURSES.map((c, i) => (
            <div key={c.id} className="ccard" onClick={() => onSelect(c)}
              onMouseEnter={() => setHov(c.id)} onMouseLeave={() => setHov(null)}
              style={{ background: hov===c.id ? 'linear-gradient(135deg,rgba(20,25,50,0.98),rgba(15,20,40,0.98))' : 'linear-gradient(135deg,rgba(13,17,28,0.98),rgba(11,15,23,0.98))', border:`1px solid ${hov===c.id ? c.accent+'44':'rgba(255,255,255,0.07)'}`, borderRadius:'20px', padding:'26px', cursor:'pointer', animation:`slide-up 0.5s ease ${i*0.07}s both`, boxShadow: hov===c.id ? `0 20px 60px ${c.accent}1a`:undefined, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-40, right:-40, width:100, height:100, borderRadius:'50%', background:c.accent, opacity: hov===c.id ? 0.07:0.02, filter:'blur(30px)', transition:'opacity 0.3s' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                <span style={{ fontSize:'38px', animation: hov===c.id ? 'float 2s ease infinite':undefined }}>{c.icon}</span>
                <span style={{ fontSize:'10px', fontWeight:800, padding:'3px 10px', borderRadius:'20px', background:`${c.tagColor}1a`, color:c.tagColor, letterSpacing:'0.05em', textTransform:'uppercase' }}>{c.tag}</span>
              </div>
              <h2 style={{ fontSize:'19px', fontWeight:800, color:'#fff', margin:'0 0 6px' }}>{c.title}</h2>
              <p style={{ fontSize:'12px', color:'#475569', margin:'0 0 14px', lineHeight:1.5 }}>{c.desc}</p>
              <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
                <span style={{ fontSize:'11px', color:'#334155' }}>📚 {c.modules.length} Modules</span>
                <span style={{ fontSize:'11px', color:'#334155' }}>📖 {c.modules.reduce((a,m)=>a+m.lessons.length,0)} Lessons</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px', marginBottom:'18px' }}>
                {c.modules.slice(0,3).map((m,j) => (
                  <div key={j} style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'11px', color:'#475569' }}>
                    <div style={{ width:14, height:14, borderRadius:'4px', background:`${c.accent}1a`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', color:c.accent, fontWeight:800, flexShrink:0 }}>{j+1}</div>
                    {m.title}
                  </div>
                ))}
                {c.modules.length>3 && <div style={{ fontSize:'11px', color:'#1e293b', paddingLeft:'21px' }}>+{c.modules.length-3} more...</div>}
              </div>
              {/* Progress bar if started */}
              {courseProgress[c.id]?.started && (
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'10px', color:'#64748b' }}>Progress</span>
                    <span style={{ fontSize:'10px', fontWeight:700, color:c.accent }}>{courseProgress[c.id].pct}%</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'3px', height:'4px', overflow:'hidden' }}>
                    <div style={{ width:`${courseProgress[c.id].pct}%`, height:'100%', background:c.accent, transition:'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize:'10px', color:'#334155', marginTop:'3px' }}>{courseProgress[c.id].done}/{courseProgress[c.id].total} lessons</div>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:'3px' }}>
                  {courseProgress[c.id]?.cert
                    ? <span style={{ fontSize:'12px', fontWeight:700, color:'#f59e0b' }}>🏆 Certified!</span>
                    : courseProgress[c.id]?.pct === 100
                    ? <span style={{ fontSize:'12px', fontWeight:700, color:'#34d399' }}>✅ Complete</span>
                    : [...Array(5)].map((_,k)=><Star key={k} size={11} fill={c.accent} style={{ color:c.accent }} />)}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:700, color:c.accent }}>
                  {courseProgress[c.id]?.started ? 'Continue' : 'Start'} <ChevronRight size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LESSON PAGE ───────────────────────────────────────────────────
function LessonPage({ course, onBack }: { course:any; onBack:()=>void }) {
  const [activeMod, setActiveMod] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expanded, setExpanded] = useState<number[]>([0]);
  const [tab, setTab] = useState<'video'|'teacher'|'code'|'backward'|'forward'|'quiz'|'notes'>('video');
  const { student } = useInstStudentStore();
  const studentId = student?.id?.toString() || student?.careerId || 'guest';

  // Load from localStorage
  const savedProgress = loadProgress(studentId, course.id);
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(savedProgress?.completed || [])
  );
  const [xp, setXp] = useState(savedProgress?.xp || 0);
  const [showXpGain, setShowXpGain] = useState<string|null>(null);
  const [claimedCerts, setClaimedCerts] = useState<Set<string>>(
    savedProgress?.claimedCert ? new Set([course.id]) : new Set()
  );
  const [showCertModal, setShowCertModal] = useState<string|null>(null);

  // Content
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

  // Quiz — 20 questions
  const [quizAll, setQuizAll] = useState<any[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAns, setSelectedAns] = useState<number|null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // Mentor
  const [mentorMsgs, setMentorMsgs] = useState<Msg[]>([{ role:'assistant', content:`Hi! 👋 I'm your AI Mentor. Ask me anything about ${course.title}!` }]);
  const [mentorInput, setMentorInput] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);

  // Voice
  const [muted, setMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [waveBars, setWaveBars] = useState<number[]>(Array(16).fill(4));
  const micRef = useRef<any>(null);
  const waveRef = useRef<any>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const voicesLoadedRef = useRef(false);

  const lesson = course.modules[activeMod]?.lessons[activeLesson] || '';
  const totalL = course.modules.reduce((a:number,m:any)=>a+m.lessons.length,0);
  const progress = Math.round((completed.size/totalL)*100);

  // ── Load voices properly ────────────────────────────────────────
  useEffect(() => {
    const loadVoices = () => { window.speechSynthesis.getVoices(); voicesLoadedRef.current = true; };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const startWave = () => {
    clearInterval(waveRef.current);
    waveRef.current = setInterval(() => setWaveBars(Array(16).fill(0).map(()=>Math.random()*28+4)), 100);
  };
  const stopWave = () => { clearInterval(waveRef.current); setWaveBars(Array(16).fill(4)); };

  const speak = useCallback((text: string) => {
    if (muted || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/```[\s\S]*?```/g,' ').replace(/[#*`_]/g,'').slice(0,600);
    const trySpeak = () => {
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-US'; u.rate = 0.88; u.pitch = 1.05; u.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      // Pick best English voice
      const preferred = voices.find(v=>v.lang==='en-US' && v.name.includes('Google'))
        || voices.find(v=>v.lang==='en-US')
        || voices.find(v=>v.lang.startsWith('en'))
        || voices[0];
      if (preferred) u.voice = preferred;
      u.onstart = () => { setSpeaking(true); startWave(); };
      u.onend = () => { setSpeaking(false); stopWave(); };
      u.onerror = () => { setSpeaking(false); stopWave(); };
      window.speechSynthesis.speak(u);
    };
    // Wait for voices if not loaded
    if (window.speechSynthesis.getVoices().length > 0) trySpeak();
    else setTimeout(trySpeak, 500);
  }, [muted]);

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input requires Chrome browser'); return; }
    if (micOn) { micRef.current?.abort(); setMicOn(false); return; }
    setMicOn(true);
    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false;
    r.onresult = (e:any) => { sendMentor(e.results[0][0].transcript); };
    r.onend = () => setMicOn(false);
    r.onerror = () => setMicOn(false);
    micRef.current = r; r.start();
  };

  // ── Load functions ──────────────────────────────────────────────
  const loadTeacher = useCallback(async () => {
    setTeacherLoading(true); setTeacherText('');
    window.speechSynthesis?.cancel();
    let full = '';
    await groqStream(
      `You are Alex, a friendly teacher at Hiresnix Academy. Teach "${lesson}" from ${course.title} clearly in Simple English.\n\n1. Simple definition (1-2 sentences)\n2. Real-world analogy (relatable example)\n3. Key points (3-4 bullet points)\n4. Quick tip for beginners\n\nBe conversational, encouraging, and clear. Max 200 words.`,
      (t) => { setTeacherText(t); full = t; }
    );
    speak(full);
    setTeacherLoading(false);
  }, [lesson, course.title]);

  const loadCode = useCallback(async () => {
    setCodeLoading(true); setCodeText(''); setCodeOut(''); setCodeErr(false);
    const cfg = LANG_CONFIG[course.codeLanguage] || LANG_CONFIG.python;
    setUserCode(cfg.starter);
    const res = await groq(
      `Create a clear ${course.codeLanguage} code example for "${lesson}" in Simple English.\n\nFormat:\n\`\`\`${course.codeLanguage}\n# well-commented code here\n\`\`\`\n\nSimple explanation: what each part does (2-3 sentences max).`
    );
    setCodeText(res);
    // Extract code block
    const m = res.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (m) setUserCode(m[1].trim());
    setCodeLoading(false);
  }, [lesson, course.codeLanguage]);

  const loadTrace = useCallback(async () => {
    setTraceLoading(true); setBackward(''); setForward('');
    const [bwd, fwd] = await Promise.all([
      groq(`BACKWARD TRACING for "${lesson}" in ${course.title}.\nSimple English. Show how to trace from OUTPUT back to INPUT.\nUse format:\nResult ← Step 3 ← Step 2 ← Input\nExplain each reverse step simply.`),
      groq(`FORWARD TRACING for "${lesson}" in ${course.title}.\nSimple English. Show step-by-step execution.\nFormat:\nStep 1 → [action] → [result]\nStep 2 → [action] → [result]\nMake it easy for beginners.`),
    ]);
    setBackward(bwd); setForward(fwd);
    setTraceLoading(false);
  }, [lesson]);

  const loadNotes = useCallback(async () => {
    setNotesLoading(true); setNotes('');
    const res = await groq(`Study notes for "${lesson}" in ${course.title}. Simple English.\n\n📌 Key Concepts\n💻 Syntax / Format\n✅ Examples\n⚠️ Common Mistakes\n⚡ Quick Summary\n\nBe concise and beginner-friendly.`);
    setNotes(res); setNotesLoading(false);
  }, [lesson]);

  // ── Quiz: generate 20 questions ─────────────────────────────────
  const loadQuiz = useCallback(async () => {
    setQuizLoading(true); setQuizAll([]); setQuizIdx(0); setSelectedAns(null); setQuizScore(0); setQuizDone(false);
    const res = await groq(
      `Generate 20 multiple choice quiz questions about "${lesson}" in ${course.title}. Simple English.\n\nReturn ONLY a valid JSON array (no markdown, no explanation):\n[\n  {"q":"question","opts":["A","B","C","D"],"ans":0,"exp":"brief explanation"},\n  ...\n]\n\nMix easy (5), medium (10), hard (5) questions. Make sure options are distinct.`
    );
    try {
      const clean = res.replace(/```json?|```/g,'').trim();
      // Find JSON array
      const start = clean.indexOf('['); const end = clean.lastIndexOf(']');
      const parsed = JSON.parse(clean.slice(start, end+1));
      setQuizAll(parsed.slice(0,20));
    } catch {
      // Fallback: single question
      setQuizAll([{ q:`What is the main purpose of ${lesson}?`, opts:['Store data','Run loops','Define functions','Import modules'], ans:0, exp:`${lesson} is a fundamental concept in ${course.title}.` }]);
    }
    setQuizLoading(false);
  }, [lesson, course.title]);

  const sendMentor = async (text?: string) => {
    const q = text || mentorInput.trim(); if (!q) return;
    setMentorInput('');
    const userMsg: Msg = { role:'user', content:q };
    const newMsgs = [...mentorMsgs, userMsg];
    setMentorMsgs(newMsgs);
    setMentorLoading(true);
    const res = await groq(`You are a helpful AI Mentor for ${course.title}. Current lesson: "${lesson}". Simple English.\nStudent asks: ${q}\nBe clear, short, encouraging. Max 100 words.`);
    setMentorMsgs([...newMsgs, { role:'assistant', content:res }]);
    speak(res.slice(0,200));
    setMentorLoading(false);
    setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:'smooth'}),100);
  };

  const runUserCode = async () => {
    setRunLoading(true); setCodeOut('Running...'); setCodeErr(false);
    const result = await runCode(course.codeLanguage, userCode);
    setCodeOut(result.out); setCodeErr(result.err);
    setRunLoading(false);
  };

  const selectLesson = (mi:number, li:number) => {
    setActiveMod(mi); setActiveLesson(li); setTab('video');
    setTeacherText(''); setCodeText(''); setBackward(''); setForward(''); setNotes('');
    setQuizAll([]); setQuizIdx(0); setSelectedAns(null); setQuizScore(0); setQuizDone(false);
    setCodeOut(''); window.speechSynthesis?.cancel();
  };

  const markDone = () => {
    const key = `${activeMod}-${activeLesson}`;
    if (completed.has(key)) return;
    setCompleted(prev => {
      const next = new Set([...prev, key]);
      // Check if course complete
      const allKeys = course.modules.flatMap((m:any,mi:number)=>m.lessons.map((_:any,li:number)=>`${mi}-${li}`));
      if (allKeys.every((k:string) => next.has(k))) {
        setTimeout(() => setShowCertModal(course.id), 500);
      }
      return next;
    });
    // XP gain
    const gain = quizScore > 0 ? 20 : 10;
    const newXp = xp + gain;
    setXp(newXp);
    setShowXpGain(`+${gain} XP`);
    setTimeout(() => setShowXpGain(null), 2000);
    // Save to localStorage
    const newCompleted = [...completed, key];
    saveProgress(studentId, course.id, {
      completed: newCompleted,
      xp: newXp,
      claimedCert: claimedCerts.has(course.id),
      enrolledAt: savedProgress?.enrolledAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    const mod = course.modules[activeMod];
    if (activeLesson < mod.lessons.length-1) selectLesson(activeMod, activeLesson+1);
    else if (activeMod < course.modules.length-1) { setExpanded(p=>[...p,activeMod+1]); selectLesson(activeMod+1,0); }
  };

  const isDone = (mi:number,li:number) => completed.has(`${mi}-${li}`);

  useEffect(() => {
    if (tab==='teacher' && !teacherText && !teacherLoading) loadTeacher();
    if (tab==='code' && !codeText && !codeLoading) loadCode();
    if ((tab==='backward'||tab==='forward') && !backward && !traceLoading) loadTrace();
    if (tab==='notes' && !notes && !notesLoading) loadNotes();
    if (tab==='quiz' && quizAll.length===0 && !quizLoading) loadQuiz();
  }, [tab]);

  useEffect(()=>{ return ()=>{ window.speechSynthesis?.cancel(); clearInterval(waveRef.current); }; },[]);

  const curQuiz = quizAll[quizIdx];
  const TABS = [
    {id:'video',label:'🎬 Video'},{id:'teacher',label:'🤖 AI Teacher'},
    {id:'code',label:'⌨️ Code & Run'},{id:'backward',label:'← Backward'},
    {id:'forward',label:'→ Forward'},{id:'quiz',label:`❓ Quiz${quizAll.length>0?` (${quizIdx}/${quizAll.length})`:'(20 Qs)'}`},
    {id:'notes',label:'📝 Notes'},
  ];
  const QUICK = [`Explain ${lesson} simply`,`Example of ${lesson}?`,`Common mistakes in ${lesson}?`,`Real use of ${lesson}?`];

  const ACC = course.accent;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'230px 1fr 280px', height:'100vh', background:'#080b12', fontFamily:'system-ui,sans-serif', overflow:'hidden' }}>
      <style>{`
        @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.5);opacity:0}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .lbtn:hover{background:rgba(255,255,255,0.07)!important;color:#e2e8f0!important}
        .tbtn:hover{background:rgba(255,255,255,0.09)!important}
        .qq:hover{background:rgba(255,255,255,0.07)!important}
        *::-webkit-scrollbar{width:3px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        textarea{color-scheme:dark;resize:vertical}
      `}</style>

      {/* ═══ LEFT SIDEBAR ═══════════════════════════════════════════ */}
      <div style={{ background:'#0b0f1a', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:'5px', color:'#334155', fontSize:'11px', background:'none', border:'none', cursor:'pointer', marginBottom:'10px', padding:0 }}>
            <ArrowLeft size={12} /> All Courses
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <span style={{ fontSize:'22px' }}>{course.icon}</span>
            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:'12px' }}>{course.title}</div>
              <div style={{ color:ACC, fontSize:'10px', fontWeight:700 }}>{progress}% Complete</div>
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'3px', height:'4px', overflow:'hidden' }}>
            <div style={{ width:`${progress}%`, height:'100%', background:`linear-gradient(90deg,${ACC},${ACC}99)`, transition:'width 0.6s' }} />
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'6px' }}>
          {course.modules.map((mod:any, mi:number)=>(
            <div key={mi}>
              <button onClick={()=>setExpanded(p=>p.includes(mi)?p.filter(x=>x!==mi):[...p,mi])}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:'6px', padding:'7px 10px', borderRadius:'7px', background:'none', border:'none', cursor:'pointer', color:'#475569', fontSize:'11px', fontWeight:700, textAlign:'left' }}>
                <span style={{ color:ACC, fontSize:'9px' }}>{expanded.includes(mi)?'▼':'▶'}</span>
                <span style={{ flex:1 }}>{mi+1}. {mod.title}</span>
                <span style={{ fontSize:'10px', color:'#1e293b' }}>{mod.lessons.filter((_:any,li:number)=>isDone(mi,li)).length}/{mod.lessons.length}</span>
              </button>
              {expanded.includes(mi) && mod.lessons.map((ls:string, li:number)=>{
                const act = activeMod===mi && activeLesson===li;
                const done = isDone(mi,li);
                return (
                  <button key={li} className="lbtn" onClick={()=>selectLesson(mi,li)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:'7px', padding:'6px 8px 6px 20px', borderRadius:'6px', border:'none', cursor:'pointer', textAlign:'left', fontSize:'11px', marginBottom:'1px', transition:'all 0.15s', background: act?`${ACC}18`:'transparent', color: act?ACC:done?'#34d399':'#334155', borderLeft: act?`2px solid ${ACC}`:'2px solid transparent' }}>
                    {done ? <CheckCircle size={10} style={{ color:'#34d399', flexShrink:0 }} /> : <div style={{ width:10,height:10,borderRadius:'50%',border:`1.5px solid ${act?ACC:'rgba(255,255,255,0.1)'}`,flexShrink:0 }} />}
                    <span style={{ flex:1, lineHeight:1.35 }}>{ls}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'11px', color:'#f59e0b' }}><Flame size={11}/> {completed.size} done</span>
            <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'11px', color:'#818cf8' }}><Trophy size={11}/> {quizScore} pts</span>
          </div>
          <div style={{ fontSize:'10px', color:'#1e293b', textAlign:'center' }}>You're doing great! 🚀</div>
        </div>
      </div>

      {/* ═══ CENTER ══════════════════════════════════════════════════ */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* XP floating indicator */}
        {showXpGain && (
          <div style={{ position:'fixed', top:'80px', left:'50%', transform:'translateX(-50%)', zIndex:9999, background:'linear-gradient(135deg,#f59e0b,#f97316)', color:'#fff', fontWeight:900, fontSize:'18px', padding:'8px 20px', borderRadius:'20px', boxShadow:'0 8px 24px rgba(245,158,11,0.4)', animation:'fade-in 0.3s ease', pointerEvents:'none' }}>
            {showXpGain} 🎉
          </div>
        )}

        {/* Course Complete — Cert Modal */}
        {showCertModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
            <div style={{ background:'linear-gradient(135deg,#0f1729,#1a1040)', border:'1px solid rgba(245,158,11,0.4)', borderRadius:'24px', padding:'40px', maxWidth:'420px', width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize:'64px', marginBottom:'16px', animation:'float 2s ease infinite' }}>🏆</div>
              <h2 style={{ color:'#fff', fontWeight:900, fontSize:'24px', margin:'0 0 8px' }}>Course Complete!</h2>
              <p style={{ color:'#f59e0b', fontWeight:700, fontSize:'16px', margin:'0 0 4px' }}>{course.title}</p>
              <p style={{ color:'#64748b', fontSize:'13px', margin:'0 0 24px' }}>Congratulations! You've completed all lessons.</p>
              <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'12px', padding:'16px', marginBottom:'20px' }}>
                <p style={{ color:'#94a3b8', fontSize:'12px', margin:'0 0 8px' }}>Your XP Earned</p>
                <p style={{ color:'#f59e0b', fontSize:'32px', fontWeight:900, margin:0 }}>{xp} XP</p>
                <p style={{ color:'#64748b', fontSize:'11px', margin:'4px 0 0' }}>Level: {getLevel(xp).icon} {getLevel(xp).name}</p>
              </div>
              <button
                onClick={() => {
                  generateCertPDF(
                    student?.name || 'Student',
                    course.title,
                    new Date().toLocaleDateString('en-IN')
                  );
                  setClaimedCerts(prev => new Set([...prev, course.id]));
                  saveProgress(studentId, course.id, {
                    completed: [...completed],
                    xp,
                    claimedCert: true,
                    enrolledAt: savedProgress?.enrolledAt || new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                  });
                  setShowCertModal(null);
                }}
                style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#f59e0b,#f97316)', color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'10px' }}>
                <Download size={18} /> Download Certificate
              </button>
              <button onClick={() => setShowCertModal(null)} style={{ width:'100%', padding:'10px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)', background:'none', color:'#64748b', fontSize:'13px', cursor:'pointer' }}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Topbar */}
        <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'rgba(8,11,18,0.95)', backdropFilter:'blur(12px)' }}>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:'15px' }}>{lesson}</div>
            <div style={{ color:'#334155', fontSize:'11px', marginTop:'1px' }}>{course.modules[activeMod]?.title}</div>
          </div>
          <div style={{ display:'flex', gap:'7px', alignItems:'center' }}>
            <button onClick={()=>{setMuted(m=>!m);window.speechSynthesis?.cancel();setSpeaking(false);stopWave();}}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 11px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:muted?'#334155':ACC, fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
              {muted?<VolumeX size={13}/>:<Volume2 size={13}/>} {muted?'Muted':'Sound'}
            </button>
            {/* XP Badge */}
            <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'8px', background:`rgba(245,158,11,0.1)`, border:'1px solid rgba(245,158,11,0.2)' }}>
              <span style={{ fontSize:'12px' }}>{getLevel(xp).icon}</span>
              <span style={{ color:'#f59e0b', fontSize:'11px', fontWeight:700 }}>{xp} XP</span>
            </div>
            <button onClick={markDone}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 14px', borderRadius:'8px', border:'none', background:`linear-gradient(135deg,${ACC},${ACC}99)`, color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
              <CheckCircle size={12}/> Mark Done
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'2px', padding:'8px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, overflowX:'auto' }}>
          {TABS.map(t=>(
            <button key={t.id} className="tbtn" onClick={()=>setTab(t.id as any)}
              style={{ padding:'5px 12px', borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:600, transition:'all 0.15s', background:tab===t.id?ACC:'rgba(255,255,255,0.04)', color:tab===t.id?'#fff':'#475569', whiteSpace:'nowrap', flexShrink:0 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px' }}>

          {/* VIDEO */}
          {tab==='video' && (
            <div style={{ animation:'fade-in 0.3s ease' }}>
              <div style={{ borderRadius:'14px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', marginBottom:'14px', background:'#000', position:'relative', paddingTop:'56.25%' }}>
                <iframe key={lesson} src={`https://www.youtube.com/embed/${getYT(lesson)}?rel=0&modestbranding=1`} title={lesson} allowFullScreen allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} />
              </div>
              <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.07)', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                <div>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:'13px', marginBottom:'3px' }}>{lesson}</div>
                  <div style={{ color:'#334155', fontSize:'11px' }}>🎬 Free video · After watching, try AI Teacher for doubts in Hindi/Marathi</div>
                </div>
                <button onClick={()=>setTab('teacher')} style={{ padding:'7px 14px', borderRadius:'9px', border:'none', background:ACC, color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Ask AI →
                </button>
              </div>
              <div style={{ marginTop:'12px', padding:'12px 16px', borderRadius:'12px', background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.15)', fontSize:'12px', color:'#94a3b8', lineHeight:1.6 }}>
                💡 <strong style={{ color:'#c7d2fe' }}>Learning Path:</strong> Watch Video → AI Teacher → Code & Run → Quiz (20 Qs) → Mark Done ✅
              </div>
            </div>
          )}

          {/* AI TEACHER */}
          {tab==='teacher' && (
            <div style={{ animation:'fade-in 0.3s ease' }}>
              <div style={{ background:`linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,25,50,0.98))`, borderRadius:'16px', border:`1px solid ${ACC}33`, padding:'22px', marginBottom:'14px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-50, right:-50, width:120, height:120, borderRadius:'50%', background:ACC, opacity:0.04, filter:'blur(40px)' }} />
                <div style={{ display:'flex', gap:'14px' }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{ width:58, height:58, borderRadius:'50%', background:`linear-gradient(135deg,${ACC},${ACC}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', border:`2px solid ${ACC}55`, boxShadow:speaking?`0 0 20px ${ACC}88`:undefined, transition:'box-shadow 0.3s' }}>🤖</div>
                    {speaking && <>
                      <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:`2px solid ${ACC}44`, animation:'pulse-ring 1s ease-out infinite' }} />
                      <div style={{ position:'absolute', inset:-8, borderRadius:'50%', border:`1px solid ${ACC}22`, animation:'pulse-ring 1s ease-out 0.3s infinite' }} />
                    </>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                      <span style={{ color:ACC, fontSize:'11px', fontWeight:800, letterSpacing:'0.05em' }}>ALEX · AI TEACHER</span>
                      {speaking && <span style={{ background:`${ACC}22`, color:ACC, fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'10px' }}>🔊 Speaking</span>}
                    </div>
                    {teacherLoading && !teacherText
                      ? <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#334155', fontSize:'13px' }}><div style={{ width:16,height:16,border:`2px solid ${ACC}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/> Preparing lesson...</div>
                      : <div style={{ color:'#cbd5e1', fontSize:'13px', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{teacherText}</div>
                    }
                  </div>
                </div>
              </div>
              {speaking && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'3px', height:'36px', marginBottom:'14px' }}>
                  {waveBars.map((h,i)=><div key={i} style={{ width:'3px', background:ACC, borderRadius:'2px', height:`${h}px`, transition:'height 0.1s', opacity:0.6+i%3*0.13 }} />)}
                </div>
              )}
              <button onClick={loadTeacher} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'9px', border:`1px solid ${ACC}33`, background:`${ACC}0d`, color:ACC, fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                <RefreshCw size={12}/> Re-explain
              </button>
            </div>
          )}

          {/* CODE & RUN */}
          {tab==='code' && (
            <div style={{ animation:'fade-in 0.3s ease', display:'flex', flexDirection:'column', gap:'14px' }}>
              {codeLoading
                ? <div style={{ textAlign:'center', padding:'40px', color:'#334155' }}><div style={{ width:24,height:24,border:`2px solid ${ACC}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px' }}/> Generating {course.codeLanguage} example...</div>
                : <>
                  {codeText && <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.07)', padding:'14px 16px', fontSize:'12px', color:'#64748b', lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:'150px', overflowY:'auto' }}>{codeText}</div>}
                  <div style={{ background:'#0d1117', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                        <Terminal size={12} style={{ color:ACC }}/>
                        <span style={{ color:'#475569', fontSize:'12px', fontFamily:'monospace' }}>{course.codeLanguage} · Live Playground</span>
                      </div>
                      <button onClick={runUserCode} disabled={runLoading}
                        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 14px', borderRadius:'7px', border:'none', background:'#10b981', color:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', opacity:runLoading?0.6:1 }}>
                        {runLoading?<div style={{ width:11,height:11,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>:<Play size={11} fill="#fff"/>}
                        {runLoading?'Running...':'▶ Run Code'}
                      </button>
                    </div>
                    <textarea value={userCode} onChange={e=>setUserCode(e.target.value)}
                      spellCheck={false}
                      style={{ width:'100%', minHeight:'180px', background:'transparent', border:'none', padding:'14px 16px', fontFamily:'"Fira Code",monospace', fontSize:'12px', color:'#e2e8f0', outline:'none', lineHeight:1.75, boxSizing:'border-box' }}
                      placeholder={`Write ${course.codeLanguage} code here...`} />
                    {codeOut && (
                      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'12px 16px' }}>
                        <div style={{ fontSize:'10px', fontWeight:700, color:'#34d399', marginBottom:'5px', letterSpacing:'0.05em' }}>▶ OUTPUT</div>
                        <pre style={{ margin:0, fontFamily:'monospace', fontSize:'12px', color:codeErr?'#f87171':'#a7f3d0', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{codeOut}</pre>
                      </div>
                    )}
                  </div>
                  <button onClick={loadCode} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 13px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.08)', background:'none', color:'#334155', fontSize:'11px', cursor:'pointer', alignSelf:'flex-start' }}>
                    <RefreshCw size={11}/> New Example
                  </button>
                </>}
            </div>
          )}

          {/* BACKWARD */}
          {tab==='backward' && (
            <div style={{ animation:'fade-in 0.3s ease' }}>
              {traceLoading
                ? <div style={{ textAlign:'center', padding:'40px', color:'#334155' }}><div style={{ width:22,height:22,border:'2px solid #f87171',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px' }}/> Analyzing backward trace...</div>
                : <div style={{ background:'rgba(239,68,68,0.05)', borderRadius:'14px', border:'1px solid rgba(239,68,68,0.18)', padding:'22px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'16px' }}>
                    <div style={{ width:34,height:34,borderRadius:'9px',background:'rgba(239,68,68,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}><ArrowLeftRight size={15} style={{ color:'#f87171' }}/></div>
                    <div><div style={{ color:'#f87171', fontWeight:800, fontSize:'13px' }}>← Backward Tracing</div><div style={{ color:'#334155', fontSize:'10px' }}>How output was produced — traced in reverse</div></div>
                  </div>
                  <div style={{ color:'#e2e8f0', fontSize:'12px', lineHeight:1.85, whiteSpace:'pre-wrap' }}>{backward}</div>
                  <button onClick={loadTrace} style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'14px', padding:'6px 12px', borderRadius:'7px', border:'1px solid rgba(248,113,113,0.25)', background:'rgba(239,68,68,0.07)', color:'#f87171', fontSize:'11px', cursor:'pointer' }}><RefreshCw size={11}/> Regenerate</button>
                </div>}
            </div>
          )}

          {/* FORWARD */}
          {tab==='forward' && (
            <div style={{ animation:'fade-in 0.3s ease' }}>
              {traceLoading
                ? <div style={{ textAlign:'center', padding:'40px', color:'#334155' }}><div style={{ width:22,height:22,border:'2px solid #34d399',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px' }}/> Analyzing forward execution...</div>
                : <div style={{ background:'rgba(16,185,129,0.04)', borderRadius:'14px', border:'1px solid rgba(16,185,129,0.18)', padding:'22px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'16px' }}>
                    <div style={{ width:34,height:34,borderRadius:'9px',background:'rgba(16,185,129,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}><Zap size={15} style={{ color:'#34d399' }}/></div>
                    <div><div style={{ color:'#34d399', fontWeight:800, fontSize:'13px' }}>→ Forward Tracing</div><div style={{ color:'#334155', fontSize:'10px' }}>Step-by-step execution from start to end</div></div>
                  </div>
                  <div style={{ color:'#e2e8f0', fontSize:'12px', lineHeight:1.85, whiteSpace:'pre-wrap' }}>{forward}</div>
                  <button onClick={loadTrace} style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'14px', padding:'6px 12px', borderRadius:'7px', border:'1px solid rgba(52,211,153,0.25)', background:'rgba(16,185,129,0.07)', color:'#34d399', fontSize:'11px', cursor:'pointer' }}><RefreshCw size={11}/> Regenerate</button>
                </div>}
            </div>
          )}

          {/* QUIZ — 20 questions */}
          {tab==='quiz' && (
            <div style={{ animation:'fade-in 0.3s ease' }}>
              {quizLoading
                ? <div style={{ textAlign:'center', padding:'40px' }}><div style={{ fontSize:'36px', marginBottom:'12px' }}>🎯</div><div style={{ width:22,height:22,border:`2px solid ${ACC}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px' }}/><div style={{ color:'#334155', fontSize:'13px' }}>Generating 20 quiz questions...</div></div>
                : quizDone
                ? <div style={{ textAlign:'center', padding:'40px', background:'rgba(255,255,255,0.03)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize:'48px', marginBottom:'12px' }}>🏆</div>
                  <div style={{ color:'#fff', fontWeight:800, fontSize:'22px', marginBottom:'6px' }}>Quiz Complete!</div>
                  <div style={{ color:ACC, fontSize:'32px', fontWeight:900, margin:'16px 0' }}>{quizScore}/{quizAll.length*10} pts</div>
                  <div style={{ color:'#64748b', fontSize:'13px', marginBottom:'24px' }}>{quizScore>=quizAll.length*8?'Excellent! 🌟':quizScore>=quizAll.length*6?'Good job! 👍':'Keep practicing! 💪'}</div>
                  <button onClick={loadQuiz} style={{ padding:'10px 24px', borderRadius:'12px', border:'none', background:ACC, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>Retake Quiz</button>
                </div>
                : curQuiz && (
                  <div>
                    {/* Progress */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                        <Trophy size={14} style={{ color:'#f59e0b' }}/><span style={{ color:'#f59e0b', fontWeight:700, fontSize:'13px' }}>Score: {quizScore} pts</span>
                      </div>
                      <span style={{ color:'#334155', fontSize:'12px' }}>Question {quizIdx+1} of {quizAll.length}</span>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:'4px', height:'4px', overflow:'hidden', marginBottom:'20px' }}>
                      <div style={{ width:`${((quizIdx)/quizAll.length)*100}%`, height:'100%', background:ACC, transition:'width 0.4s' }} />
                    </div>

                    <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.08)', padding:'22px', marginBottom:'14px' }}>
                      <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'18px', lineHeight:1.55 }}>{curQuiz.q}</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                        {curQuiz.opts?.map((opt:string, i:number)=>{
                          const rev = selectedAns!==null;
                          const correct = i===curQuiz.ans;
                          const sel = selectedAns===i;
                          return (
                            <button key={i} onClick={()=>{ if(selectedAns!==null) return; setSelectedAns(i); if(correct) setQuizScore(s=>s+10); }}
                              style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 14px', borderRadius:'10px', border:rev?(correct?'1px solid rgba(52,211,153,0.5)':sel?'1px solid rgba(248,113,113,0.5)':'1px solid rgba(255,255,255,0.06)'):'1px solid rgba(255,255,255,0.08)', background:rev?(correct?'rgba(16,185,129,0.1)':sel?'rgba(239,68,68,0.09)':'rgba(255,255,255,0.02)'):'rgba(255,255,255,0.04)', color:rev?(correct?'#34d399':sel?'#f87171':'#334155'):'#94a3b8', cursor:rev?'default':'pointer', textAlign:'left', fontSize:'12px', fontWeight:500, transition:'all 0.15s' }}>
                              <span style={{ width:22,height:22,borderRadius:'50%',border:`2px solid ${rev?(correct?'#34d399':sel?'#f87171':'rgba(255,255,255,0.1)'):'rgba(255,255,255,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800,flexShrink:0,color:rev?(correct?'#34d399':sel?'#f87171':'#334155'):'#475569' }}>{String.fromCharCode(65+i)}</span>
                              {opt}
                              {rev && correct && <CheckCircle size={13} style={{ color:'#34d399', marginLeft:'auto' }}/>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedAns!==null && (
                      <div style={{ animation:'fade-in 0.3s ease' }}>
                        <div style={{ background:selectedAns===curQuiz.ans?'rgba(16,185,129,0.07)':'rgba(239,68,68,0.07)', borderRadius:'12px', border:`1px solid ${selectedAns===curQuiz.ans?'rgba(52,211,153,0.25)':'rgba(248,113,113,0.25)'}`, padding:'14px 16px', marginBottom:'12px' }}>
                          <div style={{ fontWeight:700, marginBottom:'5px', color:selectedAns===curQuiz.ans?'#34d399':'#f87171' }}>{selectedAns===curQuiz.ans?'✅ Correct! +10 pts':'❌ Not quite!'}</div>
                          <div style={{ fontSize:'12px', color:'#94a3b8', lineHeight:1.6 }}>{curQuiz.exp}</div>
                        </div>
                        <button onClick={()=>{ if(quizIdx+1>=quizAll.length) setQuizDone(true); else { setQuizIdx(i=>i+1); setSelectedAns(null); } }}
                          style={{ width:'100%', padding:'11px', borderRadius:'11px', border:'none', background:`linear-gradient(135deg,${ACC},${ACC}99)`, color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
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
            <div style={{ animation:'fade-in 0.3s ease' }}>
              {notesLoading
                ? <div style={{ textAlign:'center', padding:'40px' }}><div style={{ width:22,height:22,border:`2px solid ${ACC}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px' }}/><div style={{ color:'#334155', fontSize:'13px' }}>Generating notes...</div></div>
                : <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.07)', padding:'22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px' }}><FileText size={14} style={{ color:ACC }}/><span style={{ color:'#fff', fontWeight:800, fontSize:'13px' }}>Notes — {lesson}</span></div>
                    <button onClick={loadNotes} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 11px', borderRadius:'7px', border:'1px solid rgba(255,255,255,0.09)', background:'none', color:'#334155', fontSize:'11px', cursor:'pointer' }}><RefreshCw size={10}/> Refresh</button>
                  </div>
                  <div style={{ color:'#cbd5e1', fontSize:'12px', lineHeight:1.9, whiteSpace:'pre-wrap' }}>{notes}</div>
                </div>
              }
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT SIDEBAR — AI MENTOR ═══════════════════════════════ */}
      <div style={{ background:'#0b0f1a', borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ position:'relative' }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${ACC},${ACC}88)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',boxShadow:`0 0 12px ${ACC}44` }}>🤖</div>
            <div style={{ position:'absolute', bottom:0, right:0, width:9, height:9, borderRadius:'50%', background:'#34d399', border:'2px solid #0b0f1a' }} />
          </div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:'12px' }}>AI Mentor</div>
            <div style={{ color:'#34d399', fontSize:'10px' }}>● Online</div>
          </div>
        </div>

        {/* Quick */}
        <div style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:'10px', color:'#1e293b', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'6px' }}>Quick Questions</div>
          {QUICK.map((q,i)=>(
            <button key={i} className="qq" onClick={()=>sendMentor(q)}
              style={{ width:'100%', padding:'6px 9px', borderRadius:'7px', border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.03)', color:'#475569', fontSize:'10px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'3px', transition:'all 0.15s', lineHeight:1.4 }}>
              <span>{q}</span><ChevronRight size={9} style={{ flexShrink:0, marginLeft:'4px', color:'#1e293b' }}/>
            </button>
          ))}
        </div>

        {/* Voice */}
        <div style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:'10px', color:'#1e293b', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'7px' }}>Voice (English)</div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:'2px', height:'22px' }}>
              {waveBars.slice(0,8).map((h,i)=><div key={i} style={{ flex:1, background:speaking?ACC:'rgba(255,255,255,0.07)', borderRadius:'2px', height:`${speaking?h:3}px`, transition:'height 0.1s' }} />)}
            </div>
            <button onClick={toggleMic}
              style={{ width:40,height:40,borderRadius:'50%',border:'none',background:micOn?'linear-gradient(135deg,#ef4444,#dc2626)':`linear-gradient(135deg,${ACC},${ACC}99)`,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:micOn?'0 0 14px rgba(239,68,68,0.5)':`0 0 10px ${ACC}44` }}>
              {micOn?<MicOff size={15}/>:<Mic size={15}/>}
            </button>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:'2px', height:'22px' }}>
              {waveBars.slice(8,16).map((h,i)=><div key={i} style={{ flex:1, background:speaking?ACC:'rgba(255,255,255,0.07)', borderRadius:'2px', height:`${speaking?h:3}px`, transition:'height 0.1s' }} />)}
            </div>
          </div>
          <div style={{ textAlign:'center', fontSize:'10px', color:'#1e293b', marginTop:'4px' }}>{micOn?'🎤 Listening...':'Tap mic to speak'}</div>
        </div>

        {/* Chat */}
        <div style={{ fontSize:'10px', color:'#1e293b', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', padding:'8px 12px 3px' }}>Chat</div>
        <div style={{ flex:1, overflowY:'auto', padding:'0 10px 6px', display:'flex', flexDirection:'column', gap:'7px' }}>
          {mentorMsgs.map((m,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', animation:'fade-in 0.3s ease' }}>
              <div style={{ maxWidth:'88%', padding:'8px 11px', borderRadius:m.role==='user'?'13px 13px 2px 13px':'13px 13px 13px 2px', fontSize:'11px', lineHeight:1.55, background:m.role==='user'?`linear-gradient(135deg,${ACC},${ACC}99)`:'rgba(255,255,255,0.06)', color:m.role==='user'?'#fff':'#cbd5e1', border:m.role==='assistant'?'1px solid rgba(255,255,255,0.06)':undefined }}>
                {m.content}
              </div>
            </div>
          ))}
          {mentorLoading && (
            <div style={{ display:'flex', gap:'4px', padding:'8px 11px', width:'fit-content', borderRadius:'13px', background:'rgba(255,255,255,0.05)' }}>
              {[0,1,2].map(i=><div key={i} style={{ width:5,height:5,borderRadius:'50%',background:'#475569',animation:`bounce 0.8s ${i*0.15}s infinite` }} />)}
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'6px' }}>
          <input value={mentorInput} onChange={e=>setMentorInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMentor()}
            placeholder="Ask anything..." style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'9px', padding:'7px 11px', color:'#fff', fontSize:'11px', outline:'none' }} />
          <button onClick={()=>sendMentor()} disabled={!mentorInput.trim()||mentorLoading}
            style={{ width:32,height:32,borderRadius:'9px',border:'none',background:mentorInput.trim()?ACC:'rgba(255,255,255,0.05)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:(!mentorInput.trim()||mentorLoading)?0.4:1,transition:'all 0.2s',flexShrink:0 }}>
            <Send size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Certificate Gate ─────────────────────────────────────────────
function CertificateGate({ onUnlocked }: { onUnlocked: () => void }) {
  const { student } = useInstStudentStore();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instStudentApi.getCertificates()
      .then(r => {
        setCerts(r.data || []);
        if ((r.data || []).length > 0) onUnlocked();
      })
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080b12', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'#64748b', fontFamily:'system-ui' }}>Checking access...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#080b12', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif', padding:'24px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
      <div style={{ maxWidth:'480px', width:'100%', textAlign:'center' }}>
        {/* Lock icon */}
        <div style={{ width:100, height:100, borderRadius:'50%', background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.1))', border:'2px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', animation:'float 3s ease infinite' }}>
          <Lock size={40} style={{ color:'#6366f1' }} />
        </div>

        <h1 style={{ fontSize:'28px', fontWeight:900, color:'#fff', margin:'0 0 12px' }}>🔒 Academy Locked</h1>
        <p style={{ color:'#64748b', fontSize:'15px', lineHeight:1.7, margin:'0 0 28px' }}>
          AI Academy is only available to students who have <strong style={{ color:'#f59e0b' }}>completed their institution course</strong> and received a certificate.
        </p>

        {/* Requirements */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'20px', marginBottom:'24px', textAlign:'left' }}>
          <p style={{ color:'#94a3b8', fontSize:'13px', fontWeight:700, marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Requirements</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              ['✅ Enroll in a batch', 'Done — you are enrolled'],
              ['📚 Complete the course', 'Attend all classes'],
              ['🏆 Receive certificate', 'Institution admin issues it'],
              ['🎓 Access AI Academy', 'Unlocks automatically!'],
            ].map(([step, desc], i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <span style={{ fontSize:'16px', flexShrink:0 }}>{step.split(' ')[0]}</span>
                <div>
                  <p style={{ color: i < 1 ? '#34d399' : '#94a3b8', fontSize:'13px', fontWeight:600, margin:0 }}>{step.slice(2)}</p>
                  <p style={{ color:'#475569', fontSize:'11px', margin:0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color:'#334155', fontSize:'12px' }}>
          Contact your institution admin if you believe you should have access.
        </p>

        {student && (
          <p style={{ color:'#475569', fontSize:'12px', marginTop:'8px' }}>
            Logged in as: <strong style={{ color:'#6366f1' }}>{student.careerId}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

export function AcademyPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [course, setCourse] = useState<any>(null);

  if (!unlocked) return <CertificateGate onUnlocked={() => setUnlocked(true)} />;
  if (course) return <LessonPage course={course} onBack={()=>setCourse(null)} />;
  return <Catalog onSelect={setCourse} />;
}