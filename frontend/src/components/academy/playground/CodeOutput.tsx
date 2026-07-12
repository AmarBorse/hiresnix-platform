import type { PistonResult } from '../../../lib/academy/pistonApi'

interface CodeOutputProps {
  result: PistonResult | null
  isRunning: boolean
  error: string | null
}

export default function CodeOutput({ result, isRunning, error }: CodeOutputProps) {
  if (isRunning) {
    return (
      <div className="h-32 rounded-lg bg-gray-950 flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400" />
        <span className="text-green-400 text-sm font-mono">Running...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-32 rounded-lg bg-gray-950 p-3 overflow-auto">
        <div className="text-red-400 text-xs font-mono">⚠ {error}</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="h-32 rounded-lg bg-gray-950 flex items-center justify-center">
        <span className="text-gray-600 text-sm font-mono">
          Run your code to see output here
        </span>
      </div>
    )
  }

  const hasCompileError = result.compile?.stderr && result.compile.stderr.length > 0
  const hasRuntimeError = result.stderr && result.stderr.length > 0
  const hasOutput = result.stdout && result.stdout.length > 0

  return (
    <div className="rounded-lg bg-gray-950 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-60" />
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
        </div>
        <span className="text-gray-500 text-xs font-mono ml-1">Output</span>
        {result.exitCode !== 0 && (
          <span className="ml-auto text-xs text-red-400 font-mono">
            exit code {result.exitCode}
          </span>
        )}
        {result.exitCode === 0 && (
          <span className="ml-auto text-xs text-green-400 font-mono">✓ success</span>
        )}
      </div>

      <div className="p-3 max-h-48 overflow-auto font-mono text-xs leading-relaxed">
        {hasCompileError && (
          <div className="mb-2">
            <div className="text-yellow-500 mb-1">Compile error:</div>
            <pre className="text-red-400 whitespace-pre-wrap">{result.compile!.stderr}</pre>
          </div>
        )}

        {hasOutput && (
          <pre className="text-green-300 whitespace-pre-wrap">{result.stdout}</pre>
        )}

        {hasRuntimeError && (
          <div className={hasOutput ? 'mt-2 pt-2 border-t border-gray-800' : ''}>
            <pre className="text-red-400 whitespace-pre-wrap">{result.stderr}</pre>
          </div>
        )}

        {!hasOutput && !hasRuntimeError && !hasCompileError && (
          <span className="text-gray-500">(no output)</span>
        )}
      </div>
    </div>
  )
}
