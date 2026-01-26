"use client";

import { useState } from "react";

interface Professional {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  initialProfessionals: Professional[];
}

export default function ProfesionalesClient({ initialProfessionals }: Props) {
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);
  const [newProfessionalName, setNewProfessionalName] = useState("");
  const [savingProfessionals, setSavingProfessionals] = useState(false);
  const [professionalsMessage, setProfessionalsMessage] = useState<string | null>(null);

  const runProfessionalsAction = async (payload: {
    action: "create" | "update" | "delete";
    professional: { id?: string; name: string; is_active?: boolean; sort_order?: number };
  }) => {
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
    await runProfessionalsAction({ action: "create", professional: { name } });
    setNewProfessionalName("");
  };

  const handleUpdateProfessional = async (
    professional: Professional,
    updates: Partial<Professional>
  ) => {
    await runProfessionalsAction({
      action: "update",
      professional: {
        id: professional.id,
        name: updates.name ?? professional.name,
        is_active: updates.is_active ?? professional.is_active,
        sort_order: updates.sort_order ?? professional.sort_order,
      },
    });
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Profesionales</h1>
        <p className="text-[var(--text-secondary)]">
          Agrega, edita o elimina profesionales del salon.
        </p>
      </div>

      <div className="neumor-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Equipo</h3>
          <span className="text-xs text-[var(--text-secondary)]">
            Gestiona el personal disponible
          </span>
        </div>

        {professionalsMessage && (
          <div className="mb-3 p-2 rounded-lg bg-[var(--shadow-light)] text-xs">
            {professionalsMessage}
          </div>
        )}

        <div className="space-y-3">
          {professionals.length ? (
            professionals.map((professional) => (
              <div
                key={professional.id}
                className="neumor-card-sm p-3 flex flex-wrap items-center gap-3"
              >
                <input
                  className="neumor-input flex-1 min-w-[180px]"
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
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={professional.is_active}
                    onChange={(event) =>
                      handleUpdateProfessional(professional, {
                        is_active: event.target.checked,
                      })
                    }
                  />
                  Activo
                </label>
                <button
                  type="button"
                  className="neumor-btn text-xs px-3 py-1"
                  onClick={() =>
                    handleUpdateProfessional(professional, { name: professional.name })
                  }
                  disabled={savingProfessionals}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="neumor-btn text-xs px-3 py-1"
                  onClick={() => handleDeleteProfessional(professional)}
                  disabled={savingProfessionals}
                >
                  Eliminar
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No hay profesionales creados.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            className="neumor-input flex-1"
            placeholder="Nombre del profesional"
            value={newProfessionalName}
            onChange={(event) => setNewProfessionalName(event.target.value)}
          />
          <button
            type="button"
            className="neumor-btn neumor-btn-accent"
            onClick={handleCreateProfessional}
            disabled={savingProfessionals || !newProfessionalName.trim()}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
