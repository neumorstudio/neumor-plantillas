/**
 * OpenStatus Component Variants
 *
 * Componente de estado Abierto/Cerrado con múltiples variantes visuales.
 * Calcula automáticamente el estado basado en horarios configurados.
 *
 * Variantes disponibles:
 * - StatusPulse: Badge flotante con efecto "respiración" animada
 * - StatusMorph: Píldora que cambia de forma entre estados
 * - StatusLiquid: Efecto líquido/lava con gradientes animados
 * - StatusTime: Muestra estado + countdown al próximo cambio
 */

export { default as StatusPulse } from "./StatusPulse.astro";
export { default as StatusMorph } from "./StatusMorph.astro";
export { default as StatusLiquid } from "./StatusLiquid.astro";
export { default as StatusTime } from "./StatusTime.astro";
