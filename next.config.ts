import type { NextConfig } from "next";

// Browser-side protections sent with every response.
// - frame-ancestors / X-Frame-Options: nobody can embed the app in a hidden
//   frame to trick a click (clickjacking).
// - nosniff, Referrer-Policy, Permissions-Policy: stop type-sniffing, limit
//   what is leaked to other sites, switch off sensors the app never uses.
// - HSTS: after the first visit the browser refuses plain http.
// A full script-src CSP is not set on purpose: Next injects inline scripts and
// a nonce-based policy needs a dedicated pass (see SECURITY.md).
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
