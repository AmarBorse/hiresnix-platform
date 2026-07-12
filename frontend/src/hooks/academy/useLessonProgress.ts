import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../useAuth'
import {
  getLessonProgressForCourse,
  upsertLessonProgress,
} from '../../lib/academy/academySupabase'
import type { LessonProgress, LessonStatus } from '../../lib/academy/academyTypes'

export function useLessonProgress(courseId: string) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user || !courseId) return
    try {
      const data = await getLessonProgressForCourse(user.id, courseId)
      setProgress(data)
    } catch (err) {
      console.error('Failed to load lesson progress:', err)
    } finally {
      setLoading(false)
    }
  }, [user, courseId])

  useEffect(() => {
    reload()
  }, [reload])

  const updateStatus = useCallback(
    async (lessonId: string, status: LessonStatus) => {
      if (!user) return
      // Optimistic update
      setProgress((prev) => {
        const existing = prev.find((p) => p.lesson_id === lessonId)
        if (existing) {
          return prev.map((p) =>
            p.lesson_id === lessonId ? { ...p, status } : p
          )
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: user.id,
            lesson_id: lessonId,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
          },
        ]
      })
      await upsertLessonProgress(user.id, lessonId, status)
    },
    [user]
  )

  const getLessonStatus = useCallback(
    (lessonId: string): LessonStatus =>
      progress.find((p) => p.lesson_id === lessonId)?.status ?? 'not_started',
    [progress]
  )

  return { progress, loading, updateStatus, getLessonStatus, reload }
}
