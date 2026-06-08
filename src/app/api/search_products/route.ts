import type { NextRequest } from "next/server";
import { apiError, apiOk, normalizeProduct, normalizeUser, numberFrom } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim().toLowerCase() ?? "";
  const supabase = getSupabaseAdmin();

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("*")
    .gt("quantity", 0)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (productError) {
    return apiError(`Search failed: ${productError.message}`, 500);
  }

  const products = (productRows ?? [])
    .map(normalizeProduct)
    .filter((product) => {
      if (!query) return true;
      return [product.name, product.description, product.category, product.growth_method]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  const farmerIds = [...new Set(products.map((product) => product.farmer_id))];

  if (farmerIds.length === 0) {
    return apiOk([]);
  }

  const [{ data: farmerRows }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("app_users")
      .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery, created_at")
      .in("id", farmerIds),
    supabase.from("reviews").select("reviewed_id, rating").in("reviewed_id", farmerIds)
  ]);

  const farmers = new Map(
    (farmerRows ?? []).map((row) => {
      const farmer = normalizeUser(row);
      return [farmer.id, farmer];
    })
  );

  const ratings = new Map<number, { total: number; count: number }>();

  for (const row of reviewRows ?? []) {
    const farmerId = numberFrom(row.reviewed_id);
    const current = ratings.get(farmerId) ?? { total: 0, count: 0 };
    current.total += numberFrom(row.rating);
    current.count += 1;
    ratings.set(farmerId, current);
  }

  return apiOk(
    products.map((product) => {
      const farmer = farmers.get(product.farmer_id);
      const rating = ratings.get(product.farmer_id);

      return {
        ...product,
        farmer_username: farmer?.username ?? "Unknown farmer",
        farmer_name: farmer?.name ?? farmer?.username ?? "Unknown farmer",
        farmer_mobile: farmer?.mobile ?? "",
        avg_rating: rating?.count ? Math.round((rating.total / rating.count) * 10) / 10 : 0,
        review_count: rating?.count ?? 0
      };
    })
  );
}
