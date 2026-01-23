// Dashboard Overview - Server Component con widgets dinámicos según tipo de negocio
import { createClient } from "@/lib/supabase-server";
import {
  getDashboardStats,
  getRecentBookings,
  getBookingsToday,
  getQuotesPending,
  getQuotesAccepted,
  getJobsActive,
  getPaymentsPending,
  getRevenueMonth,
  getRecentJobs,
  getRecentQuotes,
  getSessionsToday,
  getSessionsWeek,
  getActiveClients,
  getExpiringPackages,
  getRecentSessions,
} from "@/lib/data";
import {
  BookingsTodayWidget,
  BookingsMonthWidget,
  BookingsPendingWidget,
  LeadsNewWidget,
  QuotesPendingWidget,
  QuotesAcceptedWidget,
  JobsActiveWidget,
  PaymentsPendingWidget,
  RevenueMonthWidget,
  OrdersTodayWidget,
  SessionsTodayWidget,
  SessionsWeekWidget,
  ActiveClientsWidget,
  ExpiringPackagesWidget,
} from "@/components/dashboard/StatWidgets";
import {
  RecentBookingsTable,
  RecentJobsTable,
  RecentQuotesTable,
  RecentSessionsTable,
} from "@/components/dashboard/TableWidgets";

// Obtener configuración del business type
async function getBusinessTypeConfig() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Obtener business_type del usuario
  let businessType = "restaurant";

  if (user.user_metadata?.business_type) {
    businessType = user.user_metadata.business_type as string;
  } else {
    const { data: client } = await supabase
      .from("clients")
      .select("business_type")
      .eq("auth_user_id", user.id)
      .single();

    if (client) {
      businessType = client.business_type;
    }
  }

  // Obtener configuración
  const { data: config } = await supabase
    .from("business_type_config")
    .select("*")
    .eq("business_type", businessType)
    .single();

  return config as {
    business_type: string;
    label: string;
    visible_sections: string[];
    dashboard_widgets: string[];
  } | null;
}

// Cargar datos de widgets según configuración
async function loadWidgetData(widgetIds: string[]) {
  const data: Record<string, unknown> = {};

  // Cargar en paralelo todos los datos necesarios
  const promises: Promise<void>[] = [];

  if (widgetIds.includes("bookings_today")) {
    promises.push(
      getBookingsToday().then((result) => {
        data.bookings_today = result;
      })
    );
  }

  if (widgetIds.includes("bookings_month") || widgetIds.includes("bookings_pending") || widgetIds.includes("leads_new")) {
    promises.push(
      getDashboardStats().then((result) => {
        data.dashboard_stats = result;
      })
    );
  }

  if (widgetIds.includes("quotes_pending")) {
    promises.push(
      getQuotesPending().then((result) => {
        data.quotes_pending = result;
      })
    );
  }

  if (widgetIds.includes("quotes_accepted")) {
    promises.push(
      getQuotesAccepted().then((result) => {
        data.quotes_accepted = result;
      })
    );
  }

  if (widgetIds.includes("jobs_active")) {
    promises.push(
      getJobsActive().then((result) => {
        data.jobs_active = result;
      })
    );
  }

  if (widgetIds.includes("payments_pending")) {
    promises.push(
      getPaymentsPending().then((result) => {
        data.payments_pending = result;
      })
    );
  }

  if (widgetIds.includes("revenue_month")) {
    promises.push(
      getRevenueMonth().then((result) => {
        data.revenue_month = result;
      })
    );
  }

  // Fitness widgets
  if (widgetIds.includes("sessions_today")) {
    promises.push(
      getSessionsToday().then((result) => {
        data.sessions_today = result;
      })
    );
  }

  if (widgetIds.includes("sessions_week")) {
    promises.push(
      getSessionsWeek().then((result) => {
        data.sessions_week = result;
      })
    );
  }

  if (widgetIds.includes("active_clients")) {
    promises.push(
      getActiveClients().then((result) => {
        data.active_clients = result;
      })
    );
  }

  if (widgetIds.includes("expiring_packages")) {
    promises.push(
      getExpiringPackages().then((result) => {
        data.expiring_packages = result;
      })
    );
  }

  await Promise.all(promises);

  return data;
}

export default async function DashboardPage() {
  // Obtener configuración del business type
  const config = await getBusinessTypeConfig();
  const widgetIds = config?.dashboard_widgets || ["bookings_month", "leads_new", "bookings_pending"];
  const businessType = config?.business_type || "restaurant";

  // Cargar datos de widgets
  const widgetData = await loadWidgetData(widgetIds);
  const stats = (widgetData.dashboard_stats as { bookingsThisMonth: number; newLeads: number; pendingBookings: number }) || {
    bookingsThisMonth: 0,
    newLeads: 0,
    pendingBookings: 0,
  };

  // Cargar tablas según tipo de negocio
  const isRepairsType = businessType === "repairs" || businessType === "realestate";
  const isFitnessType = businessType === "fitness";
  const recentBookings = !isRepairsType && !isFitnessType ? await getRecentBookings(5) : [];
  const recentJobs = isRepairsType ? await getRecentJobs(5) : [];
  const recentQuotes = isRepairsType ? await getRecentQuotes(5) : [];
  const recentSessions = isFitnessType ? await getRecentSessions(5) : [];

  // Renderizar widget según ID
  function renderWidget(widgetId: string) {
    switch (widgetId) {
      case "bookings_today":
        return (
          <BookingsTodayWidget
            key={widgetId}
            count={(widgetData.bookings_today as { count: number })?.count || 0}
          />
        );
      case "bookings_month":
        return <BookingsMonthWidget key={widgetId} count={stats.bookingsThisMonth} />;
      case "bookings_pending":
        return <BookingsPendingWidget key={widgetId} count={stats.pendingBookings} />;
      case "leads_new":
        return <LeadsNewWidget key={widgetId} count={stats.newLeads} />;
      case "quotes_pending":
        const qp = widgetData.quotes_pending as { count: number; totalAmount: number } | undefined;
        return (
          <QuotesPendingWidget
            key={widgetId}
            count={qp?.count || 0}
            totalAmount={qp?.totalAmount || 0}
          />
        );
      case "quotes_accepted":
        const qa = widgetData.quotes_accepted as { count: number; totalAmount: number } | undefined;
        return (
          <QuotesAcceptedWidget
            key={widgetId}
            count={qa?.count || 0}
            totalAmount={qa?.totalAmount || 0}
          />
        );
      case "jobs_active":
        return (
          <JobsActiveWidget
            key={widgetId}
            count={(widgetData.jobs_active as { count: number })?.count || 0}
          />
        );
      case "payments_pending":
        const pp = widgetData.payments_pending as { count: number; totalAmount: number } | undefined;
        return (
          <PaymentsPendingWidget
            key={widgetId}
            count={pp?.count || 0}
            totalAmount={pp?.totalAmount || 0}
          />
        );
      case "revenue_month":
        return (
          <RevenueMonthWidget
            key={widgetId}
            totalAmount={(widgetData.revenue_month as { totalAmount: number })?.totalAmount || 0}
          />
        );
      case "orders_today":
        return <OrdersTodayWidget key={widgetId} count={0} />;
      // Fitness widgets
      case "sessions_today":
        return (
          <SessionsTodayWidget
            key={widgetId}
            count={(widgetData.sessions_today as { count: number })?.count || 0}
          />
        );
      case "sessions_week":
        return (
          <SessionsWeekWidget
            key={widgetId}
            count={(widgetData.sessions_week as { count: number })?.count || 0}
          />
        );
      case "active_clients":
        return (
          <ActiveClientsWidget
            key={widgetId}
            count={(widgetData.active_clients as { count: number })?.count || 0}
          />
        );
      case "expiring_packages":
        const ep = widgetData.expiring_packages as { length: number } | undefined;
        return (
          <ExpiringPackagesWidget
            key={widgetId}
            count={Array.isArray(ep) ? ep.length : 0}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">
          Resumen de tu actividad
        </p>
      </div>

      {/* Stats Grid - Widgets dinámicos */}
      <div className="dashboard-grid mb-8">
        {widgetIds.map((widgetId) => renderWidget(widgetId))}
      </div>

      {/* Tablas según tipo de negocio */}
      {isFitnessType ? (
        <>
          {/* Dashboard para fitness/entrenador personal */}
          <RecentSessionsTable sessions={recentSessions} />

          {/* Acciones rápidas para fitness */}
          <div className="mt-8 neumor-card p-6">
            <h3 className="text-lg font-semibold mb-4">Acciones Rapidas</h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="/dashboard/sesiones"
                className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nueva sesion
              </a>
              <a
                href="/dashboard/clientes"
                className="neumor-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Ver clientes
              </a>
              <a
                href="/dashboard/progreso"
                className="neumor-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Registrar progreso
              </a>
              <a
                href="/dashboard/paquetes"
                className="neumor-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                Nuevo paquete
              </a>
            </div>
          </div>
        </>
      ) : isRepairsType ? (
        <>
          {/* Dashboard para repairs/realestate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RecentQuotesTable quotes={recentQuotes} />
            <RecentJobsTable jobs={recentJobs} />
          </div>

          {/* Acciones rápidas para repairs */}
          <div className="neumor-card p-6">
            <h3 className="text-lg font-semibold mb-4">Acciones Rapidas</h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="/dashboard/presupuestos"
                className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nuevo presupuesto
              </a>
              <a
                href="/dashboard/trabajos"
                className="neumor-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                Ver trabajos
              </a>
              <a
                href="/dashboard/clientes"
                className="neumor-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Ver clientes
              </a>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Dashboard para restaurant/salon/clinic/etc */}
          <RecentBookingsTable bookings={recentBookings} />

          {/* Status Panels */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="neumor-card p-6">
              <h3 className="text-lg font-semibold mb-4">
                Estado de Automatizaciones
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">
                    Notificaciones WhatsApp
                  </span>
                  <span className="badge badge-pending">Pendiente config</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">
                    Confirmacion por Email
                  </span>
                  <span className="badge badge-pending">Pendiente config</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">
                    Recordatorio 24h
                  </span>
                  <span className="badge badge-pending">Pendiente config</span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-4">
                Configura tus automatizaciones en la seccion de Configuracion
              </p>
            </div>

            <div className="neumor-card p-6">
              <h3 className="text-lg font-semibold mb-4">Guia Rapida</h3>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Revisa las reservas entrantes en la seccion Reservas
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Gestiona contactos y consultas en la seccion Leads
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Configura notificaciones automaticas en Configuracion
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
