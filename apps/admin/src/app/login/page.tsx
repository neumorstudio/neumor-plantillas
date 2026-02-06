"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePasswordVisibility = () => {
    const currentValue = passwordRef.current?.value ?? "";
    if (currentValue !== password) {
      setPassword(currentValue);
    }
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const emailValue = emailRef.current?.value ?? email;
    const passwordValue = passwordRef.current?.value ?? password;

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check if user must change password on first login
    if (data.user?.user_metadata?.must_change_password) {
      router.push("/change-password");
      router.refresh();
      return;
    }

    // Redirect to dashboard on success
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--neumor-bg)] relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_55%)]"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-[var(--text-primary)] tracking-tight">
              NeumorStudio
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2">
              Panel de Administracion
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="neumor-card relative overflow-hidden p-8 sm:p-10"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/30 to-transparent opacity-60"
            />
            <div className="relative space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Iniciar Sesión
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Ingresa tus credenciales para continuar.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm border border-red-200/60">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    ref={emailRef}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neumor-input w-full transition-shadow duration-200 placeholder:text-[var(--text-secondary)]/70"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      ref={passwordRef}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="neumor-input w-full pr-12 transition-shadow duration-200 placeholder:text-[var(--text-secondary)]/70"
                      placeholder="Tu contrasena"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      aria-label={
                        showPassword
                          ? "Ocultar contrasena"
                          : "Mostrar contrasena"
                      }
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 neumor-raised-sm p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="neumor-btn w-full bg-[var(--accent)] text-white font-semibold tracking-wide transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>
              </div>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} NeumorStudio. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
