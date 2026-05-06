'use client'

import { createClient } from './client'

export interface FileMetadata {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
  updated_at: string
}

const BUCKET_NAME = 'user-files'

export async function uploadFile(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<FileMetadata> {
  try {
    const supabase = createClient()
    const filePath = `${userId}/${Date.now()}-${file.name}`

    // Upload file to Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    // Create metadata record
    const { data, error: metaError } = await supabase
      .from('file_metadata')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single()

    if (metaError) {
      // Clean up the uploaded file if metadata creation fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      throw new Error(metaError.message)
    }

    if (!data) throw new Error('Failed to create file metadata')

    return data as FileMetadata
  } catch (error) {
    throw error instanceof Error ? error : new Error('Upload failed')
  }
}

export async function listFiles(userId: string): Promise<FileMetadata[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as FileMetadata[]
  } catch (error) {
    console.error('[v0] Error fetching files:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch files')
  }
}

export async function downloadFile(
  filePath: string,
  userId: string
): Promise<Blob> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath)

    if (error) throw new Error(error.message)
    if (!data) throw new Error('No data returned from download')

    return data
  } catch (error) {
    throw error instanceof Error ? error : new Error('Download failed')
  }
}

export async function deleteFile(
  fileId: string,
  filePath: string,
  userId: string
): Promise<void> {
  try {
    const supabase = createClient()

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (storageError) throw new Error(storageError.message)

    // Delete metadata record
    const { error: metaError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId)

    if (metaError) throw new Error(metaError.message)
  } catch (error) {
    throw error instanceof Error ? error : new Error('Delete failed')
  }
}

export async function getDownloadUrl(filePath: string): Promise<string> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) throw new Error(error.message)
    if (!data?.signedUrl) throw new Error('Failed to create signed URL')

    return data.signedUrl
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get download URL')
  }
}

export function subscribeToFileChanges(
  userId: string,
  onFileChange: (files: FileMetadata[]) => void
) {
  const supabase = createClient()

  const subscription = supabase
    .channel(`user-files-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'file_metadata',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        try {
          const files = await listFiles(userId)
          onFileChange(files)
        } catch (error) {
          console.error('[v0] Error syncing files:', error)
        }
      }
    )
    .subscribe()

  return subscription
}
