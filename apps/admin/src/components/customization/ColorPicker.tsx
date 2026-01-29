"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

// Colores predefinidos para selección rápida
const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#1e293b", // Slate dark
];

// Validar formato de color hex
const isValidHex = (color: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(color);

// Validar formato parcial (mientras escribe)
const isPartialHex = (color: string): boolean => /^#[0-9A-Fa-f]{0,6}$/.test(color);

export function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determinar si el input es válido o inválido
  const inputStatus = useMemo(() => {
    if (isValidHex(inputValue)) return "valid";
    if (isPartialHex(inputValue)) return "partial";
    return "invalid";
  }, [inputValue]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Auto-añadir # si no empieza con él
    if (newValue && !newValue.startsWith("#")) {
      newValue = "#" + newValue;
    }

    // Convertir a mayúsculas para consistencia
    newValue = newValue.toUpperCase();

    setInputValue(newValue);

    // Solo aplicar si es un hex válido
    if (isValidHex(newValue)) {
      onChange(newValue.toLowerCase());
    }
  }, [onChange]);

  const handleInputBlur = useCallback(() => {
    // Si el valor no es válido al perder foco, restaurar al último válido
    if (!isValidHex(inputValue)) {
      setInputValue(value);
    }
  }, [inputValue, value]);

  const handlePresetClick = useCallback((color: string) => {
    setInputValue(color);
    onChange(color);
    setIsOpen(false);
  }, [onChange]);

  const handleNativeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // Estilos del input según estado
  const inputClassName = useMemo(() => {
    const base = "neumor-input w-full pr-10 font-mono text-sm";
    if (inputStatus === "invalid") {
      return `${base} border-red-400 focus:border-red-500`;
    }
    if (inputStatus === "valid") {
      return base;
    }
    return base; // partial
  }, [inputStatus]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium mb-2">{label}</label>
      {description && (
        <p className="text-xs text-[var(--text-secondary)] mb-2">{description}</p>
      )}

      <div className="flex gap-2">
        {/* Color preview button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-xl border-2 border-[var(--shadow-dark)] transition-all hover:scale-105 flex-shrink-0"
          style={{ backgroundColor: value }}
          title="Seleccionar color"
        />

        {/* Hex input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="#6366F1"
            className={inputClassName}
            maxLength={7}
          />
          {/* Indicador de estado */}
          {inputStatus === "invalid" && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">
              !
            </span>
          )}
          {/* Native color picker */}
          <input
            type="color"
            value={value}
            onChange={handleNativeChange}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 cursor-pointer opacity-0 hover:opacity-100"
            title="Selector de color nativo"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-[var(--shadow-dark)] pointer-events-none"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>

      {/* Error message */}
      {inputStatus === "invalid" && (
        <p className="text-xs text-red-500 mt-1">
          Formato invalido. Usa #RRGGBB (ej: #6366F1)
        </p>
      )}

      {/* Preset colors dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 neumor-card bg-[var(--neumor-bg)] rounded-xl shadow-lg w-full">
          <p className="text-xs text-[var(--text-secondary)] mb-2">Colores predefinidos</p>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                  value === color ? "ring-2 ring-[var(--accent)] ring-offset-2" : ""
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
