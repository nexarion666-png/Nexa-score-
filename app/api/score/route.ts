import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { calculateScore, fetchRecentPosts, fetchXProfile } from "@/lib/x";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ connected: false }, { status: 200 });
  try {
    const profile = await fetchXProfile(session.accessToken);
    const posts = await fetchRecentPosts(session.accessToken, profile.id);
    return NextResponse.json(calculateScore(profile, posts), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to calculate score.";
    return NextResponse.json({ connected: true, error: message }, { status: 502 });
  }
}
