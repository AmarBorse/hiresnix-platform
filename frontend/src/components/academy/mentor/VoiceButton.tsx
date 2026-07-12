interface VoiceButtonProps {
  isListening: boolean
  isSpeaking: boolean
  supported: boolean
  onToggle: () => void
  onStopSpeaking: () => void
  disabled?: boolean
}

export default function VoiceButton({
  isListening,
  isSpeaking,
  supported,
  onToggle,
  onStopSpeaking,
  disabled,
}: VoiceButtonProps) {
  if (!supported) {
    return (
      <div className="relative group">
        <button
          disabled
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center
            justify-center text-gray-400 cursor-not-allowed"
          aria-label="Voice not supported"
        >
          <MicIcon />
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded
          bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
          Not supported in this browser
        </div>
      </div>
    )
  }

  if (isSpeaking) {
    return (
      <button
        onClick={onStopSpeaking}
        className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center
          justify-center text-green-600 dark:text-green-400 hover:bg-green-200
          dark:hover:bg-green-900/50 transition-colors relative"
        aria-label="Stop speaking"
      >
        {/* Sound wave icon */}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        {/* Animated dot */}
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900">
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping" />
        </span>
      </button>
    )
  }

  if (isListening) {
    return (
      <button
        onClick={onToggle}
        className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center
          text-white relative"
        aria-label="Stop listening"
      >
        <MicIcon />
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-40" />
        <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse" />
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center
        justify-center text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600
        dark:hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      aria-label="Start voice input"
    >
      <MicIcon />
    </button>
  )
}

function MicIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0014 0" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round"/>
      <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round"/>
    </svg>
  )
}
