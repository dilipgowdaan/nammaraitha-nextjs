export type Role = "farmer" | "buyer";
export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

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
  category: string | null;
  harvest_date: string | null;
  is_featured: boolean;
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
  category?: string;
  harvest_date?: string;
  is_featured?: boolean;
};

export type SearchResult = Product & {
  farmer_username: string;
  farmer_name: string;
  farmer_mobile: string;
  avg_rating: number;
  review_count: number;
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
  product_name: string;
  farmer_username?: string;
  buyer_username?: string;
  mobile?: string | null;
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
  created_at?: string;
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
