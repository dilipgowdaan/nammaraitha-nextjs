import type { NextRequest } from "next/server";
import { apiOk, numberFrom, requireUser } from "@/lib/api";
import { loadTrackingEventsByOrder } from "@/lib/orderTracking";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request, "buyer");

  if ("error" in auth) {
    return auth.error;
  }

  const { data: orders, error } = await auth.supabase
    .from("orders")
    .select("*")
    .eq("buyer_id", auth.user.id)
    .order("id", { ascending: false });

  if (error || !orders?.length) {
    return apiOk([]);
  }

  const farmerIds = [...new Set(orders.map((order) => numberFrom(order.farmer_id)))];
  const productIds = [...new Set(orders.map((order) => numberFrom(order.product_id)))];

  const orderIds = orders.map((order) => numberFrom(order.id));
  const [{ data: farmers }, { data: products }, { data: reviews }, trackingMap] = await Promise.all([
    auth.supabase.from("app_users").select("id, username, name").in("id", farmerIds),
    auth.supabase.from("products").select("id, name").in("id", productIds),
    orderIds.length
      ? auth.supabase
          .from("reviews")
          .select("id, order_id, rating, comment")
          .eq("reviewer_id", auth.user.id)
          .in("order_id", orderIds)
      : Promise.resolve({ data: [] }),
    loadTrackingEventsByOrder(auth.supabase, orderIds).catch(() => new Map())
  ]);

  const farmerMap = new Map((farmers ?? []).map((farmer) => [numberFrom(farmer.id), farmer]));
  const productMap = new Map((products ?? []).map((product) => [numberFrom(product.id), product]));
  const reviewMap = new Map((reviews ?? []).map((review) => [numberFrom(review.order_id), review]));

  return apiOk(
    orders.map((order) => {
      const farmer = farmerMap.get(numberFrom(order.farmer_id));
      const product = productMap.get(numberFrom(order.product_id));
      const review = reviewMap.get(numberFrom(order.id));

      return {
        id: numberFrom(order.id),
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
        farmer_username: farmer?.username ?? "Unknown farmer",
        product_name: product?.name ?? "Unknown product",
        review_id: review ? numberFrom(review.id) : null,
        review_rating: review ? numberFrom(review.rating) : null,
        review_comment: review ? String(review.comment ?? "") : null
      };
    })
  );
}
