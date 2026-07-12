import { useState, useCallback, useRef, useEffect } from 'react'

export interface VoiceState {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  amplitude: number        // 0-1, for avatar mouth sync
  error: string | null
  supported: boolean
}

interface UseVoiceMentorOptions {
  onTranscript: (text: string) => void   // called when recognition finalises
  responseText: string                    // text to speak when it changes
}

export function useVoiceMentor({ onTranscript, responseText }: UseVoiceMentorOptions) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    amplitude: 0,
    error: null,
    supported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef       = useRef<SpeechSynthesisUtterance | null>(null)
  const amplIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSpokenRef  = useRef('')

  // Speak new response text when it arrives and finishes streaming
  useEffect(() => {
    if (!responseText || responseText === lastSpokenRef.current) return
    if (!window.speechSynthesis) return
    lastSpokenRef.current = responseText
    speak(responseText)
  }, [responseText])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
      stopSpeaking()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!state.supported) {
      setState(s => ({ ...s, error: 'Speech recognition not supported in this browser.' }))
      return
    }

    stopSpeaking()

    const SpeechRecognition =
      (window as typeof window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setState(s => ({ ...s, isListening: true, transcript: '', error: null }))
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) final += text
        else interim += text
      }
      setState(s => ({ ...s, transcript: final || interim }))
      if (final) {
        onTranscript(final.trim())
      }
    }

    recognition.onerror = (event) => {
      const msg =
        event.error === 'not-allowed' ? 'Microphone permission denied. Please allow mic access.' :
        event.error === 'no-speech'   ? 'No speech detected. Try again.' :
        `Recognition error: ${event.error}`
      setState(s => ({ ...s, error: msg, isListening: false }))
    }

    recognition.onend = () => {
      setState(s => ({ ...s, isListening: false }))
    }

    recognition.start()
  }, [state.supported, onTranscript])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setState(s => ({ ...s, isListening: false }))
  }, [])

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    // Strip markdown for speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'code block')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/#{1,3} /g, '')
      .replace(/\n+/g, ' ')
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'en-IN'
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Pick a natural voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural'))
    ) || voices.find(v => v.lang.startsWith('en')) || null
    if (preferred) utterance.voice = preferred

    // Simulate amplitude with interval (Web Speech API doesn't expose audio data)
    utterance.onstart = () => {
      setState(s => ({ ...s, isSpeaking: true, amplitude: 0 }))
      amplIntervalRef.current = setInterval(() => {
        setState(s => ({
          ...s,
          amplitude: s.isSpeaking ? 0.3 + Math.random() * 0.7 : 0,
        }))
      }, 80)
    }

    utterance.onend = () => {
      if (amplIntervalRef.current) clearInterval(amplIntervalRef.current)
      setState(s => ({ ...s, isSpeaking: false, amplitude: 0 }))
    }

    utterance.onerror = () => {
      if (amplIntervalRef.current) clearInterval(amplIntervalRef.current)
      setState(s => ({ ...s, isSpeaking: false, amplitude: 0 }))
    }

    synthRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setState(s => ({ ...s, isSpeaking: true }))
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    if (amplIntervalRef.current) clearInterval(amplIntervalRef.current)
    setState(s => ({ ...s, isSpeaking: false, amplitude: 0 }))
  }, [])

  const toggleMic = useCallback(() => {
    if (state.isListening) stopListening()
    else startListening()
  }, [state.isListening, startListening, stopListening])

  return { ...state, startListening, stopListening, stopSpeaking, toggleMic, speak }
}
