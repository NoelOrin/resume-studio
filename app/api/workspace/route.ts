import { readWorkspace, saveWorkspace } from "@/src/server/workspace";
import type { ResumeData } from "@/src/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const workspace = await readWorkspace().catch(() => null);
  return Response.json({ workspace });
}

export async function PUT(request: Request) {
  let body: { title?: unknown; data?: unknown; docId?: unknown } | null = null;
  try {
    body = (await request.json()) as { title?: unknown; data?: unknown; docId?: unknown };
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body?.data) return Response.json({ error: "data required" }, { status: 400 });

  try {
    const workspace = await saveWorkspace({
      title: typeof body.title === "string" ? body.title : "未命名简历",
      data: body.data as ResumeData,
      docId: typeof body.docId === "string" ? body.docId : null,
    });
    return Response.json({ ok: true, savedAt: workspace.savedAt });
  } catch (error) {
    // `saveWorkspace` normalises through `migrateDocument`; a rejection means
    // the payload was not a document — a bad request, not a server fault.
    return Response.json({ error: (error as Error).message || "invalid document" }, { status: 400 });
  }
}
