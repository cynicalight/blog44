import { z } from 'zod'
import type { AdminPostInput } from '~/types/admin'

export const NEW_POST_DRAFT_STORAGE_KEY = 'admin:post:new:v1'

const adminPostDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()))

const adminPostInputSchema = z
  .object({
    contentType: z.enum(['blog', 'gallery']),
    slug: z.string(),
    scriptVariant: z.enum(['zh-Hans', 'zh-Hant']),
    title: z.string(),
    date: adminPostDateSchema,
    summary: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean(),
    coverImage: z.string(),
    body: z.string(),
  })
  .strict()

const storedNewPostDraftSchema = z
  .object({
    version: z.literal(1),
    updatedAt: z.number().int().min(0).max(8_640_000_000_000_000),
    form: adminPostInputSchema,
    tagInput: z.string(),
  })
  .strict()

export type NewPostDraftValue = {
  form: AdminPostInput
  tagInput: string
}

export type StoredNewPostDraft = NewPostDraftValue & {
  version: 1
  updatedAt: number
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type ReadNewPostDraftResult = {
  draft: StoredNewPostDraft | null
  discardedInvalidDraft: boolean
}

function hasText(value: string) {
  return value.trim().length > 0
}

export function isMeaningfulNewPostDraft({ form, tagInput }: NewPostDraftValue) {
  return [
    form.slug,
    form.title,
    form.summary,
    form.coverImage,
    form.body,
    tagInput,
    ...form.tags,
  ].some(hasText)
}

export function readNewPostDraft(
  storage: DraftStorage,
  storageKey = NEW_POST_DRAFT_STORAGE_KEY
): ReadNewPostDraftResult {
  const rawDraft = storage.getItem(storageKey)
  if (!rawDraft) {
    return { draft: null, discardedInvalidDraft: false }
  }

  try {
    const result = storedNewPostDraftSchema.safeParse(JSON.parse(rawDraft))
    if (result.success) {
      return { draft: result.data, discardedInvalidDraft: false }
    }
  } catch {
    // Invalid browser data is removed below instead of entering the editor state.
  }

  storage.removeItem(storageKey)
  return { draft: null, discardedInvalidDraft: true }
}

export function writeNewPostDraft(
  storage: DraftStorage,
  value: NewPostDraftValue,
  storageKey = NEW_POST_DRAFT_STORAGE_KEY,
  updatedAt = Date.now()
): StoredNewPostDraft | null {
  if (!isMeaningfulNewPostDraft(value)) {
    storage.removeItem(storageKey)
    return null
  }

  const draft: StoredNewPostDraft = {
    version: 1,
    updatedAt,
    form: value.form,
    tagInput: value.tagInput,
  }
  storage.setItem(storageKey, JSON.stringify(draft))
  return draft
}

export function clearNewPostDraft(storage: DraftStorage, storageKey = NEW_POST_DRAFT_STORAGE_KEY) {
  storage.removeItem(storageKey)
}
