import { useState, useRef, KeyboardEvent } from 'react'

interface AITeacherInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

const QUICK_REPLIES = [
  'Samajh aaya ✓',
  'Repeat karo',
  'Example do',
  'Next concept',
  'Doubt hai',
]

export default function AITeacherInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
}: AITeacherInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
      {/* Quick replies */}
      <div className="flex gap-2 flex-wrap mb-2">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            onClick={() => onSend(reply)}
            disabled={isStreaming || disabled}
            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700
              text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600
              dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Apna sawaal likho... (Enter to send)"
          disabled={isStreaming || disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700
            bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200
            placeholder-gray-400 px-3 py-2.5 focus:outline-none focus:border-blue-400
            dark:focus:border-blue-500 transition-colors disabled:opacity-50"
        />

        {isStreaming ? (
          <button
            onClick={onStop}
            className="shrink-0 w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30
              text-red-600 dark:text-red-400 flex items-center justify-center
              hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            aria-label="Stop"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center
              justify-center hover:bg-blue-700 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
