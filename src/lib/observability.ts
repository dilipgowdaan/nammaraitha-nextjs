import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "./types";

type AuditOptions = {
  supabase: SupabaseClient;
  actor?: Pick<UserProfile, "id" | "username"> | null;
  action: string;
  entityType?: string;
  entityId?: number | null;
  metadata?: Record<string, unknown>;
};

export async function logAudit({
  supabase,
  actor,
  action,
  entityType,
  entityId,
  metadata = {}
}: AuditOptions) {
  await supabase.from("audit_logs").insert({
    actor_id: actor?.id || null,
    actor_username: actor?.username ?? null,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata
  });
}

export async function captureException(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[nammaraitha]", error, context);

  if (!process.env.SENTRY_DSN) return;

  try {
    const sentry = await import("@sentry/nextjs");
    sentry.captureException(error, { extra: context });
  } catch {
    console.error("[nammaraitha] Sentry is not installed or not configured.");
  }
}
