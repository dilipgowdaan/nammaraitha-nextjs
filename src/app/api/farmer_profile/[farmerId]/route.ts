import { apiError, apiOk, normalizeProduct, normalizeUser, numberFrom } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ farmerId: string }> };

export const runtime = "nodejs";

export async function GET(_request: Request, context: Params) {
  const { farmerId } = await context.params;
  const id = Number(farmerId);

  if (!Number.isFinite(id)) {
    return apiError("Invalid farmer id.", 400);
  }

  const supabase = getSupabaseAdmin();
  const [{ data: farmer, error }, { data: productRows }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("app_users")
      .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery")
      .eq("id", id)
      .eq("role", "farmer")
      .maybeSingle(),
    supabase.from("products").select("*").eq("farmer_id", id).gt("quantity", 0).order("id"),
    supabase.from("reviews").select("*").eq("reviewed_id", id).order("id", { ascending: false })
  ]);

  if (error || !farmer) {
    return apiError("Farmer not found.", 404);
  }

  const reviewerIds = [...new Set((reviewRows ?? []).map((review) => numberFrom(review.reviewer_id)))];
  const { data: reviewers } =
    reviewerIds.length > 0
      ? await supabase.from("app_users").select("id, username").in("id", reviewerIds)
      : { data: [] };

  const reviewerMap = new Map((reviewers ?? []).map((user) => [numberFrom(user.id), user.username]));
  const reviewTotal = (reviewRows ?? []).reduce((sum, review) => sum + numberFrom(review.rating), 0);
  const reviewCount = reviewRows?.length ?? 0;

  return apiOk({
    farmer: normalizeUser(farmer),
    products: (productRows ?? []).map(normalizeProduct),
    reviews: (reviewRows ?? []).map((review) => ({
      id: numberFrom(review.id),
      reviewer_id: numberFrom(review.reviewer_id),
      reviewed_id: numberFrom(review.reviewed_id),
      order_id: review.order_id ? numberFrom(review.order_id) : null,
      rating: numberFrom(review.rating),
      comment: String(review.comment ?? ""),
      reviewer_username: reviewerMap.get(numberFrom(review.reviewer_id)) ?? "Buyer",
      created_at: review.created_at
    })),
    avg_rating: reviewCount ? Math.round((reviewTotal / reviewCount) * 10) / 10 : 0
  });
}
