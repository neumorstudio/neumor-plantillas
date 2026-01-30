/**
 * Hook para manejar uploads de archivos (logo e imagenes hero).
 * Extraido de personalizacion-client.tsx para mejor organizacion.
 */

import { useState, useCallback } from "react";
import type { BrandingConfig } from "@neumorstudio/supabase";
import type { ContentConfig } from "../types";

interface UseFileUploadParams {
  setBranding: React.Dispatch<React.SetStateAction<BrandingConfig>>;
  setContent: React.Dispatch<React.SetStateAction<ContentConfig>>;
  setMessage: React.Dispatch<React.SetStateAction<{ type: "success" | "error"; text: string } | null>>;
}

interface UseFileUploadReturn {
  uploading: boolean;
  uploadingHero: boolean;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleHeroImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function useFileUpload({
  setBranding,
  setContent,
  setMessage,
}: UseFileUploadParams): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setBranding(prev => ({ ...prev, logo: data.url }));
        setMessage({ type: "success", text: "Logo subido correctamente" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Error al subir el logo" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion al subir el logo" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [setBranding, setMessage]);

  const handleHeroImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar límite de 3 imágenes
    setContent(prev => {
      if ((prev.heroImages?.length || 0) >= 3) {
        setMessage({ type: "error", text: "Maximo 3 imagenes. Elimina una para subir otra." });
        return prev;
      }
      return prev;
    });

    setUploadingHero(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "hero");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setContent(prev => {
          const currentImages = prev.heroImages || [];
          if (currentImages.length >= 3) {
            return prev; // Ya verificado arriba, pero por seguridad
          }
          const newImages = [...currentImages, data.url];
          return {
            ...prev,
            heroImage: data.url, // Seleccionar la nueva imagen
            heroImages: newImages,
          };
        });
        setMessage({ type: "success", text: "Imagen subida correctamente" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Error al subir la imagen" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion al subir la imagen" });
    } finally {
      setUploadingHero(false);
      e.target.value = "";
    }
  }, [setContent, setMessage]);

  return {
    uploading,
    uploadingHero,
    handleLogoUpload,
    handleHeroImageUpload,
  };
}
