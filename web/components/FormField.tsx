import type { InputHTMLAttributes } from "react";

export default function FormField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
        {label}
      </span>
      <input
        {...props}
        className="border border-border bg-surface-2 px-3 py-2 font-body text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-info"
      />
    </label>
  );
}
