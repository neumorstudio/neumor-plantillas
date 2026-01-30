// ============================================
// PERSONALIZACION - Exports centralizados
// ============================================

// Themes
export {
  VALID_THEMES,
  themeCategories,
  themes,
  isValidTheme,
  type ThemeOption,
  type ThemeCategory,
} from "./themes";

// Presets
export {
  templatePresets,
  getPresetById,
} from "./presets";
export type { TemplatePreset } from "./presets";

// Skins
export {
  skinOptions,
  getSkinByValue,
  isValidSkin,
  type SkinOption,
} from "./skins";

// Feature Icons
export {
  FEATURE_ICONS,
  getFeatureIconSvg,
  normalizeFeatureIcon,
  type FeatureIcon,
} from "./feature-icons";
