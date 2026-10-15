import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "nexa_x_session";
const secret = () => process.env.X_SESSION_SECRET || process.env.X_CLIENT_SECRET || "";

export type XSession = { accessToken: string; refreshToken?: string; expiresAt?: number; userId: string; username: string };

function sign(value: string) {
  const key = secret();
  if (!key) throw new Error("Missing X_SESSION_SECRET. Add a long random secret to your environment.");
  return createHmac("sha256", key).update(value).digest("hex");
}

export function setSession(session: XSession) {
  const value = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signed = `${value}.${sign(value)}`;
  cookies().set(COOKIE, signed, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: Math.max(60, Math.floor(((session.expiresAt || Date.now() + 86400000) - Date.now()) / 1000))
  });
}

export function getSession(): XSession | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  const [value, signature] = raw.split(".");
  if (!value || !signature) return null;
  try {
    const expected = sign(value);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const session = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as XSession;
    if (session.expiresAt && session.expiresAt < Date.now()) return null;
    return session;
  } catch { return null; }
}

export function clearSession() {
  cookies().set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
