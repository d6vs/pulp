"use client"

import { Download, Trash2, Clock, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DownloadHistoryEntry } from "@/hooks/useDownloadHistory"

type DownloadHistoryPanelProps = {
  history: DownloadHistoryEntry[]
  loading?: boolean
  onClear: () => void
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })
}

export function DownloadHistoryPanel({ history, loading, onClear }: DownloadHistoryPanelProps) {
  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) return null

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-white flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          Download History
          <span className="text-xs font-normal text-gray-400">({history.length})</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 gap-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </CardHeader>
      <CardContent className="p-0 bg-white divide-y divide-gray-100">
        {history.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50">
            <div className="flex items-center gap-4 min-w-0">
              <div className="shrink-0 w-8 h-8 rounded-md bg-orange-50 flex items-center justify-center">
                <Download className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 font-mono truncate">{entry.filename}</p>
              </div>
            </div>
            <div className="shrink-0 text-right ml-4">
              <p className="text-xs text-gray-500">{formatDateTime(entry.created_at)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
