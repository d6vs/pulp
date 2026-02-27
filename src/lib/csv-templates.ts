import { exportToXLSXFromArray } from "./exportToXLSX"

export type CSVTemplate = {
  headers: string[]
  required: string[]
  example: (string | number | boolean)[][]
  description: string
}

export const CSV_TEMPLATES: Record<string, CSVTemplate> = {
  prints: {
    headers: ["official_print_name", "print_code", "color"],
    required: ["official_print_name", "print_code"],
    example: [
      ["Floral Garden", "FLG", "Blue"],
      ["Abstract Wave", "ABW", "Multi"],
      ["Solid Color", "SOL", "Red"],
    ],
    description: "Import prints with name, code, and optional color",
  },
  categories: {
    headers: [
      "category_name",
      "category_code",
      "sku_schema",
      "hsn_code",
      "size_in_product_name",
      "product_name_prefix",
      "category_type",
    ],
    required: ["category_name", "category_code", "sku_schema"],
    example: [
      ["T-Shirt", "TSH", "1", "6109", "true", "Cotton |", "individual"],
      ["Kurta Set", "KRS", "2", "6204", "true", "Ethnic |", "individual"],
    ],
    description:
      "Import categories. sku_schema: 1-5, size_in_product_name: true/false, category_type: individual/bundle",
  },
  sizes: {
    headers: ["size_name"],
    required: ["size_name"],
    example: [["XS"], ["S"], ["M"], ["L"], ["XL"], ["XXL"]],
    description: "Import size names",
  },
  products: {
    headers: [
      "category",
      "print",
      "size",
      "product_code",
      "name",
      "length_mm",
      "width_mm",
      "height_mm",
      "isbn",
      "color",
      "brand",
      "base_price",
      "cost_price",
      "mrp",
      "hsn_code",
      "material",
    ],
    required: ["category", "product_code", "name"],
    example: [
      [
        "Cotton Joggers",
        "Air Force Blue",
        "12-18M",
        "AFB_CJ_12-18M",
        "Cotton Joggers | Air Force Blue 12-18M",
        "210",
        "180",
        "15",
        "1",
        "Air Force Blue",
        "Orange Sugar",
        "499",
        "107",
        "499",
        "61112000",
        "100% Cotton",
      ],
    ],
    description:
      "Import products. category, print, size must match existing records",
  },
  product_weights: {
    headers: ["category", "size", "weight"],
    required: ["category", "size", "weight"],
    example: [
      ["Cotton Joggers", "9-12M", "68"],
      ["Cotton Joggers", "12-18M", "79"],
      ["T-shirt", "0-3M", "44"],
    ],
    description:
      "Import product weights. category and size must match existing records. Weight in grams.",
  },
}

export type TemplateType = keyof typeof CSV_TEMPLATES

export function downloadTemplate(templateType: TemplateType) {
  const template = CSV_TEMPLATES[templateType]
  if (!template) {
    console.error(`Template "${templateType}" not found`)
    return
  }

  exportToXLSXFromArray(template.headers, template.example, {
    filename: `${templateType}_template.csv`,
    showSuccessToast: true,
  })
}

export function parseCSVValue(value: string, header: string): string | number | boolean | null {
  const trimmed = value.trim()

  if (trimmed === "") return null

  // Boolean fields
  if (header === "size_in_product_name" || header === "requires_customization" || header === "enabled") {
    return trimmed.toLowerCase() === "true"
  }

  // Number fields
  const numberFields = [
    "sku_schema",
    "base_price",
    "cost_price",
    "mrp",
    "weight",
    "length_mm",
    "width_mm",
    "height_mm",
  ]
  if (numberFields.includes(header)) {
    const num = parseFloat(trimmed)
    return isNaN(num) ? null : num
  }

  return trimmed
}

export function validateRow(
  row: Record<string, unknown>,
  template: CSVTemplate,
  rowIndex: number
): { valid: boolean; errors: { row: number; field: string; message: string }[] } {
  const errors: { row: number; field: string; message: string }[] = []

  for (const required of template.required) {
    const value = row[required]
    if (value === null || value === undefined || value === "") {
      errors.push({
        row: rowIndex + 1,
        field: required,
        message: `Required field "${required}" is missing`,
      })
    }
  }

  return { valid: errors.length === 0, errors }
}

export function parseCSV(
  csvText: string,
  templateType: TemplateType
): {
  data: Record<string, unknown>[]
  errors: { row: number; field: string; message: string }[]
} {
  const template = CSV_TEMPLATES[templateType]
  if (!template) {
    return { data: [], errors: [{ row: 0, field: "", message: `Unknown template type: ${templateType}` }] }
  }

  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "")
  if (lines.length < 2) {
    return { data: [], errors: [{ row: 0, field: "", message: "CSV must have header row and at least one data row" }] }
  }

  // Parse header
  const headers = parseCSVLine(lines[0])

  // Validate headers match template
  const missingHeaders = template.required.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    return {
      data: [],
      errors: [{ row: 0, field: "", message: `Missing required headers: ${missingHeaders.join(", ")}` }],
    }
  }

  const data: Record<string, unknown>[] = []
  const errors: { row: number; field: string; message: string }[] = []

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, unknown> = {}

    headers.forEach((header, idx) => {
      row[header] = parseCSVValue(values[idx] || "", header)
    })

    const validation = validateRow(row, template, i)
    if (!validation.valid) {
      errors.push(...validation.errors)
    }

    data.push(row)
  }

  return { data, errors }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ",") {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
  }

  result.push(current)
  return result
}
