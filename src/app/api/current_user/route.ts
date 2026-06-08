import type { NextRequest } from "next/server";
import { apiOk, normalizeUser } from "@/lib/api";
import { readSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await readSession(request);

  if (!session) {
    return apiOk(null);
  }

  if (session.role === "admin") {
    return apiOk({
      id: 0,
      username: "admin",
      role: "admin",
      lat: 12.9716,
      lng: 77.5946,
      name: "Administrator",
      mobile: "N/A",
      farm_details: "Platform administrator",
      profile_pic: "https://placehold.co/96x96/2E7D32/FFFFFF?text=A",
      gallery: []
    });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !data) {
    return apiOk(null);
  }

  return apiOk(normalizeUser(data));
}
