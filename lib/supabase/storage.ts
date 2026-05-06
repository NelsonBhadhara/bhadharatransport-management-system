'use client'

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type BucketName = 'receipts' | 'documents' | 'vehicle-photos'

export async function uploadFile(
  bucket: BucketName,
  userId: string,
  file: File
): Promise<{ path: string; url: string } | null> {
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${userId}/${timestamp}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: false })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return null
  }

  // Save metadata
  await supabase.from('files').insert({
    user_id: userId,
    bucket,
    path: filePath,
    filename: file.name,
    size_bytes: file.size,
    mime_type: file.type,
  })

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return { path: filePath, url: urlData.publicUrl }
}

export async function listFiles(
  bucket: BucketName,
  userId?: string
): Promise<{ id: string; filename: string; path: string; bucket: string; uploadedAt: string; url: string }[]> {
  let query = supabase.from('files').select('*').eq('bucket', bucket).order('uploaded_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) { console.error('listFiles error:', error); return [] }

  return (data || []).map(f => {
    const { data: urlData } = supabase.storage.from(f.bucket).getPublicUrl(f.path)
    return {
      id: f.id,
      filename: f.filename,
      path: f.path,
      bucket: f.bucket,
      uploadedAt: f.uploaded_at,
      url: urlData.publicUrl,
    }
  })
}

export async function deleteFile(bucket: BucketName, path: string, fileId: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(bucket).remove([path])
  if (storageError) console.error('Delete storage error:', storageError)

  const { error: dbError } = await supabase.from('files').delete().eq('id', fileId)
  if (dbError) console.error('Delete file record error:', dbError)
}

export async function getSignedUrl(bucket: BucketName, path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  if (error) { console.error('getSignedUrl error:', error); return null }
  return data.signedUrl
}
