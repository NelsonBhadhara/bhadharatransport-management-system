'use client'

import { useCallback, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import {
  uploadFile,
  downloadFile,
  deleteFile,
  listFiles,
  type FileMetadata,
} from '@/lib/supabase/storage'

interface UseFilesOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useFiles(options: UseFilesOptions = {}) {
  const { autoRefresh = true, refreshInterval = 5000 } = options
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get current user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
  }, [])

  // Fetch files with SWR for caching and auto-refresh
  const { data: files = [], error, isLoading: isFetching } = useSWR(
    userId ? ['files', userId] : null,
    async () => {
      if (!userId) return []
      try {
        return await listFiles(userId)
      } catch (err) {
        console.error('[v0] Error fetching files:', err)
        return []
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      focusThrottleInterval: 30000,
      ...(autoRefresh && { refreshInterval }),
    }
  )

  useEffect(() => {
    if (!isFetching) {
      setIsLoading(false)
    }
  }, [isFetching])

  const upload = useCallback(
    async (file: File, onProgress?: (progress: number) => void) => {
      if (!userId) throw new Error('No user logged in')
      try {
        const metadata = await uploadFile(file, userId, onProgress)
        // Refresh files list after upload
        await mutate(['files', userId])
        return metadata
      } catch (err) {
        console.error('[v0] Upload error:', err)
        throw err
      }
    },
    [userId]
  )

  const download = useCallback(
    async (filePath: string) => {
      if (!userId) throw new Error('No user logged in')
      try {
        return await downloadFile(filePath, userId)
      } catch (err) {
        console.error('[v0] Download error:', err)
        throw err
      }
    },
    [userId]
  )

  const delete_ = useCallback(
    async (fileId: string, filePath: string) => {
      if (!userId) throw new Error('No user logged in')
      try {
        await deleteFile(fileId, filePath, userId)
        // Refresh files list after deletion
        await mutate(['files', userId])
      } catch (err) {
        console.error('[v0] Delete error:', err)
        throw err
      }
    },
    [userId]
  )

  const refresh = useCallback(async () => {
    if (userId) {
      await mutate(['files', userId])
    }
  }, [userId])

  return {
    files: files as FileMetadata[],
    isLoading,
    error,
    upload,
    download,
    delete: delete_,
    refresh,
  }
}
