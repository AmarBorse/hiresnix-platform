import { supabase } from '../../lib/supabaseClient'

export interface CourseProgress {
  course_id: string
  course_title: string
  total_lessons: number
  completed: number
  in_progress: number
  percent: number
}

export interface ModuleProgress {
  module_id: string
  module_title: string
  order_index: number
  total: number
  completed: number
  percent: number
}

export interface QuizHistory {
  lesson_id: string
  lesson_title: string
  score: number
  attempted_at: string
}

export interface ActivityDay {
  date: string        // YYYY-MM-DD
  count: number       // number of distinct events that day
}

export interface DashboardStats {
  totalCoursesEnrolled: number
  totalLessonsCompleted: number
  totalQuizzesTaken: number
  totalAssignmentsSubmitted: number
  practiceProblemsAttempted: number
  currentStreakDays: number
  longestStreakDays: number
  avgQuizScore: number
}

// ── Per-course completion breakdown ──────────────────────────

export async function getCourseProgressList(userId: string): Promise<CourseProgress[]> {
  // Get all published courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('is_published', true)

  if (!courses || courses.length === 0) return []

  const results: CourseProgress[] = []

  for (const course of courses) {
    // Get all lessons in this course
    const { data: modules } = await supabase
      .from('modules')
      .select('lessons(id)')
      .eq('course_id', course.id)

    const allLessonIds: string[] = (modules ?? [])
      .flatMap((m: { lessons: { id: string }[] }) => m.lessons ?? [])
      .map((l: { id: string }) => l.id)

    if (allLessonIds.length === 0) continue

    // Get user's progress for these lessons
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, status')
      .eq('user_id', userId)
      .in('lesson_id', allLessonIds)

    const completed  = (progress ?? []).filter(p => p.status === 'completed').length
    const inProgress = (progress ?? []).filter(p => p.status === 'in_progress').length

    results.push({
      course_id: course.id,
      course_title: course.title,
      total_lessons: allLessonIds.length,
      completed,
      in_progress: inProgress,
      percent: allLessonIds.length > 0 ? Math.round((completed / allLessonIds.length) * 100) : 0,
    })
  }

  return results
}

// ── Module breakdown for a single course ─────────────────────

export async function getModuleProgressList(
  userId: string,
  courseId: string
): Promise<ModuleProgress[]> {
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, order_index, lessons(id)')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (!modules) return []

  const results: ModuleProgress[] = []

  for (const mod of modules) {
    const lessonIds = (mod.lessons ?? []).map((l: { id: string }) => l.id)
    if (lessonIds.length === 0) continue

    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('status')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    const completed = (progress ?? []).filter(p => p.status === 'completed').length

    results.push({
      module_id: mod.id,
      module_title: mod.title,
      order_index: mod.order_index,
      total: lessonIds.length,
      completed,
      percent: lessonIds.length > 0 ? Math.round((completed / lessonIds.length) * 100) : 0,
    })
  }

  return results
}

// ── Quiz score history ────────────────────────────────────────

export async function getQuizHistory(userId: string, limit = 20): Promise<QuizHistory[]> {
  const { data } = await supabase
    .from('quiz_attempts')
    .select('lesson_id, score, attempted_at, lessons(title)')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((row: {
    lesson_id: string
    score: number
    attempted_at: string
    lessons: { title: string } | null
  }) => ({
    lesson_id: row.lesson_id,
    lesson_title: row.lessons?.title ?? 'Unknown lesson',
    score: row.score,
    attempted_at: row.attempted_at,
  }))
}

// ── Activity heatmap data (last 60 days) ─────────────────────

export async function getActivityData(userId: string): Promise<ActivityDay[]> {
  const since = new Date()
  since.setDate(since.getDate() - 60)
  const sinceStr = since.toISOString()

  // Combine activity from multiple tables
  const [progressRes, quizRes, chatRes] = await Promise.all([
    supabase
      .from('lesson_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', sinceStr)
      .not('completed_at', 'is', null),

    supabase
      .from('quiz_attempts')
      .select('attempted_at')
      .eq('user_id', userId)
      .gte('attempted_at', sinceStr),

    supabase
      .from('chat_history')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sinceStr)
      .eq('role', 'user')
      .limit(200),
  ])

  const dayMap: Record<string, Set<string>> = {}

  const addDay = (isoDate: string, source: string) => {
    const day = isoDate.slice(0, 10)
    if (!dayMap[day]) dayMap[day] = new Set()
    dayMap[day].add(source)
  }

  ;(progressRes.data ?? []).forEach((r: { completed_at: string }) => addDay(r.completed_at, 'progress'))
  ;(quizRes.data ?? []).forEach((r: { attempted_at: string }) => addDay(r.attempted_at, 'quiz'))
  ;(chatRes.data ?? []).forEach((r: { created_at: string }) => addDay(r.created_at, 'chat'))

  return Object.entries(dayMap)
    .map(([date, sources]) => ({ date, count: sources.size }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ── Aggregate stats ───────────────────────────────────────────

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [
    { count: completedLessons },
    { count: quizzesTaken },
    { count: assignmentsSubmitted },
    { count: practiceAttempts },
    { data: quizScores },
    activityData,
  ] = await Promise.all([
    supabase.from('lesson_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'completed'),

    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    supabase.from('assignments').select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    supabase.from('code_sessions').select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    supabase.from('quiz_attempts').select('score').eq('user_id', userId),

    getActivityData(userId),
  ])

  const avgScore = quizScores && quizScores.length > 0
    ? Math.round(quizScores.reduce((s: number, r: { score: number }) => s + r.score, 0) / quizScores.length)
    : 0

  // Streak calculation
  const { currentStreak, longestStreak } = calcStreaks(activityData)

  // Enrolled courses = courses with at least 1 lesson_progress row
  const { data: enrolledRows } = await supabase
    .from('lesson_progress')
    .select('lesson_id, lessons!inner(module_id, modules!inner(course_id))')
    .eq('user_id', userId)

  const uniqueCourses = new Set(
    (enrolledRows ?? []).map((r: {
      lessons: { modules: { course_id: string } }
    }) => r.lessons?.modules?.course_id)
  )

  return {
    totalCoursesEnrolled: uniqueCourses.size,
    totalLessonsCompleted: completedLessons ?? 0,
    totalQuizzesTaken: quizzesTaken ?? 0,
    totalAssignmentsSubmitted: assignmentsSubmitted ?? 0,
    practiceProblemsAttempted: practiceAttempts ?? 0,
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    avgQuizScore: avgScore,
  }
}

function calcStreaks(activity: ActivityDay[]): { currentStreak: number; longestStreak: number } {
  if (activity.length === 0) return { currentStreak: 0, longestStreak: 0 }

  const activeDays = new Set(activity.map(a => a.date))
  const today = new Date().toISOString().slice(0, 10)

  let currentStreak = 0
  let longestStreak = 0
  let streak = 0
  let prevDate: Date | null = null

  const sortedDays = [...activeDays].sort()

  for (const dateStr of sortedDays) {
    const d = new Date(dateStr)
    if (prevDate) {
      const diff = (d.getTime() - prevDate.getTime()) / 86400000
      if (diff === 1) {
        streak++
      } else {
        streak = 1
      }
    } else {
      streak = 1
    }
    longestStreak = Math.max(longestStreak, streak)
    prevDate = d
  }

  // Current streak: check if today or yesterday is in the set
  const todayDate = new Date(today)
  let checkDate = todayDate
  currentStreak = 0

  while (true) {
    const ds = checkDate.toISOString().slice(0, 10)
    if (!activeDays.has(ds)) break
    currentStreak++
    checkDate = new Date(checkDate.getTime() - 86400000)
  }

  return { currentStreak, longestStreak }
}
