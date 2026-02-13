"use client";

import { useState, useEffect } from "react";
import { RECOMMENDED_FONTS } from "@neumorstudio/supabase";

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
  description?: string;
}

export function FontSelector({ label, value, onChange, description }: FontSelectorProps) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set(['system']));

  // Preload font when selected
  useEffect(() => {
    if (value && value !== 'system' && !loaded.has(value)) {
      if (value === 'Brittany Signature') {
        const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: 'Brittany Signature';
            src: url('/fonts/BrittanySignature.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `;
        document.head.appendChild(style);
        setLoaded(prev => new Set([...prev, value]));
      } else {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(value)}:wght@400;600&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        setLoaded(prev => new Set([...prev, value]));
      }
    }
  }, [value, loaded]);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {description && (
        <p className="text-xs text-[var(--text-secondary)] mb-2">{description}</p>
      )}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="neumor-input w-full"
        style={{
          fontFamily: value !== 'system' ? `'${value}', system-ui, sans-serif` : 'system-ui, sans-serif'
        }}
      >
        {RECOMMENDED_FONTS.map((font) => (
          <option
            key={font.value}
            value={font.value}
            style={{
              fontFamily: font.value !== 'system' ? `'${font.value}', system-ui, sans-serif` : 'system-ui, sans-serif'
            }}
          >
            {font.label}
          </option>
        ))}
      </select>

      {/* Preview */}
      {value !== 'system' && (
        <div
          className="mt-3 p-3 neumor-inset rounded-lg"
          style={{
            fontFamily: `'${value}', system-ui, sans-serif`
          }}
        >
          <p className="text-lg font-semibold">Vista previa de {value}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            El veloz zorro marron salta sobre el perro perezoso.
          </p>
        </div>
      )}
    </div>
  );
}

export default FontSelector;
