import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, test, expect } from 'vitest'
import App from '../src/App'
import { createProject, loadProject, saveProject } from '../src/lib/storage'

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
