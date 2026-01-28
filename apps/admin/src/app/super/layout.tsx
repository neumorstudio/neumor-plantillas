import { isSuperAdmin, getCurrentUserEmail } from "@/lib/superadmin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Doble verificacion en server component (ademas del middleware)
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    redirect("/login");
  }

  const email = await getCurrentUserEmail();

  return (
    <div className="min-h-screen bg-[var(--neumor-bg)]">
      {/* Header SuperAdmin */}
      <header className="sticky top-0 z-40 border-b border-[var(--shadow-light)] bg-[var(--neumor-bg)]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 15l-2 5l9-14h-7l2-5l-9 14h7z" />
                </svg>
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg">SuperAdmin</h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  NeumorStudio
                </p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-6">
              <Link
                href="/super/businesses"
                className="text-sm font-medium hover:text-[var(--accent)] transition-colors"
              >
                Negocios
              </Link>
            </nav>

            {/* User + Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
                  {email}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
