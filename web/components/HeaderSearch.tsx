"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientFetch } from "@/lib/client-api";
import { formatPriceNumber } from "@/lib/formatPrice";

type Suggestion = {
  _id: string;
  name: string;
  imgUrl?: string;
  price: number;
};

export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    // Stale suggestions from a longer previous query are harmless to leave
    // in state — `showDropdown` below already hides them once the query
    // drops back under the 2-char threshold, so there's nothing to clear.
    if (trimmed.length < 2) {
      return;
    }

    const timeout = setTimeout(() => {
      clientFetch<{ products: Suggestion[] }>(
        `/api/products/search-suggestions?q=${encodeURIComponent(trimmed)}`
      )
        .then((data) => setSuggestions(data.products))
        .catch(() => setSuggestions([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  function handleBlur() {
    // Delay so a click on a suggestion registers before the dropdown closes.
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  }

  function handleFocus() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpen(true);
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Ürün ara..."
        aria-label="Ürün ara"
        className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
      />

      {showDropdown && suggestions.length > 0 ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          {suggestions.map((product) => (
            <Link
              key={product._id}
              href={`/products/${product._id}`}
              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-2"
            >
              <div className="product-spotlight relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                {product.imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size thumbnail, not worth the image-optimizer's remote-pattern/self-fetch overhead here
                  <img
                    src={`/img/${product.imgUrl}`}
                    alt={product.name}
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm text-ink">{product.name}</p>
                <p className="font-data text-xs tabular-nums text-ink-muted">
                  {formatPriceNumber(product.price)} TL
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </form>
  );
}
