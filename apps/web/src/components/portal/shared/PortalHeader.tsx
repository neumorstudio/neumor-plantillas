"use client";

import { useRouter } from "next/navigation";

interface PortalHeaderProps {
  customer: {
    name: string;
    email: string;
  };
  businessType: string;
  businessName?: string;
}

// Icons por tipo de negocio
const BusinessIcons: Record<string, React.ReactNode> = {
  gym: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V6.5Z"/>
      <path d="M12.5 6.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V6.5Z"/>
      <path d="M4 10h1"/><path d="M4 14h1"/><path d="M19 10h1"/><path d="M19 14h1"/>
      <path d="M11.5 6v12"/><path d="M2 12h2"/><path d="M20 12h2"/>
    </svg>
  ),
  salon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
      <line x1="4" y1="21" x2="20" y2="21"/>
      <line x1="12" y1="16" x2="12" y2="21"/>
    </svg>
  ),
  restaurant: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  ),
  clinic: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  repairs: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  store: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
};

export default function PortalHeader({ customer, businessType, businessName }: PortalHeaderProps) {
  const router = useRouter();

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const icon = BusinessIcons[businessType] || BusinessIcons.store;

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="portal-header">
      <a href="/mi-cuenta/inicio" className="portal-header-logo">
        {icon}
        <span>{businessName || "Mi Cuenta"}</span>
      </a>

      <div className="portal-header-avatar">
        <div className="portal-avatar" title={customer.name}>
          {initials}
        </div>

        <button
          onClick={handleLogout}
          className="portal-logout-btn"
          title="Cerrar sesion"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
