import { useEffect, useRef, useCallback } from 'react'
import { Editor } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { useTracer } from '../../../hooks/academy/useTracer'

interface TraceViewerProps {
  code: string
  onClose: () => void
}

export default function TraceViewer({ code, onClose }: TraceViewerProps) {
  const {
    traceData,
    currentStep,
    currentStepIndex,
    totalSteps,
    isLoading,
    error,
    runTrace,
    goToStep,
    nextStep,
    prevStep,
    reset,
  } = useTracer()

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<Monaco.editor.IEditorDecorationsCollection | null>(null)

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextStep()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevStep()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [nextStep, prevStep, onClose])

  // Highlight current line in Monaco
  useEffect(() => {
    if (!editorRef.current || !currentStep) return

    if (decorationsRef.current) {
      decorationsRef.current.clear()
    }

    const lineColor = currentStep.exception
      ? 'trace-line-error'
      : currentStep.event === 'return'
      ? 'trace-line-return'
      : 'trace-line-current'

    decorationsRef.current = editorRef.current.createDecorationsCollection([
      {
        range: {
          startLineNumber: currentStep.line,
          endLineNumber: currentStep.line,
          startColumn: 1,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: lineColor,
        },
      },
    ])
    editorRef.current.revealLineInCenter(currentStep.line)
  }, [currentStep])

  const handleEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor
    },
    []
  )

  const handleStart = (direction: 'forward' | 'backward') => {
    reset()
    runTrace(code, direction)
  }

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        <p className="text-sm text-gray-400">
          Running tracer + generating narrations... (~10s)
        </p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 p-6 text-center">
        <div className="text-3xl mb-3">⚠️</div>
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => handleStart('forward')}
          className="text-sm px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Start screen ─────────────────────────────────────────
  if (!traceData) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
        <div className="text-4xl mb-3">🔬</div>
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
          Code Tracer
        </h3>
        <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
          Watch your Python code execute step by step — see every variable change, with AI narration.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleStart('forward')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white
              text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            ▶ Forward trace
          </button>
          <button
            onClick={() => handleStart('backward')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-300
              dark:border-purple-700 text-purple-700 dark:text-purple-300
              text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            ◀ Backward trace
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Python only · max 120 steps</p>
      </div>
    )
  }

  // ── Main viewer ──────────────────────────────────────────
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0
  const isBackward = traceData.direction === 'backward'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <style>{`
        .trace-line-current { background: rgba(139,92,246,0.18) !important; border-left: 3px solid #7c3aed !important; }
        .trace-line-return   { background: rgba(16,185,129,0.15) !important; border-left: 3px solid #10b981 !important; }
        .trace-line-error    { background: rgba(239,68,68,0.15)  !important; border-left: 3px solid #ef4444 !important; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60
        border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isBackward ? '◀ Backward trace' : '▶ Forward trace'}
          </span>
          {traceData.truncated && (
            <span className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
              Truncated at 120 steps
            </span>
          )}
          {traceData.error && (
            <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
              Runtime error
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStart(isBackward ? 'forward' : 'backward')}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded"
          >
            Switch direction
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
            aria-label="Close tracer"
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full bg-purple-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* ── Left: Monaco editor ── */}
        <div className="border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
          <Editor
            height="280px"
            language="python"
            value={traceData.source_lines.join('\n')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              readOnly: true,
              fontSize: 12,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              glyphMargin: false,
              folding: false,
              wordWrap: 'on',
              padding: { top: 8, bottom: 8 },
              automaticLayout: true,
            }}
          />
        </div>

        {/* ── Right: Step info ── */}
        <div className="flex flex-col h-[280px]">
          {/* Narration */}
          {currentStep && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-purple-50 dark:bg-purple-900/10">
              <div className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">💬</span>
                <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                  {currentStep.narration}
                </p>
              </div>
              {currentStep.exception && (
                <div className="mt-2 text-xs text-red-500 font-mono bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                  ⚠ {currentStep.exception}
                </div>
              )}
              {currentStep.return_value !== undefined && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-mono">
                  Returns: {JSON.stringify(currentStep.return_value)}
                </div>
              )}
            </div>
          )}

          {/* Variable watch panel */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Variables at step {currentStepIndex + 1}
              {currentStep?.function && (
                <span className="ml-2 text-purple-400">in {currentStep.function}()</span>
              )}
            </div>

            {currentStep && Object.keys(currentStep.variables).length > 0 ? (
              <div className="space-y-1.5">
                {Object.entries(currentStep.variables).map(([key, val]) => {
                  // Detect if variable changed vs previous step
                  const prevStep = traceData.steps[currentStepIndex - 1]
                  const prevVal = prevStep?.variables[key]
                  const changed = JSON.stringify(prevVal) !== JSON.stringify(val)

                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono
                        transition-colors ${
                          changed && currentStepIndex > 0
                            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                            : 'bg-gray-50 dark:bg-gray-800/50'
                        }`}
                    >
                      <span className="text-blue-600 dark:text-blue-400 shrink-0">{key}</span>
                      <span className="text-gray-400">=</span>
                      <span className="text-green-600 dark:text-green-400 break-all">
                        {JSON.stringify(val)}
                      </span>
                      {changed && currentStepIndex > 0 && (
                        <span className="ml-auto shrink-0 text-amber-500">✦ changed</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                {currentStep ? 'No variables yet.' : 'Select a step to inspect variables.'}
              </p>
            )}
          </div>

          {/* stdout so far */}
          {currentStep?.stdout_so_far && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-950">
              <div className="text-xs text-gray-500 mb-1">stdout so far</div>
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap max-h-16 overflow-y-auto">
                {currentStep.stdout_so_far}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700
        bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
        {/* Prev */}
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200
            dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400
            hover:border-purple-400 hover:text-purple-600 disabled:opacity-30
            disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>

        {/* Step scrubber */}
        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={currentStepIndex}
            onChange={(e) => goToStep(Number(e.target.value))}
            className="flex-1 accent-purple-500"
          />
          <span className="text-xs text-gray-500 shrink-0 font-mono w-16 text-right">
            {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Next */}
        <button
          onClick={nextStep}
          disabled={currentStepIndex === totalSteps - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200
            dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400
            hover:border-purple-400 hover:text-purple-600 disabled:opacity-30
            disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>

      {/* ── Final output strip ── */}
      {traceData.final_output && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-950">
          <span className="text-xs text-gray-500 mr-2">Final output:</span>
          <span className="text-xs text-green-400 font-mono">{traceData.final_output.trim()}</span>
        </div>
      )}

      {/* Keyboard hint */}
      <div className="px-4 py-1.5 border-t border-gray-100 dark:border-gray-800 text-center">
        <span className="text-xs text-gray-400">
          ← → arrow keys to navigate · Esc to close
        </span>
      </div>
    </div>
  )
}
