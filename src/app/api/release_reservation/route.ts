import type { NextRequest } from "next/server";
import { apiOk, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { checkRateLimit } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "release-reservation", 40, 60_000);
  if (limited) return limited;

  const auth = await requireUser(request, "buyer");

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => ({}));
  const reservationId = Number(body?.reservation_id);

  if (Number.isFinite(reservationId) && reservationId > 0) {
    await auth.supabase.rpc("release_inventory_reservation", {
      p_buyer_id: auth.user.id,
      p_reservation_id: reservationId
    });
    await logAudit({
      supabase: auth.supabase,
      actor: auth.user,
      action: "inventory_reservation_released",
      entityType: "reservation",
      entityId: reservationId
    }).catch(() => null);
  }

  return apiOk({ success: true, message: "Reservation released." });
}
