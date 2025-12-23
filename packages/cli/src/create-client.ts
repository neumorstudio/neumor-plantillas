#!/usr/bin/env node
import { config } from "dotenv";
import { input, select, confirm } from "@inquirer/prompts";
import { createClient } from "@supabase/supabase-js";
import chalk from "chalk";
import ora from "ora";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..", "..");

// Cargar variables de entorno desde la raíz del proyecto
config({ path: join(rootDir, ".env") });

// Configuración de Supabase (requiere variables de entorno)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// URL del webhook de reservas
const WEBHOOK_URL = process.env.PUBLIC_RESERVATION_WEBHOOK_URL || "https://n8n.neumorstudio.com/webhook/reservas";

interface ClientData {
  businessName: string;
  email: string;
  businessType: string;
  phone: string;
  domain: string;
  theme: string;
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


async function main() {
  console.log(chalk.cyan.bold("\n🏢 NeumorStudio - Crear Nuevo Cliente\n"));

  // Verificar credenciales
  if (!SUPABASE_URL) {
    console.log(chalk.red("❌ Error: SUPABASE_URL no está configurado."));
    console.log(chalk.yellow("   Configúralo en tu archivo .env (SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL).\n"));
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.log(chalk.red("❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurado."));
    console.log(chalk.yellow("   Configúralo en tu archivo .env o como variable de entorno.\n"));
    process.exit(1);
  }

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

  async function validateDomain(domain: string): Promise<string | true> {
    if (domain.length < 3) return "Mínimo 3 caracteres";
    if (!/^[a-z0-9-]+$/.test(domain)) return "Solo letras minúsculas, números y guiones";

    const fullDomain = `${domain}.neumorstudio.com`;
    const { data } = await supabase
      .from("websites")
      .select("id")
      .eq("domain", fullDomain)
      .single();

    if (data) return `El dominio "${fullDomain}" ya está en uso. Elige otro.`;
    return true;
  }

  // Recopilar información del cliente
  const clientData: ClientData = {
    businessName: await input({
      message: "Nombre del negocio:",
      validate: (value) => value.length > 0 || "El nombre es obligatorio",
    }),

    email: await input({
      message: "Email del cliente:",
      validate: validateEmail,
    }),

    businessType: await select({
      message: "Tipo de negocio:",
      choices: [
        { name: "🍽️  Restaurante", value: "restaurant" },
        { name: "🏥 Clínica", value: "clinic" },
        { name: "💇 Salón de belleza", value: "salon" },
        { name: "🛒 Tienda", value: "shop" },
        { name: "🏋️  Gimnasio/Fitness", value: "fitness" },
        { name: "🏠 Inmobiliaria", value: "realestate" },
      ],
    }),

    phone: await input({
      message: "Teléfono (opcional):",
      default: "",
    }),

    domain: await input({
      message: "Subdominio (ej: mirestaurante):",
      validate: validateDomain,
      transformer: (value) => value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    }),

    theme: await select({
      message: "Tema visual:",
      choices: [
        { name: "☀️  Light - Claro y moderno", value: "light" },
        { name: "🌙 Dark - Oscuro y elegante", value: "dark" },
        { name: "🎨 Colorful - Vibrante y colorido", value: "colorful" },
        { name: "🪵 Rustic - Rústico y cálido", value: "rustic" },
        { name: "✨ Elegant - Sofisticado y lujoso", value: "elegant" },
      ],
    }),
  };

  const fullDomain = `${clientData.domain}.neumorstudio.com`;

  // Confirmar antes de crear
  console.log(chalk.cyan("\n📋 Resumen del nuevo cliente:\n"));
  console.log(`   Negocio:    ${chalk.white.bold(clientData.businessName)}`);
  console.log(`   Email:      ${chalk.white(clientData.email)}`);
  console.log(`   Tipo:       ${chalk.white(clientData.businessType)}`);
  console.log(`   Teléfono:   ${chalk.white(clientData.phone || "(no especificado)")}`);
  console.log(`   Dominio:    ${chalk.white(fullDomain)}`);
  console.log(`   Tema:       ${chalk.white(clientData.theme)}\n`);

  const confirmed = await confirm({
    message: "¿Crear este cliente?",
    default: true,
  });

  if (!confirmed) {
    console.log(chalk.yellow("\n⚠️  Operación cancelada.\n"));
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

    // 2. Crear website
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .insert({
        client_id: client.id,
        domain: fullDomain,
        theme: clientData.theme,
        config: {
          businessName: clientData.businessName,
          businessType: clientData.businessType,
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

    spinner.succeed("Cliente creado correctamente");

    // Mostrar resultados
    console.log(chalk.green.bold("\n✅ Cliente creado exitosamente!\n"));

    console.log(chalk.cyan("📌 IDs generados:"));
    console.log(`   Client ID:  ${chalk.yellow(client.id)}`);
    console.log(`   Website ID: ${chalk.yellow.bold(website.id)}`);

    if (!authError && authUser) {
      console.log(chalk.cyan("\n🔐 Credenciales de acceso:"));
      console.log(chalk.gray("   ─────────────────────────────────────────"));
      console.log(`   URL:        ${chalk.white("https://admin.neumorstudio.com")}`);
      console.log(`   Email:      ${chalk.white(clientData.email)}`);
      console.log(`   Contraseña: ${chalk.yellow.bold(tempPassword)}`);
      console.log(chalk.gray("   ─────────────────────────────────────────"));
      console.log(chalk.red.bold("   ⚠️  GUARDA ESTA CONTRASEÑA - No se puede recuperar"));
      console.log(chalk.gray("   El cliente deberá cambiarla en su primer acceso"));
    } else if (authError) {
      console.log(chalk.yellow("\n⚠️  Usuario Auth no creado:"));
      console.log(chalk.gray(`   ${authError.message}`));
      console.log(chalk.gray("   Puedes crearlo manualmente desde Supabase Dashboard"));
    }

    console.log(chalk.cyan("\n📝 Configuración para la plantilla:\n"));
    console.log(chalk.white("   Variables de entorno (.env):"));
    console.log(chalk.gray("   ─────────────────────────────────────────"));
    console.log(`   ${chalk.green("PUBLIC_WEBSITE_ID")}=${chalk.yellow(website.id)}`);
    console.log(`   ${chalk.green("PUBLIC_RESERVATION_WEBHOOK_URL")}=${chalk.yellow(WEBHOOK_URL)}`);
    console.log(chalk.gray("   ─────────────────────────────────────────\n"));

    // Preguntar si quiere copiar la plantilla
    const copyTemplate = await confirm({
      message: "¿Quieres crear una copia de la plantilla para este cliente?",
      default: true,
    });

    if (copyTemplate) {
      await createClientTemplate(clientData, website.id);
    }

    console.log(chalk.green.bold("\n🎉 ¡Listo! El cliente está configurado.\n"));

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
    const templateSource = join(rootDir, "apps", "templates", "restaurant");

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

    spinner.text = "Configurando proyecto...";

    // Crear archivo .env con la configuración
    const envContent = `# Configuración de ${clientData.businessName}
# Generado automáticamente por NeumorStudio CLI
# Website ID: ${websiteId}

PUBLIC_WEBSITE_ID=${websiteId}
PUBLIC_RESERVATION_WEBHOOK_URL=${WEBHOOK_URL}
`;

    writeFileSync(join(clientDir, ".env"), envContent);

    // Actualizar package.json - convertir a proyecto standalone
    const pkgPath = join(clientDir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

    // Cambiar nombre y eliminar referencias al workspace
    pkg.name = clientData.domain;
    delete pkg.devDependencies?.["@neumorstudio/config-tailwind"];
    delete pkg.devDependencies?.["@neumorstudio/config-typescript"];

    // Añadir dependencias que antes venían del workspace
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
          "@components/*": ["src/components/*"],
          "@layouts/*": ["src/layouts/*"],
          "@styles/*": ["src/styles/*"]
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

    console.log(chalk.green.bold("\n📂 Proyecto listo!\n"));
    console.log(chalk.cyan("   Próximos pasos:"));
    console.log(chalk.white(`   1. cd ${clientDir}`));
    console.log(chalk.white(`   2. Edita src/pages/index.astro con los datos del cliente`));
    console.log(chalk.white(`   3. pnpm dev para probar (puerto 4321)`));
    console.log(chalk.white(`   4. pnpm build para generar el sitio estático\n`));

  } catch (error) {
    spinner.fail("Error al crear el proyecto");
    throw error;
  }
}

main().catch(console.error);
