import type { NextRequest } from "next/server";
import { apiError, apiOk, numberFrom, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { schemaMessage, trackingSchema } from "@/lib/validation";

type Params = { params: Promise<{ orderId: string }> };

export const runtime = "nodejs";

const trackingSteps = ["order_placed", "packed", "out_for_delivery", "delivered"] as const;

const defaultNotes: Record<(typeof trackingSteps)[number], string> = {
  order_placed: "Order placed successfully.",
  packed: "Farmer packed the order.",
  out_for_delivery: "Farmer has started delivery.",
  delivered: "Order delivered to the customer."
};

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

  const { data: order, error: orderError } = await auth.supabase
    .from("orders")
    .select("id, status, tracking_status")
    .eq("id", id)
    .eq("farmer_id", auth.user.id)
    .maybeSingle();

  if (orderError) {
    return apiError(`Tracking update failed: ${orderError.message}`, 500);
  }

  if (!order) {
    return apiError("Order not found.", 404);
  }

  if (order.status === "cancelled") {
    return apiError("Cancelled orders cannot be updated.", 400);
  }

  if (order.status === "delivered") {
    return apiError("Delivered orders are already complete.", 400);
  }

  const currentIndex = Math.max(0, trackingSteps.indexOf(order.tracking_status ?? "order_placed"));
  const requestedIndex = trackingSteps.indexOf(parsed.data.tracking_status);

  if (requestedIndex !== currentIndex + 1) {
    return apiError("Update the order one tracking step at a time.", 400);
  }

  const isDelivered = parsed.data.tracking_status === "delivered";
  const updatedAt = new Date().toISOString();
  const trackingNote = parsed.data.tracking_note || defaultNotes[parsed.data.tracking_status];
  const { error } = await auth.supabase
    .from("orders")
    .update({
      tracking_status: parsed.data.tracking_status,
      tracking_note: trackingNote,
      status: isDelivered ? "delivered" : "paid",
      delivered_timestamp: isDelivered ? updatedAt : null
    })
    .eq("id", id)
    .eq("farmer_id", auth.user.id);

  if (error) {
    return apiError(`Tracking update failed: ${error.message}`, 500);
  }

  const { error: eventError } = await auth.supabase.from("order_tracking_events").insert({
    order_id: id,
    status: parsed.data.tracking_status,
    note: trackingNote,
    actor_id: auth.user.id,
    actor_role: "farmer",
    created_at: updatedAt
  });

  if (eventError) {
    return apiError(`Tracking event failed: ${eventError.message}`, 500);
  }

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: "order_tracking_updated",
    entityType: "order",
    entityId: id,
    metadata: {
      ...parsed.data,
      tracking_note: trackingNote,
      updated_at: updatedAt
    }
  }).catch(() => null);

  return apiOk({
    success: true,
    message: "Order tracking updated.",
    order_id: numberFrom(order.id),
    tracking_status: parsed.data.tracking_status,
    updated_at: updatedAt
  });
}
