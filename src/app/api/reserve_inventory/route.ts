import type { NextRequest } from "next/server";
import { apiError, apiOk, numberFrom, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { checkRateLimit } from "@/lib/security";
import { reservationSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "reserve-inventory", 20, 60_000);
  if (limited) return limited;

  const auth = await requireUser(request, "buyer");

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = reservationSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const { data, error } = await auth.supabase.rpc("create_inventory_reservation", {
    p_buyer_id: auth.user.id,
    p_farmer_id: parsed.data.farmer_id,
    p_product_id: parsed.data.product_id,
    p_quantity: parsed.data.quantity,
    p_ttl_minutes: 10
  });

  if (error) {
    return apiError(error.message, 400);
  }

  const reservation = Array.isArray(data) ? data[0] : data;
  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: "inventory_reserved",
    entityType: "product",
    entityId: parsed.data.product_id,
    metadata: { quantity: parsed.data.quantity, reservation_id: numberFrom(reservation?.reservation_id) }
  }).catch(() => null);

  return apiOk({
    success: true,
    reservation_id: numberFrom(reservation?.reservation_id),
    expires_at: reservation?.expires_at,
    available_quantity: numberFrom(reservation?.available_quantity)
  });
}
