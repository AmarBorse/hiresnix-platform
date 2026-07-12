import { useState } from 'react'
import type { Lesson } from '../../../lib/academy/academyTypes'
import { supabase } from '../../../lib/supabaseClient'

interface LessonNotesProps {
  lesson: Lesson
  userId: string
}

export default function LessonNotes({ lesson, userId }: LessonNotesProps) {
  const [notes, setNotes] = useState<string | null>(lesson.generated_notes ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not logged in')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ lesson_id: lesson.id }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate notes')
      setNotes(data.notes)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (!notes) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📝</div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
          Notes are generated from your AI Teacher conversation. Complete at least a few exchanges first.
        </p>
        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading || !userId}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ Generating...' : '✨ Generate my notes'}
        </button>
      </div>
    )
  }

  // Simple markdown → HTML renderer for notes
  const rendered = notes
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 pb-1 border-b border-gray-200 dark:border-gray-700">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-3">$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 text-xs font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed list-disc">$1</li>')
    .replace(/^(?!<[h|l])/gm, (line) =>
      line.trim() ? `<p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">${line}</p>` : ''
    )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Lesson notes
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
              text-gray-500 hover:text-blue-600 hover:border-blue-400 transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Regenerating...' : '↺ Regenerate'}
          </button>
          <button
            onClick={() => {
              const blob = new Blob([notes], { type: 'text/markdown' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${lesson.title.replace(/\s+/g, '-').toLowerCase()}-notes.md`
              a.click()
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
              text-gray-500 hover:text-blue-600 hover:border-blue-400 transition-colors"
          >
            ⬇ Download
          </button>
        </div>
      </div>

      <div
        className="prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  )
}
