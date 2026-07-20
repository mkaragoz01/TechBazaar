import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink transition-opacity hover:opacity-90",
  secondary: "border border-border text-ink transition-colors hover:border-ink",
};

type CommonProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

type LinkButtonProps = CommonProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "className" | "children"
  >;

type RealButtonProps = CommonProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

// Storefront's pill-shaped CTA — renders as a Link when `href` is given,
// otherwise a real <button> (defaults to type="button" so it never
// accidentally submits a form it happens to sit inside).
export default function Button({ variant = "primary", className = "", children, href, ...props }: LinkButtonProps | RealButtonProps) {
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${className}`.trim();

  if (href !== undefined) {
    return (
      <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
