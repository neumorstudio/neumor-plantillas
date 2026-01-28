/**
 * Compilador de Design Tokens a CSS Variables para Templates
 * Versión server-side para Astro SSR
 */

export interface ColorsConfig {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

export interface TypographyConfig {
  headingFont?: string;
  bodyFont?: string;
  baseFontSize?: number;
  scale?: number;
}

export interface EffectsConfig {
  shadowIntensity?: number;
  borderRadius?: 'sharp' | 'soft' | 'rounded' | 'pill';
  glassmorphism?: boolean;
  blurIntensity?: number;
}

export interface BrandingConfig {
  logo?: string;
  logoDark?: string;
  favicon?: string;
  logoSize?: 'sm' | 'md' | 'lg';
}

export interface WebsiteCustomization {
  colors?: ColorsConfig;
  primaryColor?: string;
  secondaryColor?: string;
  typography?: TypographyConfig;
  effects?: EffectsConfig;
  branding?: BrandingConfig;
  logo?: string;
}

/** Valores por defecto */
const DEFAULTS = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#10b981',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    baseFontSize: 16,
    scale: 1.25,
  },
  effects: {
    shadowIntensity: 60,
    borderRadius: 'rounded' as const,
  },
};

/** Mapeo de border radius */
const BORDER_RADIUS_MAP: Record<string, string> = {
  sharp: '0.25rem',
  soft: '0.5rem',
  rounded: '1rem',
  pill: '9999px',
};

/**
 * Ajusta la luminosidad de un color hex
 */
function adjustLuminosity(hex: string, percent: number): string {
  // Asegurar que es un hex válido
  if (!hex || !hex.startsWith('#')) return hex;

  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

/**
 * Convierte hex a rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(99, 102, 241, ${alpha})`;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface CompiledTokens {
  cssVariables: string;
  fontImports: string;
  favicon: string | null;
}

/**
 * Compila la configuración de personalización a CSS
 */
export function compileCustomization(config: WebsiteCustomization): CompiledTokens {
  const vars: string[] = [];
  const fonts: string[] = [];

  // === COLORES ===
  const primary = config.colors?.primary || config.primaryColor || DEFAULTS.colors.primary;
  const secondary = config.colors?.secondary || config.secondaryColor || DEFAULTS.colors.secondary;
  const accent = config.colors?.accent || DEFAULTS.colors.accent;

  // Solo generar variables si hay personalización
  if (config.colors || config.primaryColor || config.secondaryColor) {
    vars.push(`--color-primary: ${primary};`);
    vars.push(`--color-secondary: ${secondary};`);
    vars.push(`--color-accent: ${accent};`);
    vars.push(`--accent: ${accent};`);
    vars.push(`--accent-hover: ${adjustLuminosity(accent, -10)};`);
    vars.push(`--accent-light: ${hexToRgba(accent, 0.1)};`);
    vars.push(`--accent-glow: ${hexToRgba(accent, 0.4)};`);

    // RGB values
    if (accent.startsWith('#')) {
      const r = parseInt(accent.slice(1, 3), 16);
      const g = parseInt(accent.slice(3, 5), 16);
      const b = parseInt(accent.slice(5, 7), 16);
      vars.push(`--accent-rgb: ${r}, ${g}, ${b};`);
    }
  }

  // Override de background y text si se especifican
  if (config.colors?.background) {
    vars.push(`--neumor-bg: ${config.colors.background};`);
  }
  if (config.colors?.text) {
    vars.push(`--text-primary: ${config.colors.text};`);
  }

  // === TIPOGRAFÍA ===
  const headingFont = config.typography?.headingFont || DEFAULTS.typography.headingFont;
  const bodyFont = config.typography?.bodyFont || DEFAULTS.typography.bodyFont;

  if (headingFont && headingFont !== 'system') {
    fonts.push(headingFont);
    vars.push(`--font-heading: '${headingFont}', serif;`);
  }

  if (bodyFont && bodyFont !== 'system') {
    if (!fonts.includes(bodyFont)) {
      fonts.push(bodyFont);
    }
    vars.push(`--font-body: '${bodyFont}', system-ui, sans-serif;`);
  }

  // Escala tipográfica
  if (config.typography?.baseFontSize || config.typography?.scale) {
    const base = config.typography.baseFontSize || DEFAULTS.typography.baseFontSize;
    const scale = config.typography.scale || DEFAULTS.typography.scale;

    vars.push(`--font-size-xs: ${(base / scale / scale).toFixed(2)}px;`);
    vars.push(`--font-size-sm: ${(base / scale).toFixed(2)}px;`);
    vars.push(`--font-size-base: ${base}px;`);
    vars.push(`--font-size-lg: ${(base * scale).toFixed(2)}px;`);
    vars.push(`--font-size-xl: ${(base * scale * scale).toFixed(2)}px;`);
    vars.push(`--font-size-2xl: ${(base * scale * scale * scale).toFixed(2)}px;`);
  }

  // === EFECTOS ===
  if (config.effects?.shadowIntensity !== undefined) {
    const intensity = config.effects.shadowIntensity / 100;
    vars.push(`--shadow-intensity: ${intensity};`);
  }

  if (config.effects?.borderRadius) {
    const radiusValue = BORDER_RADIUS_MAP[config.effects.borderRadius] || '1rem';
    vars.push(`--radius-base: ${radiusValue};`);
    vars.push(`--radius-sm: calc(${radiusValue} * 0.5);`);
    vars.push(`--radius-lg: calc(${radiusValue} * 1.5);`);
  }

  if (config.effects?.glassmorphism) {
    const blur = config.effects.blurIntensity || 16;
    vars.push(`--glass-blur: ${blur}px;`);
  }

  // === BRANDING ===
  if (config.branding?.logoSize) {
    const logoSizeMap: Record<string, string> = {
      sm: '32px',
      md: '40px',
      lg: '56px',
    };
    vars.push(`--logo-height: ${logoSizeMap[config.branding.logoSize] || '40px'};`);
  }

  // Generar CSS
  const cssVariables = vars.length > 0
    ? `:root {\n  ${vars.join('\n  ')}\n}`
    : '';

  // Generar imports de fuentes
  let fontImports = '';
  if (fonts.length > 0) {
    const fontParams = fonts
      .map(font => `family=${encodeURIComponent(font)}:wght@400;500;600;700`)
      .join('&');
    fontImports = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
  }

  // Favicon
  const favicon = config.branding?.favicon || config.logo || null;

  return {
    cssVariables,
    fontImports,
    favicon,
  };
}

/**
 * Lee parámetros de preview desde URL y los aplica sobre la config
 */
export function applyPreviewParams(
  config: WebsiteCustomization,
  url: URL
): WebsiteCustomization {
  const isPreview = url.searchParams.get('preview') === '1';

  if (!isPreview) return config;

  const result = { ...config };

  // Colores desde preview
  const primaryPreview = url.searchParams.get('c_primary');
  const secondaryPreview = url.searchParams.get('c_secondary');
  const accentPreview = url.searchParams.get('c_accent');

  if (primaryPreview || secondaryPreview || accentPreview) {
    result.colors = {
      ...result.colors,
      ...(primaryPreview && { primary: primaryPreview }),
      ...(secondaryPreview && { secondary: secondaryPreview }),
      ...(accentPreview && { accent: accentPreview }),
    };
  }

  // Tipografía desde preview
  const headingPreview = url.searchParams.get('t_heading');
  const bodyPreview = url.searchParams.get('t_body');
  const sizePreview = url.searchParams.get('t_size');

  if (headingPreview || bodyPreview || sizePreview) {
    result.typography = {
      ...result.typography,
      ...(headingPreview && { headingFont: headingPreview }),
      ...(bodyPreview && { bodyFont: bodyPreview }),
      ...(sizePreview && { baseFontSize: parseInt(sizePreview, 10) }),
    };
  }

  // Efectos desde preview
  const shadowPreview = url.searchParams.get('e_shadow');
  const radiusPreview = url.searchParams.get('e_radius');
  const glassPreview = url.searchParams.get('e_glass');
  const blurPreview = url.searchParams.get('e_blur');

  if (shadowPreview || radiusPreview || glassPreview) {
    result.effects = {
      ...result.effects,
      ...(shadowPreview && { shadowIntensity: parseInt(shadowPreview, 10) }),
      ...(radiusPreview && { borderRadius: radiusPreview as EffectsConfig['borderRadius'] }),
      ...(glassPreview === '1' && { glassmorphism: true }),
      ...(blurPreview && { blurIntensity: parseInt(blurPreview, 10) }),
    };
  }

  // Branding desde preview
  const logoSizePreview = url.searchParams.get('b_logoSize');
  if (logoSizePreview) {
    result.branding = {
      ...result.branding,
      logoSize: logoSizePreview as BrandingConfig['logoSize'],
    };
  }

  return result;
}
