import { NextRequest, NextResponse } from "next/server";
import { fetchXProfile } from "@/lib/x";
import { setSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const expectedState = request.cookies.get("nexa_oauth_state")?.value;
  const verifier = request.cookies.get("nexa_oauth_verifier")?.value;
  const redirect = (query: string) => {
    const response = NextResponse.redirect(new URL(`/?${query}`, origin));
    response.cookies.delete("nexa_oauth_state");
    response.cookies.delete("nexa_oauth_verifier");
    return response;
  };
  if (error) return redirect(`error=${encodeURIComponent(error)}`);
  if (!code || !state || !expectedState || state !== expectedState || !verifier) return redirect("error=oauth_state_invalid");

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI || `${origin}/api/auth/x/callback`;
  if (!clientId) return redirect("error=x_not_configured");

  try {
    const body = new URLSearchParams({ code, grant_type: "authorization_code", client_id: clientId, redirect_uri: redirectUri, code_verifier: verifier });
    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
    if (clientSecret) headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", { method: "POST", headers, body, cache: "no-store" });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) return redirect(`error=${encodeURIComponent(tokens.error_description || tokens.error || "token_exchange_failed")}`);

    const profile = await fetchXProfile(tokens.access_token);
    setSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? Date.now() + Number(tokens.expires_in) * 1000 : undefined,
      userId: profile.id,
      username: profile.username
    });
    const response = NextResponse.redirect(new URL("/?connected=1", origin));
    response.cookies.delete("nexa_oauth_state");
    response.cookies.delete("nexa_oauth_verifier");
    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "oauth_callback_failed";
    return redirect(`error=${encodeURIComponent(message.slice(0, 140))}`);
  }
}
