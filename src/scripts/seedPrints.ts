import { readCSV } from "./readCsv";
import { supabaseAdmin } from "../lib/supabase/supabaseAdmin";

// Remove invisible Unicode characters and normalize whitespace
function cleanString(str: string | undefined): string {
  if (!str) return "";
  return str
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "") // Remove zero-width spaces and word joiner
    .trim();
}

export async function seedPrints() {
  const rows = await readCSV("src/scripts/data/print_master.csv");

  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    const printName = cleanString(row["Official Print's Name"]);
    if (!printName) continue;

    const { error } = await supabaseAdmin
      .from("prints_name")
      .upsert(
        {
          official_print_name: printName,
          print_code: cleanString(row["Code"]) || null,
          color: cleanString(row["Color"]) || null,
        },
        {
          onConflict: "official_print_name",
        }
      );

    if (error) {
      console.error(`❌ Error inserting "${printName}":`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`✅ Print names seeded! ${successCount} inserted, ${errorCount} errors`);
}
