import type { NextConfig } from "next";

/** Allow next/image to load post images from the API host (e.g. http://localhost:3001/uploads/...) */
function buildUploadRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  try {
    const u = new URL(raw);
    const protocol = u.protocol === "https:" ? "https" : "http";
    const pattern: {
      protocol: "http" | "https";
      hostname: string;
      pathname: string;
      port?: string;
    } = {
      protocol,
      hostname: u.hostname,
      pathname: "/uploads/**",
    };
    if (u.port) pattern.port = u.port;
    return [pattern];
  } catch {
    return [
      {
        protocol: "http" as const,
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
    ];
  }
}

/**
 * Next’s optimizer fetches remote image URLs on the server; by default it blocks private IPs.
 * Enable for local dev, or when the API URL is loopback (e.g. `next start` against a local backend).
 */
function shouldAllowLocalIpForImages(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const raw = process.env.NEXT_PUBLIC_API_URL || "";
  try {
    const { hostname } = new URL(raw);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: buildUploadRemotePatterns(),
    dangerouslyAllowLocalIP: shouldAllowLocalIpForImages(),
  },
};

export default nextConfig;
