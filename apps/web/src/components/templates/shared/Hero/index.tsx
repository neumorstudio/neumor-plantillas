import dynamic from "next/dynamic";

export type HeroVariant = "classic" | "modern" | "bold" | "minimal";

export interface HeroProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

const heroVariants = {
  classic: dynamic(() => import("./HeroClassic").then((mod) => mod.HeroClassic)),
  modern: dynamic(() => import("./HeroClassic").then((mod) => mod.HeroClassic)), // TODO: crear HeroModern
  bold: dynamic(() => import("./HeroClassic").then((mod) => mod.HeroClassic)), // TODO: crear HeroBold
  minimal: dynamic(() => import("./HeroClassic").then((mod) => mod.HeroClassic)), // TODO: crear HeroMinimal
};

interface Props extends HeroProps {
  variant?: HeroVariant;
}

export function Hero({ variant = "classic", ...props }: Props) {
  const Component = heroVariants[variant] || heroVariants.classic;
  return <Component {...props} />;
}

export { HeroClassic } from "./HeroClassic";
