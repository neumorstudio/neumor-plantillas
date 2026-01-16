// ReservationForm variants export
export { default as ReservationClassic } from './ReservationClassic.astro';
export { default as ReservationWizard } from './ReservationWizard.astro';
export { default as ReservationModal } from './ReservationModal.astro';
export { default as ReservationModern } from './ReservationModern.astro';

export const reservationVariants = {
  classic: 'ReservationClassic',
  wizard: 'ReservationWizard',
  modal: 'ReservationModal',
  modern: 'ReservationModern',
} as const;

export type ReservationVariant = keyof typeof reservationVariants;
