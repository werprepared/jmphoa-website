import PageHeader from "@/components/PageHeader";
import ContactForm from "./ContactForm";
import type { ContactRecipient } from "@prisma/client";

const VALID_RECIPIENTS: ContactRecipient[] = ["BOARD", "ARCHITECTURE", "SOCIAL", "LANDSCAPE"];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const defaultRecipient: ContactRecipient = VALID_RECIPIENTS.includes(to as ContactRecipient)
    ? (to as ContactRecipient)
    : "BOARD";

  return (
    <div>
      <PageHeader title="Contact Us" subtitle="Reach the Board or one of our committees directly." />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-card border border-border rounded-lg p-6 mb-8 text-sm text-muted space-y-1">
          <p>Board: <a className="text-primary hover:underline" href="mailto:board@jmphoa.org">board@jmphoa.org</a></p>
          <p>Architecture Committee: <a className="text-primary hover:underline" href="mailto:arch@jmphoa.org">arch@jmphoa.org</a></p>
          <p>Social Committee: <a className="text-primary hover:underline" href="mailto:social@jmphoa.org">social@jmphoa.org</a></p>
          <p>Landscape Committee: <a className="text-primary hover:underline" href="mailto:landscape@jmphoa.org">landscape@jmphoa.org</a></p>
        </div>
        <ContactForm defaultRecipient={defaultRecipient} />
      </div>
    </div>
  );
}
