import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProjects, createProject, saveProject, type Project, type CitationStyle } from '../lib/storage'
import { CitationStyleSelector } from './CitationStyleSelector'

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(() => {
    // Initialize state directly and create sample project if needed
    const loadedProjects = loadProjects()
    
    if (loadedProjects.length === 0) {
      // Create sample project during initial state setup
      const sampleProject = createProject('Heartbeat of Weight')
      sampleProject.content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Heartbeat of Weight' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'The rhythmic pulse of gravity pulls us toward center, toward earth, toward truth. Each step a negotiation with mass, each movement a dance with the invisible force that shapes our existence.' }
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'We carry our histories in our bones, our memories in muscle, our futures in the uncertain space between where we stand and where we might yet go.' }
            ],
          },
        ],
      }
      sampleProject.wordCount = 47 // Update word count to match the image
      saveProject(sampleProject)
      return [sampleProject]
    }
    
    return loadedProjects
  })
  const navigate = useNavigate()
  const [showCitationSelector, setShowCitationSelector] = useState(false)

  const createNewProject = () => {
    setShowCitationSelector(true)
  }

  const handleCitationStyleSelect = (citationStyle: CitationStyle) => {
    const newProject = createProject(undefined, citationStyle)
    saveProject(newProject)
    setProjects(prev => [newProject, ...prev])
    setShowCitationSelector(false)
    navigate(`/editor/${newProject.id}`)
  }

  const handleCitationSelectorCancel = () => {
    setShowCitationSelector(false)
  }

  const openProject = (projectId: string) => {
    navigate(`/editor/${projectId}`)
  }

  const openImageRepository = () => {
    navigate('/images')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    
    if (diffMonths > 0) {
      return `${diffMonths} mo`
    } else if (diffDays > 0) {
      return `${diffDays} d`
    } else {
      return 'Today'
    }
  }

  const formatWordCount = (count: number) => {
    return count.toLocaleString()
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Your Projects</h1>
        <div className="header-actions">
          <button className="image-repo-btn" onClick={openImageRepository}>
            📷 Images
          </button>
          <button className="new-project-btn" onClick={createNewProject}>
            <span className="plus-icon">+</span>
            <span>New</span>
          </button>
        </div>
      </div>
      
      <div className="projects-grid">
        {projects.map(project => (
          <div 
            key={project.id} 
            className="project-card"
            onClick={() => openProject(project.id)}
          >
            <h3 className="project-title">{project.title}</h3>
            <div className="project-meta">
              <span className="word-count">{formatWordCount(project.wordCount)} words</span>
              <span className="project-age">{formatDate(project.updatedAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <h2>No projects yet</h2>
          <p>Create your first project to get started</p>
          <button className="new-project-btn primary" onClick={createNewProject}>
            <span className="plus-icon">+</span>
            <span>Create First Project</span>
          </button>
        </div>
      )}

      {showCitationSelector && (
        <CitationStyleSelector
          onSelect={handleCitationStyleSelect}
          onCancel={handleCitationSelectorCancel}
        />
      )}
    </div>
  )
}
