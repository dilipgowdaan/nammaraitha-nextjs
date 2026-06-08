"use client";

import {
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  ClipboardList,
  CreditCard,
  Edit3,
  Image as ImageIcon,
  IndianRupee,
  Languages,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  PackagePlus,
  Save,
  Search,
  ShoppingBasket,
  Sprout,
  Star,
  Store,
  Trash2,
  Truck,
  User,
  UserPlus,
  Wallet,
  X
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FarmersMap } from "./FarmersMap";
import { defaultProductImage, productCatalog } from "@/lib/productCatalog";
import type {
  FarmerAnalytics,
  FarmerMapPin,
  FarmerProfileBundle,
  MarketplaceOrder,
  Product,
  Review,
  Role,
  SearchResult,
  UserProfile
} from "@/lib/types";

type AlertState = {
  type: "success" | "error";
  message: string;
};

type AuthMode = "login" | "register";
type FarmerTab = "overview" | "products" | "orders" | "analytics" | "profile";
type BuyerTab = "market" | "farmers" | "orders" | "profile";
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
};

type ReviewDraft = {
  farmer_id: number;
  farmer_name: string;
  order_id?: number;
  rating: number;
  comment: string;
};

const karnatakaLocations = [
  { label: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { label: "Mysuru", lat: 12.2958, lng: 76.6394 },
  { label: "Hubballi", lat: 15.3647, lng: 75.124 },
  { label: "Mangaluru", lat: 12.9141, lng: 74.856 },
  { label: "Belagavi", lat: 15.8497, lng: 74.4977 }
];

const emptyProductForm: ProductForm = {
  name: "Tomato",
  description: "Fresh local harvest, sorted and ready for delivery.",
  market_price: "42",
  price: "34",
  quantity: "60",
  unit: "kg",
  growth_method: "Open field, low chemical use",
  image_value: productCatalog[1].image,
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

const copy = {
  en: {
    loginTitle: "Welcome Back",
    registerTitle: "Join Namma Raitha",
    marketplace: "Marketplace",
    farmers: "Farmers",
    orders: "Orders",
    profile: "Profile",
    analytics: "Analytics",
    products: "Products",
    overview: "Overview",
    logout: "Logout"
  },
  kn: {
    loginTitle: "ಮತ್ತೆ ಸ್ವಾಗತ",
    registerTitle: "ನಮ್ಮ ರೈತ ಸೇರಿ",
    marketplace: "ಮಾರುಕಟ್ಟೆ",
    farmers: "ರೈತರು",
    orders: "ಆರ್ಡರ್",
    profile: "ಪ್ರೊಫೈಲ್",
    analytics: "ಲೆಕ್ಕಾಚಾರ",
    products: "ಉತ್ಪನ್ನಗಳು",
    overview: "ನೋಟ",
    logout: "ನಿರ್ಗಮನ"
  }
};

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.method && options.method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }

  return payload as T;
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

function productImage(src?: string | null) {
  return src || defaultProductImage;
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

function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
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
  const [checkingSession, setCheckingSession] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<MarketplaceOrder[]>([]);
  const [analytics, setAnalytics] = useState<FarmerAnalytics | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [farmers, setFarmers] = useState<FarmerMapPin[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<MarketplaceOrder[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfileBundle | null>(null);
  const [orderQuantities, setOrderQuantities] = useState<Record<number, string>>({});
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);

  const t = copy[language];

  const showAlert = useCallback((message: string, type: AlertState["type"] = "success") => {
    setAlert({ message, type });
    window.setTimeout(() => setAlert(null), 4200);
  }, []);

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

  const searchProducts = useCallback(async (query = "") => {
    const results = await requestJson<SearchResult[]>(
      `/api/search_products?query=${encodeURIComponent(query)}`
    );
    setSearchResults(results);
  }, []);

  const loadFarmerProfile = useCallback(async (farmerId: number) => {
    const profile = await requestJson<FarmerProfileBundle>(`/api/farmer_profile/${farmerId}`);
    setSelectedFarmer(profile);
    setBuyerTab("farmers");
  }, []);

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

    if (currentUser.role === "farmer") {
      void loadFarmerDashboard();
    } else {
      void loadBuyerDashboard();
      void searchProducts("");
    }
  }, [currentUser, loadBuyerDashboard, loadFarmerDashboard, searchProducts]);

  const farmerStats = useMemo(() => {
    const lowStock = products.filter((product) => product.quantity > 0 && product.quantity < 10).length;
    const activeOrders = farmerOrders.length;
    return { lowStock, activeOrders };
  }, [farmerOrders.length, products]);

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
      showAlert(response.message);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Login failed.", "error");
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
      showAlert(response.message);
      setAuthMode("login");
      setRegisterForm(emptyRegisterForm);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Registration failed.", "error");
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
    showAlert("Logged out.");
  }

  function useCurrentDeviceLocation() {
    if (!navigator.geolocation) {
      showAlert("Location is not available in this browser.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRegisterForm((form) => ({
          ...form,
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5))
        }));
      },
      () => showAlert("Could not read device location.", "error")
    );
  }

  function selectCatalogItem(item: (typeof productCatalog)[number]) {
    setProductForm((form) => ({
      ...form,
      name: item.name,
      category: item.category,
      unit: item.unit,
      growth_method: item.growth_method,
      image_value: item.image,
      description: `Fresh ${item.name.toLowerCase()} from my local farm.`
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
      showAlert(response.message);
      resetProductForm();
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Product save failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  function editProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      market_price: String(product.market_price),
      price: String(product.price),
      quantity: String(product.quantity),
      unit: product.unit,
      growth_method: product.growth_method,
      image_value: product.image_path ?? defaultProductImage,
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
      showAlert("Stock updated.");
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Stock update failed.", "error");
    }
  }

  async function deleteProduct(product: Product) {
    try {
      await requestJson(`/api/delete_product/${product.id}`, { method: "DELETE" });
      showAlert(`${product.name} removed.`);
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Delete failed.", "error");
    }
  }

  async function markDelivered(orderId: number) {
    try {
      await requestJson(`/api/update_order/${orderId}`, {
        method: "POST",
        body: JSON.stringify({ status: "delivered" })
      });
      showAlert("Order marked delivered.");
      await loadFarmerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Order update failed.", "error");
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
      showAlert(response.message);
      await refreshCurrentUser();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Profile update failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  function openPayment(product: Pick<SearchResult, "id" | "farmer_id" | "name" | "price" | "unit" | "image_path">) {
    const quantity = Number(orderQuantities[product.id] ?? 1);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      showAlert("Enter a valid quantity.", "error");
      return;
    }

    setPaymentDraft({
      farmer_id: product.farmer_id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      image_path: product.image_path,
      quantity,
      total: quantity * product.price
    });
  }

  async function confirmPayment(success: boolean) {
    if (!paymentDraft) return;

    if (!success) {
      showAlert("Payment declined.", "error");
      setPaymentDraft(null);
      return;
    }

    try {
      const response = await requestJson<{ success: boolean; message: string }>("/api/place_order", {
        method: "POST",
        body: JSON.stringify({
          farmer_id: paymentDraft.farmer_id,
          product_id: paymentDraft.product_id,
          quantity: paymentDraft.quantity,
          total_amount: paymentDraft.total
        })
      });
      showAlert(response.message);
      setPaymentDraft(null);
      await Promise.all([searchProducts(searchQuery), loadBuyerDashboard()]);
      if (selectedFarmer) {
        await loadFarmerProfile(selectedFarmer.farmer.id);
      }
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Payment failed.", "error");
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
      showAlert(response.message);
      setReviewDraft(null);
      await loadBuyerDashboard();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Review failed.", "error");
    }
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
          <img
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
                Username
                <input
                  value={loginForm.username}
                  onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                  placeholder="farmer_01"
                  required
                />
              </label>
              <label>
                Password
                <input
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  placeholder="Password"
                  type="password"
                  required
                />
              </label>
              <button className="primary-button" type="submit" disabled={busy}>
                <LogIn size={18} />
                Login
              </button>
              <button className="secondary-button" type="button" onClick={() => setAuthMode("register")}>
                <UserPlus size={18} />
                New user? Register
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
                  Username
                  <input
                    value={registerForm.username}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, username: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Password
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
                  Full name
                  <input
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Mobile
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
                    {role}
                  </button>
                ))}
              </div>
              {registerForm.role === "farmer" && (
                <label>
                  Farm details
                  <textarea
                    value={registerForm.farm_details}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, farm_details: event.target.value })
                    }
                    placeholder="Organic tomatoes, ragi, coconut, or your farm specialty"
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
                  <button type="button" onClick={useCurrentDeviceLocation}>
                    GPS
                  </button>
                </div>
              </div>
              <button className="primary-button" type="submit" disabled={busy}>
                <UserPlus size={18} />
                Create account
              </button>
              <button className="secondary-button" type="button" onClick={() => setAuthMode("login")}>
                <LogIn size={18} />
                Back to login
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
          <StatCard icon={<Store size={22} />} label="Listed products" value={products.length} />
          <StatCard
            icon={<Truck size={22} />}
            label="Active orders"
            value={farmerStats.activeOrders}
            accent="amber"
          />
          <StatCard
            icon={<Wallet size={22} />}
            label="Total earnings"
            value={formatMoney(analytics?.total_earnings ?? 0)}
            accent="blue"
          />
          <StatCard
            icon={<Star size={22} />}
            label="Farmer rating"
            value={analytics?.avg_rating ? analytics.avg_rating.toFixed(1) : "New"}
            accent="rose"
          />
        </div>

        <section className="panel split-panel">
          <div>
            <p className="eyebrow">Farm profile</p>
            <h2>{currentUser?.name}</h2>
            <p className="muted">{currentUser?.farm_details || "Farm details not added yet."}</p>
            <div className="meta-row">
              <span>
                <MapPin size={15} />
                {currentUser?.lat.toFixed(3)}, {currentUser?.lng.toFixed(3)}
              </span>
              <span>
                <BadgeCheck size={15} />
                {analytics?.review_count ?? 0} reviews
              </span>
            </div>
          </div>
          <button className="primary-button fit" type="button" onClick={() => setFarmerTab("profile")}>
            <Edit3 size={17} />
            Edit profile
          </button>
        </section>

        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-title">
              <h3>Stock attention</h3>
              <span>{farmerStats.lowStock} low</span>
            </div>
            {products.slice(0, 4).map((product) => (
              <div className="mini-row" key={product.id}>
                <img src={productImage(product.image_path)} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <span>
                    {product.quantity} {product.unit} left
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  title="Edit product"
                  onClick={() => editProduct(product)}
                >
                  <Edit3 size={16} />
                </button>
              </div>
            ))}
            {!products.length && <EmptyState>No products listed yet.</EmptyState>}
          </section>

          <section className="panel">
            <div className="panel-title">
              <h3>Recent active orders</h3>
              <span>{farmerOrders.length}</span>
            </div>
            {farmerOrders.slice(0, 4).map((order) => (
              <div className="mini-row" key={order.id}>
                <span className="mini-icon">
                  <Truck size={17} />
                </span>
                <div>
                  <strong>{order.product_name}</strong>
                  <span>
                    {order.quantity} {order.product_unit} by {order.buyer_username}
                  </span>
                </div>
                <StatusPill status={order.status} />
              </div>
            ))}
            {!farmerOrders.length && <EmptyState>No active orders.</EmptyState>}
          </section>
        </div>
      </div>
    );
  }

  function renderProductManager() {
    return (
      <div className="content-stack">
        <section className="panel">
          <div className="panel-title">
            <h3>{editingProductId ? "Edit product" : "Add product"}</h3>
            {editingProductId && (
              <button className="ghost-button" type="button" onClick={resetProductForm}>
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <div className="catalog-grid">
            {productCatalog.map((item) => (
              <button
                key={item.name}
                className={productForm.name === item.name ? "catalog-card selected" : "catalog-card"}
                type="button"
                onClick={() => selectCatalogItem(item)}
              >
                <img src={item.image} alt={item.name} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          <form className="product-form" onSubmit={saveProduct}>
            <div className="form-grid three">
              <label>
                Product
                <input
                  value={productForm.name}
                  onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                  required
                />
              </label>
              <label>
                Category
                <input
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm({ ...productForm, category: event.target.value })
                  }
                />
              </label>
              <label>
                Unit
                <input
                  value={productForm.unit}
                  onChange={(event) => setProductForm({ ...productForm, unit: event.target.value })}
                  required
                />
              </label>
              <label>
                Market price
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
                Your price
                <input
                  value={productForm.price}
                  onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                  min="1"
                  type="number"
                  required
                />
              </label>
              <label>
                Stock
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
                Growth method
                <input
                  value={productForm.growth_method}
                  onChange={(event) =>
                    setProductForm({ ...productForm, growth_method: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Harvest date
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
              Image URL
              <input
                value={productForm.image_value}
                onChange={(event) =>
                  setProductForm({ ...productForm, image_value: event.target.value })
                }
              />
            </label>
            <label>
              Description
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
              Featured in buyer search
            </label>
            <button className="primary-button fit" type="submit" disabled={busy}>
              <Save size={17} />
              {editingProductId ? "Save changes" : "Add product"}
            </button>
          </form>
        </section>

        <section className="product-list">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <img src={productImage(product.image_path)} alt={product.name} />
              <div className="product-card-body">
                <div className="product-title-row">
                  <div>
                    <h3>{product.name}</h3>
                    <span>{product.category || "Produce"}</span>
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
                    Edit
                  </button>
                  <button className="danger-button" type="button" onClick={() => deleteProduct(product)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!products.length && <EmptyState>Add your first product to open your farm store.</EmptyState>}
        </section>
      </div>
    );
  }

  function renderFarmerOrders() {
    return (
      <section className="panel">
        <div className="panel-title">
          <h3>Active orders</h3>
          <span>{farmerOrders.length} pending delivery</span>
        </div>
        <div className="order-list">
          {farmerOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <h3>Order #{order.id}: {order.product_name}</h3>
                <p>
                  {order.quantity} {order.product_unit} for {order.buyer_username}
                </p>
                <p className="muted">
                  Mobile {order.mobile || "N/A"} - ordered {formatDate(order.timestamp)}
                </p>
                <p className="muted">Payment {order.payment_reference || "recorded"}</p>
              </div>
              <div className="order-side">
                <StatusPill status={order.status} />
                <strong>{formatMoney(order.quantity * order.product_price)}</strong>
                <button className="primary-button fit" type="button" onClick={() => markDelivered(order.id)}>
                  <Truck size={17} />
                  Delivered
                </button>
              </div>
            </article>
          ))}
          {!farmerOrders.length && <EmptyState>No active orders right now.</EmptyState>}
        </div>
      </section>
    );
  }

  function renderAnalytics() {
    const maxUnits = Math.max(...(analytics?.sales_by_product.map((item) => item.units) ?? [1]), 1);

    return (
      <div className="content-stack">
        <div className="stats-grid">
          <StatCard icon={<ClipboardList size={22} />} label="Paid orders" value={analytics?.total_orders ?? 0} />
          <StatCard
            icon={<PackagePlus size={22} />}
            label="Units sold"
            value={analytics?.total_units_sold ?? 0}
            accent="amber"
          />
          <StatCard
            icon={<IndianRupee size={22} />}
            label="Earnings"
            value={formatMoney(analytics?.total_earnings ?? 0)}
            accent="blue"
          />
          <StatCard
            icon={<BadgeCheck size={22} />}
            label="Top product"
            value={analytics?.top_product ?? "N/A"}
            accent="rose"
          />
        </div>

        <section className="panel">
          <div className="panel-title">
            <h3>Sales by product</h3>
            <span>{analytics?.sales_by_product.length ?? 0} products</span>
          </div>
          <div className="bar-list">
            {(analytics?.sales_by_product ?? []).map((item) => (
              <div className="bar-row" key={item.name}>
                <span>{item.name}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.units / maxUnits) * 100}%` }}>
                    {item.units}
                  </div>
                </div>
              </div>
            ))}
            {!analytics?.sales_by_product.length && <EmptyState>Sales will appear after orders.</EmptyState>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Sales history</h3>
            <span>Latest 10</span>
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
                <StatusPill status={order.status} />
                <span>{formatMoney(order.quantity * order.product_price)}</span>
              </div>
            ))}
            {!analytics?.sales_history.length && <EmptyState>No sales history yet.</EmptyState>}
          </div>
        </section>
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="content-stack">
        <section className="panel split-panel profile-main">
          <div className="profile-id">
            <img src={productImage(profileForm.profile_pic)} alt={currentUser?.name ?? "Profile"} />
            <div>
              <h2>{currentUser?.name}</h2>
              <p>@{currentUser?.username}</p>
              <span>{currentUser?.role}</span>
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
              Name
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              Mobile
              <input
                value={profileForm.mobile}
                onChange={(event) => setProfileForm({ ...profileForm, mobile: event.target.value })}
                required
              />
            </label>
          </div>
          {currentUser?.role === "farmer" && (
            <label>
              Farm details
              <textarea
                value={profileForm.farm_details}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, farm_details: event.target.value })
                }
              />
            </label>
          )}
          <div className="form-grid two">
            <label>
              Profile photo URL
              <input
                value={profileForm.profile_pic}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, profile_pic: event.target.value })
                }
              />
            </label>
            <label>
              Gallery image URL
              <input
                value={profileForm.new_gallery_item}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, new_gallery_item: event.target.value })
                }
              />
            </label>
          </div>
          <div className="location-card compact">
            <FarmersMap
              picker
              height={230}
              value={{ lat: profileForm.lat, lng: profileForm.lng }}
              onChange={(location) => setProfileForm({ ...profileForm, ...location })}
            />
          </div>
          <button className="primary-button fit" type="submit" disabled={busy}>
            <Save size={17} />
            Save profile
          </button>
        </form>

        <section className="gallery-grid">
          {(currentUser?.gallery ?? []).map((item) => (
            <img key={item} src={item} alt="Farm gallery item" />
          ))}
          {!currentUser?.gallery.length && (
            <div className="gallery-empty">
              <ImageIcon size={28} />
              <span>No gallery photos yet</span>
            </div>
          )}
        </section>
      </div>
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
              placeholder="Search tomato, ragi, mango, coconut"
            />
            <button className="primary-button fit" type="submit">
              Search
            </button>
          </form>
        </section>

        <section className="market-grid">
          {searchResults.map((product) => (
            <article className="market-card" key={product.id}>
              <img src={productImage(product.image_path)} alt={product.name} />
              <div className="market-card-body">
                <div className="product-title-row">
                  <div>
                    <h3>{product.name}</h3>
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => loadFarmerProfile(product.farmer_id)}
                    >
                      {product.farmer_name}
                    </button>
                  </div>
                  <span className="discount-price">{formatMoney(product.price)}</span>
                </div>
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
                <p>{product.description}</p>
                <div className="price-row">
                  <span>
                    Market <del>{formatMoney(product.market_price)}</del>
                  </span>
                  <span>
                    <StarsDisplay rating={product.avg_rating} />
                    {product.review_count ? product.avg_rating.toFixed(1) : "New"}
                  </span>
                </div>
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
                  <button className="primary-button fit" type="button" onClick={() => openPayment(product)}>
                    <ShoppingBasket size={17} />
                    Order
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!searchResults.length && <EmptyState>No products found.</EmptyState>}
        </section>
      </div>
    );
  }

  function renderFarmerExplorer() {
    return (
      <div className="content-stack">
        <section className="panel">
          <div className="panel-title">
            <h3>Nearby farmers</h3>
            <span>{farmers.length} farms</span>
          </div>
          <FarmersMap pins={farmers} height={390} onSelectFarmer={loadFarmerProfile} />
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
              <span>{farmer.product_count} products</span>
              <StarsDisplay rating={farmer.avg_rating} />
            </button>
          ))}
        </section>

        {selectedFarmer && (
          <section className="panel farmer-profile-view">
            <div className="panel-title">
              <div>
                <p className="eyebrow">Farmer profile</p>
                <h3>{selectedFarmer.farmer.name}</h3>
              </div>
              <StarsDisplay rating={selectedFarmer.avg_rating} />
            </div>
            <p>{selectedFarmer.farmer.farm_details || "No farm description added."}</p>
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
            <div className="market-grid compact-grid">
              {selectedFarmer.products.map((product) => (
                <article className="market-card" key={product.id}>
                  <img src={productImage(product.image_path)} alt={product.name} />
                  <div className="market-card-body">
                    <h3>{product.name}</h3>
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
                        onClick={() => openPayment(product)}
                      >
                        <ShoppingBasket size={17} />
                        Order
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="review-list">
              {selectedFarmer.reviews.map((review) => (
                <div className="review-row" key={review.id}>
                  <StarsDisplay rating={review.rating} />
                  <strong>{review.reviewer_username}</strong>
                  <p>{review.comment}</p>
                </div>
              ))}
              {!selectedFarmer.reviews.length && <EmptyState>No reviews yet.</EmptyState>}
            </div>
          </section>
        )}
      </div>
    );
  }

  function renderBuyerOrders() {
    return (
      <section className="panel">
        <div className="panel-title">
          <h3>Your orders</h3>
          <span>{buyerOrders.length}</span>
        </div>
        <div className="order-list">
          {buyerOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <h3>{order.product_name}</h3>
                <p>
                  {order.quantity} {order.product_unit} from {order.farmer_username}
                </p>
                <p className="muted">Ordered {formatDate(order.timestamp)}</p>
                <p className="muted">Delivered {formatDate(order.delivered_timestamp)}</p>
              </div>
              <div className="order-side">
                <StatusPill status={order.status} />
                <strong>{formatMoney(order.quantity * order.product_price)}</strong>
                {order.status === "delivered" && (
                  <button
                    className="secondary-button fit"
                    type="button"
                    onClick={() =>
                      setReviewDraft({
                        farmer_id: order.farmer_id,
                        farmer_name: order.farmer_username ?? "Farmer",
                        order_id: order.id,
                        rating: 5,
                        comment: ""
                      })
                    }
                  >
                    <Star size={17} />
                    Review
                  </button>
                )}
              </div>
            </article>
          ))}
          {!buyerOrders.length && <EmptyState>No purchase history yet.</EmptyState>}
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
            <h3>Your reviews</h3>
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
            {!myReviews.length && <EmptyState>No reviews submitted yet.</EmptyState>}
          </div>
        </section>
      </div>
    );
  }

  function renderDashboardContent() {
    if (currentUser?.role === "farmer") {
      if (farmerTab === "products") return renderProductManager();
      if (farmerTab === "orders") return renderFarmerOrders();
      if (farmerTab === "analytics") return renderAnalytics();
      if (farmerTab === "profile") return renderProfile();
      return renderFarmerOverview();
    }

    if (buyerTab === "farmers") return renderFarmerExplorer();
    if (buyerTab === "orders") return renderBuyerOrders();
    if (buyerTab === "profile") return renderBuyerProfile();
    return renderMarket();
  }

  if (checkingSession) {
    return (
      <main className="loading-screen">
        <Sprout size={34} />
        <span>Loading Namma Raitha</span>
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
    { id: "farmers" as BuyerTab, label: t.farmers, icon: <MapPin size={18} /> },
    { id: "orders" as BuyerTab, label: t.orders, icon: <ClipboardList size={18} /> },
    { id: "profile" as BuyerTab, label: t.profile, icon: <User size={18} /> }
  ];

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Sprout size={24} />
          </span>
          <div>
            <strong>Namma Raitha</strong>
            <span>ನಮ್ಮ ರೈತ</span>
          </div>
        </div>
        <div className="sidebar-user">
          <img src={productImage(currentUser.profile_pic)} alt={currentUser.name} />
          <div>
            <strong>{currentUser.name}</strong>
            <span>@{currentUser.username}</span>
          </div>
        </div>
        <nav>
          {currentUser.role === "farmer"
            ? farmerNav.map((item) => (
                <button
                  key={item.id}
                  className={farmerTab === item.id ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setFarmerTab(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))
            : buyerNav.map((item) => (
                <button
                  key={item.id}
                  className={buyerTab === item.id ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setBuyerTab(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
        </nav>
        <button className="logout-button" type="button" onClick={logout}>
          <LogOut size={18} />
          {t.logout}
        </button>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" onClick={() => setSidebarOpen(true)}>
            <Menu size={21} />
          </button>
          <div>
            <p className="eyebrow">{currentUser.role}</p>
            <h1>
              {currentUser.role === "farmer"
                ? farmerNav.find((item) => item.id === farmerTab)?.label
                : buyerNav.find((item) => item.id === buyerTab)?.label}
            </h1>
          </div>
          <div className="topbar-actions">
            {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}
            <button
              className="ghost-button"
              type="button"
              onClick={() => setLanguage((value) => (value === "en" ? "kn" : "en"))}
            >
              <Languages size={17} />
              {language === "en" ? "ಕನ್ನಡ" : "EN"}
            </button>
            <button className="avatar-button" type="button" onClick={() => setSidebarOpen(true)}>
              <img src={productImage(currentUser.profile_pic)} alt={currentUser.name} />
            </button>
          </div>
        </header>
        <main className="workspace-content">{renderDashboardContent()}</main>
      </div>

      {sidebarOpen && <button className="sidebar-backdrop" type="button" onClick={() => setSidebarOpen(false)} />}

      {paymentDraft && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-card payment-card">
            <button className="modal-close" type="button" onClick={() => setPaymentDraft(null)}>
              <X size={20} />
            </button>
            <div className="modal-icon">
              <CreditCard size={28} />
            </div>
            <h2>Namma Pay</h2>
            <img src={productImage(paymentDraft.image_path)} alt={paymentDraft.name} />
            <p>
              {paymentDraft.quantity} {paymentDraft.unit} of {paymentDraft.name}
            </p>
            <strong>{formatMoney(paymentDraft.total)}</strong>
            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={() => confirmPayment(true)}>
                <Check size={18} />
                Pay
              </button>
              <button className="danger-button" type="button" onClick={() => confirmPayment(false)}>
                <X size={18} />
                Decline
              </button>
            </div>
          </section>
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
            <h2>Review {reviewDraft.farmer_name}</h2>
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
              placeholder="Write your review"
              required
            />
            <button className="primary-button" type="submit">
              <Star size={18} />
              Submit review
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
