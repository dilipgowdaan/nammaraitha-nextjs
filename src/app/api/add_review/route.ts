import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { reviewSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

  const { error } = await auth.supabase.from("reviews").insert({
    reviewer_id: auth.user.id,
    reviewed_id: data.reviewed_id,
    order_id: data.order_id ?? deliveredOrders[0].id,
    rating: data.rating,
    comment: data.comment
  });

  if (error) {
    return apiError(`Review submission failed: ${error.message}`, 500);
  }

  return apiOk({ success: true, message: "Review submitted successfully." });
}
