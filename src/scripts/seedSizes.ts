import { createReadStream } from "fs"
import parse from "csv-parser"
import { supabaseAdmin } from "../lib/supabase/supabaseAdmin"
import path from "path"

type SizeRow = {
  size_name: string
}

export async function seedSizes() {
  const sizes: Array<{
    size_name: string
  }> = []

  const csvPath = path.join(process.cwd(), "src", "scripts", "data", "sizes.csv")

  console.log("📖 Reading sizes from CSV...")

  await new Promise<void>((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(parse())
      .on("data", (row: SizeRow) => {
        sizes.push({
          size_name: row.size_name,
        })
      })
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error))
  })

  console.log(`✅ Found ${sizes.length} sizes in CSV`)

  for (const size of sizes) {
    const { error } = await supabaseAdmin
      .from("sizes")
      .upsert(
        {
          size_name: size.size_name,
        },
        { onConflict: "size_name" }
      )

    if (error) {
      console.error(`❌ Error inserting size "${size.size_name}":`, error.message)
    } else {
      console.log(`✅ Inserted/Updated: ${size.size_name}`)
    }
  }

  console.log("✅ Size seeding completed!")
}

