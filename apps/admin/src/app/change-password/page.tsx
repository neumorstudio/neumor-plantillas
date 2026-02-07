"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ChangePasswordPage() {
  const router = useRouter();
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(password)) {
      return "La contraseña debe tener al menos una mayúscula";
    }
    if (!/[a-z]/.test(password)) {
      return "La contraseña debe tener al menos una minúscula";
    }
    if (!/[0-9]/.test(password)) {
      return "La contraseña debe tener al menos un número";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const newPasswordValue = newPasswordRef.current?.value ?? newPassword;
    const confirmPasswordValue =
      confirmPasswordRef.current?.value ?? confirmPassword;

    // Validar que las contraseñas coincidan
    if (newPasswordValue !== confirmPasswordValue) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    // Validar requisitos de contraseña
    const validationError = validatePassword(newPasswordValue);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Actualizar contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPasswordValue,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Quitar el flag must_change_password
    await supabase.auth.updateUser({
      data: { must_change_password: false },
    });

    // Redirigir al dashboard
    router.push("/dashboard");
    router.refresh();
  };

  const toggleNewPasswordVisibility = () => {
    const currentValue = newPasswordRef.current?.value ?? "";
    if (currentValue !== newPassword) {
      setNewPassword(currentValue);
    }
    setShowNewPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    const currentValue = confirmPasswordRef.current?.value ?? "";
    if (currentValue !== confirmPassword) {
      setConfirmPassword(currentValue);
    }
    setShowConfirmPassword((prev) => !prev);
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

        {/* Change Password Form */}
        <form onSubmit={handleSubmit} className="neumor-card p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Cambiar Contraseña</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Por seguridad, debes establecer una nueva contraseña para
              continuar.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium mb-2 text-[var(--text-primary)]"
              >
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  ref={newPasswordRef}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="neumor-input w-full pr-10"
                  placeholder="Minimo 8 caracteres"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleNewPasswordVisibility}
                  aria-label={showNewPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  aria-pressed={showNewPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {showNewPassword ? (
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2 text-[var(--text-primary)]"
              >
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  ref={confirmPasswordRef}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="neumor-input w-full pr-10"
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {showConfirmPassword ? (
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

            <div className="text-xs text-[var(--text-secondary)] space-y-1">
              <p>La contraseña debe tener:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Minimo 8 caracteres</li>
                <li>Al menos una mayuscula</li>
                <li>Al menos una minuscula</li>
                <li>Al menos un numero</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neumor-btn neumor-btn-accent w-full mt-6"
            >
              {loading ? "Guardando..." : "Guardar Nueva Contraseña"}
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
