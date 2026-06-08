import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { schemaMessage, updateOrderSchema } from "@/lib/validation";

type Params = { params: Promise<{ orderId: string }> };

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: Params) {
  const auth = await requireUser(request, "farmer");

  if ("error" in auth) {
    return auth.error;
  }

  const { orderId } = await context.params;
  const id = Number(orderId);

  if (!Number.isFinite(id)) {
    return apiError("Invalid order id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateOrderSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const updates =
    parsed.data.status === "delivered"
      ? { status: "delivered", delivered_timestamp: new Date().toISOString() }
      : { status: parsed.data.status, delivered_timestamp: null };

  const { error } = await auth.supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .eq("farmer_id", auth.user.id);

  if (error) {
    return apiError(`Failed to update order status: ${error.message}`, 500);
  }

  return apiOk({ success: true, message: `Order status set to ${parsed.data.status}.` });
}
