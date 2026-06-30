import { Link, useNavigate, useParams } from 'react-router-dom'
import { loadProject, type Project, type WorkflowStep } from '../lib/storage'

const CITATION_STYLE_LABELS = {
  mla: 'MLA',
} as const

const WORKFLOW_STEPS: Array<{
  id: WorkflowStep
  label: string
  description: string
}> = [
  {
    id: 'project',
    label: 'Project Setup',
    description: 'Create the project and choose citation style.',
  },
  {
    id: 'research-item',
    label: 'Research Item',
    description: 'Add one source, object, image, or note as evidence.',
  },
  {
    id: 'annotation',
    label: 'Annotation',
    description: 'Record what the item shows and why it matters.',
  },
  {
    id: 'claim',
    label: 'Claim',
    description: 'Turn the annotation into an arguable statement.',
  },
  {
    id: 'draft',
    label: 'Draft',
    description: 'Write a short passage grounded in the claim.',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Check the source-to-prose trace before export.',
  },
  {
    id: 'export',
    label: 'Export',
    description: 'Copy or export the final cited passage.',
  },
]

function getWorkflowStepLabel(step: WorkflowStep): string {
  return WORKFLOW_STEPS.find(workflowStep => workflowStep.id === step)?.label ?? 'Project Setup'
}

function getArtifactCounts(project: Project) {
  return [
    { label: 'Research items', value: project.researchItems.length },
    { label: 'Annotations', value: project.annotations.length },
    { label: 'Claims', value: project.claims.length },
    { label: 'Draft passages', value: project.draftPassages.length },
    { label: 'Exports', value: project.exports.length },
  ]
}

function getNextStep(project: Project) {
  const currentStep = project.workflowState.currentStep
  const hasResearchItems = project.researchItems.length > 0
  const hasAnnotations = project.annotations.length > 0
  const hasClaims = project.claims.length > 0
  const hasDraftPassages = project.draftPassages.length > 0
  const hasExports = project.exports.length > 0
  const isReviewComplete = project.workflowState.completedSteps.includes('review')

  switch (currentStep) {
    case 'project':
    case 'research-item':
      if (hasExports) {
        return {
          title: 'Workflow complete',
          description:
            'The project has a saved evidence-to-prose chain and a local Markdown export record.',
          primaryHref: `/projects/${project.id}/export`,
          primaryLabel: 'View export',
          secondaryHref: `/projects/${project.id}/review`,
          secondaryLabel: 'Review provenance',
        }
      }

      if (hasDraftPassages) {
        return {
          title: 'Next: review provenance',
          description:
            'Check the saved draft passage against its source, annotation, and claim before export.',
          primaryHref: `/projects/${project.id}/review`,
          primaryLabel: 'Review provenance',
          secondaryHref: `/projects/${project.id}/export`,
          secondaryLabel: 'Go to export',
        }
      }

      if (hasClaims) {
        return {
          title: 'Next: draft with evidence nearby',
          description:
            'Use the saved claim and its linked evidence to write a focused draft passage.',
          primaryHref: `/projects/${project.id}/drafts/new`,
          primaryLabel: 'Draft passage',
          secondaryHref: `/projects/${project.id}/claims/new`,
          secondaryLabel: 'Add another claim',
        }
      }

      if (hasAnnotations) {
        return {
          title: 'Next: develop a claim',
          description:
            'Turn the saved annotation into an arguable claim before drafting prose.',
          primaryHref: `/projects/${project.id}/claims/new`,
          primaryLabel: 'Build claim',
          secondaryHref: `/projects/${project.id}/annotations/new`,
          secondaryLabel: 'Add another annotation',
        }
      }

      if (hasResearchItems && !hasAnnotations) {
        return {
          title: 'Next: annotate the evidence',
          description:
            'Use the saved research item as the evidence record, then write the annotation that explains what it shows.',
          primaryHref: `/projects/${project.id}/annotations/new`,
          primaryLabel: 'Add annotation',
          secondaryHref: `/projects/${project.id}/research-items/new`,
          secondaryLabel: 'Add another item',
        }
      }

      return {
        title: 'Next: add a research item',
        description:
          'Start with one source, image, object, or note so later annotations and claims have a traceable evidence record.',
        primaryHref: `/projects/${project.id}/research-items/new`,
        primaryLabel: 'Add research item',
        secondaryHref: '/citations',
        secondaryLabel: 'Review citations',
      }
    case 'annotation':
      if (hasAnnotations) {
        return {
          title: 'Next: develop a claim',
          description:
            'Turn the saved annotation into an arguable claim before drafting prose.',
          primaryHref: `/projects/${project.id}/claims/new`,
          primaryLabel: 'Build claim',
          secondaryHref: `/projects/${project.id}/annotations/new`,
          secondaryLabel: 'Add another annotation',
        }
      }

      return {
        title: 'Next: annotate the evidence',
        description:
          'Capture what the selected research item shows and why it matters before moving toward a claim.',
        primaryHref: `/projects/${project.id}/annotations/new`,
        primaryLabel: 'Add annotation',
        secondaryHref: `/projects/${project.id}/research-items/new`,
        secondaryLabel: 'Add another item',
      }
    case 'claim':
      if (hasClaims) {
        return {
          title: 'Next: draft with evidence nearby',
          description:
            'Use the saved claim and its linked evidence to write a focused draft passage.',
          primaryHref: `/projects/${project.id}/drafts/new`,
          primaryLabel: 'Draft passage',
          secondaryHref: `/projects/${project.id}/claims/new`,
          secondaryLabel: 'Add another claim',
        }
      }

      return {
        title: 'Next: develop a claim',
        description:
          'Turn the saved annotation into an arguable claim before drafting prose.',
        primaryHref: `/projects/${project.id}/claims/new`,
        primaryLabel: 'Build claim',
        secondaryHref: `/projects/${project.id}/annotations/new`,
        secondaryLabel: 'Add another annotation',
      }
    case 'draft':
      if (hasExports) {
        return {
          title: 'Workflow complete',
          description:
            'The project has a saved evidence-to-prose chain and a local Markdown export record.',
          primaryHref: `/projects/${project.id}/export`,
          primaryLabel: 'View export',
          secondaryHref: `/projects/${project.id}/review`,
          secondaryLabel: 'Review provenance',
        }
      }

      if (isReviewComplete) {
        return {
          title: 'Next: export cited prose',
          description:
            'The provenance chain has been reviewed. Copy the cited passage as Markdown and save the export record.',
          primaryHref: `/projects/${project.id}/export`,
          primaryLabel: 'Export Markdown',
          secondaryHref: `/projects/${project.id}/review`,
          secondaryLabel: 'Review provenance',
        }
      }

      if (hasDraftPassages) {
        return {
          title: 'Next: review provenance',
          description:
            'Check the saved draft passage against its source, annotation, and claim before export.',
          primaryHref: `/projects/${project.id}/review`,
          primaryLabel: 'Review provenance',
          secondaryHref: `/projects/${project.id}/drafts/new`,
          secondaryLabel: 'Add another draft',
        }
      }

      return {
        title: 'Next: draft with evidence nearby',
        description:
          'Use the saved claim and its linked evidence to write a focused draft passage.',
        primaryHref: `/projects/${project.id}/drafts/new`,
        primaryLabel: 'Draft passage',
        secondaryHref: `/projects/${project.id}/claims/new`,
        secondaryLabel: 'Add another claim',
      }
    case 'review':
      if (hasExports) {
        return {
          title: 'Workflow complete',
          description:
            'The project has a saved evidence-to-prose chain and a local Markdown export record.',
          primaryHref: `/projects/${project.id}/export`,
          primaryLabel: 'View export',
          secondaryHref: `/projects/${project.id}/review`,
          secondaryLabel: 'Review provenance',
        }
      }

      if (isReviewComplete) {
        return {
          title: 'Next: export cited prose',
          description:
            'The provenance chain has been reviewed. Copy the cited passage as Markdown and save the export record.',
          primaryHref: `/projects/${project.id}/export`,
          primaryLabel: 'Export Markdown',
          secondaryHref: `/projects/${project.id}/review`,
          secondaryLabel: 'Review provenance',
        }
      }

      return {
        title: 'Next: review provenance',
        description:
          'Check the saved draft passage against its source, annotation, and claim before export.',
        primaryHref: `/projects/${project.id}/review`,
        primaryLabel: 'Review provenance',
        secondaryHref: `/projects/${project.id}/drafts/new`,
        secondaryLabel: 'Add another draft',
      }
    case 'export':
      if (hasExports) {
        return {
          title: 'Workflow complete',
          description:
            'The project has a saved evidence-to-prose chain and a local Markdown export record.',
          primaryHref: `/projects/${project.id}/export`,
          primaryLabel: 'View export',
          secondaryHref: `/projects/${project.id}/review`,
          secondaryLabel: 'Review provenance',
        }
      }

      return {
        title: 'Next: export cited prose',
        description:
          'Copy the cited passage as Markdown and save a local export record.',
        primaryHref: `/projects/${project.id}/export`,
        primaryLabel: 'Export Markdown',
        secondaryHref: `/projects/${project.id}/review`,
        secondaryLabel: 'Review provenance',
      }
  }
}

function WorkflowProgress({ project }: { project: Project }) {
  const { currentStep, completedSteps } = project.workflowState

  return (
    <section className="workflow-card" aria-labelledby="workflow-progress-heading">
      <div className="workflow-card-header">
        <h2 id="workflow-progress-heading">Workflow progress</h2>
        <p>Move from evidence to annotation to claim to cited prose.</p>
      </div>

      <ol className="workflow-progress-list">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCurrent = step.id === currentStep
          const isComplete = completedSteps.includes(step.id)
          const statusLabel = isComplete ? 'Complete' : isCurrent ? 'Current' : 'Not started'

          return (
            <li
              key={step.id}
              className={`workflow-progress-item${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="workflow-step-index" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <div className="workflow-step-title-row">
                  <h3>{step.label}</h3>
                  <span className="workflow-step-status">{statusLabel}</span>
                </div>
                <p>{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function ProjectWorkflowHome() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const project = projectId ? loadProject(projectId) : null

  if (!project) {
    return (
      <section className="project-workflow not-found" aria-labelledby="workflow-not-found-heading">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
        <div className="empty-state">
          <h1 id="workflow-not-found-heading">Project not found</h1>
          <p>Return to the dashboard and choose an available project.</p>
        </div>
      </section>
    )
  }

  const nextStep = getNextStep(project)
  const artifactCounts = getArtifactCounts(project)
  const currentStepLabel = getWorkflowStepLabel(project.workflowState.currentStep)

  return (
    <section className="project-workflow" aria-labelledby="project-workflow-heading" data-tutorial-target="workflow-home">
      <header className="workflow-hero">
        <div>
          <button type="button" className="back-btn" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
          <p className="workflow-eyebrow">Guided evidence-to-prose workflow</p>
          <h1 id="project-workflow-heading">{project.title}</h1>
          <p>
            Build a traceable path from research material to annotation, claim, cited draft, and export.
          </p>
        </div>

        <div className="workflow-status-panel" aria-label="Project status">
          <span className="workflow-status-label">Current step</span>
          <strong>{currentStepLabel}</strong>
          <span>{project.wordCount.toLocaleString()} words</span>
          <span>{CITATION_STYLE_LABELS[project.citationStyle]} citations</span>
        </div>
      </header>

      <div className="workflow-layout">
        <WorkflowProgress project={project} />

        <aside className="workflow-sidebar" aria-label="Workflow actions and project links">
          <section className="workflow-card next-step-card" aria-labelledby="next-step-heading">
            <span className="workflow-card-kicker">Next step</span>
            <h2 id="next-step-heading">{nextStep.title}</h2>
            <p>{nextStep.description}</p>
            <div className="workflow-actions">
              <Link className="workflow-primary-action" to={nextStep.primaryHref}>
                {nextStep.primaryLabel}
              </Link>
              <Link className="workflow-secondary-action" to={nextStep.secondaryHref}>
                {nextStep.secondaryLabel}
              </Link>
            </div>
          </section>

          <section className="workflow-card" aria-labelledby="project-tools-heading">
            <h2 id="project-tools-heading">Existing project surfaces</h2>
            <div className="workflow-link-list">
              <Link to={`/editor/${project.id}`}>Open editor</Link>
              <Link to="/images">Open image repository</Link>
              <Link to="/citations">Open citations library</Link>
            </div>
          </section>

          <section className="workflow-card" aria-labelledby="project-artifacts-heading">
            <h2 id="project-artifacts-heading">Project artifacts</h2>
            <dl className="workflow-artifact-counts">
              {artifactCounts.map(item => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </section>
  )
}
