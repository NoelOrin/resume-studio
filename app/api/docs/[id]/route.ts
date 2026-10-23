import { deleteDoc, isValidId, readDoc, writeDoc } from "@/src/server/store";
import type { ResumeData } from "@/src/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const doc = await readDoc(id);
  if (!doc) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(doc);
}

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "invalid id" }, { status: 400 });

  let body: { title?: string; data?: ResumeData } | null = null;
  try {
    body = (await request.json()) as { title?: string; data?: ResumeData };
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body?.data) return Response.json({ error: "data required" }, { status: 400 });

  const record = await writeDoc(id, body.title ?? "未命名简历", body.data).catch((error: unknown) => {
    // `writeDoc` normalises through `migrateDocument` and rejects non-documents;
    // that is a bad request, not a server fault.
    return Response.json({ error: (error as Error).message || "invalid document" }, { status: 400 });
  });
  if (record instanceof Response) return record;
  return Response.json({ ok: true, id: record.id, updatedAt: record.updatedAt });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "invalid id" }, { status: 400 });
  await deleteDoc(id);
  return Response.json({ ok: true });
}
