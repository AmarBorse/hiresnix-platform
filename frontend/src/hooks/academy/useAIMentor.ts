import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getChatHistory } from '../../lib/academy/academySupabase'
import type { ChatMessage } from '../../lib/academy/academyTypes'

interface UseAIMentorOptions {
  lessonId: string
  userId: string
}

export function useAIMentor({ lessonId, userId }: UseAIMentorOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<'groq' | 'claude'>('groq')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!userId || !lessonId) { setIsLoading(false); return }
    getChatHistory(userId, lessonId, 'mentor', 20)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [userId, lessonId])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return
    setError(null)
    setIsStreaming(true)
    setStreamingText('')

    // Optimistic user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: userId,
      lesson_id: lessonId,
      role: 'user',
      message: text,
      mode: 'mentor',
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    abortRef.current = new AbortController()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const history = messages.slice(-10).map(m => ({ role: m.role, message: m.message }))

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ lesson_id: lessonId, message: text, conversation_history: history }),
          signal: abortRef.current.signal,
        }
      )

      if (!res.ok) throw new Error(`Server error: ${await res.text()}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'provider') setProvider(event.provider)
            if (event.type === 'delta') { fullText += event.content; setStreamingText(fullText) }
            if (event.type === 'done') {
              const assistantMsg: ChatMessage = {
                id: crypto.randomUUID(),
                user_id: userId,
                lesson_id: lessonId,
                role: 'assistant',
                message: fullText,
                mode: 'mentor',
                created_at: new Date().toISOString(),
              }
              setMessages(prev => [...prev, assistantMsg])
              setStreamingText('')
            }
            if (event.type === 'error') throw new Error(event.error)
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStreamingText('')
    } finally {
      setIsStreaming(false)
    }
  }, [lessonId, userId, messages, isStreaming])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStreamingText('')
  }, [])

  const clearHistory = useCallback(() => {
    setMessages([])
    setStreamingText('')
    setError(null)
  }, [])

  return { messages, streamingText, isStreaming, isLoading, provider, error, sendMessage, stop, clearHistory }
}
