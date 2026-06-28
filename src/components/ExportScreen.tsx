import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createExportRecord,
  formatInTextCitation,
  formatWorksCitedEntry,
  loadProject,
  type DraftPassage,
  type Project,
} from '../lib/storage'

function getProject(projectId?: string): Project | null {
  return projectId ? loadProject(projectId) : null
}

function getSelectedDraftPassage(project: Project): DraftPassage | null {
  const activeDraftPassageId = project.workflowState.activeDraftPassageId
  return (
    project.draftPassages.find(passage => passage.id === activeDraftPassageId) ??
    project.draftPassages.at(-1) ??
    null
  )
}

function getCitationText(project: Project, draftPassage: DraftPassage): string {
  if (draftPassage.citationText) {
    return draftPassage.citationText
  }

  const sources = project.sources.filter(source => draftPassage.sourceIds.includes(source.id))
  return sources.map(source => formatInTextCitation(source, project.citationStyle)).join(' ')
}

function buildMarkdownExport(project: Project, draftPassage: DraftPassage): string {
  const citationText = getCitationText(project, draftPassage)
  const sources = project.sources.filter(source => draftPassage.sourceIds.includes(source.id))
  const referenceEntries = sources.map(source => formatWorksCitedEntry(source, project.citationStyle))
  const passage = citationText ? `${draftPassage.text} ${citationText}` : draftPassage.text

  if (referenceEntries.length === 0) {
    return passage
  }

  return `${passage}\n\nReference:\n${referenceEntries.join('\n')}`
}

async function writeToClipboard(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API not available in this browser')
  }

  await navigator.clipboard.writeText(value)
}

export function ExportScreen() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(() => getProject(projectId))
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error'>('success')

  if (!project || !projectId) {
    return (
      <section className="workflow-form-page" aria-labelledby="export-not-found-heading">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
        <div className="empty-state">
          <h1 id="export-not-found-heading">Project not found</h1>
          <p>Return to the dashboard and choose an available project.</p>
        </div>
      </section>
    )
  }

  const draftPassage = getSelectedDraftPassage(project)
  const markdown = draftPassage ? buildMarkdownExport(project, draftPassage) : ''
  const hasReferenceEntries = draftPassage
    ? project.sources.some(source => draftPassage.sourceIds.includes(source.id))
    : false

  const handleCopyMarkdown = async () => {
    if (!draftPassage) {
      setStatusType('error')
      setStatusMessage('Add a draft passage before exporting.')
      return
    }

    try {
      await writeToClipboard(markdown)
      const exportRecord = createExportRecord(project.id, {
        draftPassageId: draftPassage.id,
        format: 'markdown',
        content: markdown,
        includedBibliography: hasReferenceEntries,
      })

      if (!exportRecord) {
        setStatusType('error')
        setStatusMessage('Markdown copied, but the export record could not be saved.')
        return
      }

      setProject(getProject(project.id))
      setStatusType('success')
      setStatusMessage('Markdown copied and export record saved.')
    } catch {
      setStatusType('error')
      setStatusMessage('Could not copy Markdown. Check browser clipboard permissions and try again.')
    }
  }

  return (
    <section className="workflow-form-page" aria-labelledby="export-heading">
      <div className="workflow-form-header">
        <button type="button" className="back-btn" onClick={() => navigate(`/projects/${project.id}`)}>
          Back to Workflow
        </button>
        <p className="workflow-eyebrow">Export</p>
        <h1 id="export-heading">Export cited passage</h1>
        <p>Copy the final cited passage as Markdown and save a local export record.</p>
      </div>

      {statusMessage && (
        <div className={statusType === 'success' ? 'form-success' : 'form-error'} role="status" aria-live="polite">
          {statusMessage}
        </div>
      )}

      {!draftPassage ? (
        <div className="workflow-form-layout single-column">
          <section className="workflow-form-card" aria-labelledby="export-empty-heading">
            <h2 id="export-empty-heading">Add a draft passage first</h2>
            <p>Export requires a saved draft passage linked to the workflow.</p>
            <Link className="workflow-primary-action" to={`/projects/${project.id}/drafts/new`}>
              Add draft passage
            </Link>
          </section>
        </div>
      ) : (
        <div className="workflow-form-layout">
          <section
            className="workflow-form-card"
            aria-labelledby="markdown-preview-heading"
            data-tutorial-target="export-card"
          >
            <div className="workflow-card-header">
              <div>
                <p className="workflow-card-kicker">Markdown</p>
                <h2 id="markdown-preview-heading">Export preview</h2>
              </div>
              <span className="workflow-step-status">
                {hasReferenceEntries ? 'Includes reference' : 'Passage only'}
              </span>
            </div>

            <pre className="markdown-preview" aria-label="Markdown export preview">
              {markdown}
            </pre>

            <div className="workflow-actions">
              <button type="button" className="workflow-primary-action as-button" onClick={handleCopyMarkdown}>
                Copy Markdown and save export
              </button>
              <Link className="workflow-secondary-action" to={`/projects/${project.id}/review`}>
                Back to review
              </Link>
            </div>
          </section>

          <aside className="workflow-form-aside" aria-label="Export details">
            <section className="workflow-card">
              <h2>Selected draft passage</h2>
              {draftPassage.title && <p><strong>{draftPassage.title}</strong></p>}
              <p>{draftPassage.text}</p>
            </section>

            <section className="workflow-card">
              <h2>Local exports</h2>
              {project.exports.length === 0 ? (
                <p>No export records saved yet.</p>
              ) : (
                <ul className="workflow-compact-list">
                  {project.exports.map(exportRecord => (
                    <li key={exportRecord.id}>{exportRecord.format} export saved</li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </section>
  )
}
