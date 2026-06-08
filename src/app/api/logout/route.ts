import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

function logoutResponse() {
  const response = NextResponse.json({ success: true, message: "Logged out." });
  clearSessionCookie(response);
  return response;
}

export async function GET() {
  return logoutResponse();
}

export async function POST() {
  return logoutResponse();
}
