import { supabaseAdmin } from "../lib/supabase/supabaseAdmin"
import { seedCategories } from "./seedCategories"
import { seedPrints } from "./seedPrints"
import { seedSizes } from "./seedSizes"
import { seedWeights } from "./seed-weights"
import { seedProducts } from "./seedProducts"

async function deleteAllData() {
  console.log("🗑️  Deleting all existing data...\n")

  // Delete in reverse order to respect foreign key constraints
  console.log("  Deleting products...")
  await supabaseAdmin.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  console.log("  Deleting product_weights...")
  await supabaseAdmin.from("product_weights").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  console.log("  Deleting sizes...")
  await supabaseAdmin.from("sizes").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  console.log("  Deleting prints_name...")
  await supabaseAdmin.from("prints_name").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  console.log("  Deleting product_categories...")
  await supabaseAdmin.from("product_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  console.log("\n✅ All data deleted!\n")
}

async function run() {
  console.log("🌱 Seeding database...\n")

  await deleteAllData()
  await seedCategories()
  await seedPrints()
  await seedSizes()
  await seedWeights()
  await seedProducts()

  console.log("\n✅ All seeding completed!")
  process.exit(0)
}

run()
