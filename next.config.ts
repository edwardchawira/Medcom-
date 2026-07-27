import type { NextConfig } from "next";

let supabaseHost: string | undefined;
try {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (u) supabaseHost = new URL(u).hostname;
} catch {
  supabaseHost = undefined;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    proxyClientMaxBodySize: "70mb",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
