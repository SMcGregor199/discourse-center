import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { EditorShell } from './components/EditorShell'
import { ImageRepository } from './components/ImageRepository'
import { CitationsLibrary } from './components/CitationsLibrary'
import { ProjectWorkflowHome } from './components/ProjectWorkflowHome'
import { ResearchItemIntake } from './components/ResearchItemIntake'
import { AnnotationPanel } from './components/AnnotationPanel'
import { ClaimBuilder } from './components/ClaimBuilder'
import { EvidenceLinkedDrafting } from './components/EvidenceLinkedDrafting'
import { ReviewProvenanceView } from './components/ReviewProvenanceView'
import { ExportScreen } from './components/ExportScreen'
import './App.css'

function AppLayout() {
  const location = useLocation()
  const isEditorRoute = location.pathname.startsWith('/editor/')

  return (
    <main className={isEditorRoute ? 'app app--editor' : 'app'}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/:projectId" element={<ProjectWorkflowHome />} />
        <Route path="/projects/:projectId/research-items/new" element={<ResearchItemIntake />} />
        <Route path="/projects/:projectId/annotations/new" element={<AnnotationPanel />} />
        <Route path="/projects/:projectId/claims/new" element={<ClaimBuilder />} />
        <Route path="/projects/:projectId/drafts/new" element={<EvidenceLinkedDrafting />} />
        <Route path="/projects/:projectId/review" element={<ReviewProvenanceView />} />
        <Route path="/projects/:projectId/export" element={<ExportScreen />} />
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
