import type { NextConfig } from "next";

// Use only a separately provisioned demo backend, never the original service.
const apiUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const mediaOrigin = new URL(process.env.NEXT_PUBLIC_MEDIA_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED: process.env.NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED || "true",
  },
  images: {
    remotePatterns: [{
      protocol: mediaOrigin.protocol.replace(":", "") as "http" | "https",
      hostname: mediaOrigin.hostname,
      port: mediaOrigin.port,
      pathname: "/media/**",
    }],
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      { source: "/.old", destination: "/", permanent: false },
      { source: "/.old/:path*", destination: "/:path*", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/v1/:path*/", destination: `${apiUrl}/api/v1/:path*/` },
      { source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` },
      { source: "/media/:path*", destination: `${apiUrl}/media/:path*` },
    ];
  },
};

export default nextConfig;
