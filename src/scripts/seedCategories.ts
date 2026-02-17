import { readCSV } from "./readCsv"
import { supabaseAdmin } from "../lib/supabase/supabaseAdmin"

export async function seedCategories() {
  const rows = await readCSV("src/scripts/data/categories.csv")

  console.log(`📖 Found ${rows.length} categories in CSV`)

  let successCount = 0
  let errorCount = 0

  for (const row of rows) {
    // Extract number from "Type X" format
    const schemaType = parseInt(row["Schema Type"]?.replace("Type ", "")) || 0

    // Get product name prefix from "Product Name - Conditions 1"
    const productNamePrefix = row["Product Name - Conditions 1"]?.trim() || null

    // Check if "Product Name Condition 3" contains "Size" to determine size_in_product_name
    const condition3 = row["Product Name Condition 3"] || ""
    const sizeInProductName = condition3.toLowerCase().includes("size")

    const { error } = await supabaseAdmin
      .from("product_categories")
      .upsert(
        {
          category_name: row["Category Name"],
          category_code: row["Category Code"] || null,
          sku_schema: schemaType,
          hsn_code: row["HSN"] || null,
          category_type: row["Category Type"]?.trim() || null,
          product_name_prefix: productNamePrefix,
          size_in_product_name: sizeInProductName,
        },
        { onConflict: "category_name" }
      )

    if (error) {
      console.error(`❌ Error inserting "${row["Category Name"]}":`, error.message)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`✅ Categories seeding completed! ${successCount} inserted, ${errorCount} errors`)
}
