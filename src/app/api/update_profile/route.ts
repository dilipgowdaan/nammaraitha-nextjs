import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { profileSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = {};

  if (data.name) updates.name = data.name;
  if (data.mobile) updates.mobile = data.mobile;
  if (typeof data.farm_details === "string") updates.farm_details = data.farm_details;
  if (typeof data.lat === "number") updates.lat = data.lat;
  if (typeof data.lng === "number") updates.lng = data.lng;
  if (data.profile_pic) updates.profile_pic = data.profile_pic;

  if (data.gallery) {
    updates.gallery = data.gallery;
  } else if (data.new_gallery_item) {
    updates.gallery = [...auth.user.gallery, data.new_gallery_item].slice(-8);
  }

  if (Object.keys(updates).length === 0) {
    return apiOk({ success: true, message: "Nothing to update." });
  }

  const { error } = await auth.supabase.from("app_users").update(updates).eq("id", auth.user.id);

  if (error) {
    return apiError(`Profile update failed: ${error.message}`, 500);
  }

  return apiOk({ success: true, message: "Profile updated." });
}
