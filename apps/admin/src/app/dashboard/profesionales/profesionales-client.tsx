"use client";

import { useState } from "react";

interface Professional {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
}

interface ServiceCategory {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

interface ProfessionalCategory {
  professional_id: string;
  category_id: string;
}

interface Props {
  initialProfessionals: Professional[];
  categories: ServiceCategory[];
  professionalCategories: ProfessionalCategory[];
}

// Toggle switch visual (mismo comportamiento que checkbox)
function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <span className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="block w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-[var(--accent)] peer-disabled:opacity-50 transition-colors" />
        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </label>
  );
}

// Avatar placeholder con inicial
function AvatarPlaceholder({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0">
      <span className="text-xl font-bold">{initial}</span>
    </div>
  );
}

// Chip de categoría seleccionable
function CategoryChip({
  name,
  selected,
  onChange,
}: {
  name: string;
  selected: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!selected)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
        selected
          ? "neumor-inset border-2 border-[var(--accent)] bg-[var(--accent)]/5"
          : "neumor-btn opacity-80 hover:opacity-100"
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          selected
            ? "border-[var(--accent)] bg-[var(--accent)]"
            : "border-gray-300"
        }`}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      <span className="text-sm font-medium">{name}</span>
    </button>
  );
}

export default function ProfesionalesClient({
  initialProfessionals,
  categories,
  professionalCategories,
}: Props) {
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);
  const [newProfessionalName, setNewProfessionalName] = useState("");
  const [newProfessionalDescription, setNewProfessionalDescription] = useState("");
  const [savingProfessionals, setSavingProfessionals] = useState(false);
  const [professionalsMessage, setProfessionalsMessage] = useState<string | null>(null);
  const [categoryAssignments, setCategoryAssignments] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    professionalCategories.forEach((item) => {
      if (!map[item.professional_id]) {
        map[item.professional_id] = [];
      }
      map[item.professional_id].push(item.category_id);
    });
    return map;
  });

  const runProfessionalsAction = async (
    payload: {
    action: "create" | "update" | "delete";
    professional: { id?: string; name: string; description?: string; is_active?: boolean; sort_order?: number };
    },
    successMessage?: string
  ) => {
    setSavingProfessionals(true);
    setProfessionalsMessage(null);

    try {
      const response = await fetch("/api/profesionales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar");
      }

      setProfessionals(data.professionals || []);
      if (data.professionalCategories) {
        const nextMap: Record<string, string[]> = {};
        (data.professionalCategories as ProfessionalCategory[]).forEach((item) => {
          if (!nextMap[item.professional_id]) {
            nextMap[item.professional_id] = [];
          }
          nextMap[item.professional_id].push(item.category_id);
        });
        setCategoryAssignments(nextMap);
      }
      if (successMessage) {
        setProfessionalsMessage(successMessage);
      }
    } catch (error) {
      setProfessionalsMessage(
        error instanceof Error ? error.message : "No se pudo guardar"
      );
    } finally {
      setSavingProfessionals(false);
    }
  };

  const handleCreateProfessional = async () => {
    const name = newProfessionalName.trim();
    if (!name) return;
    await runProfessionalsAction({
      action: "create",
      professional: { name, description: newProfessionalDescription.trim() || undefined },
    });
    setNewProfessionalName("");
    setNewProfessionalDescription("");
  };

  const handleUpdateProfessional = async (
    professional: Professional,
    updates: Partial<Professional> & { category_ids?: string[] }
  ) => {
    await runProfessionalsAction({
      action: "update",
      professional: {
        id: professional.id,
        name: updates.name ?? professional.name,
        description: updates.description ?? professional.description ?? undefined,
        is_active: updates.is_active ?? professional.is_active,
        sort_order: updates.sort_order ?? professional.sort_order,
        ...(updates.category_ids ? { category_ids: updates.category_ids } : {}),
      },
    }, updates.category_ids ? "Categorias guardadas." : "Profesional actualizado.");
  };

  const handleDeleteProfessional = async (professional: Professional) => {
    const confirmed = window.confirm("Eliminar este profesional?");
    if (!confirmed) return;
    await runProfessionalsAction({
      action: "delete",
      professional: { id: professional.id, name: professional.name },
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">Equipo</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestiona los miembros de tu equipo.
        </p>
      </div>

      {/* Mensaje de feedback global */}
      {professionalsMessage && (
        <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
          {professionalsMessage}
        </div>
      )}

      {/* Formulario nuevo profesional - ARRIBA */}
      <div className="neumor-card p-5 md:p-6 mb-8 border-2 border-dashed border-[var(--shadow-dark)]/20">
        <h2 className="text-lg font-semibold mb-1">Agregar profesional</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-5">
          Anade un nuevo miembro al equipo.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Nombre del profesional
            </label>
            <input
              className="neumor-input w-full h-12 text-base"
              placeholder="Ej: Maria Garcia"
              value={newProfessionalName}
              onChange={(event) => setNewProfessionalName(event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Descripcion (opcional)
            </label>
            <textarea
              className="neumor-input w-full min-h-[96px] text-base resize-vertical"
              placeholder="Ej: Especialista en color y cortes creativos"
              value={newProfessionalDescription}
              onChange={(event) => setNewProfessionalDescription(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="neumor-btn neumor-btn-accent w-full h-12 text-base font-medium"
            onClick={handleCreateProfessional}
            disabled={savingProfessionals || !newProfessionalName.trim()}
          >
            Agregar al equipo
          </button>
        </div>
      </div>

      {/* Lista de profesionales */}
      <div className="space-y-6">
        {professionals.length === 0 && (
          <div className="neumor-card p-8 text-center text-[var(--text-secondary)]">
            <p className="text-base">No hay profesionales en el equipo.</p>
            <p className="text-sm mt-1">Agrega el primero arriba.</p>
          </div>
        )}

        {professionals.map((professional) => {
          const assignedCategories = categoryAssignments[professional.id] || [];

          return (
            <div key={professional.id} className="neumor-card p-5 md:p-6">
              {/* Header del profesional */}
              <div className="flex items-center gap-4 mb-6">
                <AvatarPlaceholder name={professional.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold truncate">{professional.name}</h3>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        professional.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          professional.is_active ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {professional.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seccion: Informacion */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                  Informacion
                </h4>

                <div className="space-y-4">
                  {/* Nombre editable */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                      Nombre
                    </label>
                    <input
                      className="neumor-input w-full h-12 text-base"
                      value={professional.name}
                      onChange={(event) =>
                        setProfessionals((prev) =>
                          prev.map((item) =>
                            item.id === professional.id
                              ? { ...item, name: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                      Descripcion
                    </label>
                    <textarea
                      className="neumor-input w-full min-h-[96px] text-base resize-vertical"
                      value={professional.description || ""}
                      onChange={(event) =>
                        setProfessionals((prev) =>
                          prev.map((item) =>
                            item.id === professional.id
                              ? { ...item, description: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                  </div>

                  {/* Toggle activo */}
                  <div className="flex items-center justify-between">
                    <ToggleSwitch
                      checked={professional.is_active}
                      onChange={(checked) =>
                        handleUpdateProfessional(professional, {
                          is_active: checked,
                        })
                      }
                      label="Activo"
                      disabled={savingProfessionals}
                    />
                  </div>

                  {/* Boton guardar info */}
                  <button
                    type="button"
                    className="neumor-btn neumor-btn-accent w-full h-12 text-base font-medium"
                    onClick={() =>
                      handleUpdateProfessional(professional, {
                        name: professional.name,
                        description: professional.description || "",
                      })
                    }
                    disabled={savingProfessionals}
                  >
                    Guardar informacion
                  </button>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-[var(--shadow-light)] my-6" />

              {/* Seccion: Categorias */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                  Categorias asignadas
                </h4>

                {categories.length === 0 ? (
                  <div className="text-sm text-[var(--text-secondary)] text-center py-6 neumor-inset rounded-xl">
                    No hay categorias creadas.
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {categories.map((category) => {
                      const selected = assignedCategories.includes(category.id);
                      return (
                        <CategoryChip
                          key={category.id}
                          name={category.name}
                          selected={selected}
                          onChange={(newSelected) => {
                            setCategoryAssignments((prev) => {
                              const current = new Set(prev[professional.id] || []);
                              if (newSelected) {
                                current.add(category.id);
                              } else {
                                current.delete(category.id);
                              }
                              return {
                                ...prev,
                                [professional.id]: Array.from(current),
                              };
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {categories.length > 0 && (
                  <button
                    type="button"
                    className="neumor-btn neumor-btn-accent w-full h-12 text-base font-medium"
                    onClick={() =>
                      handleUpdateProfessional(professional, {
                        category_ids: assignedCategories,
                      })
                    }
                    disabled={savingProfessionals}
                  >
                    Guardar categorias
                  </button>
                )}
              </div>

              {/* Separador antes de eliminar */}
              <div className="border-t border-[var(--shadow-light)] mt-8 pt-6">
                <button
                  type="button"
                  onClick={() => handleDeleteProfessional(professional)}
                  disabled={savingProfessionals}
                  className="w-full h-10 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Eliminar profesional
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
