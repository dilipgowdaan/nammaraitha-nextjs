"use client";

import {
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  ClipboardList,
  CreditCard,
  Database,
  Edit3,
  Filter,
  Image as ImageIcon,
  IndianRupee,
  Languages,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  PackagePlus,
  Save,
  Search,
  ShoppingBasket,
  ShieldCheck,
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
type AdminTab = "dashboard" | "users" | "products" | "orders" | "logs";
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
  image_value: productCatalog.find((item) => item.name === "Tomato")?.image ?? defaultProductImage,
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

const kannadaPhrases: Record<string, string> = {
  "Username": "ಬಳಕೆದಾರ ಹೆಸರು",
  "Password": "ಪಾಸ್ವರ್ಡ್",
  "Login": "ಲಾಗಿನ್",
  "New user? Register": "ಹೊಸ ಬಳಕೆದಾರರಾ? ನೋಂದಣಿ",
  "Create account": "ಖಾತೆ ರಚಿಸಿ",
  "Back to login": "ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ",
  "Full name": "ಪೂರ್ಣ ಹೆಸರು",
  "Mobile": "ಮೊಬೈಲ್",
  "Farm details": "ಫಾರ್ಮ್ ವಿವರಗಳು",
  "Category": "ವರ್ಗ",
  "Product": "ಉತ್ಪನ್ನ",
  "Unit": "ಘಟಕ",
  "Market price": "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ",
  "Your price": "ನಿಮ್ಮ ಬೆಲೆ",
  "Stock": "ಸ್ಟಾಕ್",
  "Growth method": "ಬೆಳೆದ ವಿಧಾನ",
  "Harvest date": "ಕೊಯ್ಲು ದಿನಾಂಕ",
  "Description": "ವಿವರಣೆ",
  "Featured in buyer search": "ಖರೀದಿದಾರರ ಹುಡುಕಾಟದಲ್ಲಿ ತೋರಿಸಿ",
  "Add product": "ಉತ್ಪನ್ನ ಸೇರಿಸಿ",
  "Edit product": "ಉತ್ಪನ್ನ ಸಂಪಾದಿಸಿ",
  "Save changes": "ಬದಲಾವಣೆ ಉಳಿಸಿ",
  "Cancel": "ರದ್ದು",
  "Product photo": "ಉತ್ಪನ್ನದ ಫೋಟೋ",
  "Upload from gallery or take a fresh camera photo.": "ಗ್ಯಾಲರಿಯಿಂದ ಆರಿಸಿ ಅಥವಾ ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಹೊಸ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ.",
  "Gallery": "ಗ್ಯಾಲರಿ",
  "Camera": "ಕ್ಯಾಮೆರಾ",
  "Uploading...": "ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
  "Save profile": "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ",
  "Profile photo": "ಪ್ರೊಫೈಲ್ ಫೋಟೋ",
  "Choose a clear face or farm logo photo.": "ಸ್ಪಷ್ಟ ಮುಖ ಅಥವಾ ಫಾರ್ಮ್ ಲೋಗೋ ಫೋಟೋ ಆರಿಸಿ.",
  "Gallery photo": "ಗ್ಯಾಲರಿ ಫೋಟೋ",
  "Add a farm, crop, harvest, or shop photo.": "ಫಾರ್ಮ್, ಬೆಳೆ, ಕೊಯ್ಲು ಅಥವಾ ಅಂಗಡಿ ಫೋಟೋ ಸೇರಿಸಿ.",
  "Search": "ಹುಡುಕಿ",
  "Search tomato, ragi, mango, coconut": "ಟೊಮೇಟೊ, ರಾಗಿ, ಮಾವು, ತೆಂಗು ಹುಡುಕಿ",
  "Order": "ಆರ್ಡರ್",
  "Nearby farmers": "ಹತ್ತಿರದ ರೈತರು",
  "Farmer profile": "ರೈತ ಪ್ರೊಫೈಲ್",
  "No reviews yet.": "ಇನ್ನೂ ವಿಮರ್ಶೆಗಳಿಲ್ಲ.",
  "Your orders": "ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳು",
  "Your reviews": "ನಿಮ್ಮ ವಿಮರ್ಶೆಗಳು",
  "Review": "ವಿಮರ್ಶೆ",
  "Submit review": "ವಿಮರ್ಶೆ ಸಲ್ಲಿಸಿ",
  "Write your review": "ನಿಮ್ಮ ವಿಮರ್ಶೆ ಬರೆಯಿರಿ",
  "Dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  "Users": "ಬಳಕೆದಾರರು",
  "Products": "ಉತ್ಪನ್ನಗಳು",
  "Logs": "ಲಾಗ್‌ಗಳು",
  "Users and roles": "ಬಳಕೆದಾರರು ಮತ್ತು ಪಾತ್ರಗಳು",
  "All products": "ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು",
  "Order history": "ಆರ್ಡರ್ ಇತಿಹಾಸ",
  "History and logs": "ಇತಿಹಾಸ ಮತ್ತು ಲಾಗ್‌ಗಳು",
  "Platform summary": "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸಾರಾಂಶ",
  "Recent activity": "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ",
  "Live data": "ಲೈವ್ ಡೇಟಾ",
  "Namma Pay": "ನಮ್ಮ ಪೇ",
  "Pay": "ಪಾವತಿ",
  "Decline": "ನಿರಾಕರಿಸಿ",
  "Loading Namma Raitha": "ನಮ್ಮ ರೈತ ಲೋಡ್ ಆಗುತ್ತಿದೆ",
  "Loading admin dashboard": "ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ",
  "Name": "ಹೆಸರು",
  "Farmer": "ರೈತ",
  "Buyer": "ಖರೀದಿದಾರ",
  "Admin": "ಅಡ್ಮಿನ್",
  "farmer": "ರೈತ",
  "buyer": "ಖರೀದಿದಾರ",
  "admin": "ಅಡ್ಮಿನ್",
  "paid": "ಪಾವತಿಸಲಾಗಿದೆ",
  "pending": "ಬಾಕಿ",
  "delivered": "ವಿತರಿಸಲಾಗಿದೆ",
  "cancelled": "ರದ್ದು",
  "Listed products": "ಪಟ್ಟಿ ಉತ್ಪನ್ನಗಳು",
  "Active orders": "ಸಕ್ರಿಯ ಆರ್ಡರ್‌ಗಳು",
  "Total earnings": "ಒಟ್ಟು ಆದಾಯ",
  "Farmer rating": "ರೈತ ರೇಟಿಂಗ್",
  "Farm profile": "ಫಾರ್ಮ್ ಪ್ರೊಫೈಲ್",
  "Farm details not added yet.": "ಫಾರ್ಮ್ ವಿವರಗಳನ್ನು ಇನ್ನೂ ಸೇರಿಸಲಾಗಿಲ್ಲ.",
  "Edit profile": "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
  "Stock attention": "ಸ್ಟಾಕ್ ಗಮನ",
  "low": "ಕಡಿಮೆ",
  "left": "ಉಳಿದಿದೆ",
  "by": "ಇಂದ",
  "No products listed yet.": "ಇನ್ನೂ ಉತ್ಪನ್ನಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ.",
  "Recent active orders": "ಇತ್ತೀಚಿನ ಸಕ್ರಿಯ ಆರ್ಡರ್‌ಗಳು",
  "No active orders.": "ಸಕ್ರಿಯ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ.",
  "Edit": "ಸಂಪಾದಿಸಿ",
  "Add your first product to open your farm store.": "ನಿಮ್ಮ ಫಾರ್ಮ್ ಅಂಗಡಿ ತೆರೆಯಲು ಮೊದಲ ಉತ್ಪನ್ನ ಸೇರಿಸಿ.",
  "pending delivery": "ವಿತರಣೆ ಬಾಕಿ",
  "for": "ಗಾಗಿ",
  "ordered": "ಆರ್ಡರ್ ಮಾಡಿದ ದಿನ",
  "Payment": "ಪಾವತಿ",
  "recorded": "ದಾಖಲಾಗಿದೆ",
  "of": "ನ",
  "Order marked delivered.": "ಆರ್ಡರ್ ವಿತರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
  "Paid orders": "ಪಾವತಿಸಿದ ಆರ್ಡರ್‌ಗಳು",
  "Units sold": "ಮಾರಾಟವಾದ ಘಟಕಗಳು",
  "Earnings": "ಆದಾಯ",
  "Top product": "ಮುಖ್ಯ ಉತ್ಪನ್ನ",
  "Sales by product": "ಉತ್ಪನ್ನದ ಪ್ರಕಾರ ಮಾರಾಟ",
  "Sales will appear after orders.": "ಆರ್ಡರ್‌ಗಳ ನಂತರ ಮಾರಾಟ ಇಲ್ಲಿ ಕಾಣುತ್ತದೆ.",
  "Sales history": "ಮಾರಾಟ ಇತಿಹಾಸ",
  "Latest 10": "ಇತ್ತೀಚಿನ 10",
  "No sales history yet.": "ಇನ್ನೂ ಮಾರಾಟ ಇತಿಹಾಸವಿಲ್ಲ.",
  "No gallery photos yet": "ಇನ್ನೂ ಗ್ಯಾಲರಿ ಫೋಟೋಗಳಿಲ್ಲ",
  "Market": "ಮಾರುಕಟ್ಟೆ",
  "Rating": "ರೇಟಿಂಗ್",
  "New": "ಹೊಸದು",
  "No products found.": "ಉತ್ಪನ್ನಗಳು ಸಿಗಲಿಲ್ಲ.",
  "farms": "ಫಾರ್ಮ್‌ಗಳು",
  "products available": "ಉತ್ಪನ್ನಗಳು",
  "No farm description added.": "ಫಾರ್ಮ್ ವಿವರಣೆ ಸೇರಿಸಲಾಗಿಲ್ಲ.",
  "from": "ಇಂದ",
  "Ordered": "ಆರ್ಡರ್ ದಿನ",
  "Delivered": "ವಿತರಣೆಯ ದಿನ",
  "No purchase history yet.": "ಖರೀದಿ ಇತಿಹಾಸ ಇಲ್ಲ.",
  "No reviews submitted yet.": "ಇನ್ನೂ ವಿಮರ್ಶೆ ಸಲ್ಲಿಸಿಲ್ಲ.",
  "users": "ಬಳಕೆದಾರರು",
  "listings": "ಪಟ್ಟಿಗಳು",
  "orders": "ಆರ್ಡರ್‌ಗಳು",
  "recent events": "ಇತ್ತೀಚಿನ ಘಟನೆಗಳು",
  "Buyers": "ಖರೀದಿದಾರರು",
  "Reviews": "ವಿಮರ್ಶೆಗಳು",
  "Revenue": "ಆದಾಯ",
  "No details": "ವಿವರಗಳಿಲ್ಲ",
  "order": "ಆರ್ಡರ್",
  "review": "ವಿಮರ್ಶೆ",
  "Use GPS": "ಜಿಪಿಎಸ್ ಬಳಸಿ",
  "GPS": "ಜಿಪಿಎಸ್",
  "Location": "ಸ್ಥಳ",
  "Use your device location": "ನಿಮ್ಮ ಸಾಧನದ ಸ್ಥಳ ಬಳಸಿ",
  "Image uploaded.": "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಆಯಿತು.",
  "Reading your GPS location...": "ನಿಮ್ಮ ಜಿಪಿಎಸ್ ಸ್ಥಳ ಓದುತ್ತಿದೆ...",
  "GPS permission was denied. Allow location access in the browser.": "ಜಿಪಿಎಸ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಥಳ ಪ್ರವೇಶಕ್ಕೆ ಅನುಮತಿ ನೀಡಿ.",
  "Could not read GPS. Try again on HTTPS or allow precise location.": "ಜಿಪಿಎಸ್ ಓದಲು ಆಗಲಿಲ್ಲ. HTTPS ನಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನಿಖರ ಸ್ಥಳಕ್ಕೆ ಅನುಮತಿ ನೀಡಿ.",
  "Location is not available in this browser.": "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಥಳ ಸೌಲಭ್ಯ ಲಭ್ಯವಿಲ್ಲ.",
  "Logged out.": "ನಿರ್ಗಮಿಸಲಾಗಿದೆ.",
  "Stock updated.": "ಸ್ಟಾಕ್ ನವೀಕರಿಸಲಾಗಿದೆ.",
  "Enter a valid quantity.": "ಸರಿಯಾದ ಪ್ರಮಾಣ ನಮೂದಿಸಿ.",
  "Payment declined.": "ಪಾವತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ.",
  "Login successful.": "ಲಾಗಿನ್ ಯಶಸ್ವಿಯಾಗಿದೆ.",
  "Admin login successful.": "ಅಡ್ಮಿನ್ ಲಾಗಿನ್ ಯಶಸ್ವಿಯಾಗಿದೆ.",
  "Registered successfully. Please login.": "ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ.",
  "Product added successfully.": "ಉತ್ಪನ್ನ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.",
  "Product updated.": "ಉತ್ಪನ್ನ ನವೀಕರಿಸಲಾಗಿದೆ.",
  "Product deleted.": "ಉತ್ಪನ್ನ ಅಳಿಸಲಾಗಿದೆ.",
  "Order placed successfully.": "ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ನೀಡಲಾಗಿದೆ.",
  "Profile updated.": "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲಾಗಿದೆ.",
  "Nothing to update.": "ನವೀಕರಿಸಲು ಏನೂ ಇಲ್ಲ.",
  "Review submitted successfully.": "ವಿಮರ್ಶೆ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.",
  "Login failed.": "ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ.",
  "Registration failed.": "ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ.",
  "Image upload failed.": "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ.",
  "Product save failed.": "ಉತ್ಪನ್ನ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ.",
  "Stock update failed.": "ಸ್ಟಾಕ್ ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ.",
  "Delete failed.": "ಅಳಿಸುವುದು ವಿಫಲವಾಗಿದೆ.",
  "Order update failed.": "ಆರ್ಡರ್ ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ.",
  "Profile update failed.": "ಪ್ರೊಫೈಲ್ ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ.",
  "Payment failed.": "ಪಾವತಿ ವಿಫಲವಾಗಿದೆ.",
  "Review failed.": "ವಿಮರ್ಶೆ ವಿಫಲವಾಗಿದೆ.",
  "removed.": "ತೆಗೆದುಹಾಕಲಾಗಿದೆ.",
  "Invalid username or password.": "ಬಳಕೆದಾರ ಹೆಸರು ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ತಪ್ಪಾಗಿದೆ.",
  "Login required.": "ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ.",
  "Please choose an image file.": "ದಯವಿಟ್ಟು ಚಿತ್ರ ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ.",
  "Only image uploads are supported.": "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾತ್ರ ಬೆಂಬಲಿತವಾಗಿದೆ.",
  "Image is too large. Keep it under 6 MB.": "ಚಿತ್ರ ತುಂಬಾ ದೊಡ್ಡದು. 6 MB ಒಳಗೆ ಇರಿಸಿ.",
  "Invalid product id.": "ಉತ್ಪನ್ನ ಐಡಿ ಸರಿಯಿಲ್ಲ.",
  "Product not found or update failed.": "ಉತ್ಪನ್ನ ಸಿಗಲಿಲ್ಲ ಅಥವಾ ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ.",
  "Farmer not found.": "ರೈತ ಸಿಗಲಿಲ್ಲ.",
  "Invalid request payload.": "ವಿನಂತಿಯ ಮಾಹಿತಿ ಸರಿಯಿಲ್ಲ.",
  "Your uploaded products": "ನೀವು ಸೇರಿಸಿದ ಉತ್ಪನ್ನಗಳು",
  "Catalog image is used by default. Upload your own farm photo to replace it.": "ಡೀಫಾಲ್ಟ್ ಆಗಿ ಕ್ಯಾಟಲಾಗ್ ಚಿತ್ರ ಬಳಸಲಾಗುತ್ತದೆ. ಬದಲಿಸಲು ನಿಮ್ಮ ಫಾರ್ಮ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
  "Tomato": "ಟೊಮೇಟೊ",
  "Onion": "ಈರುಳ್ಳಿ",
  "Brinjal": "ಬದನೆಕಾಯಿ",
  "Mango": "ಮಾವು",
  "Banana": "ಬಾಳೆಹಣ್ಣು",
  "Guava": "ಸೀಬೆಹಣ್ಣು",
  "Marigold": "ಚೆಂಡು ಹೂವು",
  "Jasmine": "ಮಲ್ಲಿಗೆ",
  "Ragi": "ರಾಗಿ",
  "Jowar": "ಜೋಳ",
  "Rice": "ಅಕ್ಕಿ",
  "Turmeric": "ಅರಿಶಿನ",
  "Chilli": "ಮೆಣಸಿನಕಾಯಿ",
  "Drumstick Leaves": "ನುಗ್ಗೆ ಸೊಪ್ಪು",
  "Coconut": "ತೆಂಗಿನಕಾಯಿ"
};

const kannadaCategories: Record<string, string> = {
  Vegetables: "ತರಕಾರಿಗಳು",
  Fruits: "ಹಣ್ಣುಗಳು",
  Flowers: "ಹೂವುಗಳು",
  Millets: "ಸಿರಿಧಾನ್ಯಗಳು",
  Grains: "ಧಾನ್ಯಗಳು",
  Pulses: "ಬೇಳೆಗಳು",
  Oilseeds: "ಎಣ್ಣೆಬೀಜಗಳು",
  Spices: "ಮಸಾಲೆಗಳು",
  Greens: "ಸೊಪ್ಪುಗಳು",
  Plantation: "ತೋಟಗಾರಿಕೆ"
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
  const [uploadingTarget, setUploadingTarget] = useState<"product" | "profile" | "gallery" | null>(null);
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
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboard | null>(null);

  const t = copy[language];
  const tr = useCallback(
    (text: string) => (language === "kn" ? kannadaPhrases[text] ?? text : text),
    [language]
  );
  const categoryLabel = useCallback(
    (category: string) => (language === "kn" ? kannadaCategories[category] ?? category : category),
    [language]
  );
  const roleLabel = useCallback(
    (role?: string) => (role ? tr(role.charAt(0).toUpperCase() + role.slice(1)) : ""),
    [tr]
  );
  const statusLabel = useCallback((status: string) => tr(status), [tr]);
  const productNameLabel = useCallback((name: string) => tr(name), [tr]);
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

  const loadAdminDashboard = useCallback(async () => {
    const dashboard = await requestJson<AdminDashboard>("/api/admin/dashboard");
    setAdminDashboard(dashboard);
  }, []);

  const searchProducts = useCallback(async (query = "") => {
    const results = await requestJson<SearchResult[]>(
      `/api/search_products?query=${encodeURIComponent(query)}`
    );
    setSearchResults(results);
  }, []);

  const loadFarmerProfile = useCallback(
    async (farmerId: number) => {
      setBuyerTab("farmers");
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

    if (currentUser.role === "admin") {
      void loadAdminDashboard();
    } else if (currentUser.role === "farmer") {
      void loadFarmerDashboard();
    } else {
      void loadBuyerDashboard();
      void searchProducts("");
    }
  }, [currentUser, loadAdminDashboard, loadBuyerDashboard, loadFarmerDashboard, searchProducts]);

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
    showAlert(tr("Logged out."));
  }

  function requestCurrentDeviceLocation() {
    if (!navigator.geolocation) {
      showAlert(tr("Location is not available in this browser."), "error");
      return;
    }

    showAlert(tr("Reading your GPS location..."));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5))
        };
        setRegisterForm((form) => ({ ...form, ...location }));
        setProfileForm((form) => ({ ...form, ...location }));
        showAlert(`${tr("GPS")}: ${location.lat}, ${location.lng}`);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? tr("GPS permission was denied. Allow location access in the browser.")
            : tr("Could not read GPS. Try again on HTTPS or allow precise location.");
        showAlert(message, "error");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000
      }
    );
  }

  async function uploadImageFile(file: File, target: "product" | "profile" | "gallery") {
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
      setProductForm((form) => ({ ...form, image_value: url }));
    }
  }

  async function handleProfileImageUpload(file?: File | null) {
    if (!file) return;
    const url = await uploadImageFile(file, "profile");
    if (url) {
      try {
        setProfileForm((form) => ({ ...form, profile_pic: url }));
        setCurrentUser((user) => (user ? { ...user, profile_pic: url } : user));
        await requestJson("/api/update_profile", {
          method: "POST",
          body: JSON.stringify({ profile_pic: url })
        });
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
          user ? { ...user, gallery: [...user.gallery, url].slice(-8) } : user
        );
        await requestJson("/api/update_profile", {
          method: "POST",
          body: JSON.stringify({ new_gallery_item: url })
        });
        await refreshCurrentUser();
      } catch (error) {
        showAlert(error instanceof Error ? tr(error.message) : tr("Profile update failed."), "error");
      }
    }
  }

  function selectCatalogItem(item: (typeof productCatalog)[number]) {
    setProductForm((form) => ({
      ...form,
      name: item.name,
      category: item.category,
      unit: item.unit,
      growth_method: item.growth_method,
      image_value: item.image,
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

  function openPayment(product: Pick<SearchResult, "id" | "farmer_id" | "name" | "price" | "unit" | "image_path">) {
    const quantity = Number(orderQuantities[product.id] ?? 1);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      showAlert(tr("Enter a valid quantity."), "error");
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
      showAlert(tr("Payment declined."), "error");
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
      showAlert(tr(response.message));
      setPaymentDraft(null);
      await Promise.all([searchProducts(searchQuery), loadBuyerDashboard()]);
      if (selectedFarmer) {
        await loadFarmerProfile(selectedFarmer.farmer.id);
      }
    } catch (error) {
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
    } catch (error) {
      showAlert(error instanceof Error ? tr(error.message) : tr("Review failed."), "error");
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
                  <button type="button" onClick={requestCurrentDeviceLocation}>
                    {tr("Use GPS")}
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
                <img src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
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
                <img src={item.image} alt={item.name} onError={fallbackImageOnError} />
                <span>{productNameLabel(item.name)}</span>
              </button>
            ))}
          </div>

          <form className="product-form" onSubmit={saveProduct}>
            <div className="image-upload-panel">
              <img src={productImage(productForm.image_value, productForm.name)} alt={productForm.name || "Product"} onError={fallbackImageOnError} />
              <div>
                <strong>{tr("Product photo")}</strong>
                <p className="muted">{tr("Catalog image is used by default. Upload your own farm photo to replace it.")}</p>
                <div className="upload-actions">
                  <label className="upload-button">
                    <Upload size={17} />
                    {tr("Gallery")}
                    <input
                      accept="image/*"
                      className="file-input"
                      type="file"
                      onChange={(event) => void handleProductImageUpload(event.target.files?.[0])}
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
                      onChange={(event) => void handleProductImageUpload(event.target.files?.[0])}
                    />
                  </label>
                  {uploadingTarget === "product" && <span className="muted">{tr("Uploading...")}</span>}
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
              <img src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
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
          {farmerOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <h3>{tr("Order")} #{order.id}: {productNameLabel(order.product_name)}</h3>
                <p>
                  {order.quantity} {order.product_unit} {tr("for")} {order.buyer_username}
                </p>
                <p className="muted">
                  {tr("Mobile")} {order.mobile || "N/A"} - {tr("ordered")} {formatDate(order.timestamp)}
                </p>
                <p className="muted">{tr("Payment")} {order.payment_reference || tr("recorded")}</p>
              </div>
              <div className="order-side">
                <StatusPill status={order.status} label={statusLabel(order.status)} />
                <strong>{formatMoney(order.quantity * order.product_price)}</strong>
                <button className="primary-button fit" type="button" onClick={() => markDelivered(order.id)}>
                  <Truck size={17} />
                  {tr("Delivered")}
                </button>
              </div>
            </article>
          ))}
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
            <img src={productImage(profileForm.profile_pic)} alt={currentUser?.name ?? "Profile"} onError={fallbackImageOnError} />
            <div>
              <h2>{currentUser?.name}</h2>
              <p>@{currentUser?.username}</p>
              <span>{roleLabel(currentUser?.role)}</span>
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
              <img src={productImage(profileForm.profile_pic)} alt="Profile preview" onError={fallbackImageOnError} />
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
              <img
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
              <button className="ghost-button fit" type="button" onClick={requestCurrentDeviceLocation}>
                <Navigation size={16} />
                {tr("Use GPS")}
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

        <section className="gallery-grid">
          {galleryItems.map((item) => (
            <img key={item} src={item} alt="Farm gallery item" onError={fallbackImageOnError} />
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
        </section>

        <section className="market-grid">
          {searchResults.map((product) => (
            <article className="market-card" key={product.id}>
              <img src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
              <div className="market-card-body">
                <div className="product-title-row">
                  <div>
                    <h3>{productNameLabel(product.name)}</h3>
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
                    {tr("Market")} <del>{formatMoney(product.market_price)}</del>
                  </span>
                  <span>
                    <StarsDisplay rating={product.avg_rating} />
                    {product.review_count ? product.avg_rating.toFixed(1) : tr("New")}
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
                    {tr("Order")}
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!searchResults.length && <EmptyState>{tr("No products found.")}</EmptyState>}
        </section>
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
              <span>{farmer.product_count} {tr("Products")}</span>
              <StarsDisplay rating={farmer.avg_rating} />
            </button>
          ))}
        </section>

        {selectedFarmer && (
          <section className="panel farmer-profile-view">
            <div className="panel-title">
              <div>
                <p className="eyebrow">{tr("Farmer profile")}</p>
                <h3>{selectedFarmer.farmer.name}</h3>
              </div>
              <StarsDisplay rating={selectedFarmer.avg_rating} />
            </div>
            <p>{selectedFarmer.farmer.farm_details || tr("No farm description added.")}</p>
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
                  <img src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
                  <div className="market-card-body">
                    <h3>{productNameLabel(product.name)}</h3>
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
                        {tr("Order")}
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
              {!selectedFarmer.reviews.length && <EmptyState>{tr("No reviews yet.")}</EmptyState>}
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
          <h3>{tr("Your orders")}</h3>
          <span>{buyerOrders.length}</span>
        </div>
        <div className="order-list">
          {buyerOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <h3>{productNameLabel(order.product_name)}</h3>
                <p>
                  {order.quantity} {order.product_unit} {tr("from")} {order.farmer_username}
                </p>
                <p className="muted">{tr("Ordered")} {formatDate(order.timestamp)}</p>
                <p className="muted">{tr("Delivered")} {formatDate(order.delivered_timestamp)}</p>
              </div>
              <div className="order-side">
                <StatusPill status={order.status} label={statusLabel(order.status)} />
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
                    {tr("Review")}
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
                <img src={productImage(user.profile_pic)} alt={user.name} onError={fallbackImageOnError} />
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
                <img src={productImage(product.image_path, product.name)} alt={product.name} onError={fallbackImageOnError} />
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
              <div className="table-row" key={order.id}>
                <span>#{order.id}</span>
                <strong>{productNameLabel(order.product_name)}</strong>
                <span>{order.buyer_username}</span>
                <span>{order.farmer_username}</span>
                <StatusPill status={order.status} label={statusLabel(order.status)} />
                <span>{formatMoney(order.quantity * order.product_price)}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (adminTab === "logs") {
      return (
        <section className="panel admin-panel">
          <div className="panel-title">
            <h3>{tr("History and logs")}</h3>
            <span>{adminDashboard.logs.length} {tr("recent events")}</span>
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
    { id: "farmers" as BuyerTab, label: t.farmers, icon: <MapPin size={18} /> },
    { id: "orders" as BuyerTab, label: t.orders, icon: <ClipboardList size={18} /> },
    { id: "profile" as BuyerTab, label: t.profile, icon: <User size={18} /> }
  ];
  const adminNav = [
    { id: "dashboard" as AdminTab, label: tr("Dashboard"), icon: <ShieldCheck size={18} /> },
    { id: "users" as AdminTab, label: tr("Users"), icon: <Users size={18} /> },
    { id: "products" as AdminTab, label: t.products, icon: <PackagePlus size={18} /> },
    { id: "orders" as AdminTab, label: t.orders, icon: <ClipboardList size={18} /> },
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

          <nav className="header-menu" aria-label="Main menu">
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
              <img src={productImage(currentUser.profile_pic)} alt={currentUser.name} onError={fallbackImageOnError} />
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

      {paymentDraft && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-card payment-card">
            <button className="modal-close" type="button" onClick={() => setPaymentDraft(null)}>
              <X size={20} />
            </button>
            <div className="modal-icon">
              <CreditCard size={28} />
            </div>
            <h2>{tr("Namma Pay")}</h2>
            <img src={productImage(paymentDraft.image_path, paymentDraft.name)} alt={paymentDraft.name} onError={fallbackImageOnError} />
            <p>
              {paymentDraft.quantity} {paymentDraft.unit} {tr("of")} {productNameLabel(paymentDraft.name)}
            </p>
            <strong>{formatMoney(paymentDraft.total)}</strong>
            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={() => confirmPayment(true)}>
                <Check size={18} />
                {tr("Pay")}
              </button>
              <button className="danger-button" type="button" onClick={() => confirmPayment(false)}>
                <X size={18} />
                {tr("Decline")}
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
            <h2>{tr("Review")} {reviewDraft.farmer_name}</h2>
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
              {tr("Submit review")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
