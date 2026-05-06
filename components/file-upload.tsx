'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadFile } from '@/lib/supabase/storage'

interface FileUploadProps {
  userId: string
  onUploadComplete: () => void
}

export function FileUpload({ userId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleUpload = async (files: FileList) {
    if (!files.length) return

    setError(null)
    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress((i / files.length) * 100)

        const result = await uploadFile(file, userId)
        if (!result.success) {
          setError(result.error || 'Upload failed')
          return
        }
      }

      setUploadProgress(100)
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        if (inputRef.current) inputRef.current.value = ''
        onUploadComplete()
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error')
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleUpload(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(e.target.files)
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          disabled={isUploading}
          className="hidden"
          accept="*/*"
        />

        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          ) : (
            <Upload className="h-6 w-6 text-gray-400" />
          )}
          <div>
            <p className="font-medium text-gray-700">
              {isUploading ? 'Uploading...' : 'Drag files here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              {isUploading
                ? `${Math.round(uploadProgress)}%`
                : 'Any file type accepted'}
            </p>
          </div>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
          <X className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}
