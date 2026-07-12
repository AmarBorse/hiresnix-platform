import { supabase } from '../supabaseClient' // your existing supabase client
import type {
  Course, Module, Lesson, LessonProgress,
  QuizAttempt, Assignment, ChatMessage, CodeSession, Certificate
} from './academyTypes'

// ─── COURSES ────────────────────────────────────────────────

export async function getPublishedCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select('*')
    .eq('id', courseId)
    .single()
  if (error) throw error
  return data
}

// ─── MODULES + LESSONS ──────────────────────────────────────

export async function getModulesWithLessons(courseId: string): Promise<Module[]> {
  const { data, error } = await supabase
    .from('academy_modules')
    .select(`
      *,
      lessons (
        id, module_id, title, objective, key_concepts,
        code_demo, generated_notes, order_index
      )
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (error) throw error

  return (data ?? []).map((mod) => ({
    ...mod,
    lessons: (mod.lessons ?? []).sort(
      (a: Lesson, b: Lesson) => a.order_index - b.order_index
    ),
  }))
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('academy_lessons')
    .select('*')
    .eq('id', lessonId)
    .single()
  if (error) throw error
  return data
}

// ─── LESSON PROGRESS ────────────────────────────────────────

export async function getLessonProgressForCourse(
  userId: string,
  courseId: string
): Promise<LessonProgress[]> {
  const { data, error } = await supabase
    .from('academy_lesson_progress')
    .select('*, academy_lessons!inner(module_id, modules!inner(course_id))')
    .eq('user_id', userId)
    .eq('academy_lessons.academy_modules.course_id', courseId)
  if (error) throw error
  return data ?? []
}

export async function upsertLessonProgress(
  userId: string,
  lessonId: string,
  status: LessonProgress['status']
): Promise<void> {
  const { error } = await supabase.from('academy_lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,lesson_id' }
  )
  if (error) throw error
}

// ─── CHAT HISTORY ────────────────────────────────────────────

export async function getChatHistory(
  userId: string,
  lessonId: string,
  mode: ChatMessage['mode'] = 'teach',
  limit = 20
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('academy_chat_history')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('mode', mode)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function saveChatMessage(
  msg: Omit<ChatMessage, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('academy_chat_history').insert(msg)
  if (error) throw error
}

// ─── QUIZ ATTEMPTS ───────────────────────────────────────────

export async function saveQuizAttempt(
  attempt: Omit<QuizAttempt, 'id' | 'attempted_at'>
): Promise<void> {
  const { error } = await supabase.from('academy_quiz_attempts').insert(attempt)
  if (error) throw error
}

export async function getQuizAttempts(
  userId: string,
  lessonId: string
): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('academy_quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('attempted_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ─── ASSIGNMENTS ─────────────────────────────────────────────

export async function submitAssignment(
  userId: string,
  lessonId: string,
  submissionText: string
): Promise<void> {
  const { error } = await supabase.from('academy_assignments').insert({
    user_id: userId,
    lesson_id: lessonId,
    submission_text: submissionText,
    status: 'submitted',
  })
  if (error) throw error
}

export async function getAssignment(
  userId: string,
  lessonId: string
): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from('academy_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// ─── CODE SESSIONS ───────────────────────────────────────────

export async function saveCodeSession(
  session: Omit<CodeSession, 'id' | 'saved_at'>
): Promise<void> {
  const { error } = await supabase.from('academy_code_sessions').insert(session)
  if (error) throw error
}

export async function getLatestCodeSession(
  userId: string,
  lessonId: string
): Promise<CodeSession | null> {
  const { data, error } = await supabase
    .from('academy_code_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('saved_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// ─── CERTIFICATES ────────────────────────────────────────────

export async function getCertificate(
  userId: string,
  courseId: string
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('academy_certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getCertificateByHash(hash: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('academy_certificates')
    .select('*')
    .eq('verify_hash', hash)
    .maybeSingle()
  if (error) throw error
  return data
}

// ─── PROGRESS HELPERS ────────────────────────────────────────

export async function getCourseCompletionPercent(
  userId: string,
  courseId: string
): Promise<number> {
  const modules = await getModulesWithLessons(courseId)
  const allLessons = modules.flatMap((m) => m.lessons ?? [])
  if (allLessons.length === 0) return 0

  const progress = await getLessonProgressForCourse(userId, courseId)
  const completed = progress.filter((p) => p.status === 'completed').length
  return Math.round((completed / allLessons.length) * 100)
}
