interface StreakWidgetProps {
  currentStreak: number
  longestStreak: number
}

export default function StreakWidget({ currentStreak, longestStreak }: StreakWidgetProps) {
  const isOnFire = currentStreak >= 3

  return (
    <div className="flex items-center gap-6">
      {/* Current streak */}
      <div className="flex items-center gap-3">
        <div className={`text-4xl transition-transform ${isOnFire ? 'animate-bounce' : ''}`}>
          {currentStreak === 0 ? '❄️' : currentStreak >= 7 ? '🔥' : '⚡'}
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentStreak}
            </span>
            <span className="text-sm text-gray-400">day{currentStreak !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-xs text-gray-400">Current streak</p>
        </div>
      </div>

      <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Longest streak */}
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            {longestStreak}
          </span>
          <span className="text-sm text-gray-400">day{longestStreak !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-xs text-gray-400">Best streak</p>
      </div>

      {/* Motivational message */}
      <div className="ml-auto text-right">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {currentStreak === 0
            ? 'Start today to build your streak!'
            : currentStreak < 3
            ? 'Great start! Keep going 💪'
            : currentStreak < 7
            ? 'You\'re on a roll! 🚀'
            : currentStreak < 14
            ? 'Incredible consistency! 🏆'
            : 'Absolute legend! 🔥🔥'}
        </p>
      </div>
    </div>
  )
}
