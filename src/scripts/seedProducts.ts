import { readCSV } from "./readCsv"
import { supabaseAdmin } from "../lib/supabase/supabaseAdmin"

// Remove invisible Unicode characters and normalize whitespace
function cleanString(str: string | undefined): string {
  if (!str) return ""
  return str
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "") // Remove zero-width spaces and word joiner
    .trim()
}

export async function seedProducts() {
  const rows = await readCSV("src/scripts/data/products.csv")
  console.log(`📖 Found ${rows.length} products in CSV`)

  // Fetch lookup data
  const { data: categories } = await supabaseAdmin.from("product_categories").select("id, category_name")
  const { data: sizes } = await supabaseAdmin.from("sizes").select("id, size_name")
  const { data: prints } = await supabaseAdmin.from("prints_name").select("id, official_print_name")
  const { data: weights } = await supabaseAdmin.from("product_weights").select("id, category_id, size_id")

  if (!categories || !sizes || !prints || !weights) {
    console.error("❌ Failed to fetch lookup data")
    return
  }

  let successCount = 0
  let errorCount = 0

  for (const row of rows) {
    const csvSize = row["Size"]?.replace(/\s/g, "") // "4-5 Y" → "4-5Y"
    const csvStyle = cleanString(row["Style"])

    const category = categories.find((c) => c.category_name === row["Category Code"])
    const size = sizes.find((s) => s.size_name === csvSize)
    const print = prints.find((p) => p.official_print_name.toLowerCase() === csvStyle.toLowerCase())

    if (!category) {
      console.warn(`⚠️  Category not found: "${row["Category Code"]}"`)
      errorCount++
      continue
    }

    if (!size) {
      console.warn(`⚠️  Size not found: "${row["Size"]}"`)
      errorCount++
      continue
    }

    if (!print) {
      console.warn(`⚠️  Print not found: "${row["Style"]}"`)
      errorCount++
      continue
    }

    // Find weight by category_id + size_id
    const weight = weights.find((w) => w.category_id === category.id && w.size_id === size.id)

    // Insert product
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .upsert(
        {
          category_id: category.id,
          size_id: size.id,
          weight_id: weight?.id || null,
          product_code: row["Product Code"],
          name: row["Name"],
          length_mm: row["Length (mm)"] ? parseInt(row["Length (mm)"]) : null,
          width_mm: row["Width (mm)"] ? parseInt(row["Width (mm)"]) : null,
          height_mm: row["Height (mm)"] ? parseInt(row["Height (mm)"]) : null,
          isbn: row["ISBN"] || null,
          color: row["Color"] || null,
          brand: row["Brand"] || null,
          base_price: parseFloat(row["Base Price"]) || null,
          cost_price: parseFloat(row["Cost Price"]) || null,
          mrp: parseFloat(row["MRP"]) || null,
          enabled: row["Enabled"]?.toUpperCase() === "TRUE" ? true : row["Enabled"]?.toUpperCase() === "FALSE" ? false : true,
          type: row["Type"] || null,
          hsn_code: row["HSN CODE"] || null,
          material: row["Material"] || null,
        },
        { onConflict: "product_code" }
      )
      .select("id")
      .single()

    if (error) {
      console.error(`❌ Error inserting "${row["Product Code"]}":`, error.message)
      errorCount++
      continue
    }

    // Insert product_prints entry
    const { error: printError } = await supabaseAdmin
      .from("product_prints")
      .upsert(
        {
          product_id: product.id,
          print_id: print.id,
          position: 1,
        },
        { onConflict: "product_id,print_id,position" }
      )

    if (printError) {
      console.error(`❌ Error linking print for "${row["Product Code"]}":`, printError.message)
    }

    successCount++
  }

  console.log(`✅ Products seeding completed! ${successCount} inserted, ${errorCount} errors`)
}
