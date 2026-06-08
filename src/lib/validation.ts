import { z } from "zod";

const requiredText = z.string().trim().min(1);
const optionalUrl = z.string().trim().url().optional().or(z.literal(""));

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username is too long.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["farmer", "buyer"]),
  lat: z.coerce.number().min(-90).max(90).default(12.9716),
  lng: z.coerce.number().min(-180).max(180).default(77.5946),
  name: requiredText.max(80),
  mobile: requiredText.max(20),
  farm_details: z.string().trim().max(700).optional().default("")
});

export const loginSchema = z.object({
  username: requiredText,
  password: requiredText
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  mobile: z.string().trim().min(1).max(20).optional(),
  farm_details: z.string().trim().max(700).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  profile_pic: optionalUrl,
  new_gallery_item: optionalUrl,
  gallery: z.array(z.string().trim().url()).max(8).optional()
});

export const productSchema = z.object({
  name: requiredText.max(80),
  description: requiredText.max(700),
  market_price: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(0),
  unit: requiredText.max(24),
  growth_method: requiredText.max(120),
  image_value: z.string().trim().url().optional().or(z.literal("")),
  category: z.string().trim().max(48).optional().default("Produce"),
  harvest_date: z.string().trim().optional().or(z.literal("")),
  is_featured: z.boolean().optional().default(false)
});

export const productUpdateSchema = productSchema.partial().extend({
  quantity: z.coerce.number().int().min(0).optional()
});

export const updateOrderSchema = z.object({
  status: z.enum(["pending", "paid", "delivered", "cancelled"])
});

export const placeOrderSchema = z.object({
  farmer_id: z.coerce.number().int().positive(),
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  total_amount: z.coerce.number().positive().optional(),
  payment_reference: z.string().trim().max(80).optional()
});

export const reviewSchema = z.object({
  reviewed_id: z.coerce.number().int().positive(),
  order_id: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: requiredText.max(700)
});

export function schemaMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request payload.";
}
