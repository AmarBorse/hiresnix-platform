import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth' // your existing auth hook
import { getPublishedCourses, getCourseCompletionPercent } from '../../lib/academy/academySupabase'
import type { Course } from '../../lib/academy/academyTypes'
import CourseCard from '../../components/academy/progress/CourseCard'

export default function AcademyCatalog() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const raw = await getPublishedCourses()
        if (!user) {
          setCourses(raw)
          return
        }
        const withProgress = await Promise.all(
          raw.map(async (c) => ({
            ...c,
            progress: await getCourseCompletionPercent(user.id, c.id),
          }))
        )
        setCourses(withProgress)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          AI Academy
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Learn with your personal AI teacher — at your own pace.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No courses available yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.id} to={`/academy/${course.id}`}>
              <CourseCard course={course} />
            </Link>
          ))}
        </div>
      )}

      {user && (
        <div className="mt-8 text-right">
          <Link
            to="/academy/progress"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View my progress →
          </Link>
        </div>
      )}
    </div>
  )
}
