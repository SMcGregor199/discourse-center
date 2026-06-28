import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { loadProject, loadProjects, type Project } from '../lib/storage'
import {
  completeTutorial,
  dismissTutorial,
  loadTutorialState,
  saveTutorialState,
  startTutorial,
  updateTutorialProgress,
  type TutorialState,
  type TutorialStepId,
} from '../lib/tutorial'

type TutorialStepDefinition = {
  id: TutorialStepId
  title: string
  instruction: string
  requirement: string
  targetLabel: string
  actionLabel?: string
}

const TUTORIAL_STEPS: TutorialStepDefinition[] = [
  {
    id: 'intro',
    title: 'Evidence becomes prose here',
    instruction:
      'Discourse Center guides a scholar from research material to annotation, claim, cited draft, review, and export.',
    requirement: 'Start the guided sequence when you are ready.',
    targetLabel: 'Dashboard or project workflow home',
  },
  {
    id: 'open-project',
    title: 'Create or open a project',
    instruction:
      'Projects are the containers for the evidence-to-prose cycle. Open an existing project or create a new one.',
    requirement: 'Reach a project workflow home before continuing.',
    targetLabel: 'Project card or New project button',
    actionLabel: 'Go to dashboard',
  },
  {
    id: 'research-item',
    title: 'Add a research item',
    instruction:
      'Start with one source, image, object, or note so every later step can trace back to evidence.',
    requirement: 'Save at least one research item in this project.',
    targetLabel: 'Research item form',
    actionLabel: 'Add research item',
  },
  {
    id: 'annotation',
    title: 'Annotate the evidence',
    instruction:
      'Write what the research item shows and why it matters. This is the interpretive bridge from material to argument.',
    requirement: 'Save at least one annotation linked to a research item.',
    targetLabel: 'Annotation form',
    actionLabel: 'Add annotation',
  },
  {
    id: 'claim',
    title: 'Build a claim',
    instruction:
      'Convert the annotation into an arguable claim that can support a focused draft passage.',
    requirement: 'Save at least one claim linked to an annotation.',
    targetLabel: 'Claim builder form',
    actionLabel: 'Build claim',
  },
  {
    id: 'draft',
    title: 'Draft from the claim',
    instruction:
      'Write the passage while keeping claim, annotation, and citation context visible.',
    requirement: 'Save at least one draft passage linked to a claim.',
    targetLabel: 'Evidence-linked drafting form',
    actionLabel: 'Draft passage',
  },
  {
    id: 'review',
    title: 'Review provenance',
    instruction:
      'Check the chain from draft passage back through claim, annotation, and research item before export.',
    requirement: 'Open the review screen and confirm the provenance chain is visible.',
    targetLabel: 'Review provenance chain',
    actionLabel: 'Review provenance',
  },
  {
    id: 'export',
    title: 'Export Markdown',
    instruction:
      'Copy the final cited passage as Markdown and save a local export record.',
    requirement: 'Complete a Markdown export for this project.',
    targetLabel: 'Markdown export preview',
    actionLabel: 'Export Markdown',
  },
  {
    id: 'complete',
    title: 'Tutorial complete',
    instruction:
      'You completed the full academic work cycle: evidence -> annotation -> claim -> draft -> review/export.',
    requirement: 'Finish the tutorial or restart it later from the tutorial button.',
    targetLabel: 'Completed workflow',
  },
]

const STEP_ORDER = TUTORIAL_STEPS.map(step => step.id)

function getStepDefinition(stepId: TutorialStepId): TutorialStepDefinition {
  return TUTORIAL_STEPS.find(step => step.id === stepId) ?? TUTORIAL_STEPS[0]
}

function getProjectIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/projects\/([^/]+)/)
  return match?.[1]
}

function getKnownProjectId(state: TutorialState, pathname: string): string | undefined {
  return getProjectIdFromPath(pathname) ?? state.projectId ?? loadProjects()[0]?.id
}

function isProjectWorkflowHome(pathname: string): boolean {
  return /^\/projects\/[^/]+$/.test(pathname)
}

function getActionHref(stepId: TutorialStepId, projectId?: string): string {
  switch (stepId) {
    case 'open-project':
      return '/'
    case 'research-item':
      return projectId ? `/projects/${projectId}/research-items/new` : '/'
    case 'annotation':
      return projectId ? `/projects/${projectId}/annotations/new` : '/'
    case 'claim':
      return projectId ? `/projects/${projectId}/claims/new` : '/'
    case 'draft':
      return projectId ? `/projects/${projectId}/drafts/new` : '/'
    case 'review':
      return projectId ? `/projects/${projectId}/review` : '/'
    case 'export':
      return projectId ? `/projects/${projectId}/export` : '/'
    default:
      return '/'
  }
}

function getProjectForTutorial(projectId?: string): Project | null {
  return projectId ? loadProject(projectId) : null
}

function isStepComplete(stepId: TutorialStepId, pathname: string, project: Project | null): boolean {
  switch (stepId) {
    case 'intro':
      return true
    case 'open-project':
      return isProjectWorkflowHome(pathname) && Boolean(project)
    case 'research-item':
      return Boolean(project && project.researchItems.length > 0)
    case 'annotation':
      return Boolean(project && project.annotations.length > 0)
    case 'claim':
      return Boolean(project && project.claims.length > 0)
    case 'draft':
      return Boolean(project && project.draftPassages.length > 0)
    case 'review':
      return Boolean(project && pathname === `/projects/${project.id}/review`)
    case 'export':
      return Boolean(project && project.exports.length > 0)
    case 'complete':
      return true
  }
}

function getNextStepId(stepId: TutorialStepId): TutorialStepId {
  const currentIndex = STEP_ORDER.indexOf(stepId)
  return STEP_ORDER[Math.min(currentIndex + 1, STEP_ORDER.length - 1)]
}

export function TutorialOverlay() {
  const location = useLocation()
  const [tutorialState, setTutorialState] = useState<TutorialState>(() => loadTutorialState())
  const [statusMessage, setStatusMessage] = useState('')
  const [, refreshTutorialView] = useState(0)
  const promptRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const shouldShowPrompt = tutorialState.status === 'unseen'
  const isActive = tutorialState.status === 'active'
  const projectId = getKnownProjectId(tutorialState, location.pathname)
  const project = getProjectForTutorial(projectId)
  const currentStep = getStepDefinition(tutorialState.stepId)
  const stepIsComplete = isStepComplete(currentStep.id, location.pathname, project)
  const actionHref = getActionHref(currentStep.id, project?.id ?? projectId)
  const stepIndex = STEP_ORDER.indexOf(currentStep.id) + 1
  const totalSteps = STEP_ORDER.length

  const promptTitleId = 'tutorial-prompt-title'
  const promptDescriptionId = 'tutorial-prompt-description'
  const overlayTitleId = 'tutorial-overlay-title'
  const overlayDescriptionId = 'tutorial-overlay-description'

  const completionText = useMemo(() => {
    if (stepIsComplete) {
      return 'Requirement complete. The next tutorial step is available.'
    }

    return currentStep.requirement
  }, [currentStep.requirement, stepIsComplete])

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const intervalId = window.setInterval(() => refreshTutorialView(value => value + 1), 750)
    return () => window.clearInterval(intervalId)
  }, [isActive])

  useEffect(() => {
    if (!isActive) {
      delete document.documentElement.dataset.tutorialStep
      return
    }

    document.documentElement.dataset.tutorialStep = currentStep.id
    return () => {
      delete document.documentElement.dataset.tutorialStep
    }
  }, [currentStep.id, isActive])

  useEffect(() => {
    const elementToFocus = shouldShowPrompt ? promptRef.current : isActive ? overlayRef.current : null
    elementToFocus?.focus()
  }, [isActive, shouldShowPrompt, currentStep.id])

  const persistState = (state: TutorialState) => {
    setTutorialState(state)
    setStatusMessage('')
  }

  const handleStartTutorial = () => {
    persistState(startTutorial(projectId))
  }

  const handleDismissTutorial = () => {
    persistState(dismissTutorial())
  }

  const handleCompleteTutorial = () => {
    persistState(completeTutorial())
  }

  const handleRestartTutorial = () => {
    persistState(startTutorial(projectId))
  }

  const handleAdvance = () => {
    if (!stepIsComplete) {
      setStatusMessage(currentStep.requirement)
      return
    }

    const nextStepId = getNextStepId(currentStep.id)
    persistState(updateTutorialProgress(nextStepId, project?.id ?? projectId))
  }

  const handleSkipRemaining = () => {
    persistState(
      saveTutorialState({
        ...tutorialState,
        status: 'completed',
        stepId: 'complete',
        projectId: project?.id ?? projectId,
      }),
    )
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      handleDismissTutorial()
    }
  }

  return (
    <>
      {shouldShowPrompt && (
        <div className="tutorial-prompt-backdrop">
          <div
            className="tutorial-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={promptTitleId}
            aria-describedby={promptDescriptionId}
            tabIndex={-1}
            ref={promptRef}
            onKeyDown={handleKeyDown}
          >
            <p className="workflow-card-kicker">Guided tutorial</p>
            <h2 id={promptTitleId}>Would you like to go through the tutorial?</h2>
            <p id={promptDescriptionId}>
              The tutorial walks through the evidence-to-prose cycle one required action at a time.
            </p>
            <div className="tutorial-actions">
              <button type="button" className="workflow-primary-action as-button" onClick={handleStartTutorial}>
                Start tutorial
              </button>
              <button type="button" className="workflow-secondary-action as-button" onClick={handleDismissTutorial}>
                No, continue normally
              </button>
            </div>
          </div>
        </div>
      )}

      {isActive && (
        <aside
          className="tutorial-overlay"
          role="dialog"
          aria-modal="false"
          aria-labelledby={overlayTitleId}
          aria-describedby={overlayDescriptionId}
          tabIndex={-1}
          ref={overlayRef}
          onKeyDown={handleKeyDown}
        >
          <div className="tutorial-overlay-header">
            <span className="workflow-step-status">
              Step {stepIndex} of {totalSteps}
            </span>
            <button type="button" className="tutorial-text-button" onClick={handleDismissTutorial}>
              Exit tutorial
            </button>
          </div>

          <h2 id={overlayTitleId}>{currentStep.title}</h2>
          <p id={overlayDescriptionId}>{currentStep.instruction}</p>
          <p className="tutorial-target-note">
            Current target: <strong>{currentStep.targetLabel}</strong>
          </p>
          <p className={stepIsComplete ? 'tutorial-status is-complete' : 'tutorial-status'} aria-live="polite">
            {completionText}
          </p>
          {statusMessage && (
            <p className="tutorial-status" role="status" aria-live="polite">
              {statusMessage}
            </p>
          )}

          <div className="tutorial-actions">
            {currentStep.actionLabel && currentStep.id !== 'complete' && (
              <Link className="workflow-secondary-action" to={actionHref}>
                {currentStep.actionLabel}
              </Link>
            )}

            {currentStep.id === 'complete' ? (
              <button type="button" className="workflow-primary-action as-button" onClick={handleCompleteTutorial}>
                Finish tutorial
              </button>
            ) : (
              <button
                type="button"
                className="workflow-primary-action as-button"
                onClick={handleAdvance}
                disabled={!stepIsComplete}
                aria-disabled={!stepIsComplete}
              >
                Next tutorial step
              </button>
            )}

            <button type="button" className="workflow-secondary-action as-button" onClick={handleSkipRemaining}>
              Skip remaining tutorial
            </button>
          </div>
        </aside>
      )}

      {!shouldShowPrompt && !isActive && (
        <button type="button" className="tutorial-restart-button" onClick={handleRestartTutorial}>
          Restart tutorial
        </button>
      )}
    </>
  )
}
