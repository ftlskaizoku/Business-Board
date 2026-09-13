export type Niche = "restaurant" | "boutique" | "salon" | "prestataire" | "ecommerce" | "autre";
export type BizType = "products" | "services" | "both";

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  niche: Niche;
  custom_niche: string | null;
  type: BizType;
  currency: string;
  track_stock: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_allowed: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  business_id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  created_at: string;
}

export interface Sale {
  id: string;
  business_id: string;
  sale_date: string; // YYYY-MM-DD
  total: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Expense {
  id: string;
  business_id: string;
  expense_date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface AppointmentSlot {
  id: string;
  business_id: string;
  slot_date: string;
  slot_time: string;
  status: "free" | "taken";
  client: string | null;
  service_name: string | null;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  total_spend: number;
  visits: number;
}

export const EXPENSE_CATEGORIES = [
  "Achats marché",
  "Loyer",
  "Personnel",
  "Électricité / eau",
  "Autre",
];
