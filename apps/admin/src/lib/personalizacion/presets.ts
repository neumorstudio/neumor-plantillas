import type {
  Theme,
  ColorsConfig,
  TypographyConfig,
  EffectsConfig,
} from "@neumorstudio/supabase";

// ============================================
// TEMPLATE PRESETS - Plantillas con identidad única
// Cada plantilla debe sentirse como una web diferente
// ============================================

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  preview: string; // CSS gradient para preview
  theme: Theme;
  skin: string;
  colors: ColorsConfig;
  typography: TypographyConfig;
  effects: EffectsConfig;
  variants: {
    hero: "classic" | "modern" | "bold" | "minimal" | "fullscreen" | "split";
    menu: "tabs" | "grid" | "list" | "carousel";
    services: "tabs" | "grid" | "list" | "carousel";
    features: "cards" | "icons" | "banner";
    reviews: "grid" | "carousel" | "minimal";
    footer: "full" | "minimal" | "centered";
    reservation: "classic" | "wizard" | "modal" | "modern";
  };
}

export const templatePresets: TemplatePreset[] = [
  // ============================================
  // 1. BRUTALIST - Punk, Underground, Raw
  // ============================================
  {
    id: "brutalist",
    name: "Brutalist",
    description: "Raw, audaz y sin filtros",
    preview: "linear-gradient(135deg, #ffffff 0%, #000000 50%, #ff0000 100%)",
    theme: "minimal",
    skin: "brutalist",
    colors: {
      primary: "#000000",
      secondary: "#000000",
      accent: "#ff0000"
    },
    typography: {
      headingFont: "Space Mono",
      bodyFont: "Space Mono",
      baseFontSize: 16,
      scale: 1.333
    },
    effects: {
      shadowIntensity: 100,
      borderRadius: "sharp",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "bold",
      menu: "list",
      services: "list",
      features: "banner",
      reviews: "minimal",
      footer: "minimal",
      reservation: "classic"
    },
  },

  // ============================================
  // 2. LUXURY - Hotel 5 estrellas, Premium
  // ============================================
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegancia y exclusividad",
    preview: "linear-gradient(135deg, #1a1a2e 0%, #c9a227 50%, #0d0d0d 100%)",
    theme: "midnight",
    skin: "glass",
    colors: {
      primary: "#c9a227",
      secondary: "#d4af37",
      accent: "#c9a227"
    },
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Cormorant Garamond",
      baseFontSize: 18,
      scale: 1.414
    },
    effects: {
      shadowIntensity: 40,
      borderRadius: "soft",
      glassmorphism: true,
      blurIntensity: 20
    },
    variants: {
      hero: "fullscreen",
      menu: "list",
      services: "list",
      features: "cards",
      reviews: "carousel",
      footer: "centered",
      reservation: "wizard"
    },
  },

  // ============================================
  // 3. PLAYFUL - Cafetería trendy, Divertido
  // ============================================
  {
    id: "playful",
    name: "Playful",
    description: "Colorido y lleno de vida",
    preview: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 33%, #a8e6cf 66%, #dcedc1 100%)",
    theme: "colorful",
    skin: "3d",
    colors: {
      primary: "#ff6b6b",
      secondary: "#4ecdc4",
      accent: "#ffe66d"
    },
    typography: {
      headingFont: "Fredoka One",
      bodyFont: "Nunito",
      baseFontSize: 17,
      scale: 1.25
    },
    effects: {
      shadowIntensity: 80,
      borderRadius: "pill",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "bold",
      menu: "carousel",
      services: "carousel",
      features: "icons",
      reviews: "grid",
      footer: "full",
      reservation: "modal"
    },
  },

  // ============================================
  // 4. CORPORATE - Empresa seria, Profesional
  // ============================================
  {
    id: "corporate",
    name: "Corporate",
    description: "Profesional y confiable",
    preview: "linear-gradient(135deg, #f8fafc 0%, #1e3a5f 50%, #0f172a 100%)",
    theme: "light",
    skin: "material",
    colors: {
      primary: "#1e3a5f",
      secondary: "#475569",
      accent: "#0066cc"
    },
    typography: {
      headingFont: "Roboto",
      bodyFont: "Open Sans",
      baseFontSize: 16,
      scale: 1.2
    },
    effects: {
      shadowIntensity: 50,
      borderRadius: "soft",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "modern",
      menu: "grid",
      services: "grid",
      features: "cards",
      reviews: "grid",
      footer: "full",
      reservation: "wizard"
    },
  },

  // ============================================
  // 5. RETRO - Años 70, Vintage, Nostálgico
  // ============================================
  {
    id: "retro",
    name: "Retro",
    description: "Nostalgia y calidez vintage",
    preview: "linear-gradient(135deg, #f4e4ba 0%, #e07b39 50%, #8b4513 100%)",
    theme: "rustic",
    skin: "neumorphic",
    colors: {
      primary: "#c65d07",
      secondary: "#8b4513",
      accent: "#e07b39"
    },
    typography: {
      headingFont: "Abril Fatface",
      bodyFont: "Libre Baskerville",
      baseFontSize: 17,
      scale: 1.333
    },
    effects: {
      shadowIntensity: 65,
      borderRadius: "rounded",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "classic",
      menu: "tabs",
      services: "tabs",
      features: "cards",
      reviews: "carousel",
      footer: "full",
      reservation: "classic"
    },
  },

  // ============================================
  // 6. NEON - Club nocturno, Cyberpunk
  // ============================================
  {
    id: "neon",
    name: "Neon",
    description: "Vibrante y futurista",
    preview: "linear-gradient(135deg, #0a0a0a 0%, #ff00ff 33%, #00ffff 66%, #0a0a0a 100%)",
    theme: "dark",
    skin: "glass",
    colors: {
      primary: "#ff00ff",
      secondary: "#00ffff",
      accent: "#39ff14"
    },
    typography: {
      headingFont: "Orbitron",
      bodyFont: "Exo 2",
      baseFontSize: 16,
      scale: 1.25
    },
    effects: {
      shadowIntensity: 30,
      borderRadius: "soft",
      glassmorphism: true,
      blurIntensity: 24
    },
    variants: {
      hero: "fullscreen",
      menu: "grid",
      services: "grid",
      features: "icons",
      reviews: "carousel",
      footer: "minimal",
      reservation: "modern"
    },
  },

  // ============================================
  // 7. NATURE - Spa, Wellness, Orgánico
  // ============================================
  {
    id: "nature",
    name: "Nature",
    description: "Serenidad y bienestar",
    preview: "linear-gradient(135deg, #f5f5dc 0%, #8fbc8f 50%, #2f4f2f 100%)",
    theme: "spring",
    skin: "soft",
    colors: {
      primary: "#2f4f2f",
      secondary: "#6b8e6b",
      accent: "#8fbc8f"
    },
    typography: {
      headingFont: "Marcellus",
      bodyFont: "Lato",
      baseFontSize: 17,
      scale: 1.25
    },
    effects: {
      shadowIntensity: 30,
      borderRadius: "rounded",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "minimal",
      menu: "list",
      services: "list",
      features: "cards",
      reviews: "minimal",
      footer: "centered",
      reservation: "wizard"
    },
  },

  // ============================================
  // 8. MAGAZINE - Editorial, Alto contraste
  // ============================================
  {
    id: "magazine",
    name: "Magazine",
    description: "Editorial y sofisticado",
    preview: "linear-gradient(135deg, #ffffff 0%, #1a1a1a 50%, #e63946 100%)",
    theme: "minimal",
    skin: "flat",
    colors: {
      primary: "#1a1a1a",
      secondary: "#666666",
      accent: "#e63946"
    },
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Source Serif Pro",
      baseFontSize: 18,
      scale: 1.414
    },
    effects: {
      shadowIntensity: 0,
      borderRadius: "sharp",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "split",
      menu: "list",
      services: "list",
      features: "banner",
      reviews: "minimal",
      footer: "minimal",
      reservation: "modern"
    },
  },

  // ============================================
  // 9. TROPICAL - Beach bar, Veraniego
  // ============================================
  {
    id: "tropical",
    name: "Tropical",
    description: "Alegre y veraniego",
    preview: "linear-gradient(135deg, #fff5e6 0%, #ff7f50 33%, #40e0d0 66%, #ffd700 100%)",
    theme: "summer",
    skin: "3d",
    colors: {
      primary: "#ff7f50",
      secondary: "#40e0d0",
      accent: "#ff6b35"
    },
    typography: {
      headingFont: "Pacifico",
      bodyFont: "Poppins",
      baseFontSize: 16,
      scale: 1.25
    },
    effects: {
      shadowIntensity: 60,
      borderRadius: "pill",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "bold",
      menu: "carousel",
      services: "carousel",
      features: "icons",
      reviews: "carousel",
      footer: "centered",
      reservation: "modal"
    },
  },

  // ============================================
  // 10. NORDIC - Escandinavo, Minimalismo zen
  // ============================================
  {
    id: "nordic",
    name: "Nordic",
    description: "Minimalismo escandinavo",
    preview: "linear-gradient(135deg, #fafafa 0%, #e8e8e8 50%, #87ceeb 100%)",
    theme: "minimal",
    skin: "outline",
    colors: {
      primary: "#2c3e50",
      secondary: "#7f8c8d",
      accent: "#5dade2"
    },
    typography: {
      headingFont: "Montserrat",
      bodyFont: "Raleway",
      baseFontSize: 16,
      scale: 1.2
    },
    effects: {
      shadowIntensity: 0,
      borderRadius: "soft",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "split",
      menu: "grid",
      services: "grid",
      features: "icons",
      reviews: "minimal",
      footer: "minimal",
      reservation: "modern"
    },
  },

  // ============================================
  // 11. DARK ELEGANCE - Lujo nocturno (USA FULLSCREEN)
  // ============================================
  {
    id: "dark-elegance",
    name: "Dark Elegance",
    description: "Lujo y exclusividad nocturna",
    preview: "linear-gradient(135deg, #0d0d0d 0%, #c9a227 30%, #1a1a2e 70%, #000000 100%)",
    theme: "midnight",
    skin: "glass",
    colors: {
      primary: "#c9a227",
      secondary: "#d4af37",
      accent: "#c9a227"
    },
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Cormorant Garamond",
      baseFontSize: 18,
      scale: 1.5
    },
    effects: {
      shadowIntensity: 40,
      borderRadius: "soft",
      glassmorphism: true,
      blurIntensity: 20
    },
    variants: {
      hero: "fullscreen",
      menu: "list",
      services: "list",
      features: "icons",
      reviews: "minimal",
      footer: "centered",
      reservation: "wizard"
    },
  },

  // ============================================
  // 12. BOLD ENERGY - Gym/Fitness (USA SPLIT)
  // ============================================
  {
    id: "bold-energy",
    name: "Bold Energy",
    description: "Potencia y energia",
    preview: "linear-gradient(135deg, #0a0a0a 0%, #84cc16 40%, #1a1a1a 100%)",
    theme: "dark",
    skin: "brutalist",
    colors: {
      primary: "#84cc16",
      secondary: "#a3e635",
      accent: "#84cc16"
    },
    typography: {
      headingFont: "Oswald",
      bodyFont: "Inter",
      baseFontSize: 16,
      scale: 1.414
    },
    effects: {
      shadowIntensity: 100,
      borderRadius: "sharp",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "split",
      menu: "grid",
      services: "grid",
      features: "banner",
      reviews: "grid",
      footer: "minimal",
      reservation: "modern"
    },
  },

  // ============================================
  // 13. PURE MINIMAL - Spa zen (USA MINIMAL)
  // ============================================
  {
    id: "pure-minimal",
    name: "Pure Minimal",
    description: "Zen y serenidad absoluta",
    preview: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #e0e0e0 100%)",
    theme: "minimal",
    skin: "outline",
    colors: {
      primary: "#1a1a1a",
      secondary: "#666666",
      accent: "#1a1a1a"
    },
    typography: {
      headingFont: "Jost",
      bodyFont: "Jost",
      baseFontSize: 16,
      scale: 1.125
    },
    effects: {
      shadowIntensity: 0,
      borderRadius: "soft",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "minimal",
      menu: "list",
      services: "list",
      features: "icons",
      reviews: "minimal",
      footer: "minimal",
      reservation: "wizard"
    },
  },

  // ============================================
  // 14. MAGAZINE EDITORIAL - Moda (USA SPLIT)
  // ============================================
  {
    id: "magazine-editorial",
    name: "Magazine Editorial",
    description: "Estilo revista de moda",
    preview: "linear-gradient(135deg, #ffffff 0%, #000000 45%, #e63946 100%)",
    theme: "minimal",
    skin: "flat",
    colors: {
      primary: "#000000",
      secondary: "#333333",
      accent: "#e63946"
    },
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Source Serif Pro",
      baseFontSize: 18,
      scale: 1.618
    },
    effects: {
      shadowIntensity: 0,
      borderRadius: "sharp",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "split",
      menu: "list",
      services: "list",
      features: "banner",
      reviews: "minimal",
      footer: "minimal",
      reservation: "modern"
    },
  },

  // ============================================
  // 15. TROPICAL PARADISE - Beach (USA CLASSIC CON PARALLAX)
  // ============================================
  {
    id: "tropical-paradise",
    name: "Tropical Paradise",
    description: "Playa y relax total",
    preview: "linear-gradient(135deg, #f5deb3 0%, #ff6b6b 25%, #40e0d0 75%, #ffecd2 100%)",
    theme: "summer",
    skin: "3d",
    colors: {
      primary: "#ff6b6b",
      secondary: "#40e0d0",
      accent: "#ff6b6b"
    },
    typography: {
      headingFont: "Pacifico",
      bodyFont: "Poppins",
      baseFontSize: 17,
      scale: 1.25
    },
    effects: {
      shadowIntensity: 80,
      borderRadius: "pill",
      glassmorphism: false,
      blurIntensity: 8
    },
    variants: {
      hero: "classic",
      menu: "carousel",
      services: "carousel",
      features: "cards",
      reviews: "carousel",
      footer: "centered",
      reservation: "modal"
    },
  },
];

// Helper to get preset by id
export function getPresetById(id: string): TemplatePreset | undefined {
  return templatePresets.find(p => p.id === id);
}
