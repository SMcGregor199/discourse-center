import { beforeEach, describe, expect, test } from 'vitest'
import {
  PROJECTS_STORAGE_KEY,
  addSource,
  createAnnotation,
  createClaim,
  createDefaultWorkflowState,
  createDraftPassage,
  createExportRecord,
  createProject,
  createResearchItem,
  loadProject,
  loadProjects,
  saveProject,
  saveProjects,
} from '../src/lib/storage'

const LEGACY_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Legacy draft text' }],
    },
  ],
}

beforeEach(() => {
  localStorage.clear()
})

describe('storage workflow model migration', () => {
  test('normalizes old projects without workflow fields', () => {
    const legacyProject = {
      id: 'legacy-project',
      title: 'Legacy Project',
      content: LEGACY_CONTENT,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      wordCount: 3,
      citationStyle: 'apa',
      sources: [
        {
          id: 'source-1',
          type: 'book',
          title: 'Legacy Source',
          author: 'Ada Scholar',
          year: '2025',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    }

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([legacyProject]))

    const project = loadProject('legacy-project')

    expect(project).toMatchObject({
      id: 'legacy-project',
      title: 'Legacy Project',
      content: LEGACY_CONTENT,
      wordCount: 3,
      citationStyle: 'apa',
      sources: legacyProject.sources,
      researchItems: [],
      annotations: [],
      claims: [],
      draftPassages: [],
      exports: [],
      workflowState: createDefaultWorkflowState(),
    })

    const persistedProjects = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]')
    expect(persistedProjects[0].workflowState).toEqual(createDefaultWorkflowState())
  })

  test('creates projects with default workflow state', () => {
    const project = createProject('Workflow Project')

    expect(project.researchItems).toEqual([])
    expect(project.annotations).toEqual([])
    expect(project.claims).toEqual([])
    expect(project.draftPassages).toEqual([])
    expect(project.exports).toEqual([])
    expect(project.workflowState).toEqual(createDefaultWorkflowState())
  })

  test('preserves existing project and source behavior when loading', () => {
    const project = createProject('Source Project', 'chicago')
    saveProject(project)

    addSource(project.id, {
      type: 'journal',
      title: 'Evidence and Argument',
      author: 'Rina Researcher',
      year: '2024',
      journal: 'Academic Workflows',
      volume: '12',
      pages: '45-67',
    })

    const loadedProject = loadProject(project.id)

    expect(loadedProject?.title).toBe('Source Project')
    expect(loadedProject?.citationStyle).toBe('chicago')
    expect(loadedProject?.content).toEqual(project.content)
    expect(loadedProject?.sources).toHaveLength(1)
    expect(loadedProject?.sources[0]).toMatchObject({
      type: 'journal',
      title: 'Evidence and Argument',
      author: 'Rina Researcher',
      year: '2024',
    })
    expect(loadedProject?.researchItems).toEqual([])
  })
})

describe('workflow artifact storage helpers', () => {
  test('creates and stores a research item', () => {
    const project = createProject('Research Item Project')
    saveProject(project)

    const researchItem = createResearchItem(project.id, {
      kind: 'source',
      title: 'Archive Note',
      description: 'A note from the archive',
      sourceId: 'source-1',
      locator: 'Box 2, Folder 4',
    })

    const loadedProject = loadProject(project.id)

    expect(researchItem).toMatchObject({
      projectId: project.id,
      kind: 'source',
      title: 'Archive Note',
      sourceId: 'source-1',
      locator: 'Box 2, Folder 4',
    })
    expect(loadedProject?.researchItems).toEqual([researchItem])
    expect(loadedProject?.workflowState.currentStep).toBe('annotation')
    expect(loadedProject?.workflowState.activeResearchItemId).toBe(researchItem?.id)
  })

  test('creates and stores an annotation linked to a research item', () => {
    const project = createProject('Annotation Project')
    saveProject(project)
    const researchItem = createResearchItem(project.id, {
      kind: 'source',
      title: 'Primary Source',
      sourceId: 'source-1',
    })
    if (!researchItem) throw new Error('Expected research item to be created')

    const annotation = createAnnotation(project.id, {
      researchItemId: researchItem.id,
      note: 'This source shows the transition from notes to argument.',
      excerpt: 'notes to argument',
      tags: ['method'],
    })

    const loadedProject = loadProject(project.id)

    expect(annotation).toMatchObject({
      projectId: project.id,
      researchItemId: researchItem.id,
      sourceId: 'source-1',
      note: 'This source shows the transition from notes to argument.',
      excerpt: 'notes to argument',
      tags: ['method'],
    })
    expect(loadedProject?.annotations).toEqual([annotation])
    expect(loadedProject?.workflowState.currentStep).toBe('claim')
    expect(loadedProject?.workflowState.activeAnnotationId).toBe(annotation?.id)
  })

  test('creates and stores a claim linked to an annotation', () => {
    const project = createProject('Claim Project')
    saveProject(project)
    const researchItem = createResearchItem(project.id, {
      kind: 'source',
      title: 'Primary Source',
      sourceId: 'source-1',
    })
    if (!researchItem) throw new Error('Expected research item to be created')
    const annotation = createAnnotation(project.id, {
      researchItemId: researchItem.id,
      note: 'The source identifies workflow fragmentation.',
    })
    if (!annotation) throw new Error('Expected annotation to be created')

    const claim = createClaim(project.id, {
      text: 'Academic workflows fragment evidence from prose.',
      annotationIds: [annotation.id],
    })

    const loadedProject = loadProject(project.id)

    expect(claim).toMatchObject({
      projectId: project.id,
      text: 'Academic workflows fragment evidence from prose.',
      annotationIds: [annotation.id],
      sourceIds: ['source-1'],
      status: 'draft',
    })
    expect(loadedProject?.claims).toEqual([claim])
    expect(loadedProject?.workflowState.currentStep).toBe('draft')
    expect(loadedProject?.workflowState.activeClaimId).toBe(claim?.id)
  })

  test('creates and stores a draft passage linked to a claim and source', () => {
    const project = createProject('Draft Project')
    saveProject(project)
    const researchItem = createResearchItem(project.id, {
      kind: 'source',
      title: 'Primary Source',
      sourceId: 'source-1',
    })
    if (!researchItem) throw new Error('Expected research item to be created')
    const annotation = createAnnotation(project.id, {
      researchItemId: researchItem.id,
      note: 'Evidence requires visible provenance.',
    })
    if (!annotation) throw new Error('Expected annotation to be created')
    const claim = createClaim(project.id, {
      text: 'Traceability strengthens academic drafting.',
      annotationIds: [annotation.id],
    })
    if (!claim) throw new Error('Expected claim to be created')

    const draftPassage = createDraftPassage(project.id, {
      title: 'Traceability paragraph',
      text: 'Traceability strengthens academic drafting by keeping evidence visible.',
      claimIds: [claim.id],
      sourceIds: ['source-1'],
      citationText: '(Scholar 2026)',
    })

    const loadedProject = loadProject(project.id)

    expect(draftPassage).toMatchObject({
      projectId: project.id,
      title: 'Traceability paragraph',
      text: 'Traceability strengthens academic drafting by keeping evidence visible.',
      claimIds: [claim.id],
      sourceIds: ['source-1'],
      citationText: '(Scholar 2026)',
    })
    expect(loadedProject?.draftPassages).toEqual([draftPassage])
    expect(loadedProject?.workflowState.currentStep).toBe('review')
    expect(loadedProject?.workflowState.activeDraftPassageId).toBe(draftPassage?.id)
  })

  test('creates and stores an export record', () => {
    const project = createProject('Export Project')
    saveProject(project)
    const researchItem = createResearchItem(project.id, {
      kind: 'source',
      title: 'Primary Source',
      sourceId: 'source-1',
    })
    if (!researchItem) throw new Error('Expected research item to be created')
    const annotation = createAnnotation(project.id, {
      researchItemId: researchItem.id,
      note: 'Exports should preserve cited output.',
    })
    if (!annotation) throw new Error('Expected annotation to be created')
    const claim = createClaim(project.id, {
      text: 'Exported prose should remain tied to evidence.',
      annotationIds: [annotation.id],
    })
    if (!claim) throw new Error('Expected claim to be created')
    const draftPassage = createDraftPassage(project.id, {
      text: 'Exported prose should remain tied to evidence (Scholar 2026).',
      claimIds: [claim.id],
      sourceIds: ['source-1'],
    })
    if (!draftPassage) throw new Error('Expected draft passage to be created')

    const exportRecord = createExportRecord(project.id, {
      draftPassageId: draftPassage.id,
      format: 'markdown',
      content: 'Exported prose should remain tied to evidence (Scholar 2026).',
      includedBibliography: true,
    })

    const loadedProject = loadProject(project.id)

    expect(exportRecord).toMatchObject({
      projectId: project.id,
      draftPassageId: draftPassage.id,
      format: 'markdown',
      content: 'Exported prose should remain tied to evidence (Scholar 2026).',
      includedBibliography: true,
    })
    expect(loadedProject?.exports).toEqual([exportRecord])
    expect(loadedProject?.workflowState.currentStep).toBe('export')
    expect(loadedProject?.workflowState.completedSteps).toEqual([
      'project',
      'research-item',
      'annotation',
      'claim',
      'draft',
      'review',
      'export',
    ])
  })

  test('loadProjects keeps stored workflow artifacts', () => {
    const project = createProject('Stored Workflow Project')
    saveProject(project)
    const researchItem = createResearchItem(project.id, {
      kind: 'note',
      title: 'Standalone Note',
    })

    const projects = loadProjects()

    expect(projects.find(candidate => candidate.id === project.id)?.researchItems).toEqual([researchItem])
  })

  test('loadProjects removes the empty legacy Chapter 1 seed project', () => {
    const seededProject = createProject('Chapter 1')
    const userProject = createProject('User Project')
    saveProjects([seededProject, userProject])

    const projects = loadProjects()

    expect(projects).toHaveLength(1)
    expect(projects[0].title).toBe('User Project')
    expect(JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]')).toHaveLength(1)
  })
})
