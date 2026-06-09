import type { NextRequest } from "next/server";
import { apiOk, numberFrom, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if ("error" in auth) {
    return auth.error;
  }

  const { data: reviews, error } = await auth.supabase
    .from("reviews")
    .select("*")
    .eq("reviewer_id", auth.user.id)
    .order("id", { ascending: false });

  if (error || !reviews?.length) {
    return apiOk([]);
  }

  const reviewedIds = [...new Set(reviews.map((review) => numberFrom(review.reviewed_id)))];
  const { data: reviewedUsers } = await auth.supabase
    .from("app_users")
    .select("id, username")
    .in("id", reviewedIds);

  const reviewedMap = new Map(
    (reviewedUsers ?? []).map((user) => [numberFrom(user.id), user.username])
  );

  return apiOk(
    reviews.map((review) => ({
      id: numberFrom(review.id),
      reviewer_id: numberFrom(review.reviewer_id),
      reviewed_id: numberFrom(review.reviewed_id),
      reviewed_username: reviewedMap.get(numberFrom(review.reviewed_id)) ?? "Farmer",
      order_id: review.order_id ? numberFrom(review.order_id) : null,
      rating: numberFrom(review.rating),
      comment: String(review.comment ?? ""),
      moderation_status: review.moderation_status ?? "visible",
      created_at: review.created_at
    }))
  );
}
