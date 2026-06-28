import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createDraftPassage,
  formatInTextCitation,
  loadProject,
  type Claim,
  type DraftPassage,
  type Project,
} from '../lib/storage'

function getProject(projectId?: string): Project | null {
  return projectId ? loadProject(projectId) : null
}

function getInitialClaimId(project: Project | null): string {
  if (!project || project.claims.length === 0) {
    return ''
  }

  const activeClaimId = project.workflowState.activeClaimId
  return project.claims.some(claim => claim.id === activeClaimId)
    ? activeClaimId ?? project.claims[0].id
    : project.claims[0].id
}

function getClaimLabel(claim: Claim): string {
  return claim.text.length > 96 ? `${claim.text.slice(0, 93)}...` : claim.text
}

export function EvidenceLinkedDrafting() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(() => getProject(projectId))
  const [claimId, setClaimId] = useState(() => getInitialClaimId(getProject(projectId)))
  const [title, setTitle] = useState('')
  const [passageText, setPassageText] = useState('')
  const [error, setError] = useState('')
  const [savedDraftPassage, setSavedDraftPassage] = useState<DraftPassage | null>(null)

  if (!project || !projectId) {
    return (
      <section className="workflow-form-page" aria-labelledby="draft-not-found-heading">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
        <div className="empty-state">
          <h1 id="draft-not-found-heading">Project not found</h1>
          <p>Return to the dashboard and choose an available project.</p>
        </div>
      </section>
    )
  }

  const selectedClaim = project.claims.find(claim => claim.id === claimId) ?? null
  const linkedAnnotations = selectedClaim
    ? project.annotations.filter(annotation => selectedClaim.annotationIds.includes(annotation.id))
    : []
  const linkedResearchItems = linkedAnnotations
    .map(annotation => project.researchItems.find(item => item.id === annotation.researchItemId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const linkedSources = selectedClaim
    ? project.sources.filter(source => selectedClaim.sourceIds.includes(source.id))
    : []
  const citationText = linkedSources.length > 0
    ? linkedSources.map(source => formatInTextCitation(source, project.citationStyle)).join(' ')
    : ''

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSavedDraftPassage(null)

    if (!claimId) {
      setError('Choose a claim before saving this draft passage.')
      return
    }

    if (!passageText.trim()) {
      setError('Add draft passage text before saving.')
      return
    }

    const draftPassage = createDraftPassage(project.id, {
      title: title.trim() || undefined,
      text: passageText,
      claimIds: [claimId],
      sourceIds: selectedClaim?.sourceIds ?? [],
      citationText: citationText || undefined,
    })

    if (!draftPassage) {
      setError('Could not save this draft passage. Reload the project and try again.')
      return
    }

    const updatedProject = getProject(project.id)
    setSavedDraftPassage(draftPassage)
    setProject(updatedProject)
    setClaimId(getInitialClaimId(updatedProject))
    setTitle('')
    setPassageText('')
  }

  return (
    <section className="workflow-form-page" aria-labelledby="draft-passage-heading">
      <div className="workflow-form-header">
        <button type="button" className="back-btn" onClick={() => navigate(`/projects/${project.id}`)}>
          Back to Workflow
        </button>
        <p className="workflow-eyebrow">Draft</p>
        <h1 id="draft-passage-heading">Draft from evidence</h1>
        <p>Write a focused passage while keeping the claim, annotation, and source context visible.</p>
      </div>

      {project.claims.length === 0 ? (
        <div className="workflow-form-layout single-column">
          <section className="workflow-form-card" aria-labelledby="draft-empty-heading">
            <h2 id="draft-empty-heading">Add a claim first</h2>
            <p>Draft passages need a claim link so the evidence-to-prose chain stays intact.</p>
            <Link className="workflow-primary-action" to={`/projects/${project.id}/claims/new`}>
              Add claim
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

            {savedDraftPassage && (
              <div className="form-success" role="status" aria-live="polite">
                Saved draft passage. It is ready for review in the next phase.
              </div>
            )}

            <div className="form-group">
              <label htmlFor="draft-claim">Claim</label>
              <select
                id="draft-claim"
                value={claimId}
                onChange={(event) => setClaimId(event.target.value)}
              >
                {project.claims.map(claim => (
                  <option key={claim.id} value={claim.id}>
                    {getClaimLabel(claim)}
                  </option>
                ))}
              </select>
            </div>

            {selectedClaim && (
              <section className="research-item-context" aria-labelledby="selected-claim-heading">
                <p className="workflow-card-kicker">Evidence context</p>
                <h2 id="selected-claim-heading">Selected claim</h2>
                <p>{selectedClaim.text}</p>
                <dl>
                  {linkedAnnotations.map(annotation => (
                    <div key={annotation.id}>
                      <dt>Annotation</dt>
                      <dd>{annotation.note}</dd>
                    </div>
                  ))}
                  {linkedResearchItems.map(item => (
                    <div key={item.id}>
                      <dt>Research item</dt>
                      <dd>{item.title}</dd>
                    </div>
                  ))}
                  {linkedSources.map(source => (
                    <div key={source.id}>
                      <dt>Source</dt>
                      <dd>
                        {source.title} ({source.year})
                      </dd>
                    </div>
                  ))}
                  {citationText && (
                    <div>
                      <dt>Citation text</dt>
                      <dd>{citationText}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            <div className="form-group">
              <label htmlFor="draft-title">Draft title</label>
              <input
                id="draft-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Optional title for this passage"
              />
            </div>

            <div className="form-group">
              <label htmlFor="draft-passage-text">Draft passage *</label>
              <textarea
                id="draft-passage-text"
                value={passageText}
                onChange={(event) => setPassageText(event.target.value)}
                rows={8}
                placeholder="Write the prose that uses this claim and evidence."
                required
              />
            </div>

            <div className="workflow-actions">
              <button type="submit" className="workflow-primary-action as-button">
                Save draft passage
              </button>
              <Link className="workflow-secondary-action" to={`/projects/${project.id}`}>
                Return to workflow home
              </Link>
            </div>
          </form>

          <aside className="workflow-form-aside" aria-label="Draft passages and project tools">
            <section className="workflow-card">
              <h2>Current draft passages</h2>
              {project.draftPassages.length === 0 ? (
                <p>No draft passages saved yet.</p>
              ) : (
                <ul className="workflow-compact-list">
                  {project.draftPassages.map(passage => (
                    <li key={passage.id}>{passage.title || passage.text}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="workflow-card">
              <h2>Workflow links</h2>
              <div className="workflow-link-list">
                <Link to={`/projects/${project.id}/claims/new`}>Add another claim</Link>
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
