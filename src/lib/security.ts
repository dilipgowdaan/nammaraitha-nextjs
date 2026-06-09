import type { NextRequest } from "next/server";
import { apiError } from "./api";

const buckets = new Map<string, { count: number; resetAt: number }>();

function requestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function checkRateLimit(
  request: NextRequest,
  bucket: string,
  limit = 30,
  windowMs = 60_000
) {
  const key = `${bucket}:${requestIp(request)}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    return apiError("Too many requests. Please try again shortly.", 429);
  }

  current.count += 1;
  return null;
}
