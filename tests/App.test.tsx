import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, test, expect, vi } from 'vitest'
import App from '../src/App'
import {
  PROJECTS_STORAGE_KEY,
  createAnnotation,
  createClaim,
  createDraftPassage,
  createExportRecord,
  createProject,
  createResearchItem,
  loadProject,
  saveProject,
} from '../src/lib/storage'

beforeEach(() => {
  localStorage.clear()
  window.history.pushState({}, '', '/')
})

function createAnnotatedProject(title = 'Annotated Project') {
  const project = createProject(title)
  const source = {
    id: 'source-archival-method',
    type: 'book' as const,
    title: 'Archival Method',
    author: 'Jordan Smith',
    year: '2023',
    publisher: 'Example Press',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
  saveProject({
    ...project,
    sources: [source],
  })

  const researchItem = createResearchItem(project.id, {
    title: 'Archive memo',
    kind: 'source',
    description: 'Memo from the archive collection.',
    sourceId: source.id,
    locator: 'p. 4',
  })

  if (!researchItem) {
    throw new Error('Could not create test research item')
  }

  const annotation = createAnnotation(project.id, {
    researchItemId: researchItem.id,
    note: 'The memo shows researchers treating method as an interpretive practice.',
    excerpt: 'method as interpretation',
    tags: ['method'],
  })

  if (!annotation) {
    throw new Error('Could not create test annotation')
  }

  return {
    project: loadProject(project.id) ?? project,
    source,
    researchItem,
    annotation,
  }
}

function createDraftedProject(title = 'Drafted Project') {
  const { project, annotation, source, researchItem } = createAnnotatedProject(title)
  const claim = createClaim(project.id, {
    annotationIds: [annotation.id],
    text: 'Archival method is interpretive.',
  })

  if (!claim) {
    throw new Error('Could not create test claim')
  }

  const draftPassage = createDraftPassage(project.id, {
    title: 'Interpretive method paragraph',
    text: 'Archival method should be understood as interpretive practice grounded in situated evidence.',
    claimIds: [claim.id],
    sourceIds: [source.id],
    citationText: '(Smith 2023)',
  })

  if (!draftPassage) {
    throw new Error('Could not create test draft passage')
  }

  return {
    project: loadProject(project.id) ?? project,
    source,
    researchItem,
    annotation,
    claim,
    draftPassage,
  }
}

test('renders dashboard projects', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: /your projects/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /images/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument()
})

test('renames a project from the dashboard', async () => {
  const user = userEvent.setup()
  const project = createProject('Draft Title')
  saveProject(project)

  render(<App />)

  await user.click(screen.getByRole('button', { name: /rename draft title/i }))

  const titleInput = screen.getByRole('textbox', { name: /project title/i })
  await user.clear(titleInput)
  await user.type(titleInput, 'Renamed Project')
  await user.click(screen.getByRole('button', { name: /^save$/i }))

  expect(screen.getByRole('heading', { name: /renamed project/i })).toBeInTheDocument()
  expect(loadProject(project.id)?.title).toBe('Renamed Project')
})

test('opens the workflow home from the dashboard project card', async () => {
  const user = userEvent.setup()
  const project = createProject('Workflow Navigation Project')
  saveProject(project)

  render(<App />)

  await user.click(screen.getByRole('heading', { name: /workflow navigation project/i }))

  expect(await screen.findByText(/guided evidence-to-prose workflow/i)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /workflow navigation project/i })).toBeInTheDocument()
})

test('renders workflow home for an existing project', () => {
  const project = createProject('Workflow Home Project', 'apa')
  saveProject(project)
  window.history.pushState({}, '', `/projects/${project.id}`)

  render(<App />)

  expect(screen.getByRole('heading', { name: /workflow home project/i })).toBeInTheDocument()
  expect(screen.getByText(/APA citations/i)).toBeInTheDocument()
  expect(screen.getByText(/0 words/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /open editor/i })).toHaveAttribute('href', `/editor/${project.id}`)
  expect(screen.getByRole('link', { name: /open image repository/i })).toHaveAttribute('href', '/images')
  expect(screen.getByRole('link', { name: /open citations library/i })).toHaveAttribute('href', '/citations')
})

test('workflow progress displays the current step', () => {
  const project = {
    ...createProject('Current Step Project'),
    workflowState: {
      currentStep: 'research-item' as const,
      completedSteps: ['project' as const],
    },
  }
  saveProject(project)
  window.history.pushState({}, '', `/projects/${project.id}`)

  render(<App />)

  const statusPanel = screen.getByLabelText(/project status/i)
  expect(within(statusPanel).getByText(/research item/i)).toBeInTheDocument()
  expect(screen.getByText(/next: add a research item/i)).toBeInTheDocument()

  const workflowProgress = screen.getByRole('heading', { name: /workflow progress/i }).closest('section')
  expect(workflowProgress).not.toBeNull()
  const currentStep = within(workflowProgress as HTMLElement).getByText('Research Item').closest('li')
  expect(currentStep).not.toBeNull()
  expect(within(currentStep as HTMLElement).getByText(/current/i)).toBeInTheDocument()
})

test('workflow progress displays completed steps', () => {
  const project = {
    ...createProject('Completed Steps Project'),
    workflowState: {
      currentStep: 'annotation' as const,
      completedSteps: ['project' as const, 'research-item' as const],
    },
  }
  saveProject(project)
  window.history.pushState({}, '', `/projects/${project.id}`)

  render(<App />)

  const workflowProgress = screen.getByRole('heading', { name: /workflow progress/i }).closest('section')
  expect(workflowProgress).not.toBeNull()
  const projectSetupStep = within(workflowProgress as HTMLElement).getByText('Project Setup').closest('li')
  const researchItemStep = within(workflowProgress as HTMLElement).getByText('Research Item').closest('li')
  const annotationStep = within(workflowProgress as HTMLElement).getByText('Annotation').closest('li')

  expect(projectSetupStep).not.toBeNull()
  expect(researchItemStep).not.toBeNull()
  expect(annotationStep).not.toBeNull()
  expect(within(projectSetupStep as HTMLElement).getByText(/complete/i)).toBeInTheDocument()
  expect(within(researchItemStep as HTMLElement).getByText(/complete/i)).toBeInTheDocument()
  expect(within(annotationStep as HTMLElement).getByText(/current/i)).toBeInTheDocument()
})

test('updates a project title from inside the editor', async () => {
  const user = userEvent.setup()
  const project = createProject('Initial Title')
  saveProject(project)
  window.history.pushState({}, '', `/editor/${project.id}`)

  render(<App />)

  expect(screen.getByRole('button', { name: /mock ai research assistant/i })).toBeInTheDocument()

  const titleInput = screen.getByRole('textbox', { name: /document title/i })
  await user.clear(titleInput)
  await user.type(titleInput, 'Editor Renamed Title')

  await waitFor(() => {
    expect(loadProject(project.id)?.title).toBe('Editor Renamed Title')
  })
})

test('renders research item intake for a project', () => {
  const project = createProject('Research Intake Project')
  saveProject(project)
  window.history.pushState({}, '', `/projects/${project.id}/research-items/new`)

  render(<App />)

  expect(screen.getByRole('heading', { name: /add a research item/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/kind/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /go to annotations/i })).toHaveAttribute(
    'href',
    `/projects/${project.id}/annotations/new`,
  )
})

test('creates and persists a research item locally', async () => {
  const user = userEvent.setup()
  const project = createProject('Research Persistence Project')
  saveProject(project)
  window.history.pushState({}, '', `/projects/${project.id}/research-items/new`)

  render(<App />)

  await user.type(screen.getByLabelText(/title/i), 'Archive interview transcript')
  await user.selectOptions(screen.getByLabelText(/kind/i), 'source')
  await user.type(screen.getByLabelText(/description/i), 'A transcript used as primary evidence.')
  await user.type(screen.getByLabelText(/locator/i), 'Box 2, folder 4')
  await user.type(screen.getByLabelText(/url/i), 'https://example.com/archive')
  await user.click(screen.getByRole('button', { name: /save research item/i }))

  expect(await screen.findByRole('status')).toHaveTextContent(/saved archive interview transcript/i)

  const updatedProject = loadProject(project.id)
  expect(updatedProject?.researchItems).toHaveLength(1)
  expect(updatedProject?.researchItems[0]).toMatchObject({
    title: 'Archive interview transcript',
    kind: 'source',
    description: 'A transcript used as primary evidence.',
    locator: 'Box 2, folder 4',
    url: 'https://example.com/archive',
  })
  expect(updatedProject?.workflowState.currentStep).toBe('annotation')
  expect(updatedProject?.workflowState.completedSteps).toEqual(
    expect.arrayContaining(['project', 'research-item']),
  )
})

test('renders annotation UI for an existing research item', () => {
  const project = createProject('Annotation Render Project')
  saveProject(project)
  createResearchItem(project.id, {
    title: 'Field note',
    kind: 'note',
    description: 'Observation from the archive visit.',
  })
  window.history.pushState({}, '', `/projects/${project.id}/annotations/new`)

  render(<App />)

  expect(screen.getByRole('heading', { name: /annotate a research item/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/^research item$/i)).toHaveDisplayValue(/field note/i)
  expect(screen.getByRole('heading', { name: /field note/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/annotation note/i)).toBeInTheDocument()
})

test('creates and persists an annotation linked to a research item', async () => {
  const user = userEvent.setup()
  const project = createProject('Annotation Persistence Project')
  saveProject(project)
  const researchItem = createResearchItem(project.id, {
    title: 'Policy memo',
    kind: 'source',
    locator: 'p. 12',
  })
  window.history.pushState({}, '', `/projects/${project.id}/annotations/new`)

  render(<App />)

  await user.type(screen.getByLabelText(/annotation note/i), 'This memo frames the policy as temporary.')
  await user.type(screen.getByLabelText(/excerpt/i), 'temporary emergency measure')
  await user.type(screen.getByLabelText(/tags/i), 'policy, framing, policy')
  await user.click(screen.getByRole('button', { name: /save annotation/i }))

  expect(await screen.findByRole('status')).toHaveTextContent(/saved annotation/i)

  const updatedProject = loadProject(project.id)
  expect(updatedProject?.annotations).toHaveLength(1)
  expect(updatedProject?.annotations[0]).toMatchObject({
    researchItemId: researchItem?.id,
    note: 'This memo frames the policy as temporary.',
    excerpt: 'temporary emergency measure',
    tags: ['policy', 'framing'],
  })
  expect(updatedProject?.workflowState.currentStep).toBe('claim')
  expect(updatedProject?.workflowState.completedSteps).toEqual(
    expect.arrayContaining(['project', 'research-item', 'annotation']),
  )
})

test('workflow home reflects research item and annotation progress', () => {
  const project = createProject('Workflow Progress Project')
  saveProject(project)
  const researchItem = createResearchItem(project.id, {
    title: 'Dataset excerpt',
    kind: 'object',
  })
  createAnnotation(project.id, {
    researchItemId: researchItem?.id ?? '',
    note: 'The excerpt shows repeated category drift.',
  })
  window.history.pushState({}, '', `/projects/${project.id}`)

  render(<App />)

  expect(screen.getByText(/next: develop a claim/i)).toBeInTheDocument()
  expect(screen.getByText('Research items').nextElementSibling).toHaveTextContent('1')
  expect(screen.getByText('Annotations').nextElementSibling).toHaveTextContent('1')

  const workflowProgress = screen.getByRole('heading', { name: 'Workflow progress' }).closest('section')
  expect(workflowProgress).not.toBeNull()
  const researchItemStep = within(workflowProgress as HTMLElement).getByText('Research Item').closest('li')
  const annotationStep = within(workflowProgress as HTMLElement).getByText('Annotation').closest('li')
  const claimStep = within(workflowProgress as HTMLElement).getByText('Claim').closest('li')

  expect(researchItemStep).not.toBeNull()
  expect(annotationStep).not.toBeNull()
  expect(claimStep).not.toBeNull()
  expect(within(researchItemStep as HTMLElement).getByText(/complete/i)).toBeInTheDocument()
  expect(within(annotationStep as HTMLElement).getByText(/complete/i)).toBeInTheDocument()
  expect(within(claimStep as HTMLElement).getByText(/current/i)).toBeInTheDocument()
})

test('claim builder renders for a project with an annotation', () => {
  const { project } = createAnnotatedProject('Claim Render Project')
  window.history.pushState({}, '', `/projects/${project.id}/claims/new`)

  render(<App />)

  expect(screen.getByRole('heading', { name: /build a claim/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/^annotation$/i)).toHaveDisplayValue(/archive memo/i)
  const annotationContext = screen.getByRole('heading', { name: /archive memo/i }).closest('section')
  expect(annotationContext).not.toBeNull()
  expect(within(annotationContext as HTMLElement).getByText(/method as an interpretive practice/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/claim text/i)).toBeInTheDocument()
})

test('creates and persists a claim linked to an annotation', async () => {
  const user = userEvent.setup()
  const { project, annotation, source } = createAnnotatedProject('Claim Persistence Project')
  window.history.pushState({}, '', `/projects/${project.id}/claims/new`)

  render(<App />)

  await user.type(
    screen.getByLabelText(/claim text/i),
    'Archival method depends on interpretation rather than neutral collection.',
  )
  await user.click(screen.getByRole('button', { name: /save claim/i }))

  expect(await screen.findByRole('status')).toHaveTextContent(/saved claim/i)

  const updatedProject = loadProject(project.id)
  expect(updatedProject?.claims).toHaveLength(1)
  expect(updatedProject?.claims[0]).toMatchObject({
    text: 'Archival method depends on interpretation rather than neutral collection.',
    annotationIds: [annotation.id],
    sourceIds: [source.id],
    status: 'draft',
  })
  expect(updatedProject?.workflowState.currentStep).toBe('draft')
  expect(updatedProject?.workflowState.completedSteps).toEqual(
    expect.arrayContaining(['project', 'research-item', 'annotation', 'claim']),
  )
})

test('draft passage UI renders for a project with a claim', () => {
  const { project, annotation } = createAnnotatedProject('Draft Render Project')
  createClaim(project.id, {
    annotationIds: [annotation.id],
    text: 'Archival method is interpretive.',
  })
  window.history.pushState({}, '', `/projects/${project.id}/drafts/new`)

  render(<App />)

  expect(screen.getByRole('heading', { name: /draft from evidence/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/^claim$/i)).toHaveDisplayValue(/archival method is interpretive/i)
  const evidenceContext = screen.getByRole('heading', { name: /selected claim/i }).closest('section')
  expect(evidenceContext).not.toBeNull()
  expect(within(evidenceContext as HTMLElement).getByText(/archival method is interpretive/i)).toBeInTheDocument()
  expect(within(evidenceContext as HTMLElement).getByText('(Smith 2023)')).toBeInTheDocument()
  expect(screen.getByLabelText(/^draft passage \*$/i)).toBeInTheDocument()
})

test('creates and persists a draft passage linked to a claim and source', async () => {
  const user = userEvent.setup()
  const { project, annotation, source } = createAnnotatedProject('Draft Persistence Project')
  const claim = createClaim(project.id, {
    annotationIds: [annotation.id],
    text: 'Archival method is interpretive.',
  })
  window.history.pushState({}, '', `/projects/${project.id}/drafts/new`)

  render(<App />)

  await user.type(screen.getByLabelText(/draft title/i), 'Interpretive method paragraph')
  await user.type(
    screen.getByLabelText(/^draft passage \*$/i),
    'Archival method should be understood as interpretive practice grounded in situated evidence.',
  )
  await user.click(screen.getByRole('button', { name: /save draft passage/i }))

  expect(await screen.findByRole('status')).toHaveTextContent(/saved draft passage/i)

  const updatedProject = loadProject(project.id)
  expect(updatedProject?.draftPassages).toHaveLength(1)
  expect(updatedProject?.draftPassages[0]).toMatchObject({
    title: 'Interpretive method paragraph',
    text: 'Archival method should be understood as interpretive practice grounded in situated evidence.',
    claimIds: [claim?.id],
    sourceIds: [source.id],
    citationText: '(Smith 2023)',
  })
  expect(updatedProject?.workflowState.currentStep).toBe('review')
  expect(updatedProject?.workflowState.completedSteps).toEqual(
    expect.arrayContaining(['project', 'research-item', 'annotation', 'claim', 'draft']),
  )
})

test('workflow home next-step guidance moves from claim to draft to review', () => {
  const { project, annotation } = createAnnotatedProject('Phase Four Guidance Project')
  window.history.pushState({}, '', `/projects/${project.id}`)

  const firstRender = render(<App />)

  expect(screen.getByText(/next: develop a claim/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /build claim/i })).toHaveAttribute(
    'href',
    `/projects/${project.id}/claims/new`,
  )

  firstRender.unmount()
  const claim = createClaim(project.id, {
    annotationIds: [annotation.id],
    text: 'Archival method is interpretive.',
  })
  const secondRender = render(<App />)

  expect(screen.getByText(/next: draft with evidence nearby/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /draft passage/i })).toHaveAttribute(
    'href',
    `/projects/${project.id}/drafts/new`,
  )

  expect(screen.getByText('Claims').nextElementSibling).toHaveTextContent('1')

  secondRender.unmount()
  createDraftPassage(project.id, {
    title: 'Review-ready passage',
    text: 'Archival method is interpretive.',
    claimIds: [claim?.id ?? ''],
    sourceIds: [],
  })
  render(<App />)

  expect(screen.getByText(/next: review provenance/i)).toBeInTheDocument()
  expect(screen.getByText('Draft passages').nextElementSibling).toHaveTextContent('1')
  const workflowProgress = screen.getByRole('heading', { name: 'Workflow progress' }).closest('section')
  expect(workflowProgress).not.toBeNull()
  const draftStep = within(workflowProgress as HTMLElement).getByText('Draft').closest('li')
  const reviewStep = within(workflowProgress as HTMLElement).getByText('Review').closest('li')
  expect(draftStep).not.toBeNull()
  expect(reviewStep).not.toBeNull()
  expect(within(draftStep as HTMLElement).getByText(/complete/i)).toBeInTheDocument()
  expect(within(reviewStep as HTMLElement).getByText(/current/i)).toBeInTheDocument()
})

test('review provenance screen renders a complete chain', () => {
  const { project } = createDraftedProject('Review Render Project')
  window.history.pushState({}, '', `/projects/${project.id}/review`)

  render(<App />)

  expect(screen.getByRole('heading', { name: /review provenance/i })).toBeInTheDocument()
  expect(screen.getByText(/complete chain/i)).toBeInTheDocument()
  expect(screen.getByText(/interpretive method paragraph/i)).toBeInTheDocument()
  expect(screen.getByText(/archival method is interpretive/i)).toBeInTheDocument()
  expect(screen.getByText(/method as an interpretive practice/i)).toBeInTheDocument()
  expect(screen.getByText(/archive memo/i)).toBeInTheDocument()
  expect(screen.getByText(/Archival Method \(2023\)/i)).toBeInTheDocument()
  expect(screen.getByText(/\(Smith 2023\)/i)).toBeInTheDocument()
})

test('review provenance screen handles missing chain data gracefully', () => {
  const project = createProject('Missing Review Project')
  saveProject(project)
  window.history.pushState({}, '', `/projects/${project.id}/review`)

  render(<App />)

  expect(screen.getByRole('heading', { name: /review provenance/i })).toBeInTheDocument()
  expect(screen.getByText(/needs attention/i)).toBeInTheDocument()
  expect(screen.getByText(/draft passage is missing/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /add a draft passage/i })).toHaveAttribute(
    'href',
    `/projects/${project.id}/drafts/new`,
  )
})

test('export screen renders Markdown for a project with a draft passage', () => {
  const { project } = createDraftedProject('Export Render Project')
  window.history.pushState({}, '', `/projects/${project.id}/export`)

  render(<App />)

  expect(screen.getByRole('heading', { name: /export cited passage/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/markdown export preview/i)).toHaveTextContent(
    /archival method should be understood as interpretive practice/i,
  )
  expect(screen.getByLabelText(/markdown export preview/i)).toHaveTextContent(/\(Smith 2023\)/)
  expect(screen.getByLabelText(/markdown export preview/i)).toHaveTextContent(/Reference:/)
  expect(screen.getByLabelText(/markdown export preview/i)).toHaveTextContent(/Jordan Smith/)
})

test('copies Markdown export and persists an export record locally', async () => {
  const user = userEvent.setup()
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  const { project, draftPassage } = createDraftedProject('Export Persistence Project')
  window.history.pushState({}, '', `/projects/${project.id}/export`)

  render(<App />)

  await user.click(screen.getByRole('button', { name: /copy markdown and save export/i }))

  expect(await screen.findByRole('status')).toHaveTextContent(/markdown copied and export record saved/i)
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Reference:'))

  const updatedProject = loadProject(project.id)
  expect(updatedProject?.exports).toHaveLength(1)
  expect(updatedProject?.exports[0]).toMatchObject({
    draftPassageId: draftPassage.id,
    format: 'markdown',
    includedBibliography: true,
  })
  expect(updatedProject?.exports[0].content).toContain('Archival method should be understood')
  expect(updatedProject?.exports[0].content).toContain('Reference:')
  expect(updatedProject?.workflowState.currentStep).toBe('export')
  expect(updatedProject?.workflowState.completedSteps).toEqual(
    expect.arrayContaining(['project', 'research-item', 'annotation', 'claim', 'draft', 'review', 'export']),
  )
})

test('export screen announces clipboard failures as errors', async () => {
  const user = userEvent.setup()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockRejectedValue(new Error('clipboard blocked')) },
    configurable: true,
  })
  const { project } = createDraftedProject('Export Failure Project')
  window.history.pushState({}, '', `/projects/${project.id}/export`)

  render(<App />)

  await user.click(screen.getByRole('button', { name: /copy markdown and save export/i }))

  const status = await screen.findByRole('status')
  expect(status).toHaveTextContent(/could not copy markdown/i)
  expect(status).toHaveClass('form-error')
  expect(loadProject(project.id)?.exports).toHaveLength(0)
})

test('workflow home next-step guidance moves from review to export to complete', async () => {
  const user = userEvent.setup()
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  const { project } = createDraftedProject('Phase Five Guidance Project')
  window.history.pushState({}, '', `/projects/${project.id}`)

  const firstRender = render(<App />)

  expect(screen.getByText(/next: review provenance/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /review provenance/i })).toHaveAttribute(
    'href',
    `/projects/${project.id}/review`,
  )

  firstRender.unmount()
  window.history.pushState({}, '', `/projects/${project.id}/review`)
  const reviewRender = render(<App />)
  await user.click(screen.getByRole('button', { name: /mark review complete/i }))
  expect(await screen.findByRole('status')).toHaveTextContent(/review complete/i)

  reviewRender.unmount()
  window.history.pushState({}, '', `/projects/${project.id}`)
  const exportGuidanceRender = render(<App />)
  expect(screen.getByText(/next: export cited prose/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /export markdown/i })).toHaveAttribute(
    'href',
    `/projects/${project.id}/export`,
  )

  exportGuidanceRender.unmount()
  window.history.pushState({}, '', `/projects/${project.id}/export`)
  const exportRender = render(<App />)
  await user.click(screen.getByRole('button', { name: /copy markdown and save export/i }))
  expect(await screen.findByRole('status')).toHaveTextContent(/markdown copied and export record saved/i)

  exportRender.unmount()
  window.history.pushState({}, '', `/projects/${project.id}`)
  render(<App />)
  expect(screen.getByText(/workflow complete/i)).toBeInTheDocument()
  expect(screen.getByText('Exports').nextElementSibling).toHaveTextContent('1')

  const workflowProgress = screen.getByRole('heading', { name: 'Workflow progress' }).closest('section')
  expect(workflowProgress).not.toBeNull()
  const reviewStep = within(workflowProgress as HTMLElement).getByText('Review').closest('li')
  const exportStep = within(workflowProgress as HTMLElement).getByText('Export').closest('li')
  expect(reviewStep).not.toBeNull()
  expect(exportStep).not.toBeNull()
  expect(within(reviewStep as HTMLElement).getByText(/complete/i)).toBeInTheDocument()
  expect(within(exportStep as HTMLElement).getByText(/complete/i)).toBeInTheDocument()
})

test('workflow home shows complete when an export already exists', () => {
  const { project, draftPassage } = createDraftedProject('Existing Export Project')
  createExportRecord(project.id, {
    draftPassageId: draftPassage.id,
    format: 'markdown',
    content: 'Existing export',
    includedBibliography: false,
  })
  window.history.pushState({}, '', `/projects/${project.id}`)

  render(<App />)

  expect(screen.getByText(/workflow complete/i)).toBeInTheDocument()
  expect(screen.getByText('Exports').nextElementSibling).toHaveTextContent('1')
})

test('old normalized projects can open claim and draft screens', () => {
  const legacyProject = {
    id: 'legacy-phase-four-project',
    title: 'Legacy Phase Four Project',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Legacy prose' }],
        },
      ],
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    wordCount: 2,
    citationStyle: 'mla',
    sources: [],
  }
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([legacyProject]))
  window.history.pushState({}, '', '/projects/legacy-phase-four-project/claims/new')

  const { unmount } = render(<App />)
  expect(screen.getByRole('heading', { name: /add an annotation first/i })).toBeInTheDocument()

  unmount()
  window.history.pushState({}, '', '/projects/legacy-phase-four-project/drafts/new')
  render(<App />)
  expect(screen.getByRole('heading', { name: /add a claim first/i })).toBeInTheDocument()
})

test('old normalized projects can use research item and annotation screens', async () => {
  const user = userEvent.setup()
  const legacyProject = {
    id: 'legacy-phase-three-project',
    title: 'Legacy Phase Three Project',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Legacy prose' }],
        },
      ],
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    wordCount: 2,
    citationStyle: 'mla',
    sources: [],
  }
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([legacyProject]))
  window.history.pushState({}, '', '/projects/legacy-phase-three-project/research-items/new')

  const { unmount } = render(<App />)

  await user.type(screen.getByLabelText(/title/i), 'Legacy evidence item')
  await user.click(screen.getByRole('button', { name: /save research item/i }))
  expect(await screen.findByRole('status')).toHaveTextContent(/saved legacy evidence item/i)

  unmount()
  window.history.pushState({}, '', '/projects/legacy-phase-three-project/annotations/new')
  render(<App />)

  await user.type(screen.getByLabelText(/annotation note/i), 'Legacy annotation still saves.')
  await user.click(screen.getByRole('button', { name: /save annotation/i }))
  expect(await screen.findByRole('status')).toHaveTextContent(/saved annotation/i)

  const updatedProject = loadProject('legacy-phase-three-project')
  expect(updatedProject?.researchItems).toHaveLength(1)
  expect(updatedProject?.annotations).toHaveLength(1)
})

test('opens old normalized projects in the workflow home', () => {
  const legacyProject = {
    id: 'legacy-workflow-project',
    title: 'Legacy Workflow Project',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Legacy prose' }],
        },
      ],
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    wordCount: 2,
    citationStyle: 'mla',
    sources: [],
  }
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([legacyProject]))
  window.history.pushState({}, '', '/projects/legacy-workflow-project')

  render(<App />)

  expect(screen.getByRole('heading', { name: /legacy workflow project/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/project status/i)).toHaveTextContent(/project setup/i)
  expect(screen.getByText(/2 words/i)).toBeInTheDocument()
})
