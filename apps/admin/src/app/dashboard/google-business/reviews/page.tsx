"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GoogleLocation {
    id: string;
    title: string;
    address: string | null;
    is_selected: boolean;
}

interface GoogleReview {
    id: string;
    review_name: string;
    reviewer_name: string | null;
    reviewer_photo_url: string | null;
    star_rating: number | null;
    comment: string | null;
    reply_comment: string | null;
    reply_updated_at: string | null;
    review_created_at: string | null;
}

interface ReviewsResponse {
    connected: boolean;
    selectedLocation: GoogleLocation | null;
    reviews: GoogleReview[];
    totalReviewCount?: number;
    fromCache?: boolean;
    message?: string;
}

export default function GoogleReviewsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<ReviewsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estado para respuestas
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Filtros
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [filterReplied, setFilterReplied] = useState<"all" | "replied" | "pending">("all");

    useEffect(() => {
        fetchReviews();
    }, []);

    async function fetchReviews(refresh = false) {
        try {
            setLoading(!refresh);
            setRefreshing(refresh);
            const url = refresh ? "/api/google-business/reviews?refresh=true" : "/api/google-business/reviews";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError("Error al cargar reseñas");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    async function handleSubmitReply(reviewId: string) {
        if (!replyText.trim()) return;

        try {
            setSubmitting(true);
            const res = await fetch(`/api/google-business/reviews/${reviewId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: replyText }),
            });

            if (!res.ok) throw new Error("Failed to reply");

            setSuccessMessage("Respuesta enviada correctamente");
            setReplyingTo(null);
            setReplyText("");
            await fetchReviews(true);
        } catch (err) {
            setError("Error al enviar respuesta");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteReply(reviewId: string) {
        if (!confirm("¿Eliminar esta respuesta?")) return;

        try {
            const res = await fetch(`/api/google-business/reviews/${reviewId}/reply`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            setSuccessMessage("Respuesta eliminada");
            await fetchReviews(true);
        } catch (err) {
            setError("Error al eliminar respuesta");
        }
    }

    // Cerrar mensajes
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Filtrar reseñas
    const filteredReviews = (data?.reviews || []).filter((review) => {
        if (filterRating !== null && review.star_rating !== filterRating) return false;
        if (filterReplied === "replied" && !review.reply_comment) return false;
        if (filterReplied === "pending" && review.reply_comment) return false;
        return true;
    });

    // Renderizar estrellas
    function renderStars(rating: number | null) {
        if (rating === null) return null;
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                ))}
            </div>
        );
    }

    // Formatear fecha
    function formatDate(dateStr: string | null) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-heading font-bold mb-6">Reseñas de Google</h1>
                <div className="neumor-card p-8 text-center">
                    <div className="animate-pulse">Cargando reseñas...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/google-business"
                        className="neumor-btn p-2 rounded-lg"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-heading font-bold">Reseñas de Google</h1>
                </div>
                <button
                    onClick={() => fetchReviews(true)}
                    disabled={refreshing}
                    className="neumor-btn px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <svg
                        className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 21h5v-5" />
                    </svg>
                    {refreshing ? "Actualizando..." : "Actualizar"}
                </button>
            </div>

            {/* Mensajes */}
            {successMessage && (
                <div className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-500">
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-500">
                    {error}
                </div>
            )}

            {/* Sin ubicación seleccionada */}
            {!data?.selectedLocation && (
                <div className="neumor-card p-8 text-center">
                    <p className="text-[var(--text-secondary)] mb-4">
                        No hay ninguna ubicación seleccionada.
                    </p>
                    <Link
                        href="/dashboard/google-business"
                        className="neumor-btn-primary px-4 py-2 rounded-lg inline-block"
                    >
                        Seleccionar ubicación
                    </Link>
                </div>
            )}

            {/* Con ubicación seleccionada */}
            {data?.selectedLocation && (
                <>
                    {/* Info de ubicación */}
                    <div className="neumor-card p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-medium">{data.selectedLocation.title}</h2>
                                {data.selectedLocation.address && (
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        📍 {data.selectedLocation.address}
                                    </p>
                                )}
                            </div>
                            {data.totalReviewCount !== undefined && (
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{data.totalReviewCount}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">reseñas totales</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="neumor-card p-4 mb-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--text-secondary)]">Estrellas:</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setFilterRating(null)}
                                        className={`px-2 py-1 rounded text-sm ${filterRating === null ? "bg-[var(--accent)] text-white" : "neumor-btn"
                                            }`}
                                    >
                                        Todas
                                    </button>
                                    {[5, 4, 3, 2, 1].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setFilterRating(r)}
                                            className={`px-2 py-1 rounded text-sm ${filterRating === r ? "bg-[var(--accent)] text-white" : "neumor-btn"
                                                }`}
                                        >
                                            {r}★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--text-secondary)]">Estado:</span>
                                <select
                                    value={filterReplied}
                                    onChange={(e) => setFilterReplied(e.target.value as typeof filterReplied)}
                                    className="neumor-input px-3 py-1 rounded text-sm"
                                >
                                    <option value="all">Todas</option>
                                    <option value="pending">Sin responder</option>
                                    <option value="replied">Respondidas</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lista de reseñas */}
                    {filteredReviews.length === 0 ? (
                        <div className="neumor-card p-8 text-center text-[var(--text-secondary)]">
                            No hay reseñas que coincidan con los filtros.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredReviews.map((review) => (
                                <div key={review.id} className="neumor-card p-5">
                                    {/* Header de la reseña */}
                                    <div className="flex items-start gap-3 mb-3">
                                        {review.reviewer_photo_url ? (
                                            <img
                                                src={review.reviewer_photo_url}
                                                alt={review.reviewer_name || "Reviewer"}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">
                                                {(review.reviewer_name || "A").charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{review.reviewer_name || "Anónimo"}</p>
                                                    <div className="flex items-center gap-2">
                                                        {renderStars(review.star_rating)}
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            {formatDate(review.review_created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {review.reply_comment ? (
                                                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">
                                                        Respondida
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-600">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comentario */}
                                    {review.comment && (
                                        <p className="text-[var(--text-primary)] mb-4 pl-13">
                                            {review.comment}
                                        </p>
                                    )}

                                    {/* Respuesta existente */}
                                    {review.reply_comment && (
                                        <div className="ml-13 p-3 rounded-lg bg-[var(--accent)]/10 border-l-4 border-[var(--accent)]">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-medium text-[var(--accent)]">Tu respuesta</p>
                                                <button
                                                    onClick={() => handleDeleteReply(review.id)}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                            <p className="text-sm">{review.reply_comment}</p>
                                            {review.reply_updated_at && (
                                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                                    {formatDate(review.reply_updated_at)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Formulario de respuesta */}
                                    {!review.reply_comment && replyingTo === review.id && (
                                        <div className="ml-13 mt-3">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Escribe tu respuesta..."
                                                className="neumor-input w-full p-3 rounded-lg resize-none"
                                                rows={3}
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText("");
                                                    }}
                                                    className="neumor-btn px-4 py-2 rounded-lg text-sm"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleSubmitReply(review.id)}
                                                    disabled={submitting || !replyText.trim()}
                                                    className="neumor-btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                                                >
                                                    {submitting ? "Enviando..." : "Enviar respuesta"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botón para responder */}
                                    {!review.reply_comment && replyingTo !== review.id && (
                                        <button
                                            onClick={() => setReplyingTo(review.id)}
                                            className="ml-13 mt-3 text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                            </svg>
                                            Responder
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {data.fromCache && (
                        <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
                            Mostrando datos en caché. Pulsa "Actualizar" para obtener las últimas reseñas.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
