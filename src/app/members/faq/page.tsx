import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  await requireApprovedUser();
  const faqs = await prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <PageHeader title="Frequently Asked Questions" />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {faqs.length === 0 ? (
          <p className="text-muted">No FAQs have been added yet.</p>
        ) : (
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.id} className="bg-card border border-border rounded-lg p-4 group">
                <summary className="font-medium text-navy cursor-pointer list-none flex justify-between items-center">
                  {f.question}
                  <span className="text-primary group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="text-muted mt-2 whitespace-pre-wrap">{f.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
