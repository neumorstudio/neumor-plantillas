import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeumorStudio",
  description: "Sitio web profesional",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get theme from middleware headers
  const headersList = await headers();
  const theme = headersList.get("x-tenant-theme") || "light";

  return (
    <html lang="es" data-theme={theme} className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
