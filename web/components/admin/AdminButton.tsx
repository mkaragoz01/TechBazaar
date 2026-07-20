import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";
type Size = "sm" | "md";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-4 py-2",
  md: "px-6 py-3",
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink",
  secondary: "border border-border text-ink",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
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

// Admin's uppercase/sharp-cornered button language — deliberately distinct
// from the storefront's pill CTAs (see Button.tsx), not a duplicate to
// unify. Renders as a Link when `href` is given, otherwise a real <button>.
export default function AdminButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...props
}: LinkButtonProps | RealButtonProps) {
  const classes =
    `${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} font-data text-xs uppercase tracking-widest disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info ${className}`.trim();

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
