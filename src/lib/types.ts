export type Media = {
  id: number;
  url: string;
  thumb: string;
  md: string;
  lg: string;
  alt?: string | null;
  type?: "image" | "video";
  mime_type?: string;
  width?: number | null;
  height?: number | null;
  original_name?: string;
  folder?: string;
  size?: number;
  usages_count?: number;
  created_at?: string;
};

export type User = {
  id: number;
  name: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  role: "admin" | "commercial_user" | "warehouse";
  role_label: string;
  employee_type: "engineer" | "sales" | "warehouse" | null;
  employee_type_label: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  status_label: string;
  status_reason?: string | null;
  approved_at?: string | null;
  last_login_at?: string | null;
  login_count: number;
  created_at: string;
  permissions?: {
    admin: boolean;
    browse_catalog: boolean;
    use_commerce: boolean;
    process_warehouse: boolean;
    manage_website: boolean;
  };
};

export type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  name_en?: string | null;
  slug: string;
  description?: string | null;
  image: Media | null;
  image_id: number | null;
  sort_order: number;
  is_active: boolean;
  show_on_website: boolean;
  products_count?: number;
  children?: Category[];
};

export type Brand = {
  id: number;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  logo: Media | null;
  logo_id: number | null;
  cover: Media | null;
  cover_id: number | null;
  colors: { primary: string | null; secondary: string | null; accent: string | null };
  website_url?: string | null;
  sort_order: number;
  is_active: boolean;
  show_on_website: boolean;
  gallery?: { id: number; media_id: number; image: Media }[];
  products_count?: number;
};

export type Spec = { id?: number; group?: string | null; label: string; value: string };

export type Product = {
  id: number;
  sku: string;
  name: string;
  name_en?: string | null;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  price: string;
  price_syp: string | null;
  unit: string;
  availability: "available" | "out_of_stock" | "inactive";
  availability_label: string;
  is_purchasable: boolean;
  is_active: boolean;
  is_featured: boolean;
  brand?: { id: number; name: string; slug: string; logo: Media | null; color: string | null } | null;
  category?: { id: number; name: string; slug: string; parent_id: number | null } | null;
  image: Media | null;
  images?: { id: number; media_id: number; is_primary: boolean; image: Media }[];
  specifications?: Spec[];
  stock_quantity?: number | null;
  deleted_at?: string | null;
};

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number; per_page: number; from?: number | null; to?: number | null };
};

export type CartItem = {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  slug: string;
  brand: string | null;
  unit: string;
  image: Media | null;
  unit_price: string;
  unit_price_syp: string | null;
  quantity: string;
  line_total: string;
  line_total_syp: string | null;
  is_purchasable: boolean;
  availability: string;
};

export type Cart = {
  id: number;
  currency: string;
  secondary_currency: string;
  max_discount_percent: string;
  items: CartItem[];
  items_count: number;
  subtotal: string;
  subtotal_syp: string | null;
  issues: { item_id: number; message: string }[];
};

export type QuotationItem = {
  id: number;
  line_no: number;
  product_id: number | null;
  sku: string;
  name: string;
  brand_name: string | null;
  unit: string | null;
  image_url: string | null;
  specifications: { label: string; value: string }[] | null;
  unit_price: string;
  unit_price_syp: string | null;
  quantity: string;
  line_total: string;
  line_total_syp: string | null;
};

export type Quotation = {
  id: number;
  number: string;
  status: "draft" | "issued" | "sent_to_warehouse" | "cancelled";
  status_label: string;
  customer_name: string | null;
  project_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  notes: string | null;
  currency: string;
  subtotal: string;
  discount_percent: string;
  discount_amount: string;
  total: string;
  exchange_rate: string | null;
  secondary_currency: string | null;
  subtotal_syp: string | null;
  discount_amount_syp: string | null;
  total_syp: string | null;
  items_count: number;
  issued_at: string;
  valid_until: string;
  created_at: string;
  has_pdf: boolean;
  user?: { id: number; name: string; employee_type: string | null };
  items?: QuotationItem[];
  warehouse_request?: { id: number; number: string; status: string; status_label: string; invoice?: Omit<AdjustedInvoice, "lines"> } | null;
};

export type WarehouseItem = {
  id: number;
  sku: string;
  name: string;
  brand_name: string | null;
  unit: string | null;
  image_url: string | null;
  requested_quantity: string;
  available_quantity: string | null;
  item_status: "pending" | "available" | "partial" | "unavailable";
  note: string | null;
};

/** Quotation re-priced by what the warehouse can actually supply (computed by the backend). */
export type AdjustedInvoice = {
  has_shortage: boolean;
  currency: string;
  exchange_rate: string | null;
  original: { subtotal: string; discount_amount: string; total: string; total_syp: string | null };
  subtotal: string;
  subtotal_syp: string | null;
  discount_percent: string;
  discount_amount: string;
  discount_amount_syp: string | null;
  total: string;
  total_syp: string | null;
  deducted: string;
  deducted_syp: string | null;
  lines: { item_id: number; item_status: string; requested_quantity: string; quantity: string; missing_quantity: string; line_total: string; missing_value: string; missing_value_syp: string | null }[];
};

export type WarehouseRequest = {
  id: number;
  number: string;
  status: string;
  status_label: string;
  allowed_transitions: { value: string; label: string }[];
  can_cancel: boolean;
  requester_notes: string | null;
  warehouse_notes: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  requester?: { id: number; name: string; employee_type_label: string | null };
  assignee?: { id: number; name: string } | null;
  quotation?: { id: number; number: string; customer_name: string | null; project_name: string | null; items_count: number; total: string | null; currency: string };
  items_summary?: { total: number; available: number; partial: number; unavailable: number; pending: number };
  items?: WarehouseItem[];
  invoice?: AdjustedInvoice;
  history?: { id: number; from_status: string | null; to_status: string; to_label: string | null; note: string | null; user: string | null; created_at: string }[];
};

// ------------- Public website (published snapshot) -------------
export type SiteCompany = {
  name: string;
  name_en: string;
  tagline: string;
  description: string;
  vision: string;
  mission: string;
  address: string;
  phone: string;
  phones: string[];
  whatsapp: string;
  email: string;
  working_hours: string;
  map_url: string;
  social: Record<string, string>;
  logo: Media | null;
  extra: { label: string; value: string }[];
};

export type SiteSlide = {
  id: number;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  desktop_image: Media | null;
  mobile_image: Media | null;
  primary_cta: { label: string; url: string } | null;
  secondary_cta: { label: string; url: string } | null;
  text_align: "start" | "center" | "end";
  text_position: "top" | "center" | "bottom";
  overlay_opacity: number;
  text_theme: "light" | "dark";
};

export type SiteBrand = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo: Media | null;
  cover: Media | null;
  colors: { primary: string | null; secondary: string | null; accent: string | null };
  website_url: string | null;
  gallery: Media[];
};

export type SiteProject = {
  id: number;
  title: string;
  slug: string;
  client: string | null;
  location: string | null;
  project_type: string | null;
  year: number | null;
  summary: string | null;
  description: string | null;
  is_featured: boolean;
  cover: Media | null;
  gallery: { image: Media; caption: string | null }[];
};

/** CMS section content is schema-validated on the server; shape varies per section type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export type SiteSection = { id: number; type: string; content: Record<string, Json> };

export type SitePage = {
  slug: string;
  title: string;
  status: string;
  seo: { meta_title: string; meta_description: string | null; og_image: Media | null; indexable: boolean };
  sections: SiteSection[];
};

export type SiteData = {
  company: SiteCompany;
  site: { hero_enabled: boolean; hero_interval_ms: number; announcement: string | null; footer_text: string | null };
  menu: { slug: string; title: string }[];
  slides: SiteSlide[];
  brands: SiteBrand[];
  projects: SiteProject[];
  categories: { id: number; name: string; slug: string; description: string | null; image: Media | null }[];
  pages: Record<string, SitePage>;
};
