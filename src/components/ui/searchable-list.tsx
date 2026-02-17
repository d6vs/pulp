import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { ReactNode } from "react"

type SearchableListProps = {
  title: string
  count: number
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  emptyIcon: ReactNode
  emptyMessage: string
  children: ReactNode
}

export function SearchableList({
  title,
  count,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  emptyIcon,
  emptyMessage,
  children,
}: SearchableListProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <CardDescription className="text-sm">{count} total items</CardDescription>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        {count === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              {emptyIcon}
            </div>
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
