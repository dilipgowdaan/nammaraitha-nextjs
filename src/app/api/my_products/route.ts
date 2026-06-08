import type { NextRequest } from "next/server";
import { apiOk, normalizeProduct, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request, "farmer");

  if ("error" in auth) {
    return auth.error;
  }

  const { data, error } = await auth.supabase
    .from("products")
    .select("*")
    .eq("farmer_id", auth.user.id)
    .order("id", { ascending: false });

  if (error) {
    return apiOk([]);
  }

  return apiOk((data ?? []).map(normalizeProduct));
}
