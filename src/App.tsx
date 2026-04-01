import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { EditorShell } from './components/EditorShell'
import { ImageRepository } from './components/ImageRepository'
import { CitationsLibrary } from './components/CitationsLibrary'
import './App.css'

function AppLayout() {
  const location = useLocation()
  const isEditorRoute = location.pathname.startsWith('/editor/')

  return (
    <main className={isEditorRoute ? 'app app--editor' : 'app'}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor/:projectId" element={<EditorShell />} />
        <Route path="/images" element={<ImageRepository />} />
        <Route path="/citations" element={<CitationsLibrary />} />
      </Routes>
    </main>
  )
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}
