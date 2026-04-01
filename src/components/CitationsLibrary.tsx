import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatWorksCitedEntry, loadProjects } from '../lib/storage'

const CITATION_STYLE_LABELS = {
  mla: 'MLA',
  apa: 'APA',
  chicago: 'Chicago',
  harvard: 'Harvard',
} as const

export function CitationsLibrary() {
  const navigate = useNavigate()
  const projects = useMemo(() => loadProjects(), [])

  const projectsWithSources = projects.filter(project => project.sources.length > 0)
  const totalSources = projectsWithSources.reduce((count, project) => count + project.sources.length, 0)

  return (
    <div className="citations-library">
      <div className="repository-header">
        <div className="header-content">
          <h1>Citations</h1>
          <p>
            Review sources across your projects and jump back into any document to keep working.
          </p>
        </div>
        <div className="header-actions">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {projectsWithSources.length === 0 ? (
        <div className="empty-state">
          <h2>No citations yet</h2>
          <p>Add sources inside a project to see them collected here.</p>
        </div>
      ) : (
        <>
          <div className="citations-summary">
            <span>{projectsWithSources.length} project{projectsWithSources.length === 1 ? '' : 's'}</span>
            <span>{totalSources} source{totalSources === 1 ? '' : 's'}</span>
          </div>

          <div className="citations-projects">
            {projectsWithSources.map(project => (
              <section key={project.id} className="citation-project-card">
                <div className="citation-project-header">
                  <div>
                    <h2>{project.title}</h2>
                    <p>
                      {project.sources.length} source{project.sources.length === 1 ? '' : 's'} ·{' '}
                      {CITATION_STYLE_LABELS[project.citationStyle]}
                    </p>
                  </div>
                  <button
                    className="citation-project-open"
                    onClick={() => navigate(`/editor/${project.id}`)}
                  >
                    Open Project
                  </button>
                </div>

                <div className="citation-source-list">
                  {project.sources.map(source => (
                    <article key={source.id} className="citation-source-item">
                      <h3>{source.title}</h3>
                      <p className="citation-source-meta">
                        {source.author} ({source.year})
                      </p>
                      <p className="citation-source-entry">
                        {formatWorksCitedEntry(source, project.citationStyle)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
