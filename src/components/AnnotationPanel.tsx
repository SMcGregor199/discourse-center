import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createAnnotation,
  loadImages,
  loadProject,
  type Annotation,
  type Project,
  type ResearchItem,
} from '../lib/storage'

function getProject(projectId?: string): Project | null {
  return projectId ? loadProject(projectId) : null
}

function getInitialResearchItemId(project: Project | null): string {
  if (!project || project.researchItems.length === 0) {
    return ''
  }

  const activeResearchItemId = project.workflowState.activeResearchItemId
  return project.researchItems.some(item => item.id === activeResearchItemId)
    ? activeResearchItemId ?? project.researchItems[0].id
    : project.researchItems[0].id
}

function getResearchItemLabel(item: ResearchItem): string {
  const kindLabel = item.kind.charAt(0).toUpperCase() + item.kind.slice(1)
  return `${item.title} (${kindLabel})`
}

function splitTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    ),
  )
}

export function AnnotationPanel() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(() => getProject(projectId))
  const [researchItemId, setResearchItemId] = useState(() => getInitialResearchItemId(getProject(projectId)))
  const [note, setNote] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [savedAnnotation, setSavedAnnotation] = useState<Annotation | null>(null)
  const images = loadImages()

  if (!project || !projectId) {
    return (
      <section className="workflow-form-page" aria-labelledby="annotation-not-found-heading">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
        <div className="empty-state">
          <h1 id="annotation-not-found-heading">Project not found</h1>
          <p>Return to the dashboard and choose an available project.</p>
        </div>
      </section>
    )
  }

  const selectedResearchItem = project.researchItems.find(item => item.id === researchItemId) ?? null
  const linkedSource = selectedResearchItem?.sourceId
    ? project.sources.find(source => source.id === selectedResearchItem.sourceId)
    : null
  const linkedImage = selectedResearchItem?.imageId
    ? images.find(image => image.id === selectedResearchItem.imageId)
    : null
  const annotationsForSelectedItem = selectedResearchItem
    ? project.annotations.filter(annotation => annotation.researchItemId === selectedResearchItem.id)
    : []

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSavedAnnotation(null)

    if (!researchItemId) {
      setError('Choose a research item before saving this annotation.')
      return
    }

    if (!note.trim()) {
      setError('Add an annotation note before saving.')
      return
    }

    const annotation = createAnnotation(project.id, {
      researchItemId,
      note,
      excerpt: excerpt.trim() || undefined,
      tags: splitTags(tags),
    })

    if (!annotation) {
      setError('Could not save this annotation. Reload the project and try again.')
      return
    }

    const updatedProject = getProject(project.id)
    setSavedAnnotation(annotation)
    setProject(updatedProject)
    setResearchItemId(getInitialResearchItemId(updatedProject))
    setNote('')
    setExcerpt('')
    setTags('')
  }

  return (
    <section className="workflow-form-page" aria-labelledby="annotation-heading">
      <div className="workflow-form-header">
        <button type="button" className="back-btn" onClick={() => navigate(`/projects/${project.id}`)}>
          Back to Workflow
        </button>
        <p className="workflow-eyebrow">Annotation</p>
        <h1 id="annotation-heading">Annotate a research item</h1>
        <p>Record what a piece of evidence shows before turning it into a claim.</p>
      </div>

      {project.researchItems.length === 0 ? (
        <div className="workflow-form-layout single-column">
          <section className="workflow-form-card" aria-labelledby="annotation-empty-heading">
            <h2 id="annotation-empty-heading">Add a research item first</h2>
            <p>Annotations must be linked to evidence so the workflow can preserve provenance.</p>
            <Link className="workflow-primary-action" to={`/projects/${project.id}/research-items/new`}>
              Add research item
            </Link>
          </section>
        </div>
      ) : (
        <div className="workflow-form-layout">
          <form className="workflow-form-card" onSubmit={handleSubmit}>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            {savedAnnotation && (
              <div className="form-success" role="status" aria-live="polite">
                Saved annotation for {selectedResearchItem?.title ?? 'this research item'}.
              </div>
            )}

            <div className="form-group">
              <label htmlFor="annotation-research-item">Research item</label>
              <select
                id="annotation-research-item"
                value={researchItemId}
                onChange={(event) => setResearchItemId(event.target.value)}
              >
                {project.researchItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {getResearchItemLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            {selectedResearchItem && (
              <section className="research-item-context" aria-labelledby="selected-research-item-heading">
                <p className="workflow-card-kicker">Selected evidence</p>
                <h2 id="selected-research-item-heading">{selectedResearchItem.title}</h2>
                {selectedResearchItem.description && <p>{selectedResearchItem.description}</p>}
                <dl>
                  <div>
                    <dt>Kind</dt>
                    <dd>{selectedResearchItem.kind}</dd>
                  </div>
                  {selectedResearchItem.locator && (
                    <div>
                      <dt>Locator</dt>
                      <dd>{selectedResearchItem.locator}</dd>
                    </div>
                  )}
                  {linkedSource && (
                    <div>
                      <dt>Linked source</dt>
                      <dd>
                        {linkedSource.title} ({linkedSource.year})
                      </dd>
                    </div>
                  )}
                  {linkedImage && (
                    <div>
                      <dt>Linked image</dt>
                      <dd>{linkedImage.name}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            <div className="form-group">
              <label htmlFor="annotation-note">Annotation note *</label>
              <textarea
                id="annotation-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={5}
                placeholder="What does this item show, and why does it matter?"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="annotation-excerpt">Excerpt</label>
              <textarea
                id="annotation-excerpt"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                rows={3}
                placeholder="Optional quote, visual detail, timestamp, or page excerpt."
              />
            </div>

            <div className="form-group">
              <label htmlFor="annotation-tags">Tags</label>
              <input
                id="annotation-tags"
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Comma-separated, e.g. method, contradiction"
              />
            </div>

            <div className="workflow-actions">
              <button type="submit" className="workflow-primary-action as-button">
                Save annotation
              </button>
              <Link className="workflow-secondary-action" to={`/projects/${project.id}`}>
                Return to workflow home
              </Link>
            </div>
          </form>

          <aside className="workflow-form-aside" aria-label="Existing annotations and project tools">
            <section className="workflow-card">
              <h2>Annotations for this item</h2>
              {annotationsForSelectedItem.length === 0 ? (
                <p>No annotations saved for this research item yet.</p>
              ) : (
                <ul className="workflow-compact-list">
                  {annotationsForSelectedItem.map(annotation => (
                    <li key={annotation.id}>{annotation.note}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="workflow-card">
              <h2>Workflow links</h2>
              <div className="workflow-link-list">
                <Link to={`/projects/${project.id}/research-items/new`}>Add another research item</Link>
                <Link to={`/editor/${project.id}`}>Open editor</Link>
                <Link to="/citations">Open citations library</Link>
              </div>
            </section>
          </aside>
        </div>
      )}
    </section>
  )
}
