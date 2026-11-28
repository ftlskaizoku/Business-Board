import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep recently visited pages in the browser's router cache for 30s, so
    // tapping back to a tab you just left is instant instead of re-fetching.
    // Saving anything (sale, expense, stock...) already calls revalidatePath
    // in its server action, which clears this cache, so data never goes stale
    // after a change made on this device.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
