/**
 * Compilador de Design Tokens a CSS Variables
 *
 * Este módulo toma la configuración de personalización del website
 * y genera las CSS variables correspondientes para inyectar en el template.
 */

// Tipos locales para evitar dependencia circular con @neumorstudio/supabase
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

export interface WebsiteConfig {
  colors?: ColorsConfig;
  primaryColor?: string;
  secondaryColor?: string;
  typography?: TypographyConfig;
  effects?: EffectsConfig;
  branding?: BrandingConfig;
  logo?: string;
}

export interface CompiledCSS {
  /** CSS variables para inyectar en :root o .theme-* */
  cssVariables: string;
  /** Imports de Google Fonts */
  fontImports: string;
  /** Clase de tema a aplicar al body */
  themeClass: string;
}

/** Valores por defecto de personalización */
const DEFAULTS = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#10b981',
  },
  typography: {
    headingFont: 'system',
    bodyFont: 'system',
    baseFontSize: 16,
    scale: 1.25,
  },
  effects: {
    shadowIntensity: 60,
    borderRadius: 'rounded' as const,
    glassmorphism: false,
    blurIntensity: 16,
  },
};

/** Mapeo de border radius a valores CSS */
const BORDER_RADIUS_MAP: Record<string, string> = {
  sharp: '0.25rem',
  soft: '0.5rem',
  rounded: '1rem',
  pill: '9999px',
};

/**
 * Genera un color con transparencia
 */
function colorWithAlpha(hex: string, alpha: number): string {
  // Convertir hex a rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Ajusta la luminosidad de un color hex
 */
function adjustLuminosity(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

/**
 * Compila la configuración de colores a CSS variables
 */
function compileColors(colors: ColorsConfig | undefined, legacyPrimary?: string, legacySecondary?: string): string[] {
  const vars: string[] = [];

  // Usar colores de la nueva estructura, fallback a legacy, fallback a defaults
  const primary = colors?.primary || legacyPrimary || DEFAULTS.colors.primary;
  const secondary = colors?.secondary || legacySecondary || DEFAULTS.colors.secondary;
  const accent = colors?.accent || DEFAULTS.colors.accent;

  // Variables de colores principales
  vars.push(`--color-primary: ${primary};`);
  vars.push(`--color-secondary: ${secondary};`);
  vars.push(`--color-accent: ${accent};`);

  // Variantes de accent
  vars.push(`--accent: ${accent};`);
  vars.push(`--accent-hover: ${adjustLuminosity(accent, -10)};`);
  vars.push(`--accent-light: ${colorWithAlpha(accent, 0.1)};`);
  vars.push(`--accent-glow: ${colorWithAlpha(accent, 0.4)};`);

  // RGB values para usar con rgba()
  const accentR = parseInt(accent.slice(1, 3), 16);
  const accentG = parseInt(accent.slice(3, 5), 16);
  const accentB = parseInt(accent.slice(5, 7), 16);
  vars.push(`--accent-rgb: ${accentR}, ${accentG}, ${accentB};`);

  // Overrides opcionales de background y text
  if (colors?.background) {
    vars.push(`--neumor-bg: ${colors.background};`);
  }
  if (colors?.text) {
    vars.push(`--text-primary: ${colors.text};`);
  }

  return vars;
}

/**
 * Compila la configuración de tipografía
 */
function compileTypography(typography: TypographyConfig | undefined): { vars: string[]; fonts: string[] } {
  const vars: string[] = [];
  const fonts: string[] = [];

  const config = {
    ...DEFAULTS.typography,
    ...typography,
  };

  // Font families
  if (config.headingFont && config.headingFont !== 'system') {
    fonts.push(config.headingFont);
    vars.push(`--font-heading: '${config.headingFont}', system-ui, sans-serif;`);
  } else {
    vars.push(`--font-heading: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`);
  }

  if (config.bodyFont && config.bodyFont !== 'system') {
    if (!fonts.includes(config.bodyFont)) {
      fonts.push(config.bodyFont);
    }
    vars.push(`--font-body: '${config.bodyFont}', system-ui, sans-serif;`);
  } else {
    vars.push(`--font-body: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`);
  }

  // Font sizes basadas en escala modular
  const base = config.baseFontSize || 16;
  const scale = config.scale || 1.25;

  vars.push(`--font-size-xs: ${(base / scale / scale).toFixed(2)}px;`);
  vars.push(`--font-size-sm: ${(base / scale).toFixed(2)}px;`);
  vars.push(`--font-size-base: ${base}px;`);
  vars.push(`--font-size-lg: ${(base * scale).toFixed(2)}px;`);
  vars.push(`--font-size-xl: ${(base * scale * scale).toFixed(2)}px;`);
  vars.push(`--font-size-2xl: ${(base * scale * scale * scale).toFixed(2)}px;`);
  vars.push(`--font-size-3xl: ${(base * scale * scale * scale * scale).toFixed(2)}px;`);

  return { vars, fonts };
}

/**
 * Compila la configuración de efectos
 */
function compileEffects(effects: EffectsConfig | undefined): string[] {
  const vars: string[] = [];

  const config = {
    ...DEFAULTS.effects,
    ...effects,
  };

  // Intensidad de sombras (0-100 -> 0-1)
  const intensity = (config.shadowIntensity || 60) / 100;
  vars.push(`--shadow-intensity: ${intensity};`);

  // Border radius
  const radiusValue = BORDER_RADIUS_MAP[config.borderRadius || 'rounded'] || '1rem';
  vars.push(`--radius-base: ${radiusValue};`);
  vars.push(`--radius-sm: calc(${radiusValue} * 0.5);`);
  vars.push(`--radius-lg: calc(${radiusValue} * 1.5);`);
  vars.push(`--radius-xl: calc(${radiusValue} * 2);`);

  // Glassmorphism
  if (config.glassmorphism) {
    const blur = config.blurIntensity || 16;
    vars.push(`--glass-blur: ${blur}px;`);
    vars.push(`--glass-enabled: 1;`);
  } else {
    vars.push(`--glass-enabled: 0;`);
  }

  return vars;
}

/**
 * Genera los imports de Google Fonts
 */
function generateFontImports(fonts: string[]): string {
  if (fonts.length === 0) return '';

  const fontParams = fonts
    .map(font => `family=${encodeURIComponent(font)}:wght@400;500;600;700`)
    .join('&');

  return `@import url('https://fonts.googleapis.com/css2?${fontParams}&display=swap');`;
}

/**
 * Compila toda la configuración de personalización a CSS
 */
export function compileTokensToCSS(
  config: WebsiteConfig,
  theme: string = 'light'
): CompiledCSS {
  const allVars: string[] = [];

  // Compilar colores
  const colorVars = compileColors(config.colors, config.primaryColor, config.secondaryColor);
  allVars.push(...colorVars);

  // Compilar tipografía
  const { vars: typographyVars, fonts } = compileTypography(config.typography);
  allVars.push(...typographyVars);

  // Compilar efectos
  const effectVars = compileEffects(config.effects);
  allVars.push(...effectVars);

  // Generar CSS final
  const cssVariables = allVars.length > 0
    ? `.theme-custom {\n  ${allVars.join('\n  ')}\n}`
    : '';

  // Generar imports de fuentes
  const fontImports = generateFontImports(fonts);

  // Determinar clase de tema
  // Si hay personalización de colores, añadir theme-custom
  const hasCustomization = config.colors || config.primaryColor || config.typography || config.effects;
  const themeClass = hasCustomization ? `theme-${theme} theme-custom` : `theme-${theme}`;

  return {
    cssVariables,
    fontImports,
    themeClass,
  };
}

/**
 * Genera CSS variables para preview (sin wrapper de clase)
 * Usado para inyectar en el iframe de preview
 */
export function compileTokensForPreview(config: WebsiteConfig): string {
  const allVars: string[] = [];

  const colorVars = compileColors(config.colors, config.primaryColor, config.secondaryColor);
  allVars.push(...colorVars);

  const { vars: typographyVars } = compileTypography(config.typography);
  allVars.push(...typographyVars);

  const effectVars = compileEffects(config.effects);
  allVars.push(...effectVars);

  return allVars.join('\n');
}

export default compileTokensToCSS;
