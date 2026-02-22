// Custom size order for display
export const SIZE_ORDER = [
  "0-6M",
  "Standard",
  "0-3M",
  "3-6M",
  "6-9M",
  "9-12M",
  "12-18M",
  "18-24M",
  "2-3Y",
  "3-4Y",
  "4-5Y",
  "5-6Y",
  "6-7Y",
  "7-8Y",
  "8-9Y",
  "9-10Y",
  "Small"
]

export function sortSizesByCustomOrder<T extends { size_name: string }>(sizes: T[]): T[] {
  return sizes.sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.size_name)
    const indexB = SIZE_ORDER.indexOf(b.size_name)
    // If not in the predefined list, put at the end alphabetically
    if (indexA === -1 && indexB === -1) return a.size_name.localeCompare(b.size_name)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}
