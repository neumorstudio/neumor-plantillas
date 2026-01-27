import { headers, cookies } from "next/headers";
import { Hero } from "@/components/templates/shared/Hero";
import { Footer } from "@/components/templates/shared/Footer";
import Header from "@/components/templates/shared/Header";
import AppointmentForm from "@/components/templates/shared/AppointmentForm";
import { createClient } from "@/lib/supabase-server";
import { getBookingData } from "@/lib/booking-data";
import type { WebsiteConfig, BusinessType, Theme } from "@/types/tenant";

// Get data for the current tenant
async function getWebsiteData(tenantId: string) {
  const supabase = await createClient();

  const { data: website } = await supabase
    .from("websites")
    .select(
      `
      id,
      config,
      theme,
      clients!inner(business_name, business_type)
    `
    )
    .eq("id", tenantId)
    .single();

  return website;
}

// Check if customer is logged in for this website
async function getCustomerAuth(websiteId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isLoggedIn: false, customerName: undefined };
  }

  // Check if this user has a customer record for this website
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("website_id", websiteId)
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) {
    return { isLoggedIn: false, customerName: undefined };
  }

  return { isLoggedIn: true, customerName: customer.name };
}

export default async function HomePage() {
  const headersList = await headers();
  const cookieStore = await cookies();

  // Try headers first, fallback to cookies
  const tenantId = headersList.get("x-tenant-id") || cookieStore.get("x-tenant-id")?.value;
  const theme = (headersList.get("x-tenant-theme") || cookieStore.get("x-tenant-theme")?.value || "light") as Theme;
  const businessType = (headersList.get("x-business-type") || cookieStore.get("x-business-type")?.value || "restaurant") as BusinessType;

  // If no tenant, show a default page
  if (!tenantId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">NeumorStudio</h1>
          <p className="text-gray-600">Configure un dominio para ver su sitio web.</p>
        </div>
      </main>
    );
  }

  const [website, auth, bookingData] = await Promise.all([
    getWebsiteData(tenantId),
    getCustomerAuth(tenantId),
    getBookingData(tenantId),
  ]);

  if (!website) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Sitio no encontrado</h1>
          <p className="text-gray-600">No se pudo cargar la configuración del sitio.</p>
        </div>
      </main>
    );
  }

  const config = (website.config || {}) as WebsiteConfig;
  // Handle clients relation (can be array or object from Supabase)
  const clientsData = Array.isArray(website.clients)
    ? website.clients[0]
    : website.clients;
  const businessName = config.businessName || clientsData?.business_name || "Mi Negocio";

  // Get variants with defaults
  const variants = {
    hero: config.variants?.hero || "classic",
    footer: config.variants?.footer || "minimal",
  };

  return (
    <>
      <Header
        businessName={businessName}
        businessType={businessType}
        isLoggedIn={auth.isLoggedIn}
        customerName={auth.customerName}
      />

      <main className="min-h-screen flex flex-col" style={{ paddingTop: "60px" }}>
        <Hero
          variant={variants.hero}
          title={config.heroTitle || businessName}
          subtitle={config.heroSubtitle || config.tagline || "Bienvenido a nuestro negocio"}
          ctaText="Reservar"
          ctaLink="#reservar"
          backgroundImage={config.heroImage}
        />

        {/* Business-type specific content */}
        {businessType === "gym" && (
          <>
            {/* Gym: Classes Section */}
            <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center text-white">Nuestras Clases</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { name: "CrossFit", time: "07:00 - 08:00", trainer: "Carlos M." },
                    { name: "Spinning", time: "09:00 - 10:00", trainer: "Ana R." },
                    { name: "Yoga", time: "18:00 - 19:00", trainer: "Laura P." },
                    { name: "HIIT", time: "19:00 - 20:00", trainer: "David G." },
                    { name: "Pilates", time: "10:00 - 11:00", trainer: "María S." },
                    { name: "Boxeo", time: "20:00 - 21:00", trainer: "Pedro L." },
                  ].map((cls, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-white mb-2">{cls.name}</h3>
                      <p className="text-gray-300 text-sm mb-1">{cls.time}</p>
                      <p className="text-gray-400 text-sm">Instructor: {cls.trainer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Gym: Memberships */}
            <section className="py-16 px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center">Membresías</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { name: "Básica", price: "29€/mes", features: ["Acceso al gym", "Vestuarios", "WiFi"] },
                    { name: "Premium", price: "49€/mes", features: ["Todo lo básico", "Clases grupales", "Casillero"] },
                    { name: "VIP", price: "79€/mes", features: ["Todo premium", "Entrenador personal", "Nutricionista"] },
                  ].map((plan, i) => (
                    <div key={i} className={`rounded-xl p-8 border ${i === 1 ? "bg-blue-600 text-white border-blue-500 scale-105" : "bg-white border-gray-200"}`}>
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-3xl font-bold mb-6">{plan.price}</p>
                      <ul className="space-y-2">
                        {plan.features.map((f, j) => (
                          <li key={j} className="flex items-center gap-2">
                            <span>✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {businessType === "restaurant" && (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Nuestra Carta</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Disfruta de los mejores platos preparados con ingredientes frescos y de temporada.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {["Entrantes", "Principales", "Postres", "Bebidas", "Menú del día", "Especialidades"].map((cat, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-xl font-bold mb-2">{cat}</h3>
                    <p className="text-gray-500">Ver opciones →</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {businessType === "salon" && (
          <>
            {/* Show static services only if no catalog configured */}
            {bookingData.serviceCatalog.length === 0 && (
              <section className="py-16 px-4 bg-pink-50">
                <div className="max-w-6xl mx-auto text-center">
                  <h2 className="text-3xl font-bold mb-8">Nuestros Servicios</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { name: "Corte", price: "desde 15€" },
                      { name: "Color", price: "desde 35€" },
                      { name: "Peinado", price: "desde 20€" },
                      { name: "Manicura", price: "desde 12€" },
                      { name: "Tratamientos", price: "desde 25€" },
                      { name: "Maquillaje", price: "desde 30€" },
                    ].map((service, i) => (
                      <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                        <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                        <p className="text-pink-600 font-semibold">{service.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Appointment Form */}
            <AppointmentForm
              websiteId={tenantId}
              serviceCatalog={bookingData.serviceCatalog}
              businessHours={bookingData.businessHours}
              businessHourSlots={bookingData.businessHourSlots}
              professionals={bookingData.professionals}
              professionalCategories={bookingData.professionalCategories}
              specialDays={bookingData.specialDays}
              specialDaySlots={bookingData.specialDaySlots}
              title="Reserva tu Cita"
              subtitle="Elige el servicio, profesional, fecha y hora."
            />
          </>
        )}

        {businessType === "clinic" && (
          <>
            <section className="py-16 px-4">
              <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-8">Especialidades</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {["Medicina General", "Fisioterapia", "Nutrición", "Psicología", "Dermatología", "Pediatría"].map((esp, i) => (
                    <div key={i} className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-blue-800">{esp}</h3>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Appointment Form for clinic */}
            <AppointmentForm
              websiteId={tenantId}
              serviceCatalog={bookingData.serviceCatalog}
              businessHours={bookingData.businessHours}
              businessHourSlots={bookingData.businessHourSlots}
              professionals={bookingData.professionals}
              professionalCategories={bookingData.professionalCategories}
              specialDays={bookingData.specialDays}
              specialDaySlots={bookingData.specialDaySlots}
              title="Solicita tu Cita"
              subtitle="Elige la especialidad, profesional y horario."
            />
          </>
        )}

        {businessType === "repairs" && (
          <section className="py-16 px-4 bg-yellow-50">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Nuestros Servicios</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {["Reformas integrales", "Fontanería", "Electricidad", "Carpintería", "Pintura", "Climatización"].map((service, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
                    <h3 className="text-xl font-bold">{service}</h3>
                    <p className="text-gray-500 mt-2">Solicitar presupuesto →</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {businessType === "store" && (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Categorías</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {["Electrónica", "Hogar", "Moda", "Deportes", "Libros", "Juguetes", "Belleza", "Alimentación"].map((cat, i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-6 hover:bg-gray-200 cursor-pointer transition">
                    <h3 className="text-lg font-bold">{cat}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Default section for unhandled business types */}
        {!["gym", "restaurant", "salon", "clinic", "repairs", "store"].includes(businessType) && (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Nuestros Servicios</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Descubre todo lo que tenemos para ofrecerte. Calidad y profesionalismo en cada servicio.
              </p>
            </div>
          </section>
        )}

        <Footer
          variant={variants.footer}
          businessName={businessName}
          phone={config.phone}
          email={config.email}
          address={config.address}
          socialLinks={config.socialLinks}
        />
      </main>
    </>
  );
}
