import { buildArtifact, NoBrowserError } from "@/src/server/artifacts";
import { writeArchive } from "@/src/server/archive";
import { migrateDocument } from "@/src/lib/migrate";
import type { ResumeData } from "@/src/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ format: string }> };

const MIME = { pdf: "application/pdf", png: "image/png" } as const;

/** `filename` stays ASCII for old clients; `filename*` carries the real name. */
function attachment(filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * Server-side PDF / PNG export: render the document, drive a headless browser,
 * archive the artifact, and stream the bytes back. Archiving is best-effort —
 * a miss is flagged via `x-archive: miss` instead of failing the download.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { format } = await params;
  if (format !== "pdf" && format !== "png") {
    return Response.json({ error: `unsupported export format "${format}" (expected pdf/png)` }, { status: 404 });
  }

  let body: { data?: ResumeData; title?: string; docId?: string } | null = null;
  try {
    body = (await request.json()) as { data?: ResumeData; title?: string; docId?: string };
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const data = migrateDocument(body?.data);
  if (!data) return Response.json({ error: "invalid document" }, { status: 400 });
  const title = String(body?.title ?? "未命名简历").slice(0, 120);

  let artifact;
  try {
    artifact = await buildArtifact(format, data, title);
  } catch (error) {
    if (error instanceof NoBrowserError) {
      return Response.json({ error: error.message, code: error.code }, { status: 503 });
    }
    return Response.json({ error: (error as Error).message || "export failed" }, { status: 500 });
  }

  let archiveId: string | null = null;
  try {
    const record = await writeArchive(format, artifact.filename, artifact.bytes, {
      title,
      templateId: artifact.templateId,
      pages: artifact.pages,
      ...(body?.docId ? { docId: body.docId } : {}),
    });
    archiveId = record.id;
  } catch {
    /* the download itself is still valid */
  }

  return new Response(new Uint8Array(artifact.bytes), {
    headers: {
      "content-type": MIME[format],
      "content-disposition": attachment(artifact.filename),
      ...(archiveId ? { "x-archive-id": archiveId } : { "x-archive": "miss" }),
      "x-pages": String(artifact.pages),
    },
  });
}
