import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { EditorShell } from './components/EditorShell'
import { ImageRepository } from './components/ImageRepository'
import './App.css'

export default function App() {
  return (
    <Router>
      <main className='app'>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:projectId" element={<EditorShell />} />
          <Route path="/images" element={<ImageRepository />} />
        </Routes>
      </main>
    </Router>
  )
}
