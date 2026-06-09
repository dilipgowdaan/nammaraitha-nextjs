import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { checkRateLimit } from "@/lib/security";
import { placeOrderSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "place-order", 20, 60_000);
  if (limited) return limited;

  const auth = await requireUser(request, "buyer");

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = placeOrderSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const paymentReference =
    parsed.data.payment_reference ?? `NR-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await auth.supabase.rpc("place_marketplace_order_v2", {
    p_buyer_id: auth.user.id,
    p_farmer_id: parsed.data.farmer_id,
    p_product_id: parsed.data.product_id,
    p_quantity: parsed.data.quantity,
    p_payment_reference: paymentReference,
    p_reservation_id: parsed.data.reservation_id ?? null,
    p_delivery_slot: parsed.data.delivery_slot ?? null
  });

  if (error) {
    return apiError(error.message, 400);
  }

  const result = Array.isArray(data) ? data[0] : data;

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: "order_placed",
    entityType: "order",
    entityId: Number(result?.order_id ?? 0) || null,
    metadata: {
      product_id: parsed.data.product_id,
      farmer_id: parsed.data.farmer_id,
      quantity: parsed.data.quantity,
      reservation_id: parsed.data.reservation_id ?? null,
      delivery_slot: parsed.data.delivery_slot ?? null
    }
  }).catch(() => null);

  return apiOk({
    success: true,
    message: "Order placed successfully.",
    order_id: result?.order_id,
    remaining_quantity: result?.remaining_quantity,
    payment_reference: paymentReference
  });
}
