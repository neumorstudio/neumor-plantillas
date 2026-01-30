// ============================================
// SKIN OPTIONS - Estilos visuales de componentes
// ============================================

export interface SkinOption {
  value: string;
  label: string;
  description: string;
  preview: string; // CSS box-shadow para preview
}

export const skinOptions: SkinOption[] = [
  {
    value: "neumorphic",
    label: "Neumórfico",
    description: "Sombras suaves y relieve sutil",
    preview: "inset 2px 2px 5px rgba(0,0,0,.1), inset -2px -2px 5px rgba(255,255,255,.8)"
  },
  {
    value: "flat",
    label: "Flat",
    description: "Diseño plano y minimalista",
    preview: "none"
  },
  {
    value: "glass",
    label: "Glassmorphism",
    description: "Efecto cristal translúcido",
    preview: "0 4px 30px rgba(0,0,0,.1)"
  },
  {
    value: "material",
    label: "Material",
    description: "Sombras elevadas tipo Google",
    preview: "0 2px 4px rgba(0,0,0,.2)"
  },
  {
    value: "brutalist",
    label: "Brutalista",
    description: "Bordes marcados y audaces",
    preview: "4px 4px 0 currentColor"
  },
  {
    value: "soft",
    label: "Soft UI",
    description: "Sombras extra suaves y difusas",
    preview: "8px 8px 16px rgba(0,0,0,.05), -8px -8px 16px rgba(255,255,255,.8)"
  },
  {
    value: "3d",
    label: "3D",
    description: "Efecto tridimensional con bordes",
    preview: "0 6px 0 rgba(0,0,0,.2)"
  },
  {
    value: "outline",
    label: "Outline",
    description: "Solo bordes, fondo transparente",
    preview: "none"
  },
];

// Helper to get skin by value
export function getSkinByValue(value: string): SkinOption | undefined {
  return skinOptions.find(s => s.value === value);
}

// Validate skin value
export function isValidSkin(value: string): boolean {
  return skinOptions.some(s => s.value === value);
}
