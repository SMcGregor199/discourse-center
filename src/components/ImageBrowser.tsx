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
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="image-browser-overlay">
      <div className="image-browser-modal">
        <div className="browser-header">
          <h2>Select Image</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="browser-search">
          <input
            type="text"
            placeholder="Search images..."
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
            <div className="browser-grid">
              {filteredImages.map(image => (
                <div 
                  key={image.id} 
                  className="browser-image-card"
                  onClick={() => onSelectImage(image)}
                >
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="browser-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
