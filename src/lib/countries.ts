/** Countries available for delivery / pickup */
export const COUNTRIES = [
  'Ghana',
  'Nigeria',
  'Kenya',
  'South Africa',
  'United Kingdom',
  'United States',
  'Canada',
  'Germany',
  'France',
  'Netherlands',
  'United Arab Emirates',
  'Other',
] as const;

export type CountryOption = (typeof COUNTRIES)[number];

/** Pickup stations / hubs (Ghana-first; expand as needed) */
export const PICKUP_STATIONS_GHANA = [
  'Takoradi — Market Circle',
  'Accra — Osu / Ring Road',
  'Accra — Madina',
  'Accra — Lapaz',
  'Accra — Airport / Airport City',
  'Tema — Community 1',
  'Kumasi — Adum',
  'Kumasi — KNUST area',
  'Cape Coast — central',
  'Other — specify below',
] as const;

export const DELIVERY_METHODS = [
  { value: 'delivery' as const, label: 'Home delivery' },
  { value: 'pickup' as const, label: 'Pickup station' },
];
