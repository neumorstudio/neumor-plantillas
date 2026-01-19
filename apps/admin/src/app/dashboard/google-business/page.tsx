"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GoogleAccount {
    id: string;
    email: string;
    image: string;
    name: string;
    isActive: boolean;
}

interface GoogleLocation {
    id: string;
    social_account_id: string;
    account_name: string;
    location_name: string;
    title: string;
    address: string | null;
    phone: string | null;
    website_url: string | null;
    is_verified: boolean;
    is_selected: boolean;
    metadata: Record<string, unknown>;
}

interface LocationsResponse {
    connected: boolean;
    account?: GoogleAccount;
    locations: GoogleLocation[];
}

export default function GoogleBusinessPage() {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [data, setData] = useState<LocationsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    // Cargar datos al montar
    useEffect(() => {
        fetchLocations();

        // Verificar parámetros de URL para mensajes
        const params = new URLSearchParams(window.location.search);
        if (params.get("success") === "true") {
            setSuccessMessage("Google Business Profile conectado correctamente");
            // Limpiar URL
            window.history.replaceState({}, "", window.location.pathname);
        } else if (params.get("error")) {
            setError(`Error al conectar: ${params.get("error")}`);
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, []);

    async function fetchLocations() {
        try {
            setLoading(true);
            const res = await fetch("/api/google-business/locations");
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const message = json?.error || "Failed to fetch";
                throw new Error(message);
            }
            setData(json);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al cargar datos";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSync() {
        try {
            setSyncing(true);
            const res = await fetch("/api/google-business/locations", {
                method: "POST",
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const detail = json?.detail ? ` - ${json.detail}` : "";
                const message = `${json?.error || "Failed to sync"}${detail}`;
                throw new Error(message);
            }
            await fetchLocations();
            setSuccessMessage("Ubicaciones sincronizadas");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al sincronizar";
            setError(message);
        } finally {
            setSyncing(false);
        }
    }

    async function handleSelectLocation(locationId: string) {
        try {
            const res = await fetch("/api/google-business/locations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ locationId }),
            });
            if (!res.ok) throw new Error("Failed to select");
            await fetchLocations();
        } catch (err) {
            setError("Error al seleccionar ubicación");
        }
    }

    async function handleDisconnect() {
        if (!confirm("¿Estás seguro de que quieres desconectar Google Business Profile?")) {
            return;
        }

        try {
            setDisconnecting(true);
            const res = await fetch("/api/google-business/disconnect", {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to disconnect");
            await fetchLocations();
            setSuccessMessage("Google Business Profile desconectado");
        } catch (err) {
            setError("Error al desconectar");
        } finally {
            setDisconnecting(false);
        }
    }

    // Cerrar mensajes después de 5 segundos
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

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-heading font-bold mb-6">Google Business Profile</h1>
                <div className="neumor-card p-8 text-center">
                    <div className="animate-pulse">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-heading font-bold">Google Business Profile</h1>
                {data?.connected && (
                    <Link
                        href="/dashboard/google-business/reviews"
                        className="neumor-btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        Ver Reseñas
                    </Link>
                )}
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

            {/* Estado no conectado */}
            {!data?.connected && (
                <div className="neumor-card p-8 text-center">
                    <div className="mb-6">
                        <svg className="w-16 h-16 mx-auto text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Conecta tu Google Business Profile</h2>
                    <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                        Conecta tu perfil de negocio de Google para ver y responder reseñas directamente desde este panel.
                    </p>
                    <a
                        href="/api/google-business/auth"
                        className="neumor-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-lg"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Conectar Google Business
                    </a>
                </div>
            )}

            {/* Estado conectado */}
            {data?.connected && data.account && (
                <>
                    {/* Info de cuenta */}
                    <div className="neumor-card p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {data.account.image ? (
                                    <img
                                        src={data.account.image}
                                        alt={data.account.name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">
                                        {data.account.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold">{data.account.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{data.account.email}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                                    Conectado
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="neumor-btn px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                >
                                    <svg
                                        className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
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
                                    {syncing ? "Sincronizando..." : "Sincronizar"}
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    disabled={disconnecting}
                                    className="neumor-btn px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-red-500 hover:bg-red-500/10"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    {disconnecting ? "Desconectando..." : "Desconectar"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de ubicaciones */}
                    <div className="neumor-card p-6">
                        <h2 className="text-lg font-semibold mb-4">Tus Ubicaciones</h2>
                        {data.locations.length === 0 ? (
                            <p className="text-[var(--text-secondary)] text-center py-8">
                                No se encontraron ubicaciones. Verifica que tengas un negocio registrado en Google Business Profile.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {data.locations.map((location) => (
                                    <div
                                        key={location.id}
                                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${location.is_selected
                                            ? "border-[var(--accent)] bg-[var(--accent)]/5"
                                            : "border-transparent bg-[var(--neumor-bg)] hover:border-[var(--accent)]/30"
                                            }`}
                                        onClick={() => handleSelectLocation(location.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{location.title}</h3>
                                                    {location.is_verified && (
                                                        <svg
                                                            className="w-4 h-4 text-blue-500"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                        >
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                        </svg>
                                                    )}
                                                    {location.is_selected && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--accent)] text-white">
                                                            Activa
                                                        </span>
                                                    )}
                                                </div>
                                                {location.address && (
                                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                                        📍 {location.address}
                                                    </p>
                                                )}
                                                {location.phone && (
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        📞 {location.phone}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${location.is_selected
                                                        ? "border-[var(--accent)] bg-[var(--accent)]"
                                                        : "border-[var(--text-secondary)]"
                                                        }`}
                                                >
                                                    {location.is_selected && (
                                                        <svg
                                                            className="w-3 h-3 text-white"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-sm text-[var(--text-secondary)] mt-4">
                            Selecciona una ubicación para ver y gestionar sus reseñas.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
