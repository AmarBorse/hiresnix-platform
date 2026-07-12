import { useEffect, useRef, useState } from 'react'
import { useAITeacher } from '../../../hooks/academy/useAITeacher'
import AITeacherMessage from './AITeacherMessage'
import AITeacherInput from './AITeacherInput'
import type { Lesson } from '../../../lib/academy/academyTypes'

interface AITeacherChatProps {
  lesson: Lesson
  userId: string
}

export default function AITeacherChat({ lesson, userId }: AITeacherChatProps) {
  const {
    messages,
    streamingText,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    stopStreaming,
    generateNotes,
  } = useAITeacher({ lessonId: lesson.id, userId })

  const bottomRef = useRef<HTMLDivElement>(null)
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesGenerated, setNotesGenerated] = useState(false)
  const hasStarted = messages.length > 0

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Auto-start lesson on first load if no history
  useEffect(() => {
    if (!isLoading && messages.length === 0 && userId) {
      sendMessage()
    }
  }, [isLoading, userId])

  const handleGenerateNotes = async () => {
    setNotesLoading(true)
    const notes = await generateNotes()
    setNotesLoading(false)
    if (notes) setNotesGenerated(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[500px] items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-3" />
        <p className="text-sm text-gray-400">Loading your lesson...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[560px] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200
        dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Teacher
          </span>
          {isStreaming && (
            <span className="flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Generate notes button — shows after some conversation */}
        {hasStarted && messages.length >= 4 && (
          <button
            onClick={handleGenerateNotes}
            disabled={notesLoading || notesGenerated}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
              text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600
              dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {notesLoading
              ? '⏳ Generating...'
              : notesGenerated
              ? '✅ Notes saved'
              : '📝 Generate notes'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm text-gray-400 max-w-xs">
              Your AI teacher is preparing your lesson on{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">{lesson.title}</span>...
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <AITeacherMessage key={msg.id} message={msg} />
        ))}

        {/* Streaming bubble */}
        {streamingText && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center
              justify-center text-sm shrink-0 mt-0.5">
              🤖
            </div>
            <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse align-text-bottom" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            ⚠️ {error}
            <button
              onClick={() => sendMessage()}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <AITeacherInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={!userId}
      />
    </div>
  )
}
