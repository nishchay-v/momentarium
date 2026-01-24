import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL(`${process.env.R2_PUBLIC_URL}/**` || "https://assets.nishchay.dpdns.org")],
  },
};

export default nextConfig;
