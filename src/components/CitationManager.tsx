import { useState } from 'react'
import { addSource, removeSource, updateSource, formatWorksCitedEntry, formatInTextCitation, type Source, type CitationStyle } from '../lib/storage'

type CitationManagerProps = {
  projectId: string
  sources: Source[]
  citationStyle: CitationStyle
  onInsertCitation: (citation: string) => void
  onSourcesChange: (sources: Source[]) => void
}

export function CitationManager({ projectId, sources, citationStyle, onInsertCitation, onSourcesChange }: CitationManagerProps) {
  const [showAddSource, setShowAddSource] = useState(false)
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [formData, setFormData] = useState({
    type: 'book' as Source['type'],
    title: '',
    author: '',
    year: '',
    publisher: '',
    url: '',
    journal: '',
    volume: '',
    pages: '',
    doi: ''
  })

  const resetForm = () => {
    setFormData({
      type: 'book',
      title: '',
      author: '',
      year: '',
      publisher: '',
      url: '',
      journal: '',
      volume: '',
      pages: '',
      doi: ''
    })
    setEditingSource(null)
  }

  const handleAddSource = () => {
    setShowAddSource(true)
    resetForm()
  }

  const handleEditSource = (source: Source) => {
    setEditingSource(source)
    setFormData({
      type: source.type,
      title: source.title,
      author: source.author,
      year: source.year,
      publisher: source.publisher || '',
      url: source.url || '',
      journal: source.journal || '',
      volume: source.volume || '',
      pages: source.pages || '',
      doi: source.doi || ''
    })
    setShowAddSource(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingSource) {
      updateSource(projectId, editingSource.id, formData)
      const updatedSources = sources.map(s => 
        s.id === editingSource.id ? { ...s, ...formData } : s
      )
      onSourcesChange(updatedSources)
    } else {
      addSource(projectId, formData)
      onSourcesChange([...sources, { ...formData, id: '', createdAt: '' }])
    }
    
    setShowAddSource(false)
    resetForm()
  }

  const handleDeleteSource = (sourceId: string) => {
    if (confirm('Are you sure you want to delete this source?')) {
      removeSource(projectId, sourceId)
      onSourcesChange(sources.filter(s => s.id !== sourceId))
    }
  }

  const handleInsertCitation = (source: Source) => {
    const citation = formatInTextCitation(source, citationStyle)
    onInsertCitation(citation)
  }

  const generateWorksCited = () => {
    return sources.map(source => formatWorksCitedEntry(source, citationStyle)).join('\n\n')
  }

  const getWorksCitedTitle = () => {
    switch (citationStyle) {
      case 'mla': return 'Works Cited'
      case 'apa': return 'References'
      case 'chicago': return 'Bibliography'
      case 'harvard': return 'Reference List'
      default: return 'Works Cited'
    }
  }

  return (
    <div className="citation-manager">
      <div className="citation-header">
        <h3>Sources & Citations</h3>
        <button className="add-source-btn" onClick={handleAddSource}>
          + Add Source
        </button>
      </div>

      {showAddSource && (
        <div className="source-form-overlay">
          <div className="source-form">
            <h4>{editingSource ? 'Edit Source' : 'Add New Source'}</h4>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Source Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Source['type'] })}
                  >
                    <option value="book">Book</option>
                    <option value="journal">Journal Article</option>
                    <option value="website">Website</option>
                    <option value="article">Article</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Author *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
                {(formData.type === 'book' || formData.type === 'article') && (
                  <div className="form-group">
                    <label>Publisher</label>
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {formData.type === 'journal' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Journal</label>
                    <input
                      type="text"
                      value={formData.journal}
                      onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Volume</label>
                    <input
                      type="text"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formData.type === 'website' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>URL</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddSource(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingSource ? 'Update' : 'Add'} Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sources-list">
        {sources.length === 0 ? (
          <div className="no-sources">
            <p>No sources added yet. Add your first source to get started.</p>
          </div>
        ) : (
          sources.map(source => (
            <div key={source.id} className="source-item">
              <div className="source-info">
                <h4>{source.title}</h4>
                <p className="source-details">
                  {source.author} ({source.year})
                  {source.publisher && ` • ${source.publisher}`}
                  {source.journal && ` • ${source.journal}`}
                </p>
                <p className="source-citation">
                  <strong>In-text:</strong> {formatInTextCitation(source, citationStyle)}
                </p>
              </div>
              <div className="source-actions">
                <button
                  className="insert-citation-btn"
                  onClick={() => handleInsertCitation(source)}
                  title="Insert citation"
                >
                  📝 Insert
                </button>
                <button
                  className="edit-source-btn"
                  onClick={() => handleEditSource(source)}
                  title="Edit source"
                >
                  ✏️
                </button>
                <button
                  className="delete-source-btn"
                  onClick={() => handleDeleteSource(source.id)}
                  title="Delete source"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {sources.length > 0 && (
        <div className="works-cited-section">
          <h4>{getWorksCitedTitle()}</h4>
          <div className="works-cited-content">
            <pre>{generateWorksCited()}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
