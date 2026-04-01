import { useState } from 'react'
import { loadImages, type StoredImage } from '../lib/storage'

type ImageBrowserProps = {
  onSelectImage: (image: StoredImage) => void
  onClose: () => void
}

export function ImageBrowser({ onSelectImage, onClose }: ImageBrowserProps) {
  const [images] = useState<StoredImage[]>(() => loadImages())
  const [searchTerm, setSearchTerm] = useState('')

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.notes.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <aside className="image-browser-panel" aria-label="Image reference panel">
      <div className="browser-header">
        <div>
          <h2>Image References</h2>
          <p className="browser-subtitle">Keep images and notes visible while you write.</p>
        </div>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="browser-search">
        <input
          type="text"
          placeholder="Search images or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="browser-content">
        {filteredImages.length === 0 ? (
          <div className="browser-empty">
            {images.length === 0 ? (
              <>
                <h3>No images available</h3>
                <p>Upload images in the Image Repository first</p>
              </>
            ) : (
              <>
                <h3>No images found</h3>
                <p>Try adjusting your search term</p>
              </>
            )}
          </div>
        ) : (
          <div className="browser-list">
            {filteredImages.map(image => (
              <article key={image.id} className="browser-image-card">
                <div className="browser-image-preview">
                  <img src={image.dataUrl} alt={image.name} />
                </div>
                <div className="browser-image-info">
                  <h4 className="browser-image-name" title={image.name}>
                    {image.name}
                  </h4>
                  <p className="browser-image-meta">
                    {formatDate(image.uploadedAt)}
                  </p>
                  <p className="browser-image-notes">
                    {image.notes.trim().length > 0 ? image.notes : 'No notes yet'}
                  </p>
                  <div className="browser-image-actions">
                    <button
                      type="button"
                      className="insert-image-btn"
                      onClick={() => onSelectImage(image)}
                    >
                      Insert Image
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
