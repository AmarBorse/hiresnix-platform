import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'

export interface TraceStep {
  step: number
  line: number
  event: string
  function: string | null
  variables: Record<string, unknown>
  stdout_so_far: string
  return_value?: unknown
  exception?: string
  narration: string
}

export interface TraceData {
  steps: TraceStep[]
  source_lines: string[]
  final_output: string
  error: { type: string; message: string; traceback: string } | null
  truncated: boolean
  direction: 'forward' | 'backward'
}

export function useTracer() {
  const [traceData, setTraceData] = useState<TraceData | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTrace = useCallback(async (code: string, direction: 'forward' | 'backward' = 'forward') => {
    setIsLoading(true)
    setError(null)
    setTraceData(null)
    setCurrentStepIndex(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trace-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code, direction }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Trace failed')

      setTraceData(data)
      // For backward, start at last step
      if (direction === 'backward') {
        setCurrentStepIndex((data.steps?.length ?? 1) - 1)
      } else {
        setCurrentStepIndex(0)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const goToStep = useCallback((index: number) => {
    if (!traceData) return
    const clamped = Math.max(0, Math.min(index, traceData.steps.length - 1))
    setCurrentStepIndex(clamped)
  }, [traceData])

  const nextStep = useCallback(() => {
    if (!traceData) return
    setCurrentStepIndex(i => Math.min(i + 1, traceData.steps.length - 1))
  }, [traceData])

  const prevStep = useCallback(() => {
    setCurrentStepIndex(i => Math.max(i - 1, 0))
  }, [])

  const reset = useCallback(() => {
    setTraceData(null)
    setCurrentStepIndex(0)
    setError(null)
  }, [])

  const currentStep = traceData?.steps[currentStepIndex] ?? null
  const totalSteps = traceData?.steps.length ?? 0

  return {
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
  }
}
