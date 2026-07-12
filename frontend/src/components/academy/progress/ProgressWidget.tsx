import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { getCourseProgressList, type CourseProgress } from '../../../hooks/academy/progressQueries'

export default function ProgressWidget() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [progress, setProgress] = useState<CourseProgress | null>(null)

  useEffect(() => {
    if (!user || !courseId) return
    getCourseProgressList(user.id).then(list => {
      const found = list.find(c => c.course_id === courseId)
      setProgress(found ?? null)
    }).catch(console.error)
  }, [user, courseId])

  if (!progress) return null

  const { completed, total_lessons, percent } = progress

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Course progress
        </span>
        <Link
          to="/academy/progress"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Full stats
        </Link>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        <span>{completed} / {total_lessons} lessons</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{percent}%</span>
      </div>

      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percent === 100 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : 'bg-amber-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {percent === 100 && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-medium">
          🎉 Course complete!
        </p>
      )}
    </div>
  )
}
