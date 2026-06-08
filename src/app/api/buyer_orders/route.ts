import type { NextRequest } from "next/server";
import { apiOk, numberFrom, requireUser } from "@/lib/api";

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

  const [{ data: farmers }, { data: products }] = await Promise.all([
    auth.supabase.from("app_users").select("id, username, name").in("id", farmerIds),
    auth.supabase.from("products").select("id, name").in("id", productIds)
  ]);

  const farmerMap = new Map((farmers ?? []).map((farmer) => [numberFrom(farmer.id), farmer]));
  const productMap = new Map((products ?? []).map((product) => [numberFrom(product.id), product]));

  return apiOk(
    orders.map((order) => {
      const farmer = farmerMap.get(numberFrom(order.farmer_id));
      const product = productMap.get(numberFrom(order.product_id));

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
        farmer_username: farmer?.username ?? "Unknown farmer",
        product_name: product?.name ?? "Unknown product"
      };
    })
  );
}
