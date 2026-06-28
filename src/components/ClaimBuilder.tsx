import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createClaim,
  loadProject,
  type Annotation,
  type Claim,
  type Project,
  type ResearchItem,
} from '../lib/storage'

function getProject(projectId?: string): Project | null {
  return projectId ? loadProject(projectId) : null
}

function getInitialAnnotationId(project: Project | null): string {
  if (!project || project.annotations.length === 0) {
    return ''
  }

  const activeAnnotationId = project.workflowState.activeAnnotationId
  return project.annotations.some(annotation => annotation.id === activeAnnotationId)
    ? activeAnnotationId ?? project.annotations[0].id
    : project.annotations[0].id
}

function getAnnotationLabel(annotation: Annotation, researchItem?: ResearchItem): string {
  return researchItem ? `${researchItem.title}: ${annotation.note}` : annotation.note
}

export function ClaimBuilder() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(() => getProject(projectId))
  const [annotationId, setAnnotationId] = useState(() => getInitialAnnotationId(getProject(projectId)))
  const [claimText, setClaimText] = useState('')
  const [error, setError] = useState('')
  const [savedClaim, setSavedClaim] = useState<Claim | null>(null)

  if (!project || !projectId) {
    return (
      <section className="workflow-form-page" aria-labelledby="claim-not-found-heading">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
        <div className="empty-state">
          <h1 id="claim-not-found-heading">Project not found</h1>
          <p>Return to the dashboard and choose an available project.</p>
        </div>
      </section>
    )
  }

  const selectedAnnotation = project.annotations.find(annotation => annotation.id === annotationId) ?? null
  const selectedResearchItem = selectedAnnotation
    ? project.researchItems.find(item => item.id === selectedAnnotation.researchItemId)
    : null
  const linkedSource = selectedAnnotation?.sourceId
    ? project.sources.find(source => source.id === selectedAnnotation.sourceId)
    : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSavedClaim(null)

    if (!annotationId) {
      setError('Choose an annotation before saving this claim.')
      return
    }

    if (!claimText.trim()) {
      setError('Add claim text before saving.')
      return
    }

    const claim = createClaim(project.id, {
      annotationIds: [annotationId],
      text: claimText,
      status: 'draft',
    })

    if (!claim) {
      setError('Could not save this claim. Reload the project and try again.')
      return
    }

    const updatedProject = getProject(project.id)
    setSavedClaim(claim)
    setProject(updatedProject)
    setAnnotationId(getInitialAnnotationId(updatedProject))
    setClaimText('')
  }

  return (
    <section className="workflow-form-page" aria-labelledby="claim-builder-heading">
      <div className="workflow-form-header">
        <button type="button" className="back-btn" onClick={() => navigate(`/projects/${project.id}`)}>
          Back to Workflow
        </button>
        <p className="workflow-eyebrow">Claim</p>
        <h1 id="claim-builder-heading">Build a claim</h1>
        <p>Turn an annotation into a focused, arguable statement for drafting.</p>
      </div>

      {project.annotations.length === 0 ? (
        <div className="workflow-form-layout single-column">
          <section className="workflow-form-card" aria-labelledby="claim-empty-heading">
            <h2 id="claim-empty-heading">Add an annotation first</h2>
            <p>Claims need an annotation link so the final prose remains traceable to evidence.</p>
            <Link className="workflow-primary-action" to={`/projects/${project.id}/annotations/new`}>
              Add annotation
            </Link>
          </section>
        </div>
      ) : (
        <div className="workflow-form-layout">
          <form className="workflow-form-card" onSubmit={handleSubmit} data-tutorial-target="claim-form">
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            {savedClaim && (
              <div className="form-success" role="status" aria-live="polite">
                Saved claim. You can now draft from it.
              </div>
            )}

            <div className="form-group">
              <label htmlFor="claim-annotation">Annotation</label>
              <select
                id="claim-annotation"
                value={annotationId}
                onChange={(event) => setAnnotationId(event.target.value)}
              >
                {project.annotations.map(annotation => {
                  const researchItem = project.researchItems.find(item => item.id === annotation.researchItemId)
                  return (
                    <option key={annotation.id} value={annotation.id}>
                      {getAnnotationLabel(annotation, researchItem)}
                    </option>
                  )
                })}
              </select>
            </div>

            {selectedAnnotation && (
              <section className="research-item-context" aria-labelledby="selected-annotation-heading">
                <p className="workflow-card-kicker">Selected annotation</p>
                <h2 id="selected-annotation-heading">
                  {selectedResearchItem?.title ?? 'Unlinked research item'}
                </h2>
                <p>{selectedAnnotation.note}</p>
                <dl>
                  {selectedAnnotation.excerpt && (
                    <div>
                      <dt>Excerpt</dt>
                      <dd>{selectedAnnotation.excerpt}</dd>
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
                  {selectedAnnotation.tags.length > 0 && (
                    <div>
                      <dt>Tags</dt>
                      <dd>{selectedAnnotation.tags.join(', ')}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            <div className="form-group">
              <label htmlFor="claim-text">Claim text *</label>
              <textarea
                id="claim-text"
                value={claimText}
                onChange={(event) => setClaimText(event.target.value)}
                rows={5}
                placeholder="State the arguable point this annotation supports."
                required
              />
            </div>

            <div className="workflow-actions">
              <button type="submit" className="workflow-primary-action as-button">
                Save claim
              </button>
              <Link className="workflow-secondary-action" to={`/projects/${project.id}/drafts/new`}>
                Go to drafting
              </Link>
            </div>
          </form>

          <aside className="workflow-form-aside" aria-label="Existing claims and project tools">
            <section className="workflow-card">
              <h2>Current claims</h2>
              {project.claims.length === 0 ? (
                <p>No claims saved yet.</p>
              ) : (
                <ul className="workflow-compact-list">
                  {project.claims.map(claim => (
                    <li key={claim.id}>{claim.text}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="workflow-card">
              <h2>Workflow links</h2>
              <div className="workflow-link-list">
                <Link to={`/projects/${project.id}/annotations/new`}>Add another annotation</Link>
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
