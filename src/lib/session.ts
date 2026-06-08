import { jwtVerify, SignJWT } from "jose";
import type { NextRequest, NextResponse } from "next/server";
import type { Role } from "./types";

export const SESSION_COOKIE = "nr_session";

export type SessionUser = {
  userId: number;
  username: string;
  role: Role;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production.");
  }

  return new TextEncoder().encode(secret ?? "local-nammaraitha-dev-secret");
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    username: user.username,
    role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.userId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function readSession(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = payload.role === "farmer" ? "farmer" : "buyer";
    const userId = Number(payload.sub);

    if (!Number.isFinite(userId)) {
      return null;
    }

    return {
      userId,
      username: String(payload.username ?? ""),
      role
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
