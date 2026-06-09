import type { NextRequest } from "next/server";
import { apiError, apiOk, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { checkRateLimit } from "@/lib/security";
import { kycSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "kyc-submit", 10, 60_000);
  if (limited) return limited;

  const auth = await requireUser(request, "farmer");

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = kycSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const { error } = await auth.supabase
    .from("app_users")
    .update({
      kyc_document_url: parsed.data.document_url,
      verification_note: parsed.data.note,
      verification_status: "pending",
      verified_at: null,
      verified_by: null
    })
    .eq("id", auth.user.id)
    .eq("role", "farmer");

  if (error) {
    return apiError(`KYC submission failed: ${error.message}`, 500);
  }

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: "kyc_submitted",
    entityType: "farmer",
    entityId: auth.user.id
  }).catch(() => null);

  return apiOk({ success: true, message: "KYC submitted for admin approval." });
}
