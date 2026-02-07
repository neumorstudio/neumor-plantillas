import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import type {
  WebsiteConfig,
  ColorsConfig,
  TypographyConfig,
  EffectsConfig,
  BrandingConfig,
  SectionsConfig,
  Theme,
} from "@neumorstudio/supabase";
import { VALID_THEMES } from "@/lib/personalizacion";

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
        heroImages: config.heroImages,
        heroCta: config.heroCta,

        // Textos secciones
        reviewsTitle: config.reviewsTitle,
        reviewsSubtitle: config.reviewsSubtitle,
        teamTitle: config.teamTitle,
        teamSubtitle: config.teamSubtitle,
        galleryTitle: config.galleryTitle,
        gallerySubtitle: config.gallerySubtitle,
        galleryImages: config.galleryImages,
        servicesLabel: config.servicesLabel,
        servicesTitle: config.servicesTitle,
        servicesSubtitle: config.servicesSubtitle,
        brandsTitle: config.brandsTitle,
        brandsSubtitle: config.brandsSubtitle,
        brandsLogos: config.brandsLogos,
        faqTitle: config.faqTitle,
        faqSubtitle: config.faqSubtitle,
        faqItems: config.faqItems,
        plansTitle: config.plansTitle,
        plansSubtitle: config.plansSubtitle,
        contactTitle: config.contactTitle,
        contactSubtitle: config.contactSubtitle,

        // Colores
        colors: config.colors,

        // Branding
        branding: config.branding,

        // Tipografía
        typography: config.typography,

        // Efectos
        effects: config.effects,

        // Skin visual
        skin: config.skin,

        // Redes sociales
        socialLinks: config.socialLinks,

        // Estado abierto/cerrado
        openStatus: config.openStatus,

        // Secciones configuradas
        sectionsConfig: config.sectionsConfig,

        // Features personalizados
        features: config.features,
      },
    });
  } catch {
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

    // Validate numeric ranges in config
    if (config?.effects) {
      const { shadowIntensity, blurIntensity } = config.effects;
      if (shadowIntensity !== undefined && (shadowIntensity < 0 || shadowIntensity > 100)) {
        return NextResponse.json(
          { error: "shadowIntensity debe estar entre 0 y 100" },
          { status: 400 }
        );
      }
      if (blurIntensity !== undefined && (blurIntensity < 8 || blurIntensity > 32)) {
        return NextResponse.json(
          { error: "blurIntensity debe estar entre 8 y 32" },
          { status: 400 }
        );
      }
    }

    if (config?.typography?.baseFontSize !== undefined) {
      const { baseFontSize } = config.typography;
      if (baseFontSize < 14 || baseFontSize > 20) {
        return NextResponse.json(
          { error: "baseFontSize debe estar entre 14 y 20" },
          { status: 400 }
        );
      }
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

      // Merge para sectionsConfig - usa la nueva si se proporciona, o mantiene la existente
      const mergedSectionsConfig: SectionsConfig | undefined = config.sectionsConfig
        ? config.sectionsConfig
        : existingConfig.sectionsConfig;

      updateData.config = {
        ...existingConfig,
        ...config,
        colors: Object.keys(mergedColors).length > 0 ? mergedColors : undefined,
        branding: Object.keys(mergedBranding).length > 0 ? mergedBranding : undefined,
        typography: Object.keys(mergedTypography).length > 0 ? mergedTypography : undefined,
        effects: Object.keys(mergedEffects).length > 0 ? mergedEffects : undefined,
        variants: mergedVariants,
        socialLinks: mergedSocialLinks,
        sectionsConfig: mergedSectionsConfig,
      };
    }

    // Update website
    const { error: updateError } = await supabase
      .from("websites")
      .update(updateData)
      .eq("id", websiteId);

    if (updateError) {
      return NextResponse.json(
        { error: "Error al actualizar la configuracion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
