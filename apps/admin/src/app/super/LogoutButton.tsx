"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="Cerrar sesion"
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="hidden sm:inline">
        {loading ? "Saliendo..." : "Cerrar sesion"}
      </span>
    </button>
  );
}
