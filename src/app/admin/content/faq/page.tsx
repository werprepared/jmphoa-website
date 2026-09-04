import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { addFaqAction, deleteFaqAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function FaqAdminPage() {
  await requireRole("ADMIN");
  const faqs = await prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">FAQ</h1>

      <form
        action={async (formData: FormData) => {
          "use server";
          const question = String(formData.get("question") || "").trim();
          const answer = String(formData.get("answer") || "").trim();
          if (question && answer) await addFaqAction(question, answer);
        }}
        className="bg-card border border-border rounded-lg p-5 space-y-3"
      >
        <h2 className="font-semibold text-navy text-sm">Add a question</h2>
        <input name="question" placeholder="Question" required className="w-full border border-border rounded px-3 py-2" />
        <textarea name="answer" placeholder="Answer" required rows={3} className="w-full border border-border rounded px-3 py-2" />
        <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {faqs.map((f) => (
          <div key={f.id} className="bg-card border border-border rounded-lg p-4 flex justify-between gap-4">
            <div>
              <div className="font-medium text-navy">{f.question}</div>
              <div className="text-sm text-muted mt-1 whitespace-pre-wrap">{f.answer}</div>
            </div>
            <form action={async () => { "use server"; await deleteFaqAction(f.id); }}>
              <button className="text-xs text-muted hover:text-red-600 shrink-0">Delete</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
