import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CourseProgress } from '../../../hooks/academy/progressQueries'

interface CourseProgressListProps {
  courses: CourseProgress[]
}

export default function CourseProgressList({ courses }: CourseProgressListProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No courses started yet. <Link to="/academy" className="text-blue-500 hover:underline">Browse courses →</Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {courses.map(c => (
        <CourseRow key={c.course_id} course={c} />
      ))}
    </div>
  )
}

function CourseRow({ course }: { course: CourseProgress }) {
  const [expanded, setExpanded] = useState(false)

  const barColor =
    course.percent === 100 ? 'bg-green-500' :
    course.percent >= 50   ? 'bg-blue-500' :
    course.percent > 0     ? 'bg-amber-500' :
    'bg-gray-200 dark:bg-gray-700'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {course.course_title}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {course.percent === 100 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                ✓ Complete
              </span>
            )}
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {course.completed}/{course.total_lessons}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${course.percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">
            {course.in_progress > 0 && `${course.in_progress} in progress`}
          </span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {course.percent}%
          </span>
        </div>
      </button>

      {/* Expanded: continue button */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <Link
            to={`/academy/${course.course_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {course.percent === 100 ? 'Review course' : 'Continue learning'} →
          </Link>
        </div>
      )}
    </div>
  )
}
