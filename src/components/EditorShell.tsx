import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, type JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { CharacterCount, Placeholder } from '@tiptap/extensions'

import { BubbleMenuBar } from './BubbleMenuBar'
import { FloatingMenuBar } from './FloatingMenuBar'
import { StatusBar } from './StatusBar'
import { Toolbar } from './Toolbar'
import {
  clearEditorContent,
  DEFAULT_DOCUMENT,
  loadEditorContent,
  saveEditorContent,
} from '../lib/storage'

const SAVE_DEBOUNCE_MS = 500

async function writeToClipboard(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API not available in this browser')
  }

  await navigator.clipboard.writeText(value)
}

export function EditorShell() {
  const [feedback, setFeedback] = useState('Ready')
  const saveTimeoutRef = useRef<number | null>(null)

  const initialContent = useMemo<JSONContent>(() => loadEditorContent() ?? DEFAULT_DOCUMENT, [])

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      CharacterCount,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'editor-content',
        'aria-label': 'Rich text editor',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setFeedback('Saving...')

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        try {
          saveEditorContent(currentEditor.getJSON())
          setFeedback('Saved locally')
        } catch {
          setFeedback('Save failed')
        }
      }, SAVE_DEBOUNCE_MS)
    },
  })

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const copyHtml = async () => {
    if (!editor) {
      return
    }

    try {
      await writeToClipboard(editor.getHTML())
      setFeedback('HTML copied')
    } catch {
      setFeedback('Could not copy HTML')
    }
  }

  const copyJson = async () => {
    if (!editor) {
      return
    }

    try {
      await writeToClipboard(JSON.stringify(editor.getJSON(), null, 2))
      setFeedback('JSON copied')
    } catch {
      setFeedback('Could not copy JSON')
    }
  }

  const clearDocument = () => {
    if (!editor) {
      return
    }

    editor.commands.setContent(DEFAULT_DOCUMENT)

    try {
      clearEditorContent()
      saveEditorContent(DEFAULT_DOCUMENT)
      setFeedback('Document reset')
    } catch {
      setFeedback('Could not clear storage')
    }
  }

  return (
    <section className='editor-shell' aria-label='Rich text editor section'>
      <Toolbar editor={editor} />

      <div className='editor-surface'>
        {editor ? <BubbleMenuBar editor={editor} /> : null}
        {editor ? <FloatingMenuBar editor={editor} /> : null}
        <EditorContent editor={editor} />
      </div>

      <StatusBar
        editor={editor}
        feedback={feedback}
        onCopyHtml={copyHtml}
        onCopyJson={copyJson}
        onClear={clearDocument}
      />
    </section>
  )
}
