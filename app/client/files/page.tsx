'use client'

import { useState, useEffect } from 'react'
import { FileUpload } from '@/components/file-upload'
import { FileList } from '@/components/file-list'
import { getUserFiles, FileMetadata, subscribeToFileChanges } from '@/lib/supabase/storage'
import { Cloud } from 'lucide-react'

export default function FilesPage() {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get user ID from localStorage (from your auth system)
    const user = localStorage.getItem('bht_current_user')
    if (user) {
      try {
        const parsed = JSON.parse(user)
        setUserId(parsed.id)
      } catch {
        console.error('[v0] Failed to parse user from localStorage')
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!userId) return

    let unsubscribe: any

    const loadFiles = async () => {
      const data = await getUserFiles(userId)
      setFiles(data)

      // Subscribe to real-time changes
      unsubscribe = subscribeToFileChanges(userId, (updatedFiles) => {
        setFiles(updatedFiles)
      })
    }

    loadFiles()

    return () => {
      if (unsubscribe) {
        unsubscribe.unsubscribe()
      }
    }
  }, [userId])

  const handleUploadComplete = async () => {
    if (userId) {
      const data = await getUserFiles(userId)
      setFiles(data)
    }
  }

  const handleFileDeleted = async () => {
    if (userId) {
      const data = await getUserFiles(userId)
      setFiles(data)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Cloud className="h-12 w-12 text-gray-300" />
        <p className="text-gray-600">Please log in to access file storage.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Cloud className="h-8 w-8 text-blue-500" />
            Cloud File Storage
          </h1>
          <p className="text-gray-600 mt-2">
            Upload, manage, and sync your files across devices
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
          <FileUpload userId={userId} onUploadComplete={handleUploadComplete} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Files ({files.length})
          </h2>
          <FileList files={files} onFileDeleted={handleFileDeleted} />
        </div>
      </div>
    </div>
  )
}
