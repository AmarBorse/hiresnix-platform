// Replace your existing pages/academy/AcademyLesson.tsx with this file.
// Changes from Phase 2: adds 'practice' to activeSection, imports LessonPractice

import { useEffect, useState, Suspense, lazy } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getModulesWithLessons, getLessonById } from '../../lib/academy/academySupabase'
import { useLessonProgress } from '../../hooks/academy/useLessonProgress'
import { useAuth } from '../../hooks/useAuth'
import type { Lesson, Module } from '../../lib/academy/academyTypes'

import LessonLayout from '../../components/academy/layout/LessonLayout'
import LessonSidebar from '../../components/academy/layout/LessonSidebar'
import LessonHeader from '../../components/academy/lesson/LessonHeader'
import AITeacherChat from '../../components/academy/teacher/AITeacherChat'
import AIMentorPanel from '../../components/academy/mentor/AIMentorPanel'

const CodePlayground  = lazy(() => import('../../components/academy/playground/CodePlayground'))
const LessonQuiz      = lazy(() => import('../../components/academy/lesson/LessonQuiz'))
const LessonPractice  = lazy(() => import('../../components/academy/lesson/LessonPractice'))
const LessonAssignment = lazy(() => import('../../components/academy/lesson/LessonAssignment'))
const LessonNotes     = lazy(() => import('../../components/academy/lesson/LessonNotes'))

type ActiveSection = 'teach' | 'notes' | 'code' | 'quiz' | 'practice' | 'assignment'

const TABS: { key: ActiveSection; label: string }[] = [
  { key: 'teach',      label: 'AI Teacher' },
  { key: 'notes',      label: 'Notes' },
  { key: 'code',       label: 'Playground' },
  { key: 'quiz',       label: 'Quiz' },
  { key: 'practice',   label: 'Practice' },
  { key: 'assignment', label: 'Assignment' },
]

export default function AcademyLesson() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<ActiveSection>('teach')

  const { progress, updateStatus, getLessonStatus } = useLessonProgress(courseId ?? '')
  const lessonStatus = lessonId ? getLessonStatus(lessonId) : 'not_started'

  useEffect(() => {
    if (!courseId || !lessonId) return
    async function load() {
      setLoading(true)
      try {
        const [lessonData, modulesData] = await Promise.all([
          getLessonById(lessonId!),
          getModulesWithLessons(courseId!),
        ])
        setLesson(lessonData)
        setModules(modulesData)
        if (user && lessonData && getLessonStatus(lessonId!) === 'not_started') {
          await updateStatus(lessonId!, 'in_progress')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, lessonId, user])

  const handleMarkComplete = async () => {
    if (!lessonId) return
    await updateStatus(lessonId, 'completed')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!lesson || !courseId || !lessonId) {
    return <div className="text-center py-16 text-gray-400">Lesson not found.</div>
  }

  const mainContent = (
    <div>
      <LessonHeader
        lesson={lesson}
        status={lessonStatus}
        onMarkComplete={handleMarkComplete}
      />

      {/* Section tabs */}
      <div className="flex gap-0 flex-wrap mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${
              activeSection === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Suspense fallback={<div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}>
        {activeSection === 'teach'      && <AITeacherChat   lesson={lesson} userId={user?.id ?? ''} />}
        {activeSection === 'notes'      && <LessonNotes     lesson={lesson} userId={user?.id ?? ''} />}
        {activeSection === 'code'       && <CodePlayground  lesson={lesson} userId={user?.id ?? ''} />}
        {activeSection === 'quiz'       && <LessonQuiz      lesson={lesson} userId={user?.id ?? ''} />}
        {activeSection === 'practice'   && <LessonPractice  lesson={lesson} userId={user?.id ?? ''} />}
        {activeSection === 'assignment' && <LessonAssignment lesson={lesson} userId={user?.id ?? ''} />}
      </Suspense>
    </div>
  )

  return (
    <LessonLayout
      sidebar={
        <LessonSidebar
          courseId={courseId}
          activeLessonId={lessonId}
          modules={modules}
          progress={progress}
        />
      }
      main={mainContent}
      mentor={<AIMentorPanel lesson={lesson} userId={user?.id ?? ''} />}
    />
  )
}
