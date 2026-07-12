import { useState, useEffect } from 'react'
import {
  getCourseProgressList,
  getQuizHistory,
  getActivityData,
  getDashboardStats,
  type CourseProgress,
  type QuizHistory,
  type ActivityDay,
  type DashboardStats,
} from './progressQueries'

interface UseProgressDashboardOptions {
  userId: string
}

export function useProgressDashboard({ userId }: UseProgressDashboardOptions) {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [quizHistory, setQuizHistory]       = useState<QuizHistory[]>([])
  const [activityData, setActivityData]     = useState<ActivityDay[]>([])
  const [stats, setStats]                   = useState<DashboardStats | null>(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [courses, quiz, activity, dashStats] = await Promise.all([
          getCourseProgressList(userId),
          getQuizHistory(userId, 20),
          getActivityData(userId),
          getDashboardStats(userId),
        ])
        setCourseProgress(courses)
        setQuizHistory(quiz)
        setActivityData(activity)
        setStats(dashStats)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load progress')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  return { courseProgress, quizHistory, activityData, stats, loading, error }
}
