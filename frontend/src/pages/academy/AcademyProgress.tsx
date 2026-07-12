import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProgressDashboard } from '../../hooks/academy/useProgressDashboard'
import StatCard from '../../components/academy/progress/StatCard'
import CourseProgressList from '../../components/academy/progress/CourseProgressList'
import QuizHistoryChart from '../../components/academy/progress/QuizHistoryChart'
import ActivityHeatmap from '../../components/academy/progress/ActivityHeatmap'
import StreakWidget from '../../components/academy/progress/StreakWidget'

export default function AcademyProgress() {
  const { user } = useAuth()
  const { courseProgress, quizHistory, activityData, stats, loading, error } =
    useProgressDashboard({ userId: user?.id ?? '' })

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-gray-500 mb-4">Sign in to see your progress.</p>
        <Link to="/login" className="text-blue-600 hover:underline text-sm">Sign in →</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const noActivity = stats?.totalLessonsCompleted === 0 && stats?.totalQuizzesTaken === 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Progress</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track your learning journey on Hiresnix AI Academy</p>
        </div>
        <Link
          to="/academy"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to courses
        </Link>
      </div>

      {/* Empty state */}
      {noActivity && (
        <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 mb-8">
          <div className="text-4xl mb-3">🌱</div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your journey starts here!
          </h3>
          <p className="text-sm text-gray-400 mb-4">Complete your first lesson to see progress stats.</p>
          <Link
            to="/academy"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Start learning →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="📚"
            label="Lessons completed"
            value={stats.totalLessonsCompleted}
            accent="blue"
          />
          <StatCard
            icon="🧠"
            label="Quizzes taken"
            value={stats.totalQuizzesTaken}
            sub={stats.avgQuizScore > 0 ? `Avg ${stats.avgQuizScore}%` : undefined}
            accent="purple"
          />
          <StatCard
            icon="💻"
            label="Code sessions"
            value={stats.practiceProblemsAttempted}
            accent="green"
          />
          <StatCard
            icon="📋"
            label="Assignments"
            value={stats.totalAssignmentsSubmitted}
            sub="submitted"
            accent="amber"
          />
        </div>
      )}

      {/* Streak + heatmap row */}
      {stats && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Activity streak
          </h2>
          <StreakWidget
            currentStreak={stats.currentStreakDays}
            longestStreak={stats.longestStreakDays}
          />
          <div className="mt-5">
            <ActivityHeatmap data={activityData} />
          </div>
        </div>
      )}

      {/* Two-column: courses + quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course progress */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Course progress
            </h2>
            <span className="text-xs text-gray-400">
              {courseProgress.filter(c => c.percent === 100).length}/{courseProgress.length} complete
            </span>
          </div>
          <CourseProgressList courses={courseProgress} />
        </div>

        {/* Quiz history */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Quiz score history
            </h2>
            {quizHistory.length > 0 && (
              <span className="text-xs text-gray-400">{quizHistory.length} attempts</span>
            )}
          </div>
          <QuizHistoryChart data={quizHistory} />
        </div>
      </div>

      {/* Bottom CTA */}
      {!noActivity && (
        <div className="mt-8 p-5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Keep the momentum going! 🚀
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {stats?.currentStreakDays
                  ? `You're on a ${stats.currentStreakDays}-day streak. Don't break it!`
                  : 'Start your streak today — one lesson a day keeps the rust away.'}
              </p>
            </div>
            <Link
              to="/academy"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              Continue learning →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
