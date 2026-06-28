import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createResearchItem,
  loadImages,
  loadProject,
  type Project,
  type ResearchItem,
  type ResearchItemKind,
} from '../lib/storage'

const RESEARCH_ITEM_KINDS: Array<{ value: ResearchItemKind; label: string }> = [
  { value: 'source', label: 'Source' },
  { value: 'image', label: 'Image' },
  { value: 'object', label: 'Object' },
  { value: 'note', label: 'Note' },
]

function getProject(projectId?: string): Project | null {
  return projectId ? loadProject(projectId) : null
}

export function ResearchItemIntake() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(() => getProject(projectId))
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<ResearchItemKind>('source')
  const [description, setDescription] = useState('')
  const [locator, setLocator] = useState('')
  const [url, setUrl] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [imageId, setImageId] = useState('')
  const [error, setError] = useState('')
  const [savedResearchItem, setSavedResearchItem] = useState<ResearchItem | null>(null)
  const images = loadImages()

  if (!project || !projectId) {
    return (
      <section className="workflow-form-page" aria-labelledby="research-item-not-found-heading">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
        <div className="empty-state">
          <h1 id="research-item-not-found-heading">Project not found</h1>
          <p>Return to the dashboard and choose an available project.</p>
        </div>
      </section>
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSavedResearchItem(null)

    if (!title.trim()) {
      setError('Add a title before saving this research item.')
      return
    }

    const researchItem = createResearchItem(project.id, {
      title,
      kind,
      description: description.trim() || undefined,
      locator: locator.trim() || undefined,
      url: url.trim() || undefined,
      sourceId: sourceId || undefined,
      imageId: imageId || undefined,
    })

    if (!researchItem) {
      setError('Could not save this research item. Reload the project and try again.')
      return
    }

    setSavedResearchItem(researchItem)
    setProject(getProject(project.id))
    setTitle('')
    setKind('source')
    setDescription('')
    setLocator('')
    setUrl('')
    setSourceId('')
    setImageId('')
  }

  return (
    <section className="workflow-form-page" aria-labelledby="research-item-heading">
      <div className="workflow-form-header">
        <button type="button" className="back-btn" onClick={() => navigate(`/projects/${project.id}`)}>
          Back to Workflow
        </button>
        <p className="workflow-eyebrow">Research Item</p>
        <h1 id="research-item-heading">Add a research item</h1>
        <p>
          Create the evidence record that annotations and claims will build from in {project.title}.
        </p>
      </div>

      <div className="workflow-form-layout">
        <form className="workflow-form-card" onSubmit={handleSubmit} data-tutorial-target="research-item-form">
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          {savedResearchItem && (
            <div className="form-success" role="status" aria-live="polite">
              Saved {savedResearchItem.title}. You can now annotate it.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="research-item-title">Title *</label>
            <input
              id="research-item-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Interview transcript, chapter excerpt, archive photo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="research-item-kind">Kind</label>
            <select
              id="research-item-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as ResearchItemKind)}
            >
              {RESEARCH_ITEM_KINDS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="research-item-description">Description</label>
            <textarea
              id="research-item-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Briefly describe what this item is and why it belongs in the project."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="research-item-locator">Locator</label>
              <input
                id="research-item-locator"
                type="text"
                value={locator}
                onChange={(event) => setLocator(event.target.value)}
                placeholder="Page, timestamp, box/folder, figure"
              />
            </div>

            <div className="form-group">
              <label htmlFor="research-item-url">URL</label>
              <input
                id="research-item-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="research-item-source">Linked source</label>
            <select
              id="research-item-source"
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
            >
              <option value="">No linked source</option>
              {project.sources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.title} ({source.year})
                </option>
              ))}
            </select>
            {project.sources.length === 0 && (
              <p className="form-help">
                No project sources yet. You can add sources from the existing citation manager.
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="research-item-image">Linked image</label>
            <select
              id="research-item-image"
              value={imageId}
              onChange={(event) => setImageId(event.target.value)}
            >
              <option value="">No linked image</option>
              {images.map(image => (
                <option key={image.id} value={image.id}>
                  {image.name}
                </option>
              ))}
            </select>
            {images.length === 0 && (
              <p className="form-help">
                No uploaded images yet. Images are optional for research items.
              </p>
            )}
          </div>

          <div className="workflow-actions">
            <button type="submit" className="workflow-primary-action as-button">
              Save research item
            </button>
            <Link className="workflow-secondary-action" to={`/projects/${project.id}/annotations/new`}>
              Go to annotations
            </Link>
          </div>
        </form>

        <aside className="workflow-form-aside" aria-label="Existing project tools">
          <section className="workflow-card">
            <h2>Use existing context</h2>
            <p>Research items can link to source records and images already stored in this project.</p>
            <div className="workflow-link-list">
              <Link to="/citations">Open citations library</Link>
              <Link to="/images">Open image repository</Link>
            </div>
          </section>

          <section className="workflow-card">
            <h2>Current items</h2>
            {project.researchItems.length === 0 ? (
              <p>No research items yet.</p>
            ) : (
              <ul className="workflow-compact-list">
                {project.researchItems.map(item => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}
