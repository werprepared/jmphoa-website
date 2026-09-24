import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { addFaqAction } from "../actions";
import RichTextEditor from "@/components/RichTextEditor";
import { richTextIsEmpty } from "@/lib/richtext";
import FaqRow from "./FaqRow";

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
          if (question && !richTextIsEmpty(answer)) await addFaqAction(question, answer);
        }}
        className="bg-card border border-border rounded-lg p-5 space-y-3"
      >
        <h2 className="font-semibold text-navy text-sm">Add a question</h2>
        <input name="question" placeholder="Question" required className="w-full border border-border rounded px-3 py-2" />
        <RichTextEditor name="answer" />
        <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {faqs.map((f) => (
          <FaqRow key={f.id} id={f.id} question={f.question} answer={f.answer} />
        ))}
      </div>
    </div>
  );
}
