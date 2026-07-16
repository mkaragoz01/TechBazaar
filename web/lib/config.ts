// Server-side only: the Express API/asset origin. During the Faz C migration
// the browser only ever talks to the Next.js origin — requests to paths Next
// doesn't own are proxied to this origin via next.config.ts's fallback rewrite.
export const EXPRESS_ORIGIN = process.env.EXPRESS_ORIGIN ?? "http://localhost:5000";
