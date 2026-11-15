'use client'

import clsx from 'clsx'
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useMatches,
  useRegisterActions,
  type Action,
} from 'kbar'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { formatDate } from '~/utils/misc'
import { MoonPhaseIcon, PixelRule } from './pixel-ui'

type SearchDocument = { path: string; title: string; summary?: string; date: string }

/**
 * Cmd/Ctrl+K search over `search.json` (same index pliny's provider used), drawn in
 * the moon palette instead of pliny's hard-coded indigo/blue-gray modal.
 */
export function MoonSearchProvider({
  searchDocumentsPath,
  children,
}: {
  searchDocumentsPath: string
  children: ReactNode
}) {
  const router = useRouter()
  const [actions, setActions] = useState<Action[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(searchDocumentsPath)
      .then((response) => response.json() as Promise<SearchDocument[]>)
      .then((documents) => {
        if (cancelled) return
        setActions(
          documents.map((document) => ({
            id: document.path,
            name: document.title,
            keywords: document.summary || '',
            section: 'Posts',
            subtitle: formatDate(document.date),
            perform: () => router.push(`/${document.path}`),
          }))
        )
      })
      .catch((error) => console.error('Failed to load search index', error))
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [router, searchDocumentsPath])

  return (
    <KBarProvider>
      <MoonSearchModal actions={actions} loading={!loaded} />
      {children}
    </KBarProvider>
  )
}

function MoonSearchModal({ actions, loading }: { actions: Action[]; loading: boolean }) {
  useRegisterActions(actions, [actions])
  return (
    <KBarPortal>
      <KBarPositioner className="z-50 bg-black/30 p-4 backdrop-blur-sm dark:bg-black/60">
        <KBarAnimator className="w-full max-w-xl">
          <div className="overflow-hidden border border-dashed border-gray-400/70 bg-[#f5f4ef] text-gray-900 shadow-2xl dark:border-white/15 dark:bg-[#08080b] dark:text-gray-100">
            <div className="flex items-center gap-3 px-4 py-3">
              <MoonPhaseIcon phase={0.5} className="text-gray-500" />
              <KBarSearch
                defaultPlaceholder="Search posts…"
                className="h-8 w-full border-0 bg-transparent p-0 font-mono text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0 dark:text-gray-100"
              />
              <kbd className="font-pixel text-[10px] tracking-[0.2em] text-gray-500">ESC</kbd>
            </div>
            <PixelRule />
            {loading ? <SearchNote>LOADING…</SearchNote> : <SearchResults />}
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  )
}

function SearchNote({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-8 text-center font-pixel text-[11px] tracking-[0.25em] text-gray-500">
      {children}
    </p>
  )
}

function SearchResults() {
  const { results } = useMatches()
  if (results.length === 0) return <SearchNote>NO RESULTS</SearchNote>
  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          <div className="px-4 pb-1 pt-4 font-pixel text-[10px] uppercase tracking-[0.25em] text-gray-500">
            {item}
          </div>
        ) : (
          <div
            className={clsx(
              'cursor-pointer px-4 py-2.5 transition-colors',
              active
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-gray-700 dark:text-gray-300'
            )}
          >
            <div className="text-sm">{item.name}</div>
            {item.subtitle ? (
              <div className={clsx('text-xs', active ? 'opacity-70' : 'text-gray-500')}>
                {item.subtitle}
              </div>
            ) : null}
          </div>
        )
      }
    />
  )
}
