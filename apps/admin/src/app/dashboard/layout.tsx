"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface ClientInfo {
  businessName: string;
  businessType: string;
  email: string;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/reservas",
    label: "Reservas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/dashboard/leads",
    label: "Leads",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/dashboard/newsletter",
    label: "Newsletter",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  // TODO: Habilitar cuando se implemente la integración con Instagram
  // {
  //   href: "/dashboard/instagram",
  //   label: "Instagram",
  //   icon: (
  //     <svg
  //       viewBox="0 0 24 24"
  //       fill="none"
  //       stroke="currentColor"
  //       strokeWidth="2"
  //     >
  //       <rect x="2" y="2" width="20" height="20" rx="5" />
  //       <circle cx="12" cy="12" r="4" />
  //       <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
  //     </svg>
  //   ),
  // },
  {
    href: "/dashboard/configuracion",
    label: "Configuracion",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);

  useEffect(() => {
    async function fetchClientInfo() {
      const supabase = createClient();

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Primero intentar obtener de user_metadata (más rápido)
        if (user.user_metadata?.business_name) {
          setClientInfo({
            businessName: user.user_metadata.business_name,
            businessType: user.user_metadata.business_type || "restaurant",
            email: user.email || "",
          });
        } else {
          // Si no hay metadata, buscar en la tabla clients
          const { data: client } = await supabase
            .from("clients")
            .select("business_name, business_type, email")
            .eq("auth_user_id", user.id)
            .single();

          if (client) {
            setClientInfo({
              businessName: client.business_name,
              businessType: client.business_type,
              email: client.email,
            });
          }
        }
      }
    }

    fetchClientInfo();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Obtener iniciales del nombre del negocio
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Obtener tipo de negocio legible
  const getBusinessTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      restaurant: "Restaurante",
      clinic: "Clínica",
      salon: "Salón de belleza",
      shop: "Tienda",
      fitness: "Gimnasio",
      realestate: "Inmobiliaria",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full w-[var(--sidebar-width)] p-4 flex flex-col"
        style={{
          background: "var(--neumor-bg)",
          boxShadow: "4px 0 20px var(--shadow-dark)",
        }}
      >
        {/* Logo */}
        <div className="mb-8 px-4">
          <h1 className="text-xl font-heading font-bold text-[var(--text-primary)]">
            NeumorStudio
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Panel de Cliente
          </p>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="neumor-card-sm p-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-semibold">
              {clientInfo ? getInitials(clientInfo.businessName) : "..."}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {clientInfo?.businessName || "Cargando..."}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {clientInfo ? getBusinessTypeLabel(clientInfo.businessType) : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[var(--shadow-light)]"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 p-8"
        style={{ marginLeft: "var(--sidebar-width)" }}
      >
        {children}
      </main>
    </div>
  );
}
