/**
 * Tab de Diseño para personalizacion.
 * Componente presentacional extraido de personalizacion-client.tsx.
 */

import type { Theme, ColorsConfig, EffectsConfig, BrandingConfig } from "@neumorstudio/supabase";
import { ColorPicker, SliderControl, OptionSelector } from "@/components/customization";
import { CollapsibleSection } from "@/components/ui";
import { getThemeIcon } from "@/components/icons";
import {
  themeCategories,
  themes,
  templatePresets,
  skinOptions,
} from "@/lib/personalizacion";
import type { TemplatePreset } from "@/lib/personalizacion";
import { defaultColors } from "../../constants";

interface DesignTabProps {
  theme: Theme;
  skin: string;
  activePreset: string | null;
  colors: ColorsConfig;
  effects: EffectsConfig;
  branding: BrandingConfig;
  uploading: boolean;
  isMobile: boolean;
  onApplyPreset: (preset: TemplatePreset) => void;
  onSetActivePreset: (preset: string | null) => void;
  onSetTheme: (theme: Theme) => void;
  onSkinChange: (value: string) => void;
  onColorChange: (key: keyof ColorsConfig, value: string) => void;
  onEffectsChange: (key: keyof EffectsConfig, value: number | string | boolean) => void;
  onBrandingChange: (key: keyof BrandingConfig, value: string) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DesignTab({
  theme,
  skin,
  activePreset,
  colors,
  effects,
  branding,
  uploading,
  isMobile,
  onApplyPreset,
  onSetActivePreset,
  onSetTheme,
  onSkinChange,
  onColorChange,
  onEffectsChange,
  onBrandingChange,
  onLogoUpload,
}: DesignTabProps) {
  return (
    <div className="space-y-6">
      {/* Plantillas Prediseñadas - Lo primero y más visible */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Plantillas Prediseñadas</h3>
          {activePreset && (
            <button
              onClick={() => onSetActivePreset(null)}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Personalizar manualmente
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Elige una plantilla completa o personaliza cada detalle abajo.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {templatePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`relative p-3 rounded-xl text-left transition-all overflow-hidden ${
                activePreset === preset.id
                  ? "ring-2 ring-[var(--accent)] shadow-lg scale-[1.02]"
                  : "hover:shadow-md hover:scale-[1.01] border border-[var(--shadow-dark)]"
              }`}
              style={{ background: preset.preview }}
            >
              <div className="relative z-10">
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {preset.name}
                </span>
                <p className="text-[9px] text-white/80 drop-shadow-sm mt-0.5">
                  {preset.description}
                </p>
              </div>
              {activePreset === preset.id && (
                <div className="absolute top-2 right-2 bg-[var(--accent)] text-white rounded-full p-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Separador visual */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--shadow-dark)]"></div>
        <span className="text-xs text-[var(--text-secondary)]">o personaliza</span>
        <div className="flex-1 h-px bg-[var(--shadow-dark)]"></div>
      </div>

      {/* Tema - Organizado por categorías */}
      <CollapsibleSection title="Tema de Colores" defaultOpen={!activePreset}>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          {themes.length} temas disponibles
        </p>
        {themeCategories.map((category) => (
          <div key={category.label} className="space-y-2">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              {category.label}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {category.themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { onSetTheme(t.value); onSetActivePreset(null); }}
                  className={`relative p-2 rounded-lg text-left transition-all ${
                    theme === t.value
                      ? "ring-2 ring-[var(--accent)] shadow-lg scale-[1.02]"
                      : "hover:shadow-md hover:scale-[1.01]"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ color: t.colors[2] }} className="w-4 h-4">
                      {getThemeIcon(t.icon)}
                    </span>
                    <span className="text-[10px] font-medium truncate" style={{ color: t.colors[2] }}>
                      {t.label}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {t.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-white/30"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {theme === t.value && (
                    <div className="absolute top-1 right-1 text-[var(--accent)]">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </CollapsibleSection>

      {/* Skin - Estilo visual de componentes */}
      <CollapsibleSection title="Estilo de Componentes" defaultOpen={false}>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Cambia el aspecto visual de botones, tarjetas y controles.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {skinOptions.map((s) => (
            <button
              key={s.value}
              onClick={() => onSkinChange(s.value)}
              className={`relative p-3 rounded-lg text-left transition-all ${
                skin === s.value
                  ? "ring-2 ring-[var(--accent)] shadow-lg scale-[1.02] bg-[var(--shadow-light)]"
                  : "hover:shadow-md hover:scale-[1.01] border border-[var(--shadow-dark)]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-md bg-[var(--neumor-bg)] border border-[var(--shadow-dark)]"
                  style={{ boxShadow: s.preview }}
                />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <p className="text-[9px] text-[var(--text-secondary)] line-clamp-2">
                {s.description}
              </p>
              {skin === s.value && (
                <div className="absolute top-1 right-1 text-[var(--accent)]">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Logo */}
      <CollapsibleSection title="Logo" defaultOpen={!isMobile}>
        <div>
          <label className="block text-sm font-medium mb-2">Subir Logo</label>
          <label className={`flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[var(--shadow-dark)] rounded-xl cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--shadow-light)] transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={onLogoUpload}
              className="hidden"
              disabled={uploading}
            />
            <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-[var(--text-secondary)]">
              {uploading ? "Subiendo..." : "Toca para subir"}
            </span>
          </label>
        </div>
        {branding.logo && (
          <div className="space-y-2">
            <div className="p-3 neumor-inset rounded-lg flex items-center justify-center">
              <img
                src={branding.logo}
                alt="Logo preview"
                className="max-h-16 max-w-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <button
              type="button"
              onClick={() => onBrandingChange("logo", "")}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Eliminar logo
            </button>
          </div>
        )}
        <OptionSelector
          label="Tamano"
          value={branding.logoSize || "md"}
          onChange={(v) => onBrandingChange("logoSize", v)}
          options={[
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
          ]}
          columns={3}
        />
        <OptionSelector
          label="Mostrar"
          value={branding.logoDisplay || "name"}
          onChange={(v) => onBrandingChange("logoDisplay", v)}
          options={[
            { value: "name", label: "Nombre" },
            { value: "logo", label: "Logo" },
          ]}
          columns={2}
        />
      </CollapsibleSection>

      {/* Colores */}
      <CollapsibleSection title="Colores" defaultOpen={false}>
        {/* Color de Acento - El más importante */}
        <div className="space-y-3">
          <ColorPicker
            label="Color de Botones"
            description="Botones de reservar, enlaces y elementos interactivos"
            value={colors.accent || defaultColors.accent!}
            onChange={(v) => onColorChange("accent", v)}
          />
          {/* Preview del botón */}
          <div className="flex items-center gap-2 p-3 neumor-inset rounded-lg">
            <span className="text-xs text-[var(--text-secondary)]">Vista previa:</span>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: colors.accent || defaultColors.accent }}
            >
              Reservar Cita
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-[var(--shadow-dark)] my-4" />

        {/* Colores de marca */}
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-secondary)]">
            Colores de marca para titulos y textos:
          </p>
          <ColorPicker
            label="Titulos"
            description="Color para titulos de secciones (h2)"
            value={colors.primary || defaultColors.primary!}
            onChange={(v) => onColorChange("primary", v)}
          />
          <ColorPicker
            label="Secundario"
            description="Color secundario para subtitulos"
            value={colors.secondary || defaultColors.secondary!}
            onChange={(v) => onColorChange("secondary", v)}
          />
        </div>
      </CollapsibleSection>

      {/* Efectos */}
      <CollapsibleSection title="Efectos" defaultOpen={false}>
        {/* Skins sin sombras: flat, outline */}
        {(skin === "flat" || skin === "outline") ? (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <p className="font-medium">Sombras no disponibles</p>
            <p className="text-xs mt-1 opacity-80">
              El estilo &quot;{skin === "flat" ? "Plano" : "Contorno"}&quot; no usa sombras neumórficas.
              Selecciona otro estilo de componentes para ajustar las sombras.
            </p>
          </div>
        ) : (
          <SliderControl
            label="Sombras"
            description="Intensidad del efecto neumorfico"
            value={effects.shadowIntensity || 60}
            onChange={(v) => onEffectsChange("shadowIntensity", v)}
            min={0}
            max={100}
            step={5}
            unit="%"
          />
        )}
        <OptionSelector
          label="Bordes"
          value={effects.borderRadius || "rounded"}
          onChange={(v) => onEffectsChange("borderRadius", v)}
          options={[
            { value: "sharp", label: "Angular" },
            { value: "soft", label: "Suave" },
            { value: "rounded", label: "Redondo" },
            { value: "pill", label: "Pill" },
          ]}
          columns={isMobile ? 2 : 4}
        />
        {/* Glassmorphism disponible para temas neuglass o skin glass */}
        {(theme === "neuglass" || theme === "neuglass-dark" || skin === "glass") && (
          <>
            <div className="flex items-center justify-between p-3 neumor-inset rounded-lg">
              <div>
                <p className="font-medium text-sm">Glassmorphism</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {skin === "glass" ? "Ajusta el efecto cristal del skin" : "Efecto cristal"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEffectsChange("glassmorphism", !effects.glassmorphism)}
                className="neumor-toggle"
                data-active={effects.glassmorphism}
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>
            {effects.glassmorphism && (
              <SliderControl
                label="Blur"
                value={effects.blurIntensity || 16}
                onChange={(v) => onEffectsChange("blurIntensity", v)}
                min={8}
                max={32}
                step={2}
                unit="px"
              />
            )}
          </>
        )}
      </CollapsibleSection>
    </div>
  );
}
