export interface Customer {
  id: string;
  name: string;
  postal_code: string;
  address: string;
  phone: string;
  email: string;
  contract_type: 'basic' | 'premium' | 'custom';
  snow_removal_area: number; // in square meters
  contract_start_date: string;
  contract_end_date: string;
  billing_amount: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
}

export interface SearchParams {
  id?: string;
  name?: string;
  postal_code?: string;
  address?: string;
  phone?: string;
  contract_type?: string;
}