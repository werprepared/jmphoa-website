import DOMPurify from "isomorphic-dompurify";

export default function RichText({ html, className = "" }: { html: string; className?: string }) {
  const clean = DOMPurify.sanitize(html);
  return <div className={`prose-content ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
