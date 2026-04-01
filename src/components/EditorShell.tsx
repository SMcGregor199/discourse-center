import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { EditorContent, type JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { CharacterCount, Placeholder } from '@tiptap/extensions'

import { BubbleMenuBar } from './BubbleMenuBar'
import { FloatingMenuBar } from './FloatingMenuBar'
import { StatusBar } from './StatusBar'
import { Toolbar } from './Toolbar'
import { ImageBrowser } from './ImageBrowser'
import { CitationManager } from './CitationManager'
import { AIResearchModal } from './AIResearchModal'
import {
  loadProject,
  saveProject,
  DEFAULT_DOCUMENT,
  DEFAULT_PROJECT_TITLE,
  countWords,
  normalizeProjectTitle,
  type Project,
  type StoredImage,
  type Source,
} from '../lib/storage'

const SAVE_DEBOUNCE_MS = 500

async function writeToClipboard(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API not available in this browser')
  }

  await navigator.clipboard.writeText(value)
}

export function EditorShell() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState('Ready')
  const [project, setProject] = useState<Project | null>(() => {
    // Initialize project state directly if projectId exists
    return projectId ? loadProject(projectId) : null
  })
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [showCitationManager, setShowCitationManager] = useState(false)
  const [showAIResearch, setShowAIResearch] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [title, setTitle] = useState(() => normalizeProjectTitle(project?.title))
  const saveTimeoutRef = useRef<number | null>(null)
  const projectRef = useRef<Project | null>(project)
  const titleRef = useRef(title)

  const initialContent = useMemo<JSONContent>(() => {
    if (projectId) {
      const loadedProject = loadProject(projectId)
      return loadedProject?.content || DEFAULT_DOCUMENT
    }
    return DEFAULT_DOCUMENT
  }, [projectId])

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
        inline: false,
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
      handleKeyDown: (_view, event) => {
        if (event.key !== 'Tab') {
          return false
        }

        event.preventDefault()

        if (!editor) {
          return true
        }

        if (event.shiftKey) {
          if (editor.can().liftListItem('listItem')) {
            editor.chain().focus().liftListItem('listItem').run()
            return true
          }

          editor.chain().focus().insertContent('    ').run()
          return true
        }

        if (editor.can().sinkListItem('listItem')) {
          editor.chain().focus().sinkListItem('listItem').run()
          return true
        }

        editor.chain().focus().insertContent('    ').run()
        return true
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      queueProjectSave({
        content: currentEditor.getJSON(),
      })
    },
  })

  const queueProjectSave = (overrides: Partial<Project> = {}) => {
    if (!projectId) {
      return
    }

    setFeedback('Saving...')

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        const existingProject = projectRef.current ?? loadProject(projectId)
        if (!existingProject) {
          setFeedback('Save failed')
          return
        }

        const nextContent = overrides.content ?? editor?.getJSON() ?? existingProject.content
        const nextTitle = normalizeProjectTitle(
          typeof overrides.title === 'string' ? overrides.title : titleRef.current,
        )
        const updatedProject = {
          ...existingProject,
          ...overrides,
          title: nextTitle,
          content: nextContent,
          updatedAt: new Date().toISOString(),
          wordCount: countWords(nextContent),
        }

        saveProject(updatedProject)
        projectRef.current = updatedProject
        setProject(updatedProject)
        setFeedback('Saved locally')
      } catch {
        setFeedback('Save failed')
      }
    }, SAVE_DEBOUNCE_MS)
  }

  useEffect(() => {
    projectRef.current = project
  }, [project])

  useEffect(() => {
    titleRef.current = title
  }, [title])

  useEffect(() => {
    setTitle(normalizeProjectTitle(project?.title))
  }, [project?.id, project?.title])

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
      if (project && projectId) {
        const clearedProject = {
          ...project,
          content: DEFAULT_DOCUMENT,
          updatedAt: new Date().toISOString(),
          wordCount: countWords(DEFAULT_DOCUMENT),
        }
        saveProject(clearedProject)
        setProject(clearedProject)
        setFeedback('Document reset')
      }
    } catch {
      setFeedback('Could not clear storage')
    }
  }

  const backToDashboard = () => {
    navigate('/')
  }

  const commitTitleChange = () => {
    const normalizedTitle = normalizeProjectTitle(title)
    if (normalizedTitle !== title) {
      setTitle(normalizedTitle)
    }
    queueProjectSave({ title: normalizedTitle })
  }

  const openImageBrowser = () => {
    setShowImageBrowser(true)
  }

  const closeImageBrowser = () => {
    setShowImageBrowser(false)
  }

  const selectImage = (image: StoredImage) => {
    if (editor) {
      editor.chain().focus().setImage({ src: image.dataUrl, alt: image.name }).run()
    }
    setFeedback(`Inserted ${image.name}`)
  }

  const openCitationManager = () => {
    setShowCitationManager(true)
  }

  const closeCitationManager = () => {
    setShowCitationManager(false)
  }

  const insertCitation = (citation: string) => {
    if (editor) {
      editor.chain().focus().insertContent(citation).run()
    }
  }

  const handleSourcesChange = (sources: Source[]) => {
    if (project && projectId) {
      const updatedProject = {
        ...project,
        sources,
        updatedAt: new Date().toISOString(),
      }
      saveProject(updatedProject)
      setProject(updatedProject)
    }
  }

  const openAIResearch = () => {
    if (editor) {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to)
      setSelectedText(text)
    }
    setShowAIResearch(true)
  }

  const closeAIResearch = () => {
    setShowAIResearch(false)
    setSelectedText('')
  }

  const insertResearchPack = (content: string) => {
    if (editor) {
      editor.chain().focus().insertContent(content).run()
    }
  }

  if (!project && projectId) {
    return (
      <div className="editor-shell loading">
        <div className="loading-message">Loading project...</div>
      </div>
    )
  }

  return (
    <section className='editor-shell' aria-label='Rich text editor section'>
      <Toolbar editor={editor} onBackToDashboard={backToDashboard} onOpenImageBrowser={openImageBrowser} onOpenCitationManager={openCitationManager} onOpenAIResearch={openAIResearch} />

      <div className='editor-surface'>
        {editor ? <BubbleMenuBar editor={editor} /> : null}
        {editor ? <FloatingMenuBar editor={editor} /> : null}
        <div className='editor-scroll-region'>
          <input
            className='editor-title-input'
            aria-label='Document title'
            placeholder={DEFAULT_PROJECT_TITLE}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              titleRef.current = event.target.value
              queueProjectSave({ title: event.target.value })
            }}
            onBlur={commitTitleChange}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitTitleChange()
                editor?.commands.focus('start')
              }

              if (event.key === 'Escape') {
                event.preventDefault()
                const resetTitle = normalizeProjectTitle(projectRef.current?.title)
                setTitle(resetTitle)
                titleRef.current = resetTitle
              }
            }}
          />
          <EditorContent editor={editor} />
        </div>
        {showImageBrowser && (
          <ImageBrowser
            onSelectImage={selectImage}
            onClose={closeImageBrowser}
          />
        )}
      </div>

      <StatusBar
        editor={editor}
        feedback={feedback}
        onCopyHtml={copyHtml}
        onCopyJson={copyJson}
        onClear={clearDocument}
      />

      {showCitationManager && project && (
        <div className="citation-manager-overlay">
          <div className="citation-manager-modal">
            <div className="citation-manager-header">
              <h3>Citation Manager</h3>
              <button className="close-btn" onClick={closeCitationManager}>
                ×
              </button>
            </div>
            <CitationManager
              projectId={projectId!}
              sources={project.sources}
              citationStyle={project.citationStyle}
              onInsertCitation={insertCitation}
              onSourcesChange={handleSourcesChange}
            />
          </div>
        </div>
      )}

      {showAIResearch && project && (
        <AIResearchModal
          selectedText={selectedText}
          currentProject={project}
          onInsert={insertResearchPack}
          onClose={closeAIResearch}
        />
      )}
    </section>
  )
}
