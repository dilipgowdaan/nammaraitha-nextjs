import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { schemaMessage, trackingSchema } from "@/lib/validation";

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
  const parsed = trackingSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const isDelivered = parsed.data.tracking_status === "delivered";
  const { error } = await auth.supabase
    .from("orders")
    .update({
      tracking_status: parsed.data.tracking_status,
      tracking_note: parsed.data.tracking_note,
      status: isDelivered ? "delivered" : "paid",
      delivered_timestamp: isDelivered ? new Date().toISOString() : null
    })
    .eq("id", id)
    .eq("farmer_id", auth.user.id);

  if (error) {
    return apiError(`Tracking update failed: ${error.message}`, 500);
  }

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: "order_tracking_updated",
    entityType: "order",
    entityId: id,
    metadata: parsed.data
  }).catch(() => null);

  return apiOk({ success: true, message: "Order tracking updated." });
}
