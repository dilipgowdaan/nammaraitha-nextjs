import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { checkRateLimit } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase";
import { registerSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "register", 6, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const data = parsed.data;
  const passwordHash = await bcrypt.hash(data.password, 12);
  const profilePic = `https://placehold.co/96x96/E7F5D7/275C2D?text=${encodeURIComponent(
    data.name.slice(0, 1).toUpperCase()
  )}`;

  const { error } = await getSupabaseAdmin().from("app_users").insert({
    username: data.username,
    password_hash: passwordHash,
    role: data.role,
    lat: data.lat,
    lng: data.lng,
    name: data.name,
    mobile: data.mobile,
    farm_details: data.role === "farmer" ? data.farm_details : "",
    profile_pic: profilePic
  });

  if (error?.code === "23505") {
    return apiError("Username already taken. Try another.", 409);
  }

  if (error) {
    return apiError(`Registration failed: ${error.message}`, 500);
  }

  return apiOk({ success: true, message: "Registered successfully. Please login." });
}
