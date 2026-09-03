'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearNewPostDraft,
  isMeaningfulNewPostDraft,
  type NewPostDraftValue,
  readNewPostDraft,
  writeNewPostDraft,
} from '~/lib/admin-post-draft'

const AUTOSAVE_DELAY_MS = 1000

export type NewPostDraftStatus =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; updatedAt: number }
  | { state: 'restored'; updatedAt: number }
  | { state: 'error'; message: string }

type UseNewPostDraftOptions = {
  enabled: boolean
  value: NewPostDraftValue
  onRestore: (draft: NewPostDraftValue) => void
}

function getBrowserStorage() {
  return window.localStorage
}

function getStorageErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '浏览器存储不可用'
}

function getDraftFingerprint(value: NewPostDraftValue) {
  return JSON.stringify(value)
}

export function useNewPostDraft({ enabled, value, onRestore }: UseNewPostDraftOptions) {
  const [isReady, setIsReady] = useState(false)
  const [status, setStatus] = useState<NewPostDraftStatus>({ state: 'idle' })
  const valueRef = useRef(value)
  const restoreRef = useRef(onRestore)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLoadRef = useRef(false)
  const persistedFingerprintRef = useRef<string | null>(null)
  const persistedAtRef = useRef<number | null>(null)

  valueRef.current = value
  restoreRef.current = onRestore

  const cancelScheduledSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const saveNow = useCallback(() => {
    cancelScheduledSave()
    try {
      const savedDraft = writeNewPostDraft(getBrowserStorage(), valueRef.current)
      persistedFingerprintRef.current = savedDraft ? getDraftFingerprint(valueRef.current) : null
      persistedAtRef.current = savedDraft?.updatedAt ?? null
      setStatus(
        savedDraft ? { state: 'saved', updatedAt: savedDraft.updatedAt } : { state: 'idle' }
      )
    } catch (error) {
      setStatus({ state: 'error', message: getStorageErrorMessage(error) })
    }
  }, [cancelScheduledSave])

  useEffect(() => {
    if (!enabled || didLoadRef.current) {
      return
    }

    didLoadRef.current = true
    try {
      const { draft, discardedInvalidDraft } = readNewPostDraft(getBrowserStorage())
      if (draft) {
        const restoredValue = { form: draft.form, tagInput: draft.tagInput }
        persistedFingerprintRef.current = getDraftFingerprint(restoredValue)
        persistedAtRef.current = draft.updatedAt
        restoreRef.current(restoredValue)
        setStatus({ state: 'restored', updatedAt: draft.updatedAt })
      } else if (discardedInvalidDraft) {
        setStatus({ state: 'error', message: '检测到无效的本地草稿，已安全忽略。' })
      }
    } catch (error) {
      setStatus({ state: 'error', message: getStorageErrorMessage(error) })
    } finally {
      setIsReady(true)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !isReady) {
      return
    }

    const currentFingerprint = getDraftFingerprint(value)
    if (currentFingerprint === persistedFingerprintRef.current) {
      setStatus((currentStatus) =>
        currentStatus.state === 'saving' && persistedAtRef.current
          ? { state: 'saved', updatedAt: persistedAtRef.current }
          : currentStatus
      )
      return
    }

    cancelScheduledSave()
    if (!isMeaningfulNewPostDraft(value)) {
      if (persistedFingerprintRef.current) {
        saveNow()
      }
      return
    }

    setStatus({ state: 'saving' })
    timerRef.current = setTimeout(saveNow, AUTOSAVE_DELAY_MS)

    return cancelScheduledSave
  }, [cancelScheduledSave, enabled, isReady, saveNow, value])

  useEffect(() => {
    if (!enabled || !isReady) {
      return
    }

    const flushOnPageHide = () => saveNow()
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') {
        saveNow()
      }
    }

    window.addEventListener('pagehide', flushOnPageHide)
    document.addEventListener('visibilitychange', flushWhenHidden)
    return () => {
      window.removeEventListener('pagehide', flushOnPageHide)
      document.removeEventListener('visibilitychange', flushWhenHidden)
    }
  }, [enabled, isReady, saveNow])

  const clearDraft = useCallback(() => {
    cancelScheduledSave()
    try {
      clearNewPostDraft(getBrowserStorage())
      persistedFingerprintRef.current = null
      persistedAtRef.current = null
      setStatus({ state: 'idle' })
      return true
    } catch (error) {
      setStatus({ state: 'error', message: getStorageErrorMessage(error) })
      return false
    }
  }, [cancelScheduledSave])

  useEffect(() => cancelScheduledSave, [cancelScheduledSave])

  return {
    clearDraft,
    hasDraft: isReady && isMeaningfulNewPostDraft(value),
    status,
  }
}
