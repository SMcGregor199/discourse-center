import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, test, expect } from 'vitest'
import App from '../src/App'
import { PROJECTS_STORAGE_KEY, createProject, loadProject, saveProject } from '../src/lib/storage'

beforeEach(() => {
  localStorage.clear()
  window.history.pushState({}, '', '/')
})

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

  const titleInput = screen.getByRole('textbox', { name: /document title/i })
  await user.clear(titleInput)
  await user.type(titleInput, 'Editor Renamed Title')

  await waitFor(() => {
    expect(loadProject(project.id)?.title).toBe('Editor Renamed Title')
  })
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
