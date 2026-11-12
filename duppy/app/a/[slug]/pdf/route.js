import { getAudit } from "@/lib/adminhub/outreach";
import { auditPdf } from "@/lib/adminhub/auditPdf";

export const dynamic = "force-dynamic";

// The audit as a branded PDF. Anyone holding the link may download it.
export async function GET(request, { params }) {
  const audit = await getAudit(params.slug);
  if (!audit) return new Response("Not found", { status: 404 });
  const bytes = await auditPdf({ name: audit.name, language: audit.language }, audit.data, audit.created_at);
  const file = `${audit.name.replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "") || "audit"}-DUPSCALED-audit.pdf`;
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
