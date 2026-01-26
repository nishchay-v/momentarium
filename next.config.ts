import type { NextConfig } from "next";

const r2Url = process.env.R2_PUBLIC_URL || "https://assets.nishchay.dpdns.org";
const url = new URL(r2Url);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        port: url.port,
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;