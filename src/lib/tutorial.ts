export const TUTORIAL_STORAGE_KEY = 'discourse-center:tutorial'

export type TutorialStatus = 'unseen' | 'active' | 'dismissed' | 'completed'

export type TutorialStepId =
  | 'intro'
  | 'open-project'
  | 'research-item'
  | 'annotation'
  | 'claim'
  | 'draft'
  | 'review'
  | 'export'
  | 'complete'

export interface TutorialState {
  status: TutorialStatus
  stepId: TutorialStepId
  projectId?: string
  updatedAt: string
}

const TUTORIAL_STEPS: TutorialStepId[] = [
  'intro',
  'open-project',
  'research-item',
  'annotation',
  'claim',
  'draft',
  'review',
  'export',
  'complete',
]

const TUTORIAL_STATUSES: TutorialStatus[] = ['unseen', 'active', 'dismissed', 'completed']

function now(): string {
  return new Date().toISOString()
}

function isTutorialStepId(value: unknown): value is TutorialStepId {
  return typeof value === 'string' && TUTORIAL_STEPS.includes(value as TutorialStepId)
}

function isTutorialStatus(value: unknown): value is TutorialStatus {
  return typeof value === 'string' && TUTORIAL_STATUSES.includes(value as TutorialStatus)
}

export function createDefaultTutorialState(): TutorialState {
  return {
    status: 'unseen',
    stepId: 'intro',
    updatedAt: now(),
  }
}

export function normalizeTutorialState(value: unknown): TutorialState {
  if (typeof value !== 'object' || value === null) {
    return createDefaultTutorialState()
  }

  const record = value as Record<string, unknown>

  return {
    status: isTutorialStatus(record.status) ? record.status : 'unseen',
    stepId: isTutorialStepId(record.stepId) ? record.stepId : 'intro',
    projectId: typeof record.projectId === 'string' ? record.projectId : undefined,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : now(),
  }
}

export function loadTutorialState(): TutorialState {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (!raw) {
      return createDefaultTutorialState()
    }

    return normalizeTutorialState(JSON.parse(raw) as unknown)
  } catch {
    return createDefaultTutorialState()
  }
}

export function saveTutorialState(state: TutorialState): TutorialState {
  const normalizedState = normalizeTutorialState({
    ...state,
    updatedAt: now(),
  })

  localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(normalizedState))
  return normalizedState
}

export function startTutorial(projectId?: string): TutorialState {
  return saveTutorialState({
    status: 'active',
    stepId: 'intro',
    projectId,
    updatedAt: now(),
  })
}

export function dismissTutorial(): TutorialState {
  return saveTutorialState({
    ...loadTutorialState(),
    status: 'dismissed',
  })
}

export function completeTutorial(): TutorialState {
  return saveTutorialState({
    ...loadTutorialState(),
    status: 'completed',
    stepId: 'complete',
  })
}

export function updateTutorialProgress(stepId: TutorialStepId, projectId?: string): TutorialState {
  return saveTutorialState({
    ...loadTutorialState(),
    status: 'active',
    stepId,
    projectId,
  })
}
