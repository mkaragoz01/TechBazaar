import type { HTMLAttributes } from "react";

type Size = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "rounded-2xl p-4",
  md: "rounded-3xl p-6",
  lg: "rounded-3xl p-8 sm:p-10",
};

// The "bg-surface ... shadow-sm" card shape repeated across storefront and
// admin alike (cart items, order summaries, checkout sections, dashboard
// tiles, auth forms) — one component instead of the same class string
// copy-pasted with small drifts (rounded-2xl vs rounded-3xl vs
// rounded-[20px], p-4 vs p-5 vs p-6) in a dozen files.
export default function Card({
  size = "md",
  className = "",
  ...props
}: { size?: Size } & HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-surface shadow-sm ${SIZE_CLASSES[size]} ${className}`.trim()} {...props} />;
}
