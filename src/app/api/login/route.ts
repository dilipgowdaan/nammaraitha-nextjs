import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { normalizeUser, apiError } from "@/lib/api";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";
import { loginSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const { data: user, error } = await getSupabaseAdmin()
    .from("app_users")
    .select(
      "id, username, password_hash, role, lat, lng, name, mobile, farm_details, profile_pic, gallery"
    )
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (error || !user) {
    return apiError("Invalid username or password.", 401);
  }

  const isValid = await bcrypt.compare(parsed.data.password, String(user.password_hash));

  if (!isValid) {
    return apiError("Invalid username or password.", 401);
  }

  const profile = normalizeUser(user);
  const token = await createSessionToken({
    userId: profile.id,
    username: profile.username,
    role: profile.role
  });
  const response = NextResponse.json({
    success: true,
    message: "Login successful.",
    user: profile
  });

  setSessionCookie(response, token);
  return response;
}
