import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
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
      ? {
          status: "delivered",
          delivered_timestamp: new Date().toISOString(),
          tracking_status: "delivered",
          tracking_note: "Order delivered to the customer."
        }
      : parsed.data.status === "cancelled"
      ? {
          status: "cancelled",
          delivered_timestamp: null,
          tracking_status: "cancelled",
          tracking_note: parsed.data.cancel_reason,
          cancel_reason: parsed.data.cancel_reason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: auth.user.id
        }
      : { status: parsed.data.status, delivered_timestamp: null };

  const { error } = await auth.supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .eq("farmer_id", auth.user.id);

  if (error) {
    return apiError(`Failed to update order status: ${error.message}`, 500);
  }

  if (parsed.data.status === "delivered" || parsed.data.status === "cancelled") {
    await auth.supabase.from("order_tracking_events").insert({
      order_id: id,
      status: parsed.data.status,
      note:
        parsed.data.status === "cancelled"
          ? parsed.data.cancel_reason || "Order cancelled by farmer."
          : "Order delivered to the customer.",
      actor_id: auth.user.id,
      actor_role: "farmer"
    });
  }

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: `order_${parsed.data.status}`,
    entityType: "order",
    entityId: id,
    metadata: parsed.data
  }).catch(() => null);

  return apiOk({ success: true, message: `Order status set to ${parsed.data.status}.` });
}
