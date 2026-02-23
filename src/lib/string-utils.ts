// Convert to Title Case (e.g., "LEMON JOY FRESH" → "Lemon Joy Fresh")
export const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
