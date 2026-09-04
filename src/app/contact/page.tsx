import PageHeader from "@/components/PageHeader";
import ContactForm from "./ContactForm";

export default function ContactPage() {
  return (
    <div>
      <PageHeader title="Contact Us" subtitle="Reach the Board or one of our committees directly." />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-card border border-border rounded-lg p-6 mb-8 text-sm text-muted space-y-1">
          <p>Board: <a className="text-primary hover:underline" href="mailto:JMPHOAboard@gmail.com">JMPHOAboard@gmail.com</a></p>
          <p>Architecture Committee: <a className="text-primary hover:underline" href="mailto:JMPHOArch@gmail.com">JMPHOArch@gmail.com</a></p>
          <p>Social Committee: <a className="text-primary hover:underline" href="mailto:JMPHOAsocial@gmail.com">JMPHOAsocial@gmail.com</a></p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
