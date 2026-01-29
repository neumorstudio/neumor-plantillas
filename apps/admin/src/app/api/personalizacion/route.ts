import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import type {
  WebsiteConfig,
  ColorsConfig,
  TypographyConfig,
  EffectsConfig,
  BrandingConfig,
  Theme,
} from "@neumorstudio/supabase";

// Temas válidos - Todos los temas disponibles
const VALID_THEMES: Theme[] = [
  // Base
  "light",
  "dark",
  "colorful",
  "rustic",
  "elegant",
  // Premium NeuGlass
  "neuglass",
  "neuglass-dark",
  // Seasonal
  "christmas",
  "summer",
  "autumn",
  "spring",
  // Mood/Style
  "ocean",
  "sunset",
  "forest",
  "midnight",
  "rose",
  "lavender",
  "coral",
  "minimal",
  // Industry
  "wellness",
  "vintage",
];

// GET: Obtener configuración actual del tema y personalización
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get client by auth_user_id
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Get website configuration
    const { data: website, error } = await supabase
      .from("websites")
      .select("id, domain, theme, config")
      .eq("client_id", client.id)
      .single();

    if (error || !website) {
      return NextResponse.json(
        { error: "Website no encontrado" },
        { status: 404 }
      );
    }

    const config = (website.config || {}) as WebsiteConfig;

    return NextResponse.json({
      websiteId: website.id,
      domain: website.domain,
      theme: website.theme as Theme,
      config: {
        // Info del negocio
        businessName: config.businessName,
        businessType: config.businessType,
        phone: config.phone,
        email: config.email,
        address: config.address,

        // Variantes
        variants: config.variants,

        // Hero
        heroTitle: config.heroTitle,
        heroSubtitle: config.heroSubtitle,
        heroImage: config.heroImage,

        // Colores (nueva estructura + legacy)
        colors: config.colors || {
          primary: config.primaryColor,
          secondary: config.secondaryColor,
        },
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,

        // Branding
        branding: config.branding || {
          logo: config.logo,
        },
        logo: config.logo,

        // Tipografía
        typography: config.typography,

        // Efectos
        effects: config.effects,

        // Redes sociales
        socialLinks: config.socialLinks,

        // Estado abierto/cerrado
        openStatus: config.openStatus,
      },
    });
  } catch (error) {
    console.error("Personalization GET error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Guardar configuración de tema y personalización
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      websiteId,
      theme,
      config,
    } = body as {
      websiteId: string;
      theme?: Theme;
      config?: Partial<WebsiteConfig>;
    };

    if (!websiteId) {
      return NextResponse.json(
        { error: "websiteId es requerido" },
        { status: 400 }
      );
    }

    // Validate theme value
    if (theme && !VALID_THEMES.includes(theme)) {
      return NextResponse.json({ error: "Tema no valido" }, { status: 400 });
    }

    // Verify user owns this website
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const { data: website } = await supabase
      .from("websites")
      .select("id, client_id, config")
      .eq("id", websiteId)
      .single();

    if (!website || website.client_id !== client.id) {
      return NextResponse.json(
        { error: "No autorizado para modificar este website" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: {
      theme?: Theme;
      config?: WebsiteConfig;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (theme) {
      updateData.theme = theme;
    }

    if (config) {
      const existingConfig = (website.config as WebsiteConfig) || {};

      // Merge deep para colores
      const mergedColors: ColorsConfig = {
        ...existingConfig.colors,
        ...config.colors,
      };

      // Merge deep para branding
      const mergedBranding: BrandingConfig = {
        ...existingConfig.branding,
        ...config.branding,
      };

      // Merge deep para tipografía
      const mergedTypography: TypographyConfig = {
        ...existingConfig.typography,
        ...config.typography,
      };

      // Merge deep para efectos
      const mergedEffects: EffectsConfig = {
        ...existingConfig.effects,
        ...config.effects,
      };

      // Merge deep para variantes (solo si hay variantes)
      const hasVariants = existingConfig.variants || config.variants;
      const mergedVariants = hasVariants
        ? { ...existingConfig.variants, ...config.variants } as WebsiteConfig["variants"]
        : undefined;

      // Merge deep para socialLinks
      const mergedSocialLinks = (existingConfig.socialLinks || config.socialLinks)
        ? { ...existingConfig.socialLinks, ...config.socialLinks }
        : undefined;

      updateData.config = {
        ...existingConfig,
        ...config,
        colors: Object.keys(mergedColors).length > 0 ? mergedColors : undefined,
        branding: Object.keys(mergedBranding).length > 0 ? mergedBranding : undefined,
        typography: Object.keys(mergedTypography).length > 0 ? mergedTypography : undefined,
        effects: Object.keys(mergedEffects).length > 0 ? mergedEffects : undefined,
        variants: mergedVariants,
        socialLinks: mergedSocialLinks,
        // Mantener compatibilidad con campos legacy
        primaryColor: config.colors?.primary || config.primaryColor || existingConfig.primaryColor,
        secondaryColor: config.colors?.secondary || config.secondaryColor || existingConfig.secondaryColor,
        logo: config.branding?.logo || config.logo || existingConfig.logo,
      };
    }

    // Update website
    const { error: updateError } = await supabase
      .from("websites")
      .update(updateData)
      .eq("id", websiteId);

    if (updateError) {
      console.error("Error updating website:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar la configuracion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Personalization POST error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
