import { Search } from 'lucide-react'
import type { ChangeEventHandler } from 'react'

export function SearchArticles({
  onChange,
  label,
}: {
  onChange: ChangeEventHandler<HTMLInputElement>
  label: string
}) {
  return (
    <div className="relative max-w-lg">
      <label>
        <span className="sr-only">{label}</span>
        <input
          aria-label={label}
          type="text"
          onChange={onChange}
          placeholder={label}
          className="block w-full rounded-none border border-dashed border-gray-400 bg-transparent px-4 py-2 font-mono text-sm text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-0 dark:border-white/20 dark:text-gray-100 dark:focus:border-white/60"
        />
      </label>
      <Search
        size={24}
        className="absolute right-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300"
      />
    </div>
  )
}
