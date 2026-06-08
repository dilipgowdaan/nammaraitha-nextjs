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

  const { data, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery, created_at")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !data) {
    return apiOk(null);
  }

  return apiOk(normalizeUser(data));
}
