import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { checkRateLimit } from "@/lib/security";
import { adminModerationSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "admin-moderation", 80, 60_000);
  if (limited) return limited;

  const auth = await requireUser(request, "admin");

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = adminModerationSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const { target_type, id, action, note } = parsed.data;

  if (target_type === "kyc") {
    const status = action === "approve" ? "approved" : "rejected";
    const { error } = await auth.supabase
      .from("app_users")
      .update({
        verification_status: status,
        verification_note: note || (status === "approved" ? "Verified by admin." : "Rejected by admin."),
        verified_at: status === "approved" ? new Date().toISOString() : null,
        verified_by: status === "approved" ? auth.user.id : null
      })
      .eq("id", id)
      .eq("role", "farmer");

    if (error) return apiError(`KYC moderation failed: ${error.message}`, 500);
  }

  if (target_type === "report") {
    const status = action === "approve" ? "approved" : "rejected";
    const { data: report } = await auth.supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase
      .from("reports")
      .update({
        status,
        admin_note: note,
        resolved_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) return apiError(`Report moderation failed: ${error.message}`, 500);

    if (status === "approved" && report?.target_type === "review") {
      await auth.supabase
        .from("reviews")
        .update({ moderation_status: "hidden" })
        .eq("id", Number(report.target_id));
    }
  }

  if (target_type === "review") {
    const moderationStatus = action === "hide" ? "hidden" : "visible";
    const { error } = await auth.supabase
      .from("reviews")
      .update({ moderation_status: moderationStatus })
      .eq("id", id);

    if (error) return apiError(`Review moderation failed: ${error.message}`, 500);
  }

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: `admin_${action}_${target_type}`,
    entityType: target_type,
    entityId: id,
    metadata: { note }
  }).catch(() => null);

  return apiOk({ success: true, message: "Moderation action saved." });
}
