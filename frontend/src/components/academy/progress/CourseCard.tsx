import type { Course } from '../../../lib/academy/academyTypes'

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const progress = course.progress ?? 0

  return (
    <div className="h-full border border-gray-200 dark:border-gray-700 rounded-xl p-5
      hover:border-blue-400 hover:shadow-sm dark:hover:border-blue-600 transition-all
      bg-white dark:bg-gray-900 group cursor-pointer">

      {/* Thumbnail or placeholder */}
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-32 object-cover rounded-lg mb-4"
        />
      ) : (
        <div className="w-full h-32 rounded-lg mb-4 bg-gradient-to-br from-blue-100 to-purple-100
          dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
          <span className="text-4xl">📚</span>
        </div>
      )}

      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600
        dark:group-hover:text-blue-400 transition-colors">
        {course.title}
      </h3>

      {course.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {course.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Progress</span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progress === 100
                ? 'bg-green-500'
                : progress > 0
                ? 'bg-blue-500'
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
