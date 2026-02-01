/**
 * Catálogo de Secciones para Section Builder
 * Define todas las secciones disponibles por tipo de negocio
 */

import type { SectionDefinition, SectionConfig, SectionsConfig, SectionId, BusinessType } from "./types";

// ============================================
// ICONOS SVG PARA SECCIONES
// ============================================

const SECTION_ICONS: Record<string, string> = {
  hero: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>`,
  features: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  testimonials: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  faq: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  contact: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  footer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`,
  reservation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>`,
  orders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  openStatus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  services: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
  team: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  gallery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  brands: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 18h10"/><path d="M8 8h8"/><path d="M8 12h5"/></svg>`,
  booking: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>`,
  classes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11M17.5 12h-11"/><circle cx="12" cy="12" r="10"/></svg>`,
  trainers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 14l4-4-4-4"/></svg>`,
  schedule: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  plans: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  membership: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg>`,
  products: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  categories: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  properties: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  agents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  quotes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  portfolio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  process: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
};

// ============================================
// CATÁLOGO MAESTRO DE SECCIONES
// ============================================

export const SECTIONS_CATALOG: Record<SectionId, SectionDefinition> = {
  // ============================================
  // NOTA IMPORTANTE:
  // Solo incluir en businessTypes los tipos donde la sección está
  // REALMENTE IMPLEMENTADA en el template correspondiente.
  // Esto asegura que el Section Builder solo muestre secciones funcionales.
  // ============================================

  // === SECCIONES COMUNES ===
  hero: {
    id: "hero",
    label: "Cabecera Principal",
    description: "Seccion principal con titulo, subtitulo e imagen",
    icon: SECTION_ICONS.hero,
    variants: [
      { value: "classic", label: "Clasico" },
      { value: "modern", label: "Moderno" },
      { value: "bold", label: "Llamativo" },
      { value: "minimal", label: "Minimalista" },
      { value: "fullscreen", label: "Pantalla Completa" },
      { value: "split", label: "Dividido" },
    ],
    defaultVariant: "classic",
    required: true,
    fixedPosition: "top",
    // Implementado en: restaurant, salon, clinic, fitness (gym), shop (store), repairs
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  features: {
    id: "features",
    label: "Caracteristicas",
    description: "Tarjetas destacando servicios o ventajas",
    icon: SECTION_ICONS.features,
    variants: [
      { value: "cards", label: "Tarjetas" },
      { value: "icons", label: "Iconos" },
      { value: "banner", label: "Banner" },
    ],
    defaultVariant: "cards",
    // Implementado en: restaurant, salon, clinic, fitness (gym), shop (store), repairs
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  testimonials: {
    id: "testimonials",
    label: "Testimonios",
    description: "Resenas y opiniones de clientes",
    icon: SECTION_ICONS.testimonials,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "carousel", label: "Carrusel" },
      { value: "minimal", label: "Minimalista" },
    ],
    defaultVariant: "carousel",
    // Implementado en: restaurant, salon, clinic, fitness (gym), shop (store), repairs
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  faq: {
    id: "faq",
    label: "Preguntas Frecuentes",
    description: "Acordeon con preguntas y respuestas",
    icon: SECTION_ICONS.faq,
    variants: [
      { value: "accordion", label: "Acordeon" },
      { value: "cards", label: "Tarjetas" },
      { value: "simple", label: "Simple" },
    ],
    defaultVariant: "accordion",
    // Implementado en: restaurant, salon, clinic, fitness (gym), shop (store), repairs
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  contact: {
    id: "contact",
    label: "Contacto",
    description: "Formulario y datos de contacto",
    icon: SECTION_ICONS.contact,
    variants: [
      { value: "form", label: "Formulario" },
      { value: "info", label: "Info" },
    ],
    defaultVariant: "form",
    // Implementado en: todos los templates (formulario o info)
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  footer: {
    id: "footer",
    label: "Pie de Pagina",
    description: "Footer con enlaces y contacto",
    icon: SECTION_ICONS.footer,
    variants: [
      { value: "full", label: "Completo" },
      { value: "minimal", label: "Minimalista" },
      { value: "centered", label: "Centrado" },
    ],
    defaultVariant: "full",
    required: true,
    fixedPosition: "bottom",
    // Implementado en: todos los templates implementados
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  // === SECCIONES RESTAURANT ===
  menu: {
    id: "menu",
    label: "Carta / Menu",
    description: "Listado de platos con precios",
    icon: SECTION_ICONS.menu,
    variants: [
      { value: "tabs", label: "Pestanas" },
      { value: "grid", label: "Cuadricula" },
      { value: "list", label: "Lista" },
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "tabs",
    businessTypes: ["restaurant"],
  },

  reservation: {
    id: "reservation",
    label: "Reservas",
    description: "Formulario para reservar mesa",
    icon: SECTION_ICONS.reservation,
    variants: [
      { value: "classic", label: "Clasico" },
      { value: "wizard", label: "Asistente" },
      { value: "modal", label: "Modal" },
      { value: "modern", label: "Moderno" },
    ],
    defaultVariant: "modern",
    businessTypes: ["restaurant"],
  },

  orders: {
    id: "orders",
    label: "Pedidos Online",
    description: "Sistema de pedidos para llevar",
    icon: SECTION_ICONS.orders,
    variants: [
      { value: "default", label: "Estandar" },
    ],
    defaultVariant: "default",
    businessTypes: ["restaurant"],
  },

  openStatus: {
    id: "openStatus",
    label: "Estado Abierto/Cerrado",
    description: "Indicador visual del estado",
    icon: SECTION_ICONS.openStatus,
    variants: [
      { value: "pulse", label: "Pulso" },
      { value: "morph", label: "Morph" },
      { value: "liquid", label: "Liquido" },
      { value: "time", label: "Con Hora" },
    ],
    defaultVariant: "pulse",
    // NO es una sección del main - es un componente especial posicionado fuera
    // Solo restaurant lo usa actualmente
    businessTypes: [],
  },

  // === SECCIONES SALON / CLINIC / FITNESS / SHOP / REPAIRS ===
  services: {
    id: "services",
    label: "Servicios",
    description: "Catalogo de servicios con precios",
    icon: SECTION_ICONS.services,
    variants: [
      { value: "tabs", label: "Pestanas" },
      { value: "grid", label: "Cuadricula" },
      { value: "list", label: "Lista" },
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "tabs",
    // Implementado en: salon (Services), clinic (Treatments), fitness (Classes), shop (Products), repairs (Products)
    businessTypes: ["salon", "clinic", "fitness", "shop", "repairs"],
  },

  team: {
    id: "team",
    label: "Equipo",
    description: "Presentacion del equipo profesional",
    icon: SECTION_ICONS.team,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "carousel", label: "Carrusel" },
      { value: "list", label: "Lista" },
    ],
    defaultVariant: "grid",
    // Implementado en: restaurant, salon, clinic, fitness (gym), shop (store), repairs
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  gallery: {
    id: "gallery",
    label: "Galeria",
    description: "Galeria de imagenes del negocio",
    icon: SECTION_ICONS.gallery,
    variants: [
      { value: "masonry", label: "Masonry" },
      { value: "grid", label: "Cuadricula" },
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "masonry",
    // Implementado en: restaurant, salon, clinic, fitness (gym), shop (store), repairs
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  brands: {
    id: "brands",
    label: "Marcas",
    description: "Carrusel de logos de marcas",
    icon: SECTION_ICONS.brands,
    variants: [
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "carousel",
    // Implementado en: restaurant, salon, clinic, fitness (gym), shop (store), repairs
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  booking: {
    id: "booking",
    label: "Reservar Cita",
    description: "Sistema de reserva de citas",
    icon: SECTION_ICONS.booking,
    variants: [
      { value: "wizard", label: "Asistente" },
    ],
    defaultVariant: "wizard",
    // Implementado en: salon (AppointmentForm), clinic (AppointmentForm), fitness (ClassBookingForm)
    businessTypes: ["salon", "clinic", "fitness"],
  },

  // === SECCIONES FITNESS ===
  // NOTA: fitness usa "services" para Classes y "booking" para ClassBookingForm
  classes: {
    id: "classes",
    label: "Clases",
    description: "Listado de clases disponibles",
    icon: SECTION_ICONS.classes,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "list", label: "Lista" },
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "grid",
    // NO IMPLEMENTADO como sección separada - fitness usa "services" que renderiza Classes
    businessTypes: [],
  },

  trainers: {
    id: "trainers",
    label: "Entrenadores",
    description: "Equipo de entrenadores",
    icon: SECTION_ICONS.trainers,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "grid",
    // NO IMPLEMENTADO - No hay componente Trainers
    businessTypes: [],
  },

  schedule: {
    id: "schedule",
    label: "Horarios",
    description: "Calendario de clases",
    icon: SECTION_ICONS.schedule,
    variants: [
      { value: "table", label: "Tabla" },
      { value: "calendar", label: "Calendario" },
      { value: "list", label: "Lista" },
    ],
    defaultVariant: "table",
    // NO IMPLEMENTADO - No hay componente Schedule
    businessTypes: [],
  },

  plans: {
    id: "plans",
    label: "Planes / Precios",
    description: "Tabla de planes y precios",
    icon: SECTION_ICONS.plans,
    variants: [
      { value: "cards", label: "Tarjetas" },
      { value: "table", label: "Tabla" },
      { value: "comparison", label: "Comparativa" },
    ],
    defaultVariant: "cards",
    // Implementado en: restaurant, salon, clinic, fitness (gym), shop (store), repairs
    businessTypes: ["restaurant", "salon", "clinic", "fitness", "shop", "repairs"],
  },

  membership: {
    id: "membership",
    label: "Membresias",
    description: "Opciones de membresia",
    icon: SECTION_ICONS.membership,
    variants: [
      { value: "cards", label: "Tarjetas" },
      { value: "list", label: "Lista" },
    ],
    defaultVariant: "cards",
    // NO IMPLEMENTADO - No hay componente Membership
    businessTypes: [],
  },

  // === SECCIONES SHOP ===
  // NOTA: shop usa "services" para Products y "contact" para ContactForm
  products: {
    id: "products",
    label: "Productos",
    description: "Catalogo de productos",
    icon: SECTION_ICONS.products,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "list", label: "Lista" },
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "grid",
    // NO IMPLEMENTADO como sección separada - shop usa "services" que renderiza Products
    businessTypes: [],
  },

  cart: {
    id: "cart",
    label: "Carrito",
    description: "Carrito de compras",
    icon: SECTION_ICONS.cart,
    variants: [
      { value: "sidebar", label: "Lateral" },
      { value: "modal", label: "Modal" },
    ],
    defaultVariant: "sidebar",
    // NO IMPLEMENTADO - No hay componente Cart
    businessTypes: [],
  },

  categories: {
    id: "categories",
    label: "Categorias",
    description: "Navegacion por categorias",
    icon: SECTION_ICONS.categories,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "list", label: "Lista" },
    ],
    defaultVariant: "grid",
    // NO IMPLEMENTADO - No hay componente Categories
    businessTypes: [],
  },

  // === SECCIONES REAL ESTATE ===
  // NOTA: No hay template realestate implementado
  properties: {
    id: "properties",
    label: "Propiedades",
    description: "Listado de propiedades",
    icon: SECTION_ICONS.properties,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "list", label: "Lista" },
      { value: "map", label: "Con Mapa" },
    ],
    defaultVariant: "grid",
    // NO IMPLEMENTADO - No hay template realestate
    businessTypes: [],
  },

  search: {
    id: "search",
    label: "Buscador",
    description: "Buscador de propiedades",
    icon: SECTION_ICONS.search,
    variants: [
      { value: "inline", label: "En linea" },
      { value: "advanced", label: "Avanzado" },
    ],
    defaultVariant: "inline",
    // NO IMPLEMENTADO - No hay template realestate
    businessTypes: [],
  },

  agents: {
    id: "agents",
    label: "Agentes",
    description: "Equipo de agentes",
    icon: SECTION_ICONS.agents,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "grid",
    // NO IMPLEMENTADO - No hay template realestate
    businessTypes: [],
  },

  // === SECCIONES REPAIRS ===
  // NOTA: repairs usa "services" para Products y "contact" para ContactForm
  quotes: {
    id: "quotes",
    label: "Presupuestos",
    description: "Solicitar presupuesto",
    icon: SECTION_ICONS.quotes,
    variants: [
      { value: "form", label: "Formulario" },
      { value: "wizard", label: "Asistente" },
    ],
    defaultVariant: "form",
    // NO IMPLEMENTADO - repairs usa "contact" con ContactForm
    businessTypes: [],
  },

  portfolio: {
    id: "portfolio",
    label: "Portfolio",
    description: "Trabajos realizados",
    icon: SECTION_ICONS.portfolio,
    variants: [
      { value: "grid", label: "Cuadricula" },
      { value: "masonry", label: "Masonry" },
      { value: "carousel", label: "Carrusel" },
    ],
    defaultVariant: "grid",
    // NO IMPLEMENTADO - No hay componente Portfolio
    businessTypes: [],
  },

  process: {
    id: "process",
    label: "Proceso",
    description: "Pasos del proceso de trabajo",
    icon: SECTION_ICONS.process,
    variants: [
      { value: "steps", label: "Pasos" },
      { value: "timeline", label: "Timeline" },
    ],
    defaultVariant: "steps",
    // NO IMPLEMENTADO - No hay componente Process
    businessTypes: [],
  },
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtener secciones disponibles para un tipo de negocio
 */
export function getSectionsForBusinessType(businessType: BusinessType): SectionDefinition[] {
  return Object.values(SECTIONS_CATALOG).filter(
    (section) => section.businessTypes.includes(businessType)
  );
}

/**
 * Obtener definición de una sección por ID
 */
export function getSectionDefinition(sectionId: SectionId): SectionDefinition | undefined {
  return SECTIONS_CATALOG[sectionId];
}

/**
 * Obtener configuración por defecto de secciones para un tipo de negocio
 */
export function getDefaultSectionsConfig(businessType: BusinessType): SectionsConfig {
  const sections = getSectionsForBusinessType(businessType);

  // Ordenar: fixedPosition top primero, luego normales, fixedPosition bottom al final
  const sortedSections = [...sections].sort((a, b) => {
    if (a.fixedPosition === "top") return -1;
    if (b.fixedPosition === "top") return 1;
    if (a.fixedPosition === "bottom") return 1;
    if (b.fixedPosition === "bottom") return -1;
    return 0;
  });

  // Secciones habilitadas por defecto según tipo de negocio
  // NOTA: Solo incluir secciones que tienen businessTypes configurados para este tipo
  const defaultEnabled: Record<BusinessType, SectionId[]> = {
    salon: ["hero", "features", "services", "booking", "footer"],
    restaurant: ["hero", "features", "menu", "orders", "reservation", "footer"],
    fitness: ["hero", "features", "services", "booking", "footer"],
    clinic: ["hero", "features", "services", "booking", "footer"],
    shop: ["hero", "features", "services", "contact", "footer"],
    repairs: ["hero", "features", "services", "contact", "footer"],
    realestate: ["hero", "features", "footer"], // Template no implementado
  };

  const enabledForType = defaultEnabled[businessType] || [];

  return {
    sections: sortedSections.map((section, index) => ({
      id: section.id,
      enabled: section.required || enabledForType.includes(section.id),
      variant: section.defaultVariant,
      order: index,
    })),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Obtener solo las secciones habilitadas, ordenadas
 */
export function getEnabledSections(config: SectionsConfig): SectionConfig[] {
  return [...config.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Validar que una configuración de secciones es válida
 */
export function validateSectionsConfig(config: SectionsConfig, businessType: BusinessType): boolean {
  const availableSections = getSectionsForBusinessType(businessType);
  const availableIds = availableSections.map((s) => s.id);

  // Verificar que todas las secciones en config están disponibles para el tipo de negocio
  for (const section of config.sections) {
    if (!availableIds.includes(section.id)) {
      return false;
    }
  }

  // Verificar que las secciones requeridas están habilitadas
  for (const section of availableSections) {
    if (section.required) {
      const configSection = config.sections.find((s) => s.id === section.id);
      if (!configSection || !configSection.enabled) {
        return false;
      }
    }
  }

  return true;
}
