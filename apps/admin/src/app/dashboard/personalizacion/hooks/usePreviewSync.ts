/**
 * Hook para sincronizar cambios de configuracion con el iframe de preview.
 * Extraido de personalizacion-client.tsx para mejor organizacion.
 */

import { useCallback, useRef, useEffect } from "react";
import type {
  Theme,
  ColorsConfig,
  TypographyConfig,
  EffectsConfig,
  BrandingConfig,
  SectionsConfig,
} from "@neumorstudio/supabase";
import { getFeatureIconSvg } from "@/lib/personalizacion";
import type { Variants, ContentConfig, FeaturesConfig } from "../types";

interface UsePreviewSyncParams {
  theme: Theme;
  skin: string;
  colors: ColorsConfig;
  typography: TypographyConfig;
  effects: EffectsConfig;
  branding: BrandingConfig;
  content: ContentConfig;
  features: FeaturesConfig;
  sectionsConfig: SectionsConfig;
  variants: Variants;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeMobileRef: React.RefObject<HTMLIFrameElement | null>;
}

interface UsePreviewSyncReturn {
  sendPreviewMessage: (type: string, payload: Record<string, unknown>) => void;
  handleIframeLoad: () => void;
}

export function usePreviewSync({
  theme,
  skin,
  colors,
  typography,
  effects,
  branding,
  content,
  features,
  sectionsConfig,
  variants,
  iframeRef,
  iframeMobileRef,
}: UsePreviewSyncParams): UsePreviewSyncReturn {
  // Ref para debounce del preview message
  const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Enviar mensaje postMessage a los iframes de preview
  const sendPreviewMessage = useCallback((type: string, payload: Record<string, unknown>) => {
    const message = { type, payload, source: "neumorstudio-admin" };
    const contentPayload = payload.content as { heroImage?: string } | undefined;
    const sectionsPayload = payload.sectionsConfig as { sections?: unknown[] } | undefined;
    console.log("[Admin] Sending postMessage:", type, "theme:", payload.theme, "heroImage:", contentPayload?.heroImage, "sections:", sectionsPayload?.sections?.length ?? 0);
    iframeRef.current?.contentWindow?.postMessage(message, "*");
    iframeMobileRef.current?.contentWindow?.postMessage(message, "*");
  }, [iframeRef, iframeMobileRef]);

  // Enviar cambios CSS en tiempo real via postMessage (con debounce para evitar flicker al aplicar presets)
  useEffect(() => {
    // === DEBUG: Log effects changes ===
    console.log('[usePreviewSync] Effects changed:', {
      shadowIntensity: effects.shadowIntensity,
      borderRadius: effects.borderRadius,
      glassmorphism: effects.glassmorphism,
      blurIntensity: effects.blurIntensity,
    });

    // Limpiar timeout anterior
    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
    }

    // Debounce de 50ms para agrupar múltiples cambios de estado (ej: al aplicar un preset)
    previewDebounceRef.current = setTimeout(() => {
      console.log('[usePreviewSync] Sending postMessage with effects:', effects);
      sendPreviewMessage("update-styles", {
        theme,
        skin,
        colors: {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
        },
        typography: {
          headingFont: typography.headingFont,
          bodyFont: typography.bodyFont,
          baseFontSize: typography.baseFontSize,
        },
        effects: {
          shadowIntensity: effects.shadowIntensity,
          borderRadius: effects.borderRadius,
          glassmorphism: effects.glassmorphism,
          blurIntensity: effects.blurIntensity,
        },
        branding: {
          logo: branding.logo,
          logoSize: branding.logoSize,
          logoDisplay: branding.logoDisplay,
        },
        content: {
          businessName: content.businessName,
          heroTitle: content.heroTitle,
          heroSubtitle: content.heroSubtitle,
          heroImage: content.heroImage,
          heroCta: content.heroCta,
          galleryImages: content.galleryImages,
          servicesLabel: content.servicesLabel,
          servicesTitle: content.servicesTitle,
          servicesSubtitle: content.servicesSubtitle,
          brandsLogos: content.brandsLogos,
          address: content.address,
          phone: content.phone,
          email: content.email,
          socialLinks: content.socialLinks,
          schedule: content.schedule,
          reviewsTitle: content.reviewsTitle,
          reviewsSubtitle: content.reviewsSubtitle,
          teamTitle: content.teamTitle,
          teamSubtitle: content.teamSubtitle,
          galleryTitle: content.galleryTitle,
          gallerySubtitle: content.gallerySubtitle,
          brandsTitle: content.brandsTitle,
          brandsSubtitle: content.brandsSubtitle,
          faqTitle: content.faqTitle,
          faqSubtitle: content.faqSubtitle,
          plansTitle: content.plansTitle,
          plansSubtitle: content.plansSubtitle,
          contactTitle: content.contactTitle,
          contactSubtitle: content.contactSubtitle,
        },
        features: {
          title: features.title,
          subtitle: features.subtitle,
          items: features.items.map(item => ({
            ...item,
            iconSvg: getFeatureIconSvg(item.icon),
          })),
        },
        // Configuración de secciones para preview
        sectionsConfig: sectionsConfig,
        variants: variants,
      });
    }, 50);

    // Cleanup: limpiar timeout al desmontar o antes de re-ejecutar
    return () => {
      if (previewDebounceRef.current) {
        clearTimeout(previewDebounceRef.current);
      }
    };
  }, [theme, skin, colors, typography, effects, branding.logo, branding.logoSize, branding.logoDisplay, content, features, sectionsConfig, variants, sendPreviewMessage]);

  // Send initial state when iframe loads
  const handleIframeLoad = useCallback(() => {
    // Small delay to ensure iframe is ready to receive messages
    setTimeout(() => {
      sendPreviewMessage("update-styles", {
        theme,
        skin,
        colors: {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
        },
        typography: {
          headingFont: typography.headingFont,
          bodyFont: typography.bodyFont,
          baseFontSize: typography.baseFontSize,
        },
        effects: {
          shadowIntensity: effects.shadowIntensity,
          borderRadius: effects.borderRadius,
          glassmorphism: effects.glassmorphism,
          blurIntensity: effects.blurIntensity,
        },
        branding: {
          logo: branding.logo,
          logoSize: branding.logoSize,
          logoDisplay: branding.logoDisplay,
        },
        content: {
          businessName: content.businessName,
          heroTitle: content.heroTitle,
          heroSubtitle: content.heroSubtitle,
          heroImage: content.heroImage,
          heroCta: content.heroCta,
          galleryImages: content.galleryImages,
          servicesLabel: content.servicesLabel,
          servicesTitle: content.servicesTitle,
          servicesSubtitle: content.servicesSubtitle,
          brandsLogos: content.brandsLogos,
          address: content.address,
          phone: content.phone,
          email: content.email,
          socialLinks: content.socialLinks,
          schedule: content.schedule,
          reviewsTitle: content.reviewsTitle,
          reviewsSubtitle: content.reviewsSubtitle,
          teamTitle: content.teamTitle,
          teamSubtitle: content.teamSubtitle,
          galleryTitle: content.galleryTitle,
          gallerySubtitle: content.gallerySubtitle,
          brandsTitle: content.brandsTitle,
          brandsSubtitle: content.brandsSubtitle,
          faqTitle: content.faqTitle,
          faqSubtitle: content.faqSubtitle,
          plansTitle: content.plansTitle,
          plansSubtitle: content.plansSubtitle,
          contactTitle: content.contactTitle,
          contactSubtitle: content.contactSubtitle,
        },
        features: {
          title: features.title,
          subtitle: features.subtitle,
          items: features.items.map(item => ({
            ...item,
            iconSvg: getFeatureIconSvg(item.icon),
          })),
        },
        sectionsConfig: sectionsConfig,
        variants: variants,
      });
    }, 100);
  }, [theme, skin, colors, typography, effects, branding, content, features, sectionsConfig, variants, sendPreviewMessage]);

  return {
    sendPreviewMessage,
    handleIframeLoad,
  };
}
