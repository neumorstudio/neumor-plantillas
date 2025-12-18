// Themes - Configuraciones de temas neumorfico
export type Theme = "dark" | "light" | "colorful" | "rustic" | "elegant";

export const themes: Record<Theme, string> = {
  dark: "theme-dark",
  light: "theme-light",
  colorful: "theme-colorful",
  rustic: "theme-rustic",
  elegant: "theme-elegant",
};

export const defaultTheme: Theme = "light";
