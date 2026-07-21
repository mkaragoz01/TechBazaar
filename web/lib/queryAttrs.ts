// Next.js's `searchParams` is a flat `{ [key]: string | string[] }` object —
// unlike Express's `qs` parser on the backend, it doesn't turn `attr[id]=v`
// into a nested object. This pulls the `attr[<id>]` keys back out into the
// shape `getProducts({ attr })` expects, which re-serializes them into the
// same bracket query string for the actual request to Express.
export function extractAttrParams(
  searchParams: Record<string, string | string[] | undefined>
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    const match = key.match(/^attr\[(.+)\]$/);
    if (match && value !== undefined) {
      result[match[1]] = Array.isArray(value) ? value : [value];
    }
  }
  return result;
}
