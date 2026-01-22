"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions";
import { convertQuoteToJob } from "@/lib/actions/jobs";

interface QuoteLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
  details?: Record<string, unknown> | null;
}

type FilterStatus = "all" | "new" | "contacted" | "converted" | "lost";

export default function PresupuestosClient({
  initialQuotes,
}: {
  initialQuotes: QuoteLead[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteLead[]>(initialQuotes);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);

  const handleConvertToJob = async (quoteId: string) => {
    if (!confirm("¿Convertir este presupuesto en un trabajo?")) return;

    setConvertingId(quoteId);
    setActionError(null);

    try {
      const result = await convertQuoteToJob(quoteId);
      if (result.error) {
        setActionError(result.error);
      } else {
        // Actualizar estado local
        setQuotes((prev) =>
          prev.map((quote) =>
            quote.id === quoteId ? { ...quote, status: "converted" } : quote
          )
        );
        // Redirigir a trabajos
        router.push("/dashboard/trabajos");
      }
    } finally {
      setConvertingId(null);
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const status = quote.status || "new";
    const matchesFilter = filter === "all" || status === filter;
    const matchesSearch =
      quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.phone?.includes(searchTerm) ?? false) ||
      (quote.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateLeadStatus(
        leadId,
        newStatus as "new" | "contacted" | "converted" | "lost"
      );
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setQuotes((prev) =>
        prev.map((quote) =>
          quote.id === leadId ? { ...quote, status: newStatus } : quote
        )
      );
    });
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "contacted":
        return <span className="badge badge-contacted">Contactado</span>;
      case "converted":
        return <span className="badge badge-converted">Convertido</span>;
      case "lost":
        return <span className="badge badge-cancelled">Perdido</span>;
      case "new":
      default:
        return <span className="badge badge-new">Nuevo</span>;
    }
  };

  const getSourceLabel = (source?: string | null) => {
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

  const renderDetails = (details?: Record<string, unknown> | null) => {
    if (!details || typeof details !== "object") return null;
    const entries = Object.entries(details).filter(([_, value]) => value !== "" && value !== null && value !== undefined);
    if (entries.length === 0) return null;

    return (
      <ul className="text-sm text-[var(--text-secondary)] space-y-1">
        {entries.map(([key, value]) => (
          <li key={key}>
            <span className="font-medium text-[var(--text-primary)]">{key}:</span>{" "}
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </li>
        ))}
      </ul>
    );
  };

  // Stats
  const newCount = quotes.filter((q) => (q.status || "new") === "new").length;
  const contactedCount = quotes.filter((q) => q.status === "contacted").length;
  const convertedCount = quotes.filter((q) => q.status === "converted").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Presupuestos</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona las solicitudes de presupuesto de tus clientes
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

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <div className="neumor-card p-6">
            <div className="empty-state text-center py-8">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]"
              >
                <path d="M21 15V5a2 2 0 0 0-2-2H7L3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
                <path d="M7 10h10" />
                <path d="M7 14h6" />
              </svg>
              <h3 className="text-lg font-medium mb-2">No hay presupuestos</h3>
              <p className="text-[var(--text-secondary)]">
                {searchTerm || filter !== "all"
                  ? "No se encontraron presupuestos con los filtros seleccionados."
                  : "Los presupuestos apareceran aqui cuando los clientes envien una solicitud."}
              </p>
            </div>
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              className={`neumor-card p-6 ${isPending ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{quote.name}</h3>
                    {getStatusBadge(quote.status)}
                  </div>
                  <div className="flex gap-4 text-sm text-[var(--text-secondary)] mb-3 flex-wrap">
                    <span>{quote.phone || "-"}</span>
                    <span>{quote.email || "-"}</span>
                    <span className="text-[var(--accent)]">
                      via {getSourceLabel(quote.source)}
                    </span>
                  </div>
                  {quote.message && (
                    <p className="text-sm bg-[var(--shadow-light)] p-3 rounded-lg mb-3">
                      &ldquo;{quote.message}&rdquo;
                    </p>
                  )}
                  {renderDetails(quote.details)}
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--text-secondary)] mb-3">
                    {formatDate(quote.created_at)}
                  </div>
                  <div className="flex flex-col gap-2">
                    {(quote.status || "new") === "new" && (
                      <button
                        className="neumor-btn neumor-btn-accent text-sm"
                        onClick={() => handleStatusChange(quote.id, "contacted")}
                        disabled={isPending}
                      >
                        Marcar Contactado
                      </button>
                    )}
                    {quote.status === "contacted" && (
                      <>
                        <button
                          className="neumor-btn-primary text-sm px-3 py-1.5 rounded-lg font-medium"
                          onClick={() => handleConvertToJob(quote.id)}
                          disabled={isPending || convertingId === quote.id}
                        >
                          {convertingId === quote.id ? "Convirtiendo..." : "Crear Trabajo"}
                        </button>
                        <button
                          className="neumor-btn text-sm"
                          onClick={() => handleStatusChange(quote.id, "lost")}
                          disabled={isPending}
                        >
                          Marcar Perdido
                        </button>
                      </>
                    )}
                    {quote.status === "converted" && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Trabajo creado
                      </span>
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
