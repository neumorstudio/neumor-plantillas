import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const systemPrompt = `Eres un experto diseñador de emails HTML para campañas de marketing.
Tu trabajo es crear plantillas de email profesionales, responsive y atractivas CON CONTENIDO REAL Y ESPECÍFICO.

REGLAS DE DISEÑO:
1. Usa SOLO HTML y CSS inline (style="...")
2. Usa tablas para el layout (compatibilidad con clientes de email)
3. El ancho máximo debe ser 600px
4. Usa fuentes seguras: Arial, Helvetica, sans-serif

ESTRUCTURA DEL EMAIL:
1. Header atractivo con {{restaurantName}} y diseño temático
2. Imagen o banner decorativo (usa un div con color de fondo y texto si no hay imagen)
3. Título llamativo relacionado con la campaña (ESCRIBE EL TEXTO REAL, no uses variables)
4. Párrafos de contenido persuasivo y específico para la campaña (ESCRIBE EL TEXTO REAL)
5. Botón CTA con texto específico (ej: "Reservar Mesa", "Ver Menú", "Obtener Descuento")
6. Footer con {{address}} y enlace {{unsubscribeLink}}

VARIABLES A USAR (solo estas):
- {{restaurantName}} - para el nombre del negocio en el header
- {{address}} - para la dirección en el footer
- {{unsubscribeLink}} - para el enlace de darse de baja
- {{ctaLink}} - para el enlace del botón principal

IMPORTANTE:
- NO uses {{title}} ni {{content}} - escribe el contenido REAL y específico para la campaña
- Genera textos creativos, emocionales y persuasivos acordes a la temática
- Incluye emojis cuando sea apropiado para la campaña
- Usa colores que combinen con la temática (ej: rojos/rosas para San Valentín, naranjas para otoño, etc.)

Responde SOLO con el código HTML completo, sin explicaciones ni bloques de código markdown.`;

interface GenerateRequest {
  prompt: string;
  websiteId: string;
}

// Mapeo de tipos de negocio a descripciones
const businessTypeDescriptions: Record<string, string> = {
  restaurant: "restaurante, establecimiento gastronómico que sirve comidas y bebidas",
  clinic: "clínica médica o de salud, centro sanitario",
  salon: "salón de belleza, peluquería o centro de estética",
  shop: "tienda o comercio minorista",
  fitness: "gimnasio, centro deportivo o de fitness",
  realestate: "agencia inmobiliaria, bienes raíces",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const { prompt, websiteId } = body;

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Describe qué tipo de email quieres (mínimo 10 caracteres)" },
        { status: 400 }
      );
    }

    // Obtener datos del cliente y website
    const { data: client } = await supabase
      .from("clients")
      .select(`
        id,
        email,
        business_name,
        business_type,
        phone,
        websites!inner (
          id,
          domain,
          config
        )
      `)
      .eq("auth_user_id", user.id)
      .eq("websites.id", websiteId)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "API de IA no configurada" },
        { status: 500 }
      );
    }

    // Extraer datos del cliente para el contexto
    const businessName = client.business_name;
    const businessType = client.business_type;
    const businessTypeDesc = businessTypeDescriptions[businessType] || businessType;
    const phone = client.phone || "";
    const email = client.email || "";
    const domain = (client.websites as { domain?: string }[])?.[0]?.domain || "";
    const config = (client.websites as { config?: Record<string, string> }[])?.[0]?.config || {};
    const address = config.address || "";

    // Construir el prompt del usuario con todo el contexto
    const userPrompt = `Crea un email HTML completo para la siguiente campaña:

CAMPAÑA SOLICITADA: ${prompt}

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${businessName}
- Tipo: ${businessTypeDesc}
- Teléfono: ${phone || "No especificado"}
- Email: ${email}
- Web: ${domain || "No especificada"}
- Dirección: ${address || "No especificada"}

INSTRUCCIONES:
1. Usa el nombre "${businessName}" en el header del email
2. Adapta el tono y estilo al tipo de negocio (${businessTypeDesc})
3. Genera contenido REAL, creativo y persuasivo específico para esta campaña
4. Incluye un CTA (botón) relevante para la campaña
5. El diseño debe ser profesional y acorde al tipo de negocio
6. NO uses variables como {{title}} o {{content}}, escribe el texto real
7. Solo usa estas variables: {{restaurantName}} para el nombre, {{address}} para dirección, {{ctaLink}} para el botón, {{unsubscribeLink}} para darse de baja`;

    // Llamar a Groq API
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Error al generar la plantilla" },
        { status: 500 }
      );
    }

    const data = await response.json();
    let htmlContent = data.choices?.[0]?.message?.content || "";

    // Limpiar el HTML si viene con bloques de código markdown
    htmlContent = htmlContent
      .replace(/^```html?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    // Validar que sea HTML válido (básico)
    if (!htmlContent.includes("<html") && !htmlContent.includes("<body") && !htmlContent.includes("<table")) {
      return NextResponse.json(
        { error: "La IA no generó un HTML válido. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // Sugerir asunto y nombre basado en el prompt
    const suggestedSubject = await generateSubject(groqApiKey, prompt);

    return NextResponse.json({
      html: htmlContent,
      suggestedSubject,
      suggestedName: `Plantilla - ${prompt.slice(0, 30)}`,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

async function generateSubject(apiKey: string, prompt: string): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Genera un asunto de email atractivo y corto (máximo 60 caracteres) para la siguiente campaña. Responde SOLO con el asunto, sin comillas ni explicaciones.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "Tu próxima experiencia te espera";
    }
  } catch {
    // Si falla, devolver un asunto por defecto
  }
  return "Tu próxima experiencia te espera";
}
