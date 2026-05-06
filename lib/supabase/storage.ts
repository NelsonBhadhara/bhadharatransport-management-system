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
): Promise<{ success: boolean; path?: string; error?: string }> {
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

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Create metadata record
    const { error: metaError } = await supabase
      .from('file_metadata')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      })

    if (metaError) {
      // Clean up the uploaded file if metadata creation fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      return { success: false, error: metaError.message }
    }

    return { success: true, path: filePath }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getUserFiles(userId: string): Promise<FileMetadata[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching files:', error)
    return []
  }
}

export async function deleteFile(
  filePath: string,
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (storageError) {
      return { success: false, error: storageError.message }
    }

    // Delete metadata record
    const { error: metaError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('id', fileId)

    if (metaError) {
      return { success: false, error: metaError.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getDownloadUrl(filePath: string): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return data?.publicUrl || null
  } catch (error) {
    console.error('Error getting download URL:', error)
    return null
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
        const files = await getUserFiles(userId)
        onFileChange(files)
      }
    )
    .subscribe()

  return subscription
}
