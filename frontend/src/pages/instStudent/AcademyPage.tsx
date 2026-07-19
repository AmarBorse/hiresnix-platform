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

// ── Video + Timestamp Map ─────────────────────────────────────────
// Format: [videoId, startSeconds]
const VID: Record<string,[string,number]> = {
  // PYTHON — CodeWithHarry (UrsmFxEIp5k) - Simple Hindi/English mix
  "What is Python?":          ["UrsmFxEIp5k",0],
  "Setting Up Python":        ["UrsmFxEIp5k",300],
  "Your First Program":       ["UrsmFxEIp5k",600],
  "Variables & Data Types":   ["UrsmFxEIp5k",1200],
  "Type Conversion":          ["UrsmFxEIp5k",2400],
  "Arithmetic Operators":     ["UrsmFxEIp5k",3000],
  "Comparison Operators":     ["UrsmFxEIp5k",3600],
  "Logical Operators":        ["UrsmFxEIp5k",4200],
  "If-Else Statements":       ["UrsmFxEIp5k",4800],
  "For Loops":                ["UrsmFxEIp5k",6000],
  "While Loops":              ["UrsmFxEIp5k",7200],
  "Break & Continue":         ["UrsmFxEIp5k",8400],
  "Functions":                ["UrsmFxEIp5k",9600],
  "Parameters & Return":      ["UrsmFxEIp5k",10800],
  "Lambda Functions":         ["UrsmFxEIp5k",12000],
  "Recursion":                ["UrsmFxEIp5k",13200],
  "Decorators":               ["UrsmFxEIp5k",14400],
  "Lists":                    ["UrsmFxEIp5k",15600],
  "Tuples":                   ["UrsmFxEIp5k",16800],
  "Dictionaries":             ["UrsmFxEIp5k",18000],
  "Sets":                     ["UrsmFxEIp5k",19200],
  "List Comprehensions":      ["UrsmFxEIp5k",20400],
  "String Methods":           ["UrsmFxEIp5k",21600],
  "File Handling":            ["UrsmFxEIp5k",22800],
  "Exception Handling":       ["UrsmFxEIp5k",24000],
  "Classes & Objects":        ["UrsmFxEIp5k",25200],
  "Inheritance":              ["UrsmFxEIp5k",27600],
  "Encapsulation":            ["UrsmFxEIp5k",28800],
  "Polymorphism":             ["UrsmFxEIp5k",30000],
  "Modules & Packages":       ["UrsmFxEIp5k",31200],
  "pip & Libraries":          ["UrsmFxEIp5k",32400],
  "Generators":               ["UrsmFxEIp5k",33600],
  "Regular Expressions":      ["UrsmFxEIp5k",34800],
  "Multithreading":           ["UrsmFxEIp5k",36000],
  "Virtual Environment":      ["UrsmFxEIp5k",37200],
  "Python JSON":              ["UrsmFxEIp5k",38400],
  "Python API Calls":         ["UrsmFxEIp5k",39600],
  "Python Testing":           ["UrsmFxEIp5k",40800],
  "Build a Calculator":       ["UrsmFxEIp5k",42000],
  "Build a To-Do App":        ["UrsmFxEIp5k",43200],
  "Build a Quiz Game":        ["UrsmFxEIp5k",44400],
  "Build a Web Scraper":      ["UrsmFxEIp5k",45600],
  "Final Python Project":     ["UrsmFxEIp5k",46800],

  // JAVASCRIPT — freeCodeCamp 7hr (PkZNo7MFNFg)
  "What is JavaScript?":      ["PkZNo7MFNFg",0],
  "Variables (let/const/var)":["PkZNo7MFNFg",300],
  "JS Data Types":            ["PkZNo7MFNFg",900],
  "Template Literals":        ["PkZNo7MFNFg",1500],
  "JS Functions":             ["PkZNo7MFNFg",2400],
  "Arrow Functions":          ["PkZNo7MFNFg",3000],
  "Arrays":                   ["PkZNo7MFNFg",3600],
  "Objects":                  ["PkZNo7MFNFg",5400],
  "Destructuring":            ["PkZNo7MFNFg",7200],
  "Spread & Rest":            ["PkZNo7MFNFg",8100],
  "DOM Manipulation":         ["PkZNo7MFNFg",10800],
  "Event Listeners":          ["PkZNo7MFNFg",12600],
  "Fetch API":                ["PkZNo7MFNFg",16200],
  "Promises":                 ["PkZNo7MFNFg",14400],
  "Async Await":              ["PkZNo7MFNFg",18000],
  "Error Handling":           ["PkZNo7MFNFg",19800],
  "ES6+ Features":            ["PkZNo7MFNFg",21600],
  "Local Storage":            ["PkZNo7MFNFg",23400],
  "Build a Todo App (JS)":    ["PkZNo7MFNFg",25200],
  "Build a Weather App":      ["PkZNo7MFNFg",27000],
  "Final JS Project":         ["PkZNo7MFNFg",28800],

  // JAVA — freeCodeCamp 9hr (grEKMHGYyns)
  "What is Java?":            ["grEKMHGYyns",0],
  "Java Setup & Hello World": ["grEKMHGYyns",240],
  "Java Variables":           ["grEKMHGYyns",900],
  "Java Data Types":          ["grEKMHGYyns",1800],
  "Java Operators":           ["grEKMHGYyns",3600],
  "Java If-Else":             ["grEKMHGYyns",5400],
  "Java Loops":               ["grEKMHGYyns",7200],
  "Java Arrays":              ["grEKMHGYyns",9000],
  "Java Methods":             ["grEKMHGYyns",10800],
  "Java OOP - Classes":       ["grEKMHGYyns",12600],
  "Java Inheritance":         ["grEKMHGYyns",14400],
  "Java Polymorphism":        ["grEKMHGYyns",16200],
  "Java Interfaces":          ["grEKMHGYyns",18000],
  "Java Exception Handling":  ["grEKMHGYyns",19800],
  "Java Collections":         ["grEKMHGYyns",21600],
  "Java Generics":            ["grEKMHGYyns",23400],
  "Java File I/O":            ["grEKMHGYyns",25200],
  "Java Threads":             ["grEKMHGYyns",27000],
  "Java Streams":             ["grEKMHGYyns",28800],
  "Java Lambda":              ["grEKMHGYyns",30600],
  "Build a Bank App":         ["grEKMHGYyns",32400],
  "Build a Student DB":       ["grEKMHGYyns",32400],
  "Final Java Project":       ["grEKMHGYyns",32400],

  // C++ — freeCodeCamp 4hr (8jLOx1hD3_o)
  "What is C++?":             ["8jLOx1hD3_o",0],
  "C++ Setup":                ["8jLOx1hD3_o",300],
  "C++ Variables":            ["8jLOx1hD3_o",900],
  "C++ Data Types":           ["8jLOx1hD3_o",1800],
  "C++ Operators":            ["8jLOx1hD3_o",2700],
  "C++ If-Else":              ["8jLOx1hD3_o",3600],
  "C++ Loops":                ["8jLOx1hD3_o",4800],
  "C++ Arrays":               ["8jLOx1hD3_o",6000],
  "C++ Functions":            ["8jLOx1hD3_o",7200],
  "C++ Pointers":             ["8jLOx1hD3_o",8400],
  "C++ References":           ["8jLOx1hD3_o",9600],
  "C++ OOP":                  ["8jLOx1hD3_o",10800],
  "C++ Inheritance":          ["8jLOx1hD3_o",11400],
  "C++ Polymorphism":         ["8jLOx1hD3_o",12000],
  "C++ STL":                  ["8jLOx1hD3_o",12600],
  "C++ File Handling":        ["8jLOx1hD3_o",13200],
  "Build a Calculator (C++)": ["8jLOx1hD3_o",13800],
  "Final C++ Project":        ["8jLOx1hD3_o",13800],

  // DSA — freeCodeCamp (pkYVOmU3MgA)
  "Arrays & Big O":           ["pkYVOmU3MgA",0],
  "Two Pointers":             ["pkYVOmU3MgA",1800],
  "Sliding Window":           ["pkYVOmU3MgA",3600],
  "Prefix Sum":               ["pkYVOmU3MgA",5400],
  "Strings":                  ["pkYVOmU3MgA",7200],
  "Linked List":              ["pkYVOmU3MgA",9000],
  "Stack":                    ["pkYVOmU3MgA",12600],
  "Queue":                    ["pkYVOmU3MgA",14400],
  "Binary Tree":              ["pkYVOmU3MgA",18000],
  "BST":                      ["pkYVOmU3MgA",21600],
  "Heap":                     ["pkYVOmU3MgA",25200],
  "Graphs":                   ["pkYVOmU3MgA",28800],
  "Bubble Sort":              ["pkYVOmU3MgA",32400],
  "Merge Sort":               ["pkYVOmU3MgA",34200],
  "Quick Sort":               ["pkYVOmU3MgA",36000],
  "Binary Search":            ["pkYVOmU3MgA",37800],
  "Dynamic Programming":      ["pkYVOmU3MgA",39600],
  "Greedy Algorithms":        ["pkYVOmU3MgA",43200],
  "Backtracking":             ["pkYVOmU3MgA",46800],

  // SQL — freeCodeCamp (HXV3zeQKqGY)
  "What is SQL?":             ["HXV3zeQKqGY",0],
  "SELECT & FROM":            ["HXV3zeQKqGY",600],
  "WHERE & AND/OR":           ["HXV3zeQKqGY",1800],
  "ORDER BY & LIMIT":         ["HXV3zeQKqGY",3000],
  "INSERT UPDATE DELETE":     ["HXV3zeQKqGY",5400],
  "JOINS":                    ["HXV3zeQKqGY",9000],
  "GROUP BY & HAVING":        ["HXV3zeQKqGY",12600],
  "Subqueries":               ["HXV3zeQKqGY",16200],
  "Window Functions":         ["HXV3zeQKqGY",19800],
  "Indexes":                  ["HXV3zeQKqGY",23400],
  "Views & CTEs":             ["HXV3zeQKqGY",25200],
  "Transactions":             ["HXV3zeQKqGY",27000],
  "Stored Procedures":        ["HXV3zeQKqGY",28800],
  "SQL Project":              ["HXV3zeQKqGY",30600],

  // WEB DEV
  "HTML Basics":              ["mU6anWqZJcc",0],
  "HTML Forms":               ["mU6anWqZJcc",3600],
  "Semantic HTML":            ["mU6anWqZJcc",7200],
  "CSS Basics":               ["OXGznpKZ_sA",0],
  "Box Model":                ["OXGznpKZ_sA",3600],
  "Flexbox":                  ["OXGznpKZ_sA",7200],
  "CSS Grid":                 ["OXGznpKZ_sA",10800],
  "Responsive Design":        ["OXGznpKZ_sA",14400],
  "JavaScript for Web":       ["PkZNo7MFNFg",0],
  "DOM & Events":             ["PkZNo7MFNFg",10800],
  "What is React?":           ["bMknfKXIFA8",0],
  "React Components":         ["bMknfKXIFA8",1800],
  "React Props & State":      ["bMknfKXIFA8",5400],
  "React Hooks":              ["bMknfKXIFA8",9000],
  "React Router":             ["bMknfKXIFA8",12600],
  "API Integration":          ["bMknfKXIFA8",16200],
  "MongoDB Basics":           ["ofme2o29wY8",0],
  "Build Full Stack App":     ["nu_pCVPKzTk",0],
  "Deploy Your App":          ["nu_pCVPKzTk",7200],

  // C PROGRAMMING — freeCodeCamp C full course (B31LgI4Y4DQ)
  "What is C?":               ["B31LgI4Y4DQ",0],
  "C Setup":                  ["B31LgI4Y4DQ",300],
  "Variables in C":           ["B31LgI4Y4DQ",900],
  "Data Types in C":          ["B31LgI4Y4DQ",1800],
  "Operators in C":           ["B31LgI4Y4DQ",2700],
  "If-Else in C":             ["B31LgI4Y4DQ",3600],
  "Loops in C":               ["B31LgI4Y4DQ",5400],
  "Switch Statement":         ["B31LgI4Y4DQ",7200],
  "Break & Continue in C":    ["B31LgI4Y4DQ",8100],
  "Functions in C":           ["B31LgI4Y4DQ",9000],
  "Arrays in C":              ["B31LgI4Y4DQ",10800],
  "Strings in C":             ["B31LgI4Y4DQ",12600],
  "Pointers in C":            ["B31LgI4Y4DQ",14400],
  "Structures in C":          ["B31LgI4Y4DQ",18000],
  "File Handling in C":       ["B31LgI4Y4DQ",21600],
  "Dynamic Memory":           ["B31LgI4Y4DQ",25200],
  "C Programs":               ["B31LgI4Y4DQ",28800],

  // GIT & GITHUB — freeCodeCamp Git full course (zTjRZNkhiEU)
  "What is Git?":             ["zTjRZNkhiEU",0],
  "Git Installation":         ["zTjRZNkhiEU",600],
  "Git Branches":             ["zTjRZNkhiEU",3600],
  "Git Merge & Rebase":       ["zTjRZNkhiEU",7200],
  "GitHub Remote":            ["zTjRZNkhiEU",9000],
  "Pull Requests":            ["zTjRZNkhiEU",10800],

  // DOCKER & DEVOPS — Docker Crash Course (pg19Z8LL06w) - simple beginner friendly
  "What is Docker?":          ["pg19Z8LL06w",0],
  "Docker Containers":        ["pg19Z8LL06w",600],
  "Docker Images":            ["pg19Z8LL06w",1800],
  "Dockerfile":               ["pg19Z8LL06w",3600],
  "Docker Compose":           ["pg19Z8LL06w",5400],
  "CI/CD Basics":             ["Wf2eSG3owoA",0],
  "Kubernetes Intro":         ["Wf2eSG3owoA",3600],

  // MACHINE LEARNING — freeCodeCamp ML (bmmQA8A-yUA)
  "What is Machine Learning?":["bmmQA8A-yUA",0],
  "ML Roadmap":               ["bmmQA8A-yUA",300],
  "Supervised Learning":      ["bmmQA8A-yUA",1800],
  "Unsupervised Learning":    ["bmmQA8A-yUA",5400],
  "Linear Regression":        ["bmmQA8A-yUA",7200],
  "Classification":           ["bmmQA8A-yUA",9000],
  "Decision Trees":           ["bmmQA8A-yUA",10800],
  "Neural Networks Intro":    ["bmmQA8A-yUA",14400],
  "ML Project":               ["bmmQA8A-yUA",18000],

  // DATA SCIENCE — freeCodeCamp Data Science (r-uOLxNrNk8)
  "What is Data Science?":    ["r-uOLxNrNk8",0],
  "What is NumPy?":           ["r-uOLxNrNk8",1800],
  "NumPy Arrays":             ["r-uOLxNrNk8",3600],
  "What is Pandas?":          ["r-uOLxNrNk8",7200],
  "Pandas DataFrames":        ["r-uOLxNrNk8",9000],
  "Data Cleaning":            ["r-uOLxNrNk8",12600],
  "Data Visualization":       ["r-uOLxNrNk8",18000],
  "EDA Project":              ["r-uOLxNrNk8",21600],

  // NODE.JS & EXPRESS — freeCodeCamp Node (Oe421EPjeBE)
  "Node.js Basics":           ["Oe421EPjeBE",0],
  "Node Modules":             ["Oe421EPjeBE",1800],
  "Express.js":               ["Oe421EPjeBE",3600],
  "REST API":                 ["Oe421EPjeBE",7200],
  "Middleware":               ["Oe421EPjeBE",9000],
  "MongoDB & Mongoose":       ["Oe421EPjeBE",12600],
  "Authentication":           ["Oe421EPjeBE",16200],
  "Node Project":             ["Oe421EPjeBE",21600],

  // CYBERSECURITY — freeCodeCamp Ethical Hacking (3Kq1MIfTWCE)
  "What is Cybersecurity?":   ["3Kq1MIfTWCE",0],
  "Networking Basics":        ["3Kq1MIfTWCE",1800],
  "Linux for Security":       ["IkuPKJmhTi4",0],
  "Reconnaissance":           ["3Kq1MIfTWCE",5400],
  "Scanning & Enumeration":   ["3Kq1MIfTWCE",9000],
  "Web Hacking Basics":       ["3Kq1MIfTWCE",14400],
  "Password Attacks":         ["3Kq1MIfTWCE",18000],
  "Metasploit":               ["3Kq1MIfTWCE",21600],

  // FLUTTER & DART — freeCodeCamp (Ej_Pcr4uC2Q for Dart, pTJJsmejUOQ for Flutter)
  "What is Dart?":            ["Ej_Pcr4uC2Q",0],
  "Dart Variables":           ["Ej_Pcr4uC2Q",600],
  "Dart Functions":           ["Ej_Pcr4uC2Q",2400],
  "Dart OOP":                 ["Ej_Pcr4uC2Q",5400],
  "What is Flutter?":         ["pTJJsmejUOQ",0],
  "Flutter Widgets":          ["pTJJsmejUOQ",1800],
  "Flutter Layout":           ["pTJJsmejUOQ",5400],
  "Flutter State":            ["pTJJsmejUOQ",9000],
  "Flutter Navigation":       ["pTJJsmejUOQ",12600],
  "Flutter API":              ["pTJJsmejUOQ",16200],
  "Flutter App":              ["pTJJsmejUOQ",21600],

  // REACT extra
  "Context API":              ["bMknfKXIFA8",19800],
  "Java Functions":           ["grEKMHGYyns",10800],

  // JS extra lessons
  "Type Coercion":            ["PkZNo7MFNFg",800],
  "Scope & Hoisting":         ["PkZNo7MFNFg",2800],
  "Map & Set":                ["PkZNo7MFNFg",4200],
  "JSON":                     ["PkZNo7MFNFg",5000],
  "If-Else JS":               ["PkZNo7MFNFg",1200],
  "Switch Case":              ["PkZNo7MFNFg",1600],
  "For Loop JS":              ["PkZNo7MFNFg",2000],
  "While Loop JS":            ["PkZNo7MFNFg",2200],
  "Callbacks":                ["PkZNo7MFNFg",13000],
  "AJAX":                     ["PkZNo7MFNFg",16500],
  "Closures":                 ["PkZNo7MFNFg",19800],
  "Prototypes":               ["PkZNo7MFNFg",21600],
  "ES6 Classes":              ["PkZNo7MFNFg",23000],
  "Iterators & Generators":   ["PkZNo7MFNFg",24000],
  "Modules ES6":              ["PkZNo7MFNFg",25000],
  "Regular Expressions JS":   ["PkZNo7MFNFg",26000],
  "Build a Quiz App":         ["PkZNo7MFNFg",28000],
  "Session Storage":          ["PkZNo7MFNFg",23500],
  "Cookies":                  ["PkZNo7MFNFg",23800],

  // JAVA extra
  "Java Type Casting":        ["grEKMHGYyns",800],
  "Java Switch":              ["grEKMHGYyns",5800],
  "Java For Loop":            ["grEKMHGYyns",6200],
  "Java While Loop":          ["grEKMHGYyns",6800],
  "Java Strings":             ["grEKMHGYyns",9500],
  "Java Constructors":        ["grEKMHGYyns",13000],
  "Java Abstraction":         ["grEKMHGYyns",15000],
  "Java Encapsulation":       ["grEKMHGYyns",17000],
  "Java ArrayList":           ["grEKMHGYyns",22000],
  "Java HashMap":             ["grEKMHGYyns",23000],
  "Java Optional":            ["grEKMHGYyns",31000],

  // C++ extra
  "C++ Type Casting":         ["8jLOx1hD3_o",1600],
  "C++ Switch":               ["8jLOx1hD3_o",4000],
  "C++ For Loop":             ["8jLOx1hD3_o",4400],
  "C++ While Loop":           ["8jLOx1hD3_o",4600],
  "C++ Break & Continue":     ["8jLOx1hD3_o",5000],
  "C++ Recursion":            ["8jLOx1hD3_o",7600],
  "C++ Multi-dimensional Arrays":["8jLOx1hD3_o",6200],
  "C++ Vectors":              ["8jLOx1hD3_o",6500],
  "C++ Dynamic Memory":       ["8jLOx1hD3_o",9200],
  "C++ Smart Pointers":       ["8jLOx1hD3_o",9800],
  "C++ Constructors":         ["8jLOx1hD3_o",11000],
  "C++ Abstraction":          ["8jLOx1hD3_o",11600],
  "C++ Encapsulation":        ["8jLOx1hD3_o",11800],
  "C++ Templates":            ["8jLOx1hD3_o",12800],
  "C++ Exception Handling":   ["8jLOx1hD3_o",13000],
  "C++ Lambda":               ["8jLOx1hD3_o",13400],
  "C++ Threads":              ["8jLOx1hD3_o",13600],
  "Build a Student System":   ["8jLOx1hD3_o",13900],

  // C extra
  "Type Casting in C":        ["B31LgI4Y4DQ",2200],
  "Input Output in C":        ["B31LgI4Y4DQ",1600],
  "For Loop in C":            ["B31LgI4Y4DQ",4800],
  "While Loop in C":          ["B31LgI4Y4DQ",5000],
  "Do While Loop":            ["B31LgI4Y4DQ",5200],
  "Goto in C":                ["B31LgI4Y4DQ",5600],
  "Recursion in C":           ["B31LgI4Y4DQ",9400],
  "Multi-dimensional Arrays": ["B31LgI4Y4DQ",11000],
  "String Functions":         ["B31LgI4Y4DQ",13000],
  "Pointer Arithmetic":       ["B31LgI4Y4DQ",14800],
  "Pointer to Array":         ["B31LgI4Y4DQ",15200],
  "Memory Leaks":             ["B31LgI4Y4DQ",26000],
  "Unions in C":              ["B31LgI4Y4DQ",19000],
  "Enums in C":               ["B31LgI4Y4DQ",20000],
  "Preprocessor Directives":  ["B31LgI4Y4DQ",23000],
  "Bitwise Operators":        ["B31LgI4Y4DQ",24000],
  "Build a Library System":   ["B31LgI4Y4DQ",29000],
  "Final C Project":          ["B31LgI4Y4DQ",30000],

  // DSA extra
  "Time Complexity":          ["pkYVOmU3MgA",400],
  "Space Complexity":         ["pkYVOmU3MgA",800],
  "Big O Cheatsheet":         ["pkYVOmU3MgA",1200],
  "Kadane Algorithm":         ["pkYVOmU3MgA",8000],
  "Doubly Linked List":       ["pkYVOmU3MgA",10000],
  "Circular Linked List":     ["pkYVOmU3MgA",11000],
  "Floyd Cycle Detection":    ["pkYVOmU3MgA",11500],
  "Monotonic Stack":          ["pkYVOmU3MgA",13000],
  "Deque":                    ["pkYVOmU3MgA",14000],
  "Priority Queue":           ["pkYVOmU3MgA",14200],
  "AVL Tree":                 ["pkYVOmU3MgA",20000],
  "Trie":                     ["pkYVOmU3MgA",23000],
  "BFS":                      ["pkYVOmU3MgA",29500],
  "DFS":                      ["pkYVOmU3MgA",30500],
  "Dijkstra Algorithm":       ["pkYVOmU3MgA",31500],
  "Topological Sort":         ["pkYVOmU3MgA",33000],
  "Union Find":               ["pkYVOmU3MgA",34000],
  "Selection Sort":           ["pkYVOmU3MgA",33500],
  "Insertion Sort":           ["pkYVOmU3MgA",33800],
  "Heap Sort":                ["pkYVOmU3MgA",35000],
  "Memoization":              ["pkYVOmU3MgA",40000],
  "Tabulation":               ["pkYVOmU3MgA",41000],
  "Divide & Conquer":         ["pkYVOmU3MgA",45000],

  // SQL extra
  "Database Concepts":        ["HXV3zeQKqGY",200],
  "Tables & Schema":          ["HXV3zeQKqGY",400],
  "DISTINCT & ALIASES":       ["HXV3zeQKqGY",1400],
  "NULL Values":              ["HXV3zeQKqGY",2400],
  "LIKE & Wildcards":         ["HXV3zeQKqGY",2800],
  "IN & BETWEEN":             ["HXV3zeQKqGY",3200],
  "Aggregate Functions":      ["HXV3zeQKqGY",4000],
  "INNER JOIN":               ["HXV3zeQKqGY",9200],
  "LEFT JOIN":                ["HXV3zeQKqGY",9600],
  "RIGHT JOIN":               ["HXV3zeQKqGY",10000],
  "FULL JOIN":                ["HXV3zeQKqGY",10400],
  "Self Join":                ["HXV3zeQKqGY",10800],
  "Cross Join":               ["HXV3zeQKqGY",11200],
  "ROW NUMBER":               ["HXV3zeQKqGY",20200],
  "RANK & DENSE RANK":        ["HXV3zeQKqGY",20800],
  "LAG & LEAD":               ["HXV3zeQKqGY",21400],
  "ACID Properties":          ["HXV3zeQKqGY",27500],
  "Triggers":                 ["HXV3zeQKqGY",29500],
  "Normalization":            ["HXV3zeQKqGY",30000],

  // WebDev extra
  "HTML Tags":                ["mU6anWqZJcc",600],
  "HTML Tables":              ["mU6anWqZJcc",1800],
  "HTML5 Features":           ["mU6anWqZJcc",5400],
  "Accessibility":            ["mU6anWqZJcc",7000],
  "Selectors":                ["OXGznpKZ_sA",600],
  "Animations":               ["OXGznpKZ_sA",12000],
  "CSS Variables":            ["OXGznpKZ_sA",13000],
  "Sass Basics":              ["OXGznpKZ_sA",15000],
  "Form Validation":          ["PkZNo7MFNFg",11000],
  "React Setup":              ["bMknfKXIFA8",400],
  "JSX":                      ["bMknfKXIFA8",1200],
  "Props":                    ["bMknfKXIFA8",2400],
  "State":                    ["bMknfKXIFA8",3600],
  "Event Handling":           ["bMknfKXIFA8",4800],
  "Redux Basics":             ["bMknfKXIFA8",21000],
  "Mongoose":                 ["Oe421EPjeBE",14000],
  "JWT Tokens":               ["Oe421EPjeBE",17000],
  "Environment Variables":    ["Oe421EPjeBE",19000],
  "CORS & Security":          ["Oe421EPjeBE",20000],
  "Git & GitHub":             ["zTjRZNkhiEU",0],

  // React extra
  "useState":                 ["bMknfKXIFA8",9000],
  "useEffect":                ["bMknfKXIFA8",10000],
  "useRef":                   ["bMknfKXIFA8",11000],
  "useContext":               ["bMknfKXIFA8",12000],
  "useMemo":                  ["bMknfKXIFA8",13000],
  "useCallback":              ["bMknfKXIFA8",14000],
  "Custom Hooks":             ["bMknfKXIFA8",15000],
  "Nested Routes":            ["bMknfKXIFA8",16000],
  "Zustand":                  ["bMknfKXIFA8",22000],
  "Error Boundaries":         ["bMknfKXIFA8",23000],
  "React Performance":        ["bMknfKXIFA8",24000],
  "Code Splitting":           ["bMknfKXIFA8",25000],
  "React Testing":            ["bMknfKXIFA8",26000],
  "TypeScript with React":    ["bMknfKXIFA8",27000],
  "Build an E-commerce UI":   ["bMknfKXIFA8",28000],
  "Final React Project":      ["bMknfKXIFA8",29000],

  // Node extra
  "Node File System":         ["Oe421EPjeBE",1200],
  "Node Events":              ["Oe421EPjeBE",1800],
  "Node Streams":             ["Oe421EPjeBE",2400],
  "Node HTTP":                ["Oe421EPjeBE",3000],
  "Express Routing":          ["Oe421EPjeBE",4200],
  "Request & Response":       ["Oe421EPjeBE",4800],
  "Error Handling Middleware":["Oe421EPjeBE",5400],
  "Template Engines":         ["Oe421EPjeBE",6000],
  "CRUD Operations":          ["Oe421EPjeBE",7800],
  "Schema & Models":          ["Oe421EPjeBE",13200],
  "Password Hashing":         ["Oe421EPjeBE",16000],
  "CORS":                     ["Oe421EPjeBE",18000],
  "Rate Limiting":            ["Oe421EPjeBE",18500],
  "File Upload":              ["Oe421EPjeBE",19000],
  "WebSockets":               ["Oe421EPjeBE",20000],
  "Node Caching":             ["Oe421EPjeBE",20500],

  // Data Science extra
  "Python for Data Science":  ["r-uOLxNrNk8",300],
  "Jupyter Notebook":         ["r-uOLxNrNk8",900],
  "Math for DS":              ["r-uOLxNrNk8",1200],
  "Array Operations":         ["r-uOLxNrNk8",2400],
  "Array Indexing":           ["r-uOLxNrNk8",3000],
  "NumPy Math":               ["r-uOLxNrNk8",3600],
  "Broadcasting":             ["r-uOLxNrNk8",4200],
  "Pandas Series":            ["r-uOLxNrNk8",7500],
  "Reading CSV & Excel":      ["r-uOLxNrNk8",8200],
  "Data Selection":           ["r-uOLxNrNk8",8800],
  "Merging & Grouping":       ["r-uOLxNrNk8",10800],
  "Matplotlib Basics":        ["r-uOLxNrNk8",14400],
  "Line & Bar Charts":        ["r-uOLxNrNk8",15000],
  "Scatter Plot":             ["r-uOLxNrNk8",15600],
  "Histogram":                ["r-uOLxNrNk8",16200],
  "Seaborn Basics":           ["r-uOLxNrNk8",16800],
  "Descriptive Statistics":   ["r-uOLxNrNk8",19200],
  "Probability Basics":       ["r-uOLxNrNk8",19800],
  "Normal Distribution":      ["r-uOLxNrNk8",20400],
  "Hypothesis Testing":       ["r-uOLxNrNk8",21000],
  "Correlation":              ["r-uOLxNrNk8",21200],
  "Sales Data Analysis":      ["r-uOLxNrNk8",22000],
  "Covid Data Analysis":      ["r-uOLxNrNk8",23000],
  "Final DS Project":         ["r-uOLxNrNk8",24000],

  // ML extra
  "Types of ML":              ["bmmQA8A-yUA",600],
  "Math for ML":              ["bmmQA8A-yUA",1200],
  "Python for ML":            ["bmmQA8A-yUA",1500],
  "Data Preprocessing":       ["bmmQA8A-yUA",1700],
  "Logistic Regression":      ["bmmQA8A-yUA",8000],
  "Random Forest":            ["bmmQA8A-yUA",9500],
  "SVM":                      ["bmmQA8A-yUA",10000],
  "KNN":                      ["bmmQA8A-yUA",10500],
  "Naive Bayes":              ["bmmQA8A-yUA",11000],
  "K-Means Clustering":       ["bmmQA8A-yUA",12000],
  "Hierarchical Clustering":  ["bmmQA8A-yUA",12600],
  "PCA":                      ["bmmQA8A-yUA",13200],
  "Dimensionality Reduction": ["bmmQA8A-yUA",13800],
  "Activation Functions":     ["bmmQA8A-yUA",14800],
  "Backpropagation":          ["bmmQA8A-yUA",15400],
  "CNN Basics":               ["bmmQA8A-yUA",16000],
  "RNN Basics":               ["bmmQA8A-yUA",16600],
  "Transfer Learning":        ["bmmQA8A-yUA",17200],
  "Train Test Split":         ["bmmQA8A-yUA",18200],
  "Cross Validation":         ["bmmQA8A-yUA",18800],
  "Overfitting & Underfitting":["bmmQA8A-yUA",19400],
  "Hyperparameter Tuning":    ["bmmQA8A-yUA",20000],
  "Model Evaluation":         ["bmmQA8A-yUA",20600],
  "Confusion Matrix":         ["bmmQA8A-yUA",21200],
  "House Price Prediction":   ["bmmQA8A-yUA",21800],
  "Image Classification":     ["bmmQA8A-yUA",22400],
  "Sentiment Analysis":       ["bmmQA8A-yUA",23000],

  // Git extra
  "Git Config":               ["zTjRZNkhiEU",200],
  "Git Init":                 ["zTjRZNkhiEU",500],
  "Git Status":               ["zTjRZNkhiEU",800],
  "Git Add & Commit":         ["zTjRZNkhiEU",1200],
  "Git Log":                  ["zTjRZNkhiEU",1800],
  "Git Diff":                 ["zTjRZNkhiEU",2400],
  "Create & Switch Branch":   ["zTjRZNkhiEU",4200],
  "Merge Conflicts":          ["zTjRZNkhiEU",5400],
  "Git Stash":                ["zTjRZNkhiEU",6000],
  "Git Cherry Pick":          ["zTjRZNkhiEU",6600],
  "Git Push & Pull":          ["zTjRZNkhiEU",9400],
  "Git Clone":                ["zTjRZNkhiEU",10000],
  "Fork & Star":              ["zTjRZNkhiEU",10600],
  "Code Review":              ["zTjRZNkhiEU",11200],
  "GitHub Issues":            ["zTjRZNkhiEU",12000],
  "Git Reset & Revert":       ["zTjRZNkhiEU",13200],
  "Git Rebase Interactive":   ["zTjRZNkhiEU",14400],
  "Git Tags":                 ["zTjRZNkhiEU",15600],
  "Git Submodules":           ["zTjRZNkhiEU",16800],
  ".gitignore":               ["zTjRZNkhiEU",17400],
  "Git Hooks":                ["zTjRZNkhiEU",18000],
  "CI/CD with GitHub Actions":["zTjRZNkhiEU",19200],

  // Docker extra
  "Docker vs Virtual Machine":["pg19Z8LL06w",300],
  "Docker Installation":      ["pg19Z8LL06w",900],
  "Docker Hub":               ["pg19Z8LL06w",2800],
  "Docker Networking":        ["pg19Z8LL06w",4000],
  "Docker Volumes":           ["pg19Z8LL06w",4800],
  "Multi-Stage Build":        ["pg19Z8LL06w",6000],
  "Docker Security":          ["pg19Z8LL06w",6600],
  "Docker Logs":              ["pg19Z8LL06w",7200],
  "What is DevOps?":          ["Wf2eSG3owoA",300],
  "GitHub Actions":           ["Wf2eSG3owoA",1800],
  "Jenkins Intro":            ["Wf2eSG3owoA",2400],
  "CI/CD Pipeline":           ["Wf2eSG3owoA",3000],
  "Automated Testing":        ["Wf2eSG3owoA",3600],
  "Pods & Nodes":             ["Wf2eSG3owoA",4200],
  "Kubernetes Deployment":    ["Wf2eSG3owoA",5400],
  "Services & Ingress":       ["Wf2eSG3owoA",6600],
  "ConfigMaps":               ["Wf2eSG3owoA",7800],
  "Kubernetes Scaling":       ["Wf2eSG3owoA",9000],
  "Cloud Computing":          ["Wf2eSG3owoA",10200],
  "AWS Basics":               ["Wf2eSG3owoA",11400],
  "Google Cloud Basics":      ["Wf2eSG3owoA",12600],
  "Deploy with Docker":       ["pg19Z8LL06w",7800],

  // Cybersecurity extra
  "CIA Triad":                ["3Kq1MIfTWCE",300],
  "Types of Attacks":         ["3Kq1MIfTWCE",900],
  "OSI Model":                ["3Kq1MIfTWCE",2400],
  "TCP IP Model":             ["3Kq1MIfTWCE",3000],
  "DNS & HTTP":               ["3Kq1MIfTWCE",3600],
  "Passive Reconnaissance":   ["3Kq1MIfTWCE",4200],
  "Active Reconnaissance":    ["3Kq1MIfTWCE",4800],
  "OSINT Tools":              ["3Kq1MIfTWCE",5000],
  "Nmap Scanning":            ["3Kq1MIfTWCE",5200],
  "Vulnerability Assessment": ["3Kq1MIfTWCE",7200],
  "SQL Injection":            ["3Kq1MIfTWCE",12000],
  "XSS Attack":               ["3Kq1MIfTWCE",13200],
  "CSRF Attack":              ["3Kq1MIfTWCE",14400],
  "Directory Traversal":      ["3Kq1MIfTWCE",15600],
  "Buffer Overflow Basics":   ["3Kq1MIfTWCE",16800],
  "Hash Cracking":            ["3Kq1MIfTWCE",19200],
  "Privilege Escalation":     ["3Kq1MIfTWCE",20400],
  "Maintaining Access":       ["3Kq1MIfTWCE",21600],
  "Covering Tracks":          ["3Kq1MIfTWCE",22800],
  "Firewalls & IDS":          ["IkuPKJmhTi4",3600],
  "VPN & Proxy":              ["IkuPKJmhTi4",5400],
  "Encryption Basics":        ["IkuPKJmhTi4",7200],
  "SSL & TLS":                ["IkuPKJmhTi4",9000],
  "Kali Linux Tools":         ["IkuPKJmhTi4",10800],
  "Bug Bounty Basics":        ["3Kq1MIfTWCE",24000],
  "Cybersecurity Career":     ["3Kq1MIfTWCE",25200],

  // Flutter extra
  "Dart Setup":               ["Ej_Pcr4uC2Q",300],
  "Dart Data Types":          ["Ej_Pcr4uC2Q",900],
  "Dart Operators":           ["Ej_Pcr4uC2Q",1500],
  "Dart If-Else":             ["Ej_Pcr4uC2Q",2000],
  "Dart Loops":               ["Ej_Pcr4uC2Q",2600],
  "Dart Lists & Maps":        ["Ej_Pcr4uC2Q",3000],
  "Dart Classes":             ["Ej_Pcr4uC2Q",5600],
  "Dart Inheritance":         ["Ej_Pcr4uC2Q",6200],
  "Dart Mixins":              ["Ej_Pcr4uC2Q",6800],
  "Dart Abstract":            ["Ej_Pcr4uC2Q",7400],
  "Dart Generics":            ["Ej_Pcr4uC2Q",8000],
  "Dart Async & Futures":     ["Ej_Pcr4uC2Q",8600],
  "Flutter Setup":            ["pTJJsmejUOQ",300],
  "Stateless Widget":         ["pTJJsmejUOQ",2400],
  "Stateful Widget":          ["pTJJsmejUOQ",3600],
  "Row & Column":             ["pTJJsmejUOQ",6000],
  "Container & Stack":        ["pTJJsmejUOQ",7200],
  "Flutter Forms":            ["pTJJsmejUOQ",9600],
  "Flutter Lists":            ["pTJJsmejUOQ",10800],
  "Flutter Images":           ["pTJJsmejUOQ",12000],
  "Flutter Themes":           ["pTJJsmejUOQ",13200],
  "Flutter Animations":       ["pTJJsmejUOQ",14400],
  "Flutter State Management": ["pTJJsmejUOQ",15600],
  "Provider":                 ["pTJJsmejUOQ",16200],
  "Riverpod":                 ["pTJJsmejUOQ",16800],
  "HTTP Requests":            ["pTJJsmejUOQ",17400],
  "Flutter Firebase":         ["pTJJsmejUOQ",18600],
  "Local Storage Flutter":    ["pTJJsmejUOQ",19800],
  "Flutter Todo App":         ["pTJJsmejUOQ",21000],
  "Flutter Weather App":      ["pTJJsmejUOQ",22200],
};

// ── Hindi Video Map (CodeWithHarry) ──────────────────────────────
const VID_HI: Record<string,[string,number]> = {
  // PYTHON — CodeWithHarry Hindi full course (UrsmFxEIp5k)
  "What is Python?":          ["UrsmFxEIp5k",0],
  "Setting Up Python":        ["UrsmFxEIp5k",300],
  "Your First Program":       ["UrsmFxEIp5k",600],
  "Variables & Data Types":   ["UrsmFxEIp5k",1200],
  "Type Conversion":          ["UrsmFxEIp5k",2400],
  "Arithmetic Operators":     ["UrsmFxEIp5k",3000],
  "Comparison Operators":     ["UrsmFxEIp5k",3600],
  "Logical Operators":        ["UrsmFxEIp5k",4200],
  "If-Else Statements":       ["UrsmFxEIp5k",4800],
  "For Loops":                ["UrsmFxEIp5k",6000],
  "While Loops":              ["UrsmFxEIp5k",7200],
  "Break & Continue":         ["UrsmFxEIp5k",8400],
  "Functions":                ["UrsmFxEIp5k",9600],
  "Parameters & Return":      ["UrsmFxEIp5k",10800],
  "Lambda Functions":         ["UrsmFxEIp5k",12000],
  "Recursion":                ["UrsmFxEIp5k",13200],
  "Lists":                    ["UrsmFxEIp5k",14400],
  "Tuples":                   ["UrsmFxEIp5k",16800],
  "Dictionaries":             ["UrsmFxEIp5k",18000],
  "Sets":                     ["UrsmFxEIp5k",19200],
  "List Comprehensions":      ["UrsmFxEIp5k",20400],
  "String Methods":           ["UrsmFxEIp5k",21600],
  "File Handling":            ["UrsmFxEIp5k",22800],
  "Exception Handling":       ["UrsmFxEIp5k",24000],
  "Classes & Objects":        ["UrsmFxEIp5k",25200],
  "Inheritance":              ["UrsmFxEIp5k",27600],
  "Encapsulation":            ["UrsmFxEIp5k",28800],
  "Polymorphism":             ["UrsmFxEIp5k",30000],
  "Modules & Packages":       ["UrsmFxEIp5k",31200],
  "pip & Libraries":          ["UrsmFxEIp5k",32400],
  "Decorators":               ["UrsmFxEIp5k",33600],
  "Generators":               ["UrsmFxEIp5k",34800],
  "Regular Expressions":      ["UrsmFxEIp5k",36000],
  "Build a Calculator":       ["UrsmFxEIp5k",37200],
  "Build a To-Do App":        ["UrsmFxEIp5k",38400],
  "Build a Quiz Game":        ["UrsmFxEIp5k",39600],
  "Build a Web Scraper":      ["UrsmFxEIp5k",40800],
  "Final Python Project":     ["UrsmFxEIp5k",42000],

  // JAVASCRIPT — CodeWithHarry Hindi JS series (ER9SspLe4Hg)
  "What is JavaScript?":      ["ER9SspLe4Hg",0],
  "Variables (let/const/var)":["Q4p8vRQX8uY",0],
  "JS Data Types":            ["ER9SspLe4Hg",1800],
  "Template Literals":        ["ER9SspLe4Hg",2400],
  "JS Functions":             ["ER9SspLe4Hg",3600],
  "Arrow Functions":          ["ER9SspLe4Hg",5400],
  "Arrays":                   ["a_Bz5ciBHQ0",0],
  "Objects":                  ["ER9SspLe4Hg",7200],
  "Destructuring":            ["ER9SspLe4Hg",9000],
  "Spread & Rest":            ["ER9SspLe4Hg",10800],
  "DOM Manipulation":         ["ER9SspLe4Hg",14400],
  "Event Listeners":          ["rFq0HVOdDo4",0],
  "Fetch API":                ["ER9SspLe4Hg",18000],
  "Promises":                 ["ER9SspLe4Hg",19800],
  "Async Await":              ["ER9SspLe4Hg",21600],
  "Error Handling":           ["ER9SspLe4Hg",23400],
  "ES6+ Features":            ["ER9SspLe4Hg",25200],
  "Local Storage":            ["ER9SspLe4Hg",27000],
  "Build a Todo App (JS)":    ["ER9SspLe4Hg",28800],
  "Build a Weather App":      ["ER9SspLe4Hg",30600],
  "Final JS Project":         ["ER9SspLe4Hg",32400],

  // JAVA — CodeWithHarry Hindi (rV_3Lewxx6o)
  "What is Java?":            ["rV_3Lewxx6o",0],
  "Java Setup & Hello World": ["rV_3Lewxx6o",300],
  "Java Variables":           ["rV_3Lewxx6o",900],
  "Java Data Types":          ["rV_3Lewxx6o",1800],
  "Java Operators":           ["rV_3Lewxx6o",3600],
  "Java If-Else":             ["rV_3Lewxx6o",5400],
  "Java Loops":               ["rV_3Lewxx6o",7200],
  "Java Arrays":              ["rV_3Lewxx6o",9000],
  "Java Methods":             ["rV_3Lewxx6o",10800],
  "Java OOP - Classes":       ["rV_3Lewxx6o",12600],
  "Java Inheritance":         ["rV_3Lewxx6o",14400],
  "Java Polymorphism":        ["rV_3Lewxx6o",16200],
  "Java Interfaces":          ["rV_3Lewxx6o",18000],
  "Java Exception Handling":  ["rV_3Lewxx6o",19800],
  "Java Collections":         ["rV_3Lewxx6o",21600],
  "Java Generics":            ["rV_3Lewxx6o",23400],
  "Java File I/O":            ["rV_3Lewxx6o",25200],
  "Java Threads":             ["rV_3Lewxx6o",27000],
  "Java Streams":             ["rV_3Lewxx6o",28800],
  "Java Lambda":              ["rV_3Lewxx6o",30600],
  "Build a Bank App":         ["rV_3Lewxx6o",32400],
  "Build a Student DB":       ["rV_3Lewxx6o",32400],
  "Final Java Project":       ["rV_3Lewxx6o",32400],

  // DSA — CodeWithHarry Hindi DSA playlist (PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi)
  "Arrays & Big O":           ["zLQfQDr7JjA",0],
  "Two Pointers":             ["zLQfQDr7JjA",1800],
  "Sliding Window":           ["zLQfQDr7JjA",3600],
  "Prefix Sum":               ["zLQfQDr7JjA",5400],
  "Strings":                  ["zLQfQDr7JjA",7200],
  "Linked List":              ["zLQfQDr7JjA",9000],
  "Stack":                    ["zLQfQDr7JjA",12600],
  "Queue":                    ["zLQfQDr7JjA",14400],
  "Binary Tree":              ["zLQfQDr7JjA",18000],
  "BST":                      ["zLQfQDr7JjA",21600],
  "Heap":                     ["zLQfQDr7JjA",25200],
  "Graphs":                   ["zLQfQDr7JjA",28800],
  "Bubble Sort":              ["zLQfQDr7JjA",32400],
  "Merge Sort":               ["zLQfQDr7JjA",34200],
  "Quick Sort":               ["zLQfQDr7JjA",36000],
  "Binary Search":            ["zLQfQDr7JjA",37800],
  "Dynamic Programming":      ["zLQfQDr7JjA",39600],
  "Greedy Algorithms":        ["zLQfQDr7JjA",43200],
  "Backtracking":             ["zLQfQDr7JjA",46800],

  // SQL — CodeWithHarry Hindi (HXV3zeQKqGY fallback, same timestamps)
  "What is SQL?":             ["HXV3zeQKqGY",0],
  "SELECT & FROM":            ["HXV3zeQKqGY",600],
  "WHERE & AND/OR":           ["HXV3zeQKqGY",1800],
  "ORDER BY & LIMIT":         ["HXV3zeQKqGY",3000],
  "INSERT UPDATE DELETE":     ["HXV3zeQKqGY",5400],
  "JOINS":                    ["HXV3zeQKqGY",9000],
  "GROUP BY & HAVING":        ["HXV3zeQKqGY",12600],
  "Subqueries":               ["HXV3zeQKqGY",16200],
  "Window Functions":         ["HXV3zeQKqGY",19800],
  "Indexes":                  ["HXV3zeQKqGY",23400],
  "Views & CTEs":             ["HXV3zeQKqGY",25200],
  "Transactions":             ["HXV3zeQKqGY",27000],
  "Stored Procedures":        ["HXV3zeQKqGY",28800],
  "SQL Project":              ["HXV3zeQKqGY",30600],

  // WEB DEV — CodeWithHarry Hindi
  "HTML Basics":              ["BsDoLVMnmZs",0],
  "HTML Forms":               ["BsDoLVMnmZs",3600],
  "Semantic HTML":            ["BsDoLVMnmZs",7200],
  "CSS Basics":               ["BsDoLVMnmZs",10800],
  "Box Model":                ["BsDoLVMnmZs",14400],
  "Flexbox":                  ["BsDoLVMnmZs",18000],
  "CSS Grid":                 ["BsDoLVMnmZs",21600],
  "Responsive Design":        ["BsDoLVMnmZs",25200],
  "JavaScript for Web":       ["ER9SspLe4Hg",0],
  "DOM & Events":             ["ER9SspLe4Hg",14400],
  "What is React?":           ["bMknfKXIFA8",0],
  "React Components":         ["bMknfKXIFA8",1800],
  "React Props & State":      ["bMknfKXIFA8",5400],
  "React Hooks":              ["bMknfKXIFA8",9000],
  "React Router":             ["bMknfKXIFA8",12600],
  "API Integration":          ["bMknfKXIFA8",16200],
  "Node.js Basics":           ["Oe421EPjeBE",0],
  "Express.js":               ["Oe421EPjeBE",5400],
  "MongoDB Basics":           ["ofme2o29wY8",0],
  "Build Full Stack App":     ["nu_pCVPKzTk",0],
  "Deploy Your App":          ["nu_pCVPKzTk",7200],
  "What is Git?":             ["RGOj5yH7evk",0],
  "Git Installation":         ["RGOj5yH7evk",600],
  "Git Branches":             ["RGOj5yH7evk",3600],
  "What is Machine Learning?":["i_LwzRVP7bg",0],
  "What is Data Science?":    ["i_LwzRVP7bg",0],
  "What is NumPy?":           ["QUT1VHiLrmI",0],
  "What is Pandas?":          ["vmEHCKcdykY",0],

  // C PROGRAMMING — freeCodeCamp C full course (B31LgI4Y4DQ)
  "What is C?":               ["B31LgI4Y4DQ",0],
  "C Setup":                  ["B31LgI4Y4DQ",300],
  "Variables in C":           ["B31LgI4Y4DQ",900],
  "Data Types in C":          ["B31LgI4Y4DQ",1800],
  "Operators in C":           ["B31LgI4Y4DQ",2700],
  "If-Else in C":             ["B31LgI4Y4DQ",3600],
  "Loops in C":               ["B31LgI4Y4DQ",5400],
  "Switch Statement":         ["B31LgI4Y4DQ",7200],
  "Break & Continue in C":    ["B31LgI4Y4DQ",8100],
  "Functions in C":           ["B31LgI4Y4DQ",9000],
  "Arrays in C":              ["B31LgI4Y4DQ",10800],
  "Strings in C":             ["B31LgI4Y4DQ",12600],
  "Pointers in C":            ["B31LgI4Y4DQ",14400],
  "Structures in C":          ["B31LgI4Y4DQ",18000],
  "File Handling in C":       ["B31LgI4Y4DQ",21600],
  "Dynamic Memory":           ["B31LgI4Y4DQ",25200],
  "C Programs":               ["B31LgI4Y4DQ",28800],

  // React & Node extra
  "Context API":              ["bMknfKXIFA8",19800],
  "Java Functions":           ["grEKMHGYyns",10800],
};

// Marathi — same as Hindi fallback (no major Marathi coding channels available)
const VID_MR = VID_HI;

function getVid(l: string, lang: 'en'|'hi'|'mr' = 'en'): [string, number] {
  if (lang === 'hi') return VID_HI[l] || VID[l] || ["UrsmFxEIp5k", 0];
  if (lang === 'mr') return VID_MR[l] || VID[l] || ["UrsmFxEIp5k", 0];
  return VID[l] || ["rfscVS0vtbw", 0];
}
// Keep getYT for any legacy usage
function getYT(l: string) { return getVid(l)[0]; }

// ── Courses ───────────────────────────────────────────────────────
const COURSES = [
  { id:'python', title:'Python Programming', icon:'🐍', accent:'#6366f1', codeLanguage:'python', tag:'Most Popular', tagColor:'#f59e0b', desc:'Zero to real Python projects', modules:[
    { title:'Getting Started', lessons:['What is Python?','Setting Up Python','Your First Program','Variables & Data Types','Type Conversion'] },
    { title:'Operators & Control Flow', lessons:['Arithmetic Operators','Comparison Operators','Logical Operators','If-Else Statements','For Loops','While Loops','Break & Continue'] },
    { title:'Functions', lessons:['Functions','Parameters & Return','Lambda Functions','Recursion','Decorators'] },
    { title:'Data Structures', lessons:['Lists','Tuples','Dictionaries','Sets','List Comprehensions','String Methods'] },
    { title:'File & Error Handling', lessons:['File Handling','Exception Handling','Modules & Packages','pip & Libraries'] },
    { title:'OOP', lessons:['Classes & Objects','Inheritance','Encapsulation','Polymorphism','Generators','Regular Expressions'] },
    { title:'Advanced Python', lessons:['Multithreading','Virtual Environment','Python JSON','Python API Calls','Python Testing'] },
    { title:'Projects', lessons:['Build a Calculator','Build a To-Do App','Build a Quiz Game','Build a Web Scraper','Final Python Project'] },
  ]},
  { id:'javascript', title:'JavaScript', icon:'⚡', accent:'#f59e0b', codeLanguage:'javascript', tag:'Web Dev', tagColor:'#10b981', desc:'Basics to modern ES6+', modules:[
    { title:'Basics', lessons:['What is JavaScript?','Variables (let/const/var)','JS Data Types','Type Coercion','Template Literals','JS Functions','Arrow Functions','Scope & Hoisting'] },
    { title:'Data Structures', lessons:['Arrays','Objects','Destructuring','Spread & Rest','Map & Set','JSON'] },
    { title:'Control Flow', lessons:['If-Else JS','Switch Case','For Loop JS','While Loop JS','Error Handling'] },
    { title:'Browser', lessons:['DOM Manipulation','Event Listeners','Local Storage','Session Storage','Cookies'] },
    { title:'Async JS', lessons:['Callbacks','Promises','Async Await','Fetch API','AJAX'] },
    { title:'Advanced JS', lessons:['Closures','Prototypes','ES6 Classes','Iterators & Generators','Modules ES6','Regular Expressions JS'] },
    { title:'Projects', lessons:['Build a Todo App (JS)','Build a Weather App','Build a Quiz App','Final JS Project'] },
  ]},
  { id:'java', title:'Java', icon:'☕', accent:'#ef4444', codeLanguage:'java', tag:'Industry', tagColor:'#6366f1', desc:'Core Java to advanced OOP', modules:[
    { title:'Basics', lessons:['What is Java?','Java Setup & Hello World','Java Variables','Java Data Types','Java Operators','Java Type Casting'] },
    { title:'Control Flow', lessons:['Java If-Else','Java Switch','Java For Loop','Java While Loop','Java Arrays','Java Methods','Java Strings'] },
    { title:'OOP', lessons:['Java OOP - Classes','Java Constructors','Java Inheritance','Java Polymorphism','Java Abstraction','Java Interfaces','Java Encapsulation'] },
    { title:'Advanced', lessons:['Java Exception Handling','Java Collections','Java ArrayList','Java HashMap','Java Generics','Java File I/O','Java Threads','Java Streams','Java Lambda','Java Optional'] },
    { title:'Projects', lessons:['Build a Bank App','Build a Student DB','Final Java Project'] },
  ]},
  { id:'cpp', title:'C++', icon:'⚙️', accent:'#06b6d4', codeLanguage:'c++', tag:'Performance', tagColor:'#8b5cf6', desc:'C++ from scratch to STL', modules:[
    { title:'Basics', lessons:['What is C++?','C++ Setup','C++ Variables','C++ Data Types','C++ Operators','C++ Type Casting'] },
    { title:'Control Flow', lessons:['C++ If-Else','C++ Switch','C++ For Loop','C++ While Loop','C++ Break & Continue','C++ Functions','C++ Recursion'] },
    { title:'Arrays & Strings', lessons:['C++ Arrays','C++ Strings','C++ Multi-dimensional Arrays','C++ Vectors'] },
    { title:'Pointers & Memory', lessons:['C++ Pointers','C++ References','C++ Dynamic Memory','C++ Smart Pointers'] },
    { title:'OOP', lessons:['C++ OOP','C++ Constructors','C++ Inheritance','C++ Polymorphism','C++ Abstraction','C++ Encapsulation'] },
    { title:'Advanced', lessons:['C++ STL','C++ Templates','C++ Exception Handling','C++ File Handling','C++ Lambda','C++ Threads'] },
    { title:'Projects', lessons:['Build a Calculator (C++)','Build a Student System','Final C++ Project'] },
  ]},
  { id:'c', title:'C Programming', icon:'🔵', accent:'#3b82f6', codeLanguage:'c', tag:'Foundation', tagColor:'#f59e0b', desc:'Mother of all languages', modules:[
    { title:'Basics', lessons:['What is C?','C Setup','Variables in C','Data Types in C','Operators in C','Type Casting in C','Input Output in C'] },
    { title:'Control Flow', lessons:['If-Else in C','Switch Statement','For Loop in C','While Loop in C','Do While Loop','Break & Continue in C','Goto in C'] },
    { title:'Functions & Arrays', lessons:['Functions in C','Recursion in C','Arrays in C','Multi-dimensional Arrays','Strings in C','String Functions'] },
    { title:'Pointers & Memory', lessons:['Pointers in C','Pointer Arithmetic','Pointer to Array','Dynamic Memory','malloc & free','Memory Leaks'] },
    { title:'Advanced', lessons:['Structures in C','Unions in C','Enums in C','File Handling in C','Preprocessor Directives','Bitwise Operators'] },
    { title:'Projects', lessons:['C Programs','Build a Library System','Final C Project'] },
  ]},
  { id:'dsa', title:'DSA', icon:'🧠', accent:'#8b5cf6', codeLanguage:'python', tag:'Interview', tagColor:'#ec4899', desc:'Data Structures & Algorithms', modules:[
    { title:'Complexity', lessons:['Arrays & Big O','Time Complexity','Space Complexity','Big O Cheatsheet'] },
    { title:'Arrays & Strings', lessons:['Two Pointers','Sliding Window','Prefix Sum','Strings','Kadane Algorithm'] },
    { title:'Linked Lists', lessons:['Linked List','Doubly Linked List','Circular Linked List','Floyd Cycle Detection'] },
    { title:'Stack & Queue', lessons:['Stack','Queue','Monotonic Stack','Deque','Priority Queue'] },
    { title:'Trees', lessons:['Binary Tree','BST','AVL Tree','Heap','Trie'] },
    { title:'Graphs', lessons:['Graphs','BFS','DFS','Dijkstra Algorithm','Topological Sort','Union Find'] },
    { title:'Sorting & Search', lessons:['Bubble Sort','Selection Sort','Insertion Sort','Merge Sort','Quick Sort','Heap Sort','Binary Search'] },
    { title:'Advanced', lessons:['Dynamic Programming','Memoization','Tabulation','Greedy Algorithms','Backtracking','Divide & Conquer'] },
  ]},
  { id:'sql', title:'SQL & Databases', icon:'🗄️', accent:'#10b981', codeLanguage:'python', tag:'Data', tagColor:'#6366f1', desc:'SQL basics to advanced queries', modules:[
    { title:'Basics', lessons:['What is SQL?','Database Concepts','Tables & Schema','SELECT & FROM','WHERE & AND/OR','ORDER BY & LIMIT','DISTINCT & ALIASES'] },
    { title:'Data Manipulation', lessons:['INSERT UPDATE DELETE','NULL Values','LIKE & Wildcards','IN & BETWEEN','Aggregate Functions','GROUP BY & HAVING'] },
    { title:'Joins', lessons:['JOINS','INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL JOIN','Self Join','Cross Join','Subqueries'] },
    { title:'Advanced', lessons:['Window Functions','ROW NUMBER','RANK & DENSE RANK','LAG & LEAD','Indexes','Views & CTEs','Transactions','ACID Properties','Stored Procedures','Triggers','Normalization'] },
    { title:'Projects', lessons:['SQL Project'] },
  ]},
  { id:'webdev', title:'Full Stack Web Dev', icon:'🌐', accent:'#ec4899', codeLanguage:'javascript', tag:'Full Stack', tagColor:'#f59e0b', desc:'HTML to React to Node.js', modules:[
    { title:'HTML', lessons:['HTML Basics','HTML Tags','HTML Forms','HTML Tables','Semantic HTML','HTML5 Features','Accessibility'] },
    { title:'CSS', lessons:['CSS Basics','Selectors','Box Model','Flexbox','CSS Grid','Animations','Responsive Design','CSS Variables','Sass Basics'] },
    { title:'JavaScript', lessons:['JavaScript for Web','DOM & Events','Form Validation','Local Storage','Fetch API','ES6+ Features'] },
    { title:'React', lessons:['What is React?','React Setup','React Components','JSX','React Props & State','React Hooks','useEffect','React Router','Context API','Redux Basics'] },
    { title:'Backend', lessons:['Node.js Basics','Express.js','REST API','MongoDB Basics','Mongoose','Authentication','JWT Tokens'] },
    { title:'Deploy', lessons:['Build Full Stack App','Git & GitHub','Deploy Your App','Environment Variables','CORS & Security'] },
  ]},
  { id:'react', title:'React.js', icon:'⚛️', accent:'#61dafb', codeLanguage:'javascript', tag:'Frontend', tagColor:'#ec4899', desc:'Master React hooks & patterns', modules:[
    { title:'React Basics', lessons:['What is React?','React Setup','React Components','JSX','Props','State','Event Handling'] },
    { title:'Hooks', lessons:['useState','useEffect','useRef','useContext','useMemo','useCallback','Custom Hooks'] },
    { title:'Routing & State', lessons:['React Router','Nested Routes','Context API','Redux Basics','Zustand'] },
    { title:'Advanced', lessons:['API Integration','Error Boundaries','React Performance','Code Splitting','React Testing','TypeScript with React'] },
    { title:'Projects', lessons:['Build a Todo App (JS)','Build a Weather App','Build an E-commerce UI','Final React Project'] },
  ]},
  { id:'nodejs', title:'Node.js & Express', icon:'🟢', accent:'#68a063', codeLanguage:'javascript', tag:'Backend', tagColor:'#f59e0b', desc:'Backend with Node.js & Express', modules:[
    { title:'Node.js Basics', lessons:['Node.js Basics','Node Modules','Node File System','Node Events','Node Streams','Node HTTP'] },
    { title:'Express', lessons:['Express.js','Express Routing','Middleware','Request & Response','Error Handling Middleware','Template Engines'] },
    { title:'API & Database', lessons:['REST API','CRUD Operations','MongoDB & Mongoose','Schema & Models','Authentication','JWT Tokens','Password Hashing'] },
    { title:'Advanced', lessons:['Environment Variables','CORS','Rate Limiting','File Upload','WebSockets','Node Caching','Node Project'] },
  ]},
  { id:'datascience', title:'Data Science', icon:'📊', accent:'#f97316', codeLanguage:'python', tag:'Data Science', tagColor:'#8b5cf6', desc:'Python for data analysis', modules:[
    { title:'Python Basics for DS', lessons:['What is Data Science?','Python for Data Science','Jupyter Notebook','Math for DS'] },
    { title:'NumPy', lessons:['What is NumPy?','NumPy Arrays','Array Operations','Array Indexing','NumPy Math','Broadcasting'] },
    { title:'Pandas', lessons:['What is Pandas?','Pandas Series','Pandas DataFrames','Reading CSV & Excel','Data Selection','Data Cleaning','Merging & Grouping'] },
    { title:'Visualization', lessons:['Matplotlib Basics','Line & Bar Charts','Scatter Plot','Histogram','Seaborn Basics','Data Visualization'] },
    { title:'Statistics', lessons:['Descriptive Statistics','Probability Basics','Normal Distribution','Hypothesis Testing','Correlation'] },
    { title:'Projects', lessons:['EDA Project','Sales Data Analysis','Covid Data Analysis','Final DS Project'] },
  ]},
  { id:'ml', title:'Machine Learning', icon:'🤖', accent:'#a855f7', codeLanguage:'python', tag:'AI/ML', tagColor:'#10b981', desc:'ML algorithms & implementation', modules:[
    { title:'ML Foundations', lessons:['What is Machine Learning?','ML Roadmap','Types of ML','Math for ML','Python for ML','Data Preprocessing'] },
    { title:'Supervised Learning', lessons:['Supervised Learning','Linear Regression','Logistic Regression','Decision Trees','Random Forest','SVM','KNN','Naive Bayes'] },
    { title:'Unsupervised Learning', lessons:['Unsupervised Learning','K-Means Clustering','Hierarchical Clustering','PCA','Dimensionality Reduction'] },
    { title:'Deep Learning', lessons:['Neural Networks Intro','Activation Functions','Backpropagation','CNN Basics','RNN Basics','Transfer Learning'] },
    { title:'Model Building', lessons:['Train Test Split','Cross Validation','Overfitting & Underfitting','Hyperparameter Tuning','Model Evaluation','Confusion Matrix'] },
    { title:'Projects', lessons:['House Price Prediction','Image Classification','Sentiment Analysis','ML Project'] },
  ]},
  { id:'git', title:'Git & GitHub', icon:'🐙', accent:'#f05032', codeLanguage:'javascript', tag:'DevOps', tagColor:'#10b981', desc:'Version control for developers', modules:[
    { title:'Git Basics', lessons:['What is Git?','Git Installation','Git Config','Git Init','Git Status','Git Add & Commit','Git Log','Git Diff'] },
    { title:'Branching', lessons:['Git Branches','Create & Switch Branch','Git Merge & Rebase','Merge Conflicts','Git Stash','Git Cherry Pick'] },
    { title:'GitHub', lessons:['GitHub Remote','Git Push & Pull','Git Clone','Fork & Star','Pull Requests','Code Review','GitHub Issues'] },
    { title:'Advanced', lessons:['Git Reset & Revert','Git Rebase Interactive','Git Tags','Git Submodules','.gitignore','Git Hooks','CI/CD with GitHub Actions'] },
  ]},
  { id:'docker', title:'Docker & DevOps', icon:'🐳', accent:'#2496ed', codeLanguage:'javascript', tag:'DevOps', tagColor:'#6366f1', desc:'Containerization & deployment', modules:[
    { title:'Docker Basics', lessons:['What is Docker?','Docker vs Virtual Machine','Docker Installation','Docker Containers','Docker Images','Docker Hub','Dockerfile'] },
    { title:'Docker Advanced', lessons:['Docker Compose','Docker Networking','Docker Volumes','Multi-Stage Build','Docker Security','Docker Logs'] },
    { title:'DevOps & CI/CD', lessons:['What is DevOps?','CI/CD Basics','GitHub Actions','Jenkins Intro','CI/CD Pipeline','Automated Testing'] },
    { title:'Kubernetes', lessons:['Kubernetes Intro','Pods & Nodes','Kubernetes Deployment','Services & Ingress','ConfigMaps','Kubernetes Scaling'] },
    { title:'Cloud Basics', lessons:['Cloud Computing','AWS Basics','Google Cloud Basics','Deploy with Docker'] },
  ]},
  { id:'cybersecurity', title:'Cybersecurity', icon:'🔒', accent:'#22c55e', codeLanguage:'python', tag:'Security', tagColor:'#ef4444', desc:'Ethical hacking fundamentals', modules:[
    { title:'Foundations', lessons:['What is Cybersecurity?','CIA Triad','Types of Attacks','Networking Basics','OSI Model','TCP IP Model','DNS & HTTP','Linux for Security'] },
    { title:'Reconnaissance', lessons:['Passive Reconnaissance','Active Reconnaissance','OSINT Tools','Nmap Scanning','Scanning & Enumeration','Vulnerability Assessment'] },
    { title:'Exploitation', lessons:['Web Hacking Basics','SQL Injection','XSS Attack','CSRF Attack','Directory Traversal','Buffer Overflow Basics','Metasploit'] },
    { title:'Post Exploitation', lessons:['Password Attacks','Hash Cracking','Privilege Escalation','Maintaining Access','Covering Tracks'] },
    { title:'Defense & Tools', lessons:['Firewalls & IDS','VPN & Proxy','Encryption Basics','SSL & TLS','Kali Linux Tools','Bug Bounty Basics','Cybersecurity Career'] },
  ]},
  { id:'flutter', title:'Flutter & Dart', icon:'💙', accent:'#54c5f8', codeLanguage:'javascript', tag:'Mobile', tagColor:'#f59e0b', desc:'Build iOS & Android apps', modules:[
    { title:'Dart Basics', lessons:['What is Dart?','Dart Setup','Dart Variables','Dart Data Types','Dart Operators','Dart If-Else','Dart Loops','Dart Functions','Dart Lists & Maps'] },
    { title:'Dart OOP', lessons:['Dart OOP','Dart Classes','Dart Inheritance','Dart Mixins','Dart Abstract','Dart Generics','Dart Async & Futures'] },
    { title:'Flutter Basics', lessons:['What is Flutter?','Flutter Setup','Flutter Widgets','Stateless Widget','Stateful Widget','Flutter Layout','Row & Column','Container & Stack'] },
    { title:'Flutter UI', lessons:['Flutter Navigation','Flutter Forms','Flutter Lists','Flutter Images','Flutter Themes','Flutter Animations'] },
    { title:'Flutter Advanced', lessons:['Flutter State Management','Provider','Riverpod','Flutter API','HTTP Requests','Flutter Firebase','Local Storage Flutter'] },
    { title:'Projects', lessons:['Flutter Todo App','Flutter Weather App','Flutter App'] },
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
      body:JSON.stringify({ model:'llama-3.1-8b-instant', messages:[{role:'user',content:prompt}], temperature:0.7, max_tokens:4000 }),
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
        {/* Back Button */}
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'8px'}}>
          <button onClick={()=>window.history.back()} style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 16px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#94a3b8',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
            ← Back
          </button>
        </div>
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

  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimerRef = useRef<any>(null);

  const totalL = course.modules.reduce((a:number,m:any)=>a+m.lessons.length,0);
  const lesson = course.modules[activeMod]?.lessons[activeLesson] || '';
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

  const getFallbackQuiz = (lessonName: string, courseName: string) => [
    {q:`What is ${lessonName}?`, opts:[`An unrelated tool`,`A core concept in ${courseName}`,`A database`,`A framework`], ans:1, exp:`${lessonName} is a fundamental concept in ${courseName}.`},
    {q:`Which best describes ${lessonName}?`, opts:[`A cloud service`,`A type of database`,`Used in ${courseName} for core functionality`,`Used only in mobile apps`], ans:2, exp:`${lessonName} is used in ${courseName} for core functionality.`},
    {q:`When should you use ${lessonName}?`, opts:[`Only in backend development`,`Never in modern programming`,`Only in frontend development`,`When working with ${courseName} concepts`], ans:3, exp:`${lessonName} is applicable when working with ${courseName}.`},
    {q:`What is the primary benefit of ${lessonName}?`, opts:[`Slows down the program`,`Improves code efficiency`,`Increases memory usage`,`Reduces code readability`], ans:1, exp:`${lessonName} primarily improves code efficiency.`},
    {q:`${lessonName} is most commonly used in which field?`, opts:[`Hardware programming`,`Network administration`,`Database design only`,`${courseName} development`], ans:3, exp:`${lessonName} is most common in ${courseName} development.`},
    {q:`Which statement about ${lessonName} is TRUE?`, opts:[`It is deprecated in modern usage`,`It only works on Windows`,`It is a key part of ${courseName}`,`It requires special hardware`], ans:2, exp:`${lessonName} is indeed a key part of ${courseName}.`},
    {q:`How does ${lessonName} help developers?`, opts:[`Makes code harder to read`,`Only works with paid tools`,`Increases development time significantly`,`Makes code more organized and efficient`], ans:3, exp:`${lessonName} helps by making code more organized and efficient.`},
    {q:`What should you know before learning ${lessonName}?`, opts:[`Advanced machine learning`,`Basic ${courseName} fundamentals`,`Hardware assembly`,`Network protocols only`], ans:1, exp:`Basic ${courseName} fundamentals are needed before ${lessonName}.`},
    {q:`${lessonName} is related to which concept?`, opts:[`An operating system feature`,`A hardware component`,`A network protocol`,`Core ${courseName} principle`], ans:3, exp:`${lessonName} demonstrates core ${courseName} principles.`},
    {q:`After learning ${lessonName}, what should you explore next?`, opts:[`Unrelated technologies first`,`Nothing, it is the final topic`,`Advanced ${courseName} topics`,`Only practice old concepts`], ans:2, exp:`After ${lessonName}, advancing to other ${courseName} topics is recommended.`},
  ];

  const loadQuiz = useCallback(async()=>{
    setQuizLoading(true); setQuizAll([]); setQuizIdx(0); setSelectedAns(null); setQuizScore(0); setQuizDone(false);
    const prompt = `Generate exactly 10 MCQ quiz questions about "${lesson}" topic in ${course.title} course.
Rules:
- Return ONLY a valid JSON array, no markdown, no explanation, no text before or after
- Each question must have exactly 4 options
- ans is 0-based index (0=A, 1=B, 2=C, 3=D)
- Mix: 3 easy, 5 medium, 2 hard questions
- Questions should be practical and relevant to ${lesson}
Format: [{"q":"question","opts":["A","B","C","D"],"ans":0,"exp":"why this answer"}]`;
    try {
      const res = await groq(prompt);
      const clean = res.replace(/```json?|```/g,'').trim();
      const s = clean.indexOf('['), e = clean.lastIndexOf(']');
      if (s === -1 || e === -1) throw new Error('No JSON array found');
      const parsed = JSON.parse(clean.slice(s, e+1));
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty array');
      // If less than 10, pad with fallback questions
      const questions = parsed.slice(0, 10);
      if (questions.length < 10) {
        const fallback = getFallbackQuiz(lesson, course.title);
        const needed = 10 - questions.length;
        questions.push(...fallback.slice(0, needed));
      }
      setQuizAll(questions);
    } catch {
      // Retry once with simpler prompt
      try {
        const res2 = await groq(`Create 10 multiple choice questions about ${lesson}. JSON array only: [{"q":"...","opts":["A","B","C","D"],"ans":0,"exp":"..."}]`);
        const clean2 = res2.replace(/```json?|```/g,'').trim();
        const s2 = clean2.indexOf('['), e2 = clean2.lastIndexOf(']');
        const parsed2 = JSON.parse(clean2.slice(s2, e2+1));
        if (Array.isArray(parsed2) && parsed2.length > 0) {
          const q2 = parsed2.slice(0,10);
          if (q2.length < 10) q2.push(...getFallbackQuiz(lesson, course.title).slice(0, 10 - q2.length));
          setQuizAll(q2);
        } else { setQuizAll(getFallbackQuiz(lesson, course.title)); }
      } catch { setQuizAll(getFallbackQuiz(lesson, course.title)); }
    }
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
    if (!SR){alert('Voice not supported. Use Chrome browser.');return;}
    if (micOn){micRef.current?.abort();setMicOn(false);return;}
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    stopWave();
    setMicOn(true);
    const r=new SR();
    r.lang='en-IN';
    r.continuous=false;
    r.interimResults=false;
    r.maxAlternatives=1;
    r.onresult=(e:any)=>{
      const transcript = e.results[0][0].transcript;
      if(transcript) sendMentor(transcript);
    };
    r.onend=()=>setMicOn(false);
    r.onerror=(e:any)=>{
      console.error('Mic error:',e.error);
      setMicOn(false);
      if(e.error==='not-allowed') alert('Mic permission denied. Allow mic in browser settings.');
      else if(e.error==='no-speech') alert('No speech detected. Try again.');
    };
    try { micRef.current=r; r.start(); }
    catch(e){ console.error('Start error:',e); setMicOn(false); }
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
        <div style={{padding:'10px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'rgba(8,11,18,0.95)',backdropFilter:'blur(12px)',position:'relative',zIndex:10}}>
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
              <div
                style={{position:'relative',borderRadius:'14px',overflow:'hidden',background:'#000',border:`1px solid ${ACC}33`}}
                onMouseEnter={()=>setShowControls(true)}
                onMouseLeave={()=>setShowControls(false)}
              >
                <div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden'}}>
                  <iframe
                    ref={iframeRef}
                    key={lesson}
                    src={`https://www.youtube.com/embed/${getVid(lesson)[0]}?start=${getVid(lesson)[1]}&rel=0&modestbranding=1&playsinline=1&autoplay=1&controls=0&disablekb=0&iv_load_policy=3&enablejsapi=1&vq=hd720`}
                    title={lesson}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    style={{position:'absolute',top:'-10%',left:'-2%',width:'104%',height:'124%',border:'none'}}
                  />
                  {/* Top branding bar */}
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'13%',background:'linear-gradient(180deg,#000 70%,transparent)',zIndex:3,pointerEvents:'none',display:'flex',alignItems:'center',padding:'0 14px',gap:'8px'}}>
                    <span style={{fontSize:'13px'}}>🎓</span>
                    <span style={{color:'#fff',fontSize:'12px',fontWeight:700}}>Hiresnix AI Academy</span>
                    <span style={{color:ACC,fontSize:'10px',fontWeight:600,marginLeft:'4px'}}>· {lesson}</span>
                  </div>
                  {/* Bottom cover bar */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:'12%',background:'linear-gradient(0deg,#000 80%,transparent)',zIndex:3,pointerEvents:'none'}}/>
                  {/* Custom controls bar */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:4,padding:'8px 14px',display:'flex',alignItems:'center',gap:'10px'}}>
                    <button
                      onClick={()=>{
                        const win = iframeRef.current?.contentWindow;
                        if(win){win.postMessage(JSON.stringify({event:'command',func:isPlaying?'pauseVideo':'playVideo',args:[]}),'*');setIsPlaying(p=>!p);}
                      }}
                      style={{background:'none',border:'none',color:'#fff',fontSize:'20px',cursor:'pointer',padding:'2px 6px',lineHeight:1,zIndex:5}}
                    >{isPlaying?'⏸':'▶'}</button>
                    <button
                      onClick={()=>{const win=iframeRef.current?.contentWindow;if(win)win.postMessage(JSON.stringify({event:'command',func:'seekTo',args:[Math.max(0,getVid(lesson)[1]-10),true]}),'*');}}
                      style={{background:'none',border:'none',color:'#94a3b8',fontSize:'14px',cursor:'pointer',padding:'2px 6px',lineHeight:1}}
                    >⏪ 10s</button>
                    <button
                      onClick={()=>{const win=iframeRef.current?.contentWindow;if(win)win.postMessage(JSON.stringify({event:'command',func:'seekTo',args:[getVid(lesson)[1]+10,true]}),'*');}}
                      style={{background:'none',border:'none',color:'#94a3b8',fontSize:'14px',cursor:'pointer',padding:'2px 6px',lineHeight:1}}
                    >10s ⏩</button>
                    <div style={{flex:1}}/>
                    <button
                      onClick={()=>iframeRef.current?.requestFullscreen()}
                      style={{background:'none',border:'none',color:'#94a3b8',fontSize:'16px',cursor:'pointer',padding:'2px 6px',lineHeight:1}}
                      title="Fullscreen"
                    >⛶</button>
                    <button onClick={()=>setTab('teacher')} style={{background:`${ACC}22`,border:`1px solid ${ACC}44`,color:ACC,fontSize:'10px',fontWeight:700,padding:'3px 10px',borderRadius:'6px',cursor:'pointer'}}>AI Teacher →</button>
                  </div>
                </div>
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
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <button onClick={loadTeacher} style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',borderRadius:'9px',border:`1px solid ${ACC}33`,background:`${ACC}0d`,color:ACC,fontSize:'11px',fontWeight:600,cursor:'pointer'}}>
                  <RefreshCw size={12}/> Re-explain
                </button>
                {speaking && (
                  <button onClick={()=>{
                    if(window.speechSynthesis.paused){window.speechSynthesis.resume();setSpeaking(true);}
                    else{window.speechSynthesis.pause();window.speechSynthesis.cancel();setSpeaking(false);stopWave();}
                  }} style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',borderRadius:'9px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>
                    ⏸ Pause
                  </button>
                )}
                {!speaking && teacherText && (
                  <button onClick={()=>speak(teacherText)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',borderRadius:'9px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>
                    ▶ Play
                  </button>
                )}
              </div>
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
      <div style={{background:'#0b0f1a',borderLeft:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative',zIndex:10}}>
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
        <button onClick={()=>window.history.back()} style={{marginTop:'20px',padding:'8px 20px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#94a3b8',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>← Back</button>
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