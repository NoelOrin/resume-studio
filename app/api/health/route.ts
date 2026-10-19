import { TEMPLATE_CATALOG } from "@/src/templates/catalog";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    service: "resume-studio",
    runtime: "vinext",
    templates: TEMPLATE_CATALOG.map((t) => t.id),
    time: new Date().toISOString(),
  });
}
