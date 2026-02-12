import type { Editor } from '@tiptap/react'

type StatusBarProps = {
  editor: Editor | null
  feedback: string
  onCopyHtml: () => void
  onCopyJson: () => void
  onClear: () => void
}

export function StatusBar({ editor, feedback, onCopyHtml, onCopyJson, onClear }: StatusBarProps) {
  const words = editor?.storage.characterCount.words() ?? 0
  const characters = editor?.storage.characterCount.characters() ?? 0

  return (
    <div className='status-bar'>
      <div className='status-counts' aria-live='polite'>
        <span>{words} words</span>
        <span>{characters} characters</span>
        <span className='status-feedback'>{feedback}</span>
      </div>
      <div className='status-actions'>
        <button type='button' className='status-button' aria-label='Copy HTML' onClick={onCopyHtml}>
          Copy HTML
        </button>
        <button type='button' className='status-button' aria-label='Copy JSON' onClick={onCopyJson}>
          Copy JSON
        </button>
        <button type='button' className='status-button' aria-label='Clear editor' onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  )
}
