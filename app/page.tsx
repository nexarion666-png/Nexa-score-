"use client";

import { useEffect, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3,
  Bell, ChevronDown, CircleHelp, Clock3, Compass, ExternalLink, Flame, Gauge,
  Github, Globe2, LayoutDashboard, LockKeyhole, Menu, MessageCircle, MoreHorizontal,
  Plus, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, TrendingUp, Users,
  WalletCards, X as XIcon, Zap
} from "lucide-react";

type ScoreData = {
  connected: boolean;
  demo?: boolean;
  profile?: { id: string; name: string; username: string; profile_image_url?: string; description?: string; followers_count?: number; following_count?: number; tweet_count?: number; listed_count?: number; verified?: boolean };
  generalScore?: number;
  ctScore?: number;
  metrics?: { engagementRate: number; postsAnalyzed: number; cryptoPosts: number; averageLikes: number; averageReplies: number; averageReposts: number };
  breakdown?: { label: string; score: number; note: string }[];
  error?: string;
};

const demo: ScoreData = {
  connected: false, demo: true,
  profile: { id: "demo", name: "Alex Morgan", username: "alexbuilds", description: "Building in public • Tech, startups & onchain culture.", followers_count: 12840, following_count: 816, tweet_count: 2341, listed_count: 42, verified: false },
  generalScore: 78, ctScore: 64,
  metrics: { engagementRate: 4.8, postsAnalyzed: 86, cryptoPosts: 31, averageLikes: 94, averageReplies: 18, averageReposts: 22 },
  breakdown: [
    { label: "Audience presence", score: 84, note: "Follower reach and public profile signals" },
    { label: "Conversation", score: 76, note: "Replies and community interaction" },
    { label: "Consistency", score: 71, note: "Posting activity in the available sample" },
    { label: "Engagement", score: 80, note: "Average public interactions per post" }
  ]
};

function scoreTone(score: number) {
  if (score >= 80) return "Elite";
  if (score >= 65) return "Rising";
  if (score >= 45) return "Building";
  return "Early";
}

function Ring({ score, label, sublabel, color = "violet" }: { score: number; label: string; sublabel: string; color?: "violet" | "mint" }) {
  const circumference = 2 * Math.PI * 48;
  return <div className={`ring-card ${color}`}>
    <div className="ring-wrap">
      <svg viewBox="0 0 112 112" className="ring-svg" aria-label={`${label}: ${score} out of 100`}>
        <circle cx="56" cy="56" r="48" className="ring-track" />
        <circle cx="56" cy="56" r="48" className="ring-progress" strokeDasharray={`${circumference * score / 100} ${circumference}`} />
      </svg>
      <div className="ring-number"><strong>{score}</strong><span>/100</span></div>
    </div>
    <div className="ring-copy"><span>{label}</span><strong>{scoreTone(score)} signal</strong><small>{sublabel}</small></div>
  </div>;
}

function Bar({ label, score, note }: { label: string; score: number; note: string }) {
  return <div className="bar-row">
    <div className="bar-top"><div><strong>{label}</strong><small>{note}</small></div><b>{score}</b></div>
    <div className="bar-track"><div className="bar-fill" style={{ width: `${score}%` }} /></div>
  </div>;
}

export default function Home() {
  const [data, setData] = useState<ScoreData>(demo);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    fetch("/api/score").then(r => r.ok ? r.json() : null).then((result: ScoreData | null) => {
      if (result?.connected) setData(result);
    }).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") setNotice("X account connected. Your latest available data is ready.");
    if (params.get("error")) setNotice(`Connection issue: ${params.get("error")}`);
  }, []);

  async function refreshScore() {
    setLoading(true); setNotice("");
    try {
      const response = await fetch("/api/score?refresh=1");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not refresh score.");
      setData(result);
      setNotice("Score refreshed using the data currently available from X.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to refresh right now.");
    } finally { setLoading(false); }
  }

  function connectX() { window.location.href = "/api/auth/x"; }
  function shareScore() {
    const text = `My Nexa Score: ${data.generalScore ?? 0}/100 Influence · ${data.ctScore ?? 0}/100 CT. Check your signal.`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin)}`, "_blank", "noopener,noreferrer");
  }
  function searchProfile(e: React.FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (!clean) return;
    setNotice("Username-only checking is not enabled in this version. Connect your X account for authenticated analysis.");
  }

  const profile = data.profile || demo.profile!;
  const metrics = data.metrics || demo.metrics!;
  const breakdown = data.breakdown || demo.breakdown!;

  return <main className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Activity size={20} strokeWidth={2.5}/></div><div><b>nexa<span>score</span></b><small>YOUR SOCIAL SIGNAL</small></div><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><XIcon size={18}/></button></div>
      <div className="workspace-pill"><div className="workspace-avatar">N</div><div><strong>Nexa workspace</strong><small>Free plan</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>
        <a className="nav-item active" href="#overview"><LayoutDashboard size={18}/> Overview <span className="nav-dot"/></a>
        <a className="nav-item" href="#scores"><Gauge size={18}/> My scores</a>
        <a className="nav-item" href="#analytics"><BarChart3 size={18}/> Analytics</a>
        <a className="nav-item" href="#ct-score"><Flame size={18}/> CT signal <span className="nav-new">NEW</span></a>
        <a className="nav-item" href="#leaderboard"><TrendingUp size={18}/> Leaderboard <LockKeyhole size={13} className="nav-lock"/></a>
      </nav>
      <div className="nav-label nav-label-spaced">YOUR ACCOUNT</div>
      <nav>
        <button className="nav-item" onClick={connectX}><Globe2 size={18}/> Connect X</button>
        <a className="nav-item" href="#settings"><Settings2 size={18}/> Settings</a>
        <a className="nav-item" href="#help"><CircleHelp size={18}/> Help center</a>
      </nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Your signal, clearer.</strong><p>Connect your X account to calculate a score from available real data.</p><button onClick={connectX}>Connect account <ArrowRight size={14}/></button></div>
        <div className="user-mini"><div className="user-avatar">N</div><div><strong>Nexa user</strong><small>Free account</small></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>

    <section className="main-panel">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button>
        <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div>
        <div className="top-actions"><div className="status-pill"><span/> System operational</div><button className="icon-btn" aria-label="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">N</div></div>
      </header>

      <div className="content">
        <div className="welcome-row" id="overview">
          <div><div className="eyebrow"><span className="eyebrow-line"/> SOCIAL INTELLIGENCE, SIMPLIFIED</div><h1>Know your <span>signal.</span></h1><p className="page-subtitle">Your influence is more than a follower count. Get the bigger picture.</p></div>
          <div className="welcome-actions"><button className="button secondary" onClick={shareScore}><ExternalLink size={16}/> Share score</button><button className="button primary" onClick={connectX}><XIcon size={16}/> {data.connected ? "Reconnect X" : "Connect X account"} <ArrowUpRight size={15}/></button></div>
        </div>

        {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><XIcon size={15}/></button></div>}
        {data.demo && <div className="demo-banner"><div className="demo-badge"><Sparkles size={14}/> PREVIEW MODE</div><span>You're viewing sample data. Connect X to calculate scores from your available account data.</span><button onClick={connectX}>Connect now <ArrowRight size={14}/></button></div>}

        <form className="profile-search" onSubmit={searchProfile}>
          <div className="search-icon"><Search size={18}/></div><input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter an X username (connect your account to analyze)" aria-label="X username"/>
          <span className="search-hint">COMING SOON</span><button type="submit" aria-label="Search username"><ArrowRight size={17}/></button>
        </form>

        <div className="section-heading" id="scores"><div><h2>Your score overview</h2><p>Two ways to understand your presence on X.</p></div><button className="text-button" onClick={refreshScore} disabled={loading}><RefreshCw size={14} className={loading ? "spin" : ""}/>{loading ? "Refreshing…" : "Refresh data"}</button></div>

        <div className="score-grid">
          <div className="score-feature">
            <div className="feature-top"><div><div className="score-label"><span className="score-label-icon purple"><Globe2 size={15}/></span> GENERAL INFLUENCE</div><p className="feature-description">Your overall presence, reach and engagement.</p></div><button className="dots-btn" aria-label="More options"><MoreHorizontal size={19}/></button></div>
            <Ring score={data.generalScore ?? 0} label="Influence score" sublabel="Overall X presence"/>
            <div className="feature-footer"><span><span className="mini-dot purple-dot"/> Public profile signals</span><span className="muted">Out of 100</span></div>
          </div>
          <div className="score-feature" id="ct-score">
            <div className="feature-top"><div><div className="score-label"><span className="score-label-icon mint"><Flame size={15}/></span> CRYPTO TWITTER</div><p className="feature-description">Your footprint in crypto conversations.</p></div><button className="dots-btn" aria-label="More options"><MoreHorizontal size={19}/></button></div>
            <Ring score={data.ctScore ?? 0} label="CT score" sublabel="Crypto community signal" color="mint"/>
            <div className="feature-footer"><span><span className="mini-dot mint-dot"/> Crypto-topic activity</span><span className="muted">Out of 100</span></div>
          </div>
        </div>

        <div className="lower-grid" id="analytics">
          <div className="panel-card breakdown-card">
            <div className="card-heading"><div><h3>Influence breakdown</h3><p>What contributes to your general score.</p></div><button className="dots-btn" aria-label="More options"><MoreHorizontal size={19}/></button></div>
            <div className="breakdown-list">{breakdown.map(item => <Bar key={item.label} {...item}/>)}</div>
            <div className="card-footnote"><ShieldCheck size={15}/> Scores are estimates based on available public metrics.</div>
          </div>
          <div className="panel-card profile-card">
            <div className="card-heading"><div><h3>Connected profile</h3><p>Your X account at a glance.</p></div><span className={`connection-tag ${data.connected ? "connected" : ""}`}><span/>{data.connected ? "Connected" : "Preview"}</span></div>
            <div className="profile-identity"><div className="profile-picture">{profile.profile_image_url ? <img src={profile.profile_image_url} alt="X profile"/> : <span>{profile.name?.slice(0,1) || "N"}</span>}</div><div className="profile-name"><strong>{profile.name} {profile.verified && <BadgeCheck size={15} className="verified"/>}</strong><span>@{profile.username}</span></div><button className="dots-btn" aria-label="Profile options"><MoreHorizontal size={19}/></button></div>
            <p className="profile-bio">{profile.description || "Connect your X account to see your profile details here."}</p>
            <div className="profile-stats"><div><span>Followers</span><strong>{Number(profile.followers_count || 0).toLocaleString()}</strong></div><div><span>Following</span><strong>{Number(profile.following_count || 0).toLocaleString()}</strong></div><div><span>Posts</span><strong>{Number(profile.tweet_count || 0).toLocaleString()}</strong></div></div>
            {!data.connected && <button className="connect-inline" onClick={connectX}><XIcon size={15}/> Connect your X account <ArrowRight size={15}/></button>}
          </div>
        </div>

        <div className="section-heading section-heading-small"><div><h2>Engagement snapshot</h2><p>Signals from the latest analyzed posts.</p></div><span className="period-tag"><Clock3 size={13}/> Latest available sample</span></div>
        <div className="metric-grid">
          <div className="metric-card"><div className="metric-head"><span className="metric-icon violet-bg"><Activity size={17}/></span><span className="metric-trend positive"><ArrowUpRight size={13}/> Signal</span></div><span className="metric-label">Engagement rate</span><strong>{metrics.engagementRate.toFixed(1)}<small>%</small></strong><p>Interactions relative to audience size</p></div>
          <div className="metric-card"><div className="metric-head"><span className="metric-icon blue-bg"><MessageCircle size={17}/></span><span className="metric-trend neutral">Sample</span></div><span className="metric-label">Posts analyzed</span><strong>{metrics.postsAnalyzed.toLocaleString()}</strong><p>Posts available to the analyzer</p></div>
          <div className="metric-card"><div className="metric-head"><span className="metric-icon mint-bg"><Flame size={17}/></span><span className="metric-trend positive"><ArrowUpRight size={13}/> CT</span></div><span className="metric-label">Crypto-related posts</span><strong>{metrics.cryptoPosts.toLocaleString()}</strong><p>Detected in the available sample</p></div>
          <div className="metric-card"><div className="metric-head"><span className="metric-icon orange-bg"><Zap size={17}/></span><span className="metric-trend neutral">Average</span></div><span className="metric-label">Interactions per post</span><strong>{(metrics.averageLikes + metrics.averageReplies + metrics.averageReposts).toLocaleString()}</strong><p>Likes, replies and reposts combined</p></div>
        </div>

        <div className="bottom-callout" id="leaderboard"><div className="callout-symbol"><TrendingUp size={20}/></div><div><strong>Find your place in the conversation.</strong><p>Community leaderboards are planned for a future release. Rankings will be opt-in and based on transparent scoring.</p></div><span className="coming-tag">COMING SOON</span></div>
        <footer><div className="footer-brand"><span className="footer-mark">N</span> Nexa Score <span className="footer-dot">·</span> Know your signal.</div><div className="footer-links"><a href="#help">Help</a><a href="#settings">Privacy</a><a href="#settings">Terms</a></div><span className="copyright">© 2026 Nexa Score</span></footer>
      </div>
    </section>
  </main>;
}
