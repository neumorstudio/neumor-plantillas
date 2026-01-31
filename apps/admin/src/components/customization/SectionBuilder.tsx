"use client";

import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  SectionConfig,
  SectionDefinition,
  BusinessType,
  SectionId,
} from "@neumorstudio/supabase";
import { SECTIONS_CATALOG, getDefaultSectionsConfig } from "@neumorstudio/supabase";

// ============================================
// ICONOS
// ============================================

function GripVerticalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}


function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

// ============================================
// SORTABLE SECTION ITEM
// ============================================

interface SortableSectionItemProps {
  section: SectionConfig;
  definition: SectionDefinition;
  onToggle: () => void;
  onVariantChange: (variant: string) => void;
}

function SortableSectionItem({
  section,
  definition,
  onToggle,
  onVariantChange,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: !!definition.fixedPosition });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const isFixed = definition.fixedPosition !== undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`neumor-card p-3 mb-2 transition-all ${
        !section.enabled ? "opacity-60" : ""
      } ${isFixed ? "bg-[var(--shadow-light)]/50" : ""} ${
        isDragging ? "shadow-lg scale-[1.02]" : ""
      }`}
    >
      {/* Fila 1: Drag + Nombre + Toggle */}
      <div className="flex items-center gap-2">
        {/* Drag Handle o Lock */}
        {!isFixed ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] touch-none flex-shrink-0"
            title="Arrastrar para reordenar"
          >
            <GripVerticalIcon className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-0.5 text-[var(--text-secondary)] flex-shrink-0" title="Posición fija">
            <LockIcon className="w-4 h-4" />
          </div>
        )}

        {/* Nombre completo */}
        <span className="flex-1 font-medium text-sm">{definition.label}</span>

        {/* Toggle o Badge Requerida */}
        {definition.required ? (
          <span className="text-[9px] px-2 py-1 rounded bg-[var(--accent)] text-white flex-shrink-0">
            Requerida
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
            style={{
              background: section.enabled
                ? 'var(--accent)'
                : 'var(--shadow-light)',
              boxShadow: section.enabled
                ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
                : 'inset 0 2px 4px var(--shadow-dark)',
            }}
            title={section.enabled ? "Desactivar sección" : "Activar sección"}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-md"
              style={{
                left: section.enabled ? '28px' : '4px',
              }}
            />
          </button>
        )}
      </div>

      {/* Fila 2: Variante (solo si está activa y tiene variantes) */}
      {section.enabled && definition.variants.length > 1 && (
        <div className="mt-2 ml-6">
          <select
            value={section.variant}
            onChange={(e) => onVariantChange(e.target.value)}
            className="neumor-input text-xs h-7 px-2 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {definition.variants.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ============================================
// SECTION BUILDER
// ============================================

interface SectionBuilderProps {
  businessType: BusinessType;
  sections: SectionConfig[];
  onChange: (sections: SectionConfig[]) => void;
}

export function SectionBuilder({
  businessType,
  sections,
  onChange,
}: SectionBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeDefinition = SECTIONS_CATALOG[active.id as SectionId];
      const overDefinition = SECTIONS_CATALOG[over.id as SectionId];

      // No mover secciones con posicion fija
      if (activeDefinition?.fixedPosition || overDefinition?.fixedPosition) return;

      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          order: index,
        })
      );

      onChange(newSections);
    },
    [sections, onChange]
  );

  const handleToggle = useCallback(
    (sectionId: SectionId) => {
      const definition = SECTIONS_CATALOG[sectionId];
      if (definition?.required) return; // No permitir desactivar secciones requeridas

      const newSections = sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      );
      onChange(newSections);
    },
    [sections, onChange]
  );

  const handleVariantChange = useCallback(
    (sectionId: SectionId, variant: string) => {
      const newSections = sections.map((s) =>
        s.id === sectionId ? { ...s, variant } : s
      );
      onChange(newSections);
    },
    [sections, onChange]
  );

  // Filtrar solo secciones que existen en el catalogo para este tipo de negocio
  const getDefinition = (sectionId: SectionId): SectionDefinition | undefined => {
    const def = SECTIONS_CATALOG[sectionId];
    if (!def || !def.businessTypes.includes(businessType)) return undefined;
    return def;
  };

  // Separar secciones habilitadas y deshabilitadas
  // Solo incluir secciones que tienen definición válida para el tipo de negocio
  const enabledSections = sections
    .filter((s) => s.enabled && getDefinition(s.id))
    .sort((a, b) => a.order - b.order);
  const disabledSections = sections.filter((s) => !s.enabled && getDefinition(s.id));

  // Verificar si hay secciones válidas
  const hasValidSections = enabledSections.length > 0 || disabledSections.length > 0;

  // Handler para regenerar secciones por defecto
  const handleRegenerateSections = useCallback(() => {
    const defaultConfig = getDefaultSectionsConfig(businessType);
    onChange(defaultConfig.sections);
  }, [businessType, onChange]);

  // Si no hay secciones válidas, mostrar mensaje para regenerar
  if (!hasValidSections) {
    return (
      <div className="space-y-4">
        <div className="neumor-card p-6 text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            No hay secciones configuradas para este tipo de negocio.
          </p>
          <button
            type="button"
            onClick={handleRegenerateSections}
            className="neumor-btn neumor-btn-accent px-4 py-2 flex items-center gap-2 mx-auto"
          >
            <RefreshIcon className="w-4 h-4" />
            Generar secciones por defecto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Secciones activas */}
      <div>
        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-[var(--text-primary)]">
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
          Secciones Activas ({enabledSections.length})
        </h4>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={enabledSections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {enabledSections.map((section) => {
              const definition = getDefinition(section.id);
              if (!definition) return null;
              return (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  definition={definition}
                  onToggle={() => handleToggle(section.id)}
                  onVariantChange={(v) => handleVariantChange(section.id, v)}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {/* Secciones disponibles (no activas) */}
      {disabledSections.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-[var(--text-secondary)]">
            <PlusCircleIcon className="w-4 h-4" />
            Disponibles ({disabledSections.length})
          </h4>
          <div className="space-y-2">
            {disabledSections.map((section) => {
              const definition = getDefinition(section.id);
              if (!definition) return null;
              return (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  definition={definition}
                  onToggle={() => handleToggle(section.id)}
                  onVariantChange={(v) => handleVariantChange(section.id, v)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje de ayuda y botón de regenerar */}
      <div className="pt-3 border-t border-[var(--shadow-dark)]/50">
        <p className="text-xs text-[var(--text-secondary)] text-center mb-2">
          Arrastra para reordenar las secciones
        </p>
        <button
          type="button"
          onClick={handleRegenerateSections}
          className="w-full text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] py-2 flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
          Restaurar por defecto
        </button>
      </div>
    </div>
  );
}
