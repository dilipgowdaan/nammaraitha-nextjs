"use client";

import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Database,
  Download,
  Edit3,
  FileCheck,
  Filter,
  Flag,
  Heart,
  Image as ImageIcon,
  IndianRupee,
  Languages,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  PackagePlus,
  PackageCheck,
  Save,
  Search,
  ShoppingBasket,
  ShoppingCart,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Star,
  Store,
  Trash2,
  Truck,
  Upload,
  User,
  Users,
  UserPlus,
  Wallet,
  X
} from "lucide-react";
import type { FormEvent, ReactNode, SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FarmersMap } from "./FarmersMap";
import enTranslations from "@/i18n/en.json";
import knTranslations from "@/i18n/kn.json";
import {
  catalogProductImage,
  defaultProductImage,
  productCatalog,
  productCategories
} from "@/lib/productCatalog";
import type {
  AdminDashboard,
  FarmerAnalytics,
  FarmerMapPin,
  FarmerProfileBundle,
  InventoryReservation,
  MarketplaceOrder,
  Product,
  Report,
  Review,
  Role,
  SearchResult,
  TrackingStatus,
  UserProfile
} from "@/lib/types";

type AlertState = {
  type: "success" | "error";
  message: string;
};

type AuthMode = "login" | "register";
type FarmerTab = "overview" | "products" | "orders" | "analytics" | "profile";
type BuyerTab = "market" | "cart" | "farmers" | "orders" | "profile";
type AdminTab = "dashboard" | "users" | "products" | "orders" | "moderation" | "logs";
type Language = "en" | "kn";

type ProductForm = {
  name: string;
  description: string;
  market_price: string;
  price: string;
  quantity: string;
  unit: string;
  growth_method: string;
  image_value: string;
  image_gallery: string[];
  category: string;
  harvest_date: string;
  is_featured: boolean;
};

type RegisterForm = {
  username: string;
  password: string;
  name: string;
  mobile: string;
  role: Role;
  farm_details: string;
  lat: number;
  lng: number;
};

type PaymentDraft = {
  farmer_id: number;
  product_id: number;
  name: string;
  price: number;
  unit: string;
  image_path: string | null;
  quantity: number;
  total: number;
  reservation_id?: number;
  reservation_expires_at?: string;
  delivery_slot: string;
};

type ReviewDraft = {
  review_id?: number;
  farmer_id: number;
  farmer_name: string;
  order_id?: number;
  rating: number;
  comment: string;
};

type CartItem = {
  product: SearchResult;
  quantity: number;
  delivery_slot: string;
  added_at: string;
};

type MarketFilters = {
  category: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  maxDistance: string;
  verifiedOnly: boolean;
  sort: "recommended" | "price_low" | "price_high" | "rating" | "distance";
};

type ReportDraft = {
  target_type: "farmer" | "product" | "review" | "order";
  target_id: number;
  title: string;
  reason: string;
  details: string;
};

type CancelDraft = {
  order_id: number;
  product_name: string;
  buyer_username: string;
  reason: string;
};

type PaymentStage = "idle" | "processing" | "success";

const karnatakaLocations = [
  { label: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { label: "Mysuru", lat: 12.2958, lng: 76.6394 },
  { label: "Hubballi", lat: 15.3647, lng: 75.124 },
  { label: "Mangaluru", lat: 12.9141, lng: 74.856 },
  { label: "Belagavi", lat: 15.8497, lng: 74.4977 }
];

const deliverySlots = [
  "Tomorrow 7 AM - 10 AM",
  "Tomorrow 4 PM - 7 PM",
  "Next day 7 AM - 10 AM",
  "Weekend morning"
];

const trackingSteps: TrackingStatus[] = ["order_placed", "packed", "out_for_delivery", "delivered"];

const emptyMarketFilters: MarketFilters = {
  category: "All",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  maxDistance: "",
  verifiedOnly: false,
  sort: "recommended"
};

const emptyProductForm: ProductForm = {
  name: "Tomato",
  description: "Fresh local harvest, sorted and ready for delivery.",
  market_price: "42",
  price: "34",
  quantity: "60",
  unit: "kg",
  growth_method: "Open field, low chemical use",
  image_value: productCatalog.find((item) => item.name === "Tomato")?.image ?? defaultProductImage,
  image_gallery: [],
  category: "Vegetables",
  harvest_date: "",
  is_featured: true
};

const emptyRegisterForm: RegisterForm = {
  username: "",
  password: "",
  name: "",
  mobile: "",
  role: "farmer",
  farm_details: "",
  lat: 12.9716,
  lng: 77.5946
};

const translations: Record<Language, { nav: Record<string, string>; messages: Record<string, string>; categories: Record<string, string> }> = {
  en: enTranslations,
  kn: knTranslations
};

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.method && options.method !== "GET" && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers ?? {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }

  return payload as T;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function productImage(src?: string | null, productName?: string | null) {
  return src || catalogProductImage(productName) || defaultProductImage;
}

type ProductImageSource = Pick<Product, "image_path" | "image_gallery" | "name">;

function productImageSet(product: ProductImageSource) {
  return Array.from(
    new Set([productImage(product.image_path, product.name), ...(product.image_gallery ?? [])].filter(Boolean))
  ).slice(0, 9);
}

function savingsPercent(product: Pick<Product, "market_price" | "price">) {
  if (!product.market_price || product.market_price <= product.price) return 0;
  return Math.round(((product.market_price - product.price) / product.market_price) * 100);
}

function fallbackImageOnError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = defaultProductImage;
}

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-label={`${rating || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={15}
          strokeWidth={2}
          className={star <= Math.round(rating || 0) ? "star-on" : "star-off"}
          fill="currentColor"
        />
      ))}
    </span>
  );
}

function StatusPill({ status, label }: { status: string; label?: string }) {
  return <span className={`status-pill status-${status}`}>{label ?? status}</span>;
}

function VerificationBadge({ status, label }: { status?: string; label: string }) {
  if (status !== "approved") return null;

  return (
    <span className="verification-badge">
      <BadgeCheck size={14} />
      {label}
    </span>
  );
}

function OrderTracker({
  status,
  labels,
  events = [],
  cancelReason,
  cancelledAt,
  labelForStatus,
  showTimeline = true
}: {
  status?: string | null;
  labels: string[];
  events?: MarketplaceOrder["tracking_events"];
  cancelReason?: string | null;
  cancelledAt?: string | null;
  labelForStatus: (status: string) => string;
  showTimeline?: boolean;
}) {
  const isCancelled = status === "cancelled";
  const lastFulfillmentEvent = [...events].reverse().find((event) => trackingSteps.includes(event.status as TrackingStatus));
  const effectiveStatus = isCancelled ? lastFulfillmentEvent?.status ?? "order_placed" : status ?? "order_placed";
  const current = Math.max(0, trackingSteps.indexOf(effectiveStatus as TrackingStatus));

  return (
    <div className="tracking-block">
      <div className={isCancelled ? "order-tracker cancelled" : "order-tracker"}>
        {trackingSteps.map((step, index) => (
          <span key={step} className={index <= current ? "tracker-step active" : "tracker-step"}>
            {labels[index]}
          </span>
        ))}
      </div>

      {showTimeline && isCancelled && (
        <div className="cancel-note">
          <strong>{labelForStatus("cancelled")}</strong>
          <span>{cancelledAt ? formatDate(cancelledAt) : formatDate(events.find((event) => event.status === "cancelled")?.created_at)}</span>
          {cancelReason && <p>{cancelReason}</p>}
        </div>
      )}

      {showTimeline && !!events.length && (
        <div className="tracking-timeline">
          {events.map((event) => (
            <div className="tracking-event" key={event.id || `${event.status}-${event.created_at}`}>
              <span />
              <div>
                <strong>{labelForStatus(event.status)}</strong>
                <small>{formatDate(event.created_at)}</small>
                {event.note && <p>{event.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}

function StatCard({
  icon,
  label,
  value,
  accent = "green"
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  accent?: "green" | "amber" | "blue" | "rose";
}) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <span className="stat-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function MarketplaceApp() {
  const [language, setLanguage] = useState<Language>("en");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [busy, setBusy] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterForm>(emptyRegisterForm);
  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile: "",
    farm_details: "",
    profile_pic: "",
    new_gallery_item: "",
    lat: 12.9716,
    lng: 77.5946
  });

  const [farmerTab, setFarmerTab] = useState<FarmerTab>("overview");
  const [buyerTab, setBuyerTab] = useState<BuyerTab>("market");
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");

  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] =
    useState<(typeof productCategories)[number]>("Vegetables");
  const [uploadingTarget, setUploadingTarget] = useState<"product" | "profile" | "gallery" | "kyc" | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<MarketplaceOrder[]>([]);
  const [analytics, setAnalytics] = useState<FarmerAnalytics | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketFilters, setMarketFilters] = useState<MarketFilters>(emptyMarketFilters);
  const [marketPage, setMarketPage] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Record<number, SearchResult>>({});
  const [farmers, setFarmers] = useState<FarmerMapPin[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<MarketplaceOrder[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfileBundle | null>(null);
  const [selectedOrderDetailId, setSelectedOrderDetailId] = useState<number | null>(null);
  const [orderQuantities, setOrderQuantities] = useState<Record<number, string>>({});
  const [activeProductImages, setActiveProductImages] = useState<Record<number, string>>({});
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
  const [paymentStage, setPaymentStage] = useState<PaymentStage>("idle");
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [reportDraft, setReportDraft] = useState<ReportDraft | null>(null);
  const [cancelDraft, setCancelDraft] = useState<CancelDraft | null>(null);
  const [kycDraft, setKycDraft] = useState({ document_url: "", note: "" });
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboard | null>(null);

  const t = translations[language].nav;
  const tr = useCallback(
    (text: string) => translations[language].messages[text] ?? text,
    [language]
  );
  const categoryLabel = useCallback(
    (category: string) => translations[language].categories[category] ?? category,
    [language]
  );
  const roleLabel = useCallback(
    (role?: string) => (role ? tr(role.charAt(0).toUpperCase() + role.slice(1)) : ""),
    [tr]
  );
  const statusLabel = useCallback((status: string) => tr(status), [tr]);
  const productNameLabel = useCallback((name: string) => tr(name), [tr]);
  const trackingStatusLabel = useCallback(
    (status: string) => {
      if (status === "order_placed") return tr("Ordered");
      if (status === "packed") return tr("Packed");
      if (status === "out_for_delivery") return tr("Out for delivery");
      if (status === "delivered") return tr("Delivered");
      if (status === "cancelled") return tr("Cancelled");
      return tr(status);
    },
    [tr]
  );
  const adminLogMessage = useCallback(
    (log: AdminDashboard["logs"][number]) => {
      if (log.type === "order") {
        return `${tr("Order")} #${log.order_id}: ${productNameLabel(log.product_name ?? tr("Product"))} - ${statusLabel(
          log.status ?? ""
        )}`;
      }

      if (log.type === "review") {
        return `${tr("Review")}: ${log.reviewed_username ?? tr("Farmer")} ${log.rating ?? ""}/5`;
      }

      return log.message;
    },
    [productNameLabel, statusLabel, tr]
  );

  function activeProductImage(product: ProductImageSource & { id: number }) {
    const images = productImageSet(product);
    return activeProductImages[product.id] ?? images[0] ?? defaultProductImage;
  }

  function chooseProductImage(productId: number, image: string) {
    setActiveProductImages((current) => ({ ...current, [productId]: image }));
  }

  const showAlert = useCallback((message: string, type: AlertState["type"] = "success") => {
    setAlert({ message, type });
    window.setTimeout(() => setAlert(null), 4200);
  }, []);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem("nammaraitha_cart");
      const savedWishlist = window.localStorage.getItem("nammaraitha_wishlist");

      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }

      if (savedWishlist) {
        setWishlistItems(JSON.parse(savedWishlist));
      }
    } catch {
      window.localStorage.removeItem("nammaraitha_cart");
      window.localStorage.removeItem("nammaraitha_wishlist");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nammaraitha_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    window.localStorage.setItem("nammaraitha_wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const user = await requestJson<UserProfile | null>("/api/current_user");
      setCurrentUser(user);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  const loadFarmerDashboard = useCallback(async () => {
    const [productRows, orderRows, analyticsData] = await Promise.all([
      requestJson<Product[]>("/api/my_products"),
      requestJson<MarketplaceOrder[]>("/api/farmer_orders"),
      requestJson<FarmerAnalytics>("/api/farmer_analytics")
    ]);
    setProducts(productRows);
    setFarmerOrders(orderRows);
    setAnalytics(analyticsData);
  }, []);

  const loadBuyerDashboard = useCallback(async () => {
    const [orders, reviews, farmerPins] = await Promise.all([
      requestJson<MarketplaceOrder[]>("/api/buyer_orders"),
      requestJson<Review[]>("/api/my_reviews"),
      requestJson<FarmerMapPin[]>("/api/farmers")
    ]);
    setBuyerOrders(orders);
    setMyReviews(reviews);
    setFarmers(farmerPins);
  }, []);

  const loadAdminDashboard = useCallback(async () => {
    const dashboard = await requestJson<AdminDashboard>("/api/admin/dashboard");
    setAdminDashboard(dashboard);
  }, []);

  const searchProducts = useCallback(async (query = "") => {
    setMarketLoading(true);
    try {
      const params = new URLSearchParams({ query });
      if (currentUser) {
        params.set("lat", String(currentUser.lat));
        params.set("lng", String(currentUser.lng));
      }
      const results = await requestJson<SearchResult[]>(`/api/search_products?${params.toString()}`);
      setSearchResults(results);
      setMarketPage(1);
    } finally {
      setMarketLoading(false);
    }
  }, [currentUser]);

  const loadFarmerProfile = useCallback(
    async (farmerId: number) => {
      try {
        const profile = await requestJson<FarmerProfileBundle>(`/api/farmer_profile/${farmerId}`);
        setSelectedFarmer(profile);
        window.setTimeout(() => {
          document.querySelector(".farmer-profile-view")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      } catch (error) {
        showAlert(error instanceof Error ? tr(error.message) : tr("Farmer profile"), "error");
      }
    },
    [showAlert, tr]
  );

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    if (!currentUser) return;

    setProfileForm({
      name: currentUser.name,
      mobile: currentUser.mobile,
      farm_details: currentUser.farm_details ?? "",
      profile_pic: currentUser.profile_pic ?? "",
      new_gallery_item: "",
      lat: currentUser.lat,
      lng: currentUser.lng
    });
    setKycDraft({
      document_url: currentUser.kyc_document_url ?? "",
      note: currentUser.verification_note ?? ""
    });

    if (currentUser.role === "admin") {
      void loadAdminDashboard();
    } else if (currentUser.role === "farmer") {
      void loadFarmerDashboard();
    } else {
      void loadBuyerDashboard();
      void searchProducts("");
    }
  }, [currentUser, loadAdminDashboard, loadBuyerDashboard, loadFarmerDashboard, searchProducts]);

  useEffect(() => {
    if (!currentUser) return;

    let stopped = false;
    const refreshLiveOrders = async () => {
      if (document.hidden || stopped) return;

      try {
        if (currentUser.role === "farmer") {
          const [orderRows, user] = await Promise.all([
            requestJson<MarketplaceOrder[]>("/api/farmer_orders"),
            requestJson<UserProfile | null>("/api/current_user")
          ]);
          if (!stopped) {
            setFarmerOrders(orderRows);
            if (user) {
              setCurrentUser((existing) => {
                if (!existing) return user;
                if (
                  existing.verification_status === user.verification_status &&
                  existing.verification_note === user.verification_note &&
                  existing.kyc_document_url === user.kyc_document_url &&
                  existing.verified_at === user.verified_at
                ) {
                  return existing;
                }

                return {
                  ...existing,
                  verification_status: user.verification_status,
                  verification_note: user.verification_note,
                  kyc_document_url: user.kyc_document_url,
                  verified_at: user.verified_at
                };
              });
            }
          }
        } else if (currentUser.role === "buyer") {
          const orderRows = await requestJson<MarketplaceOrder[]>("/api/buyer_orders");
          if (!stopped) setBuyerOrders(orderRows);
        } else {
          const dashboard = await requestJson<AdminDashboard>("/api/admin/dashboard");
          if (!stopped) setAdminDashboard(dashboard);
        }
      } catch {
        // Live refresh should stay quiet; manual actions still show explicit errors.
      }
    };

    const refreshMs = currentUser.role === "admin" ? 7000 : 3500;
    const intervalId = window.setInterval(() => void refreshLiveOrders(), refreshMs);
    const handleFocus = () => void refreshLiveOrders();
    window.addEventListener("focus", handleFocus);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentUser?.id, currentUser?.role]);

  const farmerStats = useMemo(() => {
    const lowStock = products.filter((product) => product.quantity > 0 && product.quantity < 10).length;
    const activeOrders = farmerOrders.length;
    return { lowStock, activeOrders };
  }, [farmerOrders.length, products]);

  const filteredMarketResults = useMemo(() => {
    const minPrice = Number(marketFilters.minPrice);
    const maxPrice = Number(marketFilters.maxPrice);
    const minRating = Number(marketFilters.minRating);
    const maxDistance = Number(marketFilters.maxDistance);

    return [...searchResults]
      .filter((product) => marketFilters.category === "All" || product.category === marketFilters.category)
      .filter((product) => !Number.isFinite(minPrice) || !marketFilters.minPrice || product.price >= minPrice)
      .filter((product) => !Number.isFinite(maxPrice) || !marketFilters.maxPrice || product.price <= maxPrice)
      .filter((product) => !Number.isFinite(minRating) || !marketFilters.minRating || product.avg_rating >= minRating)
      .filter(
        (product) =>
          !Number.isFinite(maxDistance) ||
          !marketFilters.maxDistance ||
          typeof product.distance_km !== "number" ||
          product.distance_km <= maxDistance
      )
      .filter((product) => !marketFilters.verifiedOnly || product.farmer_verified)
      .sort((a, b) => {
        if (marketFilters.sort === "price_low") return a.price - b.price;
        if (marketFilters.sort === "price_high") return b.price - a.price;
        if (marketFilters.sort === "rating") return b.avg_rating - a.avg_rating;
        if (marketFilters.sort === "distance") return (a.distance_km ?? 9999) - (b.distance_km ?? 9999);
        return Number(b.is_featured) - Number(a.is_featured) || b.review_count - a.review_count;
      });
  }, [marketFilters, searchResults]);

  const marketPageSize = 9;
  const marketPageCount = Math.max(1, Math.ceil(filteredMarketResults.length / marketPageSize));
  const pagedMarketResults = filteredMarketResults.slice(
    (Math.min(marketPage, marketPageCount) - 1) * marketPageSize,
    Math.min(marketPage, marketPageCount) * marketPageSize
  );
  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  const selectedOrderDetail = useMemo(() => {
    if (!selectedOrderDetailId) return null;
    return (
      farmerOrders.find((order) => order.id === selectedOrderDetailId) ??
      buyerOrders.find((order) => order.id === selectedOrderDetailId) ??
      adminDashboard?.orders.find((order) => order.id === selectedOrderDetailId) ??
      null
    );
  }, [adminDashboard?.orders, buyerOrders, farmerOrders, selectedOrderDetailId]);

  function nextTrackingStatus(order: MarketplaceOrder): TrackingStatus | null {
    if (order.status === "cancelled" || order.status === "delivered") {
      return null;
    }

    const currentIndex = Math.max(0, trackingSteps.indexOf((order.tracking_status as TrackingStatus) || "order_placed"));
    return trackingSteps[currentIndex + 1] ?? null;
  }

  function trackingActionIcon(status: TrackingStatus) {
    if (status === "packed") return <PackageCheck size={17} />;
    if (status === "out_for_delivery") return <Truck size={17} />;
    return <CheckCircle2 size={17} />;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await requestJson<{ success: boolean; message: string; user: UserProfile }>(
        "/api/login",
        {
          method: "POST",
          body: JSON.stringify(loginForm)
        }
      );
      setCurrentUser(response.user);
      showAlert(tr(response.message));
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Login failed."), "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await requestJson<{ success: boolean; message: string }>("/api/register", {
        method: "POST",
        body: JSON.stringify(registerForm)
      });
      showAlert(tr(response.message));
      setAuthMode("login");
      setRegisterForm(emptyRegisterForm);
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Registration failed."), "error");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await requestJson("/api/logout", { method: "POST" });
    setCurrentUser(null);
    setProducts([]);
    setFarmerOrders([]);
    setBuyerOrders([]);
    setSelectedFarmer(null);
    setSelectedOrderDetailId(null);
    showAlert(tr("Logged out."));
  }

  async function requestCurrentDeviceLocation() {
    if (!navigator.geolocation) {
      showAlert(tr("Location is not available in this browser."), "error");
      return;
    }

    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (!window.isSecureContext && !isLocalHost) {
      showAlert(tr("GPS needs HTTPS. Open the deployed Vercel site or localhost."), "error");
      return;
    }

    showAlert(tr("Reading your GPS location..."));
    setGpsBusy(true);

    const readPosition = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    try {
      let position: GeolocationPosition;

      try {
        position = await readPosition({ enableHighAccuracy: true, maximumAge: 0, timeout: 18000 });
      } catch {
        position = await readPosition({ enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 });
      }

      const location = {
        lat: Number(position.coords.latitude.toFixed(5)),
        lng: Number(position.coords.longitude.toFixed(5))
      };
      const accuracy = Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null;

      setRegisterForm((form) => ({ ...form, ...location }));
      setProfileForm((form) => ({ ...form, ...location }));
      setCurrentUser((user) => (user && user.role !== "admin" ? { ...user, ...location } : user));

      if (currentUser && currentUser.role !== "admin") {
        await requestJson("/api/update_profile", {
          method: "POST",
          body: JSON.stringify(location)
        });
        await refreshCurrentUser();

        if (currentUser.role === "buyer") {
          await Promise.all([loadBuyerDashboard(), searchProducts(searchQuery)]).catch(() => null);
        }
      }

      showAlert(
        `${tr("GPS location updated.")}${accuracy ? ` ${tr("Accuracy")}: ${accuracy}m` : ""} - ${location.lat}, ${location.lng}`
      );
    } catch (error) {
      const geolocationError = error as GeolocationPositionError;
      const message =
        geolocationError.code === geolocationError.PERMISSION_DENIED
          ? tr("GPS permission was denied. Allow location access in the browser.")
          : geolocationError.code === geolocationError.POSITION_UNAVAILABLE
            ? tr("GPS signal is unavailable. Turn on device location and try again.")
            : tr("Could not read GPS. Try again on HTTPS or allow precise location.");
      showAlert(message, "error");
    } finally {
      setGpsBusy(false);
    }
  }

  async function uploadImageFile(file: File, target: "product" | "profile" | "gallery" | "kyc") {
    setUploadingTarget(target);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", target);
      const response = await requestJson<{ success: boolean; url: string }>("/api/upload_image", {
        method: "POST",
        body: formData,
        headers: {}
      });
      showAlert(tr("Image uploaded."));
      return response.url;
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Image upload failed."), "error");
      return null;
    } finally {
      setUploadingTarget(null);
    }
  }

  async function handleProductImageUpload(file?: File | null) {
    if (!file) return;
    const url = await uploadImageFile(file, "product");
    if (url) {
      setProductForm((form) => ({
        ...form,
        image_gallery: Array.from(new Set([...form.image_gallery, url])).slice(-8)
      }));
    }
  }

  function removeProductPhoto(url: string) {
    setProductForm((form) => ({
      ...form,
      image_gallery: form.image_gallery.filter((item) => item !== url)
    }));
  }

  async function handleProfileImageUpload(file?: File | null) {
    if (!file) return;
    const url = await uploadImageFile(file, "profile");
    if (url) {
      try {
        setProfileForm((form) => ({ ...form, profile_pic: url }));
        setCurrentUser((user) => (user ? { ...user, profile_pic: url } : user));
        const response = await requestJson<{ success: boolean; message: string; profile_pic?: string | null; gallery?: string[] }>(
          "/api/update_profile",
          {
            method: "POST",
            body: JSON.stringify({ profile_pic: url })
          }
        );
        const nextProfilePic = response.profile_pic ?? url;
        setProfileForm((form) => ({ ...form, profile_pic: nextProfilePic }));
        setCurrentUser((user) => (user ? { ...user, profile_pic: nextProfilePic } : user));
        await refreshCurrentUser();
      } catch (error) {
        showAlert(error instanceof Error ? tr(error.message) : tr("Profile update failed."), "error");
      }
    }
  }

  async function handleGalleryImageUpload(file?: File | null) {
    if (!file) return;
    const url = await uploadImageFile(file, "gallery");
    if (url) {
      try {
        setProfileForm((form) => ({ ...form, new_gallery_item: "" }));
        setCurrentUser((user) =>
          user ? { ...user, gallery: [...user.gallery, url].slice(-40) } : user
        );
        const response = await requestJson<{ success: boolean; message: string; profile_pic?: string | null; gallery?: string[] }>(
          "/api/update_profile",
          {
            method: "POST",
            body: JSON.stringify({ new_gallery_item: url })
          }
        );
        const nextGallery = response.gallery ?? [];
        if (nextGallery.length) {
          setCurrentUser((user) => (user ? { ...user, gallery: nextGallery } : user));
        }
        await refreshCurrentUser();
      } catch (error) {
        showAlert(error instanceof Error ? tr(error.message) : tr("Profile update failed."), "error");
      }
    }
  }

  async function handleKycUpload(file?: File | null) {
    if (!file) return;
    const url = await uploadImageFile(file, "kyc");
    if (url) {
      setKycDraft((draft) => ({ ...draft, document_url: url }));
    }
  }

  async function submitKyc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!kycDraft.document_url) {
      showAlert(tr("Upload a KYC document first."), "error");
      return;
    }

    try {
      const response = await requestJson<{ success: boolean; message: string }>("/api/kyc", {
        method: "POST",
        body: JSON.stringify({
          document_url: kycDraft.document_url,
          note: kycDraft.note
        })
      });
      showAlert(tr(response.message));
      await refreshCurrentUser();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("KYC submission failed."), "error");
    }
  }

  function toggleWishlist(product: SearchResult) {
    setWishlistItems((items) => {
      const next = { ...items };
      if (next[product.id]) {
        delete next[product.id];
        showAlert(tr("Removed from wishlist."));
      } else {
        next[product.id] = product;
        showAlert(tr("Added to wishlist."));
      }
      return next;
    });
  }

  function addToCart(product: SearchResult) {
    const quantity = Math.max(1, Number(orderQuantities[product.id] ?? 1));
    setCartItems((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.quantity, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...items,
        {
          product,
          quantity: Math.min(product.quantity, quantity),
          delivery_slot: deliverySlots[0],
          added_at: new Date().toISOString()
        }
      ];
    });
    showAlert(tr("Added to cart."));
  }

  function updateCartItem(productId: number, updates: Partial<Pick<CartItem, "quantity" | "delivery_slot">>) {
    setCartItems((items) =>
      items.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              ...updates,
              quantity:
                typeof updates.quantity === "number"
                  ? Math.max(1, Math.min(item.product.quantity, updates.quantity))
                  : item.quantity
            }
          : item
      )
    );
  }

  function removeCartItem(productId: number) {
    setCartItems((items) => items.filter((item) => item.product.id !== productId));
  }

  function selectCatalogItem(item: (typeof productCatalog)[number]) {
    setProductForm((form) => ({
      ...form,
      name: item.name,
      category: item.category,
      unit: item.unit,
      growth_method: item.growth_method,
      image_value: item.image,
      image_gallery: form.name === item.name ? form.image_gallery : [],
      description:
        language === "kn"
          ? `${productNameLabel(item.name)} ನನ್ನ ಸ್ಥಳೀಯ ಫಾರ್ಮಿನಿಂದ ತಾಜಾ ಉತ್ಪನ್ನ.`
          : `Fresh ${item.name.toLowerCase()} from my local farm.`
    }));
  }

  function resetProductForm() {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const endpoint = editingProductId ? `/api/update_product/${editingProductId}` : "/api/add_product";
    setBusy(true);

    try {
      const response = await requestJson<{ success: boolean; message: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify(productForm)
      });
      showAlert(tr(response.message));
      resetProductForm();
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Product save failed."), "error");
    } finally {
      setBusy(false);
    }
  }

  function editProduct(product: Product) {
    setEditingProductId(product.id);
    const nextCategory = productCategories.find((category) => category === product.category);
    if (nextCategory) {
      setSelectedProductCategory(nextCategory);
    }
    setProductForm({
      name: product.name,
      description: product.description,
      market_price: String(product.market_price),
      price: String(product.price),
      quantity: String(product.quantity),
      unit: product.unit,
      growth_method: product.growth_method,
      image_value: product.image_path ?? defaultProductImage,
      image_gallery: product.image_gallery ?? [],
      category: product.category ?? "Produce",
      harvest_date: product.harvest_date ?? "",
      is_featured: product.is_featured
    });
    setFarmerTab("products");
  }

  async function updateStock(product: Product, quantity: number) {
    try {
      await requestJson(`/api/update_product/${product.id}`, {
        method: "POST",
        body: JSON.stringify({ quantity })
      });
      showAlert(tr("Stock updated."));
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Stock update failed."), "error");
    }
  }

  async function deleteProduct(product: Product) {
    try {
      await requestJson(`/api/delete_product/${product.id}`, { method: "DELETE" });
      showAlert(`${productNameLabel(product.name)} ${tr("removed.")}`);
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Delete failed."), "error");
    }
  }

  async function markDelivered(orderId: number) {
    try {
      await requestJson(`/api/update_order/${orderId}`, {
        method: "POST",
        body: JSON.stringify({ status: "delivered" })
      });
      showAlert(tr("Order marked delivered."));
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Order update failed."), "error");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await requestJson<{ success: boolean; message: string }>("/api/update_profile", {
        method: "POST",
        body: JSON.stringify(profileForm)
      });
      showAlert(tr(response.message));
      await refreshCurrentUser();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Profile update failed."), "error");
    } finally {
      setBusy(false);
    }
  }

  async function openPayment(
    product: Pick<SearchResult, "id" | "farmer_id" | "name" | "price" | "unit" | "image_path" | "image_gallery" | "quantity">,
    deliverySlot = deliverySlots[0],
    requestedQuantity?: number
  ) {
    const quantity = Number(requestedQuantity ?? orderQuantities[product.id] ?? 1);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      showAlert(tr("Enter a valid quantity."), "error");
      return;
    }

    if (quantity > product.quantity) {
      showAlert(tr("Requested quantity is not available."), "error");
      return;
    }

    setBusy(true);
    try {
      const reservation = await requestJson<InventoryReservation & { success: boolean }>("/api/reserve_inventory", {
        method: "POST",
        body: JSON.stringify({
          farmer_id: product.farmer_id,
          product_id: product.id,
          quantity
        })
      });

      setPaymentStage("idle");
      setPaymentDraft({
        farmer_id: product.farmer_id,
        product_id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image_path: activeProductImage(product),
        quantity,
        total: quantity * product.price,
        reservation_id: reservation.reservation_id,
        reservation_expires_at: reservation.expires_at,
        delivery_slot: deliverySlot
      });
      showAlert(tr("Stock reserved for checkout."));
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Could not reserve stock."), "error");
    } finally {
      setBusy(false);
    }
  }

  async function releasePaymentReservation() {
    if (!paymentDraft?.reservation_id) {
      setPaymentDraft(null);
      setPaymentStage("idle");
      return;
    }

    await requestJson("/api/release_reservation", {
      method: "POST",
      body: JSON.stringify({ reservation_id: paymentDraft.reservation_id })
    }).catch(() => null);
    setPaymentDraft(null);
    setPaymentStage("idle");
  }

  async function confirmPayment(success: boolean) {
    if (!paymentDraft) return;

    if (!success) {
      showAlert(tr("Payment declined."), "error");
      await releasePaymentReservation();
      return;
    }

    setPaymentStage("processing");

    try {
      await wait(1200);
      const response = await requestJson<{ success: boolean; message: string }>("/api/place_order", {
        method: "POST",
        body: JSON.stringify({
          farmer_id: paymentDraft.farmer_id,
          product_id: paymentDraft.product_id,
          quantity: paymentDraft.quantity,
          total_amount: paymentDraft.total,
          reservation_id: paymentDraft.reservation_id,
          delivery_slot: paymentDraft.delivery_slot
        })
      });
      setCartItems((items) => items.filter((item) => item.product.id !== paymentDraft.product_id));
      await Promise.all([searchProducts(searchQuery), loadBuyerDashboard()]);
      if (selectedFarmer) {
        await loadFarmerProfile(selectedFarmer.farmer.id);
      }
      setPaymentStage("success");
      showAlert(tr(response.message));
      await wait(950);
      setPaymentDraft(null);
      setPaymentStage("idle");
      setBuyerTab("orders");
    } catch (error) {
      setPaymentStage("idle");
      showAlert(error instanceof Error ? tr(error.message) : tr("Payment failed."), "error");
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewDraft) return;

    try {
      const response = await requestJson<{ success: boolean; message: string }>("/api/add_review", {
        method: "POST",
        body: JSON.stringify({
          reviewed_id: reviewDraft.farmer_id,
          order_id: reviewDraft.order_id,
          rating: reviewDraft.rating,
          comment: reviewDraft.comment
        })
      });
      showAlert(tr(response.message));
      setReviewDraft(null);
      await loadBuyerDashboard();
      if (selectedFarmer) {
        await loadFarmerProfile(selectedFarmer.farmer.id);
      }
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Review failed."), "error");
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportDraft) return;

    try {
      const response = await requestJson<{ success: boolean; message: string }>("/api/report", {
        method: "POST",
        body: JSON.stringify(reportDraft)
      });
      showAlert(tr(response.message));
      setReportDraft(null);
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Report failed."), "error");
    }
  }

  async function updateTracking(orderId: number, trackingStatus: TrackingStatus) {
    try {
      const response = await requestJson<{ success: boolean; message: string }>(`/api/update_tracking/${orderId}`, {
        method: "POST",
        body: JSON.stringify({
          tracking_status: trackingStatus,
          tracking_note:
            trackingStatus === "packed"
              ? "Farmer packed the order."
              : trackingStatus === "out_for_delivery"
                ? "Farmer has started delivery."
                : "Order delivered to the customer."
        })
      });
      showAlert(tr(response.message));
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Tracking update failed."), "error");
    }
  }

  async function submitCancelOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cancelDraft) return;

    try {
      const response = await requestJson<{ success: boolean; message: string }>(
        `/api/cancel_order/${cancelDraft.order_id}`,
        {
          method: "POST",
          body: JSON.stringify({ cancel_reason: cancelDraft.reason })
        }
      );
      showAlert(tr(response.message));
      setCancelDraft(null);
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Order cancellation failed."), "error");
    }
  }

  async function moderate(targetType: "kyc" | "report" | "review", id: number, action: "approve" | "reject" | "hide" | "restore") {
    try {
      const response = await requestJson<{ success: boolean; message: string }>("/api/admin/moderation", {
        method: "POST",
        body: JSON.stringify({
          target_type: targetType,
          id,
          action
        })
      });
      showAlert(tr(response.message));
      await loadAdminDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Moderation action failed."), "error");
    }
  }

  function exportBackup() {
    window.open("/api/admin/backup", "_blank", "noopener,noreferrer");
  }

  function renderOrderDetailModal() {
    if (!selectedOrderDetail) return null;

    const order = selectedOrderDetail;
    const partyLine =
      currentUser?.role === "farmer"
        ? `${tr("for")} ${order.buyer_username ?? tr("buyer")}`
        : currentUser?.role === "admin"
          ? `${order.buyer_username ?? tr("buyer")} ${tr("from")} ${order.farmer_username ?? tr("Farmer")}`
          : `${tr("from")} ${order.farmer_username ?? tr("Farmer")}`;

    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <section className="modal-card order-detail-card">
          <button className="modal-close" type="button" onClick={() => setSelectedOrderDetailId(null)}>
            <X size={20} />
          </button>
          <div className="modal-icon">
            <ClipboardList size={28} />
          </div>
          <div>
            <p className="eyebrow">{tr("Order details")}</p>
            <h2>{tr("Order")} #{order.id}: {productNameLabel(order.product_name)}</h2>
            <p className="muted">
              {order.quantity} {order.product_unit} {partyLine}
            </p>
          </div>

          <div className="order-detail-summary">
            <span>
              <strong>{tr("Status")}</strong>
              <StatusPill status={order.status} label={statusLabel(order.status)} />
            </span>
            <span>
              <strong>{tr("Total")}</strong>
              {formatMoney(order.quantity * order.product_price)}
            </span>
            <span>
              <strong>{tr("Ordered")}</strong>
              {formatDate(order.timestamp)}
            </span>
            {order.delivery_slot && (
              <span>
                <strong>{tr("Delivery slot")}</strong>
                {tr(order.delivery_slot)}
              </span>
            )}
            {order.payment_reference && (
              <span>
                <strong>{tr("Payment")}</strong>
                {order.payment_reference}
              </span>
            )}
          </div>

          <OrderTracker
            status={order.status === "cancelled" ? "cancelled" : order.tracking_status}
            labels={[tr("Ordered"), tr("Packed"), tr("Out for delivery"), tr("Delivered")]}
            events={order.tracking_events}
            cancelReason={order.cancel_reason}
            cancelledAt={order.cancelled_at}
            labelForStatus={trackingStatusLabel}
          />
        </section>
      </div>
    );
  }

  function renderAuth() {
    return (
      <main className="auth-shell">
        <section className="auth-visual">
          <div className="brand-lockup">
            <span className="brand-mark">
              <Sprout size={30} />
            </span>
            <div>
              <h1>Namma Raitha</h1>
              <p>ನಮ್ಮ ರೈತ</p>
            </div>
          </div>
          <img loading="lazy" decoding="async"
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80"
            alt="Green farm field"
          />
        </section>

        <section className="auth-panel">
          <div className="auth-topline">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setLanguage((value) => (value === "en" ? "kn" : "en"))}
            >
              <Languages size={17} />
              {language === "en" ? "ಕನ್ನಡ" : "EN"}
            </button>
          </div>

          {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

          {authMode === "login" ? (
            <form className="auth-card" onSubmit={handleLogin}>
              <div className="form-heading">
                <LogIn size={24} />
                <h2>{t.loginTitle}</h2>
              </div>
              <label>
                {tr("Username")}
                <input
                  value={loginForm.username}
                  onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                  placeholder={tr("Username")}
                  required
                />
              </label>
              <label>
                {tr("Password")}
                <input
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  placeholder={tr("Password")}
                  type="password"
                  required
                />
              </label>
              <button className="primary-button" type="submit" disabled={busy}>
                <LogIn size={18} />
                {tr("Login")}
              </button>
              <button className="secondary-button" type="button" onClick={() => setAuthMode("register")}>
                <UserPlus size={18} />
                {tr("New user? Register")}
              </button>
            </form>
          ) : (
            <form className="auth-card register-card" onSubmit={handleRegister}>
              <div className="form-heading">
                <UserPlus size={24} />
                <h2>{t.registerTitle}</h2>
              </div>
              <div className="form-grid two">
                <label>
                  {tr("Username")}
                  <input
                    value={registerForm.username}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, username: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {tr("Password")}
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, password: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  {tr("Full name")}
                  <input
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                    required
                  />
                </label>
                <label>
                  {tr("Mobile")}
                  <input
                    value={registerForm.mobile}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, mobile: event.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <div className="segmented">
                {(["farmer", "buyer"] as Role[]).map((role) => (
                  <button
                    key={role}
                    className={registerForm.role === role ? "active" : ""}
                    type="button"
                    onClick={() => setRegisterForm({ ...registerForm, role })}
                  >
                    {role === "farmer" ? <Sprout size={17} /> : <ShoppingBasket size={17} />}
                    {roleLabel(role)}
                  </button>
                ))}
              </div>
              {registerForm.role === "farmer" && (
                <label>
                  {tr("Farm details")}
                  <textarea
                    value={registerForm.farm_details}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, farm_details: event.target.value })
                    }
                    placeholder={
                      language === "kn"
                        ? "ಸಾವಯವ ಟೊಮೇಟೊ, ರಾಗಿ, ತೆಂಗು ಅಥವಾ ನಿಮ್ಮ ಫಾರ್ಮ್ ವಿಶೇಷತೆ"
                        : "Organic tomatoes, ragi, coconut, or your farm specialty"
                    }
                  />
                </label>
              )}
              <div className="location-card">
                <div className="section-title">
                  <MapPin size={18} />
                  <span>
                    {registerForm.lat.toFixed(4)}, {registerForm.lng.toFixed(4)}
                  </span>
                </div>
                <FarmersMap
                  picker
                  height={250}
                  value={{ lat: registerForm.lat, lng: registerForm.lng }}
                  onChange={(location) => setRegisterForm({ ...registerForm, ...location })}
                />
                <div className="location-buttons">
                  {karnatakaLocations.map((location) => (
                    <button
                      key={location.label}
                      type="button"
                      onClick={() => setRegisterForm({ ...registerForm, ...location })}
                    >
                      {location.label}
                    </button>
                  ))}
                  <button type="button" disabled={gpsBusy} onClick={() => void requestCurrentDeviceLocation()}>
                    {gpsBusy ? tr("Reading GPS...") : tr("Use GPS")}
                  </button>
                </div>
              </div>
              <button className="primary-button" type="submit" disabled={busy}>
                <UserPlus size={18} />
                {tr("Create account")}
              </button>
              <button className="secondary-button" type="button" onClick={() => setAuthMode("login")}>
                <LogIn size={18} />
                {tr("Back to login")}
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  function renderFarmerOverview() {
    return (
      <div className="content-stack">
        <div className="stats-grid">
          <StatCard icon={<Store size={22} />} label={tr("Listed products")} value={products.length} />
          <StatCard
            icon={<Truck size={22} />}
            label={tr("Active orders")}
            value={farmerStats.activeOrders}
            accent="amber"
          />
          <StatCard
            icon={<Wallet size={22} />}
            label={tr("Total earnings")}
            value={formatMoney(analytics?.total_earnings ?? 0)}
            accent="blue"
          />
          <StatCard
            icon={<Star size={22} />}
            label={tr("Farmer rating")}
            value={analytics?.avg_rating ? analytics.avg_rating.toFixed(1) : tr("New")}
            accent="rose"
          />
        </div>

        <section className="panel split-panel">
          <div>
            <p className="eyebrow">{tr("Farm profile")}</p>
            <h2>{currentUser?.name}</h2>
            <p className="muted">{currentUser?.farm_details || tr("Farm details not added yet.")}</p>
            <div className="meta-row">
              <span>
                <MapPin size={15} />
                {currentUser?.lat.toFixed(3)}, {currentUser?.lng.toFixed(3)}
              </span>
              <span>
                <BadgeCheck size={15} />
                {analytics?.review_count ?? 0} {tr("Reviews")}
              </span>
              <StatusPill
                status={currentUser?.verification_status ?? "unsubmitted"}
                label={tr(currentUser?.verification_status ?? "unsubmitted")}
              />
            </div>
          </div>
          <button className="primary-button fit" type="button" onClick={() => setFarmerTab("profile")}>
            <Edit3 size={17} />
            {tr("Edit profile")}
          </button>
        </section>

        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-title">
              <h3>{tr("Stock attention")}</h3>
              <span>{farmerStats.lowStock} {tr("low")}</span>
            </div>
            {products.slice(0, 4).map((product) => (
              <div className="mini-row" key={product.id}>
                <img loading="lazy" decoding="async" src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
                <div>
                  <strong>{productNameLabel(product.name)}</strong>
                  <span>
                    {product.quantity} {product.unit} {tr("left")}
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  title={tr("Edit product")}
                  onClick={() => editProduct(product)}
                >
                  <Edit3 size={16} />
                </button>
              </div>
            ))}
            {!products.length && <EmptyState>{tr("No products listed yet.")}</EmptyState>}
          </section>

          <section className="panel">
            <div className="panel-title">
            <h3>{tr("Recent active orders")}</h3>
              <span>{farmerOrders.length}</span>
            </div>
            {farmerOrders.slice(0, 4).map((order) => (
              <div className="mini-row" key={order.id}>
                <span className="mini-icon">
                  <Truck size={17} />
                </span>
                <div>
                  <strong>{productNameLabel(order.product_name)}</strong>
                  <span>
                    {order.quantity} {order.product_unit} {tr("by")} {order.buyer_username}
                  </span>
                </div>
                <StatusPill status={order.status} label={statusLabel(order.status)} />
              </div>
            ))}
            {!farmerOrders.length && <EmptyState>{tr("No active orders.")}</EmptyState>}
          </section>
        </div>
      </div>
    );
  }

  function renderProductManager() {
    const visibleCatalog = productCatalog.filter((item) => item.category === selectedProductCategory);

    return (
      <div className="content-stack">
        <section className="panel">
          <div className="panel-title">
            <h3>{editingProductId ? tr("Edit product") : tr("Add product")}</h3>
            {editingProductId && (
              <button className="ghost-button" type="button" onClick={resetProductForm}>
                <X size={16} />
                {tr("Cancel")}
              </button>
            )}
          </div>

          <div className="category-filter">
            <span>
              <Filter size={17} />
              {tr("Category")}
            </span>
            <div>
              {productCategories.map((category) => (
                <button
                  key={category}
                  className={selectedProductCategory === category ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setSelectedProductCategory(category);
                    const firstProduct = productCatalog.find((item) => item.category === category);
                    if (firstProduct) {
                      selectCatalogItem(firstProduct);
                    }
                  }}
                >
                  {categoryLabel(category)}
                </button>
              ))}
            </div>
          </div>

          <div className="catalog-grid">
            {visibleCatalog.map((item) => (
              <button
                key={item.name}
                className={productForm.name === item.name ? "catalog-card selected" : "catalog-card"}
                type="button"
                onClick={() => selectCatalogItem(item)}
              >
                <img loading="lazy" decoding="async" src={item.image} alt={item.name} onError={fallbackImageOnError} />
                <span>{productNameLabel(item.name)}</span>
              </button>
            ))}
          </div>

          <form className="product-form" onSubmit={saveProduct}>
            <div className="image-upload-panel product-image-panel">
              <figure className="product-default-photo">
                <img loading="lazy" decoding="async"
                  src={productImage(productForm.image_value, productForm.name)}
                  alt={productForm.name || "Product"}
                  onError={fallbackImageOnError}
                />
                <figcaption>{tr("Default")}</figcaption>
              </figure>
              <div>
                <strong>{tr("Product photo")}</strong>
                <p className="muted">{tr("Catalog image stays first. Farmer photos are added beside it.")}</p>
                <div className="upload-actions">
                  <label className="upload-button">
                    <Upload size={17} />
                    {tr("Gallery")}
                    <input
                      accept="image/*"
                      className="file-input"
                      type="file"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = "";
                        void handleProductImageUpload(file);
                      }}
                    />
                  </label>
                  <label className="upload-button">
                    <Camera size={17} />
                    {tr("Camera")}
                    <input
                      accept="image/*"
                      capture="environment"
                      className="file-input"
                      type="file"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = "";
                        void handleProductImageUpload(file);
                      }}
                    />
                  </label>
                  {uploadingTarget === "product" && <span className="muted">{tr("Uploading...")}</span>}
                </div>
                <div className="product-photo-strip" aria-label={tr("Farmer photos")}>
                  {productForm.image_gallery.map((item, index) => (
                    <figure className="product-photo-thumb" key={item}>
                      <img loading="lazy" decoding="async" src={item} alt={`${productForm.name} ${index + 1}`} onError={fallbackImageOnError} />
                      <button
                        aria-label={tr("Remove photo")}
                        className="thumb-remove"
                        type="button"
                        onClick={() => removeProductPhoto(item)}
                      >
                        <X size={14} />
                      </button>
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-grid three">
              <label>
                {tr("Product")}
                <input
                  value={productForm.name}
                  onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                  required
                />
              </label>
              <label>
                {tr("Unit")}
                <input
                  value={productForm.unit}
                  onChange={(event) => setProductForm({ ...productForm, unit: event.target.value })}
                  required
                />
              </label>
              <label>
                {tr("Market price")}
                <input
                  value={productForm.market_price}
                  onChange={(event) =>
                    setProductForm({ ...productForm, market_price: event.target.value })
                  }
                  min="1"
                  type="number"
                  required
                />
              </label>
              <label>
                {tr("Your price")}
                <input
                  value={productForm.price}
                  onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                  min="1"
                  type="number"
                  required
                />
              </label>
              <label>
                {tr("Stock")}
                <input
                  value={productForm.quantity}
                  onChange={(event) =>
                    setProductForm({ ...productForm, quantity: event.target.value })
                  }
                  min="0"
                  type="number"
                  required
                />
              </label>
            </div>
            <div className="form-grid two">
              <label>
                {tr("Growth method")}
                <input
                  value={productForm.growth_method}
                  onChange={(event) =>
                    setProductForm({ ...productForm, growth_method: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                {tr("Harvest date")}
                <input
                  value={productForm.harvest_date}
                  onChange={(event) =>
                    setProductForm({ ...productForm, harvest_date: event.target.value })
                  }
                  type="date"
                />
              </label>
            </div>
            <label>
              {tr("Description")}
              <textarea
                value={productForm.description}
                onChange={(event) =>
                  setProductForm({ ...productForm, description: event.target.value })
                }
                required
              />
            </label>
            <label className="check-row">
              <input
                checked={productForm.is_featured}
                onChange={(event) =>
                  setProductForm({ ...productForm, is_featured: event.target.checked })
                }
                type="checkbox"
              />
              {tr("Featured in buyer search")}
            </label>
            <button className="primary-button fit" type="submit" disabled={busy}>
              <Save size={17} />
              {editingProductId ? tr("Save changes") : tr("Add product")}
            </button>
          </form>
        </section>

        <div className="panel-title reference-title">
          <h3>{tr("Your uploaded products")}</h3>
          <span>{products.length}</span>
        </div>

        <section className="product-list">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-card-media">
                <img loading="lazy" decoding="async" src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
                {!!product.image_gallery?.length && (
                  <div className="product-card-thumbs">
                    {product.image_gallery.map((image, index) => (
                      <img loading="lazy" decoding="async"
                        key={image}
                        src={image}
                        alt={`${product.name} uploaded photo ${index + 1}`}
                        onError={fallbackImageOnError}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="product-card-body">
                <div className="product-title-row">
                  <div>
                    <h3>{productNameLabel(product.name)}</h3>
                    <span>{categoryLabel(product.category || "Produce")}</span>
                  </div>
                  <strong>{formatMoney(product.price)}</strong>
                </div>
                <p>{product.description}</p>
                <div className="meta-row">
                  <span>
                    <Leaf size={15} />
                    {product.growth_method}
                  </span>
                  <span>
                    <Store size={15} />
                    {product.quantity} {product.unit}
                  </span>
                </div>
                <div className="card-actions">
                  <button
                    className="secondary-button fit"
                    type="button"
                    onClick={() => updateStock(product, Math.max(0, product.quantity - 5))}
                  >
                    -5
                  </button>
                  <button
                    className="secondary-button fit"
                    type="button"
                    onClick={() => updateStock(product, product.quantity + 10)}
                  >
                    +10
                  </button>
                  <button className="ghost-button" type="button" onClick={() => editProduct(product)}>
                    <Edit3 size={16} />
                    {tr("Edit")}
                  </button>
                  <button className="danger-button" type="button" onClick={() => deleteProduct(product)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!products.length && <EmptyState>{tr("Add your first product to open your farm store.")}</EmptyState>}
        </section>
      </div>
    );
  }

  function renderFarmerOrders() {
    return (
      <section className="panel">
        <div className="panel-title">
          <h3>{tr("Active orders")}</h3>
          <span>{farmerOrders.length} {tr("pending delivery")}</span>
        </div>
        <div className="order-list">
          {farmerOrders.map((order) => {
            const nextStatus = nextTrackingStatus(order);

            return (
            <article
              className={order.status === "cancelled" ? "order-card clickable-order cancelled-order" : "order-card clickable-order"}
              key={order.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOrderDetailId(order.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedOrderDetailId(order.id);
                }
              }}
            >
              <div>
                <h3>{tr("Order")} #{order.id}: {productNameLabel(order.product_name)}</h3>
                <p>
                  {order.quantity} {order.product_unit} {tr("for")} {order.buyer_username}
                </p>
                <p className="muted">
                  {tr("Mobile")} {order.mobile || "N/A"} - {tr("ordered")} {formatDate(order.timestamp)}
                </p>
                <p className="muted">{tr("Payment")} {order.payment_reference || tr("recorded")}</p>
                {order.delivery_slot && <p className="muted">{tr("Delivery slot")}: {tr(order.delivery_slot)}</p>}
                <OrderTracker
                  status={order.status === "cancelled" ? "cancelled" : order.tracking_status}
                  labels={[tr("Ordered"), tr("Packed"), tr("Out for delivery"), tr("Delivered")]}
                  events={order.tracking_events}
                  cancelReason={order.cancel_reason}
                  cancelledAt={order.cancelled_at}
                  labelForStatus={trackingStatusLabel}
                  showTimeline={false}
                />
              </div>
              <div className="order-side">
                <StatusPill status={order.status} label={statusLabel(order.status)} />
                <strong>{formatMoney(order.quantity * order.product_price)}</strong>
                {nextStatus && (
                  <button
                    className={nextStatus === "delivered" ? "primary-button fit" : "secondary-button fit"}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void updateTracking(order.id, nextStatus);
                    }}
                  >
                    {trackingActionIcon(nextStatus)}
                    {trackingStatusLabel(nextStatus)}
                  </button>
                )}
                {order.status !== "cancelled" && order.status !== "delivered" && (
                  <button
                    className="danger-button fit"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setCancelDraft({
                        order_id: order.id,
                        product_name: order.product_name,
                        buyer_username: order.buyer_username ?? tr("buyer"),
                        reason: ""
                      })
                    }}
                  >
                    <AlertTriangle size={16} />
                    {tr("Cancel request")}
                  </button>
                )}
              </div>
            </article>
            );
          })}
          {!farmerOrders.length && <EmptyState>{tr("No active orders.")}</EmptyState>}
        </div>
      </section>
    );
  }

  function renderAnalytics() {
    const maxUnits = Math.max(...(analytics?.sales_by_product.map((item) => item.units) ?? [1]), 1);

    return (
      <div className="content-stack">
        <div className="stats-grid">
          <StatCard icon={<ClipboardList size={22} />} label={tr("Paid orders")} value={analytics?.total_orders ?? 0} />
          <StatCard
            icon={<PackagePlus size={22} />}
            label={tr("Units sold")}
            value={analytics?.total_units_sold ?? 0}
            accent="amber"
          />
          <StatCard
            icon={<IndianRupee size={22} />}
            label={tr("Earnings")}
            value={formatMoney(analytics?.total_earnings ?? 0)}
            accent="blue"
          />
          <StatCard
            icon={<BadgeCheck size={22} />}
            label={tr("Top product")}
            value={analytics?.top_product ?? "N/A"}
            accent="rose"
          />
        </div>

        <section className="panel">
          <div className="panel-title">
            <h3>{tr("Sales by product")}</h3>
            <span>{analytics?.sales_by_product.length ?? 0} {tr("Products")}</span>
          </div>
          <div className="bar-list">
            {(analytics?.sales_by_product ?? []).map((item) => (
              <div className="bar-row" key={item.name}>
                <span>{productNameLabel(item.name)}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.units / maxUnits) * 100}%` }}>
                    {item.units}
                  </div>
                </div>
              </div>
            ))}
            {!analytics?.sales_by_product.length && <EmptyState>{tr("Sales will appear after orders.")}</EmptyState>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>{tr("Sales history")}</h3>
            <span>{tr("Latest 10")}</span>
          </div>
          <div className="table-like">
            {(analytics?.sales_history ?? []).map((order) => (
              <div className="table-row" key={order.id}>
                <span>#{order.id}</span>
                <strong>{order.product}</strong>
                <span>{order.buyer}</span>
                <span>
                  {order.quantity} {order.product_unit}
                </span>
                <StatusPill status={order.status} label={statusLabel(order.status)} />
                <span>{formatMoney(order.quantity * order.product_price)}</span>
              </div>
            ))}
            {!analytics?.sales_history.length && <EmptyState>{tr("No sales history yet.")}</EmptyState>}
          </div>
        </section>
      </div>
    );
  }

  function renderProfile() {
    const galleryItems = currentUser?.gallery ?? [];
    const latestGalleryItem = profileForm.new_gallery_item || galleryItems[galleryItems.length - 1];

    return (
      <div className="content-stack">
        <section className="panel split-panel profile-main">
          <div className="profile-id">
            <img loading="lazy" decoding="async" src={productImage(profileForm.profile_pic)} alt={currentUser?.name ?? "Profile"} onError={fallbackImageOnError} />
            <div>
              <h2>{currentUser?.name}</h2>
              <p>@{currentUser?.username}</p>
              <span>{roleLabel(currentUser?.role)}</span>
              <VerificationBadge status={currentUser?.verification_status} label={tr("Verified farmer")} />
            </div>
          </div>
          <div className="meta-row">
            <span>
              <MapPin size={15} />
              {profileForm.lat.toFixed(4)}, {profileForm.lng.toFixed(4)}
            </span>
            <span>
              <User size={15} />
              {currentUser?.mobile}
            </span>
          </div>
        </section>

        <form className="panel product-form" onSubmit={saveProfile}>
          <div className="form-grid two">
            <label>
              {tr("Name")}
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              {tr("Mobile")}
              <input
                value={profileForm.mobile}
                onChange={(event) => setProfileForm({ ...profileForm, mobile: event.target.value })}
                required
              />
            </label>
          </div>
          {currentUser?.role === "farmer" && (
            <label>
              {tr("Farm details")}
              <textarea
                value={profileForm.farm_details}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, farm_details: event.target.value })
                }
              />
            </label>
          )}
          <div className="form-grid two">
            <div className="image-upload-panel compact-upload">
              <img loading="lazy" decoding="async" src={productImage(profileForm.profile_pic)} alt="Profile preview" onError={fallbackImageOnError} />
              <div>
                <strong>{tr("Profile photo")}</strong>
                <p className="muted">{tr("Choose a clear face or farm logo photo.")}</p>
                <div className="upload-actions">
                  <label className="upload-button">
                    <Upload size={17} />
                    {tr("Gallery")}
                    <input
                      accept="image/*"
                      className="file-input"
                      type="file"
                      onChange={(event) => void handleProfileImageUpload(event.target.files?.[0])}
                    />
                  </label>
                  <label className="upload-button">
                    <Camera size={17} />
                    {tr("Camera")}
                    <input
                      accept="image/*"
                      capture="user"
                      className="file-input"
                      type="file"
                      onChange={(event) => void handleProfileImageUpload(event.target.files?.[0])}
                    />
                  </label>
                  {uploadingTarget === "profile" && <span className="muted">{tr("Uploading...")}</span>}
                </div>
              </div>
            </div>
            <div className="image-upload-panel compact-upload">
              <img loading="lazy" decoding="async"
                src={productImage(latestGalleryItem)}
                alt="Gallery preview"
                onError={fallbackImageOnError}
              />
              <div>
                <strong>{tr("Gallery photo")}</strong>
                <p className="muted">{tr("Add a farm, crop, harvest, or shop photo.")}</p>
                <div className="upload-actions">
                  <label className="upload-button">
                    <Upload size={17} />
                    {tr("Gallery")}
                    <input
                      accept="image/*"
                      className="file-input"
                      type="file"
                      onChange={(event) => void handleGalleryImageUpload(event.target.files?.[0])}
                    />
                  </label>
                  <label className="upload-button">
                    <Camera size={17} />
                    {tr("Camera")}
                    <input
                      accept="image/*"
                      capture="environment"
                      className="file-input"
                      type="file"
                      onChange={(event) => void handleGalleryImageUpload(event.target.files?.[0])}
                    />
                  </label>
                  {uploadingTarget === "gallery" && <span className="muted">{tr("Uploading...")}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="location-card compact">
            <div className="section-title">
              <MapPin size={18} />
              <span>{tr("Location")}</span>
              <button className="ghost-button fit" type="button" disabled={gpsBusy} onClick={() => void requestCurrentDeviceLocation()}>
                <Navigation size={16} />
                {gpsBusy ? tr("Reading GPS...") : tr("Use GPS")}
              </button>
            </div>
            <FarmersMap
              picker
              height={230}
              value={{ lat: profileForm.lat, lng: profileForm.lng }}
              onChange={(location) => setProfileForm({ ...profileForm, ...location })}
            />
          </div>
          <button className="primary-button fit" type="submit" disabled={busy}>
            <Save size={17} />
            {tr("Save profile")}
          </button>
        </form>

        {currentUser?.role === "farmer" && currentUser.verification_status !== "approved" && (
          <form className="panel product-form" onSubmit={submitKyc}>
            <div className="panel-title">
              <h3>{tr("KYC verification")}</h3>
              <StatusPill status={currentUser.verification_status} label={tr(currentUser.verification_status)} />
            </div>
            <div className="image-upload-panel compact-upload">
              <img loading="lazy" decoding="async" src={productImage(kycDraft.document_url || currentUser.kyc_document_url)} alt="KYC document" onError={fallbackImageOnError} />
              <div>
                <strong>{tr("Verification document")}</strong>
                <p className="muted">{tr("Upload a land record, FPO card, or farm identity proof for admin approval.")}</p>
                <div className="upload-actions">
                  <label className="upload-button">
                    <Upload size={17} />
                    {tr("Upload document")}
                    <input
                      accept="image/*"
                      className="file-input"
                      type="file"
                      onChange={(event) => void handleKycUpload(event.target.files?.[0])}
                    />
                  </label>
                  {uploadingTarget === "kyc" && <span className="muted">{tr("Uploading...")}</span>}
                </div>
              </div>
            </div>
            <label>
              {tr("Admin note")}
              <textarea
                value={kycDraft.note}
                onChange={(event) => setKycDraft({ ...kycDraft, note: event.target.value })}
                placeholder={tr("Example: Land record for Mandya farm attached.")}
              />
            </label>
            {currentUser.verification_note && <p className="muted">{currentUser.verification_note}</p>}
            <button className="primary-button fit" type="submit">
              <FileCheck size={17} />
              {tr("Submit KYC")}
            </button>
          </form>
        )}

        <section className="gallery-grid">
          {galleryItems.map((item) => (
            <figure className="gallery-card" key={item}>
              <img loading="lazy" decoding="async" src={item} alt="Farm gallery item" onError={fallbackImageOnError} />
            </figure>
          ))}
          {!galleryItems.length && (
            <div className="gallery-empty">
              <ImageIcon size={28} />
              <span>{tr("No gallery photos yet")}</span>
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderSelectedFarmerProfile() {
    if (!selectedFarmer) return null;

    const farmerGallery = selectedFarmer.farmer.gallery ?? [];

    return (
      <section className="panel farmer-profile-view">
        <div className="farmer-profile-head">
          <img loading="lazy" decoding="async"
            src={productImage(selectedFarmer.farmer.profile_pic)}
            alt={selectedFarmer.farmer.name}
            onError={fallbackImageOnError}
          />
          <div>
            <p className="eyebrow">{tr("Farmer profile")}</p>
            <h3>{selectedFarmer.farmer.name}</h3>
            <VerificationBadge status={selectedFarmer.farmer.verification_status} label={tr("Verified farmer")} />
            <p>{selectedFarmer.farmer.farm_details || tr("No farm description added.")}</p>
            <div className="meta-row">
              <span>
                <StarsDisplay rating={selectedFarmer.avg_rating} />
                {selectedFarmer.avg_rating ? selectedFarmer.avg_rating.toFixed(1) : tr("New")}
              </span>
              <span>{selectedFarmer.products.length} {tr("Products")}</span>
              <span>{selectedFarmer.reviews.length} {tr("Reviews")}</span>
            </div>
          </div>
          <div className="profile-action-stack">
            <button
              className="icon-button"
              type="button"
              title={tr("Report")}
              onClick={() =>
                setReportDraft({
                  target_type: "farmer",
                  target_id: selectedFarmer.farmer.id,
                  title: selectedFarmer.farmer.name,
                  reason: "Profile concern",
                  details: ""
                })
              }
            >
              <Flag size={18} />
            </button>
            <button className="icon-button" type="button" title={tr("Close")} onClick={() => setSelectedFarmer(null)}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="meta-row">
          <span>
            <MapPin size={15} />
            {selectedFarmer.farmer.lat.toFixed(3)}, {selectedFarmer.farmer.lng.toFixed(3)}
          </span>
          <span>
            <User size={15} />
            {selectedFarmer.farmer.mobile}
          </span>
        </div>

        <div className="panel-title slim-title">
          <h3>{tr("Gallery photos")}</h3>
          <span>{farmerGallery.length}</span>
        </div>
        <div className="farmer-gallery-grid">
          {farmerGallery.map((item) => (
            <figure className="gallery-card" key={item}>
              <img loading="lazy" decoding="async" src={item} alt={selectedFarmer.farmer.name} onError={fallbackImageOnError} />
            </figure>
          ))}
          {!farmerGallery.length && <EmptyState>{tr("No gallery photos yet")}</EmptyState>}
        </div>

        <div className="panel-title slim-title">
          <h3>{tr("Farm products")}</h3>
          <span>{selectedFarmer.products.length}</span>
        </div>
        <div className="market-grid compact-grid">
          {selectedFarmer.products.map((product) => {
            const images = productImageSet(product);
            const activeImage = activeProductImage(product);

            return (
              <article className="market-card" key={product.id}>
                <div className="market-media compact-market-media">
                  <img loading="lazy" decoding="async" src={activeImage} alt={product.name} onError={fallbackImageOnError} />
                </div>
                <div className="market-card-body">
                  <h3>{productNameLabel(product.name)}</h3>
                  {images.length > 1 && (
                    <div className="market-thumbs" aria-label={tr("Farmer photos")}>
                      {images.map((image, index) => (
                        <button
                          key={image}
                          className={activeImage === image ? "market-thumb active" : "market-thumb"}
                          type="button"
                          onClick={() => chooseProductImage(product.id, image)}
                          aria-label={`${product.name} photo ${index + 1}`}
                        >
                          <img loading="lazy" decoding="async" src={image} alt="" onError={fallbackImageOnError} />
                        </button>
                      ))}
                    </div>
                  )}
                  <p>{product.growth_method}</p>
                  <strong>{formatMoney(product.price)} / {product.unit}</strong>
                  <div className="order-row">
                    <input
                      min="1"
                      max={product.quantity}
                      type="number"
                      value={orderQuantities[product.id] ?? "1"}
                      onChange={(event) =>
                        setOrderQuantities({ ...orderQuantities, [product.id]: event.target.value })
                      }
                    />
                    <button
                      className="primary-button fit"
                      type="button"
                      onClick={() => void openPayment(product)}
                    >
                      <ShoppingBasket size={17} />
                      {tr("Order")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="review-list">
          {selectedFarmer.reviews.map((review) => (
            <div className="review-row" key={review.id}>
              <StarsDisplay rating={review.rating} />
              <strong>{review.reviewer_username}</strong>
              <p>{review.comment}</p>
              {review.id && (
                <button
                  className="ghost-button fit"
                  type="button"
                  onClick={() =>
                    setReportDraft({
                      target_type: "review",
                      target_id: review.id ?? 0,
                      title: `${tr("Review")} #${review.id}`,
                      reason: "Fake review",
                      details: ""
                    })
                  }
                >
                  <Flag size={15} />
                  {tr("Report")}
                </button>
              )}
            </div>
          ))}
          {!selectedFarmer.reviews.length && <EmptyState>{tr("No reviews yet.")}</EmptyState>}
        </div>
      </section>
    );
  }

  function renderMarket() {
    return (
      <div className="content-stack">
        <section className="panel search-panel">
          <form
            className="search-row"
            onSubmit={(event) => {
              event.preventDefault();
              void searchProducts(searchQuery);
            }}
          >
            <Search size={20} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={tr("Search tomato, ragi, mango, coconut")}
            />
            <button className="primary-button fit" type="submit">
              {tr("Search")}
            </button>
          </form>
          <div className="filter-panel">
            <span className="section-title">
              <SlidersHorizontal size={17} />
              {tr("Filters")}
            </span>
            <select
              value={marketFilters.category}
              onChange={(event) => {
                setMarketFilters({ ...marketFilters, category: event.target.value });
                setMarketPage(1);
              }}
            >
              <option value="All">{tr("All categories")}</option>
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
            <input
              min="0"
              placeholder={tr("Min price")}
              type="number"
              value={marketFilters.minPrice}
              onChange={(event) => {
                setMarketFilters({ ...marketFilters, minPrice: event.target.value });
                setMarketPage(1);
              }}
            />
            <input
              min="0"
              placeholder={tr("Max price")}
              type="number"
              value={marketFilters.maxPrice}
              onChange={(event) => {
                setMarketFilters({ ...marketFilters, maxPrice: event.target.value });
                setMarketPage(1);
              }}
            />
            <select
              value={marketFilters.minRating}
              onChange={(event) => {
                setMarketFilters({ ...marketFilters, minRating: event.target.value });
                setMarketPage(1);
              }}
            >
              <option value="">{tr("Any rating")}</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
            <input
              min="1"
              placeholder={tr("Max km")}
              type="number"
              value={marketFilters.maxDistance}
              onChange={(event) => {
                setMarketFilters({ ...marketFilters, maxDistance: event.target.value });
                setMarketPage(1);
              }}
            />
            <select
              value={marketFilters.sort}
              onChange={(event) => setMarketFilters({ ...marketFilters, sort: event.target.value as MarketFilters["sort"] })}
            >
              <option value="recommended">{tr("Recommended")}</option>
              <option value="price_low">{tr("Price low to high")}</option>
              <option value="price_high">{tr("Price high to low")}</option>
              <option value="rating">{tr("Top rated")}</option>
              <option value="distance">{tr("Nearest")}</option>
            </select>
            <label className="check-row compact-check">
              <input
                checked={marketFilters.verifiedOnly}
                type="checkbox"
                onChange={(event) => {
                  setMarketFilters({ ...marketFilters, verifiedOnly: event.target.checked });
                  setMarketPage(1);
                }}
              />
              {tr("Verified")}
            </label>
          </div>

        </section>

        {renderSelectedFarmerProfile()}

        <section className="market-grid">
          {marketLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div className="market-card market-skeleton" key={index}>
                <span />
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            ))}

          {!marketLoading && pagedMarketResults.map((product) => {
            const images = productImageSet(product);
            const activeImage = activeProductImage(product);
            const discount = savingsPercent(product);

            return (
              <article className="market-card featured-market-card" key={product.id}>
                <div className="market-media">
                  <img loading="lazy" decoding="async" src={activeImage} alt={product.name} onError={fallbackImageOnError} />
                  {discount > 0 && <span className="market-badge">{discount}% off</span>}
                  <button
                    className={wishlistItems[product.id] ? "floating-icon-button active" : "floating-icon-button"}
                    type="button"
                    title={tr("Wishlist")}
                    onClick={() => toggleWishlist(product)}
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                  {product.is_featured && (
                    <span className="fresh-badge">
                      <Leaf size={14} />
                      {tr("Farm pick")}
                    </span>
                  )}
                </div>

                <div className="market-card-body">
                  <div className="market-card-top">
                    <div>
                      <span className="category-chip">{categoryLabel(product.category || "Produce")}</span>
                      <h3>{productNameLabel(product.name)}</h3>
                    </div>
                    <div className="rating-chip">
                      <StarsDisplay rating={product.avg_rating} />
                      <span>{product.review_count ? product.avg_rating.toFixed(1) : tr("New")}</span>
                    </div>
                  </div>

                  {images.length > 1 && (
                    <div className="market-thumbs" aria-label={tr("Farmer photos")}>
                      {images.map((image, index) => (
                        <button
                          key={image}
                          className={activeImage === image ? "market-thumb active" : "market-thumb"}
                          type="button"
                          onClick={() => chooseProductImage(product.id, image)}
                          aria-label={`${product.name} photo ${index + 1}`}
                        >
                          <img loading="lazy" decoding="async" src={image} alt="" onError={fallbackImageOnError} />
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="market-description">{product.description}</p>

                  <div className="farmer-line">
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => loadFarmerProfile(product.farmer_id)}
                    >
                      {product.farmer_name}
                    </button>
                    <VerificationBadge status={product.farmer_verification_status} label={tr("Verified farmer")} />
                    {product.distance_label && (
                      <span>
                        <MapPin size={15} />
                        {product.distance_label}
                      </span>
                    )}
                    <span>
                      <Store size={15} />
                      {product.quantity} {product.unit} available
                    </span>
                  </div>

                  <div className="market-quality-row">
                    <span>
                      <Leaf size={15} />
                      {product.growth_method}
                    </span>
                  </div>

                  <div className="buy-panel">
                    <div>
                      <span className="price-label">{tr("Market")} <del>{formatMoney(product.market_price)}</del></span>
                      <strong className="discount-price">{formatMoney(product.price)} / {product.unit}</strong>
                    </div>
                    <div className="order-row compact-order-row">
                      <input
                        min="1"
                        max={product.quantity}
                        type="number"
                        value={orderQuantities[product.id] ?? "1"}
                        onChange={(event) =>
                          setOrderQuantities({ ...orderQuantities, [product.id]: event.target.value })
                        }
                      />
                      <button className="secondary-button fit" type="button" onClick={() => addToCart(product)}>
                        <ShoppingCart size={17} />
                        {tr("Cart")}
                      </button>
                      <button className="primary-button fit" type="button" onClick={() => void openPayment(product)}>
                        <ShoppingBasket size={17} />
                        {tr("Order")}
                      </button>
                      <button
                        className="ghost-button fit"
                        type="button"
                        onClick={() =>
                          setReportDraft({
                            target_type: "product",
                            target_id: product.id,
                            title: product.name,
                            reason: "Misleading listing",
                            details: ""
                          })
                        }
                      >
                        <Flag size={16} />
                        {tr("Report")}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!marketLoading && !filteredMarketResults.length && <EmptyState>{tr("No products found.")}</EmptyState>}
        </section>
        {!marketLoading && filteredMarketResults.length > marketPageSize && (
          <div className="pagination-row">
            <button
              className="secondary-button fit"
              type="button"
              disabled={marketPage <= 1}
              onClick={() => setMarketPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft size={16} />
              {tr("Previous")}
            </button>
            <span>
              {marketPage} / {marketPageCount}
            </span>
            <button
              className="secondary-button fit"
              type="button"
              disabled={marketPage >= marketPageCount}
              onClick={() => setMarketPage((page) => Math.min(marketPageCount, page + 1))}
            >
              {tr("Next")}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderFarmerExplorer() {
    return (
      <div className="content-stack">
        <section className="panel">
          <div className="panel-title">
              <h3>{tr("Nearby farmers")}</h3>
            <span>{farmers.length} {tr("farms")}</span>
          </div>
          <FarmersMap
            pins={farmers}
            height={390}
            onSelectFarmer={loadFarmerProfile}
            productLabel={tr("Products")}
            ratingLabel={tr("Rating")}
            newLabel={tr("New")}
          />
        </section>

        <section className="farmer-grid">
          {farmers.map((farmer) => (
            <button
              key={farmer.id}
              className="farmer-card"
              type="button"
              onClick={() => loadFarmerProfile(farmer.id)}
            >
              <span className="mini-icon">
                <Sprout size={18} />
              </span>
              <strong>{farmer.name}</strong>
              <VerificationBadge status={farmer.verification_status} label={tr("Verified farmer")} />
              <span>{farmer.product_count} {tr("Products")}</span>
              <StarsDisplay rating={farmer.avg_rating} />
            </button>
          ))}
        </section>

        {renderSelectedFarmerProfile()}
      </div>
    );
  }

  function renderCart() {
    const wishlist = Object.values(wishlistItems);

    return (
      <div className="content-stack">
        <section className="panel">
          <div className="panel-title">
            <h3>{tr("Cart")}</h3>
            <span>{cartItems.length} {tr("items")} - {formatMoney(cartTotal)}</span>
          </div>
          <div className="cart-list">
            {cartItems.map((item) => (
              <article className="cart-row" key={item.product.id}>
                <img loading="lazy" decoding="async" src={productImage(item.product.image_path, item.product.name)} alt={item.product.name} onError={fallbackImageOnError} />
                <div>
                  <h3>{productNameLabel(item.product.name)}</h3>
                  <p>{item.product.farmer_name}</p>
                  <VerificationBadge status={item.product.farmer_verification_status} label={tr("Verified farmer")} />
                  <strong>{formatMoney(item.product.price)} / {item.product.unit}</strong>
                </div>
                <label>
                  {tr("Quantity")}
                  <input
                    min="1"
                    max={item.product.quantity}
                    type="number"
                    value={item.quantity}
                    onChange={(event) => updateCartItem(item.product.id, { quantity: Number(event.target.value) })}
                  />
                </label>
                <label>
                  {tr("Delivery slot")}
                  <select
                    value={item.delivery_slot}
                    onChange={(event) => updateCartItem(item.product.id, { delivery_slot: event.target.value })}
                  >
                    {deliverySlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {tr(slot)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="cart-actions">
                  <button
                    className="primary-button fit"
                    type="button"
                    onClick={() => void openPayment(item.product, item.delivery_slot, item.quantity)}
                  >
                    <CreditCard size={17} />
                    {tr("Checkout")}
                  </button>
                  <button className="ghost-button fit" type="button" onClick={() => removeCartItem(item.product.id)}>
                    <Trash2 size={16} />
                    {tr("Remove")}
                  </button>
                </div>
              </article>
            ))}
            {!cartItems.length && <EmptyState>{tr("Your cart is empty.")}</EmptyState>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>{tr("Wishlist")}</h3>
            <span>{wishlist.length}</span>
          </div>
          <div className="admin-card-grid">
            {wishlist.map((product) => (
              <article className="admin-product-card" key={product.id}>
                <img loading="lazy" decoding="async" src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
                <div>
                  <h3>{productNameLabel(product.name)}</h3>
                  <p>{product.farmer_name}</p>
                  <strong>{formatMoney(product.price)} / {product.unit}</strong>
                  <div className="card-actions">
                    <button className="secondary-button fit" type="button" onClick={() => addToCart(product)}>
                      <ShoppingCart size={16} />
                      {tr("Cart")}
                    </button>
                    <button className="ghost-button fit" type="button" onClick={() => toggleWishlist(product)}>
                      <Heart size={16} fill="currentColor" />
                      {tr("Remove")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!wishlist.length && <EmptyState>{tr("No wishlist items yet.")}</EmptyState>}
          </div>
        </section>
      </div>
    );
  }

  function renderBuyerOrders() {
    return (
      <section className="panel">
        <div className="panel-title">
          <h3>{tr("Your orders")}</h3>
          <span>{buyerOrders.length}</span>
        </div>
        <div className="order-list">
          {buyerOrders.map((order) => (
            <article
              className={order.status === "cancelled" ? "order-card clickable-order cancelled-order" : "order-card clickable-order"}
              key={order.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOrderDetailId(order.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedOrderDetailId(order.id);
                }
              }}
            >
              <div>
                <h3>{productNameLabel(order.product_name)}</h3>
                <p>
                  {order.quantity} {order.product_unit} {tr("from")} {order.farmer_username}
                </p>
                <p className="muted">{tr("Ordered")} {formatDate(order.timestamp)}</p>
                {order.delivered_timestamp && <p className="muted">{tr("Delivered")} {formatDate(order.delivered_timestamp)}</p>}
                {order.delivery_slot && <p className="muted">{tr("Delivery slot")}: {tr(order.delivery_slot)}</p>}
                <OrderTracker
                  status={order.status === "cancelled" ? "cancelled" : order.tracking_status}
                  labels={[tr("Ordered"), tr("Packed"), tr("Out for delivery"), tr("Delivered")]}
                  events={order.tracking_events}
                  cancelReason={order.cancel_reason}
                  cancelledAt={order.cancelled_at}
                  labelForStatus={trackingStatusLabel}
                  showTimeline={false}
                />
              </div>
              <div className="order-side">
                <StatusPill status={order.status} label={statusLabel(order.status)} />
                <strong>{formatMoney(order.quantity * order.product_price)}</strong>
                <button
                  className="ghost-button fit"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setReportDraft({
                      target_type: "order",
                      target_id: order.id,
                      title: `${tr("Order")} #${order.id}`,
                      reason: "Quality concern",
                      details: ""
                    })
                  }}
                >
                  <Flag size={15} />
                  {tr("Report")}
                </button>
                {order.status === "delivered" && (
                  <button
                    className="secondary-button fit"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setReviewDraft({
                        review_id: order.review_id ?? undefined,
                        farmer_id: order.farmer_id,
                        farmer_name: order.farmer_username ?? "Farmer",
                        order_id: order.id,
                        rating: order.review_rating ?? 5,
                        comment: order.review_comment ?? ""
                      })
                    }}
                  >
                    <Star size={17} />
                    {order.review_id ? tr("Edit review") : tr("Review")}
                  </button>
                )}
              </div>
            </article>
          ))}
          {!buyerOrders.length && <EmptyState>{tr("No purchase history yet.")}</EmptyState>}
        </div>
      </section>
    );
  }

  function renderBuyerProfile() {
    return (
      <div className="content-stack">
        {renderProfile()}
        <section className="panel">
          <div className="panel-title">
            <h3>{tr("Your reviews")}</h3>
            <span>{myReviews.length}</span>
          </div>
          <div className="review-list">
            {myReviews.map((review) => (
              <div className="review-row" key={review.id}>
                <StarsDisplay rating={review.rating} />
                <strong>{review.reviewed_username}</strong>
                <p>{review.comment}</p>
              </div>
            ))}
            {!myReviews.length && <EmptyState>{tr("No reviews submitted yet.")}</EmptyState>}
          </div>
        </section>
      </div>
    );
  }

  function renderAdminPanel() {
    if (!adminDashboard) {
      return (
        <main className="loading-screen inline-loader">
          <ShieldCheck size={30} />
          <span>{tr("Loading admin dashboard")}</span>
        </main>
      );
    }

    if (adminTab === "users") {
      return (
        <section className="panel admin-panel">
          <div className="panel-title">
            <h3>{tr("Users and roles")}</h3>
            <span>{adminDashboard.users.length} {tr("users")}</span>
          </div>
          <div className="admin-table">
            {adminDashboard.users.map((user) => (
              <div className="admin-row" key={user.id}>
                <img loading="lazy" decoding="async" src={productImage(user.profile_pic)} alt={user.name} onError={fallbackImageOnError} />
                <strong>{user.name}</strong>
                <span>@{user.username}</span>
                <StatusPill status={user.role} label={roleLabel(user.role)} />
                <span>{user.mobile}</span>
                <span>
                  {user.lat.toFixed(3)}, {user.lng.toFixed(3)}
                </span>
                <p>{user.farm_details || tr("No details")}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (adminTab === "products") {
      return (
        <section className="panel admin-panel">
          <div className="panel-title">
            <h3>{tr("All products")}</h3>
            <span>{adminDashboard.products.length} {tr("listings")}</span>
          </div>
          <div className="admin-card-grid">
            {adminDashboard.products.map((product) => (
              <article className="admin-product-card" key={product.id}>
                <img loading="lazy" decoding="async" src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
                <div>
                  <h3>{productNameLabel(product.name)}</h3>
                  <p>{product.farmer_name} (@{product.farmer_username})</p>
                  <span>{categoryLabel(product.category || "Produce")}</span>
                  <strong>{formatMoney(product.price)} / {product.unit}</strong>
                  <p>
                    {tr("Stock")}: {product.quantity} - {tr("Market")}: {formatMoney(product.market_price)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (adminTab === "orders") {
      return (
        <section className="panel admin-panel">
          <div className="panel-title">
            <h3>{tr("Order history")}</h3>
            <span>{adminDashboard.orders.length} {tr("orders")}</span>
          </div>
          <div className="table-like admin-orders">
            {adminDashboard.orders.map((order) => (
              <div
                className={order.status === "cancelled" ? "table-row admin-order-row clickable-order cancelled-order" : "table-row admin-order-row clickable-order"}
                key={order.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedOrderDetailId(order.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedOrderDetailId(order.id);
                  }
                }}
              >
                <div className="admin-order-main">
                  <span>#{order.id}</span>
                  <strong>{productNameLabel(order.product_name)}</strong>
                  <span>{order.buyer_username}</span>
                  <span>{order.farmer_username}</span>
                  <StatusPill status={order.status} label={statusLabel(order.status)} />
                  <span>{formatMoney(order.quantity * order.product_price)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (adminTab === "moderation") {
      return (
        <div className="content-stack">
          <section className="panel admin-panel">
            <div className="panel-title">
              <h3>{tr("KYC approvals")}</h3>
              <span>{adminDashboard.kyc_requests.length} {tr("pending")}</span>
            </div>
            <div className="admin-card-grid">
              {adminDashboard.kyc_requests.map((user) => (
                <article className="admin-product-card" key={user.id}>
                  <img loading="lazy" decoding="async" src={productImage(user.profile_pic)} alt={user.name} onError={fallbackImageOnError} />
                  <div>
                    <h3>{user.name}</h3>
                    <p>@{user.username} - {user.mobile}</p>
                    <p>{user.verification_note || tr("No details")}</p>
                    {user.kyc_document_url && (
                      <a className="link-button" href={user.kyc_document_url} target="_blank" rel="noreferrer">
                        <FileCheck size={16} />
                        {tr("View document")}
                      </a>
                    )}
                    <div className="card-actions">
                      <button className="primary-button fit" type="button" onClick={() => void moderate("kyc", user.id, "approve")}>
                        <BadgeCheck size={16} />
                        {tr("Approve")}
                      </button>
                      <button className="danger-button fit" type="button" onClick={() => void moderate("kyc", user.id, "reject")}>
                        <X size={16} />
                        {tr("Reject")}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {!adminDashboard.kyc_requests.length && <EmptyState>{tr("No pending KYC requests.")}</EmptyState>}
            </div>
          </section>

          <section className="panel admin-panel">
            <div className="panel-title">
              <h3>{tr("Reports")}</h3>
              <span>{adminDashboard.reports.filter((report) => report.status === "pending").length} {tr("pending")}</span>
            </div>
            <div className="review-list">
              {adminDashboard.reports.map((report: Report) => (
                <div className="review-row admin-log" key={report.id}>
                  <span>{report.status}</span>
                  <strong>{report.target_type} #{report.target_id}</strong>
                  <p>{report.reason} {report.details ? `- ${report.details}` : ""}</p>
                  <small>{tr("by")} {report.reporter_username ?? "user"} - {formatDate(report.created_at)}</small>
                  {report.status === "pending" && (
                    <div className="card-actions">
                      <button className="primary-button fit" type="button" onClick={() => void moderate("report", report.id, "approve")}>
                        <Check size={16} />
                        {tr("Approve")}
                      </button>
                      <button className="ghost-button fit" type="button" onClick={() => void moderate("report", report.id, "reject")}>
                        <X size={16} />
                        {tr("Reject")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {!adminDashboard.reports.length && <EmptyState>{tr("No reports yet.")}</EmptyState>}
            </div>
          </section>

          <section className="panel admin-panel">
            <div className="panel-title">
              <h3>{tr("Review moderation")}</h3>
              <span>{adminDashboard.reviews.length} {tr("Reviews")}</span>
            </div>
            <div className="review-list">
              {adminDashboard.reviews.slice(0, 30).map((review) => (
                <div className="review-row" key={review.id}>
                  <StarsDisplay rating={review.rating} />
                  <strong>{review.reviewer_username} {"->"} {review.reviewed_username}</strong>
                  <p>{review.comment}</p>
                  <StatusPill status={review.moderation_status ?? "visible"} />
                  <div className="card-actions">
                    <button
                      className="ghost-button fit"
                      type="button"
                      onClick={() =>
                        void moderate("review", review.id ?? 0, review.moderation_status === "hidden" ? "restore" : "hide")
                      }
                    >
                      <AlertTriangle size={16} />
                      {review.moderation_status === "hidden" ? tr("Restore") : tr("Hide")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (adminTab === "logs") {
      return (
        <section className="panel admin-panel">
          <div className="panel-title">
            <h3>{tr("History and logs")}</h3>
            <span>{adminDashboard.logs.length} {tr("recent events")}</span>
            <button className="secondary-button fit" type="button" onClick={exportBackup}>
              <Download size={16} />
              {tr("Export backup")}
            </button>
          </div>
          <div className="review-list">
            {adminDashboard.logs.map((log) => (
              <div className="review-row admin-log" key={log.id}>
                <span>{tr(log.type)}</span>
                <strong>{log.actor}</strong>
                <p>{adminLogMessage(log)}</p>
                <small>{formatDate(log.timestamp)}</small>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <div className="content-stack">
        <div className="stats-grid">
          <StatCard icon={<Users size={22} />} label={tr("Users")} value={adminDashboard.metrics.total_users} />
          <StatCard
            icon={<Sprout size={22} />}
            label={t.farmers}
            value={adminDashboard.metrics.total_farmers}
            accent="amber"
          />
          <StatCard
            icon={<ShoppingBasket size={22} />}
            label={t.orders}
            value={adminDashboard.metrics.total_orders}
            accent="blue"
          />
          <StatCard
            icon={<IndianRupee size={22} />}
            label={tr("Revenue")}
            value={formatMoney(adminDashboard.metrics.total_revenue)}
            accent="rose"
          />
          <StatCard
            icon={<ShieldCheck size={22} />}
            label={tr("Pending KYC")}
            value={adminDashboard.metrics.pending_kyc}
            accent="amber"
          />
          <StatCard
            icon={<Flag size={22} />}
            label={tr("Pending reports")}
            value={adminDashboard.metrics.pending_reports}
            accent="rose"
          />
        </div>

        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-title">
              <h3>{tr("Platform summary")}</h3>
              <span>{tr("Live data")}</span>
            </div>
            <div className="admin-summary-grid">
              <span>{tr("Buyers")}: {adminDashboard.metrics.total_buyers}</span>
              <span>{t.products}: {adminDashboard.metrics.total_products}</span>
              <span>{tr("Delivered")}: {adminDashboard.metrics.delivered_orders}</span>
              <span>{tr("Reviews")}: {adminDashboard.metrics.total_reviews}</span>
              <span>{tr("Hidden reviews")}: {adminDashboard.metrics.hidden_reviews}</span>
            </div>
          </section>
          <section className="panel">
            <div className="panel-title">
              <h3>{tr("Recent activity")}</h3>
              <span>{adminDashboard.logs.length}</span>
            </div>
            {adminDashboard.logs.slice(0, 5).map((log) => (
              <div className="mini-row" key={log.id}>
                <span className="mini-icon">
                  <Database size={17} />
                </span>
                <div>
                  <strong>{log.actor}</strong>
                  <span>{adminLogMessage(log)}</span>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    );
  }

  function renderDashboardContent() {
    if (currentUser?.role === "admin") {
      return renderAdminPanel();
    }

    if (currentUser?.role === "farmer") {
      if (farmerTab === "products") return renderProductManager();
      if (farmerTab === "orders") return renderFarmerOrders();
      if (farmerTab === "analytics") return renderAnalytics();
      if (farmerTab === "profile") return renderProfile();
      return renderFarmerOverview();
    }

    if (buyerTab === "farmers") return renderFarmerExplorer();
    if (buyerTab === "cart") return renderCart();
    if (buyerTab === "orders") return renderBuyerOrders();
    if (buyerTab === "profile") return renderBuyerProfile();
    return renderMarket();
  }

  if (checkingSession) {
    return (
      <main className="loading-screen">
        <Sprout size={34} />
        <span>{tr("Loading Namma Raitha")}</span>
      </main>
    );
  }

  if (!currentUser) {
    return renderAuth();
  }

  const farmerNav = [
    { id: "overview" as FarmerTab, label: t.overview, icon: <Store size={18} /> },
    { id: "products" as FarmerTab, label: t.products, icon: <PackagePlus size={18} /> },
    { id: "orders" as FarmerTab, label: t.orders, icon: <Truck size={18} /> },
    { id: "analytics" as FarmerTab, label: t.analytics, icon: <BarChart3 size={18} /> },
    { id: "profile" as FarmerTab, label: t.profile, icon: <User size={18} /> }
  ];
  const buyerNav = [
    { id: "market" as BuyerTab, label: t.marketplace, icon: <ShoppingBasket size={18} /> },
    { id: "cart" as BuyerTab, label: `${tr("Cart")} (${cartItems.length})`, icon: <ShoppingCart size={18} /> },
    { id: "farmers" as BuyerTab, label: t.farmers, icon: <MapPin size={18} /> },
    { id: "orders" as BuyerTab, label: t.orders, icon: <ClipboardList size={18} /> },
    { id: "profile" as BuyerTab, label: t.profile, icon: <User size={18} /> }
  ];
  const adminNav = [
    { id: "dashboard" as AdminTab, label: tr("Dashboard"), icon: <ShieldCheck size={18} /> },
    { id: "users" as AdminTab, label: tr("Users"), icon: <Users size={18} /> },
    { id: "products" as AdminTab, label: t.products, icon: <PackagePlus size={18} /> },
    { id: "orders" as AdminTab, label: t.orders, icon: <ClipboardList size={18} /> },
    { id: "moderation" as AdminTab, label: tr("Moderation"), icon: <ShieldCheck size={18} /> },
    { id: "logs" as AdminTab, label: tr("Logs"), icon: <Database size={18} /> }
  ];
  const activeNav =
    currentUser.role === "admin" ? adminNav : currentUser.role === "farmer" ? farmerNav : buyerNav;
  const activePageLabel =
    currentUser.role === "admin"
      ? adminNav.find((item) => item.id === adminTab)?.label
      : currentUser.role === "farmer"
      ? farmerNav.find((item) => item.id === farmerTab)?.label
      : buyerNav.find((item) => item.id === buyerTab)?.label;

  return (
    <div className="app-shell">
      <header className="main-header">
        <div className="header-top">
          <button
            className="logo-button"
            type="button"
            onClick={() => {
              if (currentUser.role === "admin") {
                setAdminTab("dashboard");
              } else if (currentUser.role === "farmer") {
                setFarmerTab("overview");
              } else {
                setBuyerTab("market");
              }
            }}
          >
            <Sprout size={25} />
            <span>NAMMA RAITHA</span>
          </button>

          <nav
            className="header-menu"
            aria-label="Main menu"
            onWheel={(event) => {
              const menu = event.currentTarget;
              if (menu.scrollWidth <= menu.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
              event.preventDefault();
              menu.scrollLeft += event.deltaY;
            }}
          >
            {activeNav.map((item) => {
              const isActive =
                currentUser.role === "admin"
                  ? adminTab === item.id
                  : currentUser.role === "farmer"
                    ? farmerTab === item.id
                    : buyerTab === item.id;

              return (
                <button
                  key={item.id}
                  className={isActive ? "active" : ""}
                  type="button"
                  onClick={() => {
                    if (currentUser.role === "admin") {
                      setAdminTab(item.id as AdminTab);
                    } else if (currentUser.role === "farmer") {
                      setFarmerTab(item.id as FarmerTab);
                    } else {
                      setBuyerTab(item.id as BuyerTab);
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="header-actions">
            <button
              className="header-small-button"
              type="button"
              onClick={() => setLanguage((value) => (value === "en" ? "kn" : "en"))}
            >
              <Languages size={16} />
              {language === "en" ? "ಕನ್ನಡ" : "EN"}
            </button>
            <div className="profile-chip" title={currentUser.name}>
              <img loading="lazy" decoding="async" src={productImage(currentUser.profile_pic)} alt={currentUser.name} onError={fallbackImageOnError} />
              <div>
                <strong>{currentUser.name}</strong>
                <span>{roleLabel(currentUser.role)}</span>
              </div>
            </div>
            <button className="header-small-button" type="button" onClick={logout}>
              <LogOut size={16} />
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="workspace-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">{roleLabel(currentUser.role)}</p>
            <h1>{activePageLabel}</h1>
          </div>
          {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}
        </div>
        {renderDashboardContent()}
      </main>

      {renderOrderDetailModal()}

      {paymentDraft && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className={`modal-card payment-card payment-${paymentStage}`}>
            <button className="modal-close" type="button" disabled={paymentStage === "processing"} onClick={() => void releasePaymentReservation()}>
              <X size={20} />
            </button>
            {paymentStage === "processing" ? (
              <div className="payment-state">
                <div className="payment-spinner" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <h2>{tr("Processing payment")}</h2>
                <p>{tr("Securing your order and reserving stock.")}</p>
              </div>
            ) : paymentStage === "success" ? (
              <div className="payment-state">
                <div className="payment-success-icon">
                  <CheckCircle2 size={44} />
                </div>
                <h2>{tr("Payment successful")}</h2>
                <p>{tr("Redirecting to your orders.")}</p>
              </div>
            ) : (
              <>
                <div className="modal-icon">
                  <CreditCard size={28} />
                </div>
                <h2>{tr("Namma Pay")}</h2>
                <img loading="lazy" decoding="async" src={productImage(paymentDraft.image_path, paymentDraft.name)} alt={paymentDraft.name} onError={fallbackImageOnError} />
                <p>
                  {paymentDraft.quantity} {paymentDraft.unit} {tr("of")} {productNameLabel(paymentDraft.name)}
                </p>
                <strong>{formatMoney(paymentDraft.total)}</strong>
                {paymentDraft.reservation_expires_at && (
                  <p className="muted">
                    <Clock size={15} /> {tr("Reserved until")} {formatDate(paymentDraft.reservation_expires_at)}
                  </p>
                )}
                <label>
                  {tr("Delivery slot")}
                  <select
                    value={paymentDraft.delivery_slot}
                    onChange={(event) => setPaymentDraft({ ...paymentDraft, delivery_slot: event.target.value })}
                  >
                    {deliverySlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {tr(slot)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="modal-actions">
                  <button className="primary-button" type="button" onClick={() => void confirmPayment(true)}>
                    <Check size={18} />
                    {tr("Pay")}
                  </button>
                  <button className="danger-button" type="button" onClick={() => void confirmPayment(false)}>
                    <X size={18} />
                    {tr("Decline")}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {cancelDraft && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-card cancel-card" onSubmit={submitCancelOrder}>
            <button className="modal-close" type="button" onClick={() => setCancelDraft(null)}>
              <X size={20} />
            </button>
            <div className="modal-icon danger-icon">
              <AlertTriangle size={28} />
            </div>
            <h2>{tr("Cancel order request")}</h2>
            <p className="muted">
              {productNameLabel(cancelDraft.product_name)} {tr("for")} {cancelDraft.buyer_username}
            </p>
            <label>
              {tr("Cancellation reason")}
              <textarea
                required
                minLength={6}
                maxLength={300}
                value={cancelDraft.reason}
                onChange={(event) => setCancelDraft({ ...cancelDraft, reason: event.target.value })}
                placeholder={tr("Example: Stock damaged during packing, cannot deliver fresh produce.")}
              />
            </label>
            <div className="modal-actions">
              <button className="danger-button" type="submit">
                <AlertTriangle size={17} />
                {tr("Cancel order")}
              </button>
              <button className="ghost-button" type="button" onClick={() => setCancelDraft(null)}>
                <X size={17} />
                {tr("Keep order")}
              </button>
            </div>
          </form>
        </div>
      )}

      {reviewDraft && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-card" onSubmit={submitReview}>
            <button className="modal-close" type="button" onClick={() => setReviewDraft(null)}>
              <X size={20} />
            </button>
            <div className="modal-icon">
              <Camera size={28} />
            </div>
            <h2>{reviewDraft.review_id ? tr("Edit review") : tr("Review")} {reviewDraft.farmer_name}</h2>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setReviewDraft({ ...reviewDraft, rating })}
                >
                  <Star
                    size={25}
                    fill="currentColor"
                    className={rating <= reviewDraft.rating ? "star-on" : "star-off"}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewDraft.comment}
              onChange={(event) => setReviewDraft({ ...reviewDraft, comment: event.target.value })}
              placeholder={tr("Write your review")}
              required
            />
            <button className="primary-button" type="submit">
              <Star size={18} />
              {reviewDraft.review_id ? tr("Update review") : tr("Submit review")}
            </button>
          </form>
        </div>
      )}

      {reportDraft && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-card" onSubmit={submitReport}>
            <button className="modal-close" type="button" onClick={() => setReportDraft(null)}>
              <X size={20} />
            </button>
            <div className="modal-icon">
              <Flag size={28} />
            </div>
            <h2>{tr("Report")} {reportDraft.title}</h2>
            <label>
              {tr("Reason")}
              <select
                value={reportDraft.reason}
                onChange={(event) => setReportDraft({ ...reportDraft, reason: event.target.value })}
              >
                <option value="Misleading listing">{tr("Misleading listing")}</option>
                <option value="Quality concern">{tr("Quality concern")}</option>
                <option value="Unsafe behaviour">{tr("Unsafe behaviour")}</option>
                <option value="Fake review">{tr("Fake review")}</option>
                <option value="Other concern">{tr("Other concern")}</option>
              </select>
            </label>
            <textarea
              value={reportDraft.details}
              onChange={(event) => setReportDraft({ ...reportDraft, details: event.target.value })}
              placeholder={tr("Describe the issue")}
            />
            <button className="primary-button" type="submit">
              <Flag size={18} />
              {tr("Submit report")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
