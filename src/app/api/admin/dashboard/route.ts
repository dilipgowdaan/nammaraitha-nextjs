import type { NextRequest } from "next/server";
import { apiError, apiOk, normalizeProduct, normalizeUser, numberFrom, requireUser } from "@/lib/api";
import { loadTrackingEventsByOrder } from "@/lib/orderTracking";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request, "admin");

  if ("error" in auth) {
    return auth.error;
  }

  const [usersRes, productsRes, ordersRes, reviewsRes, reportsRes, auditRes] = await Promise.all([
    auth.supabase
      .from("app_users")
      .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery, verification_status, verification_note, kyc_document_url, verified_at")
      .order("id", { ascending: false }),
    auth.supabase.from("products").select("*").order("id", { ascending: false }),
    auth.supabase.from("orders").select("*").order("id", { ascending: false }),
    auth.supabase.from("reviews").select("*").order("id", { ascending: false }),
    auth.supabase.from("reports").select("*").order("id", { ascending: false }),
    auth.supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(150)
  ]);

  if (usersRes.error || productsRes.error || ordersRes.error || reviewsRes.error || reportsRes.error || auditRes.error) {
    return apiError("Could not load admin dashboard data.", 500);
  }

  const users = (usersRes.data ?? []).map(normalizeUser);
  const userMap = new Map(users.map((user) => [user.id, user]));
  const products = (productsRes.data ?? []).map(normalizeProduct);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orders = ordersRes.data ?? [];
  const trackingMap = await loadTrackingEventsByOrder(
    auth.supabase,
    orders.map((order) => numberFrom(order.id))
  ).catch(() => new Map());
  const reviews = reviewsRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const auditLogs = auditRes.data ?? [];
  const totalRevenue = orders
    .filter((order) => order.status === "paid" || order.status === "delivered")
    .reduce((sum, order) => sum + numberFrom(order.quantity) * numberFrom(order.product_price), 0);

  const logs = [
    ...orders.slice(0, 12).map((order) => ({
      id: `order-${order.id}`,
      type: "order",
      actor: userMap.get(numberFrom(order.buyer_id))?.username ?? "buyer",
      message: `Order #${order.id} for ${productMap.get(numberFrom(order.product_id))?.name ?? "product"} is ${order.status}.`,
      order_id: numberFrom(order.id),
      product_name: productMap.get(numberFrom(order.product_id))?.name ?? "product",
      status: String(order.status ?? ""),
      timestamp: String(order.timestamp ?? "")
    })),
    ...reviews.slice(0, 8).map((review) => ({
      id: `review-${review.id}`,
      type: "review",
      actor: userMap.get(numberFrom(review.reviewer_id))?.username ?? "buyer",
      message: `Rated ${userMap.get(numberFrom(review.reviewed_id))?.username ?? "farmer"} ${review.rating}/5.`,
      reviewed_username: userMap.get(numberFrom(review.reviewed_id))?.username ?? "farmer",
      rating: numberFrom(review.rating),
      timestamp: String(review.created_at ?? "")
    })),
    ...reports.slice(0, 10).map((report) => ({
      id: `report-${report.id}`,
      type: "report",
      actor: userMap.get(numberFrom(report.reporter_id))?.username ?? "buyer",
      message: `Reported ${report.target_type} #${report.target_id}: ${report.reason}.`,
      timestamp: String(report.created_at ?? "")
    })),
    ...auditLogs.slice(0, 10).map((log) => ({
      id: `audit-${log.id}`,
      type: "audit",
      actor: String(log.actor_username ?? "system"),
      message: String(log.action ?? "audit event"),
      timestamp: String(log.created_at ?? "")
    }))
  ].sort((a, b) => Number(new Date(b.timestamp)) - Number(new Date(a.timestamp)));

  return apiOk({
    metrics: {
      total_users: users.length,
      total_farmers: users.filter((user) => user.role === "farmer").length,
      total_buyers: users.filter((user) => user.role === "buyer").length,
      total_products: products.length,
      total_orders: orders.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      delivered_orders: orders.filter((order) => order.status === "delivered").length,
      total_reviews: reviews.length,
      pending_kyc: users.filter((user) => user.verification_status === "pending").length,
      pending_reports: reports.filter((report) => report.status === "pending").length,
      hidden_reviews: reviews.filter((review) => review.moderation_status === "hidden").length
    },
    users,
    products: products.map((product) => ({
      ...product,
      farmer_username: userMap.get(product.farmer_id)?.username ?? "unknown",
      farmer_name: userMap.get(product.farmer_id)?.name ?? "Unknown farmer"
    })),
    orders: orders.map((order) => ({
      id: numberFrom(order.id),
      buyer_id: numberFrom(order.buyer_id),
      farmer_id: numberFrom(order.farmer_id),
      product_id: numberFrom(order.product_id),
      quantity: numberFrom(order.quantity),
      status: order.status,
      timestamp: order.timestamp,
      delivered_timestamp: order.delivered_timestamp,
      product_price: numberFrom(order.product_price),
      product_unit: order.product_unit,
      payment_reference: order.payment_reference,
      delivery_slot: order.delivery_slot ?? null,
      tracking_status: order.tracking_status ?? "order_placed",
      tracking_note: order.tracking_note ?? null,
      cancel_reason: order.cancel_reason ?? null,
      cancelled_at: order.cancelled_at ?? null,
      cancelled_by: order.cancelled_by ? numberFrom(order.cancelled_by) : null,
      tracking_events: trackingMap.get(numberFrom(order.id)) ?? [],
      product_name: productMap.get(numberFrom(order.product_id))?.name ?? "Unknown product",
      buyer_username: userMap.get(numberFrom(order.buyer_id))?.username ?? "unknown",
      farmer_username: userMap.get(numberFrom(order.farmer_id))?.username ?? "unknown"
    })),
    reviews: reviews.map((review) => ({
      id: numberFrom(review.id),
      reviewer_id: numberFrom(review.reviewer_id),
      reviewed_id: numberFrom(review.reviewed_id),
      order_id: review.order_id ? numberFrom(review.order_id) : null,
      rating: numberFrom(review.rating),
      comment: String(review.comment ?? ""),
      moderation_status: review.moderation_status ?? "visible",
      created_at: review.created_at,
      reviewer_username: userMap.get(numberFrom(review.reviewer_id))?.username ?? "unknown",
      reviewed_username: userMap.get(numberFrom(review.reviewed_id))?.username ?? "unknown"
    })),
    kyc_requests: users.filter((user) => user.role === "farmer" && user.verification_status === "pending"),
    reports: reports.map((report) => ({
      id: numberFrom(report.id),
      reporter_id: numberFrom(report.reporter_id),
      reporter_username: userMap.get(numberFrom(report.reporter_id))?.username ?? "unknown",
      target_type: report.target_type,
      target_id: numberFrom(report.target_id),
      reason: String(report.reason ?? ""),
      details: report.details ? String(report.details) : null,
      status: report.status,
      admin_note: report.admin_note ? String(report.admin_note) : null,
      created_at: String(report.created_at ?? ""),
      resolved_at: report.resolved_at ? String(report.resolved_at) : null
    })),
    audit_logs: auditLogs.map((log) => ({
      id: numberFrom(log.id),
      actor_id: log.actor_id ? numberFrom(log.actor_id) : null,
      actor_username: log.actor_username ? String(log.actor_username) : null,
      action: String(log.action ?? ""),
      entity_type: log.entity_type ? String(log.entity_type) : null,
      entity_id: log.entity_id ? numberFrom(log.entity_id) : null,
      metadata: typeof log.metadata === "object" && log.metadata ? log.metadata : {},
      created_at: String(log.created_at ?? "")
    })),
    logs
  });
}
