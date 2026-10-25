import { readPublished } from "@/src/server/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const html = await readPublished(id);
  if (!html) return new Response("not published", { status: 404 });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      // A published resume is static markup with inlined CSS and `data:` backgrounds
      // (see src/lib/exporters.ts). `sandbox` plus `default-src 'none'` makes sure a
      // hand-posted `/api/publish` payload can never execute script or reach the
      // editor's origin-scoped APIs.
      "content-security-policy":
        "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'",
    },
  });
}
