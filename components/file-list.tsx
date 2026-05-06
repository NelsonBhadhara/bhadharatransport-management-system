'use client'

import { useState, useEffect } from 'react'
import { Download, Trash2, Loader2 } from 'lucide-react'
import { FileMetadata, deleteFile, getDownloadUrl } from '@/lib/supabase/storage'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface FileListProps {
  files: FileMetadata[]
  onFileDeleted: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FileList({ files, onFileDeleted }: FileListProps) {
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!selectedFile) return

    setDeletingId(selectedFile.id)
    const result = await deleteFile(selectedFile.file_path, selectedFile.id)

    if (result.success) {
      onFileDeleted()
      setSelectedFile(null)
    } else {
      console.error('Delete failed:', result.error)
    }

    setDeletingId(null)
  }

  const handleDownload = async (file: FileMetadata) => {
    setDownloadingId(file.id)
    const url = await getDownloadUrl(file.file_path)

    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }

    setDownloadingId(null)
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No files uploaded yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                File Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Size
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Uploaded
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="truncate">{file.file_name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatFileSize(file.file_size)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(file.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="inline-flex items-center gap-1 rounded px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {downloadingId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Download
                    </button>
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="inline-flex items-center gap-1 rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={selectedFile !== null} onOpenChange={() => setSelectedFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedFile?.file_name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
