import type { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/api";
import { logAudit } from "@/lib/observability";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request, "admin");

  if ("error" in auth) {
    return auth.error;
  }

  const tables = ["app_users", "products", "orders", "reviews", "reports", "audit_logs"] as const;
  const snapshot: Record<string, unknown> = {};

  for (const table of tables) {
    const { data, error } = await auth.supabase.from(table).select("*").limit(1000);
    if (error) {
      return apiError(`Backup failed for ${table}: ${error.message}`, 500);
    }
    snapshot[table] = data ?? [];
  }

  await logAudit({
    supabase: auth.supabase,
    actor: auth.user,
    action: "backup_exported",
    entityType: "platform"
  }).catch(() => null);

  return new Response(JSON.stringify({ exported_at: new Date().toISOString(), snapshot }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nammaraitha-backup-${Date.now()}.json"`
    }
  });
}
