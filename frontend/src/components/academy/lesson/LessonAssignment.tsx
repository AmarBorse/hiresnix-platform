import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { submitAssignment, getAssignment } from '../../../lib/academy/academySupabase'
import type { Lesson } from '../../../lib/academy/academyTypes'

interface RubricItem {
  criterion: string
  points: number
  description: string
}

interface AssignmentData {
  title: string
  real_world_context: string
  problem_statement: string
  requirements: string[]
  deliverables: string[]
  rubric: RubricItem[]
  starter_code: string
  estimated_hours: number
}

interface LessonAssignmentProps {
  lesson: Lesson
  userId: string
}

type PageState = 'idle' | 'loading' | 'active' | 'submitting' | 'submitted'

export default function LessonAssignment({ lesson, userId }: LessonAssignmentProps) {
  const [state, setState] = useState<PageState>('idle')
  const [assignment, setAssignment] = useState<AssignmentData | null>(null)
  const [submission, setSubmission] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [existingStatus, setExistingStatus] = useState<string | null>(null)

  // Check existing submission
  useEffect(() => {
    if (!userId) return
    getAssignment(userId, lesson.id).then(existing => {
      if (existing) setExistingStatus(existing.status)
    }).catch(console.error)
  }, [userId, lesson.id])

  const generate = useCallback(async () => {
    setState('loading')
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not logged in')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-assignment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ lesson_id: lesson.id }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate assignment')
      setAssignment(data.assignment)
      setState('active')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('idle')
    }
  }, [lesson.id])

  const handleSubmit = useCallback(async () => {
    if (!submission.trim() || !userId) return
    setState('submitting')

    try {
      await submitAssignment(userId, lesson.id, submission.trim())
      setExistingStatus('submitted')
      setState('submitted')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
      setState('active')
    }
  }, [submission, userId, lesson.id])

  // ── Already submitted ──────────────────────────────────────
  if (existingStatus === 'submitted' || state === 'submitted') {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📬</div>
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
          Assignment submitted!
        </h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto">
          Your instructor will review it soon. Status: <span className="text-amber-600 dark:text-amber-400 font-medium">Under review</span>
        </p>
        {!assignment && (
          <button
            onClick={generate}
            className="mt-5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View assignment again
          </button>
        )}
        {assignment && <AssignmentView assignment={assignment} readOnly />}
      </div>
    )
  }

  // ── Idle ──────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
          Project assignment
        </h3>
        <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
          AI-generated real-world project assignment tied to this lesson. Complete and submit for review.
        </p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button
          onClick={generate}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          Generate assignment ✨
        </button>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
        <p className="text-sm text-gray-400">Generating assignment...</p>
      </div>
    )
  }

  // ── Active ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {assignment && <AssignmentView assignment={assignment} />}

      {/* Submission box */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Your submission</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Paste your code, GitHub link, or explain your solution here.
          </p>
        </div>
        <div className="p-4">
          <textarea
            value={submission}
            onChange={e => setSubmission(e.target.value)}
            placeholder={`## My solution\n\nGitHub link: https://github.com/...\n\nApproach:\n...\n\nChallenges faced:\n...`}
            rows={10}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5
              bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono
              placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none transition-colors"
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">
              {submission.length} chars · {submission.trim() ? '✓ Ready to submit' : 'Write your solution above'}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!submission.trim() || state === 'submitting'}
              className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state === 'submitting' ? '⏳ Submitting...' : 'Submit assignment ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AssignmentView sub-component ─────────────────────────────

function AssignmentView({ assignment, readOnly = false }: { assignment: AssignmentData; readOnly?: boolean }) {
  const [showRubric, setShowRubric] = useState(false)
  const totalPoints = assignment.rubric?.reduce((sum, r) => sum + r.points, 0) ?? 100

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">{assignment.title}</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 italic">
              {assignment.real_world_context}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500">⏱ ~{assignment.estimated_hours}h</span>
          </div>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
          {assignment.problem_statement}
        </p>
      </div>

      {/* Requirements */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Requirements</h4>
        <ul className="space-y-2">
          {assignment.requirements?.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className={req.toLowerCase().startsWith('bonus') ? 'text-amber-500' : 'text-blue-500'}>
                {req.toLowerCase().startsWith('bonus') ? '⭐' : '•'}
              </span>
              {req}
            </li>
          ))}
        </ul>
      </div>

      {/* Deliverables */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Deliverables</h4>
        <ul className="space-y-1.5">
          {assignment.deliverables?.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="text-green-500 mt-0.5">✓</span> {d}
            </li>
          ))}
        </ul>
      </div>

      {/* Starter code */}
      {assignment.starter_code && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500">Starter code</span>
          </div>
          <pre className="p-4 bg-gray-950 text-green-300 text-xs font-mono overflow-x-auto">
            {assignment.starter_code}
          </pre>
        </div>
      )}

      {/* Rubric toggle */}
      <button
        onClick={() => setShowRubric(v => !v)}
        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
          text-sm text-gray-600 dark:text-gray-400 hover:border-blue-400 transition-colors flex items-center justify-between"
      >
        <span>📊 Grading rubric ({totalPoints} points)</span>
        <span className="text-gray-400">{showRubric ? '▲' : '▼'}</span>
      </button>

      {showRubric && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Criterion</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 w-16">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {assignment.rubric?.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-700 dark:text-gray-300">{r.criterion}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">{r.points}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300">Total</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-700 dark:text-gray-300">{totalPoints}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
