import {
  ARCHIVE_FORMATS,
  clearArchives,
  listArchives,
  writeArchive,
  type ArchiveFormat,
} from "@/src/server/archive";

export const dynamic = "force-dynamic";

/** List the archive library, newest first. */
export async function GET() {
  return Response.json({ archives: await listArchives() });
}

/**
 * Archive a client-side artifact (the JSON / HTML files the editor builds in
 * the browser). `content` is base64 so binary and text travel the same way.
 */
export async function POST(request: Request) {
  let body: {
    title?: string;
    format?: string;
    filename?: string;
    content?: string;
    docId?: string;
    templateId?: string;
    pages?: number;
  } | null = null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body?.content || typeof body.content !== "string") {
    return Response.json({ error: "content (base64) required" }, { status: 400 });
  }
  const format = body.format;
  if (typeof format !== "string" || !(ARCHIVE_FORMATS as readonly string[]).includes(format)) {
    return Response.json({ error: `format must be one of ${ARCHIVE_FORMATS.join("/")}` }, { status: 400 });
  }

  try {
    const record = await writeArchive(
      format as ArchiveFormat,
      body.filename ?? "resume",
      Buffer.from(body.content, "base64"),
      {
        title: body.title,
        ...(body.templateId ? { templateId: body.templateId } : {}),
        ...(typeof body.pages === "number" ? { pages: body.pages } : {}),
        ...(body.docId ? { docId: body.docId } : {}),
      },
    );
    return Response.json({ ok: true, id: record.id }, { status: 201 });
  } catch (error) {
    // writeArchive only throws for caller mistakes (format / size) — 400, not 500.
    return Response.json({ error: (error as Error).message || "archive failed" }, { status: 400 });
  }
}

/** Clear the whole library. Deliberately requires `?all=1` so a stray DELETE cannot wipe it. */
export async function DELETE(request: Request) {
  if (new URL(request.url).searchParams.get("all") !== "1") {
    return Response.json({ error: "pass ?all=1 to clear the archive" }, { status: 400 });
  }
  const removed = await clearArchives();
  return Response.json({ ok: true, removed });
}
