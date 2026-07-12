const PISTON_URL = 'https://emkc.org/api/v2/piston'

export interface PistonResult {
  stdout: string
  stderr: string
  exitCode: number
  compile?: { stdout: string; stderr: string }
}

export interface LanguageConfig {
  label: string
  pistonLanguage: string
  pistonVersion: string
  monacoLanguage: string
  defaultCode: string
  fileExtension: string
}

export const LANGUAGES: Record<string, LanguageConfig> = {
  python: {
    label: 'Python',
    pistonLanguage: 'python',
    pistonVersion: '3.10.0',
    monacoLanguage: 'python',
    fileExtension: 'py',
    defaultCode: `# Python starter
def greet(name):
    return f"Hello, {name}!"

print(greet("Hiresnix"))
`,
  },
  javascript: {
    label: 'JavaScript',
    pistonLanguage: 'javascript',
    pistonVersion: '18.15.0',
    monacoLanguage: 'javascript',
    fileExtension: 'js',
    defaultCode: `// JavaScript starter
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Hiresnix"));
`,
  },
  java: {
    label: 'Java',
    pistonLanguage: 'java',
    pistonVersion: '15.0.2',
    monacoLanguage: 'java',
    fileExtension: 'java',
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Hiresnix!");
    }
}
`,
  },
  c: {
    label: 'C',
    pistonLanguage: 'c',
    pistonVersion: '10.2.0',
    monacoLanguage: 'c',
    fileExtension: 'c',
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, Hiresnix!\\n");
    return 0;
}
`,
  },
  cpp: {
    label: 'C++',
    pistonLanguage: 'c++',
    pistonVersion: '10.2.0',
    monacoLanguage: 'cpp',
    fileExtension: 'cpp',
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Hiresnix!" << endl;
    return 0;
}
`,
  },
  nodejs: {
    label: 'Node.js',
    pistonLanguage: 'node',
    pistonVersion: '18.15.0',
    monacoLanguage: 'javascript',
    fileExtension: 'js',
    defaultCode: `const http = require('http');

// Node.js example
const data = [1, 2, 3, 4, 5];
const doubled = data.map(n => n * 2);
console.log('Doubled:', doubled);
`,
  },
  sql: {
    label: 'SQL',
    pistonLanguage: 'sqlite3',
    pistonVersion: '3.36.0',
    monacoLanguage: 'sql',
    fileExtension: 'sql',
    defaultCode: `-- SQLite example
CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, score INTEGER);
INSERT INTO students VALUES (1, 'Aman', 95), (2, 'Priya', 88), (3, 'Rahul', 76);
SELECT name, score FROM students WHERE score > 80 ORDER BY score DESC;
`,
  },
}

export async function runCode(
  language: string,
  code: string
): Promise<PistonResult> {
  const config = LANGUAGES[language]
  if (!config) throw new Error(`Unsupported language: ${language}`)

  const res = await fetch(`${PISTON_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: config.pistonLanguage,
      version: config.pistonVersion,
      files: [{ name: `main.${config.fileExtension}`, content: code }],
      stdin: '',
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Piston API error: ${err}`)
  }

  const data = await res.json()
  return {
    stdout: data.run?.stdout ?? '',
    stderr: data.run?.stderr ?? '',
    exitCode: data.run?.code ?? 0,
    compile: data.compile
      ? { stdout: data.compile.stdout ?? '', stderr: data.compile.stderr ?? '' }
      : undefined,
  }
}

export async function getPistonRuntimes(): Promise<string[]> {
  const res = await fetch(`${PISTON_URL}/runtimes`)
  const data = await res.json()
  return data.map((r: { language: string }) => r.language)
}
