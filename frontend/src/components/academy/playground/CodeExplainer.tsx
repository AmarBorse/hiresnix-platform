import { useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import type { PistonResult } from '../../../lib/academy/pistonApi'

interface Annotation {
  line: number
  code: string
  explanation: string
}

interface CodeExplainerProps {
  code: string
  language: string
  result: PistonResult | null
  highlightedLine: number | null
  onHighlightLine: (line: number | null) => void
}

export default function CodeExplainer({
  code,
  language,
  result,
  highlightedLine,
  onHighlightLine,
}: CodeExplainerProps) {
  const [mode, setMode] = useState<'idle' | 'explain' | 'debug'>('idle')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [debugText, setDebugText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasError = result && (result.stderr || result.exitCode !== 0)

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')
    return session
  }

  const explainCode = useCallback(async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    setAnnotations([])
    setDebugText('')
    setMode('explain')

    try {
      const session = await getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code, language }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to explain code')
      setAnnotations(data.annotations ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setMode('idle')
    } finally {
      setLoading(false)
    }
  }, [code, language])

  const debugCode = useCallback(async () => {
    if (!result?.stderr) return
    setLoading(true)
    setError(null)
    setDebugText('')
    setAnnotations([])
    setMode('debug')

    try {
      const session = await getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/debug-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            code,
            language,
            stderr: result.stderr,
            stdout: result.stdout,
          }),
        }
      )

      if (!res.ok) throw new Error('Debug request failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'delta') {
              full += event.content
              setDebugText(full)
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setMode('idle')
    } finally {
      setLoading(false)
    }
  }, [code, language, result])

  const reset = () => {
    setMode('idle')
    setAnnotations([])
    setDebugText('')
    setError(null)
    onHighlightLine(null)
  }

  return (
    <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Action buttons */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={explainCode}
          disabled={loading || !code.trim()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
            bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300
            hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50
            disabled:cursor-not-allowed transition-colors font-medium"
        >
          <span>🔍</span> Explain this code
        </button>

        {hasError && (
          <button
            onClick={debugCode}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
              bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300
              hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors font-medium"
          >
            <span>🐛</span> Debug my error
          </button>
        )}

        {mode !== 'idle' && (
          <button
            onClick={reset}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Content area */}
      {mode === 'idle' && (
        <div className="px-4 py-6 text-center text-sm text-gray-400">
          Click a button above to get AI assistance with your code.
        </div>
      )}

      {loading && (
        <div className="px-4 py-6 flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
          <span className="text-sm text-gray-400">
            {mode === 'debug' ? 'Analysing error...' : 'Explaining code...'}
          </span>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm text-red-500">⚠ {error}</div>
      )}

      {/* Explain mode: annotations list */}
      {mode === 'explain' && !loading && annotations.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
          {annotations.map((ann) => (
            <div
              key={ann.line}
              onClick={() => onHighlightLine(highlightedLine === ann.line ? null : ann.line)}
              className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
                highlightedLine === ann.line
                  ? 'bg-purple-50 dark:bg-purple-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className="shrink-0 w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800
                text-gray-500 dark:text-gray-400 text-xs font-mono flex items-center justify-center">
                {ann.line}
              </span>
              <div className="min-w-0">
                <code className="text-xs text-gray-500 dark:text-gray-400 font-mono block truncate mb-0.5">
                  {ann.code}
                </code>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                  {ann.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Debug mode: streaming markdown */}
      {mode === 'debug' && !loading && debugText && (
        <div className="px-4 py-4 max-h-72 overflow-y-auto">
          <DebugMarkdown text={debugText} />
        </div>
      )}

      {/* Debug streaming in progress */}
      {mode === 'debug' && loading && debugText && (
        <div className="px-4 py-4 max-h-72 overflow-y-auto">
          <DebugMarkdown text={debugText} />
          <span className="inline-block w-0.5 h-4 bg-red-500 ml-0.5 animate-pulse align-text-bottom" />
        </div>
      )}
    </div>
  )
}

function DebugMarkdown({ text }: { text: string }) {
  const sections = text.split(/^## /m).filter(Boolean)

  if (sections.length <= 1) {
    return <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{text}</pre>
  }

  const sectionColors: Record<string, string> = {
    'What went wrong': 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
    'Why it happened': 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10',
    'How to fix it': 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
    'Fixed code': 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
  }

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const firstNewline = section.indexOf('\n')
        const title = section.slice(0, firstNewline).trim()
        const body = section.slice(firstNewline + 1).trim()
        const colorClass = sectionColors[title] ?? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'

        // Code block inside section
        const codeMatch = body.match(/```[\w+]*\n?([\s\S]*?)```/)
        const beforeCode = codeMatch ? body.slice(0, body.indexOf('```')).trim() : body
        const codeContent = codeMatch ? codeMatch[1] : null

        return (
          <div key={i} className={`rounded-lg border p-3 ${colorClass}`}>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              {title}
            </div>
            {beforeCode && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {beforeCode}
              </p>
            )}
            {codeContent && (
              <pre className="mt-2 p-2 rounded bg-gray-900 text-green-300 text-xs font-mono overflow-x-auto">
                {codeContent}
              </pre>
            )}
          </div>
        )
      })}
    </div>
  )
}
