import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Module, LessonProgress } from '../../../lib/academy/academyTypes'

interface LessonSidebarProps {
  courseId: string
  activeLessonId: string
  modules: Module[]
  progress: LessonProgress[]
}

export default function LessonSidebar({
  courseId,
  activeLessonId,
  modules,
  progress,
}: LessonSidebarProps) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const getStatus = (lessonId: string) =>
    progress.find((p) => p.lesson_id === lessonId)?.status ?? 'not_started'

  const toggleModule = (moduleId: string) =>
    setCollapsed((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))

  return (
    <div className="py-4 px-3">
      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-3">
        Course contents
      </div>

      {modules.map((mod) => {
        const isOpen = !collapsed[mod.id]
        const lessons = mod.lessons ?? []
        const completedCount = lessons.filter(
          (l) => getStatus(l.id) === 'completed'
        ).length

        return (
          <div key={mod.id} className="mb-2">
            {/* Module header */}
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center justify-between px-2 py-2 rounded-md
                text-left text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="truncate">{mod.title}</span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-gray-400">
                  {completedCount}/{lessons.length}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Lessons list */}
            {isOpen && (
              <div className="ml-2 mt-1 space-y-0.5">
                {lessons.map((lesson) => {
                  const status = getStatus(lesson.id)
                  const isActive = lesson.id === activeLessonId

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => navigate(`/academy/${courseId}/${lesson.id}`)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <StatusIcon status={status} />
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/40 shrink-0" />
    )
  }
  return (
    <span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
  )
}
