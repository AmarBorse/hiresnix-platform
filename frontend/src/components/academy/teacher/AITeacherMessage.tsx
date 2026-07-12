import type { ChatMessage } from '../../../lib/academy/academyTypes'

interface AITeacherMessageProps {
  message: ChatMessage
}

// Minimal markdown renderer — bold, code blocks, inline code, newlines
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre
          key={i}
          className="my-2 p-3 rounded-lg bg-gray-900 dark:bg-gray-950 text-green-400 text-xs overflow-x-auto font-mono"
        >
          {lang && (
            <div className="text-gray-500 text-xs mb-1">{lang}</div>
          )}
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
      i++
      continue
    }

    // Regular line with inline formatting
    elements.push(
      <p key={i} className="leading-relaxed">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return elements
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function AITeacherMessage({ message }: AITeacherMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-sm
          bg-blue-600 text-white text-sm leading-relaxed">
          {message.message}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center
        justify-center text-sm shrink-0 mt-0.5">
        🤖
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
          {renderMarkdown(message.message)}
        </div>
      </div>
    </div>
  )
}
