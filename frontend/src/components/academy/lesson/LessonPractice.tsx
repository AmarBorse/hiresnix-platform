import { useState, useCallback } from 'react'
import { Editor } from '@monaco-editor/react'
import { supabase } from '../../../lib/supabaseClient'
import { runCode } from '../../../lib/academy/pistonApi'
import type { Lesson } from '../../../lib/academy/academyTypes'

interface TestCase {
  input: string
  expected_output: string
  label: string
}

interface PracticeProblem {
  title: string
  description: string
  starter_code: string
  test_cases: TestCase[]
  hints: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface LessonPracticeProps {
  lesson: Lesson
  userId: string
}

type PracticeState = 'idle' | 'loading' | 'active'

const diffColor = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export default function LessonPractice({ lesson, userId }: LessonPracticeProps) {
  const [state, setState] = useState<PracticeState>('idle')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [problems, setProblems] = useState<PracticeProblem[]>([])
  const [activeProblem, setActiveProblem] = useState(0)
  const [codes, setCodes] = useState<Record<number, string>>({})
  const [testResults, setTestResults] = useState<Record<number, TestResult[]>>({})
  const [running, setRunning] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shownHints, setShownHints] = useState<Record<number, number>>({})

  const lang = lesson.code_demo?.language ?? 'python'

  const generate = useCallback(async () => {
    setState('loading')
    setError(null)
    setCodes({})
    setTestResults({})
    setActiveProblem(0)
    setShownHints({})

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not logged in')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-practice`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ lesson_id: lesson.id, difficulty }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate problems')

      const probs: PracticeProblem[] = data.problems ?? []
      setProblems(probs)
      const initialCodes: Record<number, string> = {}
      probs.forEach((p, i) => { initialCodes[i] = p.starter_code })
      setCodes(initialCodes)
      setState('active')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('idle')
    }
  }, [lesson.id, difficulty])

  const runTests = useCallback(async (problemIndex: number) => {
    const problem = problems[problemIndex]
    const code = codes[problemIndex] ?? problem.starter_code
    if (!code.trim()) return

    setRunning(problemIndex)
    const results: TestResult[] = []

    for (const tc of problem.test_cases) {
      try {
        const result = await runCode(lang, code)
        const actual = result.stdout.trim()
        const expected = tc.expected_output.trim()
        results.push({
          label: tc.label,
          passed: actual === expected,
          actual,
          expected,
          stderr: result.stderr,
        })
      } catch (err) {
        results.push({
          label: tc.label,
          passed: false,
          actual: '',
          expected: tc.expected_output.trim(),
          stderr: String(err),
        })
      }
    }

    setTestResults(prev => ({ ...prev, [problemIndex]: results }))
    setRunning(null)
  }, [problems, codes, lang])

  const showNextHint = (problemIndex: number) => {
    const problem = problems[problemIndex]
    const current = shownHints[problemIndex] ?? 0
    if (current < problem.hints.length) {
      setShownHints(prev => ({ ...prev, [problemIndex]: current + 1 }))
    }
  }

  // ── Idle ──────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">💻</div>
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">Practice problems</h3>
        <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
          3 AI-generated coding problems with automated test cases. Choose difficulty:
        </p>
        <div className="flex gap-2 justify-center mb-5">
          {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                difficulty === d
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button
          onClick={generate}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          Generate problems ✨
        </button>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
        <p className="text-sm text-gray-400">Generating practice problems...</p>
      </div>
    )
  }

  // ── Active ─────────────────────────────────────────────────
  const problem = problems[activeProblem]
  const results = testResults[activeProblem]
  const hintsShown = shownHints[activeProblem] ?? 0
  const allPassed = results?.every(r => r.passed)
  const isRunning = running === activeProblem

  return (
    <div>
      {/* Problem tabs */}
      <div className="flex gap-2 mb-5">
        {problems.map((p, i) => {
          const res = testResults[i]
          const done = res?.every(r => r.passed)
          const tried = !!res
          return (
            <button
              key={i}
              onClick={() => setActiveProblem(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                i === activeProblem
                  ? 'bg-blue-600 text-white'
                  : done
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : tried
                  ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400'
              }`}
            >
              {done ? '✅' : tried ? '🔄' : ''} P{i + 1}
            </button>
          )
        })}
        <button
          onClick={generate}
          className="text-xs text-gray-400 hover:text-gray-600 px-2"
          title="Generate new problems"
        >
          ↺
        </button>
      </div>

      {/* Problem */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{problem.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          {allPassed && <span className="ml-auto text-green-600 dark:text-green-400 text-xs font-medium">✅ All tests passed!</span>}
        </div>

        <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-b border-gray-100 dark:border-gray-800">
          {problem.description}
        </div>

        {/* Editor */}
        <Editor
          height="240px"
          language={lang === 'cpp' ? 'cpp' : lang === 'nodejs' ? 'javascript' : lang}
          value={codes[activeProblem] ?? problem.starter_code}
          onChange={(val) => setCodes(prev => ({ ...prev, [activeProblem]: val ?? '' }))}
          theme="vs-dark"
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            folding: false,
            wordWrap: 'on',
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => runTests(activeProblem)}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700
            text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {isRunning ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running tests...</>
          ) : (
            <>▶ Run tests</>
          )}
        </button>

        {problem.hints.length > 0 && hintsShown < problem.hints.length && (
          <button
            onClick={() => showNextHint(activeProblem)}
            className="px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800
              text-amber-700 dark:text-amber-300 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            💡 Hint {hintsShown + 1}/{problem.hints.length}
          </button>
        )}
      </div>

      {/* Hints shown */}
      {hintsShown > 0 && (
        <div className="space-y-2 mb-4">
          {problem.hints.slice(0, hintsShown).map((hint, i) => (
            <div key={i} className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
              💡 Hint {i + 1}: {hint}
            </div>
          ))}
        </div>
      )}

      {/* Test results */}
      {results && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 text-sm ${
                r.passed
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{r.passed ? '✅' : '❌'}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{r.label}</span>
              </div>
              {!r.passed && (
                <div className="font-mono text-xs space-y-1 mt-2">
                  <div className="text-red-600 dark:text-red-400">
                    Got: <span className="bg-red-100 dark:bg-red-900/30 px-1 rounded">{r.actual || '(empty)'}</span>
                  </div>
                  <div className="text-green-600 dark:text-green-400">
                    Expected: <span className="bg-green-100 dark:bg-green-900/30 px-1 rounded">{r.expected}</span>
                  </div>
                  {r.stderr && (
                    <div className="text-red-500 mt-1 whitespace-pre-wrap">{r.stderr}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TestResult {
  label: string
  passed: boolean
  actual: string
  expected: string
  stderr: string
}
