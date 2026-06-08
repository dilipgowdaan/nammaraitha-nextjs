import type { NextRequest } from "next/server";
import { apiOk, numberFrom, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request, "farmer");

  if ("error" in auth) {
    return auth.error;
  }

  const [{ data: orders }, { data: reviews }] = await Promise.all([
    auth.supabase
      .from("orders")
      .select("*")
      .eq("farmer_id", auth.user.id)
      .order("timestamp", { ascending: false })
      .limit(200),
    auth.supabase.from("reviews").select("*").eq("reviewed_id", auth.user.id)
  ]);

  const orderRows = orders ?? [];
  const productIds = [...new Set(orderRows.map((order) => numberFrom(order.product_id)))];
  const buyerIds = [...new Set(orderRows.map((order) => numberFrom(order.buyer_id)))];

  const [{ data: products }, { data: buyers }] = await Promise.all([
    productIds.length
      ? auth.supabase.from("products").select("id, name").in("id", productIds)
      : Promise.resolve({ data: [] }),
    buyerIds.length
      ? auth.supabase.from("app_users").select("id, username").in("id", buyerIds)
      : Promise.resolve({ data: [] })
  ]);

  const productMap = new Map((products ?? []).map((product) => [numberFrom(product.id), product.name]));
  const buyerMap = new Map((buyers ?? []).map((buyer) => [numberFrom(buyer.id), buyer.username]));
  const successful = orderRows.filter((order) => order.status === "paid" || order.status === "delivered");

  const salesByProduct = new Map<string, number>();
  let totalUnitsSold = 0;
  let totalEarnings = 0;

  for (const order of successful) {
    const productName = productMap.get(numberFrom(order.product_id)) ?? "Unknown product";
    const quantity = numberFrom(order.quantity);
    salesByProduct.set(productName, (salesByProduct.get(productName) ?? 0) + quantity);
    totalUnitsSold += quantity;
    totalEarnings += quantity * numberFrom(order.product_price);
  }

  const salesByProductList = [...salesByProduct.entries()]
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units);

  const reviewRows = reviews ?? [];
  const reviewTotal = reviewRows.reduce((sum, review) => sum + numberFrom(review.rating), 0);
  const reviewByBuyer = new Map(
    reviewRows.map((review) => [numberFrom(review.reviewer_id), numberFrom(review.rating)])
  );

  return apiOk({
    total_orders: successful.length,
    total_units_sold: totalUnitsSold,
    total_earnings: Math.round(totalEarnings * 100) / 100,
    top_product: salesByProductList[0]?.name ?? "N/A",
    sales_by_product: salesByProductList,
    sales_history: orderRows.slice(0, 10).map((order) => ({
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
      buyer: buyerMap.get(numberFrom(order.buyer_id)) ?? "Unknown buyer",
      product: productMap.get(numberFrom(order.product_id)) ?? "Unknown product",
      product_name: productMap.get(numberFrom(order.product_id)) ?? "Unknown product",
      review_status: reviewByBuyer.get(numberFrom(order.buyer_id)) ?? 0
    })),
    avg_rating: reviewRows.length ? Math.round((reviewTotal / reviewRows.length) * 10) / 10 : 0,
    review_count: reviewRows.length
  });
}
