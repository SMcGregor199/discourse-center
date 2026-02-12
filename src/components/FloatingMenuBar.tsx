import type { Editor } from '@tiptap/react'
import { FloatingMenu } from '@tiptap/react/menus'

type FloatingMenuBarProps = {
  editor: Editor
}

export function FloatingMenuBar({ editor }: FloatingMenuBarProps) {
  return (
    <FloatingMenu
      editor={editor}
      className='floating-menu'
      options={{ placement: 'left-start', offset: 12 }}
    >
      <span className='floating-plus' aria-hidden='true'>
        +
      </span>
      <button
        type='button'
        className='menu-button'
        aria-label='Insert heading 2'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        type='button'
        className='menu-button'
        aria-label='Insert bullet list'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        List
      </button>
      <button
        type='button'
        className='menu-button'
        aria-label='Insert blockquote'
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        Quote
      </button>
    </FloatingMenu>
  )
}
