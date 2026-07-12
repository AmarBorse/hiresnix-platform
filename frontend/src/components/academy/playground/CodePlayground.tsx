import { useState, useRef, useEffect, useCallback } from 'react'
import { Editor } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { LANGUAGES, type LanguageConfig } from '../../../lib/academy/pistonApi'
import { useCodeRunner } from '../../../hooks/academy/useCodeRunner'
import CodeOutput from './CodeOutput'
import CodeExplainer from './CodeExplainer'
import TraceViewer from './TraceViewer'
import type { Lesson } from '../../../lib/academy/academyTypes'

interface CodePlaygroundProps {
  lesson: Lesson
  userId: string
}

export default function CodePlayground({ lesson, userId }: CodePlaygroundProps) {
  const defaultLang = lesson.code_demo?.language ?? 'python'
  const validLang = LANGUAGES[defaultLang] ? defaultLang : 'python'
  const config: LanguageConfig = LANGUAGES[validLang]

  const [language, setLanguage] = useState(validLang)
  const [code, setCode] = useState<string>(lesson.code_demo?.code ?? config.defaultCode)
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null)
  const [showExplainer, setShowExplainer] = useState(false)
  const [showTracer, setShowTracer] = useState(false)

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<Monaco.editor.IEditorDecorationsCollection | null>(null)

  const { execute, isRunning, result, error, clearResult } = useCodeRunner({
    lessonId: lesson.id,
    userId,
  })

  // Highlight line from annotation click
  useEffect(() => {
    if (!editorRef.current) return
    if (decorationsRef.current) {
      decorationsRef.current.clear()
      decorationsRef.current = null
    }
    if (highlightedLine !== null) {
      decorationsRef.current = editorRef.current.createDecorationsCollection([
        {
          range: {
            startLineNumber: highlightedLine,
            endLineNumber: highlightedLine,
            startColumn: 1,
            endColumn: 1,
          },
          options: { isWholeLine: true, className: 'monaco-highlighted-line' },
        },
      ])
      editorRef.current.revealLineInCenter(highlightedLine)
    }
  }, [highlightedLine])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    const newConfig = LANGUAGES[newLang]
    if (newConfig) {
      setCode(newConfig.defaultCode)
      clearResult()
      setHighlightedLine(null)
      setShowTracer(false)
    }
  }

  const handleRun = useCallback(async () => {
    setHighlightedLine(null)
    setShowTracer(false)
    await execute(language, code)
  }, [language, code, execute])

  const handleEditorMount = (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  const currentConfig = LANGUAGES[language] ?? config
  const hasError = result && (result.stderr || result.exitCode !== 0)
  const isPython = language === 'python'

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
            focus:outline-none focus:border-blue-400 transition-colors"
        >
          {Object.entries(LANGUAGES).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        {/* Run */}
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-600
            hover:bg-green-700 text-white text-sm font-medium transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> Run</>
          )}
        </button>

        {/* Trace — Python only */}
        {isPython && (
          <button
            onClick={() => { setShowTracer(v => !v); setShowExplainer(false) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showTracer
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-purple-400'
            }`}
          >
            🔬 Trace
          </button>
        )}

        {/* AI Assist */}
        <button
          onClick={() => { setShowExplainer(v => !v); setShowTracer(false) }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showExplainer
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-purple-400'
          }`}
        >
          🔍 AI Assist
        </button>

        <button
          onClick={() => { setCode(currentConfig.defaultCode); clearResult(); setHighlightedLine(null); setShowTracer(false) }}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ↺ Reset
        </button>
      </div>

      {/* Monaco editor — hide when tracer is open (tracer has its own editor) */}
      {!showTracer && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <style>{`.monaco-highlighted-line { background: rgba(139,92,246,0.15) !important; border-left: 3px solid #7c3aed !important; }`}</style>
          <Editor
            height="320px"
            language={currentConfig.monacoLanguage}
            value={code}
            onChange={(val) => setCode(val ?? '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              glyphMargin: true,
              folding: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
            }}
          />
        </div>
      )}

      {/* Trace Viewer */}
      {showTracer && (
        <TraceViewer
          code={code}
          onClose={() => setShowTracer(false)}
        />
      )}

      {/* Output (hidden during trace) */}
      {!showTracer && (
        <CodeOutput result={result} isRunning={isRunning} error={error} />
      )}

      {/* AI Assist */}
      {showExplainer && !showTracer && (
        <CodeExplainer
          code={code}
          language={language}
          result={result}
          highlightedLine={highlightedLine}
          onHighlightLine={setHighlightedLine}
        />
      )}

      {/* Auto-debug banner */}
      {hasError && !showExplainer && !showTracer && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <span className="text-sm text-red-600 dark:text-red-400">Error detected!</span>
          <button
            onClick={() => setShowExplainer(true)}
            className="text-sm font-medium text-red-700 dark:text-red-300 underline hover:no-underline"
          >
            Let AI debug it →
          </button>
        </div>
      )}
    </div>
  )
}
