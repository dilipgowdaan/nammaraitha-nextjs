import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";

type Params = { params: Promise<{ productId: string }> };

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: Params) {
  const auth = await requireUser(request, "farmer");

  if ("error" in auth) {
    return auth.error;
  }

  const { productId } = await context.params;
  const id = Number(productId);

  if (!Number.isFinite(id)) {
    return apiError("Invalid product id.", 400);
  }

  const { error } = await auth.supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("farmer_id", auth.user.id);

  if (error) {
    return apiError(`Product delete failed: ${error.message}`, 500);
  }

  return apiOk({ success: true, message: "Product deleted." });
}
