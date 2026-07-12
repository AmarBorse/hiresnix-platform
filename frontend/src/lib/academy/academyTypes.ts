export type LessonStatus = 'not_started' | 'in_progress' | 'completed'
export type AssignmentStatus = 'submitted' | 'under_review' | 'reviewed'
export type ChatMode = 'teach' | 'mentor' | 'trace'
export type ChatRole = 'user' | 'assistant'

export interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
  progress?: number // computed client-side
}

export interface Module {
  id: string
  course_id: string
  title: string
  order_index: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  objective: string | null
  key_concepts: KeyConcept[]
  code_demo: CodeDemo
  generated_notes: string | null
  order_index: number
  status?: LessonStatus // from lesson_progress join
}

export interface KeyConcept {
  title: string
  explanation: string
}

export interface CodeDemo {
  language: string
  code: string
  description?: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  status: LessonStatus
  completed_at: string | null
}

export interface QuizAttempt {
  id: string
  user_id: string
  lesson_id: string
  score: number
  answers: QuizAnswer[]
  attempted_at: string
}

export interface QuizAnswer {
  question_index: number
  selected: string
  correct: boolean
}

export interface Assignment {
  id: string
  user_id: string
  lesson_id: string
  submission_text: string | null
  status: AssignmentStatus
  reviewed_at: string | null
}

export interface ChatMessage {
  id: string
  user_id: string
  lesson_id: string
  role: ChatRole
  message: string
  mode: ChatMode
  created_at: string
}

export interface CodeSession {
  id: string
  user_id: string
  lesson_id: string
  language: string
  code: string
  output: string | null
  saved_at: string
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  issued_at: string
  verify_hash: string
  pdf_url: string | null
}

// UI-only types
export interface StreamChunk {
  type: 'delta' | 'done' | 'error'
  content?: string
  error?: string
}
