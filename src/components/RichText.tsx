import sanitizeHtml from "sanitize-html";

export default function RichText({ html, className = "" }: { html: string; className?: string }) {
  const clean = sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "u", "s"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "name", "target", "rel"],
    },
  });
  return <div className={`prose-content ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
