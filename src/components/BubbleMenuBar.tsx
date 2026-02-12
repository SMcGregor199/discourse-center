import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'

type BubbleMenuBarProps = {
  editor: Editor
}

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter a URL', previousUrl ?? 'https://')

    if (url === null) {
      return
    }

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  return (
    <BubbleMenu
      editor={editor}
      className='bubble-menu'
      options={{ placement: 'top', offset: 8 }}
    >
      <button
        type='button'
        className={`menu-button${editor.isActive('bold') ? ' is-active' : ''}`}
        aria-label='Bold'
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>
      <button
        type='button'
        className={`menu-button${editor.isActive('italic') ? ' is-active' : ''}`}
        aria-label='Italic'
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </button>
      <button type='button' className='menu-button' aria-label='Set link' onClick={setLink}>
        Link
      </button>
      <button
        type='button'
        className='menu-button'
        aria-label='Remove link'
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
      >
        Unlink
      </button>
    </BubbleMenu>
  )
}
