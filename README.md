# Nexa Score

Nexa Score is a mobile-first X (Twitter) influence dashboard with two transparent score views:
- **General Influence** — audience presence, engagement, conversation, and posting sample.
- **Crypto Twitter (CT)** — crypto-topic activity and engagement in the available recent-post sample.

The project starts in **preview mode** with clearly labeled sample data. Real scores are calculated only after a user connects an X account and the X API returns usable profile and post data.

## Features in this starter

- Premium dark dashboard, responsive on mobile and desktop
- X OAuth 2.0 authorization-code flow with PKCE and state validation
- HttpOnly signed session cookie; access token is not exposed to browser JavaScript
- API routes to retrieve the connected profile and recent posts
- Transparent heuristic score calculation from returned metrics
- Score sharing via X intent
- Optional Supabase schema for score history and consent-based leaderboards
- No payment gates; free-first foundation

## Requirements

- Node.js 18.17+ (Node 20 LTS recommended)
- An X Developer application with OAuth 2.0 enabled
- A deployed Vercel project for production hosting
- Optional Supabase project for future persistence

## Run locally

1. Extract the ZIP so `package.json` is at the project root.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local`.
4. Fill in the X OAuth variables described below.
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

The app builds and runs in preview mode even when X credentials are blank. Clicking Connect X will return a clear configuration error until credentials are configured.

## X OAuth configuration

In your X Developer Portal, configure OAuth 2.0 with a web app / confidential client as supported by your app settings. Add this callback URL exactly:

`http://localhost:3000/api/auth/x/callback`

For production, use:

`https://YOUR-VERCEL-DOMAIN/api/auth/x/callback`

Set these environment variables in `.env.local` and in Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_APP_URL` — deployed base URL, e.g. `https://your-project.vercel.app`
- `X_CLIENT_ID` — OAuth 2.0 client ID
- `X_CLIENT_SECRET` — client secret for a confidential client; keep it server-only
- `X_REDIRECT_URI` — callback URL, matching the Developer Portal exactly
- `X_SCOPES` — default: `users.read,tweet.read,offline.access`
- `X_SESSION_SECRET` — recommended long random secret used to sign the session cookie. Generate one with `openssl rand -base64 48`.

If your X app requires additional scopes or uses a public-client configuration, adjust the token exchange/auth settings according to the current X developer documentation. Do not put client secrets or service-role keys in `NEXT_PUBLIC_*` variables.

## API access and limitations

X API availability, rate limits, endpoint access, and pricing depend on the developer account and current X API plan. OAuth success does not guarantee that recent-post metrics can be read. If X rejects a request, the app shows an error rather than fabricating a real score.

The analyzer currently examines up to 100 recent original posts returned by the API. It uses the public metrics returned by X and a transparent keyword-based crypto classifier. The CT score is a heuristic, not an official X score, financial advice, or a measure of a person's credibility. Keyword matching can misclassify posts and should be improved with a labeled evaluation set before making strong claims.

The engagement-rate metric is an estimate based on available public interactions divided by follower count. Impression counts may not be available, so it is not the same as impressions-based engagement rate. A small recent-post sample can make scores volatile. Score history and growth comparisons require persistence and repeated snapshots, which are not wired to the database yet.

## Supabase (optional)

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only when client-side Supabase features are added.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

The current version does not yet write snapshots to Supabase or provide a public leaderboard. The schema is a safe starting point; no open read/write policies are enabled.

## Deploy to Vercel

1. Upload the extracted project files to a GitHub repository (files must be at the repository root, not nested in another project folder).
2. Import that repository into Vercel.
3. Set the environment variables listed above.
4. Add the production callback URL in your X Developer Portal.
5. Deploy, then test Connect X and Refresh data.

## Security and production checklist

- Keep `X_CLIENT_SECRET`, `X_SESSION_SECRET`, and any Supabase service role key private.
- Set `X_SESSION_SECRET` to a unique, high-entropy value in production.
- Use HTTPS in production.
- Review X's current developer policies, app permissions, API plan, and data-retention requirements.
- Add token refresh handling and server-side revocation before operating at scale.
- Add Supabase user identity mapping, per-user authorization, and retention/deletion controls before persisting score history.
- Add rate limiting and abuse controls to OAuth callback and scoring routes.
- Have privacy policy and terms available before opening to the public.
- Make leaderboard participation opt-in; do not publish rankings by default.

## Project structure

```text
app/
  api/
    auth/logout/route.ts
    auth/x/route.ts
    auth/x/callback/route.ts
    score/route.ts
  globals.css
  layout.tsx
  page.tsx
lib/
  session.ts
  x.ts
supabase/
  schema.sql
.env.example
```

## Scoring approach

The code in `lib/x.ts` calculates a 0–100 score using:
- Audience presence: logarithmic follower scale
- Engagement: average interactions relative to followers
- Conversation: replies and reposts in the sample
- Consistency: recent sample size and public post count
- CT signal: count and share of crypto-related posts plus their interaction signal

These are heuristic weights, not an official platform ranking. Change the weights only after validating them against real account samples and documenting the scoring version.
