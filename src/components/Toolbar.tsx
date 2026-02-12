import type { Editor } from '@tiptap/react'

type ToolbarProps = {
  editor: Editor | null
}

type ToolbarButtonProps = {
  label: string
  ariaLabel: string
  isActive?: boolean
  isDisabled?: boolean
  onClick: () => void
}

function ToolbarButton({
  label,
  ariaLabel,
  isActive = false,
  isDisabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type='button'
      className={`toolbar-button${isActive ? ' is-active' : ''}`}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      disabled={isDisabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return (
      <div className='toolbar' role='toolbar' aria-label='Editor formatting'>
        <ToolbarButton label='B' ariaLabel='Bold' isDisabled onClick={() => undefined} />
      </div>
    )
  }

  const canUndo = editor.can().chain().focus().undo().run()
  const canRedo = editor.can().chain().focus().redo().run()

  return (
    <div className='toolbar' role='toolbar' aria-label='Editor formatting'>
      <ToolbarButton
        label='B'
        ariaLabel='Bold'
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label='I'
        ariaLabel='Italic'
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label='S'
        ariaLabel='Strike'
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        label='</>'
        ariaLabel='Code'
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        label='• List'
        ariaLabel='Bullet list'
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label='1. List'
        ariaLabel='Ordered list'
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label='Quote'
        ariaLabel='Blockquote'
        isActive={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label='H1'
        ariaLabel='Heading 1'
        isActive={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label='H2'
        ariaLabel='Heading 2'
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label='H3'
        ariaLabel='Heading 3'
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label='Undo'
        ariaLabel='Undo'
        isDisabled={!canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label='Redo'
        ariaLabel='Redo'
        isDisabled={!canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  )
}
