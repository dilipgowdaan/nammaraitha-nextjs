import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { cancelOrderSchema, schemaMessage } from "@/lib/validation";

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
  const parsed = cancelOrderSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const { data, error } = await auth.supabase.rpc("cancel_marketplace_order", {
    p_order_id: id,
    p_farmer_id: auth.user.id,
    p_cancelled_by: auth.user.id,
    p_cancel_reason: parsed.data.cancel_reason
  });

  if (error) {
    return apiError(error.message, 400);
  }

  const result = Array.isArray(data) ? data[0] : data;

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: "order_cancelled",
    entityType: "order",
    entityId: id,
    metadata: {
      cancel_reason: parsed.data.cancel_reason,
      cancelled_at: result?.cancelled_at ?? new Date().toISOString()
    }
  }).catch(() => null);

  return apiOk({
    success: true,
    message: "Order cancelled and stock restored.",
    order_id: id,
    cancelled_at: result?.cancelled_at
  });
}
