import { listDocs } from "@/src/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const docs = await listDocs();
  return Response.json({ docs });
}
