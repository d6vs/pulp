"use server"

import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import { generateSKU } from "@/app/purchase-orders/types"

// Fixed defaults for bundle item master
const FIXED_DEFAULTS = {
  length_mm: 210,
  width_mm: 180,
  height_mm: 50,
  brand: "Orange Sugar",
  type: "BUNDLE",
  component_quantity: 1,
  tax_calculation_type: "PRICE_OF_BUNDLE_SKU",
}

type IndividualProduct = {
  categoryId: string
  categoryCode: string
  printId: string
  printCode: string
  printName: string
  quantity?: number
}

// Helper function to find product by category, size_name, and print
async function findProductByCategoryAndSizeName(
  categoryId: string,
  sizeName: string,
  printId: string
): Promise<{
  product: {
    id: string
    product_code: string | null
    cost_price: number | null
    mrp: number | null
    base_price: number | null
    length_mm: number | null
    width_mm: number | null
    height_mm: number | null
    brand: string | null
    size_id: string | null
  } | null
  sizeId: string | null
}> {
  const { data: sizeData } = await supabaseAdmin
    .from("sizes")
    .select("id")
    .eq("size_name", sizeName)
    .single()

  if (!sizeData) {
    return { product: null, sizeId: null }
  }

  const sizeId = sizeData.id

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, product_code, cost_price, mrp, base_price, length_mm, width_mm, height_mm, brand, size_id")
    .eq("category_id", categoryId)
    .eq("size_id", sizeId)
    .eq("print_id", printId)

  if (productsError || !products || products.length === 0) {
    return { product: null, sizeId }
  }

  const prod = products[0]
  return {
    product: {
      id: prod.id,
      product_code: prod.product_code ?? null,
      cost_price: prod.cost_price,
      mrp: prod.mrp,
      base_price: prod.base_price,
      length_mm: prod.length_mm,
      width_mm: prod.width_mm,
      height_mm: prod.height_mm,
      brand: prod.brand,
      size_id: prod.size_id,
    },
    sizeId: prod.size_id,
  }
}

// ============================================
// ACTION 1: Generate Bundle Item Master
// Reads from bundle_reference, writes to bundle_item_master
// Fetches latest prices from products table
// ============================================
export async function generateBundleItemMaster(
  bundleCategoryId: string,
  bundleCategoryCode: string,
  individualProducts: IndividualProduct[],
  sizeNames: string[],
  addToBundleItemMaster: boolean = true,
  createReferenceIfMissing: boolean = true // false for /bundle-item-master, true for /master-data
) {
  try {
    const results: { productCode: string; error: string | null; action: "created" | "existed" | "added_to_master" }[] = []

    // Get unique print codes and sort alphabetically for consistent SKU generation
    const printCodeNamePairs: { code: string; name: string }[] = []
    const seenCodes = new Set<string>()

    for (const product of individualProducts) {
      if (product.printCode && !seenCodes.has(product.printCode)) {
        seenCodes.add(product.printCode)
        printCodeNamePairs.push({ code: product.printCode, name: product.printName })
      }
    }

    // Sort by print code to ensure consistent SKU order (BB_PP_RK instead of PP_RK_BB)
    printCodeNamePairs.sort((a, b) => a.code.localeCompare(b.code))

    const uniquePrintCodes = printCodeNamePairs.map((p) => p.code)
    const uniquePrintNames = printCodeNamePairs.map((p) => p.name)

    // Get bundle category details
    const { data: bundleCategory, error: categoryError } = await supabaseAdmin
      .from("product_categories")
      .select("category_code, sku_schema, hsn_code, product_name_prefix, size_in_product_name")
      .eq("id", bundleCategoryId)
      .single()

    if (categoryError || !bundleCategory) {
      return { successCount: 0, errorCount: 0, results: [], error: "We couldn't find that bundle category. Please make sure it exists in Product Setup." }
    }

    const {
      category_code: actualCategoryCode,
      sku_schema: skuSchema,
      hsn_code: hsnCode,
      product_name_prefix: productNamePrefix,
      size_in_product_name: sizeInProductName,
    } = bundleCategory

    if (!actualCategoryCode) {
      return { successCount: 0, errorCount: 0, results: [], error: "This bundle category doesn't have a code set up. Please add a category code in Product Setup." }
    }

    for (const sizeName of sizeNames) {
      // Get size_id for weight lookup
      const { data: bundleSizeData } = await supabaseAdmin
        .from("sizes")
        .select("id")
        .eq("size_name", sizeName)
        .single()

      const bundleSizeId = bundleSizeData?.id || null

      // Get weight for bundle
      const { data: weightData } = await supabaseAdmin
        .from("product_weights")
        .select("weight")
        .eq("category_id", bundleCategoryId)
        .eq("size_id", bundleSizeId)
        .maybeSingle()

      // Fetch individual products' details with latest prices
      let totalCostPrice = 0
      let totalMRP = 0
      let totalBasePrice = 0
      const componentProducts: {
        sku: string        // actual product_code from products table (or generated as fallback)
        mrp: number
        printName: string // internal_style_name
        productData: {
          length_mm: number | null
          width_mm: number | null
          height_mm: number | null
          weight_gms: number | null
          brand: string | null
          hsn_code: string | null
          base_price: number | null
          cost_price: number
          mrp: number
        } | null
      }[] = []

      for (const indProduct of individualProducts) {
        const { data: indCategory } = await supabaseAdmin
          .from("product_categories")
          .select("sku_schema, hsn_code")
          .eq("id", indProduct.categoryId)
          .single()

        // Find the individual product with latest prices
        const { product: foundProduct } = await findProductByCategoryAndSizeName(
          indProduct.categoryId,
          sizeName,
          indProduct.printId
        )

        // Use product_code from products table as component_product_code
        // Fall back to generating SKU from category's sku_schema if not set
        const indSkuSchema = indCategory?.sku_schema || 0
        const indSKU = foundProduct?.product_code
          || generateSKU(indSkuSchema, indProduct.categoryCode, [indProduct.printCode], sizeName)

        let productCostPrice = 0
        let productMRP = 0
        let foundProductData: typeof componentProducts[0]["productData"] = null

        if (foundProduct) {
          productCostPrice = foundProduct.cost_price || 0
          productMRP = foundProduct.mrp || 0

          foundProductData = {
            length_mm: foundProduct.length_mm || null,
            width_mm: foundProduct.width_mm || null,
            height_mm: foundProduct.height_mm || null,
            weight_gms: null,
            brand: foundProduct.brand || null,
            hsn_code: indCategory?.hsn_code || null,
            base_price: foundProduct.base_price || null,
            cost_price: foundProduct.cost_price || 0,
            mrp: foundProduct.mrp || 0,
          }
        }

        const quantity = indProduct.quantity || 1
        totalCostPrice += productCostPrice * quantity
        totalMRP += productMRP * quantity
        totalBasePrice += (foundProduct?.base_price || productMRP) * quantity
        componentProducts.push({ sku: indSKU, mrp: productMRP, printName: indProduct.printName, productData: foundProductData })
      }

      // --- Find existing bundle SKU in reference (order-independent) ---
      // Check if a bundle with ALL these print codes already exists in bundle_reference
      let bundleSKU: string | null = null

      let existingQuery = supabaseAdmin
        .from("bundle_reference")
        .select("product_code")
        .eq("category_code", bundleCategoryCode)
        .eq("size", sizeName)

      for (const code of uniquePrintCodes) {
        existingQuery = existingQuery.ilike("product_code", `%${code}%`)
      }

      const { data: existingEntries } = await existingQuery

      if (existingEntries && existingEntries.length > 0) {
        // Group by product_code and find one where component count matches
        const countMap = new Map<string, number>()
        for (const e of existingEntries) {
          countMap.set(e.product_code, (countMap.get(e.product_code) || 0) + 1)
        }
        for (const [code, count] of countMap) {
          if (count === individualProducts.length) {
            bundleSKU = code
            break
          }
        }
      }

      // If no existing bundle found, generate a new SKU
      if (!bundleSKU) {
        bundleSKU = generateSKU(skuSchema, actualCategoryCode, uniquePrintCodes, sizeName)
      }

      // Generate product name
      let productName = productNamePrefix || `${bundleCategoryCode} | `
      productName += uniquePrintNames.join(", ")
      if (sizeInProductName && sizeName && sizeName !== "Standard") {
        productName += ` ${sizeName}`
      }

      const now = new Date().toISOString()

      // Process each component
      for (const component of componentProducts) {
        // Check if this specific component row exists in reference table
        const { data: referenceData } = await supabaseAdmin
          .from("bundle_reference")
          .select("*")
          .eq("product_code", bundleSKU)
          .eq("component_product_code", component.sku)
          .maybeSingle()

        const prodData = component.productData

        // Build bundle data - always use latest prices from products table
        const bundleData = {
          category_code: referenceData?.category_code || bundleCategoryCode,
          product_code: referenceData?.product_code || bundleSKU,
          name: referenceData?.name || productName,
          length_mm: referenceData?.length_mm || prodData?.length_mm || FIXED_DEFAULTS.length_mm,
          width_mm: referenceData?.width_mm || prodData?.width_mm || FIXED_DEFAULTS.width_mm,
          height_mm: referenceData?.height_mm || prodData?.height_mm || FIXED_DEFAULTS.height_mm,
          weight_gms: weightData?.weight || referenceData?.weight_gms || null,
          brand: referenceData?.brand || prodData?.brand || FIXED_DEFAULTS.brand,
          size: referenceData?.size || sizeName,
          hsn_code: referenceData?.hsn_code || prodData?.hsn_code || hsnCode || null,
          // Always use latest calculated prices
          cost_price: totalCostPrice,
          mrp: totalMRP,
          base_price: totalBasePrice,
          type: referenceData?.type || FIXED_DEFAULTS.type,
          component_product_code: referenceData?.component_product_code || component.sku,
          internal_style_name: referenceData?.internal_style_name || component.printName,
          component_quantity: referenceData?.component_quantity || FIXED_DEFAULTS.component_quantity,
          component_price: component.mrp, // Always use latest MRP
          tax_calculation_type: referenceData?.tax_calculation_type || FIXED_DEFAULTS.tax_calculation_type,
        }

        // Track if reference was created or already existed
        const referenceExisted = !!referenceData

        // Handle bundle_reference creation based on createReferenceIfMissing flag
        if (!referenceData && createReferenceIfMissing) {
          // Create bundle_reference (from /master-data)
          await supabaseAdmin.from("bundle_reference").insert({
            ...bundleData,
            enabled: true,
            created_at: now,
            updated_at: now,
          })
        }

        // Insert into bundle_item_master only if addToBundleItemMaster is true
        if (addToBundleItemMaster) {
          // For /bundle-item-master: if reference doesn't exist and we're not creating it, skip with error
          if (!referenceData && !createReferenceIfMissing) {
            results.push({ productCode: bundleSKU, error: "Bundle not found in reference. Create it first in Product Setup.", action: "added_to_master" })
            continue
          }

          // Transform bundleData for bundle_item_master (uses 'style' instead of 'internal_style_name')
          const { internal_style_name, ...restBundleData } = bundleData
          const { error: insertError } = await supabaseAdmin.from("bundle_item_master").insert({
            ...restBundleData,
            style: internal_style_name,
            scan_type: "SIMPLE",
            created_at: now,
            updated_at: now,
          })

          if (insertError) {
            results.push({ productCode: bundleSKU, error: insertError.message, action: "added_to_master" })
          } else {
            results.push({ productCode: bundleSKU, error: null, action: "added_to_master" })
          }
        } else {
          // Only creating bundle_reference (checkbox unchecked in /master-data)
          if (referenceExisted) {
            results.push({ productCode: bundleSKU, error: "Already exists in reference", action: "existed" })
          } else {
            results.push({ productCode: bundleSKU, error: null, action: "created" })
          }
        }
      }
    }

    const successCount = results.filter((r) => !r.error).length
    const errorCount = results.filter((r) => r.error).length
    const createdCount = results.filter((r) => r.action === "created" && !r.error).length
    const existedCount = results.filter((r) => r.action === "existed").length
    const addedToMasterCount = results.filter((r) => r.action === "added_to_master" && !r.error).length

    return { successCount, errorCount, createdCount, existedCount, addedToMasterCount, results, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { successCount: 0, errorCount: 0, createdCount: 0, existedCount: 0, addedToMasterCount: 0, results: [], error: "Something went wrong while creating the bundle. Please try again." }
  }
}

// ============================================
// ACTION 2: Get Bundle Item Master
// ============================================
export async function getBundleItemMaster(_date?: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bundle_item_master")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bundle item master:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { data: null, error: "Unable to load bundle items. Please refresh the page and try again." }
  }
}

// ============================================
// ACTION 3: Delete Bundle Item Master by Date
// ============================================
export async function deleteBundleItemMasterByDate(_date?: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bundle_item_master")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select()

    if (error) {
      console.error("Error deleting bundle item master:", error)
      return { deletedCount: 0, error: error.message }
    }

    return { deletedCount: data?.length || 0, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { deletedCount: 0, error: "Unable to delete items. Please try again." }
  }
}

// ============================================
// ACTION 5: Add Bundles to Item Master from Reference Data
// Uses already-found reference data directly - no SKU regeneration needed
// ============================================
export async function addBundlesToItemMasterFromReference(
  existingBundles: BundleReferenceData[],
  individualProducts: {
    categoryId: string
    categoryCode: string
    printId: string
    printCode: string
    printName: string
    quantity?: number
  }[],
  bundleCategoryId: string
) {
  try {
    const results: { productCode: string; error: string | null }[] = []
    const now = new Date().toISOString()

    for (const bundle of existingBundles) {
      // Calculate total prices from products table (for latest prices)
      let totalCostPrice = 0
      let totalMRP = 0
      let totalBasePrice = 0

      // Fetch latest prices for each component
      for (const indProduct of individualProducts) {
        const { product: foundProduct } = await findProductByCategoryAndSizeName(
          indProduct.categoryId,
          bundle.sizeName,
          indProduct.printId
        )

        if (foundProduct) {
          const quantity = indProduct.quantity || 1
          totalCostPrice += (foundProduct.cost_price || 0) * quantity
          totalMRP += (foundProduct.mrp || 0) * quantity
          totalBasePrice += (foundProduct.base_price || foundProduct.mrp || 0) * quantity
        }
      }

      // Fetch bundle weight from product_weights using bundle category + size
      const { data: bundleSizeData } = await supabaseAdmin
        .from("sizes")
        .select("id")
        .eq("size_name", bundle.sizeName)
        .single()

      const { data: bundleWeightData } = await supabaseAdmin
        .from("product_weights")
        .select("weight")
        .eq("category_id", bundleCategoryId)
        .eq("size_id", bundleSizeData?.id)
        .maybeSingle()

      const bundleWeight = bundleWeightData?.weight || null

      // Insert each component from reference data
      for (const component of bundle.components) {
        // Find matching individual product to get latest component_price
        // Match using BOTH print code AND category code to ensure correct matching
        const matchingProduct = individualProducts.find(
          (p) =>
            component.component_product_code?.includes(p.printCode) &&
            component.component_product_code?.includes(p.categoryCode)
        )
        let componentPrice = component.component_price || 0

        if (matchingProduct) {
          const { product: foundProduct } = await findProductByCategoryAndSizeName(
            matchingProduct.categoryId,
            bundle.sizeName,
            matchingProduct.printId
          )
          if (foundProduct?.mrp) {
            componentPrice = foundProduct.mrp
          }
        }

        const { error: insertError } = await supabaseAdmin.from("bundle_item_master").insert({
          category_code: component.category_code,
          product_code: component.product_code,
          name: component.name,
          length_mm: component.length_mm,
          width_mm: component.width_mm,
          height_mm: component.height_mm,
          weight_gms: bundleWeight || component.weight_gms,
          brand: component.brand,
          size: component.size,
          hsn_code: component.hsn_code,
          cost_price: totalCostPrice,
          mrp: totalMRP,
          base_price: totalBasePrice,
          type: component.type,
          component_product_code: component.component_product_code,
          style: component.internal_style_name,
          component_quantity: component.component_quantity,
          component_price: componentPrice,
          tax_calculation_type: component.tax_calculation_type,
          scan_type: "SIMPLE",
          created_at: now,
          updated_at: now,
        })

        if (insertError) {
          results.push({ productCode: bundle.productCode, error: insertError.message })
        } else {
          results.push({ productCode: bundle.productCode, error: null })
        }
      }
    }

    const successCount = results.filter((r) => !r.error).length
    const errorCount = results.filter((r) => r.error).length

    return { successCount, errorCount, addedToMasterCount: successCount, results, error: null }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { successCount: 0, errorCount: 0, addedToMasterCount: 0, results: [], error: "Something went wrong while adding items. Please try again." }
  }
}

// Type for bundle reference data
export type BundleReferenceData = {
  productCode: string
  sizeName: string
  components: {
    id: string
    category_code: string | null
    product_code: string
    name: string | null
    length_mm: number | null
    width_mm: number | null
    height_mm: number | null
    weight_gms: number | null
    brand: string | null
    size: string | null
    hsn_code: string | null
    cost_price: number | null
    mrp: number | null
    base_price: number | null
    type: string | null
    component_product_code: string | null
    internal_style_name: string | null
    component_quantity: number | null
    component_price: number | null
    tax_calculation_type: string | null
  }[]
}

// ============================================
// ACTION 4: Check if Bundle Exists in Reference
// Simple logic: Filter by category + size, then check if product_code contains all print codes
// Returns full reference data so we can use it directly without regenerating SKUs
// ============================================
export async function checkBundleExistsInReference(
  bundleCategoryName: string,
  individualProducts: {
    categoryName: string
    categoryCode: string
    printName: string
    printCode: string
    quantity?: number
  }[],
  sizeNames: string[]
) {
  try {
    // Get unique print codes from user's selection (for ILIKE filters)
    const uniquePrints = new Map<string, string>()
    for (const product of individualProducts) {
      if (!uniquePrints.has(product.printCode)) {
        uniquePrints.set(product.printCode, product.printName)
      }
    }
    const uniquePrintCodes = [...uniquePrints.keys()]
    const uniquePrintNames = [...uniquePrints.values()]

    // Number of products selected (for component count comparison)
    // This handles cases like "Sweatshirt & Joggers" where both use same print
    // Note: We compare row count, not sum of quantities
    const totalProductsSelected = individualProducts.length

    console.log("=== Bundle Reference Check ===")
    console.log("Bundle Category Name:", bundleCategoryName)
    console.log("Unique Print Codes:", uniquePrintCodes)
    console.log("Total Products Selected:", totalProductsSelected)
    console.log("Size Names:", sizeNames)

    const missingBundles: string[] = []
    const existingBundles: BundleReferenceData[] = []

    for (const sizeName of sizeNames) {
      // Step 1: Build query with filters for category, size, AND all print codes
      // Fetch ALL columns so we can use this data directly
      let query = supabaseAdmin
        .from("bundle_reference")
        .select("*")
        .eq("category_code", bundleCategoryName)
        .eq("size", sizeName)

      // Add ILIKE filter for each print code
      // This ensures product_code contains ALL user's print codes
      for (const printCode of uniquePrintCodes) {
        query = query.ilike("product_code", `%${printCode}%`)
      }

      const { data: bundleEntries } = await query

      const bundleDisplay = `${bundleCategoryName} | ${uniquePrintNames.join(", ")} | ${sizeName}`

      if (!bundleEntries || bundleEntries.length === 0) {
        console.log(`✗ No bundle found with prints [${uniquePrintCodes.join(", ")}] for size ${sizeName}`)
        missingBundles.push(bundleDisplay)
        continue
      }

      // Step 2: Group entries by product_code
      const productCodeGroups = new Map<string, typeof bundleEntries>()
      for (const entry of bundleEntries) {
        const existing = productCodeGroups.get(entry.product_code) || []
        existing.push(entry)
        productCodeGroups.set(entry.product_code, existing)
      }

      // Step 3: Find bundle where component count matches total products selected
      // (number of products, not sum of quantities)
      let foundBundle: BundleReferenceData | null = null

      for (const [productCode, components] of productCodeGroups) {
        // Component count must match total products selected
        if (components.length === totalProductsSelected) {
          foundBundle = {
            productCode,
            sizeName,
            components,
          }
          console.log(`✓ Found matching bundle: ${productCode}`)
          break
        }
      }

      if (foundBundle) {
        existingBundles.push(foundBundle)
      } else {
        console.log(`✗ No exact match for prints [${uniquePrintCodes.join(", ")}] for size ${sizeName}`)
        missingBundles.push(bundleDisplay)
      }
    }

    return {
      exists: missingBundles.length === 0,
      existingBundles,
      missingBundles,
      error: null,
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { exists: false, existingBundles: [], missingBundles: [], error: "Unable to check if this bundle exists. Please try again." }
  }
}
