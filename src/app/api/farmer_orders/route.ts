import type { NextRequest } from "next/server";
import { apiOk, numberFrom, requireUser } from "@/lib/api";
import { loadTrackingEventsByOrder } from "@/lib/orderTracking";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request, "farmer");

  if ("error" in auth) {
    return auth.error;
  }

  const { data: orders, error } = await auth.supabase
    .from("orders")
    .select("*")
    .eq("farmer_id", auth.user.id)
    .neq("status", "delivered")
    .order("timestamp", { ascending: false });

  if (error || !orders?.length) {
    return apiOk([]);
  }

  const buyerIds = [...new Set(orders.map((order) => numberFrom(order.buyer_id)))];
  const productIds = [...new Set(orders.map((order) => numberFrom(order.product_id)))];
  const orderIds = orders.map((order) => numberFrom(order.id));

  const [{ data: buyers }, { data: products }, trackingMap] = await Promise.all([
    auth.supabase.from("app_users").select("id, username, mobile").in("id", buyerIds),
    auth.supabase.from("products").select("id, name").in("id", productIds),
    loadTrackingEventsByOrder(auth.supabase, orderIds).catch(() => new Map())
  ]);

  const buyerMap = new Map((buyers ?? []).map((buyer) => [numberFrom(buyer.id), buyer]));
  const productMap = new Map((products ?? []).map((product) => [numberFrom(product.id), product]));

  return apiOk(
    orders.map((order) => {
      const buyer = buyerMap.get(numberFrom(order.buyer_id));
      const product = productMap.get(numberFrom(order.product_id));

      return {
        id: numberFrom(order.id),
        buyer_username: buyer?.username ?? "Unknown buyer",
        mobile: buyer?.mobile ?? null,
        product_name: product?.name ?? "Unknown product",
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
        tracking_events: trackingMap.get(numberFrom(order.id)) ?? []
      };
    })
  );
}
