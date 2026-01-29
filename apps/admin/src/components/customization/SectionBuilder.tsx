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
import { SECTIONS_CATALOG } from "@neumorstudio/supabase";

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
        !section.enabled ? "opacity-50" : ""
      } ${isFixed ? "bg-[var(--shadow-light)]" : ""} ${
        isDragging ? "shadow-lg scale-[1.02]" : ""
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Drag Handle */}
        {!isFixed ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] touch-none"
            title="Arrastrar para reordenar"
          >
            <GripVerticalIcon className="w-5 h-5" />
          </button>
        ) : (
          <div className="p-1 text-[var(--text-secondary)]" title="Posicion fija">
            <LockIcon className="w-5 h-5" />
          </div>
        )}

        {/* Icon */}
        <div
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-[var(--shadow-light)] text-[var(--accent)]"
          dangerouslySetInnerHTML={{ __html: definition.icon }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{definition.label}</span>
            {definition.required && (
              <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-white">
                Requerida
              </span>
            )}
          </div>
          <p className="hidden sm:block text-xs text-[var(--text-secondary)] truncate">
            {definition.description}
          </p>
        </div>

        {/* Variant selector */}
        {section.enabled && definition.variants.length > 1 && (
          <select
            value={section.variant}
            onChange={(e) => onVariantChange(e.target.value)}
            className="neumor-input text-xs h-8 w-20 sm:w-24"
            onClick={(e) => e.stopPropagation()}
          >
            {definition.variants.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        )}

        {/* Toggle */}
        {!definition.required && (
          <button
            type="button"
            onClick={onToggle}
            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              section.enabled ? "bg-[var(--accent)]" : "bg-[var(--shadow-dark)]"
            }`}
            title={section.enabled ? "Desactivar seccion" : "Activar seccion"}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${
                section.enabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        )}
      </div>
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

  // Separar secciones habilitadas y deshabilitadas
  const enabledSections = sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  const disabledSections = sections.filter((s) => !s.enabled);

  // Filtrar solo secciones que existen en el catalogo para este tipo de negocio
  const getDefinition = (sectionId: SectionId): SectionDefinition | undefined => {
    const def = SECTIONS_CATALOG[sectionId];
    if (!def || !def.businessTypes.includes(businessType)) return undefined;
    return def;
  };

  return (
    <div className="space-y-4">
      {/* Secciones activas */}
      <div>
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
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
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <PlusCircleIcon className="w-4 h-4 text-[var(--text-secondary)]" />
            Secciones Disponibles ({disabledSections.length})
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

      {/* Mensaje de ayuda */}
      <p className="text-xs text-[var(--text-secondary)] text-center pt-2 border-t border-[var(--shadow-dark)]">
        Arrastra las secciones para cambiar su orden en la web.
        <br />
        Las secciones marcadas con candado tienen posicion fija.
      </p>
    </div>
  );
}
