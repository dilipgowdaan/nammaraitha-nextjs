import { apiError, apiOk, normalizeUser, numberFrom } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: farmers, error } = await supabase
    .from("app_users")
    .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery, verification_status, verification_note, kyc_document_url, verified_at")
    .eq("role", "farmer")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("id", { ascending: false });

  if (error) {
    return apiError(`Could not load farmers: ${error.message}`, 500);
  }

  const farmerProfiles = (farmers ?? []).map(normalizeUser);
  const farmerIds = farmerProfiles.map((farmer) => farmer.id);

  if (farmerIds.length === 0) {
    return apiOk([]);
  }

  const [{ data: productRows }, { data: reviewRows }] = await Promise.all([
    supabase.from("products").select("farmer_id").in("farmer_id", farmerIds).gt("quantity", 0),
    supabase
      .from("reviews")
      .select("reviewed_id, rating")
      .in("reviewed_id", farmerIds)
      .eq("moderation_status", "visible")
  ]);

  const productCounts = new Map<number, number>();
  for (const row of productRows ?? []) {
    const farmerId = numberFrom(row.farmer_id);
    productCounts.set(farmerId, (productCounts.get(farmerId) ?? 0) + 1);
  }

  const ratings = new Map<number, { total: number; count: number }>();
  for (const row of reviewRows ?? []) {
    const farmerId = numberFrom(row.reviewed_id);
    const current = ratings.get(farmerId) ?? { total: 0, count: 0 };
    current.total += numberFrom(row.rating);
    current.count += 1;
    ratings.set(farmerId, current);
  }

  return apiOk(
    farmerProfiles.map((farmer) => {
      const rating = ratings.get(farmer.id);
      return {
        id: farmer.id,
        username: farmer.username,
        name: farmer.name,
        lat: farmer.lat,
        lng: farmer.lng,
        avg_rating: rating?.count ? Math.round((rating.total / rating.count) * 10) / 10 : 0,
        product_count: productCounts.get(farmer.id) ?? 0,
        verification_status: farmer.verification_status
      };
    })
  );
}
