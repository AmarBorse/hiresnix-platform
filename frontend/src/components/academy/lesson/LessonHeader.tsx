import type { Lesson, LessonStatus } from '../../../lib/academy/academyTypes'

interface LessonHeaderProps {
  lesson: Lesson
  status: LessonStatus
  onMarkComplete: () => void
}

const statusLabel: Record<LessonStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
}

const statusColor: Record<LessonStatus, string> = {
  not_started: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

export default function LessonHeader({ lesson, status, onMarkComplete }: LessonHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {lesson.title}
        </h1>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[status]}`}>
            {statusLabel[status]}
          </span>
          {status !== 'completed' && (
            <button
              onClick={onMarkComplete}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700
                text-white font-medium transition-colors"
            >
              Mark complete ✓
            </button>
          )}
        </div>
      </div>

      {lesson.objective && (
        <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Objective: </span>
            {lesson.objective}
          </p>
        </div>
      )}

      {lesson.key_concepts && lesson.key_concepts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Key concepts
          </p>
          <div className="flex flex-wrap gap-2">
            {lesson.key_concepts.map((kc, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                {kc.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
