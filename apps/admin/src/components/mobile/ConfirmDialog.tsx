"use client";

import { useEffect, ReactNode } from "react";
import { AlertTriangle, Trash2, CheckCircle, XCircle } from "lucide-react";

type DialogVariant = "danger" | "warning" | "success" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  isLoading?: boolean;
  icon?: ReactNode;
}

const variantConfig: Record<DialogVariant, { icon: ReactNode; buttonClass: string }> = {
  danger: {
    icon: <Trash2 className="w-6 h-6 text-red-500" />,
    buttonClass: "bg-red-500 hover:bg-red-600 text-white",
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  success: {
    icon: <CheckCircle className="w-6 h-6 text-green-500" />,
    buttonClass: "bg-green-500 hover:bg-green-600 text-white",
  },
  info: {
    icon: <XCircle className="w-6 h-6 text-blue-500" />,
    buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "info",
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  // Bloquear scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const config = variantConfig[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="confirm-dialog relative w-full sm:max-w-sm bg-[var(--neumor-bg)] p-6 animate-slideUp sm:animate-fadeIn"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-[var(--shadow-light)] flex items-center justify-center">
            {icon || config.icon}
          </div>
        </div>

        {/* Title */}
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-center text-[var(--text-primary)] mb-2"
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p
            id="confirm-dialog-desc"
            className="text-sm text-center text-[var(--text-secondary)] mb-6"
          >
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 neumor-btn py-3 text-sm font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-colors ${config.buttonClass} ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
