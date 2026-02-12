import type { JSONContent } from '@tiptap/react'

export const STORAGE_KEY = 'discourse-center:tiptap-document'

export const DEFAULT_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Untitled' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'This editor auto-saves to local storage.' }],
    },
    {
      type: 'paragraph',
    },
  ],
}

function isJsonContent(value: unknown): value is JSONContent {
  return typeof value === 'object' && value !== null
}

export function loadEditorContent(): JSONContent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown

    if (!isJsonContent(parsed)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveEditorContent(content: JSONContent): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content))
}

export function clearEditorContent(): void {
  localStorage.removeItem(STORAGE_KEY)
}
