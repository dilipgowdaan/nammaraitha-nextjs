export const productCategories = [
  "Vegetables",
  "Fruits",
  "Flowers",
  "Millets",
  "Grains",
  "Spices",
  "Greens",
  "Plantation"
] as const;

function catalogImage(label: string, color = "E8F5E9") {
  return `https://placehold.co/640x420/${color}/2E7D32?text=${encodeURIComponent(label)}`;
}

export const productCatalog = [
  {
    name: "Tomato",
    category: "Vegetables",
    unit: "kg",
    growth_method: "Open field, low chemical use",
    image: catalogImage("Tomato", "FFEBEE")
  },
  {
    name: "Onion",
    category: "Vegetables",
    unit: "kg",
    growth_method: "Local Karnataka variety",
    image: catalogImage("Onion", "F3E5F5")
  },
  {
    name: "Brinjal",
    category: "Vegetables",
    unit: "kg",
    growth_method: "Fresh local vegetable crop",
    image: catalogImage("Brinjal", "EDE7F6")
  },
  {
    name: "Mango",
    category: "Fruits",
    unit: "kg",
    growth_method: "Seasonal orchard harvest",
    image: catalogImage("Mango", "FFF8E1")
  },
  {
    name: "Banana",
    category: "Fruits",
    unit: "dozen",
    growth_method: "Farm fresh bunches",
    image: catalogImage("Banana", "FFFDE7")
  },
  {
    name: "Guava",
    category: "Fruits",
    unit: "kg",
    growth_method: "Naturally ripened fruit",
    image: catalogImage("Guava", "E8F5E9")
  },
  {
    name: "Marigold",
    category: "Flowers",
    unit: "kg",
    growth_method: "Fresh flower harvest",
    image: catalogImage("Marigold", "FFF3E0")
  },
  {
    name: "Jasmine",
    category: "Flowers",
    unit: "mala",
    growth_method: "Hand picked local flowers",
    image: catalogImage("Jasmine", "F8F9FA")
  },
  {
    name: "Ragi",
    category: "Millets",
    unit: "kg",
    growth_method: "Rain-fed traditional crop",
    image: catalogImage("Ragi", "F1F8E9")
  },
  {
    name: "Jowar",
    category: "Millets",
    unit: "kg",
    growth_method: "Dryland farm grown",
    image: catalogImage("Jowar", "F9FBE7")
  },
  {
    name: "Rice",
    category: "Grains",
    unit: "kg",
    growth_method: "Local paddy harvest",
    image: catalogImage("Rice", "FAFAFA")
  },
  {
    name: "Turmeric",
    category: "Spices",
    unit: "kg",
    growth_method: "Sun dried and farm processed",
    image: catalogImage("Turmeric", "FFF8E1")
  },
  {
    name: "Chilli",
    category: "Spices",
    unit: "kg",
    growth_method: "Sun dried local spice",
    image: catalogImage("Chilli", "FFEBEE")
  },
  {
    name: "Drumstick Leaves",
    category: "Greens",
    unit: "bundle",
    growth_method: "Backyard organic greens",
    image: catalogImage("Drumstick Leaves", "E8F5E9")
  },
  {
    name: "Coconut",
    category: "Plantation",
    unit: "piece",
    growth_method: "Naturally matured",
    image: catalogImage("Coconut", "EFEBE9")
  }
] as const;

export const defaultProductImage = catalogImage("Farm Fresh");
