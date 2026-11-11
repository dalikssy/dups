export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/adminhub", "/api/", "/onboarding"] }],
  };
}
