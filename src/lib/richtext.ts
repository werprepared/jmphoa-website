/** True if a RichTextEditor's HTML has no visible text (e.g. an empty "<p></p>"). */
export function richTextIsEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  return !html.replace(/<[^>]*>/g, "").trim();
}
