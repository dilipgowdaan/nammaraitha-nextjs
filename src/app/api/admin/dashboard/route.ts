import type { NextRequest } from "next/server";
import { apiError, apiOk, normalizeProduct, normalizeUser, numberFrom, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request, "admin");

  if ("error" in auth) {
    return auth.error;
  }

  const [usersRes, productsRes, ordersRes, reviewsRes] = await Promise.all([
    auth.supabase
      .from("app_users")
      .select("id, username, role, lat, lng, name, mobile, farm_details, profile_pic, gallery")
      .order("id", { ascending: false }),
    auth.supabase.from("products").select("*").order("id", { ascending: false }),
    auth.supabase.from("orders").select("*").order("id", { ascending: false }),
    auth.supabase.from("reviews").select("*").order("id", { ascending: false })
  ]);

  if (usersRes.error || productsRes.error || ordersRes.error || reviewsRes.error) {
    return apiError("Could not load admin dashboard data.", 500);
  }

  const users = (usersRes.data ?? []).map(normalizeUser);
  const userMap = new Map(users.map((user) => [user.id, user]));
  const products = (productsRes.data ?? []).map(normalizeProduct);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orders = ordersRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
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
      total_reviews: reviews.length
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
      created_at: review.created_at,
      reviewer_username: userMap.get(numberFrom(review.reviewer_id))?.username ?? "unknown",
      reviewed_username: userMap.get(numberFrom(review.reviewed_id))?.username ?? "unknown"
    })),
    logs
  });
}
