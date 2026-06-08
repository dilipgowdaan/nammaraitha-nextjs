import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readSession } from "./session";
import { getSupabaseAdmin } from "./supabase";
import type { Product, Role, UserProfile } from "./types";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function apiOk<T>(payload: T, status = 200) {
  return NextResponse.json(payload, { status });
}

export function normalizeGallery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeGallery(parsed);
    } catch {
      return value ? [value] : [];
    }
  }

  return [];
}

export function normalizeUser(row: Record<string, unknown>): UserProfile {
  return {
    id: Number(row.id),
    username: String(row.username),
    role: row.role === "farmer" ? "farmer" : "buyer",
    lat: Number(row.lat ?? 12.9716),
    lng: Number(row.lng ?? 77.5946),
    name: String(row.name ?? row.username ?? ""),
    mobile: String(row.mobile ?? ""),
    farm_details: row.farm_details ? String(row.farm_details) : null,
    profile_pic: row.profile_pic ? String(row.profile_pic) : null,
    gallery: normalizeGallery(row.gallery),
    created_at: row.created_at ? String(row.created_at) : undefined
  };
}

export async function requireUser(request: NextRequest, role?: Role) {
  const session = await readSession(request);

  if (!session) {
    return { error: apiError("Login required.", 401) };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_users")
    .select(
      "id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery"
    )
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !data) {
    return { error: apiError("Your session is no longer valid.", 401) };
  }

  const user = normalizeUser(data);

  if (role && user.role !== role) {
    return { error: apiError(`Only ${role}s can perform this action.`, 403) };
  }

  return { user, supabase };
}

export function numberFrom(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeProduct(row: Record<string, unknown>): Product {
  return {
    id: numberFrom(row.id),
    farmer_id: numberFrom(row.farmer_id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    market_price: numberFrom(row.market_price),
    price: numberFrom(row.discount_price ?? row.price),
    quantity: numberFrom(row.quantity),
    unit: String(row.unit ?? "kg"),
    growth_method: String(row.growth_method ?? ""),
    image_path: row.image_path ? String(row.image_path) : null,
    category: row.category ? String(row.category) : null,
    harvest_date: row.harvest_date ? String(row.harvest_date) : null,
    is_featured: Boolean(row.is_featured),
    created_at: row.created_at ? String(row.created_at) : undefined
  };
}
