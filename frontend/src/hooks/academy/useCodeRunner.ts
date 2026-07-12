import { useState, useCallback } from 'react'
import { runCode, type PistonResult } from '../../lib/academy/pistonApi'
import { saveCodeSession } from '../../lib/academy/academySupabase'

interface UseCodeRunnerOptions {
  lessonId: string
  userId: string
}

export function useCodeRunner({ lessonId, userId }: UseCodeRunnerOptions) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<PistonResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (language: string, code: string) => {
      if (isRunning) return
      setIsRunning(true)
      setError(null)
      setResult(null)

      try {
        const output = await runCode(language, code)
        setResult(output)

        // Save session to Supabase (fire and forget)
        if (userId && lessonId) {
          saveCodeSession({
            user_id: userId,
            lesson_id: lessonId,
            language,
            code,
            output: output.stdout || output.stderr,
          }).catch(console.error)
        }

        return output
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Run failed'
        setError(msg)
        return null
      } finally {
        setIsRunning(false)
      }
    },
    [isRunning, lessonId, userId]
  )

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { execute, isRunning, result, error, clearResult }
}
