import { notFound } from "next/navigation";
import { DOCS, getDocBySlug } from "@/lib/docs-content";
import DocsSidebar from "@/components/docs/docs-sidebar";

interface DocsPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DOCS.map((doc) => ({ slug: doc.slug }));
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <DocsSidebar />
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="border-[3px] border-[#fe5733] bg-[#141414] p-6 md:p-8">
              <article className="docs-content prose-invert max-w-none font-mono text-sm leading-relaxed text-gray-300">
                {doc.content}
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
