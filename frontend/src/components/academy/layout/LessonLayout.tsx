import { useState } from 'react'
import type { ReactNode } from 'react'

interface LessonLayoutProps {
  sidebar: ReactNode
  main: ReactNode
  mentor: ReactNode
}

type MobileTab = 'lesson' | 'sidebar' | 'mentor'

export default function LessonLayout({ sidebar, main, mentor }: LessonLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('lesson')

  return (
    <>
      {/* ── Desktop: 3-column grid ── */}
      <div className="hidden lg:grid lg:grid-cols-[260px_1fr_300px] h-[calc(100vh-64px)] overflow-hidden">
        {/* Left sidebar */}
        <div className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {sidebar}
        </div>

        {/* Center: main lesson content */}
        <div className="overflow-y-auto px-6 py-6">
          {main}
        </div>

        {/* Right: AI Mentor panel */}
        <div className="border-l border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col">
          {mentor}
        </div>
      </div>

      {/* ── Mobile: tab switcher ── */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-64px)]">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {(
            [
              { key: 'sidebar', label: 'Lessons' },
              { key: 'lesson', label: 'Learn' },
              { key: 'mentor', label: 'Ask AI' },
            ] as { key: MobileTab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mobileTab === key
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'sidebar' && <div className="p-4">{sidebar}</div>}
          {mobileTab === 'lesson' && <div className="p-4">{main}</div>}
          {mobileTab === 'mentor' && <div className="flex flex-col h-full">{mentor}</div>}
        </div>
      </div>
    </>
  )
}
