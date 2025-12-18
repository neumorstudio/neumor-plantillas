// Configuracion base de Tailwind CSS para NeumorStudio
// Se usa con el plugin @tailwindcss/vite

/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {
      colors: {
        // Colores neumorfico base
        neumor: {
          bg: {
            light: "oklch(0.95 0.01 250)",
            dark: "oklch(0.25 0.02 250)",
          },
          shadow: {
            light: {
              dark: "oklch(0.85 0.01 250)",
              light: "oklch(1 0 0)",
            },
            dark: {
              dark: "oklch(0.15 0.02 250)",
              light: "oklch(0.35 0.02 250)",
            },
          },
        },
      },
      boxShadow: {
        // Sombras neumorfico
        "neumor-raised":
          "8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)",
        "neumor-inset":
          "inset 8px 8px 16px var(--shadow-dark), inset -8px -8px 16px var(--shadow-light)",
        "neumor-raised-sm":
          "4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)",
        "neumor-inset-sm":
          "inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)",
      },
      borderRadius: {
        neumor: "1rem",
        "neumor-lg": "1.5rem",
        "neumor-xl": "2rem",
      },
    },
  },
};
