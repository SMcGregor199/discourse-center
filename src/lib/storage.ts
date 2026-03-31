import type { JSONContent } from '@tiptap/react'

export const PROJECTS_STORAGE_KEY = 'discourse-center:projects'
export const CURRENT_PROJECT_KEY = 'discourse-center:current-project'
export const IMAGES_STORAGE_KEY = 'discourse-center:images'
export const DEFAULT_PROJECT_TITLE = 'Untitled Document'

export interface Project {
  id: string
  title: string
  content: JSONContent
  createdAt: string
  updatedAt: string
  wordCount: number
  citationStyle: CitationStyle
  sources: Source[]
}

export type CitationStyle = 'mla' | 'apa' | 'chicago' | 'harvard'

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
}

export interface StoredImage {
  id: string
  name: string
  dataUrl: string
  size: number
  type: string
  uploadedAt: string
}

export const DEFAULT_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'This editor auto-saves to local storage.' }],
    },
    {
      type: 'paragraph',
    },
  ],
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

function isProject(value: unknown): value is Project {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'content' in value &&
    'createdAt' in value &&
    'updatedAt' in value &&
    'wordCount' in value
  )
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

    return parsed.filter(isStoredImage)
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
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isProject)
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

export function deleteProject(id: string): void {
  const projects = loadProjects()
  const filtered = projects.filter(project => project.id !== id)
  saveProjects(filtered)
}

export function createProject(title?: string, citationStyle: CitationStyle = 'mla'): Project {
  const now = new Date().toISOString()
  const projectTitle = normalizeProjectTitle(title)
  
  const content: JSONContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Start writing...' }],
      },
    ],
  }

  return {
    id: crypto.randomUUID(),
    title: projectTitle,
    content,
    createdAt: now,
    updatedAt: now,
    wordCount: countWords(content),
    citationStyle,
    sources: [],
  }
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
