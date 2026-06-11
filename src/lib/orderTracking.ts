import type { SupabaseClient } from "@supabase/supabase-js";
import { numberFrom } from "./api";
import type { OrderTrackingEvent } from "./types";

function normalizeTrackingEvent(row: Record<string, unknown>): OrderTrackingEvent {
  return {
    id: numberFrom(row.id),
    order_id: numberFrom(row.order_id),
    status: String(row.status ?? "order_placed"),
    note: row.note ? String(row.note) : null,
    actor_id: row.actor_id ? numberFrom(row.actor_id) : null,
    actor_role: String(row.actor_role ?? "system"),
    created_at: String(row.created_at ?? "")
  };
}

export async function loadTrackingEventsByOrder(
  supabase: SupabaseClient,
  orderIds: number[]
): Promise<Map<number, OrderTrackingEvent[]>> {
  const uniqueOrderIds = [...new Set(orderIds.filter((id) => Number.isFinite(id) && id > 0))];
  const eventMap = new Map<number, OrderTrackingEvent[]>();

  if (!uniqueOrderIds.length) {
    return eventMap;
  }

  const { data, error } = await supabase
    .from("order_tracking_events")
    .select("*")
    .in("order_id", uniqueOrderIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const event = normalizeTrackingEvent(row);
    const events = eventMap.get(event.order_id) ?? [];
    events.push(event);
    eventMap.set(event.order_id, events);
  }

  return eventMap;
}
