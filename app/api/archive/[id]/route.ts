import { deleteArchive, readArchive } from "@/src/server/archive";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const MIME = {
  json: "application/json",
  html: "text/html;charset=utf-8",
  pdf: "application/pdf",
  png: "image/png",
} as const;

/** Download one archived artifact. */
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const stored = await readArchive(id);
  if (!stored) return Response.json({ error: "not found" }, { status: 404 });

  const fallback = stored.record.filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return new Response(new Uint8Array(stored.content), {
    headers: {
      "content-type": MIME[stored.record.format],
      "content-disposition": `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(stored.record.filename)}`,
    },
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const removed = await deleteArchive(id);
  if (!removed) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
