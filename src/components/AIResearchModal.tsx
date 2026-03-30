import { useState } from 'react'
import { loadProjects, loadImages, type Project } from '../lib/storage'

interface SearchResult {
  title: string
  authors: string[]
  year: string
  abstract: string
  venue: string
  url: string
  doi: string
  citations: number
}

interface ContextData {
  question: string
  currentProject: {
    title: string
    citationStyle: string
    sources: Array<{
      id: string
      type: string
      title: string
      author: string
      year: string
      publisher?: string
      url?: string
      journal?: string
      volume?: string
      pages?: string
      doi?: string
      createdAt: string
    }>
  }
  otherProjects?: Array<{
    title: string
    content: string
    sources: Array<{
      id: string
      type: string
      title: string
      author: string
      year: string
      publisher?: string
      url?: string
      journal?: string
      volume?: string
      pages?: string
      doi?: string
      createdAt: string
    }>
  }>
  images?: Array<{
    name: string
    type: string
  }>
}

type AIResearchModalProps = {
  selectedText: string
  currentProject: Project
  onInsert: (content: string) => void
  onClose: () => void
}

export function AIResearchModal({ selectedText, currentProject, onInsert, onClose }: AIResearchModalProps) {
  const [includeCurrentSources, setIncludeCurrentSources] = useState(true)
  const [includeOtherProjects, setIncludeOtherProjects] = useState(false)
  const [includeImages, setIncludeImages] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  const allProjects = loadProjects()
  const otherProjects = allProjects.filter(p => p.id !== currentProject.id)
  const allImages = loadImages()

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleImageToggle = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const buildContext = (): ContextData => {
    const context: ContextData = {
      question: selectedText,
      currentProject: {
        title: currentProject.title,
        citationStyle: currentProject.citationStyle,
        sources: includeCurrentSources ? currentProject.sources : [],
      },
    }

    if (includeOtherProjects) {
      context.otherProjects = allProjects
        .filter(p => selectedProjects.includes(p.id))
        .map(p => ({
          title: p.title,
          content: extractText(p.content),
          sources: p.sources,
        }))
    }

    if (includeImages) {
      context.images = allImages
        .filter(img => selectedImages.includes(img.id))
        .map(img => ({
          name: img.name,
          type: img.type,
        }))
    }

    return context
  }

  const extractText = (content: unknown): string => {
    if (!content || typeof content !== 'object' || !('content' in content)) return ''
    const contentObj = content as { content?: unknown[] }
    return contentObj.content?.map((node: unknown) => {
      if (typeof node === 'object' && node !== null) {
        const nodeObj = node as { type?: string; text?: string; content?: unknown[] }
        if (nodeObj.type === 'text') return nodeObj.text || ''
        if (nodeObj.type === 'paragraph' && nodeObj.content) {
          return nodeObj.content.map((n: unknown) => {
            if (typeof n === 'object' && n !== null && 'text' in n) {
              return (n as { text?: string }).text || ''
            }
            return ''
          }).join(' ')
        }
      }
      return ''
    }).join(' ') || ''
  }

  const handleSearch = async () => {
    setIsSearching(true)
    setResults([])

    try {
      // Mock search for now - will replace with real Semantic Scholar/Crossref API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockResults = [
        {
          title: "Recent Advances in Machine Learning for Academic Research",
          authors: ["Smith, J.", "Doe, A."],
          year: "2023",
          abstract: "This paper explores the latest developments in machine learning applications within academic research environments...",
          venue: "Journal of Academic Computing",
          url: "https://example.com/paper1",
          doi: "10.1000/182",
          citations: 42,
        },
        {
          title: "Understanding Scholarly Communication Patterns in Digital Environments",
          authors: ["Johnson, M.", "Williams, K."],
          year: "2024",
          abstract: "A comprehensive analysis of how scholars communicate and collaborate in digital-first research environments...",
          venue: "Digital Scholarship Quarterly",
          url: "https://example.com/paper2",
          doi: "10.1000/183",
          citations: 28,
        },
      ]

      setResults(mockResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const formatResearchPack = () => {
    if (results.length === 0) return ''

    const pack = [
      `## Research Results for: "${selectedText}"`,
      '',
      `Found ${results.length} relevant papers:`,
      '',
      ...results.map((paper, i) => [
        `### ${i + 1}. ${paper.title}`,
        `**Authors:** ${paper.authors.join(', ')} (${paper.year})`,
        `**Venue:** ${paper.venue}`,
        `**Citations:** ${paper.citations}`,
        `**DOI:** ${paper.doi}`,
        `**Link:** ${paper.url}`,
        '',
        `**Abstract:** ${paper.abstract}`,
        '',
        '---',
        ''
      ]).flat()
    ].join('\n')

    return pack
  }

  const handleInsert = () => {
    const content = formatResearchPack()
    if (content) {
      onInsert(content)
      onClose()
    }
  }

  return (
    <div className="ai-research-overlay">
      <div className="ai-research-modal">
        <div className="ai-research-header">
          <h2>AI Research Assistant</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="ai-research-content">
          <div className="question-section">
            <h3>Selected Question</h3>
            <div className="selected-question">
              {selectedText || 'No text selected'}
            </div>
          </div>

          <div className="context-section">
            <h3>Context Options</h3>
            
            <div className="context-option">
              <label>
                <input
                  type="checkbox"
                  checked={includeCurrentSources}
                  onChange={(e) => setIncludeCurrentSources(e.target.checked)}
                />
                Include current project's sources ({currentProject.sources.length})
              </label>
            </div>

            <div className="context-option">
              <label>
                <input
                  type="checkbox"
                  checked={includeOtherProjects}
                  onChange={(e) => setIncludeOtherProjects(e.target.checked)}
                />
                Include other projects ({otherProjects.length})
              </label>
            </div>

            {includeOtherProjects && (
              <div className="projects-selector">
                {otherProjects.map(project => (
                  <label key={project.id} className="project-option">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => handleProjectToggle(project.id)}
                    />
                    {project.title}
                  </label>
                ))}
              </div>
            )}

            <div className="context-option">
              <label>
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                />
                Include images ({allImages.length})
              </label>
            </div>

            {includeImages && (
              <div className="images-selector">
                {allImages.map(image => (
                  <label key={image.id} className="image-option">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={() => handleImageToggle(image.id)}
                    />
                    {image.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="search-section">
            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : '🔍 Search Scholarly Sources'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="results-section">
              <h3>Research Results</h3>
              <div className="results-list">
                {results.map((result, i) => (
                  <div key={i} className="result-item">
                    <h4>{result.title}</h4>
                    <p className="result-meta">
                      {result.authors.join(', ')} • {result.year} • {result.venue}
                    </p>
                    <p className="result-abstract">{result.abstract}</p>
                    <div className="result-links">
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        View Paper
                      </a>
                      <span className="result-citations">
                        {result.citations} citations
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ai-research-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          {results.length > 0 && (
            <button className="insert-btn" onClick={handleInsert}>
              Insert Research Pack
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
