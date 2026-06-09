export type Role = "farmer" | "buyer" | "admin";
export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";
export type VerificationStatus = "unsubmitted" | "pending" | "approved" | "rejected";
export type ReportStatus = "pending" | "approved" | "rejected";
export type TrackingStatus = "order_placed" | "packed" | "out_for_delivery" | "delivered";

export type UserProfile = {
  id: number;
  username: string;
  role: Role;
  lat: number;
  lng: number;
  name: string;
  mobile: string;
  farm_details: string | null;
  profile_pic: string | null;
  gallery: string[];
  verification_status: VerificationStatus;
  verification_note: string | null;
  kyc_document_url: string | null;
  verified_at: string | null;
  created_at?: string;
};

export type Product = {
  id: number;
  farmer_id: number;
  name: string;
  description: string;
  market_price: number;
  price: number;
  quantity: number;
  unit: string;
  growth_method: string;
  image_path: string | null;
  image_gallery: string[];
  category: string | null;
  harvest_date: string | null;
  is_featured: boolean;
  reserved_quantity?: number;
  created_at?: string;
};

export type ProductInput = {
  name: string;
  description: string;
  market_price: number;
  price: number;
  quantity: number;
  unit: string;
  growth_method: string;
  image_value: string;
  image_gallery?: string[];
  category?: string;
  harvest_date?: string;
  is_featured?: boolean;
};

export type SearchResult = Product & {
  farmer_username: string;
  farmer_name: string;
  farmer_mobile: string;
  farmer_verified: boolean;
  farmer_verification_status: VerificationStatus;
  avg_rating: number;
  review_count: number;
  distance_km?: number;
  distance_label?: string;
};

export type FarmerMapPin = {
  id: number;
  username: string;
  name: string;
  lat: number;
  lng: number;
  avg_rating: number;
  product_count: number;
  verification_status?: VerificationStatus;
};

export type MarketplaceOrder = {
  id: number;
  buyer_id?: number;
  farmer_id: number;
  product_id: number;
  quantity: number;
  status: OrderStatus;
  timestamp: string;
  delivered_timestamp: string | null;
  product_price: number;
  product_unit: string;
  payment_reference: string | null;
  delivery_slot?: string | null;
  tracking_status?: TrackingStatus | string | null;
  tracking_note?: string | null;
  product_name: string;
  farmer_username?: string;
  buyer_username?: string;
  mobile?: string | null;
  review_id?: number | null;
  review_rating?: number | null;
  review_comment?: string | null;
};

export type Review = {
  id?: number;
  reviewer_id?: number;
  reviewed_id: number;
  reviewed_username?: string;
  reviewer_username?: string;
  order_id?: number | null;
  rating: number;
  comment: string;
  moderation_status?: "visible" | "hidden";
  created_at?: string;
};

export type Report = {
  id: number;
  reporter_id: number;
  reporter_username?: string;
  target_type: "farmer" | "product" | "review" | "order";
  target_id: number;
  reason: string;
  details: string | null;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type AuditLog = {
  id: number;
  actor_id: number | null;
  actor_username: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type InventoryReservation = {
  reservation_id: number;
  expires_at: string;
  available_quantity: number;
};

export type FarmerAnalytics = {
  total_orders: number;
  total_units_sold: number;
  total_earnings: number;
  top_product: string;
  sales_by_product: Array<{ name: string; units: number }>;
  sales_history: Array<
    MarketplaceOrder & {
      buyer: string;
      product: string;
      review_status: number;
    }
  >;
  avg_rating: number;
  review_count: number;
};

export type FarmerProfileBundle = {
  farmer: UserProfile;
  products: Product[];
  reviews: Review[];
  avg_rating: number;
};

export type AdminDashboard = {
  metrics: {
    total_users: number;
    total_farmers: number;
    total_buyers: number;
    total_products: number;
    total_orders: number;
    total_revenue: number;
    delivered_orders: number;
    total_reviews: number;
    pending_kyc: number;
    pending_reports: number;
    hidden_reviews: number;
  };
  users: UserProfile[];
  products: Array<Product & { farmer_username: string; farmer_name: string }>;
  orders: Array<
    MarketplaceOrder & {
      buyer_username: string;
      farmer_username: string;
    }
  >;
  reviews: Array<
    Review & {
      reviewer_username: string;
      reviewed_username: string;
    }
  >;
  kyc_requests: UserProfile[];
  reports: Report[];
  audit_logs: AuditLog[];
  logs: Array<{
    id: string;
    type: string;
    actor: string;
    message: string;
    order_id?: number;
    product_name?: string;
    status?: OrderStatus | string;
    reviewed_username?: string;
    rating?: number;
    timestamp: string;
  }>;
};
