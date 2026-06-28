import type { JSONContent } from '@tiptap/react'

export const PROJECTS_STORAGE_KEY = 'discourse-center:projects'
export const CURRENT_PROJECT_KEY = 'discourse-center:current-project'
export const IMAGES_STORAGE_KEY = 'discourse-center:images'
export const DEFAULT_PROJECT_TITLE = 'Untitled Document'
export const INITIAL_PROJECT_TITLE = 'Chapter 1'

export interface Project {
  id: string
  title: string
  content: JSONContent
  createdAt: string
  updatedAt: string
  wordCount: number
  citationStyle: CitationStyle
  sources: Source[]
  researchItems: ResearchItem[]
  annotations: Annotation[]
  claims: Claim[]
  draftPassages: DraftPassage[]
  exports: ExportRecord[]
  workflowState: ProjectWorkflowState
}

export type CitationStyle = 'mla' | 'apa' | 'chicago' | 'harvard'

export type WorkflowStep =
  | 'project'
  | 'research-item'
  | 'annotation'
  | 'claim'
  | 'draft'
  | 'review'
  | 'export'

export interface ProjectWorkflowState {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  activeResearchItemId?: string
  activeAnnotationId?: string
  activeClaimId?: string
  activeDraftPassageId?: string
}

export type ResearchItemKind = 'source' | 'image' | 'object' | 'note'

export interface ResearchItem {
  id: string
  projectId: string
  kind: ResearchItemKind
  title: string
  description?: string
  sourceId?: string
  imageId?: string
  url?: string
  locator?: string
  createdAt: string
  updatedAt: string
}

export interface Annotation {
  id: string
  projectId: string
  researchItemId: string
  sourceId?: string
  imageId?: string
  excerpt?: string
  note: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ClaimStatus = 'draft' | 'ready' | 'used'

export interface Claim {
  id: string
  projectId: string
  text: string
  annotationIds: string[]
  sourceIds: string[]
  status: ClaimStatus
  createdAt: string
  updatedAt: string
}

export interface DraftPassage {
  id: string
  projectId: string
  title?: string
  text: string
  claimIds: string[]
  sourceIds: string[]
  citationText?: string
  editorContent?: JSONContent
  createdAt: string
  updatedAt: string
}

export type ExportFormat = 'markdown' | 'html'

export interface ExportRecord {
  id: string
  projectId: string
  draftPassageId: string
  format: ExportFormat
  content: string
  includedBibliography: boolean
  createdAt: string
}

export interface Source {
  id: string
  type: 'book' | 'journal' | 'website' | 'article' | 'other'
  title: string
  author: string
  year: string
  publisher?: string
  url?: string
  journal?: string
  volume?: string
  pages?: string
  doi?: string
  createdAt: string
  updatedAt?: string
}

export type CreateResearchItemInput = Omit<ResearchItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
export type CreateAnnotationInput = Omit<Annotation, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'tags'> & {
  tags?: string[]
}
export type CreateClaimInput = Omit<Claim, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'sourceIds' | 'status'> & {
  sourceIds?: string[]
  status?: ClaimStatus
}
export type CreateDraftPassageInput = Omit<DraftPassage, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
export type CreateExportRecordInput = Omit<ExportRecord, 'id' | 'projectId' | 'createdAt'>

const WORKFLOW_STEPS: WorkflowStep[] = [
  'project',
  'research-item',
  'annotation',
  'claim',
  'draft',
  'review',
  'export',
]

const DEFAULT_WORKFLOW_STATE: ProjectWorkflowState = {
  currentStep: 'project',
  completedSteps: [],
}

export interface StoredImage {
  id: string
  name: string
  dataUrl: string
  size: number
  type: string
  notes: string
  uploadedAt: string
}

export const DEFAULT_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
}

function createDefaultDocument(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  }
}

function isJsonContent(value: unknown): value is JSONContent {
  return typeof value === 'object' && value !== null
}

function isStoredImage(value: unknown): value is StoredImage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'dataUrl' in value &&
    'size' in value &&
    'type' in value &&
    'uploadedAt' in value
  )
}

function isSource(value: unknown): value is Source {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'title' in value &&
    'author' in value &&
    'year' in value &&
    'createdAt' in value
  )
}

function isWorkflowStep(value: unknown): value is WorkflowStep {
  return typeof value === 'string' && WORKFLOW_STEPS.includes(value as WorkflowStep)
}

function normalizeWorkflowState(value: unknown): ProjectWorkflowState {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_WORKFLOW_STATE }
  }

  const record = value as Record<string, unknown>
  const completedSteps = Array.isArray(record.completedSteps)
    ? record.completedSteps.filter(isWorkflowStep)
    : []

  return {
    currentStep: isWorkflowStep(record.currentStep) ? record.currentStep : DEFAULT_WORKFLOW_STATE.currentStep,
    completedSteps,
    activeResearchItemId: typeof record.activeResearchItemId === 'string' ? record.activeResearchItemId : undefined,
    activeAnnotationId: typeof record.activeAnnotationId === 'string' ? record.activeAnnotationId : undefined,
    activeClaimId: typeof record.activeClaimId === 'string' ? record.activeClaimId : undefined,
    activeDraftPassageId: typeof record.activeDraftPassageId === 'string' ? record.activeDraftPassageId : undefined,
  }
}

function isResearchItem(value: unknown): value is ResearchItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'projectId' in value &&
    'kind' in value &&
    'title' in value &&
    'createdAt' in value &&
    'updatedAt' in value
  )
}

function isAnnotation(value: unknown): value is Annotation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'projectId' in value &&
    'researchItemId' in value &&
    'note' in value &&
    'createdAt' in value &&
    'updatedAt' in value
  )
}

function normalizeAnnotation(value: Annotation): Annotation {
  return {
    ...value,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [],
  }
}

function isClaim(value: unknown): value is Claim {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'projectId' in value &&
    'text' in value &&
    'annotationIds' in value &&
    'sourceIds' in value &&
    'status' in value &&
    'createdAt' in value &&
    'updatedAt' in value
  )
}

function normalizeClaim(value: Claim): Claim {
  return {
    ...value,
    annotationIds: Array.isArray(value.annotationIds)
      ? value.annotationIds.filter((id): id is string => typeof id === 'string')
      : [],
    sourceIds: Array.isArray(value.sourceIds)
      ? value.sourceIds.filter((id): id is string => typeof id === 'string')
      : [],
    status: ['draft', 'ready', 'used'].includes(value.status) ? value.status : 'draft',
  }
}

function isDraftPassage(value: unknown): value is DraftPassage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'projectId' in value &&
    'text' in value &&
    'claimIds' in value &&
    'sourceIds' in value &&
    'createdAt' in value &&
    'updatedAt' in value
  )
}

function normalizeDraftPassage(value: DraftPassage): DraftPassage {
  return {
    ...value,
    claimIds: Array.isArray(value.claimIds)
      ? value.claimIds.filter((id): id is string => typeof id === 'string')
      : [],
    sourceIds: Array.isArray(value.sourceIds)
      ? value.sourceIds.filter((id): id is string => typeof id === 'string')
      : [],
  }
}

function isExportRecord(value: unknown): value is ExportRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'projectId' in value &&
    'draftPassageId' in value &&
    'format' in value &&
    'content' in value &&
    'includedBibliography' in value &&
    'createdAt' in value
  )
}

function normalizeExportRecord(value: ExportRecord): ExportRecord {
  return {
    ...value,
    format: value.format === 'html' ? 'html' : 'markdown',
    includedBibliography: Boolean(value.includedBibliography),
  }
}

function normalizeStoredImage(value: StoredImage): StoredImage {
  return {
    ...value,
    notes: typeof value.notes === 'string' ? value.notes : '',
  }
}

function isProjectLike(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'content' in value &&
    'createdAt' in value &&
    'updatedAt' in value
  )
}

export function createDefaultWorkflowState(): ProjectWorkflowState {
  return { ...DEFAULT_WORKFLOW_STATE, completedSteps: [...DEFAULT_WORKFLOW_STATE.completedSteps] }
}

export function normalizeProject(value: unknown): Project | null {
  if (!isProjectLike(value)) {
    return null
  }

  const content = isJsonContent(value.content) ? value.content : createDefaultDocument()
  const citationStyle = isCitationStyle(value.citationStyle) ? value.citationStyle : 'mla'

  return {
    id: String(value.id),
    title: normalizeProjectTitle(String(value.title)),
    content,
    createdAt: String(value.createdAt),
    updatedAt: String(value.updatedAt),
    wordCount: typeof value.wordCount === 'number' ? value.wordCount : countWords(content),
    citationStyle,
    sources: Array.isArray(value.sources) ? value.sources.filter(isSource) : [],
    researchItems: Array.isArray(value.researchItems) ? value.researchItems.filter(isResearchItem) : [],
    annotations: Array.isArray(value.annotations)
      ? value.annotations.filter(isAnnotation).map(normalizeAnnotation)
      : [],
    claims: Array.isArray(value.claims) ? value.claims.filter(isClaim).map(normalizeClaim) : [],
    draftPassages: Array.isArray(value.draftPassages)
      ? value.draftPassages.filter(isDraftPassage).map(normalizeDraftPassage)
      : [],
    exports: Array.isArray(value.exports) ? value.exports.filter(isExportRecord).map(normalizeExportRecord) : [],
    workflowState: normalizeWorkflowState(value.workflowState),
  }
}

function isCitationStyle(value: unknown): value is CitationStyle {
  return value === 'mla' || value === 'apa' || value === 'chicago' || value === 'harvard'
}

function withCompletedSteps(workflowState: ProjectWorkflowState, steps: WorkflowStep[]): ProjectWorkflowState {
  return {
    ...workflowState,
    completedSteps: Array.from(new Set([...workflowState.completedSteps, ...steps])),
  }
}

export function loadImages(): StoredImage[] {
  try {
    const raw = localStorage.getItem(IMAGES_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isStoredImage).map(normalizeStoredImage)
  } catch {
    return []
  }
}

export function saveImages(images: StoredImage[]): void {
  localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(images))
}

export function loadImage(id: string): StoredImage | null {
  const images = loadImages()
  return images.find(image => image.id === id) || null
}

export function saveImage(image: StoredImage): void {
  const images = loadImages()
  const existingIndex = images.findIndex(img => img.id === image.id)
  
  if (existingIndex >= 0) {
    images[existingIndex] = image
  } else {
    images.push(image)
  }
  
  saveImages(images)
}

export function updateImage(id: string, updates: Partial<StoredImage>): StoredImage | null {
  const images = loadImages()
  const existingIndex = images.findIndex(image => image.id === id)

  if (existingIndex === -1) {
    return null
  }

  const updatedImage: StoredImage = {
    ...images[existingIndex],
    ...updates,
    notes: typeof updates.notes === 'string' ? updates.notes : images[existingIndex].notes,
  }

  images[existingIndex] = updatedImage
  saveImages(images)
  return updatedImage
}

export function deleteImage(id: string): void {
  const images = loadImages()
  const filtered = images.filter(image => image.id !== id)
  saveImages(filtered)
}

export async function uploadImage(file: File): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const dataUrl = event.target?.result as string
        const image: StoredImage = {
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          size: file.size,
          type: file.type,
          notes: '',
          uploadedAt: new Date().toISOString(),
        }
        
        saveImage(image)
        resolve(image)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function normalizeProjectTitle(title?: string): string {
  const trimmedTitle = title?.trim()
  return trimmedTitle && trimmedTitle.length > 0 ? trimmedTitle : DEFAULT_PROJECT_TITLE
}

// Citation formatting functions
export function formatInTextCitation(source: Source, citationStyle: CitationStyle): string {
  switch (citationStyle) {
    case 'mla':
      return `(${source.author.split(' ').pop() || 'Unknown'} ${source.year})`
    case 'apa':
      return `(${source.author.split(' ').pop() || 'Unknown'}, ${source.year})`
    case 'chicago':
      return `${source.author} (${source.year})`
    case 'harvard':
      return `(${source.author} ${source.year})`
    default:
      return `(${source.author} ${source.year})`
  }
}

export function formatWorksCitedEntry(source: Source, citationStyle: CitationStyle): string {
  switch (citationStyle) {
    case 'mla':
      return formatMLAEntry(source)
    case 'apa':
      return formatAPAEntry(source)
    case 'chicago':
      return formatChicagoEntry(source)
    case 'harvard':
      return formatHarvardEntry(source)
    default:
      return formatMLAEntry(source)
  }
}

function formatMLAEntry(source: Source): string {
  let entry = `${source.author}. "${source.title}."`
  
  switch (source.type) {
    case 'book':
      if (source.publisher) entry += ` ${source.publisher},`
      entry += ` ${source.year}.`
      break
    case 'journal':
      if (source.journal) entry += ` ${source.journal}`
      if (source.volume) entry += `, vol. ${source.volume}`
      if (source.pages) entry += `, pp. ${source.pages}`
      entry += `, ${source.year}.`
      break
    case 'website':
      if (source.publisher) entry += ` ${source.publisher},`
      entry += ` ${source.year},`
      if (source.url) entry += ` ${source.url}.`
      break
    default:
      if (source.publisher) entry += ` ${source.publisher},`
      entry += ` ${source.year}.`
  }
  
  return entry
}

function formatAPAEntry(source: Source): string {
  let entry = `${source.author} (${source.year}). ${source.title}.`
  
  switch (source.type) {
    case 'book':
      if (source.publisher) entry += ` ${source.publisher}.`
      break
    case 'journal':
      if (source.journal) entry += ` ${source.journal}`
      if (source.volume) entry += `, ${source.volume}`
      if (source.pages) entry += `, ${source.pages}.`
      break
    case 'website':
      if (source.url) entry += ` Retrieved from ${source.url}.`
      break
    default:
      if (source.publisher) entry += ` ${source.publisher}.`
  }
  
  return entry
}

function formatChicagoEntry(source: Source): string {
  let entry = `${source.author}. "${source.title}."`
  
  switch (source.type) {
    case 'book':
      if (source.publisher) entry += ` ${source.publisher}:`
      entry += ` ${source.year}.`
      break
    case 'journal':
      if (source.journal) entry += ` ${source.journal}`
      if (source.volume) entry += ` ${source.volume}`
      if (source.pages) entry += ` (${source.year}): ${source.pages}.`
      break
    case 'website':
      if (source.url) entry += ` Last modified ${source.year}. ${source.url}.`
      break
    default:
      if (source.publisher) entry += ` ${source.publisher},`
      entry += ` ${source.year}.`
  }
  
  return entry
}

function formatHarvardEntry(source: Source): string {
  let entry = `${source.author} (${source.year}) '${source.title}',`
  
  switch (source.type) {
    case 'book':
      if (source.publisher) entry += ` ${source.publisher}.`
      break
    case 'journal':
      if (source.journal) entry += ` ${source.journal}`
      if (source.volume) entry += `, ${source.volume}`
      if (source.pages) entry += `, pp. ${source.pages}.`
      break
    case 'website':
      if (source.url) entry += ` Available at: ${source.url} (Accessed: ${new Date().toLocaleDateString()}).`
      break
    default:
      if (source.publisher) entry += ` ${source.publisher}.`
  }
  
  return entry
}

// Source management functions
export function addSource(projectId: string, source: Omit<Source, 'id' | 'createdAt'>): void {
  const project = loadProject(projectId)
  if (!project) return
  
  const newSource: Source = {
    ...source,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  
  project.sources.push(newSource)
  project.updatedAt = new Date().toISOString()
  saveProject(project)
}

export function removeSource(projectId: string, sourceId: string): void {
  const project = loadProject(projectId)
  if (!project) return
  
  project.sources = project.sources.filter(source => source.id !== sourceId)
  project.updatedAt = new Date().toISOString()
  saveProject(project)
}

export function updateSource(projectId: string, sourceId: string, updates: Partial<Source>): void {
  const project = loadProject(projectId)
  if (!project) return
  
  const sourceIndex = project.sources.findIndex(source => source.id === sourceId)
  if (sourceIndex === -1) return
  
  project.sources[sourceIndex] = {
    ...project.sources[sourceIndex],
    ...updates,
  }
  project.updatedAt = new Date().toISOString()
  saveProject(project)
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) {
      const initialProject = createInitialProject()
      saveProjects([initialProject])
      return [initialProject]
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    const projects = parsed
      .map(normalizeProject)
      .filter((project): project is Project => project !== null)

    if (JSON.stringify(parsed) !== JSON.stringify(projects)) {
      saveProjects(projects)
    }

    return projects
  } catch {
    return []
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
}

export function loadProject(id: string): Project | null {
  const projects = loadProjects()
  return projects.find(project => project.id === id) || null
}

export function saveProject(project: Project): void {
  const projects = loadProjects()
  const existingIndex = projects.findIndex(p => p.id === project.id)
  
  if (existingIndex >= 0) {
    projects[existingIndex] = project
  } else {
    projects.push(project)
  }
  
  saveProjects(projects)
}

export function createResearchItem(
  projectId: string,
  input: CreateResearchItemInput,
): ResearchItem | null {
  const project = loadProject(projectId)
  if (!project) return null

  const now = new Date().toISOString()
  const researchItem: ResearchItem = {
    ...input,
    id: crypto.randomUUID(),
    projectId,
    title: normalizeProjectTitle(input.title),
    createdAt: now,
    updatedAt: now,
  }

  const updatedProject: Project = {
    ...project,
    researchItems: [...project.researchItems, researchItem],
    updatedAt: now,
    workflowState: {
      ...withCompletedSteps(project.workflowState, ['project', 'research-item']),
      currentStep: 'annotation',
      activeResearchItemId: researchItem.id,
    },
  }

  saveProject(updatedProject)
  return researchItem
}

export function updateResearchItem(
  projectId: string,
  researchItemId: string,
  updates: Partial<Omit<ResearchItem, 'id' | 'projectId' | 'createdAt'>>,
): ResearchItem | null {
  const project = loadProject(projectId)
  if (!project) return null

  const existingResearchItem = project.researchItems.find(item => item.id === researchItemId)
  if (!existingResearchItem) return null

  const now = new Date().toISOString()
  const updatedResearchItem: ResearchItem = {
    ...existingResearchItem,
    ...updates,
    title: typeof updates.title === 'string' ? normalizeProjectTitle(updates.title) : existingResearchItem.title,
    updatedAt: now,
  }

  saveProject({
    ...project,
    researchItems: project.researchItems.map(item =>
      item.id === researchItemId ? updatedResearchItem : item,
    ),
    updatedAt: now,
  })

  return updatedResearchItem
}

export function createAnnotation(
  projectId: string,
  input: CreateAnnotationInput,
): Annotation | null {
  const project = loadProject(projectId)
  if (!project) return null

  const researchItem = project.researchItems.find(item => item.id === input.researchItemId)
  if (!researchItem) return null

  const now = new Date().toISOString()
  const annotation: Annotation = {
    ...input,
    id: crypto.randomUUID(),
    projectId,
    sourceId: input.sourceId ?? researchItem.sourceId,
    imageId: input.imageId ?? researchItem.imageId,
    note: input.note.trim(),
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }

  const updatedProject: Project = {
    ...project,
    annotations: [...project.annotations, annotation],
    updatedAt: now,
    workflowState: {
      ...withCompletedSteps(project.workflowState, ['project', 'research-item', 'annotation']),
      currentStep: 'claim',
      activeResearchItemId: researchItem.id,
      activeAnnotationId: annotation.id,
    },
  }

  saveProject(updatedProject)
  return annotation
}

export function createClaim(
  projectId: string,
  input: CreateClaimInput,
): Claim | null {
  const project = loadProject(projectId)
  if (!project) return null

  const linkedAnnotations = project.annotations.filter(annotation =>
    input.annotationIds.includes(annotation.id),
  )

  if (linkedAnnotations.length === 0) return null

  const inferredSourceIds = linkedAnnotations
    .map(annotation => annotation.sourceId)
    .filter((sourceId): sourceId is string => typeof sourceId === 'string')
  const sourceIds = input.sourceIds ?? Array.from(new Set(inferredSourceIds))
  const now = new Date().toISOString()
  const claim: Claim = {
    ...input,
    id: crypto.randomUUID(),
    projectId,
    text: input.text.trim(),
    sourceIds,
    status: input.status ?? 'draft',
    createdAt: now,
    updatedAt: now,
  }

  const updatedProject: Project = {
    ...project,
    claims: [...project.claims, claim],
    updatedAt: now,
    workflowState: {
      ...withCompletedSteps(project.workflowState, ['project', 'research-item', 'annotation', 'claim']),
      currentStep: 'draft',
      activeAnnotationId: claim.annotationIds[0],
      activeClaimId: claim.id,
    },
  }

  saveProject(updatedProject)
  return claim
}

export function createDraftPassage(
  projectId: string,
  input: CreateDraftPassageInput,
): DraftPassage | null {
  const project = loadProject(projectId)
  if (!project) return null

  const linkedClaims = project.claims.filter(claim => input.claimIds.includes(claim.id))
  if (linkedClaims.length === 0) return null

  const inferredSourceIds = linkedClaims.flatMap(claim => claim.sourceIds)
  const sourceIds = input.sourceIds.length > 0 ? input.sourceIds : Array.from(new Set(inferredSourceIds))
  const now = new Date().toISOString()
  const draftPassage: DraftPassage = {
    ...input,
    id: crypto.randomUUID(),
    projectId,
    text: input.text.trim(),
    sourceIds,
    createdAt: now,
    updatedAt: now,
  }

  const updatedProject: Project = {
    ...project,
    draftPassages: [...project.draftPassages, draftPassage],
    updatedAt: now,
    workflowState: {
      ...withCompletedSteps(project.workflowState, ['project', 'research-item', 'annotation', 'claim', 'draft']),
      currentStep: 'review',
      activeClaimId: draftPassage.claimIds[0],
      activeDraftPassageId: draftPassage.id,
    },
  }

  saveProject(updatedProject)
  return draftPassage
}

export function createExportRecord(
  projectId: string,
  input: CreateExportRecordInput,
): ExportRecord | null {
  const project = loadProject(projectId)
  if (!project) return null

  const draftPassage = project.draftPassages.find(passage => passage.id === input.draftPassageId)
  if (!draftPassage) return null

  const now = new Date().toISOString()
  const exportRecord: ExportRecord = {
    ...input,
    id: crypto.randomUUID(),
    projectId,
    createdAt: now,
  }

  const updatedProject: Project = {
    ...project,
    exports: [...project.exports, exportRecord],
    updatedAt: now,
    workflowState: {
      ...withCompletedSteps(project.workflowState, [
        'project',
        'research-item',
        'annotation',
        'claim',
        'draft',
        'review',
        'export',
      ]),
      currentStep: 'export',
      activeDraftPassageId: draftPassage.id,
    },
  }

  saveProject(updatedProject)
  return exportRecord
}

export function deleteProject(id: string): void {
  const projects = loadProjects()
  const filtered = projects.filter(project => project.id !== id)
  saveProjects(filtered)
}

export function createProject(title?: string, citationStyle: CitationStyle = 'mla'): Project {
  const now = new Date().toISOString()
  const projectTitle = normalizeProjectTitle(title)
  const content = createDefaultDocument()

  return {
    id: crypto.randomUUID(),
    title: projectTitle,
    content,
    createdAt: now,
    updatedAt: now,
    wordCount: countWords(content),
    citationStyle,
    sources: [],
    researchItems: [],
    annotations: [],
    claims: [],
    draftPassages: [],
    exports: [],
    workflowState: createDefaultWorkflowState(),
  }
}

function createInitialProject(): Project {
  return createProject(INITIAL_PROJECT_TITLE)
}

export function getCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_PROJECT_KEY)
}

export function setCurrentProjectId(id: string): void {
  localStorage.setItem(CURRENT_PROJECT_KEY, id)
}

export function countWords(content: JSONContent): number {
  let count = 0
  
  function countInNode(node: { type?: string; text?: string; content?: unknown[] }): void {
    if (node.type === 'text' && node.text) {
      count += node.text.split(/\s+/).filter((word: string) => word.length > 0).length
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: unknown) => {
        if (typeof child === 'object' && child !== null) {
          countInNode(child as { type?: string; text?: string; content?: unknown[] })
        }
      })
    }
  }
  
  if (content.content) {
    content.content.forEach((child: unknown) => {
      if (typeof child === 'object' && child !== null) {
        countInNode(child as { type?: string; text?: string; content?: unknown[] })
      }
    })
  }
  
  return count
}

// Legacy functions for backward compatibility
export function loadEditorContent(): JSONContent | null {
  const currentId = getCurrentProjectId()
  if (currentId) {
    const project = loadProject(currentId)
    return project?.content || null
  }
  
  // Try to load old single document format
  try {
    const raw = localStorage.getItem('discourse-center:tiptap-document')
    if (!raw) return null
    
    const parsed = JSON.parse(raw) as unknown
    return isJsonContent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveEditorContent(content: JSONContent): void {
  const currentId = getCurrentProjectId()
  if (currentId) {
    const project = loadProject(currentId)
    if (project) {
      project.content = content
      project.updatedAt = new Date().toISOString()
      project.wordCount = countWords(content)
      saveProject(project)
    }
  }
}

export function clearEditorContent(): void {
  const currentId = getCurrentProjectId()
  if (currentId) {
    deleteProject(currentId)
    localStorage.removeItem(CURRENT_PROJECT_KEY)
  }
}
