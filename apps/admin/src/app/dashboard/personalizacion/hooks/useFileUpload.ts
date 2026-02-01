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
  uploadingGallery: boolean;
  uploadingBrands: boolean;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleHeroImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleGalleryImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleBrandsLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function useFileUpload({
  setBranding,
  setContent,
  setMessage,
}: UseFileUploadParams): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBrands, setUploadingBrands] = useState(false);
  const maxGalleryImages = 6;
  const maxBrandLogos = 10;

  const checkPwaLogoCompatibility = useCallback((file: File) => {
    return new Promise<boolean | null>((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        URL.revokeObjectURL(objectUrl);
        if (!width || !height) {
          resolve(null);
          return;
        }
        const ratioDiff = Math.abs(width - height) / Math.max(width, height);
        const isSquare = ratioDiff <= 0.1;
        const minSizeOk = Math.min(width, height) >= 192;
        resolve(isSquare && minSizeOk);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  }, []);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    const pwaCompatible = await checkPwaLogoCompatibility(file);

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
        setBranding(prev => ({
          ...prev,
          logo: data.url,
          pwaLogoCompatible: pwaCompatible ?? prev.pwaLogoCompatible,
        }));
        const warning =
          pwaCompatible === false
            ? " Aviso: el logo no es cuadrado o es menor a 192px. En PWA se usara el icono por defecto."
            : "";
        setMessage({ type: "success", text: `Logo subido correctamente.${warning}` });
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
  }, [setBranding, setMessage, checkPwaLogoCompatibility]);

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

  const handleGalleryImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setContent(prev => {
      if ((prev.galleryImages?.length || 0) >= maxGalleryImages) {
        setMessage({ type: "error", text: `Maximo ${maxGalleryImages} imagenes. Elimina una para subir otra.` });
        return prev;
      }
      return prev;
    });

    setUploadingGallery(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "gallery");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setContent(prev => {
          const currentImages = prev.galleryImages || [];
          if (currentImages.length >= maxGalleryImages) {
            return prev;
          }
          const newImages = [...currentImages, data.url];
          return {
            ...prev,
            galleryImages: newImages,
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
      setUploadingGallery(false);
      e.target.value = "";
    }
  }, [setContent, setMessage, maxGalleryImages]);

  const handleBrandsLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setContent(prev => {
      if ((prev.brandsLogos?.length || 0) >= maxBrandLogos) {
        setMessage({ type: "error", text: `Maximo ${maxBrandLogos} logos. Elimina uno para subir otro.` });
        return prev;
      }
      return prev;
    });

    setUploadingBrands(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "brands");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setContent(prev => {
          const currentLogos = prev.brandsLogos || [];
          if (currentLogos.length >= maxBrandLogos) {
            return prev;
          }
          const newLogos = [...currentLogos, data.url];
          return {
            ...prev,
            brandsLogos: newLogos,
          };
        });
        setMessage({ type: "success", text: "Logo subido correctamente" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Error al subir el logo" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion al subir el logo" });
    } finally {
      setUploadingBrands(false);
      e.target.value = "";
    }
  }, [setContent, setMessage, maxBrandLogos]);

  return {
    uploading,
    uploadingHero,
    uploadingGallery,
    uploadingBrands,
    handleLogoUpload,
    handleHeroImageUpload,
    handleGalleryImageUpload,
    handleBrandsLogoUpload,
  };
}
