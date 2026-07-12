import type { ActivityDay } from '../../../hooks/academy/progressQueries'

interface ActivityHeatmapProps {
  data: ActivityDay[]
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Build last 60 days grid
  const days: { date: string; count: number }[] = []
  const today = new Date()

  for (let i = 59; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const found = data.find(a => a.date === dateStr)
    days.push({ date: dateStr, count: found?.count ?? 0 })
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (count === 1) return 'bg-blue-200 dark:bg-blue-900'
    if (count === 2) return 'bg-blue-400 dark:bg-blue-700'
    return 'bg-blue-600 dark:bg-blue-500'
  }

  const activeDays = days.filter(d => d.count > 0).length
  const maxCount = Math.max(...days.map(d => d.count), 1)

  // Group into weeks for layout
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div>
      {/* Grid */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} activit${day.count !== 1 ? 'ies' : 'y'}`}
                className={`w-3.5 h-3.5 rounded-sm cursor-default transition-opacity hover:opacity-80 ${getColor(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>{activeDays} active days in last 60 days</span>
        <div className="ml-auto flex items-center gap-1">
          <span>Less</span>
          {['bg-gray-100 dark:bg-gray-800', 'bg-blue-200 dark:bg-blue-900', 'bg-blue-400 dark:bg-blue-700', 'bg-blue-600 dark:bg-blue-500'].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Recent activity list */}
      {activeDays > 0 && (
        <div className="mt-3 space-y-1">
          {data.slice(-5).reverse().map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(d.count, 5) }).map((_, j) => (
                  <div key={j} className="w-2 h-2 rounded-full bg-blue-500" />
                ))}
                <span className="text-gray-400">{d.count} event{d.count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
