import { render, screen } from '@testing-library/react'
import App from '../src/App'

test('renders editor title and actions', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: /discourse center/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /copy html/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /clear editor/i })).toBeInTheDocument()
})
