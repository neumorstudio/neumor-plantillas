import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizations
  reactStrictMode: true,
  //
  // Transpile workspace packages
  transpilePackages: ["@neumorstudio/supabase"],

  // Experimental features for Next.js 15
  experimental: {
    // Enable PPR (Partial Prerendering) when stable
    // ppr: true,
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
