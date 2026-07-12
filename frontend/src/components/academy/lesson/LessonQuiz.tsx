import { useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { saveQuizAttempt, getQuizAttempts } from '../../../lib/academy/academySupabase'
import type { Lesson } from '../../../lib/academy/academyTypes'

interface QuizQuestion {
  type: 'mcq' | 'coding' | 'theory'
  question: string
  options?: string[]
  correct_answer: string | null
  starter_code?: string
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface LessonQuizProps {
  lesson: Lesson
  userId: string
}

type QuizState = 'idle' | 'loading' | 'active' | 'submitted'

const difficultyColor = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export default function LessonQuiz({ lesson, userId }: LessonQuizProps) {
  const [state, setState] = useState<QuizState>('idle')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showExplanations, setShowExplanations] = useState(false)
  const [activeQ, setActiveQ] = useState(0)

  const generateQuiz = useCallback(async () => {
    setState('loading')
    setError(null)
    setAnswers({})
    setScore(null)
    setShowExplanations(false)
    setActiveQ(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not logged in')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ lesson_id: lesson.id }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate quiz')
      setQuestions(data.questions ?? [])
      setState('active')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('idle')
    }
  }, [lesson.id])

  const setAnswer = (index: number, value: string) => {
    setAnswers(prev => ({ ...prev, [index]: value }))
  }

  const handleSubmit = useCallback(async () => {
    // Score only MCQ and theory (coding is self-assessed)
    let correct = 0
    let gradable = 0
    const answerLog = questions.map((q, i) => {
      const given = answers[i] ?? ''
      let isCorrect = false
      if (q.type === 'mcq' && q.correct_answer) {
        gradable++
        isCorrect = given.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
        if (isCorrect) correct++
      }
      return { question_index: i, selected: given, correct: isCorrect }
    })

    const finalScore = gradable > 0 ? Math.round((correct / gradable) * 100) : 0
    setScore(finalScore)
    setState('submitted')
    setShowExplanations(false)

    if (userId) {
      try {
        await saveQuizAttempt({
          user_id: userId,
          lesson_id: lesson.id,
          score: finalScore,
          answers: answerLog,
        })
      } catch (e) {
        console.error('Failed to save quiz attempt:', e)
      }
    }
  }, [questions, answers, userId, lesson.id])

  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)]?.trim()).length
  const totalGradable = questions.filter(q => q.type !== 'coding').length

  // ── Idle ────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🧠</div>
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
          Test your knowledge
        </h3>
        <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
          AI-generated quiz: 5 MCQs, 2 coding questions, 2 theory questions — all based on this lesson.
        </p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button
          onClick={generateQuiz}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          Generate quiz ✨
        </button>
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
        <p className="text-sm text-gray-400">Generating quiz questions...</p>
      </div>
    )
  }

  // ── Score screen ─────────────────────────────────────────
  if (state === 'submitted') {
    const emoji = score! >= 80 ? '🎉' : score! >= 50 ? '👍' : '💪'
    const msg = score! >= 80 ? 'Excellent work!' : score! >= 50 ? 'Good effort!' : 'Keep practicing!'

    return (
      <div>
        {/* Score card */}
        <div className="text-center py-8 border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="text-5xl mb-3">{emoji}</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{score}%</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{msg}</p>
          <p className="text-xs text-gray-400 mt-1">
            MCQ score only · Coding questions are self-assessed
          </p>
          <div className="flex gap-3 justify-center mt-5">
            <button
              onClick={() => setShowExplanations(v => !v)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                text-sm text-gray-600 dark:text-gray-300 hover:border-blue-400 transition-colors"
            >
              {showExplanations ? 'Hide' : 'Show'} explanations
            </button>
            <button
              onClick={generateQuiz}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
            >
              Retake quiz
            </button>
          </div>
        </div>

        {/* Review */}
        <div className="space-y-5">
          {questions.map((q, i) => {
            const given = answers[i] ?? ''
            const isCorrect = q.type === 'mcq' && q.correct_answer
              ? given.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
              : null

            return (
              <ReviewCard
                key={i}
                index={i}
                question={q}
                given={given}
                isCorrect={isCorrect}
                showExplanation={showExplanations}
              />
            )
          })}
        </div>
      </div>
    )
  }

  // ── Active quiz ──────────────────────────────────────────
  const q = questions[activeQ]
  const isLast = activeQ === questions.length - 1

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((activeQ + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {activeQ + 1} / {questions.length}
        </span>
      </div>

      {/* Question tabs */}
      <div className="flex gap-1 flex-wrap mb-5">
        {questions.map((qu, i) => (
          <button
            key={i}
            onClick={() => setActiveQ(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              i === activeQ
                ? 'bg-blue-600 text-white'
                : answers[i]
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      <QuestionCard
        index={activeQ}
        question={q}
        answer={answers[activeQ] ?? ''}
        onAnswer={(val) => setAnswer(activeQ, val)}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setActiveQ(i => Math.max(0, i - 1))}
          disabled={activeQ === 0}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm
            text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:border-blue-400 transition-colors"
        >
          ← Previous
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={answeredCount < totalGradable}
            className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm
              font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit quiz ✓
          </button>
        ) : (
          <button
            onClick={() => setActiveQ(i => Math.min(questions.length - 1, i + 1))}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
          >
            Next →
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        {answeredCount} / {questions.length} answered
        {answeredCount < totalGradable && ' · Answer all MCQ + theory to submit'}
      </p>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function QuestionCard({
  index, question, answer, onAnswer,
}: {
  index: number
  question: QuizQuestion
  answer: string
  onAnswer: (val: string) => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {question.type === 'mcq' ? 'MCQ' : question.type === 'coding' ? 'Coding' : 'Theory'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor[question.difficulty]}`}>
            {question.difficulty}
          </span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">Q{index + 1}</span>
      </div>

      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
        {question.question}
      </p>

      {question.type === 'mcq' && question.options && (
        <div className="space-y-2">
          {question.options.map((opt, oi) => (
            <label
              key={oi}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                answer === opt
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <input
                type="radio"
                name={`q${index}`}
                value={opt}
                checked={answer === opt}
                onChange={() => onAnswer(opt)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'theory' && (
        <textarea
          value={answer}
          onChange={e => onAnswer(e.target.value)}
          placeholder="Write your answer here..."
          rows={4}
          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5
            bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200
            placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none transition-colors"
        />
      )}

      {question.type === 'coding' && (
        <div>
          <p className="text-xs text-gray-400 mb-2">
            Write your solution in the Code Playground tab, then come back and summarize your approach:
          </p>
          {question.starter_code && (
            <pre className="mb-3 p-3 rounded-lg bg-gray-950 text-green-300 text-xs font-mono overflow-x-auto">
              {question.starter_code}
            </pre>
          )}
          <textarea
            value={answer}
            onChange={e => onAnswer(e.target.value)}
            placeholder="Describe your approach / paste your working code here..."
            rows={5}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5
              bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono
              placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none transition-colors"
          />
        </div>
      )}
    </div>
  )
}

function ReviewCard({
  index, question, given, isCorrect, showExplanation,
}: {
  index: number
  question: QuizQuestion
  given: string
  isCorrect: boolean | null
  showExplanation: boolean
}) {
  const borderColor =
    isCorrect === true ? 'border-green-300 dark:border-green-800' :
    isCorrect === false ? 'border-red-300 dark:border-red-800' :
    'border-gray-200 dark:border-gray-700'

  const bg =
    isCorrect === true ? 'bg-green-50 dark:bg-green-900/10' :
    isCorrect === false ? 'bg-red-50 dark:bg-red-900/10' :
    ''

  return (
    <div className={`rounded-xl border p-4 ${borderColor} ${bg}`}>
      <div className="flex items-start gap-2 mb-3">
        <span className="text-sm">
          {isCorrect === true ? '✅' : isCorrect === false ? '❌' : '📝'}
        </span>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
          Q{index + 1}: {question.question}
        </p>
      </div>

      {question.type === 'mcq' && (
        <div className="ml-6 space-y-1 text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            Your answer: <span className={isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
              {given || '(not answered)'}
            </span>
          </div>
          {!isCorrect && question.correct_answer && (
            <div className="text-green-600 dark:text-green-400">
              Correct: <span className="font-medium">{question.correct_answer}</span>
            </div>
          )}
        </div>
      )}

      {question.type === 'theory' && given && (
        <div className="ml-6 text-sm text-gray-600 dark:text-gray-400 italic">
          Your answer: "{given.slice(0, 120)}{given.length > 120 ? '...' : ''}"
        </div>
      )}

      {showExplanation && question.explanation && (
        <div className="ml-6 mt-2 p-2.5 rounded-lg bg-white dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          💡 {question.explanation}
        </div>
      )}

      {showExplanation && question.type === 'theory' && question.correct_answer && (
        <div className="ml-6 mt-2 p-2.5 rounded-lg bg-white dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Model answer: </span>{question.correct_answer}
        </div>
      )}
    </div>
  )
}
