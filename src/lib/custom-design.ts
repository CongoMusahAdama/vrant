/** Shared by the customer form and the admin page — must match backend/models/CustomRequest.js */
export const GARMENT_OPTIONS = [
  { value: 'two_piece_set', label: 'Two-piece set' },
  { value: 'shirt', label: 'Shirt' },
  { value: 'kaftan', label: 'Kaftan' },
  { value: 'smock', label: 'Smock / batakari' },
  { value: 'trousers', label: 'Trousers' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'other', label: 'Something else' },
] as const;

export type GarmentType = (typeof GARMENT_OPTIONS)[number]['value'];

export const CUSTOM_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
] as const;

export type CustomStatus = (typeof CUSTOM_STATUS_OPTIONS)[number]['value'];

export const MAX_DESIGN_IMAGES = 4;

export type CustomRequest = {
  _id: string;
  reference: string;
  name: string;
  phone: string;
  email?: string;
  garmentType: GarmentType;
  description: string;
  sizing?: string;
  fabricPreference?: string;
  budget?: string;
  neededBy?: string;
  images: string[];
  status: CustomStatus;
  adminNotes?: string;
  createdAt: string;
};

export const garmentLabel = (value: string) =>
  GARMENT_OPTIONS.find((o) => o.value === value)?.label ?? value;

export const statusLabel = (value: string) =>
  CUSTOM_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
