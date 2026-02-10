import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TodaySessionsCard, type TodaySession } from "@/components/dashboard/StatWidgets";
import { describe, expect, it } from "vitest";

const baseSession: TodaySession = {
  id: "sess-1",
  booking_date: "2026-02-10",
  booking_time: "09:30:00",
  status: "confirmed",
  session_notes: null,
  customers: { id: "cust-1", name: "Ana Lopez" },
  trainer_services: { id: "srv-1", name: "Fuerza" },
};

describe("TodaySessionsCard", () => {
  it("renderiza lista cuando hay sesiones", () => {
    const html = renderToStaticMarkup(
      createElement(TodaySessionsCard, { sessions: [baseSession] })
    );

    expect(html).toContain("Hoy");
    expect(html).toContain("Proximas sesiones");
    expect(html).toContain("Ana Lopez");
    expect(html).toContain("Fuerza");
    expect(html).toContain("Iniciar sesion");
  });

  it("renderiza estado vacio cuando no hay sesiones", () => {
    const html = renderToStaticMarkup(
      createElement(TodaySessionsCard, { sessions: [] })
    );

    expect(html).toContain("No tienes sesiones para hoy");
    expect(html).toContain("Abrir calendario");
  });
});
