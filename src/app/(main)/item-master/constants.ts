// Column order matching the Unicommerce export format
export const ITEM_MASTER_COLUMNS = [
  "category_code", "product_code", "name", "description", "scan_identifier",
  "length_mm", "width_mm", "height_mm", "weight_gms", "ean", "upc", "isbn",
  "color", "brand", "size", "requires_customization", "min_order_size",
  "tax_type_code", "gst_tax_type_code", "hsn_code", "tags", "tat",
  "image_url", "product_page_url", "item_detail_fields", "cost_price", "mrp",
  "base_price", "enabled", "resync_inventory", "type", "scan_type",
  "component_product_code", "component_quantity", "component_price",
  "batch_group_code", "dispatch_expiry_tolerance", "shelf_life",
  "tax_calculation_type", "expirable", "determine_expiry_from",
  "grn_expiry_tolerance", "return_expiry_tolerance", "expiry_date",
  "sku_type", "material", "style"
] as const

// CSV-friendly header names
export const ITEM_MASTER_HEADERS = [
  "Category Code*", "Product Code*", "Name*", "Description", "Scan Identifier",
  "Length (mm)", "Width (mm)", "height (mm)", "Weight (gms)", "ean", "upc", "isbn",
  "color", "brand", "size", "Requires Customization", "Min Order Size",
  "Tax Type Code", "GST Tax Type Code", "HSN Code", "Tags", "TAT",
  "Image Url", "Product Page URL", "Item Detail Fields", "Cost Price", "MRP",
  "Base Price", "Enabled", "Resync Inventory", "Type", "Scan Type",
  "Component Product Code", "Component Quantity", "Component Price",
  "Batch Group Code", "Dispatch Expiry Tolerance", "Shelf Life",
  "Tax Calculation Type", "Expirable", "Determine Expiry From",
  "grn Expiry Tolerance", "Return Expiry Tolerance", "Expiry Date as dd/MM/yyyy",
  "Sku Type", "Material", "Style"
]
