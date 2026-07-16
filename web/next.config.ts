import path from "node:path";
import type { NextConfig } from "next";

const EXPRESS_ORIGIN = process.env.EXPRESS_ORIGIN ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  // Repo root also has a package-lock.json (the Express app); pin Turbopack
  // to this folder so it doesn't try to treat the whole repo as one workspace.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/img/**",
      },
    ],
    // The Express backend runs on localhost in dev; Next.js blocks image
    // optimization requests to private/loopback IPs (SSRF guard) unless
    // explicitly allowed. In production EXPRESS_ORIGIN should point at a
    // real backend host, making this unnecessary there.
    dangerouslyAllowLocalIP: true,
  },
  async rewrites() {
    return {
      // Anything not yet migrated to a real Next.js page (old Pug routes,
      // uploaded product images, /admin, /login, ...) falls back to Express
      // so the site stays a single coherent origin during the migration.
      fallback: [
        {
          source: "/:path*",
          destination: `${EXPRESS_ORIGIN}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
