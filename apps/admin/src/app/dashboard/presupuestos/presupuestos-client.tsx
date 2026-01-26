"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions";
import { convertQuoteToJob } from "@/lib/actions/jobs";
import { Phone, Mail, MessageSquare, Clock, ChevronRight, X, Briefcase } from "lucide-react";
import { ConfirmDialog, SegmentedControl } from "@/components/mobile";

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

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Nuevos" },
  { value: "contacted", label: "Contactados" },
  { value: "converted", label: "Convertidos" },
];

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

  // Estado para diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    quoteId: string;
    action: "convert" | "lost";
  }>({ isOpen: false, quoteId: "", action: "convert" });

  // Estado para ver detalles expandidos en móvil
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);

  const handleConvertToJob = async (quoteId: string) => {
    setConfirmDialog({ isOpen: false, quoteId: "", action: "convert" });
    setConvertingId(quoteId);
    setActionError(null);

    try {
      const result = await convertQuoteToJob(quoteId);
      if (result.error) {
        setActionError(result.error);
      } else {
        setQuotes((prev) =>
          prev.map((quote) =>
            quote.id === quoteId ? { ...quote, status: "converted" } : quote
          )
        );
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
    setConfirmDialog({ isOpen: false, quoteId: "", action: "convert" });

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
    const entries = Object.entries(details).filter(
      ([_, value]) => value !== "" && value !== null && value !== undefined
    );
    if (entries.length === 0) return null;

    return (
      <ul className="text-sm text-[var(--text-secondary)] space-y-1 mt-3 pt-3 border-t border-[var(--shadow-dark)]">
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

  const openConfirmDialog = (quoteId: string, action: "convert" | "lost") => {
    setConfirmDialog({ isOpen: true, quoteId, action });
  };

  const getConfirmDialogProps = () => {
    const quote = quotes.find((q) => q.id === confirmDialog.quoteId);
    const name = quote?.name || "este presupuesto";

    if (confirmDialog.action === "convert") {
      return {
        title: "Crear trabajo",
        description: `¿Convertir el presupuesto de ${name} en un trabajo activo?`,
        confirmText: "Si, crear trabajo",
        variant: "success" as const,
        icon: <Briefcase className="w-6 h-6 text-green-500" />,
      };
    }
    return {
      title: "Marcar como perdido",
      description: `¿Marcar el presupuesto de ${name} como perdido? Podras verlo en el historial.`,
      confirmText: "Marcar perdido",
      variant: "warning" as const,
    };
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action === "convert") {
      handleConvertToJob(confirmDialog.quoteId);
    } else {
      handleStatusChange(confirmDialog.quoteId, "lost");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header mb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-1">Presupuestos</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestiona las solicitudes de presupuesto de tus clientes
        </p>
      </div>

      {/* Error message */}
      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* Stats - Responsive grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="neumor-card-sm p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold">{newCount}</div>
          <div className="text-xs sm:text-sm text-[var(--text-secondary)]">Nuevos</div>
        </div>
        <div className="neumor-card-sm p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold">{contactedCount}</div>
          <div className="text-xs sm:text-sm text-[var(--text-secondary)]">Contactados</div>
        </div>
        <div className="neumor-card-sm p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold">{convertedCount}</div>
          <div className="text-xs sm:text-sm text-[var(--text-secondary)]">Convertidos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="neumor-card p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, telefono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neumor-input w-full pl-10"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
        </div>

        {/* Status Filter */}
        <SegmentedControl
          options={filterOptions.map((opt) => ({
            ...opt,
            count:
              opt.value === "new"
                ? newCount
                : opt.value === "contacted"
                ? contactedCount
                : opt.value === "converted"
                ? convertedCount
                : undefined,
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <div className="neumor-card p-6">
            <div className="empty-state">
              <MessageSquare className="w-16 h-16" />
              <h3>No hay presupuestos</h3>
              <p>
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
              className={`neumor-card p-4 sm:p-6 ${isPending || convertingId === quote.id ? "opacity-50" : ""}`}
            >
              {/* Mobile Layout */}
              <div className="sm:hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate mb-1">{quote.name}</h3>
                    {getStatusBadge(quote.status)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] text-right">
                    {formatDate(quote.created_at)}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm mb-3">
                  {quote.phone && (
                    <a
                      href={`tel:${quote.phone}`}
                      className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{quote.phone}</span>
                    </a>
                  )}
                  {quote.email && (
                    <a
                      href={`mailto:${quote.email}`}
                      className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{quote.email}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-2 text-[var(--accent)] text-xs">
                    <span>via {getSourceLabel(quote.source)}</span>
                  </div>
                </div>

                {/* Message */}
                {quote.message && (
                  <div
                    className="text-sm bg-[var(--shadow-light)] p-3 rounded-lg cursor-pointer"
                    onClick={() => setExpandedId(expandedId === quote.id ? null : quote.id)}
                  >
                    <p className={expandedId === quote.id ? "" : "line-clamp-2"}>
                      &ldquo;{quote.message}&rdquo;
                    </p>
                    {quote.message.length > 100 && (
                      <span className="text-xs text-[var(--accent)] mt-1 inline-block">
                        {expandedId === quote.id ? "Ver menos" : "Ver mas"}
                      </span>
                    )}
                  </div>
                )}

                {/* Details (expandable) */}
                {expandedId === quote.id && renderDetails(quote.details)}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--shadow-dark)]">
                  {(quote.status || "new") === "new" && (
                    <button
                      className="neumor-btn neumor-btn-accent flex-1 text-sm py-2.5"
                      onClick={() => handleStatusChange(quote.id, "contacted")}
                      disabled={isPending}
                    >
                      Marcar Contactado
                    </button>
                  )}
                  {quote.status === "contacted" && (
                    <>
                      <button
                        className="neumor-btn-primary flex-1 text-sm px-3 py-2.5 rounded-xl font-medium"
                        onClick={() => openConfirmDialog(quote.id, "convert")}
                        disabled={isPending || convertingId === quote.id}
                      >
                        {convertingId === quote.id ? "..." : "Crear Trabajo"}
                      </button>
                      <button
                        className="neumor-btn flex-1 text-sm py-2.5 text-amber-600"
                        onClick={() => openConfirmDialog(quote.id, "lost")}
                        disabled={isPending}
                      >
                        Perdido
                      </button>
                    </>
                  )}
                  {quote.status === "converted" && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <Briefcase className="w-4 h-4" />
                      Trabajo creado
                    </div>
                  )}
                  {quote.status === "lost" && (
                    <div className="text-sm text-[var(--text-secondary)] italic">
                      Presupuesto perdido
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:block">
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
                  <div className="text-right flex-shrink-0">
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
                            onClick={() => openConfirmDialog(quote.id, "convert")}
                            disabled={isPending || convertingId === quote.id}
                          >
                            {convertingId === quote.id ? "Convirtiendo..." : "Crear Trabajo"}
                          </button>
                          <button
                            className="neumor-btn text-sm"
                            onClick={() => openConfirmDialog(quote.id, "lost")}
                            disabled={isPending}
                          >
                            Marcar Perdido
                          </button>
                        </>
                      )}
                      {quote.status === "converted" && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          Trabajo creado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, quoteId: "", action: "convert" })}
        onConfirm={handleConfirmAction}
        isLoading={isPending || !!convertingId}
        {...getConfirmDialogProps()}
      />
    </div>
  );
}
