// Replace your existing pages/academy/AcademyCourse.tsx with this.
// Key change: CertificateBanner added at top when course progress = 100%

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  getCourseById,
  getModulesWithLessons,
  getLessonProgressForCourse,
} from '../../lib/academy/academySupabase'
import type { Course, Module, LessonProgress } from '../../lib/academy/academyTypes'
import CertificateBanner from '../../components/academy/certificate/CertificateBanner'

export default function AcademyCourse() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [course, setCourse]     = useState<Course | null>(null)
  const [modules, setModules]   = useState<Module[]>([])
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!courseId) return
    async function load() {
      try {
        const [courseData, modulesData] = await Promise.all([
          getCourseById(courseId!),
          getModulesWithLessons(courseId!),
        ])
        setCourse(courseData)
        setModules(modulesData)
        if (user) {
          const prog = await getLessonProgressForCourse(user.id, courseId!)
          setProgress(prog)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, user])

  const getStatus = (lessonId: string) =>
    progress.find(p => p.lesson_id === lessonId)?.status ?? 'not_started'

  // Compute completion for CertificateBanner
  const allLessons = modules.flatMap(m => m.lessons ?? [])
  const completedCount = allLessons.filter(l => getStatus(l.id) === 'completed').length
  const totalLessons   = allLessons.length
  const percent        = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const courseProgressForBanner = course ? {
    course_id: courseId!,
    course_title: course.title,
    total_lessons: totalLessons,
    completed: completedCount,
    in_progress: allLessons.filter(l => getStatus(l.id) === 'in_progress').length,
    percent,
  } : null

  // Get student name from user metadata
  const studentName =
    (user?.user_metadata?.full_name as string) ||
    (user?.email?.split('@')[0] ?? 'Student')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!course) {
    return <div className="text-center py-16 text-gray-400">Course not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/academy"
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
      >
        ← All courses
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
        {course.title}
      </h1>
      {course.description && (
        <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>
      )}

      {/* Progress summary */}
      {totalLessons > 0 && (
        <div className="mt-4 mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{completedCount} / {totalLessons} lessons completed</span>
            <span className="font-medium text-gray-600 dark:text-gray-300">{percent}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percent === 100 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Certificate banner — auto-shows when complete */}
      {user && courseProgressForBanner && (
        <div className="mb-6">
          <CertificateBanner
            userId={user.id}
            studentName={studentName}
            courseId={courseId!}
            courseTitle={course.title}
            courseProgress={courseProgressForBanner}
          />
        </div>
      )}

      {/* Module list */}
      <div className="space-y-6">
        {modules.map((mod, mi) => (
          <div key={mod.id}>
            <h2 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Module {mi + 1} — {mod.title}
            </h2>
            <div className="space-y-2">
              {(mod.lessons ?? []).map(lesson => {
                const status = getStatus(lesson.id)
                return (
                  <Link
                    key={lesson.id}
                    to={`/academy/${courseId}/${lesson.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                      hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                  >
                    <span className="text-lg">
                      {status === 'completed' ? '✅' : status === 'in_progress' ? '🔵' : '⬜'}
                    </span>
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {lesson.title}
                    </span>
                    <span className="text-gray-400 group-hover:text-blue-500">→</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
