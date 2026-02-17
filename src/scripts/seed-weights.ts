import { createReadStream } from "fs"
import parse from "csv-parser"
import { supabaseAdmin } from "../lib/supabase/supabaseAdmin"
import path from "path"

type WeightRow = {
  category: string
  size: string
  weight: string
}

export async function seedWeights() {
  const weights: Array<{
    category: string
    size: string
    weight: number
  }> = []

  const csvPath = path.join(process.cwd(), "src", "scripts", "data", "product_weights.csv")

  console.log("📖 Reading weights from CSV...")

  await new Promise<void>((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(parse())
      .on("data", (row: WeightRow) => {
        weights.push({
          category: row.category,
          size: row.size,
          weight: parseInt(row.weight),
        })
      })
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error))
  })

  console.log(`✅ Found ${weights.length} weight records in CSV`)

  // Fetch all categories
  const { data: categories, error: categoryError } = await supabaseAdmin
    .from("product_categories")
    .select("id, category_name")

  if (categoryError) {
    console.error("❌ Error fetching categories:", categoryError.message)
    return
  }

  console.log(`✅ Loaded ${categories.length} categories from database`)

  // Fetch all sizes
  const { data: sizes, error: sizeError } = await supabaseAdmin.from("sizes").select("id, size_name")

  if (sizeError) {
    console.error("❌ Error fetching sizes:", sizeError.message)
    return
  }

  console.log(`✅ Loaded ${sizes.length} sizes from database`)

  // Process each weight record
  let successCount = 0
  let errorCount = 0
  let notFoundCount = 0

  for (const weight of weights) {
    // Find matching category
    const category = categories.find((c) => c.category_name === weight.category)
    if (!category) {
      console.warn(`⚠️  Category not found: ${weight.category}`)
      notFoundCount++
      continue
    }

    // Find matching size
    const size = sizes.find((s) => s.size_name === weight.size)
    if (!size) {
      console.warn(`⚠️  Size not found: ${weight.size}`)
      notFoundCount++
      continue
    }

    // Insert or update weight record
    const { error } = await supabaseAdmin
      .from("product_weights")
      .upsert(
        {
          category_id: category.id,
          size_id: size.id,
          weight: weight.weight,
        },
        { onConflict: "category_id,size_id" }
      )

    if (error) {
      console.error(`❌ Error inserting weight for ${weight.category} - ${weight.size}:`, error.message)
      errorCount++
    } else {
      successCount++
      console.log(`✅ Inserted/Updated: ${weight.category} - ${weight.size} (${weight.weight}g)`)
    }
  }

  console.log("\n📊 Summary:")
  console.log(`✅ Successfully inserted/updated: ${successCount}`)
  if (errorCount > 0) console.log(`❌ Errors: ${errorCount}`)
  if (notFoundCount > 0) console.log(`⚠️  Not found (category/size): ${notFoundCount}`)
  console.log("\n✅ Weight seeding completed!")
}

