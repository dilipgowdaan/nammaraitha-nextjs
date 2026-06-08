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
  const { data: product, error } = await auth.supabase
    .from("products")
    .insert({
      farmer_id: auth.user.id,
      name: data.name,
      description: data.description,
      market_price: data.market_price,
      discount_price: data.price,
      quantity: data.quantity,
      unit: data.unit,
      growth_method: data.growth_method,
      image_path: data.image_value || defaultProductImage,
      category: data.category,
      harvest_date: data.harvest_date || null,
      is_featured: data.is_featured
    })
    .select("*")
    .single();

  if (error) {
    return apiError(`Error adding product: ${error.message}`, 500);
  }

  return apiOk({
    success: true,
    message: "Product added successfully.",
    product: normalizeProduct(product)
  });
}
