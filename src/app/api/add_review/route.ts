import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { checkRateLimit } from "@/lib/security";
import { reviewSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "add-review", 12, 60_000);
  if (limited) return limited;

  const auth = await requireUser(request, "buyer");

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const data = parsed.data;

  if (data.reviewed_id === auth.user.id) {
    return apiError("You cannot review your own profile.", 400);
  }

  const { data: farmer } = await auth.supabase
    .from("app_users")
    .select("id, role")
    .eq("id", data.reviewed_id)
    .eq("role", "farmer")
    .maybeSingle();

  if (!farmer) {
    return apiError("Farmer not found.", 404);
  }

  let orderQuery = auth.supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", auth.user.id)
    .eq("farmer_id", data.reviewed_id)
    .eq("status", "delivered");

  if (data.order_id) {
    orderQuery = orderQuery.eq("id", data.order_id);
  }

  const { data: deliveredOrders } = await orderQuery.limit(1);

  if (!deliveredOrders?.length) {
    return apiError("Reviews are available after delivery.", 403);
  }

  const orderId = data.order_id ?? deliveredOrders[0].id;
  const { data: existingReview } = await auth.supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", auth.user.id)
    .eq("order_id", orderId)
    .maybeSingle();

  const reviewPayload = {
    reviewer_id: auth.user.id,
    reviewed_id: data.reviewed_id,
    order_id: orderId,
    rating: data.rating,
    comment: data.comment
  };

  const { error } = existingReview
    ? await auth.supabase.from("reviews").update(reviewPayload).eq("id", existingReview.id)
    : await auth.supabase.from("reviews").insert({ ...reviewPayload, moderation_status: "visible" });

  if (error) {
    return apiError(`Review submission failed: ${error.message}`, 500);
  }

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: existingReview ? "review_updated" : "review_submitted",
    entityType: "review",
    entityId: existingReview?.id ? Number(existingReview.id) : null,
    metadata: { order_id: orderId, farmer_id: data.reviewed_id, rating: data.rating }
  }).catch(() => null);

  return apiOk({
    success: true,
    message: existingReview ? "Review updated successfully." : "Review submitted successfully."
  });
}
