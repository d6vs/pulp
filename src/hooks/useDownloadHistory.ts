"use client"

import { useState, useCallback, useEffect } from "react"
import {
  addDownloadHistory,
  getDownloadHistory,
  clearDownloadHistory,
  type DownloadHistoryEntry,
  type DownloadType,
} from "@/lib/download-history-actions"

export type { DownloadHistoryEntry, DownloadType }

export function useDownloadHistory(downloadType: DownloadType) {
  const [history, setHistory] = useState<DownloadHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      const { data } = await getDownloadHistory(downloadType)
      setHistory(data)
      setLoading(false)
    }
    fetchHistory()
  }, [downloadType])

  const addEntry = useCallback(async (filename: string) => {
    const { data } = await addDownloadHistory(filename, downloadType)
    if (data) {
      setHistory((prev) => [data, ...prev].slice(0, 50))
    }
  }, [downloadType])

  const clearHistory = useCallback(async () => {
    const { success } = await clearDownloadHistory(downloadType)
    if (success) {
      setHistory([])
    }
  }, [downloadType])

  const refreshHistory = useCallback(async () => {
    const { data } = await getDownloadHistory(downloadType)
    setHistory(data)
  }, [downloadType])

  return { history, loading, addEntry, clearHistory, refreshHistory }
}
