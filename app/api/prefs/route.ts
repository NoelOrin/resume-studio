import { readPrefs, savePrefs, type Prefs } from "@/src/server/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  const prefs = await readPrefs().catch(() => ({}) as Prefs);
  return Response.json(prefs);
}

export async function PUT(request: Request) {
  let body: Partial<Prefs> | null = null;
  try {
    body = (await request.json()) as Partial<Prefs>;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ error: "invalid body" }, { status: 400 });

  try {
    await savePrefs(body);
  } catch (error) {
    return Response.json({ error: (error as Error).message || "invalid prefs" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
