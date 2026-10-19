import { EditorApp } from "@/src/EditorApp";
import { listDocs, readDoc } from "@/src/server/store";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string }>;
}) {
  const { doc: docId } = await searchParams;

  const [docs, initialDoc] = await Promise.all([
    listDocs().catch(() => []),
    docId ? readDoc(docId).catch(() => null) : Promise.resolve(null),
  ]);

  return <EditorApp initialDocs={docs} initialDoc={initialDoc} />;
}
