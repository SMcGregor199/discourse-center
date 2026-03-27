import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadImages, uploadImage, deleteImage, formatFileSize, type StoredImage } from '../lib/storage'

export function ImageRepository() {
  const [images, setImages] = useState<StoredImage[]>(() => loadImages())
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file))
      const uploadedImages = await Promise.all(uploadPromises)
      
      setImages(prev => [...uploadedImages, ...prev])
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload images')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteImage(imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="image-repository">
      <div className="repository-header">
        <div className="header-content">
          <h1>Image Repository</h1>
          <p>Manage your uploaded images for use in documents</p>
        </div>
        <div className="header-actions">
          <button 
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Images'}
          </button>
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {uploadError && (
        <div className="error-message">
          {uploadError}
        </div>
      )}

      {images.length === 0 ? (
        <div className="empty-state">
          <h2>No images uploaded yet</h2>
          <p>Upload your first images to get started</p>
          <button 
            className="upload-btn primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload First Image'}
          </button>
        </div>
      ) : (
        <div className="images-grid">
          {images.map(image => (
            <div key={image.id} className="image-card">
              <div className="image-preview">
                <img src={image.dataUrl} alt={image.name} />
              </div>
              <div className="image-info">
                <h3 className="image-name" title={image.name}>
                  {image.name}
                </h3>
                <div className="image-meta">
                  <span className="file-size">{formatFileSize(image.size)}</span>
                  <span className="upload-date">{formatDate(image.uploadedAt)}</span>
                </div>
              </div>
              <div className="image-actions">
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteImage(image.id)}
                  title="Delete image"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
