// Server-side only: the Express API/asset origin. During the Faz C migration
// the browser only ever talks to the Next.js origin — requests to paths Next
// doesn't own are proxied to this origin via next.config.ts's fallback rewrite.
export const EXPRESS_ORIGIN = process.env.EXPRESS_ORIGIN ?? "http://localhost:5000";

// This app's own public origin — used for metadataBase, sitemap.ts, and
// robots.ts, where absolute URLs are required regardless of what host the
// request actually arrived on.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
