import { parse } from "csv-parse/sync"
import * as fs from "fs"
import * as path from "path"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

type BundleReferenceRow = {
  "Category Code"?: string
  "Product Code"?: string
  "Name"?: string
  "Length (mm)"?: string
  "Width (mm)"?: string
  "Height (mm)"?: string
  "Weight (gms)"?: string
  "ISBN"?: string
  "Color"?: string
  "Size"?: string
  "Brand"?: string
  "Base Price"?: string
  "Cost Price"?: string
  "MRP"?: string
  "Enabled"?: string
  "Type"?: string
  "Component Product Code"?: string
  "Internal Style Name"?: string
  "Component Quantity"?: string
  "Component Price"?: string
  "HSN CODE"?: string
  "Tax Calculation Type"?: string
  "Material"?: string
}

// Seeds the bundle_reference table from CSV
async function seedBundleReference() {
  console.log("🌱 Seeding Bundle Reference Table...\n")

  // Delete all existing records first
  console.log("🗑️ Clearing existing bundle_reference data...")
  const { error: deleteError } = await supabaseAdmin
    .from("bundle_reference")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all rows

  if (deleteError) {
    console.error("❌ Error clearing table:", deleteError.message)
    return
  }
  console.log("✓ Table cleared\n")

  console.log("📦 Reading CSV file...")

  const csvPath = path.join(__dirname, "data", "Bundle Item Master.csv")
  const csvContent = fs.readFileSync(csvPath, "utf-8")

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  console.log(`Found ${records.length} bundle reference rows`)

  let successCount = 0
  let errorCount = 0
  const now = new Date().toISOString()

  // Batch insert for better performance
  const BATCH_SIZE = 100
  const batches: typeof records[] = []

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE))
  }

  console.log(`Processing ${batches.length} batches of ${BATCH_SIZE} records each...`)

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const insertData = (batch as BundleReferenceRow[]).map((row) => ({
      category_code: row["Category Code"] || null,
      product_code: row["Product Code"] || null,
      name: row["Name"] || null,
      length_mm: row["Length (mm)"] ? parseFloat(row["Length (mm)"]) : null,
      width_mm: row["Width (mm)"] ? parseFloat(row["Width (mm)"]) : null,
      height_mm: row["Height (mm)"] ? parseFloat(row["Height (mm)"]) : null,
      weight_gms: row["Weight (gms)"] ? parseFloat(row["Weight (gms)"]) : null,
      isbn: row["ISBN"] || null,
      color: row["Color"] || null,
      size: row["Size"] || null,
      brand: row["Brand"] || null,
      base_price: row["Base Price"] ? parseFloat(row["Base Price"]) : null,
      cost_price: row["Cost Price"] ? parseFloat(row["Cost Price"]) : null,
      mrp: row["MRP"] ? parseFloat(row["MRP"]) : null,
      enabled: row["Enabled"]?.toUpperCase() === "TRUE" ? true : row["Enabled"]?.toUpperCase() === "FALSE" ? false : null,
      type: row["Type"] || null,
      component_product_code: row["Component Product Code"] || null,
      internal_style_name: row["Internal Style Name"] || null,
      component_quantity: row["Component Quantity"] ? parseInt(row["Component Quantity"]) : null,
      component_price: row["Component Price"] ? parseFloat(row["Component Price"]) : null,
      hsn_code: row["HSN CODE"] || null,
      tax_calculation_type: row["Tax Calculation Type"] || null,
      material: row["Material"] || null,
      created_at: now,
      updated_at: now,
    }))

    const { error } = await supabaseAdmin.from("bundle_reference").insert(insertData)

    if (error) {
      console.error(`❌ Error inserting batch ${batchIndex + 1}:`, error.message)
      errorCount += batch.length
    } else {
      successCount += batch.length
      console.log(`✓ Batch ${batchIndex + 1}/${batches.length} inserted (${successCount} total)`)
    }
  }

  console.log(`\n✅ Bundle Reference seeding completed! ${successCount} inserted, ${errorCount} errors`)
}

// Run the seed
seedBundleReference()
  .then(() => {
    console.log("\n✅ Done!")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Fatal error:", err)
    process.exit(1)
  })
