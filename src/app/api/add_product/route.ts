import type { NextRequest } from "next/server";
import { apiError, apiOk, normalizeProduct, requireUser } from "@/lib/api";
import { defaultProductImage } from "@/lib/productCatalog";
import { productSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request, "farmer");

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const data = parsed.data;
  const baseProduct = {
    farmer_id: auth.user.id,
    name: data.name,
    description: data.description,
    market_price: data.market_price,
    discount_price: data.price,
    quantity: data.quantity,
    unit: data.unit,
    growth_method: data.growth_method,
    image_path: data.image_value || defaultProductImage
  };
  const enhancedProduct = {
    ...baseProduct,
    category: data.category,
    harvest_date: data.harvest_date || null,
    is_featured: data.is_featured
  };

  let result = await auth.supabase
    .from("products")
    .insert(enhancedProduct)
    .select("*")
    .single();

  if (result.error?.message.includes("schema cache")) {
    result = await auth.supabase.from("products").insert(baseProduct).select("*").single();
  }

  if (result.error) {
    return apiError(`Error adding product: ${result.error.message}`, 500);
  }

  return apiOk({
    success: true,
    message: "Product added successfully.",
    product: normalizeProduct(result.data)
  });
}
