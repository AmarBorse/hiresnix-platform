import { useState, useCallback, useRef, useEffect } from 'react'
import { useAIMentor } from '../../../hooks/academy/useAIMentor'
import { useVoiceMentor } from '../../../hooks/academy/useVoiceMentor'
import AIMentorChat from './AIMentorChat'
import TalkingAvatar from './TalkingAvatar'
import VoiceButton from './VoiceButton'
import type { Lesson } from '../../../lib/academy/academyTypes'

interface AIMentorPanelProps {
  lesson: Lesson
  userId: string
}

// Quick-ask suggestions shown when chat is empty
const QUICK_ASKS = [
  'Explain this lesson simply',
  'Give me a real-world example',
  'What should I learn next?',
  'Review my resume tips',
  'Interview question on this topic',
]

export default function AIMentorPanel({ lesson, userId }: AIMentorPanelProps) {
  const [inputText, setInputText] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  // Track the last completed assistant message for TTS
  const [lastResponse, setLastResponse] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    streamingText,
    isStreaming,
    isLoading,
    provider,
    error,
    sendMessage,
    stop,
    clearHistory,
  } = useAIMentor({ lessonId: lesson.id, userId })

  // When streaming finishes, update lastResponse for TTS
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      const last = messages[messages.length - 1]
      if (last.role === 'assistant' && last.message !== lastResponse) {
        setLastResponse(last.message)
      }
    }
  }, [isStreaming, messages])

  const handleSend = useCallback((text?: string) => {
    const msg = (text ?? inputText).trim()
    if (!msg) return
    sendMessage(msg)
    setInputText('')
  }, [inputText, sendMessage])

  const handleTranscript = useCallback((text: string) => {
    // Voice transcript → send immediately
    setInputText('')
    sendMessage(text)
  }, [sendMessage])

  const voice = useVoiceMentor({
    onTranscript: handleTranscript,
    // Only auto-speak when voice mode is on and streaming is done
    responseText: voiceMode ? lastResponse : '',
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0 && !streamingText

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Mentor</span>
          {/* Provider badge */}
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
            provider === 'groq'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
          }`}>
            {provider === 'groq' ? 'Groq' : 'Claude'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Voice mode toggle */}
          <button
            onClick={() => {
              setVoiceMode(v => !v)
              if (voiceMode) voice.stopSpeaking()
            }}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              voiceMode
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title={voiceMode ? 'Voice mode on — click to turn off' : 'Turn on voice mode'}
          >
            {voiceMode ? '🔊 Voice on' : '🔇 Voice off'}
          </button>
          {/* Clear chat */}
          {!isEmpty && (
            <button
              onClick={clearHistory}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1.5 py-1 rounded"
              title="Clear chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Avatar strip (voice mode only) ── */}
      {voiceMode && (
        <div className="flex flex-col items-center py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-800/30">
          <TalkingAvatar
            amplitude={voice.amplitude}
            isSpeaking={voice.isSpeaking}
            isListening={voice.isListening}
            size={72}
          />
          <p className="text-xs text-gray-400 mt-2">
            {voice.isListening
              ? '🎤 Listening...'
              : voice.isSpeaking
              ? '🔊 Speaking...'
              : 'Tap mic to speak'}
          </p>
          {voice.transcript && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic px-4 text-center">
              "{voice.transcript}"
            </p>
          )}
        </div>
      )}

      {/* ── Chat feed ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500" />
        </div>
      ) : (
        <AIMentorChat
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          listeningTranscript={voice.isListening ? voice.transcript : ''}
        />
      )}

      {/* ── Quick asks (when empty) ── */}
      {isEmpty && !isLoading && (
        <div className="px-3 pb-2 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ASKS.map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={isStreaming}
                className="text-xs px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700
                  text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600
                  dark:hover:text-purple-400 disabled:opacity-40 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 shrink-0">
          ⚠ {error}
          <button onClick={() => handleSend()} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* ── Input row ── */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2.5 shrink-0 bg-white dark:bg-gray-900">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceMode ? 'Or type here...' : 'Ask anything... (Enter to send)'}
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700
              bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200
              placeholder-gray-400 px-3 py-2 focus:outline-none focus:border-purple-400
              dark:focus:border-purple-500 transition-colors disabled:opacity-50
              max-h-24 overflow-y-auto"
            style={{ minHeight: 36 }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 96)}px`
            }}
          />

          {/* Mic button */}
          <VoiceButton
            isListening={voice.isListening}
            isSpeaking={voice.isSpeaking}
            supported={voice.supported}
            onToggle={voice.toggleMic}
            onStopSpeaking={voice.stopSpeaking}
            disabled={isStreaming}
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              onClick={stop}
              className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
                flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shrink-0"
              aria-label="Stop"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center
                hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
