// Strips tags for short table/list previews of Tiptap-authored HTML. Not a
// sanitizer — sanitize-html already cleaned the content server-side before
// it was saved; this only affects how it's *previewed* here.
export function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
