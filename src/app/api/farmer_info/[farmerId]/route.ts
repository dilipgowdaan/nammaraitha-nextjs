import { apiError, apiOk, normalizeUser, numberFrom } from "@/lib/api";
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
  const [{ data: user, error }, { data: reviews }] = await Promise.all([
    supabase
      .from("app_users")
      .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery, verification_status, verification_note, kyc_document_url, verified_at")
      .eq("id", id)
      .eq("role", "farmer")
      .maybeSingle(),
    supabase.from("reviews").select("rating").eq("reviewed_id", id).eq("moderation_status", "visible")
  ]);

  if (error || !user) {
    return apiError("Farmer not found.", 404);
  }

  const total = (reviews ?? []).reduce((sum, row) => sum + numberFrom(row.rating), 0);
  const count = reviews?.length ?? 0;

  return apiOk({
    user: normalizeUser(user),
    avg_rating: count ? Math.round((total / count) * 10) / 10 : 0,
    review_count: count
  });
}
