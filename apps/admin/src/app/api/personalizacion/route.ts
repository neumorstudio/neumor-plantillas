import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Types for personalization config
interface WebsiteConfig {
  businessName?: string;
  businessType?: string;
  variants?: {
    hero: "classic" | "modern" | "bold" | "minimal";
    menu: "tabs" | "grid" | "list" | "carousel";
    features: "cards" | "icons" | "banner";
    reviews: "grid" | "carousel" | "minimal";
    footer: "full" | "minimal" | "centered";
  };
}

type Theme = "light" | "dark" | "colorful" | "rustic" | "elegant" | "neuglass" | "neuglass-dark";

// GET: Obtener configuracion actual del tema
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
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

    return NextResponse.json({
      websiteId: website.id,
      domain: website.domain,
      theme: website.theme as Theme,
      config: website.config as WebsiteConfig,
    });
  } catch (error) {
    console.error("Personalization GET error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Guardar configuracion de tema
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { websiteId, theme, config } = body as {
      websiteId: string;
      theme: Theme;
      config: WebsiteConfig;
    };

    // Validate required fields
    if (!websiteId) {
      return NextResponse.json(
        { error: "websiteId es requerido" },
        { status: 400 }
      );
    }

    // Validate theme value
    const validThemes: Theme[] = ["light", "dark", "colorful", "rustic", "elegant", "neuglass", "neuglass-dark"];
    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json(
        { error: "Tema no valido" },
        { status: 400 }
      );
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
      .select("id, client_id")
      .eq("id", websiteId)
      .single();

    if (!website || website.client_id !== client.id) {
      return NextResponse.json(
        { error: "No autorizado para modificar este website" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: { theme?: Theme; config?: WebsiteConfig; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (theme) {
      updateData.theme = theme;
    }

    if (config) {
      // Get existing config to merge with new values
      const { data: currentWebsite } = await supabase
        .from("websites")
        .select("config")
        .eq("id", websiteId)
        .single();

      const existingConfig = (currentWebsite?.config as WebsiteConfig) || {};
      updateData.config = {
        ...existingConfig,
        ...config,
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
