import { isValidId, writePublished } from "@/src/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { id?: string; title?: string; html?: string } | null = null;
  try {
    body = (await request.json()) as { id?: string; title?: string; html?: string };
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body?.html || typeof body.html !== "string") {
    return Response.json({ error: "html required" }, { status: 400 });
  }

  const id = body.id && isValidId(body.id) ? body.id : `resume-${Date.now().toString(36)}`;
  const path = await writePublished(id, body.html);
  return Response.json({ ok: true, path, title: body.title ?? "" });
}
