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
  showGoogleBusiness: boolean;
  visibleSections?: string[] | null;
}

interface NavItem {
  href: string;
  label: string;
  slug: string;
  icon: React.ReactNode;
  feature?: string;
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
    href: "/dashboard/google-business",
    label: "Google Business",
    slug: "google-business",
    feature: "googleBusiness",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
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

export function Sidebar({ clientInfo, showGoogleBusiness, visibleSections }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  let resolvedSections = visibleSections?.length ? [...visibleSections] : null;
  if (clientInfo?.businessType === "salon") {
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

  const sectionFilteredItems = resolvedSections?.length
    ? navItems.filter((item) => resolvedSections.includes(item.slug))
    : navItems;

  const visibleNavItems = sectionFilteredItems.filter(
    (item) => !item.feature || (item.feature === "googleBusiness" && showGoogleBusiness)
  );

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
