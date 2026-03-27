import { useState } from 'react'
import { type CitationStyle } from '../lib/storage'

type CitationStyleSelectorProps = {
  onSelect: (style: CitationStyle) => void
  onCancel: () => void
}

export function CitationStyleSelector({ onSelect, onCancel }: CitationStyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('mla')

  const citationStyles = [
    {
      value: 'mla' as CitationStyle,
      name: 'MLA (Modern Language Association)',
      description: 'Commonly used in humanities and liberal arts',
      example: '(Smith 2023)'
    },
    {
      value: 'apa' as CitationStyle,
      name: 'APA (American Psychological Association)',
      description: 'Commonly used in social sciences',
      example: '(Smith, 2023)'
    },
    {
      value: 'chicago' as CitationStyle,
      name: 'Chicago (Chicago Manual of Style)',
      description: 'Commonly used in history and some social sciences',
      example: 'Smith (2023)'
    },
    {
      value: 'harvard' as CitationStyle,
      name: 'Harvard',
      description: 'Commonly used in UK and Australian universities',
      example: '(Smith 2023)'
    }
  ]

  const handleSelect = () => {
    onSelect(selectedStyle)
  }

  return (
    <div className="citation-selector-overlay">
      <div className="citation-selector-modal">
        <div className="citation-selector-header">
          <h2>Choose Citation Style</h2>
          <p>Select the citation style you'll be using for this document</p>
        </div>

        <div className="citation-styles-list">
          {citationStyles.map(style => (
            <div
              key={style.value}
              className={`citation-style-option ${selectedStyle === style.value ? 'selected' : ''}`}
              onClick={() => setSelectedStyle(style.value)}
            >
              <div className="style-info">
                <h3>{style.name}</h3>
                <p className="style-description">{style.description}</p>
                <p className="style-example">Example: {style.example}</p>
              </div>
              <div className="style-radio">
                <input
                  type="radio"
                  name="citation-style"
                  value={style.value}
                  checked={selectedStyle === style.value}
                  onChange={() => setSelectedStyle(style.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="citation-selector-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="select-btn" onClick={handleSelect}>
            Create Document
          </button>
        </div>
      </div>
    </div>
  )
}
