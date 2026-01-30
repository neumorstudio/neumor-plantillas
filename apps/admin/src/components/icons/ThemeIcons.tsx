"use client";

import React from "react";

// ============================================
// THEME ICONS - SVG icons para selección de temas
// ============================================

interface IconProps {
  className?: string;
}

// Base themes
export function SunIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
}

export function MoonIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>;
}

export function MinusIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/></svg>;
}

// Style themes
export function PaletteIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>;
}

export function LeafIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
}

export function CrownIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l3.5 7L12 6l3.5 4L19 3v14a2 2 0 01-2 2H7a2 2 0 01-2-2V3z"/></svg>;
}

export function CameraIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>;
}

// Premium themes
export function DiamondIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l9 9-9 9-9-9 9-9z"/></svg>;
}

export function SparklesIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
}

// Seasonal themes
export function GiftIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>;
}

export function UmbrellaIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v1m0 18v1m-9-10h1m16 0h1M5.6 5.6l.7.7m11.4 11.4l.7.7M5.6 18.4l.7-.7m11.4-11.4l.7-.7M12 5a7 7 0 017 7H5a7 7 0 017-7z"/></svg>;
}

export function WindIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></svg>;
}

export function FlowerIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.5a4 4 0 014 0 4 4 0 012 3.5 4 4 0 01-2 3.5 4 4 0 01-4 0 4 4 0 01-4 0 4 4 0 01-2-3.5 4 4 0 012-3.5 4 4 0 014 0zM12 6.5V3m0 18v-7"/></svg>;
}

// Nature themes
export function WavesIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3M3 19c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3M3 11c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3"/></svg>;
}

export function TreeIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 7h-4l5 5h-4l4 6H4l4-6H4l5-5H5l7-7z"/></svg>;
}

export function SunsetIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 0a5 5 0 015 5m-5-5a5 5 0 00-5 5m10 0H7m12 7H5M8 17l4-4 4 4"/></svg>;
}

export function StarsIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>;
}

// Soft themes
export function HeartIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>;
}

export function SparkleIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>;
}

export function CircleIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth={2}/></svg>;
}

export function SpaIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V3c0-.55.45-1 1-1zm0 16c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1zM5 12c0-.55-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1zm17 0c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1z"/></svg>;
}

// UI Icons
export function CheckIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
}

export function ExternalLinkIcon({ className = "w-4 h-4" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}

export function ResetIcon({ className = "w-4 h-4" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}

export function DesktopIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}

export function TabletIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}

export function MobileIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}

export function TextIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
}

export function ChevronDownIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
}

export function ChevronUpIcon({ className = "w-5 h-5" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
}

export function SaveIcon({ className = "w-6 h-6" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

// ============================================
// ICON LOOKUP - Map icon name to component
// ============================================

const iconMap: Record<string, (props: IconProps) => React.ReactElement> = {
  sun: SunIcon,
  moon: MoonIcon,
  minus: MinusIcon,
  palette: PaletteIcon,
  leaf: LeafIcon,
  crown: CrownIcon,
  camera: CameraIcon,
  diamond: DiamondIcon,
  sparkles: SparklesIcon,
  gift: GiftIcon,
  umbrella: UmbrellaIcon,
  wind: WindIcon,
  flower: FlowerIcon,
  waves: WavesIcon,
  tree: TreeIcon,
  sunset: SunsetIcon,
  stars: StarsIcon,
  heart: HeartIcon,
  sparkle: SparkleIcon,
  circle: CircleIcon,
  spa: SpaIcon,
};

export function getThemeIcon(icon: string, className?: string): React.ReactElement {
  const IconComponent = iconMap[icon] || SunIcon;
  return <IconComponent className={className} />;
}
