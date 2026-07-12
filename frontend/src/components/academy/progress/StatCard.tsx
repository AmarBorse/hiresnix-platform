interface StatCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  accent?: 'blue' | 'green' | 'purple' | 'amber' | 'red'
}

const accentMap = {
  blue:   'bg-blue-50   dark:bg-blue-900/20   text-blue-600   dark:text-blue-400',
  green:  'bg-green-50  dark:bg-green-900/20  text-green-600  dark:text-green-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  amber:  'bg-amber-50  dark:bg-amber-900/20  text-amber-600  dark:text-amber-400',
  red:    'bg-red-50    dark:bg-red-900/20    text-red-600    dark:text-red-400',
}

export default function StatCard({ icon, label, value, sub, accent = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${accentMap[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
