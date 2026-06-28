import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  completeReview,
  formatInTextCitation,
  formatWorksCitedEntry,
  loadImages,
  loadProject,
  type Annotation,
  type Claim,
  type DraftPassage,
  type Project,
  type ResearchItem,
  type Source,
} from '../lib/storage'

type ProvenanceChain = {
  draftPassage: DraftPassage | null
  claims: Claim[]
  annotations: Annotation[]
  researchItems: ResearchItem[]
  sources: Source[]
  missing: string[]
}

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

function buildProvenanceChain(project: Project): ProvenanceChain {
  const draftPassage = getSelectedDraftPassage(project)
  const claims = draftPassage
    ? project.claims.filter(claim => draftPassage.claimIds.includes(claim.id))
    : []
  const annotations = claims.flatMap(claim =>
    project.annotations.filter(annotation => claim.annotationIds.includes(annotation.id)),
  )
  const researchItems = annotations
    .map(annotation => project.researchItems.find(item => item.id === annotation.researchItemId))
    .filter((item): item is ResearchItem => Boolean(item))
  const sourceIds = new Set([
    ...(draftPassage?.sourceIds ?? []),
    ...claims.flatMap(claim => claim.sourceIds),
    ...annotations.map(annotation => annotation.sourceId).filter((id): id is string => Boolean(id)),
    ...researchItems.map(item => item.sourceId).filter((id): id is string => Boolean(id)),
  ])
  const sources = project.sources.filter(source => sourceIds.has(source.id))
  const missing = [
    !draftPassage ? 'Draft passage is missing.' : '',
    draftPassage && claims.length === 0 ? 'Linked claim is missing.' : '',
    claims.length > 0 && annotations.length === 0 ? 'Linked annotation is missing.' : '',
    annotations.length > 0 && researchItems.length === 0 ? 'Linked research item is missing.' : '',
    draftPassage && sources.length === 0 ? 'Citation/source context is missing.' : '',
  ].filter(Boolean)

  return { draftPassage, claims, annotations, researchItems, sources, missing }
}

function isCompleteChain(chain: ProvenanceChain): boolean {
  return Boolean(
    chain.draftPassage &&
    chain.claims.length > 0 &&
    chain.annotations.length > 0 &&
    chain.researchItems.length > 0 &&
    chain.sources.length > 0,
  )
}

export function ReviewProvenanceView() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(() => getProject(projectId))
  const [statusMessage, setStatusMessage] = useState('')
  const images = loadImages()

  if (!project || !projectId) {
    return (
      <section className="workflow-form-page" aria-labelledby="review-not-found-heading">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
        <div className="empty-state">
          <h1 id="review-not-found-heading">Project not found</h1>
          <p>Return to the dashboard and choose an available project.</p>
        </div>
      </section>
    )
  }

  const chain = buildProvenanceChain(project)
  const chainIsComplete = isCompleteChain(chain)
  const referenceEntries = chain.sources.map(source => formatWorksCitedEntry(source, project.citationStyle))
  const citationText = chain.draftPassage?.citationText ||
    chain.sources.map(source => formatInTextCitation(source, project.citationStyle)).join(' ')

  const handleCompleteReview = () => {
    if (!chain.draftPassage || !chainIsComplete) {
      setStatusMessage('Complete the missing provenance links before marking review complete.')
      return
    }

    const updatedProject = completeReview(project.id, chain.draftPassage.id)
    if (!updatedProject) {
      setStatusMessage('Could not complete review. Reload the project and try again.')
      return
    }

    setProject(updatedProject)
    setStatusMessage('Review complete. You can now export the cited passage.')
  }

  return (
    <section className="workflow-form-page" aria-labelledby="review-heading">
      <div className="workflow-form-header">
        <button type="button" className="back-btn" onClick={() => navigate(`/projects/${project.id}`)}>
          Back to Workflow
        </button>
        <p className="workflow-eyebrow">Review</p>
        <h1 id="review-heading">Review provenance</h1>
        <p>Check that the draft passage traces back through claim, annotation, and research item.</p>
      </div>

      {statusMessage && (
        <div className={chainIsComplete ? 'form-success' : 'form-error'} role="status" aria-live="polite">
          {statusMessage}
        </div>
      )}

      <div className="workflow-form-layout">
        <section className="workflow-form-card provenance-chain" aria-labelledby="provenance-chain-heading">
          <div className="workflow-card-header">
            <div>
              <p className="workflow-card-kicker">Traceability checklist</p>
              <h2 id="provenance-chain-heading">Evidence-to-prose chain</h2>
            </div>
            <span className="workflow-step-status">
              {chainIsComplete ? 'Complete chain' : 'Needs attention'}
            </span>
          </div>

          {chain.missing.length > 0 && (
            <section className="provenance-alert" aria-labelledby="missing-links-heading">
              <h3 id="missing-links-heading">Missing links</h3>
              <ul>
                {chain.missing.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          <ol className="provenance-list">
            <li>
              <h3>1. Draft passage</h3>
              {chain.draftPassage ? (
                <>
                  {chain.draftPassage.title && <p><strong>{chain.draftPassage.title}</strong></p>}
                  <p>{chain.draftPassage.text}</p>
                  <Link to={`/projects/${project.id}/drafts/new`}>Edit or add draft passage</Link>
                </>
              ) : (
                <p>No draft passage yet. <Link to={`/projects/${project.id}/drafts/new`}>Add a draft passage</Link>.</p>
              )}
            </li>

            <li>
              <h3>2. Claim</h3>
              {chain.claims.length > 0 ? (
                chain.claims.map(claim => <p key={claim.id}>{claim.text}</p>)
              ) : (
                <p>No linked claim. <Link to={`/projects/${project.id}/claims/new`}>Build a claim</Link>.</p>
              )}
            </li>

            <li>
              <h3>3. Annotation</h3>
              {chain.annotations.length > 0 ? (
                chain.annotations.map(annotation => (
                  <div key={annotation.id}>
                    <p>{annotation.note}</p>
                    {annotation.excerpt && <p><strong>Excerpt:</strong> {annotation.excerpt}</p>}
                  </div>
                ))
              ) : (
                <p>No linked annotation. <Link to={`/projects/${project.id}/annotations/new`}>Add an annotation</Link>.</p>
              )}
            </li>

            <li>
              <h3>4. Research item and source</h3>
              {chain.researchItems.length > 0 ? (
                chain.researchItems.map(item => {
                  const image = item.imageId ? images.find(storedImage => storedImage.id === item.imageId) : null
                  return (
                    <div key={item.id}>
                      <p><strong>{item.title}</strong> ({item.kind})</p>
                      {item.description && <p>{item.description}</p>}
                      {item.locator && <p><strong>Locator:</strong> {item.locator}</p>}
                      {item.url && <p><strong>URL:</strong> {item.url}</p>}
                      {image && <p><strong>Linked image:</strong> {image.name}</p>}
                    </div>
                  )
                })
              ) : (
                <p>No linked research item. <Link to={`/projects/${project.id}/research-items/new`}>Add a research item</Link>.</p>
              )}

              {chain.sources.length > 0 ? (
                chain.sources.map(source => (
                  <p key={source.id}>
                    <strong>Source:</strong> {source.title} ({source.year})
                  </p>
                ))
              ) : (
                <p>No linked source metadata. <Link to="/citations">Review citations library</Link>.</p>
              )}
            </li>

            <li>
              <h3>5. Citation and reference</h3>
              {citationText ? <p><strong>Citation:</strong> {citationText}</p> : <p>No citation text available.</p>}
              {referenceEntries.length > 0 ? (
                referenceEntries.map(entry => <p key={entry}><strong>Reference:</strong> {entry}</p>)
              ) : (
                <p>No reference entry available.</p>
              )}
            </li>
          </ol>

          <div className="workflow-actions">
            <button type="button" className="workflow-primary-action as-button" onClick={handleCompleteReview}>
              Mark review complete
            </button>
            <Link className="workflow-secondary-action" to={`/projects/${project.id}/export`}>
              Go to export
            </Link>
          </div>
        </section>

        <aside className="workflow-form-aside" aria-label="Review actions">
          <section className="workflow-card">
            <h2>Review status</h2>
            <p>{chainIsComplete ? 'The core provenance chain is complete.' : 'Complete the missing links before export.'}</p>
          </section>

          <section className="workflow-card">
            <h2>Edit links</h2>
            <div className="workflow-link-list">
              <Link to={`/projects/${project.id}/research-items/new`}>Research items</Link>
              <Link to={`/projects/${project.id}/annotations/new`}>Annotations</Link>
              <Link to={`/projects/${project.id}/claims/new`}>Claims</Link>
              <Link to={`/projects/${project.id}/drafts/new`}>Draft passages</Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
