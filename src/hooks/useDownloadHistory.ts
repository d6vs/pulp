"use client"

import { useState, useCallback } from "react"

export type DownloadEntry = {
  id: string
  filename: string
  description: string
  rowCount: number
  downloadedAt: string // ISO string
}

export function useDownloadHistory(storageKey: string) {
  const [history, setHistory] = useState<DownloadEntry[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as DownloadEntry[]) : []
    } catch {
      return []
    }
  })

  const addEntry = useCallback(
    (entry: Omit<DownloadEntry, "id" | "downloadedAt">) => {
      const newEntry: DownloadEntry = {
        ...entry,
        id: Date.now().toString(),
        downloadedAt: new Date().toISOString(),
      }
      setHistory((prev) => {
        const updated = [newEntry, ...prev].slice(0, 50) // keep last 50
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated))
        } catch {
          // storage quota exceeded — silently ignore
        }
        return updated
      })
    },
    [storageKey]
  )

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }, [storageKey])

  return { history, addEntry, clearHistory }
}
