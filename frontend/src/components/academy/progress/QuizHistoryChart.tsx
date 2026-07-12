import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { QuizHistory } from '../../../hooks/academy/progressQueries'

interface QuizHistoryChartProps {
  data: QuizHistory[]
}

export default function QuizHistoryChart({ data }: QuizHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No quiz attempts yet — take a quiz to see your progress here.
      </div>
    )
  }

  // Recharts needs ascending order
  const chartData = [...data]
    .reverse()
    .map((q, i) => ({
      name: `Q${i + 1}`,
      score: q.score,
      lesson: q.lesson_title,
      date: new Date(q.attempted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }))

  const avg = Math.round(data.reduce((s, q) => s + q.score, 0) / data.length)

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
        <span>Avg score: <span className="font-medium text-gray-700 dark:text-gray-300">{avg}%</span></span>
        <span>Best: <span className="font-medium text-green-600 dark:text-green-400">{Math.max(...data.map(q => q.score))}%</span></span>
        <span>Attempts: <span className="font-medium text-gray-700 dark:text-gray-300">{data.length}</span></span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--text-muted, #9ca3af)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--text-muted, #9ca3af)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm text-xs">
                  <div className="font-medium text-gray-800 dark:text-gray-200 mb-0.5 max-w-[160px] truncate">
                    {d.lesson}
                  </div>
                  <div className="text-gray-400">{d.date}</div>
                  <div className="text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    Score: {d.score}%
                  </div>
                </div>
              )
            }}
          />
          {/* Average reference line */}
          <ReferenceLine
            y={avg}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: `avg ${avg}%`, position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Recent attempts table */}
      <div className="mt-4 space-y-1.5">
        {data.slice(0, 5).map((q, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 truncate max-w-[55%]">{q.lesson_title}</span>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">
                {new Date(q.attempted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
              <span className={`font-medium w-10 text-right ${
                q.score >= 80 ? 'text-green-600 dark:text-green-400' :
                q.score >= 50 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-500'
              }`}>
                {q.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
