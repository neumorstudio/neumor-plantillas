import dynamic from "next/dynamic";

export type FooterVariant = "full" | "minimal" | "centered";

export interface FooterProps {
  businessName: string;
  phone?: string;
  email?: string;
  address?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

const footerVariants = {
  full: dynamic(() => import("./FooterMinimal").then((mod) => mod.FooterMinimal)), // TODO: crear FooterFull
  minimal: dynamic(() => import("./FooterMinimal").then((mod) => mod.FooterMinimal)),
  centered: dynamic(() => import("./FooterMinimal").then((mod) => mod.FooterMinimal)), // TODO: crear FooterCentered
};

interface Props extends FooterProps {
  variant?: FooterVariant;
}

export function Footer({ variant = "minimal", ...props }: Props) {
  const Component = footerVariants[variant] || footerVariants.minimal;
  return <Component {...props} />;
}

export { FooterMinimal } from "./FooterMinimal";
