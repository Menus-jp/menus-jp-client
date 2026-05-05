export interface OrderLink {
  id: number;
  business: number;
  platform: "uber_eats" | "wolt" | "menu" | "demaecan" | "foodpanda" | "custom";
  custom_name?: string;
  url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessInfo {
  id: number;
  business: number;
  description_jp?: string | null;
  description_en?: string | null;
  seating_capacity?: number | null;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: number;
  business: number;
  qr_code_image: string;
  qr_code_url: string;
  url_encoded: string;
  created_at: string;
  updated_at: string;
}

// Business types
export interface BusinessProfile {
  id: number;
  business_name: string;
  category: "restaurant" | "hair_salon" | "barbershop" | "spa" | "gym";
  slug: string;
  phone_number?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  maps_url?: string;
  website?: string;
  plan: "free" | "premium";
  custom_domain?: string;
  is_published: boolean;
  is_active: boolean;
  onboarding_step: number;
  hero_image?: string;
  hero_image_url?: string;
  logo?: string;
  public_url?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  info?: BusinessInfo | null;
  qr_code?: QRCode | null;
}

export interface BusinessHours {
  id: number;
  business: number;
  day_of_week:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  is_closed: boolean;
  opening_time?: string | null;
  closing_time?: string | null;
  last_order_time?: string | null;
  opening_time_2?: string | null;
  closing_time_2?: string | null;
  last_order_time_2?: string | null;
}

export type BulkHoursEntry = Omit<BusinessHours, "id" | "business"> & {
  id?: number;
};

export interface ClosedDay {
  id: number;
  business: number;
  day_of_week:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  reason?: string;
}

export interface MenuCategory {
  id: number;
  business: number;
  name_jp: string;
  name_en: string;
  description_jp?: string;
  description_en?: string;
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemPhoto {
  id: number;
  menu_item: number;
  image: string;
  image_url: string;
  label?: string;
}

export interface MenuItemHours {
  id: number;
  menu_item: number;
  day_of_week:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  is_closed: boolean;
  closed_reason?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface MenuItem {
  id: number;
  business: number;
  category_jp?: string;
  category_en?: string;
  discount_percentage?: string | null;
  discount_start_time?: string | null;
  discount_end_time?: string | null;
  hours?: MenuItemHours[];
  photos?: MenuItemPhoto[];
  created_at: string;
  updated_at: string;
}

export interface ServiceItem {
  id: number;
  business: number;
  name_jp: string;
  name_en: string;
  description_jp?: string;
  description_en?: string;
  duration_minutes: number;
  price: string;
  image?: string;
  image_url?: string;
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingLink {
  id: number;
  business: number;
  platform:
    | "tabelog"
    | "hot_pepper_gourmet"
    | "hot_pepper_beauty"
    | "line_reservation"
    | "open_table"
    | "minimo"
    | "custom";
  custom_name?: string;
  url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: number;
  business: number;
  platform:
    | "instagram"
    | "facebook"
    | "twitter"
    | "youtube"
    | "tiktok"
    | "line"
    | "custom";
  custom_name?: string;
  url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessPhoto {
  id: number;
  business: number;
  image: string;
  image_url: string;
  alt_text_jp?: string;
  alt_text_en?: string;
  is_hero: boolean;
  display_order: number;
  uploaded_at: string;
}

export interface PublicPage {
  id: number;
  business: number;
  public_url: string;
  view_count: number;
  unique_visitors: number;
  last_viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessDetail extends BusinessProfile {
  hours?: BusinessHours[];
  closed_days?: ClosedDay[];
  photos?: BusinessPhoto[];
  menu_items?: MenuItem[];
  service_items?: ServiceItem[];
  booking_links?: BookingLink[];
  social_links?: SocialLink[];
  order_links?: OrderLink[];
  public_page?: PublicPage;
  info?: BusinessInfo | null;
}
