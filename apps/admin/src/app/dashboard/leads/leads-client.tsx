"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "@/lib/actions";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  status: string;
  created_at: string;
}

type FilterStatus = "all" | "new" | "contacted" | "converted" | "lost";

export default function LeadsClient({
  initialLeads,
}: {
  initialLeads: Lead[];
}) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredLeads = initialLeads.filter((lead) => {
    const matchesFilter = filter === "all" || lead.status === filter;
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone?.includes(searchTerm) ?? false) ||
      (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, newStatus as "new" | "contacted" | "converted" | "lost");
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <span className="badge badge-new">Nuevo</span>;
      case "contacted":
        return <span className="badge badge-contacted">Contactado</span>;
      case "converted":
        return <span className="badge badge-converted">Convertido</span>;
      case "lost":
        return <span className="badge badge-cancelled">Perdido</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "website":
        return "Web";
      case "instagram":
        return "Instagram";
      case "google":
        return "Google";
      case "facebook":
        return "Facebook";
      default:
        return source || "Otro";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const newCount = initialLeads.filter((l) => l.status === "new").length;
  const contactedCount = initialLeads.filter((l) => l.status === "contacted").length;
  const convertedCount = initialLeads.filter((l) => l.status === "converted").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Leads</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona los contactos y consultas de potenciales clientes
        </p>
      </div>

      {/* Error message */}
      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="neumor-card-sm p-4 text-center">
          <div className="text-2xl font-bold">{newCount}</div>
          <div className="text-sm text-[var(--text-secondary)]">Nuevos</div>
        </div>
        <div className="neumor-card-sm p-4 text-center">
          <div className="text-2xl font-bold">{contactedCount}</div>
          <div className="text-sm text-[var(--text-secondary)]">Contactados</div>
        </div>
        <div className="neumor-card-sm p-4 text-center">
          <div className="text-2xl font-bold">{convertedCount}</div>
          <div className="text-sm text-[var(--text-secondary)]">Convertidos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="neumor-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por nombre, telefono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neumor-input w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "new", "contacted", "converted"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`neumor-btn text-sm ${filter === status ? "neumor-btn-accent" : ""}`}
              >
                {status === "all" && "Todos"}
                {status === "new" && "Nuevos"}
                {status === "contacted" && "Contactados"}
                {status === "converted" && "Convertidos"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="neumor-card p-6">
            <div className="empty-state text-center py-8">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3 className="text-lg font-medium mb-2">No hay leads</h3>
              <p className="text-[var(--text-secondary)]">
                {searchTerm || filter !== "all"
                  ? "No se encontraron leads con los filtros seleccionados."
                  : "Los leads apareceran aqui cuando los clientes te contacten."}
              </p>
            </div>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`neumor-card p-6 ${isPending ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{lead.name}</h3>
                    {getStatusBadge(lead.status)}
                  </div>
                  <div className="flex gap-4 text-sm text-[var(--text-secondary)] mb-3 flex-wrap">
                    <span>{lead.phone || "-"}</span>
                    <span>{lead.email || "-"}</span>
                    <span className="text-[var(--accent)]">
                      via {getSourceLabel(lead.source)}
                    </span>
                  </div>
                  {lead.message && (
                    <p className="text-sm bg-[var(--shadow-light)] p-3 rounded-lg">
                      &ldquo;{lead.message}&rdquo;
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--text-secondary)] mb-3">
                    {formatDate(lead.created_at)}
                  </div>
                  <div className="flex flex-col gap-2">
                    {lead.status === "new" && (
                      <button
                        className="neumor-btn neumor-btn-accent text-sm"
                        onClick={() => handleStatusChange(lead.id, "contacted")}
                        disabled={isPending}
                      >
                        Marcar Contactado
                      </button>
                    )}
                    {lead.status === "contacted" && (
                      <button
                        className="neumor-btn neumor-btn-accent text-sm"
                        onClick={() => handleStatusChange(lead.id, "converted")}
                        disabled={isPending}
                      >
                        Marcar Convertido
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
