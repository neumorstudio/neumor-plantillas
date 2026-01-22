#!/usr/bin/env node
import { config } from "dotenv";
import { input, select, confirm } from "@inquirer/prompts";
import { createClient } from "@supabase/supabase-js";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import gradient from "gradient-string";
import boxen from "boxen";
import Table from "cli-table3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..", "..");

// Parse CLI arguments
const args = process.argv.slice(2);
const CHECK_URL_FLAG = args.includes("--check-url");

// Parse --vertical flag (e.g., --vertical=restaurant or --vertical restaurant)
function parseVerticalArg(): string | undefined {
  const idx = args.findIndex(a => a.startsWith("--vertical"));
  if (idx === -1) return undefined;
  const arg = args[idx];
  if (arg.includes("=")) return arg.split("=")[1];
  return args[idx + 1]; // next arg is the value
}
const VERTICAL_ARG = parseVerticalArg();

// Cargar variables de entorno desde la raíz del proyecto
config({ path: join(rootDir, ".env") });

// Configuración de Supabase (requiere variables de entorno)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// URL del webhook de reservas
const WEBHOOK_URL = process.env.PUBLIC_RESERVATION_WEBHOOK_URL || "https://n8n.neumorstudio.com/webhook/reservas";
// URL del webhook de leads/presupuestos
const CONTACT_WEBHOOK_URL = process.env.PUBLIC_CONTACT_WEBHOOK_URL
  || process.env.PUBLIC_LEAD_WEBHOOK_URL
  || "https://n8n.neumorstudio.com/webhook/lead";

// Variables de Supabase para los templates (se copian al .env del cliente)
const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Vercel API configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || ""; // Optional, for team deployments

// ============================================
// VERTICAL CONFIGURATION
// Maps business types to verticals and Vercel projects
// ============================================
type Vertical = "restaurant" | "peluqueria" | "reformas";

const VERTICALS: Record<Vertical, { label: string; vercelProject: string; businessTypes: string[] }> = {
  restaurant: {
    label: "Restaurantes",
    vercelProject: "web-restaurants",
    businessTypes: ["restaurant", "clinic", "fitness"], // clinic/fitness use restaurant template
  },
  peluqueria: {
    label: "Peluquerías",
    vercelProject: "web-peluquerias",
    businessTypes: ["salon"],
  },
  reformas: {
    label: "Reformas",
    vercelProject: "web-reformas",
    businessTypes: ["repairs", "realestate"], // realestate uses reformas template
  },
};

// Infer vertical from business type
function inferVertical(businessType: string): Vertical {
  for (const [vertical, config] of Object.entries(VERTICALS)) {
    if (config.businessTypes.includes(businessType)) {
      return vertical as Vertical;
    }
  }
  return "restaurant"; // Default fallback
}

// Validate vertical value
function isValidVertical(v: string): v is Vertical {
  return v in VERTICALS;
}

// ============================================
// ESTILOS Y COLORES PERSONALIZADOS
// ============================================
const neumorGradient = gradient(["#667eea", "#764ba2", "#f093fb"]);
const successGradient = gradient(["#11998e", "#38ef7d"]);

// Función para mostrar el banner
async function showBanner(): Promise<void> {
  return new Promise((resolve) => {
    figlet.text(
      "NeumorStudio",
      {
        font: "ANSI Shadow",
        horizontalLayout: "fitted",
      },
      (err, data) => {
        if (!err && data) {
          console.log("\n" + neumorGradient.multiline(data));
        }
        console.log(
          boxen(chalk.white("  CLI para Creación de Clientes  "), {
            padding: { left: 2, right: 2, top: 0, bottom: 0 },
            borderStyle: "round",
            borderColor: "magenta",
            dimBorder: true,
          })
        );
        console.log();
        resolve();
      }
    );
  });
}

// Función para mostrar separador
function showDivider(char = "─", length = 50): void {
  console.log(chalk.gray(char.repeat(length)));
}

// Función para mostrar paso actual
function showStep(step: number, total: number, title: string): void {
  const progress = chalk.magenta(`[${step}/${total}]`);
  console.log(`\n${progress} ${chalk.white.bold(title)}`);
  showDivider();
}

// Función para delay visual
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Smoke check: verify website URL responds (no new dependencies - uses native fetch)
const SMOKE_CHECK_OK_CODES = new Set([200, 301, 302, 307, 308]);

async function checkWebsiteUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch(url, {
      method: "HEAD", // Lightweight check
      signal: controller.signal,
      redirect: "manual", // Don't follow redirects, just check status
    });
    clearTimeout(timeout);
    return {
      ok: SMOKE_CHECK_OK_CODES.has(response.status),
      status: response.status,
    };
  } catch (err) {
    clearTimeout(timeout);
    const error = err as Error;
    if (error.name === "AbortError") {
      return { ok: false, error: "Timeout (5s)" };
    }
    return { ok: false, error: error.message };
  }
}

// ============================================
// VERCEL API FUNCTIONS
// ============================================
interface VercelDomainResult {
  success: boolean;
  verified: boolean;
  error?: string;
  verificationRecord?: { type: string; name: string; value: string };
}

async function assignVercelDomain(
  projectName: string,
  domain: string
): Promise<VercelDomainResult> {
  if (!VERCEL_TOKEN) {
    return { success: false, verified: false, error: "VERCEL_TOKEN not configured" };
  }

  const baseUrl = "https://api.vercel.com";
  const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";

  try {
    // POST /v10/projects/{idOrName}/domains
    const response = await fetch(
      `${baseUrl}/v10/projects/${projectName}/domains${teamQuery}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle specific errors
      if (data.error?.code === "domain_already_in_use") {
        return { success: false, verified: false, error: "Domain already assigned to another project" };
      }
      if (data.error?.code === "forbidden") {
        return { success: false, verified: false, error: "Invalid VERCEL_TOKEN or insufficient permissions" };
      }
      return { success: false, verified: false, error: data.error?.message || `HTTP ${response.status}` };
    }

    // Domain added, check if verified
    if (data.verified === false) {
      // Need DNS verification
      return {
        success: true,
        verified: false,
        verificationRecord: data.verification?.[0] || undefined,
      };
    }

    return { success: true, verified: true };
  } catch (err) {
    return { success: false, verified: false, error: (err as Error).message };
  }
}

async function verifyVercelDomain(projectName: string, domain: string): Promise<boolean> {
  if (!VERCEL_TOKEN) return false;

  const baseUrl = "https://api.vercel.com";
  const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";

  try {
    const response = await fetch(
      `${baseUrl}/v9/projects/${projectName}/domains/${domain}/verify${teamQuery}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    );
    const data = await response.json();
    return data.verified === true;
  } catch {
    return false;
  }
}

interface ClientData {
  businessName: string;
  email: string;
  businessType: string;
  vertical: Vertical;
  phone: string;
  domain: string;
  theme: string;
  address: string;
  preset: string;
  heroTitle: string;
  heroSubtitle: string;
}

// Generar contraseña temporal segura
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generar textos automáticos según tipo de negocio
function generateHeroTexts(businessName: string, businessType: string): { title: string; subtitle: string } {
  const texts: Record<string, { title: string; subtitle: string }> = {
    restaurant: {
      title: `Bienvenido a ${businessName}`,
      subtitle: "Una experiencia gastronómica única donde cada plato cuenta una historia. Reserva tu mesa y déjate sorprender por nuestros sabores.",
    },
    clinic: {
      title: `${businessName} - Tu salud es nuestra prioridad`,
      subtitle: "Profesionales dedicados a tu bienestar. Reserva tu cita y recibe la atención que mereces.",
    },
    salon: {
      title: `${businessName} - Donde la belleza cobra vida`,
      subtitle: "Expertos en realzar tu belleza natural. Reserva tu cita y déjate mimar por nuestros profesionales.",
    },
    shop: {
      title: `Bienvenido a ${businessName}`,
      subtitle: "Descubre nuestra selección exclusiva de productos. Calidad y estilo en cada detalle.",
    },
    fitness: {
      title: `${businessName} - Transforma tu vida`,
      subtitle: "Alcanza tus metas con nuestros entrenadores expertos. Reserva tu clase y comienza tu transformación.",
    },
    realestate: {
      title: `${businessName} - Tu hogar te espera`,
      subtitle: "Encuentra la propiedad de tus sueños. Nuestros expertos te guiarán en cada paso del camino.",
    },
    repairs: {
      title: `${businessName} - Reformas sin complicaciones`,
      subtitle: "Cuéntanos tu proyecto y recibe un presupuesto claro y detallado. Te acompañamos de principio a fin.",
    },
  };

  return texts[businessType] || texts.restaurant;
}

// Obtener preset recomendado según tipo de negocio
function getRecommendedPreset(businessType: string): string {
  const presetMap: Record<string, string> = {
    restaurant: "casual",
    clinic: "fine-dining",
    salon: "cafe-bistro",
    shop: "casual",
    fitness: "fast-food",
    realestate: "fine-dining",
    repairs: "casual",
  };
  return presetMap[businessType] || "casual";
}

// Obtener variantes según el preset seleccionado
function getPresetVariants(preset: string, businessType: string): Record<string, string> {
  const presets: Record<string, Record<string, string>> = {
    "fine-dining": {
      hero: "modern",
      menu: "list",
      features: "icons",
      reviews: "minimal",
      footer: "minimal",
      reservation: "modern",
    },
    "casual": {
      hero: "classic",
      menu: "tabs",
      features: "cards",
      reviews: "grid",
      footer: "full",
      reservation: "classic",
    },
    "fast-food": {
      hero: "bold",
      menu: "carousel",
      features: "banner",
      reviews: "carousel",
      footer: "minimal",
      reservation: "modal",
    },
    "cafe-bistro": {
      hero: "minimal",
      menu: "grid",
      features: "icons",
      reviews: "minimal",
      footer: "centered",
      reservation: "wizard",
    },
  };
  const storePresets: Record<string, Record<string, string>> = {
    "fine-dining": {
      hero: "modern",
      products: "list",
      features: "icons",
      reviews: "minimal",
      footer: "minimal",
    },
    "casual": {
      hero: "classic",
      products: "tabs",
      features: "cards",
      reviews: "grid",
      footer: "full",
    },
    "fast-food": {
      hero: "bold",
      products: "carousel",
      features: "banner",
      reviews: "carousel",
      footer: "minimal",
    },
    "cafe-bistro": {
      hero: "minimal",
      products: "grid",
      features: "icons",
      reviews: "minimal",
      footer: "centered",
    },
  };

  const presetSet = businessType === "repairs" ? storePresets : presets;
  return presetSet[preset] || presetSet["casual"];
}


async function main() {
  // Limpiar consola y mostrar banner
  console.clear();
  await showBanner();

  // Verificar credenciales
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log(
      boxen(
        chalk.red.bold("  Error de Configuración  \n\n") +
          (!SUPABASE_URL
            ? chalk.yellow("• SUPABASE_URL no está configurado\n")
            : "") +
          (!SUPABASE_SERVICE_KEY
            ? chalk.yellow("• SUPABASE_SERVICE_ROLE_KEY no está configurado\n")
            : "") +
          chalk.gray("\nConfigúralos en tu archivo .env"),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
        }
      )
    );
    process.exit(1);
  }

  // Verificación exitosa
  console.log(
    chalk.green("  ✓ ") + chalk.gray("Conectado a Supabase")
  );

  // Crear cliente de Supabase con service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Funciones de validación async
  async function validateEmail(email: string): Promise<string | true> {
    if (!email.includes("@")) return "Email inválido";

    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("email", email)
      .single();

    if (data) return `El email "${email}" ya está registrado. Usa otro.`;
    return true;
  }

  // Reserved subdomains that cannot be used by clients
  const RESERVED_SUBDOMAINS = new Set([
    "admin", "www", "api", "static", "assets", "support", "help",
    "docs", "blog", "app", "dashboard", "mail", "email", "ftp",
    "staging", "dev", "test", "demo", "cdn", "media", "images",
    "auth", "login", "signup", "register", "status", "health",
  ]);

  async function validateDomain(domain: string): Promise<string | true> {
    // Normalize input: trim whitespace and convert to lowercase
    const normalized = domain.trim().toLowerCase();

    // Length check: 3-30 characters
    if (normalized.length < 3) return "Mínimo 3 caracteres";
    if (normalized.length > 30) return "Máximo 30 caracteres";

    // Format: must start and end with alphanumeric, only lowercase letters, numbers, and hyphens
    // Regex: ^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$ allows 2-30 chars (but we already check min 3)
    if (!/^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/.test(normalized)) {
      return "Debe empezar y terminar con letra o número. Solo minúsculas, números y guiones.";
    }

    // No consecutive hyphens
    if (/--/.test(normalized)) return "No se permiten guiones consecutivos";

    // Reserved subdomains check
    if (RESERVED_SUBDOMAINS.has(normalized)) {
      return `El subdominio "${normalized}" está reservado. Elige otro.`;
    }

    // Uniqueness check in database
    const fullDomain = `${normalized}.neumorstudio.com`;
    const { data } = await supabase
      .from("websites")
      .select("id")
      .eq("domain", fullDomain)
      .single();

    if (data) return `El dominio "${fullDomain}" ya está en uso. Elige otro.`;
    return true;
  }

  // ============================================
  // PASO 1: Información básica
  // ============================================
  showStep(1, 4, "Información del Negocio");

  const clientData: ClientData = {
    businessName: await input({
      message: chalk.cyan("   Nombre del negocio:"),
      validate: (value) => value.length > 0 || "El nombre es obligatorio",
    }),

    email: await input({
      message: chalk.cyan("   Email del cliente:"),
      validate: validateEmail,
    }),

    businessType: await select({
      message: chalk.cyan("   Tipo de negocio:"),
      choices: [
        { name: "🍽️   Restaurante", value: "restaurant" },
        { name: "🏥  Clínica", value: "clinic" },
        { name: "💇  Salón de belleza", value: "salon" },
        { name: "🛒  Tienda", value: "shop" },
        { name: "🏋️   Gimnasio/Fitness", value: "fitness" },
        { name: "🏠  Inmobiliaria", value: "realestate" },
        { name: "🧰  Reformas y reparaciones", value: "repairs" },
      ],
    }),

    phone: await input({
      message: chalk.cyan("   Teléfono:"),
      default: "",
    }),

    address: await input({
      message: chalk.cyan("   Dirección:"),
      validate: (value) => value.length > 0 || "La dirección es obligatoria",
    }),

    vertical: "restaurant" as Vertical, // Will be set below
    domain: "",
    theme: "",
    preset: "",
    heroTitle: "",
    heroSubtitle: "",
  };

  // Determine vertical: CLI flag > prompt (if business type maps to multiple) > inferred
  let selectedVertical: Vertical;
  if (VERTICAL_ARG && isValidVertical(VERTICAL_ARG)) {
    selectedVertical = VERTICAL_ARG;
    console.log(chalk.gray(`   Vertical (--vertical): ${chalk.white(VERTICALS[selectedVertical].label)}`));
  } else {
    // Infer from business type
    const inferredVertical = inferVertical(clientData.businessType);

    // If VERCEL_TOKEN is set, confirm vertical selection
    if (VERCEL_TOKEN) {
      selectedVertical = await select({
        message: chalk.cyan("   Vertical (proyecto Vercel):"),
        choices: Object.entries(VERTICALS).map(([key, val]) => ({
          name: `${val.label} ${chalk.gray(`→ ${val.vercelProject}`)}${key === inferredVertical ? chalk.green(" ★") : ""}`,
          value: key as Vertical,
        })),
        default: inferredVertical,
      });
    } else {
      // No Vercel configured, use inferred
      selectedVertical = inferredVertical;
      console.log(chalk.gray(`   Vertical (inferida): ${chalk.white(VERTICALS[selectedVertical].label)}`));
    }
  }
  clientData.vertical = selectedVertical;

  // ============================================
  // PASO 2: Configuración web
  // ============================================
  showStep(2, 4, "Configuración de la Web");

  const rawDomain = await input({
    message: chalk.cyan("   Subdominio:"),
    validate: validateDomain,
    transformer: (value) => {
      const clean = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      return chalk.magenta(clean) + chalk.gray(".neumorstudio.com");
    },
  });
  // Store normalized value (trim + lowercase) to match validation
  clientData.domain = rawDomain.trim().toLowerCase();

  clientData.theme = await select({
    message: chalk.cyan("   Tema visual:"),
    choices: [
      { name: "☀️   Light       " + chalk.gray("Claro y moderno"), value: "light" },
      { name: "🌙  Dark        " + chalk.gray("Oscuro y elegante"), value: "dark" },
      { name: "🎨  Colorful    " + chalk.gray("Vibrante y colorido"), value: "colorful" },
      { name: "🪵  Rustic      " + chalk.gray("Rústico y cálido"), value: "rustic" },
      { name: "✨  Elegant     " + chalk.gray("Sofisticado y lujoso"), value: "elegant" },
      { name: "💎  NeuGlass    " + chalk.magenta("Premium") + chalk.gray(" Cristal + Neumorfismo"), value: "neuglass" },
      { name: "🔮  NeuGlass Dark " + chalk.magenta("Premium") + chalk.gray(" Cristal oscuro"), value: "neuglass-dark" },
    ],
  });

  const recommendedPreset = getRecommendedPreset(clientData.businessType);
  clientData.preset = await select({
    message: chalk.cyan("   Estilo de diseño:"),
    choices: [
      {
        name: "🍽️   Casual     " + chalk.gray("Acogedor y familiar") + (recommendedPreset === "casual" ? chalk.green(" ★") : ""),
        value: "casual"
      },
      {
        name: "✨  Fine Dining" + chalk.gray(" Elegante y sofisticado") + (recommendedPreset === "fine-dining" ? chalk.green(" ★") : ""),
        value: "fine-dining"
      },
      {
        name: "🚀  Fast Food  " + chalk.gray("Moderno y dinámico") + (recommendedPreset === "fast-food" ? chalk.green(" ★") : ""),
        value: "fast-food"
      },
      {
        name: "☕  Café Bistro" + chalk.gray(" Minimalista y acogedor") + (recommendedPreset === "cafe-bistro" ? chalk.green(" ★") : ""),
        value: "cafe-bistro"
      },
    ],
  });

  // ============================================
  // PASO 3: Contenido
  // ============================================
  showStep(3, 4, "Contenido de la Web");

  const autoTexts = generateHeroTexts(clientData.businessName, clientData.businessType);

  console.log(chalk.gray("\n   Textos generados automáticamente:"));
  console.log(chalk.white(`   "${autoTexts.title}"\n`));

  const customizeTexts = await confirm({
    message: chalk.cyan("   ¿Personalizar textos del banner?"),
    default: false,
  });

  if (customizeTexts) {
    clientData.heroTitle = await input({
      message: chalk.cyan("   Título principal:"),
      default: autoTexts.title,
    });
    clientData.heroSubtitle = await input({
      message: chalk.cyan("   Subtítulo:"),
      default: autoTexts.subtitle,
    });
  } else {
    clientData.heroTitle = autoTexts.title;
    clientData.heroSubtitle = autoTexts.subtitle;
  }

  const fullDomain = `${clientData.domain}.neumorstudio.com`;

  // ============================================
  // PASO 4: Confirmación
  // ============================================
  showStep(4, 4, "Confirmación");

  // Crear tabla de resumen
  const table = new Table({
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│'
    },
    style: { 'padding-left': 1, 'padding-right': 1 },
    colWidths: [18, 40],
  });

  table.push(
    [chalk.gray('Negocio'), chalk.white.bold(clientData.businessName)],
    [chalk.gray('Email'), chalk.cyan(clientData.email)],
    [chalk.gray('Tipo'), chalk.white(clientData.businessType)],
    [chalk.gray('Vertical'), chalk.white(VERTICALS[clientData.vertical].label)],
    [chalk.gray('Teléfono'), chalk.white(clientData.phone || chalk.gray('(no especificado)'))],
    [chalk.gray('Dirección'), chalk.white(clientData.address)],
    [chalk.gray('Dominio'), chalk.magenta(fullDomain)],
    [chalk.gray('Vercel Project'), chalk.cyan(VERTICALS[clientData.vertical].vercelProject)],
    [chalk.gray('Tema'), chalk.white(clientData.theme)],
    [chalk.gray('Preset'), chalk.white(clientData.preset)],
  );

  console.log("\n" + table.toString());

  // Box con el título del hero
  console.log(
    boxen(
      chalk.gray("Título: ") + chalk.white(clientData.heroTitle) + "\n" +
      chalk.gray("Subtítulo: ") + chalk.gray(clientData.heroSubtitle.substring(0, 60) + "..."),
      {
        title: "Banner Principal",
        titleAlignment: "left",
        padding: { left: 1, right: 1, top: 0, bottom: 0 },
        margin: { top: 1, bottom: 1 },
        borderStyle: "round",
        borderColor: "gray",
        dimBorder: true,
      }
    )
  );

  const confirmed = await confirm({
    message: chalk.cyan("   ¿Crear este cliente?"),
    default: true,
  });

  if (!confirmed) {
    console.log(
      boxen(chalk.yellow("  Operación cancelada  "), {
        padding: { left: 2, right: 2, top: 0, bottom: 0 },
        borderStyle: "round",
        borderColor: "yellow",
      })
    );
    process.exit(0);
  }

  // Crear registros en Supabase
  const spinner = ora("Creando cliente en Supabase...").start();

  try {
    // 1. Crear cliente
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        email: clientData.email,
        business_name: clientData.businessName,
        business_type: clientData.businessType,
        phone: clientData.phone || null,
      })
      .select()
      .single();

    if (clientError) {
      throw new Error(`Error creando cliente: ${clientError.message}`);
    }

    spinner.text = "Creando website...";

    // 2. Crear website con config completo
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .insert({
        client_id: client.id,
        domain: fullDomain,
        theme: clientData.theme,
        config: {
          businessName: clientData.businessName,
          businessType: clientData.businessType,
          vertical: clientData.vertical,
          vercelProject: VERTICALS[clientData.vertical].vercelProject,
          preset: clientData.preset,
          heroTitle: clientData.heroTitle,
          heroSubtitle: clientData.heroSubtitle,
          address: clientData.address,
          phone: clientData.phone || null,
          email: clientData.email,
          socialLinks: {
            instagram: `https://instagram.com/${clientData.domain}`,
            facebook: `https://facebook.com/${clientData.domain}`,
            tripadvisor: `https://tripadvisor.com/${clientData.domain}`,
          },
          // Variantes por defecto basadas en el preset
          variants: getPresetVariants(clientData.preset, clientData.businessType),
        },
      })
      .select()
      .single();

    if (websiteError) {
      throw new Error(`Error creando website: ${websiteError.message}`);
    }

    spinner.text = "Configurando notificaciones...";

    // 3. Crear notification_settings
    const { error: notifError } = await supabase
      .from("notification_settings")
      .insert({
        website_id: website.id,
        email_booking_confirmation: true,
        whatsapp_booking_confirmation: false,
        email_new_lead: true,
      });

    if (notifError) {
      throw new Error(`Error creando notificaciones: ${notifError.message}`);
    }

    spinner.text = "Creando usuario en Supabase Auth...";

    // 4. Crear usuario con contraseña temporal
    const tempPassword = generateTempPassword();
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: clientData.email,
      password: tempPassword,
      email_confirm: true, // Marcar email como verificado
      user_metadata: {
        business_name: clientData.businessName,
        business_type: clientData.businessType,
        client_id: client.id,
        must_change_password: true, // Flag para forzar cambio en primer login
      },
    });

    if (authError) {
      spinner.warn(`Usuario Auth no creado: ${authError.message}`);
    } else {
      // 5. Vincular auth_user_id con el cliente
      await supabase
        .from("clients")
        .update({ auth_user_id: authUser.user.id })
        .eq("id", client.id);
    }

    spinner.succeed(chalk.green("Cliente creado correctamente"));

    // 6. Assign domain to Vercel project (if VERCEL_TOKEN configured)
    let vercelResult: VercelDomainResult | null = null;
    const vercelProject = VERTICALS[clientData.vertical].vercelProject;

    if (VERCEL_TOKEN) {
      const vercelSpinner = ora(`Asignando dominio a Vercel (${vercelProject})...`).start();
      vercelResult = await assignVercelDomain(vercelProject, fullDomain);

      if (vercelResult.success) {
        if (vercelResult.verified) {
          vercelSpinner.succeed(chalk.green(`Dominio asignado y verificado en ${vercelProject}`));
        } else {
          vercelSpinner.warn(chalk.yellow(`Dominio asignado pero pendiente de verificación`));
          // Try automatic verification
          const verified = await verifyVercelDomain(vercelProject, fullDomain);
          if (verified) {
            console.log(chalk.green("   ✓ Verificación automática exitosa"));
            vercelResult.verified = true;
          }
        }
      } else {
        vercelSpinner.fail(chalk.red(`Error asignando dominio: ${vercelResult.error}`));
      }
    }

    // Mostrar resultados con estilo
    await sleep(300);
    console.log();
    console.log(
      boxen(
        successGradient("  ✓ CLIENTE CREADO EXITOSAMENTE  "),
        {
          padding: { left: 2, right: 2, top: 0, bottom: 0 },
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );

    // IDs generados
    const idsTable = new Table({
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      },
      style: { 'padding-left': 1, 'padding-right': 1 },
    });
    idsTable.push(
      [chalk.gray('Client ID'), chalk.yellow(client.id)],
      [chalk.gray('Website ID'), chalk.yellow.bold(website.id)],
      [chalk.gray('Domain'), chalk.magenta(fullDomain)],
      [chalk.gray('Vertical'), chalk.white(VERTICALS[clientData.vertical].label)],
      [chalk.gray('Vercel Project'), chalk.cyan(vercelProject)],
    );

    // Add Vercel status row
    if (VERCEL_TOKEN) {
      if (vercelResult?.success && vercelResult.verified) {
        idsTable.push([chalk.gray('Vercel Status'), chalk.green('✓ Assigned & Verified')]);
      } else if (vercelResult?.success && !vercelResult.verified) {
        idsTable.push([chalk.gray('Vercel Status'), chalk.yellow('⚠ Needs DNS Verification')]);
      } else {
        idsTable.push([chalk.gray('Vercel Status'), chalk.red('✗ Failed')]);
      }
    } else {
      idsTable.push([chalk.gray('Vercel Status'), chalk.gray('— Not configured')]);
    }

    console.log("\n" + idsTable.toString());

    // Show DNS verification instructions if needed
    if (vercelResult?.success && !vercelResult.verified && vercelResult.verificationRecord) {
      const rec = vercelResult.verificationRecord;
      console.log(
        boxen(
          chalk.yellow.bold("VERIFICACIÓN DNS REQUERIDA\n\n") +
          chalk.gray("Añade el siguiente registro DNS:\n\n") +
          chalk.white(`Tipo:  ${rec.type}\n`) +
          chalk.white(`Name:  ${rec.name}\n`) +
          chalk.white(`Value: ${rec.value}\n\n`) +
          chalk.gray("Después ejecuta:\n") +
          chalk.cyan(`pnpm cli:create-client --check-url`),
          {
            padding: 1,
            margin: { top: 1 },
            borderStyle: "round",
            borderColor: "yellow",
            title: "🌐 Verificación Pendiente",
            titleAlignment: "left",
          }
        )
      );
    } else if (vercelResult && !vercelResult.success) {
      console.log(
        boxen(
          chalk.red.bold("DOMINIO NO ASIGNADO A VERCEL\n\n") +
          chalk.gray("Error: ") + chalk.white(vercelResult.error || "Unknown") + "\n\n" +
          chalk.gray("Reintentar manualmente:\n") +
          chalk.cyan(`vercel domains add ${fullDomain} --scope ${vercelProject}`),
          {
            padding: 1,
            margin: { top: 1 },
            borderStyle: "round",
            borderColor: "red",
            title: "⚠ Acción Requerida",
            titleAlignment: "left",
          }
        )
      );
    }

    // Credenciales
    if (!authError && authUser) {
      console.log(
        boxen(
          chalk.white.bold("CREDENCIALES DE ACCESO\n\n") +
          chalk.gray("URL:        ") + chalk.cyan("https://admin.neumorstudio.com") + "\n" +
          chalk.gray("Email:      ") + chalk.white(clientData.email) + "\n" +
          chalk.gray("Contraseña: ") + chalk.yellow.bold(tempPassword) + "\n\n" +
          chalk.red("⚠  GUARDA ESTA CONTRASEÑA") + chalk.gray(" - No se puede recuperar\n") +
          chalk.gray("   El cliente deberá cambiarla en su primer acceso"),
          {
            padding: 1,
            margin: { top: 1 },
            borderStyle: "double",
            borderColor: "yellow",
            title: "🔐 Acceso Admin",
            titleAlignment: "center",
          }
        )
      );
    } else if (authError) {
      console.log(
        boxen(
          chalk.yellow("Usuario Auth no creado:\n") +
          chalk.gray(authError.message + "\n\n") +
          chalk.gray("Puedes crearlo manualmente desde Supabase Dashboard"),
          {
            padding: 1,
            margin: { top: 1 },
            borderStyle: "round",
            borderColor: "yellow",
          }
        )
      );
    }

    // Variables de entorno
    console.log(
      boxen(
        chalk.gray("# Variables de entorno (.env)\n\n") +
        chalk.green("PUBLIC_WEBSITE_ID") + chalk.white("=") + chalk.yellow(website.id) + "\n" +
        chalk.green("PUBLIC_RESERVATION_WEBHOOK_URL") + chalk.white("=") + chalk.cyan(WEBHOOK_URL),
        {
          padding: 1,
          margin: { top: 1 },
          borderStyle: "round",
          borderColor: "gray",
          title: "📝 Configuración",
          titleAlignment: "left",
        }
      )
    );

    // Preguntar si quiere copiar la plantilla
    console.log();
    const copyTemplate = await confirm({
      message: chalk.cyan("   ¿Crear proyecto de la plantilla para este cliente?"),
      default: true,
    });

    if (copyTemplate) {
      await createClientTemplate(clientData, website.id);
    }

    // Smoke check: verify website URL (optional)
    const websiteUrl = `https://${fullDomain}`;
    let doSmokeCheck = CHECK_URL_FLAG;

    if (!CHECK_URL_FLAG) {
      doSmokeCheck = await confirm({
        message: chalk.cyan(`   ¿Verificar que ${fullDomain} responde?`),
        default: false,
      });
    }

    if (doSmokeCheck) {
      const checkSpinner = ora(`Verificando ${websiteUrl}...`).start();
      const result = await checkWebsiteUrl(websiteUrl);

      if (result.ok) {
        checkSpinner.succeed(chalk.green(`${fullDomain} responde (${result.status})`));
      } else {
        checkSpinner.warn(
          chalk.yellow(`${fullDomain} no responde`) +
          chalk.gray(` - ${result.error || `HTTP ${result.status}`}`)
        );
        console.log(
          boxen(
            chalk.yellow.bold("NOTA: ") + chalk.white("El registro en Supabase se ha creado correctamente.\n") +
            chalk.gray("El subdominio puede tardar en propagarse o necesita configuración DNS.\n") +
            chalk.gray("Verifica manualmente: ") + chalk.cyan(websiteUrl),
            {
              padding: 1,
              margin: { top: 0 },
              borderStyle: "round",
              borderColor: "yellow",
            }
          )
        );
      }
    }

    // Mensaje final
    console.log(
      boxen(
        neumorGradient("  ✨ ¡LISTO! El cliente está configurado ✨  "),
        {
          padding: { left: 2, right: 2, top: 0, bottom: 0 },
          margin: { top: 1, bottom: 1 },
          borderStyle: "round",
          borderColor: "magenta",
        }
      )
    );

  } catch (error) {
    spinner.fail("Error al crear el cliente");
    console.error(chalk.red(`\n❌ ${(error as Error).message}\n`));
    process.exit(1);
  }
}

async function createClientTemplate(clientData: ClientData, websiteId: string) {
  // Preguntar dónde crear el proyecto
  const defaultPath = join(process.env.HOME || "~", "NeumorStudio", "clientes", clientData.domain);

  const outputPath = await input({
    message: "Ruta donde crear el proyecto:",
    default: defaultPath,
  });

  const clientDir = outputPath.startsWith("~")
    ? outputPath.replace("~", process.env.HOME || "")
    : outputPath;

  const spinner = ora("Creando proyecto del cliente...").start();

  try {
    // Determinar paths
    const templateName = clientData.businessType === "repairs" ? "repairs" : "restaurant";
    const templateSource = join(rootDir, "apps", "templates", templateName);

    // Verificar que existe la plantilla fuente
    if (!existsSync(templateSource)) {
      throw new Error(`No se encontró la plantilla en: ${templateSource}`);
    }

    // Verificar que no existe ya el directorio del cliente
    if (existsSync(clientDir)) {
      spinner.fail(`El directorio ya existe: ${clientDir}`);
      const overwrite = await confirm({
        message: "¿Quieres sobrescribirlo?",
        default: false,
      });
      if (!overwrite) {
        console.log(chalk.yellow("Operación cancelada."));
        return;
      }
      // Eliminar directorio existente
      const { execSync } = await import("child_process");
      execSync(`rm -rf "${clientDir}"`, { stdio: "ignore" });
      spinner.start("Creando proyecto del cliente...");
    }

    // Crear directorio padre si no existe
    const parentDir = dirname(clientDir);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // Copiar plantilla
    const { execSync } = await import("child_process");
    execSync(`cp -r "${templateSource}" "${clientDir}"`, { stdio: "ignore" });

    spinner.text = "Personalizando plantilla...";

    // ============================================
    // PERSONALIZAR index.astro
    // ============================================
    const indexPath = join(clientDir, "src", "pages", "index.astro");
    let indexContent = readFileSync(indexPath, "utf-8");

    // Generar el nuevo objeto config personalizado
    const newConfig = `const config = {
  // ID del website en Supabase (OBLIGATORIO - se asigna al crear el cliente)
  websiteId: import.meta.env.PUBLIC_WEBSITE_ID || "",

  // Informacion basica
  restaurantName: "${clientData.businessName}",
  theme: "${clientData.theme}" as const, // light | dark | colorful | rustic | elegant | neuglass | neuglass-dark

  // OPCION 1: Seleccion manual de variantes
  variants: {
    hero: "classic" as const,      // classic | modern | bold | minimal
    menu: "tabs" as const,         // tabs | grid | list | carousel
    features: "cards" as const,    // cards | icons | banner
    reviews: "grid" as const,      // grid | carousel | minimal
    footer: "full" as const,       // full | minimal | centered
  },

  // OPCION 2: Usar un preset (cambia undefined por: "fine-dining" | "casual" | "fast-food" | "cafe-bistro")
  preset: "${clientData.preset}" as "fine-dining" | "casual" | "fast-food" | "cafe-bistro" | undefined,

  // SEO
  siteTitle: "${clientData.businessName} | ${clientData.businessType === 'restaurant' ? 'Restaurante' : clientData.businessType === 'repairs' ? 'Reformas' : 'Bienvenido'}",
  siteDescription:
    "${clientData.heroSubtitle.replace(/"/g, '\\"')}",

  // Hero
  heroTitle: "${clientData.heroTitle.replace(/"/g, '\\"')}",
  heroSubtitle:
    "${clientData.heroSubtitle.replace(/"/g, '\\"')}",
  heroImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",

  // Reservas - webhook de n8n (configurar URL del webhook antes de desplegar)
  webhookUrl: import.meta.env.PUBLIC_RESERVATION_WEBHOOK_URL || "https://n8n.neumorstudio.com/webhook/reservas",

  // Contacto
  address: "${clientData.address.replace(/"/g, '\\"')}",
  phone: "${clientData.phone || '+34 000 000 000'}",
  email: "${clientData.email}",

  // Redes sociales
  socialLinks: {
    instagram: "https://instagram.com/${clientData.domain}",
    facebook: "https://facebook.com/${clientData.domain}",
    tripadvisor: "https://tripadvisor.com/${clientData.domain}",
  },

  // Valoraciones
  googleRating: 4.8,
  totalReviews: 0,
};`;

    // Reemplazar el objeto config en el archivo
    // Buscar desde "const config = {" hasta el cierre "};"
    const configRegex = /const config = \{[\s\S]*?\n\};/;
    indexContent = indexContent.replace(configRegex, newConfig);

    writeFileSync(indexPath, indexContent);

    spinner.text = "Configurando proyecto...";

    // Crear archivo .env con la configuración completa
    const webhookEnvBlock = clientData.businessType === "repairs"
      ? `# Webhook de presupuestos (n8n)\nPUBLIC_CONTACT_WEBHOOK_URL=${CONTACT_WEBHOOK_URL}\n`
      : `# Webhook de reservas (n8n)\nPUBLIC_RESERVATION_WEBHOOK_URL=${WEBHOOK_URL}\n`;

    const envContent = `# ===========================================
# ${clientData.businessName}
# Generado automáticamente por NeumorStudio CLI
# Fecha: ${new Date().toLocaleDateString("es-ES")}
# ===========================================

# Supabase - Conexión a la base de datos
# El template lee la configuración (tema, preset, colores) desde Supabase
PUBLIC_SUPABASE_URL=${SUPABASE_PUBLIC_URL}
PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Website ID - Identificador único en Supabase
PUBLIC_WEBSITE_ID=${websiteId}

${webhookEnvBlock}
`;

    writeFileSync(join(clientDir, ".env"), envContent);

    // Actualizar package.json - convertir a proyecto standalone
    const pkgPath = join(clientDir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

    // Cambiar nombre y eliminar referencias al workspace
    pkg.name = clientData.domain;
    delete pkg.devDependencies?.["@neumorstudio/config-tailwind"];
    delete pkg.devDependencies?.["@neumorstudio/config-typescript"];

    // Añadir dependencias necesarias
    pkg.dependencies = {
      ...pkg.dependencies,
      "@astrojs/node": "^9.1.3",
      "@supabase/supabase-js": "^2.49.1",
      "astro": "^5.16.6",
      "clsx": "^2.1.1"
    };

    // Añadir devDependencies que antes venían del workspace
    pkg.devDependencies = {
      ...pkg.devDependencies,
      "@astrojs/check": "^0.9.4",
      "@tailwindcss/vite": "^4.0.0",
      "tailwindcss": "^4.0.0",
      "typescript": "^5.7.2"
    };

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    // Actualizar tsconfig.json para que sea standalone
    const tsconfigPath = join(clientDir, "tsconfig.json");
    if (existsSync(tsconfigPath)) {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
      // Eliminar referencia al workspace config
      delete tsconfig.extends;
      tsconfig.compilerOptions = {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        jsx: "preserve",
        jsxImportSource: "astro",
        baseUrl: ".",
        paths: {
          "@/*": ["src/*"],
          "@components/*": ["src/components/*"],
          "@layouts/*": ["src/layouts/*"],
          "@styles/*": ["src/styles/*"],
          "@lib/*": ["src/lib/*"]
        }
      };
      tsconfig.include = ["src/**/*"];
      tsconfig.exclude = ["node_modules", "dist"];
      writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
    }

    spinner.text = "Instalando dependencias...";

    // Instalar dependencias
    try {
      execSync("pnpm install", { cwd: clientDir, stdio: "ignore" });
      spinner.succeed(`Proyecto creado en: ${clientDir}`);
    } catch {
      spinner.warn(`Proyecto creado pero fallo pnpm install. Ejecuta manualmente.`);
    }

    // Mostrar resultado bonito
    console.log(
      boxen(
        chalk.green.bold("  📂 PROYECTO PERSONALIZADO LISTO  \n\n") +
        chalk.gray("La plantilla ya incluye:\n") +
        chalk.white(`  • Nombre: ${chalk.cyan(clientData.businessName)}\n`) +
        chalk.white(`  • Tema: ${chalk.cyan(clientData.theme)}\n`) +
        chalk.white(`  • Preset: ${chalk.cyan(clientData.preset)}\n`) +
        chalk.white(`  • Contacto configurado\n`) +
        chalk.white(`  • Redes sociales personalizadas`),
        {
          padding: 1,
          margin: { top: 1 },
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );

    // Próximos pasos
    console.log(
      boxen(
        chalk.white.bold("PRÓXIMOS PASOS\n\n") +
        chalk.yellow("1. ") + chalk.white(`cd ${clientDir}\n`) +
        chalk.yellow("2. ") + chalk.white("pnpm dev ") + chalk.gray("(puerto 4321)\n") +
        chalk.yellow("3. ") + chalk.white("Personaliza imágenes y menú\n") +
        chalk.yellow("4. ") + chalk.white("pnpm build ") + chalk.gray("para producción"),
        {
          padding: 1,
          margin: { top: 1 },
          borderStyle: "round",
          borderColor: "cyan",
          title: "🚀 Siguiente",
          titleAlignment: "left",
        }
      )
    );

  } catch (error) {
    spinner.fail("Error al crear el proyecto");
    throw error;
  }
}

main().catch(console.error);
