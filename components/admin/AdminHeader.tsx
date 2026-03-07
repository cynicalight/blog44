'use client'

export default function AdminHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Content Admin</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          保存后直接提交到 GitHub main，并由 Vercel 自动部署
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
        >
          <svg className="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          查看站点
        </a>
      </div>
    </header>
  )
}
