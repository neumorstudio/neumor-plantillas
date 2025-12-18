"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Redirect to dashboard on success
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">
            NeumorStudio
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Panel de Administracion
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="neumor-card p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Iniciar Sesion
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 text-[var(--text-primary)]"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neumor-input w-full"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 text-[var(--text-primary)]"
              >
                Contrasena
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neumor-input w-full"
                placeholder="Tu contrasena"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neumor-btn neumor-btn-accent w-full mt-6"
            >
              {loading ? "Iniciando sesion..." : "Iniciar Sesion"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--text-secondary)]">
          &copy; {new Date().getFullYear()} NeumorStudio. Todos los derechos
          reservados.
        </p>
      </div>
    </div>
  );
}
