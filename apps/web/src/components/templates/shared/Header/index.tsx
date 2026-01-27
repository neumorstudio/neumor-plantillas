"use client";

import Link from "next/link";
import { useState } from "react";

interface HeaderProps {
  businessName: string;
  businessType: string;
  isLoggedIn?: boolean;
  customerName?: string;
  navLinks?: { label: string; href: string }[];
}

// Default nav links per business type
const defaultNavLinks: Record<string, { label: string; href: string }[]> = {
  gym: [
    { label: "Inicio", href: "/" },
    { label: "Clases", href: "/#clases" },
    { label: "Horarios", href: "/#horarios" },
    { label: "Contacto", href: "/#contacto" },
  ],
  salon: [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/#servicios" },
    { label: "Reservar", href: "/#reservar" },
    { label: "Contacto", href: "/#contacto" },
  ],
  restaurant: [
    { label: "Inicio", href: "/" },
    { label: "Menu", href: "/#menu" },
    { label: "Reservar", href: "/#reservar" },
    { label: "Contacto", href: "/#contacto" },
  ],
  clinic: [
    { label: "Inicio", href: "/" },
    { label: "Tratamientos", href: "/#tratamientos" },
    { label: "Cita", href: "/#cita" },
    { label: "Contacto", href: "/#contacto" },
  ],
  repairs: [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/#servicios" },
    { label: "Presupuesto", href: "/#presupuesto" },
    { label: "Contacto", href: "/#contacto" },
  ],
  store: [
    { label: "Inicio", href: "/" },
    { label: "Productos", href: "/#productos" },
    { label: "Contacto", href: "/#contacto" },
  ],
};

// Business icons
const BusinessIcons: Record<string, React.ReactNode> = {
  gym: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-icon">
      <path d="M6.5 6.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V6.5Z"/>
      <path d="M12.5 6.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V6.5Z"/>
      <path d="M4 10h1"/><path d="M4 14h1"/><path d="M19 10h1"/><path d="M19 14h1"/>
      <path d="M11.5 6v12"/><path d="M2 12h2"/><path d="M20 12h2"/>
    </svg>
  ),
  salon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-icon">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
      <line x1="4" y1="21" x2="20" y2="21"/>
      <line x1="12" y1="16" x2="12" y2="21"/>
    </svg>
  ),
  restaurant: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-icon">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  ),
  clinic: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-icon">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  repairs: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-icon">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  store: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-icon">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
};

export default function Header({
  businessName,
  businessType,
  isLoggedIn = false,
  customerName,
  navLinks,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = navLinks || defaultNavLinks[businessType] || defaultNavLinks.restaurant;
  const icon = BusinessIcons[businessType] || BusinessIcons.store;

  return (
    <>
      <header className="site-header">
        <div className="header-container">
          {/* Logo */}
          <Link href="/" className="header-logo">
            {icon}
            <span>{businessName}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="header-nav-desktop">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="header-nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Button */}
          <div className="header-auth">
            {isLoggedIn ? (
              <Link href="/mi-cuenta/inicio" className="header-auth-btn header-auth-btn-logged">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{customerName ? customerName.split(" ")[0] : "Mi Cuenta"}</span>
              </Link>
            ) : (
              <form action="/auth/google" method="POST" className="header-auth-form">
                <button type="submit" className="header-auth-btn header-auth-btn-google">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Iniciar sesion</span>
                </button>
              </form>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="header-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="header-nav-mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="header-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="header-nav-divider" />
            {isLoggedIn ? (
              <Link
                href="/mi-cuenta/inicio"
                className="header-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mi Cuenta
              </Link>
            ) : (
              <form action="/auth/google" method="POST" className="header-mobile-auth">
                <button type="submit" className="header-mobile-google-btn">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Iniciar sesion con Google</span>
                </button>
              </form>
            )}
          </nav>
        )}
      </header>

      <style jsx>{`
        .site-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: var(--ng-surface);
          box-shadow: var(--ng-shadow-raised);
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--ng-text-primary);
          font-weight: 700;
          font-size: 1.125rem;
        }

        .header-logo :global(.header-icon) {
          width: 28px;
          height: 28px;
          color: var(--ng-accent);
        }

        .header-nav-desktop {
          display: none;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .header-nav-desktop {
            display: flex;
          }
        }

        .header-nav-link {
          color: var(--ng-text-secondary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9375rem;
          transition: color 0.2s;
        }

        .header-nav-link:hover {
          color: var(--ng-accent);
        }

        .header-auth {
          display: none;
        }

        @media (min-width: 768px) {
          .header-auth {
            display: block;
          }
        }

        .header-auth-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          background: var(--ng-accent);
          color: white;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .header-auth-btn:hover {
          background: var(--ng-accent-hover);
          transform: translateY(-1px);
        }

        .header-auth-btn-logged {
          background: var(--ng-surface);
          color: var(--ng-text-primary);
          box-shadow: var(--ng-shadow-raised);
        }

        .header-auth-btn-logged:hover {
          background: var(--ng-surface);
          color: var(--ng-accent);
        }

        .header-auth-form {
          display: contents;
        }

        .header-auth-btn-google {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          cursor: pointer;
        }

        .header-auth-btn-google:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-mobile-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          color: var(--ng-text-primary);
          cursor: pointer;
        }

        @media (min-width: 768px) {
          .header-mobile-toggle {
            display: none;
          }
        }

        .header-nav-mobile {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--ng-surface);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .header-nav-mobile .header-nav-link {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
        }

        .header-nav-mobile .header-nav-link:hover {
          background: var(--ng-surface-alt);
        }

        .header-nav-divider {
          height: 1px;
          background: var(--ng-border);
          margin: 0.5rem 0;
        }

        .header-nav-link-cta {
          background: var(--ng-accent);
          color: white !important;
          text-align: center;
        }

        .header-nav-link-cta:hover {
          background: var(--ng-accent-hover) !important;
        }

        .header-mobile-auth {
          width: 100%;
        }

        .header-mobile-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-weight: 500;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .header-mobile-google-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
      `}</style>
    </>
  );
}
