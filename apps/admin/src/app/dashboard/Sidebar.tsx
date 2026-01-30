"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, Home, Calendar, FileText, Wrench, CreditCard, Users, Mail, Settings, Palette, BarChart3, Package, Dumbbell, TrendingUp, UserRound } from "lucide-react";

interface SidebarProps {
  clientInfo: {
    businessName: string;
    businessType: string;
    email: string;
  } | null;
  visibleSections?: string[] | null;
}

interface NavItem {
  href: string;
  label: string;
  slug: string;
  icon: React.ReactNode;
}

// Iconos usando Lucide para consistencia y mejor rendimiento
const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    slug: "dashboard",
    icon: <Home className="w-5 h-5" />,
  },
  {
    href: "/dashboard/reservas",
    label: "Reservas",
    slug: "reservas",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    href: "/dashboard/calendario",
    label: "Calendario",
    slug: "calendario",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    href: "/dashboard/presupuestos",
    label: "Presupuestos",
    slug: "presupuestos",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    href: "/dashboard/trabajos",
    label: "Trabajos",
    slug: "trabajos",
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    href: "/dashboard/pagos",
    label: "Pagos",
    slug: "pagos",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    href: "/dashboard/sesiones",
    label: "Sesiones",
    slug: "sesiones",
    icon: <Dumbbell className="w-5 h-5" />,
  },
  {
    href: "/dashboard/progreso",
    label: "Progreso",
    slug: "progreso",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    href: "/dashboard/paquetes",
    label: "Paquetes",
    slug: "paquetes",
    icon: <Package className="w-5 h-5" />,
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    slug: "clientes",
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: "/dashboard/servicios",
    label: "Servicios",
    slug: "servicios",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    href: "/dashboard/profesionales",
    label: "Equipo",
    slug: "profesionales",
    icon: <UserRound className="w-5 h-5" />,
  },
  {
    href: "/dashboard/newsletter",
    label: "Newsletter",
    slug: "newsletter",
    icon: <Mail className="w-5 h-5" />,
  },
  {
    href: "/dashboard/personalizacion",
    label: "Personalizacion",
    slug: "personalizacion",
    icon: <Palette className="w-5 h-5" />,
  },
  {
    href: "/dashboard/configuracion",
    label: "Configuracion",
    slug: "configuracion",
    icon: <Settings className="w-5 h-5" />,
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function getBusinessTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    restaurant: "Restaurante",
    clinic: "Clinica",
    salon: "Salon de belleza",
    shop: "Tienda",
    fitness: "Gimnasio",
    realestate: "Inmobiliaria",
    repairs: "Reformas y reparaciones",
  };
  return labels[type] || type;
}

// Obtener título de la página actual
function getPageTitle(pathname: string, navItems: NavItem[]): string {
  const item = navItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );
  return item?.label || "Dashboard";
}

export function Sidebar({ clientInfo, visibleSections }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  let resolvedSections = visibleSections?.length ? [...visibleSections] : null;
  if (clientInfo?.businessType === "restaurant") {
    const baseSections = resolvedSections ?? navItems.map((item) => item.slug);
    const restaurantSections = baseSections.filter(
      (section) =>
        ![
          "presupuestos",
          "trabajos",
          "pagos",
          "sesiones",
          "progreso",
          "paquetes",
          "servicios",
          "profesionales",
        ].includes(section)
    );
    resolvedSections = restaurantSections;
  } else if (clientInfo?.businessType === "salon") {
    const baseSections = resolvedSections ?? navItems.map((item) => item.slug);
    if (!baseSections.includes("calendario")) {
      baseSections.push("calendario");
    }
    if (!baseSections.includes("profesionales")) {
      baseSections.push("profesionales");
    }
    resolvedSections = baseSections.filter(
      (section) => !["reservas", "clientes", "newsletter"].includes(section)
    );
  }

  const visibleNavItems = resolvedSections?.length
    ? navItems.filter((item) => resolvedSections.includes(item.slug))
    : navItems;

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const currentPageTitle = getPageTitle(pathname, visibleNavItems);

  return (
    <>
      {/* ==================== MOBILE HEADER ==================== */}
      <header className="mobile-header lg:hidden">
        {/* Hamburger Button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="mobile-menu-btn"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page Title */}
        <h1 className="mobile-header-title">{currentPageTitle}</h1>

        {/* User Avatar */}
        <div className="mobile-header-avatar">
          {clientInfo ? getInitials(clientInfo.businessName) : "?"}
        </div>
      </header>

      {/* ==================== MOBILE OVERLAY ==================== */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ==================== SIDEBAR ==================== */}
      <aside
        className={`sidebar neumor-bg ${isMobileOpen ? "sidebar-open" : ""}`}
        role="navigation"
        aria-label="Menu principal"
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="flex-1">
            <h1 className="text-xl font-heading font-bold text-[var(--text-primary)]">
              NeumorStudio
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Panel de Cliente</p>
          </div>

          {/* Close button - only on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="sidebar-close-btn lg:hidden"
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 overflow-y-auto px-3">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => setIsMobileOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - User Info */}
        <div className="sidebar-footer">
          <div className="neumor-card-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-semibold flex-shrink-0">
                {clientInfo ? getInitials(clientInfo.businessName) : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {clientInfo?.businessName || "Usuario"}
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
              <LogOut className="w-4 h-4" />
              Cerrar Sesion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
