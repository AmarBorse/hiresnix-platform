import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient' // your existing client
import { getChatHistory } from '../../lib/academy/academySupabase'
import type { ChatMessage } from '../../lib/academy/academyTypes'

interface UseAITeacherOptions {
  lessonId: string
  userId: string
}

export function useAITeacher({ lessonId, userId }: UseAITeacherOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load existing chat history on mount
  useEffect(() => {
    if (!userId || !lessonId) return
    getChatHistory(userId, lessonId, 'teach', 30)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [userId, lessonId])

  const sendMessage = useCallback(
    async (studentMessage?: string) => {
      if (isStreaming) return
      setError(null)
      setIsStreaming(true)
      setStreamingText('')

      // Optimistically add student message to UI
      if (studentMessage) {
        const optimisticMsg: ChatMessage = {
          id: crypto.randomUUID(),
          user_id: userId,
          lesson_id: lessonId,
          role: 'user',
          message: studentMessage,
          mode: 'teach',
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, optimisticMsg])
      }

      abortRef.current = new AbortController()

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        // Last 10 turns as history context
        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          message: m.message,
        }))

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/teach-lesson`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              lesson_id: lessonId,
              student_message: studentMessage ?? null,
              conversation_history: history,
            }),
            signal: abortRef.current.signal,
          }
        )

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Server error: ${errText}`)
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

          for (const line of lines) {
            const data = line.slice(6)
            try {
              const event = JSON.parse(data)

              if (event.type === 'delta') {
                fullText += event.content
                setStreamingText(fullText)
              }

              if (event.type === 'done') {
                // Add final assistant message to state
                const assistantMsg: ChatMessage = {
                  id: crypto.randomUUID(),
                  user_id: userId,
                  lesson_id: lessonId,
                  role: 'assistant',
                  message: fullText,
                  mode: 'teach',
                  created_at: new Date().toISOString(),
                }
                setMessages((prev) => [...prev, assistantMsg])
                setStreamingText('')
              }

              if (event.type === 'error') {
                throw new Error(event.error)
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
        setStreamingText('')
      } finally {
        setIsStreaming(false)
      }
    },
    [lessonId, userId, messages, isStreaming]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStreamingText('')
  }, [])

  const generateNotes = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ lesson_id: lessonId }),
        }
      )

      const data = await res.json()
      return data.notes ?? null
    } catch (err) {
      console.error('generate-notes error:', err)
      return null
    }
  }, [lessonId])

  return {
    messages,
    streamingText,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    stopStreaming,
    generateNotes,
  }
}
