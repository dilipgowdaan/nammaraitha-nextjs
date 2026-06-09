import type { NextRequest } from "next/server";
import { apiError, apiOk, numberFrom, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";
import { checkRateLimit } from "@/lib/security";
import { reportSchema, schemaMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "report-abuse", 12, 60_000);
  if (limited) return limited;

  const auth = await requireUser(request);

  if ("error" in auth) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(schemaMessage(parsed.error), 400);
  }

  const { data, error } = await auth.supabase
    .from("reports")
    .insert({
      reporter_id: auth.user.id,
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id,
      reason: parsed.data.reason,
      details: parsed.data.details,
      status: "pending"
    })
    .select("id")
    .single();

  if (error) {
    return apiError(`Report failed: ${error.message}`, 500);
  }

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: "report_submitted",
    entityType: parsed.data.target_type,
    entityId: parsed.data.target_id,
    metadata: { report_id: numberFrom(data.id), reason: parsed.data.reason }
  }).catch(() => null);

  return apiOk({ success: true, message: "Report submitted for admin review.", report_id: numberFrom(data.id) });
}
