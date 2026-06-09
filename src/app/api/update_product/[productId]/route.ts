import type { NextRequest } from "next/server";
import { apiError, apiOk, normalizeProduct, requireUser } from "@/lib/api";
import { productUpdateSchema, schemaMessage } from "@/lib/validation";

type Params = { params: Promise<{ productId: string }> };

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: Params) {
  const auth = await requireUser(request, "farmer");

  if ("error" in auth) {
    return auth.error;
  }

  const { productId } = await context.params;
  const id = Number(productId);

  if (!Number.isFinite(id)) {
    return apiError("Invalid product id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = {};
  const hasField = (field: string) => Boolean(body && typeof body === "object" && field in body);

  if (data.name) updates.name = data.name;
  if (data.description) updates.description = data.description;
  if (typeof data.market_price === "number") updates.market_price = data.market_price;
  if (typeof data.price === "number") updates.discount_price = data.price;
  if (typeof data.quantity === "number") updates.quantity = data.quantity;
  if (data.unit) updates.unit = data.unit;
  if (data.growth_method) updates.growth_method = data.growth_method;
  if (hasField("image_gallery")) updates.image_gallery = [...new Set(data.image_gallery ?? [])];
  if (hasField("category") && data.category) updates.category = data.category;
  if (hasField("harvest_date") && typeof data.harvest_date === "string") updates.harvest_date = data.harvest_date || null;
  if (hasField("is_featured") && typeof data.is_featured === "boolean") updates.is_featured = data.is_featured;

  let result = await auth.supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .eq("farmer_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (result.error?.message.includes("schema cache")) {
    const baseUpdates = { ...updates };
    delete baseUpdates.category;
    delete baseUpdates.harvest_date;
    delete baseUpdates.is_featured;
    delete baseUpdates.image_gallery;

    result = await auth.supabase
      .from("products")
      .update(baseUpdates)
      .eq("id", id)
      .eq("farmer_id", auth.user.id)
      .select("*")
      .maybeSingle();
  }

  if (result.error || !result.data) {
    return apiError("Product not found or update failed.", 404);
  }

  return apiOk({
    success: true,
    message: "Product updated.",
    product: normalizeProduct(result.data)
  });
}
