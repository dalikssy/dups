// Private areas: never cached, never framed by another site, never indexed.
const PRIVATE = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // the audit PDF reads its fonts from disk at request time
    outputFileTracingIncludes: { "/a/[slug]/pdf": ["./lib/adminhub/fonts/**"] },
  },
  async headers() {
    return [
      { source: "/adminhub/:path*", headers: PRIVATE },
      { source: "/portal/:path*", headers: PRIVATE },
      { source: "/a/:path*", headers: PRIVATE },
      { source: "/api/:path*", headers: PRIVATE },
      { source: "/onboarding/:path*", headers: PRIVATE.filter((h) => h.key !== "Cache-Control") },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
