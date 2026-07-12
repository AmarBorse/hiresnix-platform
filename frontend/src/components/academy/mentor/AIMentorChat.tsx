import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../../lib/academy/academyTypes'

interface AIMentorChatProps {
  messages: ChatMessage[]
  streamingText: string
  isStreaming: boolean
  listeningTranscript: string
}

export default function AIMentorChat({
  messages,
  streamingText,
  isStreaming,
  listeningTranscript,
}: AIMentorChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, listeningTranscript])

  if (messages.length === 0 && !streamingText && !listeningTranscript) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6">
        <div className="text-3xl mb-2">👋</div>
        <p className="text-sm text-gray-400 max-w-xs">
          Ask me anything — coding doubts, career tips, or anything on your mind.
          <br />
          <span className="text-xs">Type below or use the mic 🎤</span>
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      {messages.map((msg) => (
        <MentorBubble key={msg.id} message={msg} />
      ))}

      {/* Live transcript while listening */}
      {listeningTranscript && (
        <div className="flex justify-end">
          <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tr-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm italic opacity-75">
            {listeningTranscript}…
          </div>
        </div>
      )}

      {/* Streaming response */}
      {streamingText && (
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
            🤖
          </div>
          <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {streamingText}
            <span className="inline-block w-0.5 h-3.5 bg-purple-500 ml-0.5 animate-pulse align-text-bottom" />
          </div>
        </div>
      )}

      {/* Typing dots when streaming but no text yet */}
      {isStreaming && !streamingText && (
        <div className="flex gap-2 items-center">
          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs shrink-0">🤖</div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

function MentorBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tr-sm bg-blue-600 text-white text-sm leading-relaxed">
          {message.message}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
        🤖
      </div>
      <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
        {message.message}
      </div>
    </div>
  )
}
