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
    role: row.role === "admin" ? "admin" : row.role === "farmer" ? "farmer" : "buyer",
    lat: Number(row.lat ?? 12.9716),
    lng: Number(row.lng ?? 77.5946),
    name: String(row.name ?? row.username ?? ""),
    mobile: String(row.mobile ?? ""),
    farm_details: row.farm_details ? String(row.farm_details) : null,
    profile_pic: row.profile_pic ? String(row.profile_pic) : null,
    gallery: normalizeGallery(row.gallery),
    verification_status:
      row.verification_status === "approved" ||
      row.verification_status === "pending" ||
      row.verification_status === "rejected"
        ? row.verification_status
        : "unsubmitted",
    verification_note: row.verification_note ? String(row.verification_note) : null,
    kyc_document_url: row.kyc_document_url ? String(row.kyc_document_url) : null,
    verified_at: row.verified_at ? String(row.verified_at) : null,
    created_at: row.created_at ? String(row.created_at) : undefined
  };
}

export async function requireUser(request: NextRequest, role?: Role) {
  const session = await readSession(request);

  if (!session) {
    return { error: apiError("Login required.", 401) };
  }

  if (session.role === "admin") {
    const user = normalizeUser({
      id: 0,
      username: "admin",
      role: "admin",
      lat: 12.9716,
      lng: 77.5946,
      name: "Administrator",
      mobile: "N/A",
      farm_details: "Platform administrator",
      profile_pic: "https://placehold.co/96x96/2E7D32/FFFFFF?text=A",
      gallery: [],
      verification_status: "approved",
      verification_note: "System administrator",
      kyc_document_url: null,
      verified_at: new Date().toISOString()
    });

    if (role && role !== "admin") {
      return { error: apiError(`Only ${role}s can perform this action.`, 403) };
    }

    return { user, supabase: getSupabaseAdmin() };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_users")
    .select(
      "id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery, verification_status, verification_note, kyc_document_url, verified_at"
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
    image_gallery: normalizeGallery(row.image_gallery),
    category: row.category ? String(row.category) : null,
    harvest_date: row.harvest_date ? String(row.harvest_date) : null,
    is_featured: Boolean(row.is_featured),
    reserved_quantity: numberFrom(row.reserved_quantity, 0),
    created_at: row.created_at ? String(row.created_at) : undefined
  };
}
