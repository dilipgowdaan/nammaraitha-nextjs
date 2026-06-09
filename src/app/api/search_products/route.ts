import type { NextRequest } from "next/server";
import { apiError, apiOk, normalizeProduct, normalizeUser, numberFrom } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim().toLowerCase() ?? "";
  const buyerLat = Number(request.nextUrl.searchParams.get("lat"));
  const buyerLng = Number(request.nextUrl.searchParams.get("lng"));
  const supabase = getSupabaseAdmin();

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("*")
    .gt("quantity", 0)
    .limit(100);

  if (productError) {
    return apiError(`Search failed: ${productError.message}`, 500);
  }

  const productIds = [...new Set((productRows ?? []).map((row) => numberFrom(row.id)))];
  const { data: reservationRows } = productIds.length
    ? await supabase
        .from("inventory_reservations")
        .select("product_id, quantity")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .in("product_id", productIds)
    : { data: [] };

  const reservedByProduct = new Map<number, number>();
  for (const row of reservationRows ?? []) {
    const productId = numberFrom(row.product_id);
    reservedByProduct.set(productId, (reservedByProduct.get(productId) ?? 0) + numberFrom(row.quantity));
  }

  const products = (productRows ?? [])
    .map((row) => {
      const product = normalizeProduct(row);
      const reserved = reservedByProduct.get(product.id) ?? 0;
      return { ...product, quantity: Math.max(0, product.quantity - reserved), reserved_quantity: reserved };
    })
    .filter((product) => product.quantity > 0)
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
      .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery, verification_status, verification_note, kyc_document_url, verified_at")
      .in("id", farmerIds),
    supabase
      .from("reviews")
      .select("reviewed_id, rating")
      .in("reviewed_id", farmerIds)
      .eq("moderation_status", "visible")
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
      const distance =
        farmer && Number.isFinite(buyerLat) && Number.isFinite(buyerLng)
          ? Math.round(distanceKm(buyerLat, buyerLng, farmer.lat, farmer.lng) * 10) / 10
          : undefined;

      return {
        ...product,
        farmer_username: farmer?.username ?? "Unknown farmer",
        farmer_name: farmer?.name ?? farmer?.username ?? "Unknown farmer",
        farmer_mobile: farmer?.mobile ?? "",
        farmer_verified: farmer?.verification_status === "approved",
        farmer_verification_status: farmer?.verification_status ?? "unsubmitted",
        avg_rating: rating?.count ? Math.round((rating.total / rating.count) * 10) / 10 : 0,
        review_count: rating?.count ?? 0,
        distance_km: distance,
        distance_label: typeof distance === "number" ? `${distance} km` : undefined
      };
    })
  );
}
