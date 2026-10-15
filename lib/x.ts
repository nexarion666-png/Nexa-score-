export type XProfile = {
  id: string; name: string; username: string; profile_image_url?: string; description?: string;
  verified?: boolean; created_at?: string;
  public_metrics?: { followers_count: number; following_count: number; tweet_count: number; listed_count: number };
};
export type XPost = {
  id: string; text: string; created_at?: string;
  public_metrics?: { like_count: number; reply_count: number; retweet_count: number; quote_count: number; impression_count?: number };
  entities?: { hashtags?: { tag: string }[]; urls?: { expanded_url?: string }[] };
};
export type AnalyzedScore = {
  connected: boolean; demo?: boolean; profile?: {
    id: string; name: string; username: string; profile_image_url?: string; description?: string;
    followers_count?: number; following_count?: number; tweet_count?: number; listed_count?: number; verified?: boolean;
  };
  generalScore?: number; ctScore?: number;
  metrics?: { engagementRate: number; postsAnalyzed: number; cryptoPosts: number; averageLikes: number; averageReplies: number; averageReposts: number };
  breakdown?: { label: string; score: number; note: string }[];
  error?: string;
};

const CRYPTO_TERMS = [
  "crypto", "bitcoin", "btc", "ethereum", "eth", "blockchain", "web3", "defi", "nft", "solana", "sol",
  "airdrop", "token", "onchain", "on-chain", "memecoin", "meme coin", "wallet", "dao", "layer 2", "l2",
  "base chain", "altcoin", "stablecoin", "staking", "bull market", "bear market", "dex", "cex", "smart contract"
];

function clamp(n: number, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(n))); }
function avg(values: number[]) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
function cryptoRelated(text: string) {
  const lower = text.toLowerCase();
  return CRYPTO_TERMS.some(term => new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(lower));
}

export function calculateScore(profile: XProfile, posts: XPost[]): AnalyzedScore {
  const publicMetrics = profile.public_metrics || { followers_count: 0, following_count: 0, tweet_count: 0, listed_count: 0 };
  const followers = publicMetrics.followers_count || 0;
  const following = publicMetrics.following_count || 0;
  const postCount = publicMetrics.tweet_count || 0;
  const likes = posts.map(p => p.public_metrics?.like_count || 0);
  const replies = posts.map(p => p.public_metrics?.reply_count || 0);
  const reposts = posts.map(p => p.public_metrics?.retweet_count || 0);
  const interactions = posts.map(p => (p.public_metrics?.like_count || 0) + (p.public_metrics?.reply_count || 0) + (p.public_metrics?.retweet_count || 0) + (p.public_metrics?.quote_count || 0));
  const engagementRate = followers ? avg(interactions) / followers * 100 : 0;
  const audienceScore = clamp(Math.log10(followers + 1) * 18);
  const engagementScore = clamp(Math.log10(engagementRate * 100 + 1) * 26);
  const conversationScore = clamp(Math.log10(avg(replies) + 1) * 27 + Math.log10(avg(reposts) + 1) * 13);
  const consistencyScore = clamp(Math.min(posts.length / 30, 1) * 65 + Math.min(postCount / 1000, 1) * 35);
  const generalScore = clamp(audienceScore * .28 + engagementScore * .30 + conversationScore * .22 + consistencyScore * .20);
  const cryptoPosts = posts.filter(p => cryptoRelated(p.text));
  const ctRatio = posts.length ? cryptoPosts.length / posts.length : 0;
  const ctInteractions = avg(cryptoPosts.map(p => (p.public_metrics?.like_count || 0) + (p.public_metrics?.reply_count || 0) + (p.public_metrics?.retweet_count || 0)));
  const ctEngagement = followers ? ctInteractions / followers * 100 : 0;
  const ctActivity = clamp(Math.min(cryptoPosts.length / 15, 1) * 55 + Math.min(ctRatio / .5, 1) * 25 + Math.min(ctEngagement * 15, 20));
  const ctScore = clamp(ctActivity * .55 + engagementScore * .25 + conversationScore * .20);
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    connected: true,
    profile: {
      id: profile.id, name: profile.name, username: profile.username, profile_image_url: profile.profile_image_url,
      description: profile.description, verified: profile.verified,
      followers_count: followers, following_count: following, tweet_count: postCount, listed_count: publicMetrics.listed_count
    },
    generalScore, ctScore,
    metrics: { engagementRate: round1(engagementRate), postsAnalyzed: posts.length, cryptoPosts: cryptoPosts.length, averageLikes: Math.round(avg(likes)), averageReplies: Math.round(avg(replies)), averageReposts: Math.round(avg(reposts)) },
    breakdown: [
      { label: "Audience presence", score: audienceScore, note: "Follower reach and public profile signals" },
      { label: "Conversation", score: conversationScore, note: "Replies and reposts in the available sample" },
      { label: "Consistency", score: consistencyScore, note: "Posting activity and sample size" },
      { label: "Engagement", score: engagementScore, note: "Average interactions relative to followers" }
    ]
  };
}

export async function fetchXProfile(accessToken: string): Promise<XProfile> {
  const url = new URL("https://api.x.com/2/users/me");
  url.searchParams.set("user.fields", "created_at,description,profile_image_url,public_metrics,verified");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.data) throw new Error(body.detail || body.title || "X could not return the connected profile.");
  return body.data as XProfile;
}

export async function fetchRecentPosts(accessToken: string, userId: string): Promise<XPost[]> {
  const url = new URL(`https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets`);
  url.searchParams.set("max_results", "100");
  url.searchParams.set("exclude", "retweets");
  url.searchParams.set("tweet.fields", "created_at,public_metrics,entities");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail || body.title || "X could not return recent posts. Check your API plan and scopes.");
  return (body.data || []) as XPost[];
}
