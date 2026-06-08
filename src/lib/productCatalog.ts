export const productCatalog = [
  {
    name: "Ragi",
    category: "Millets",
    unit: "kg",
    growth_method: "Rain-fed traditional crop",
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Tomato",
    category: "Vegetables",
    unit: "kg",
    growth_method: "Open field, low chemical use",
    image:
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Onion",
    category: "Vegetables",
    unit: "kg",
    growth_method: "Local Karnataka variety",
    image:
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Jowar",
    category: "Millets",
    unit: "kg",
    growth_method: "Dryland farm grown",
    image:
      "https://images.unsplash.com/photo-1601593768797-76c06a7c19bd?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Mango",
    category: "Fruits",
    unit: "kg",
    growth_method: "Seasonal orchard harvest",
    image:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Banana",
    category: "Fruits",
    unit: "dozen",
    growth_method: "Farm fresh bunches",
    image:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Coconut",
    category: "Plantation",
    unit: "piece",
    growth_method: "Naturally matured",
    image:
      "https://images.unsplash.com/photo-1580129862045-53c769a2f603?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Turmeric",
    category: "Spices",
    unit: "kg",
    growth_method: "Sun dried and farm processed",
    image:
      "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Drumstick Leaves",
    category: "Greens",
    unit: "bundle",
    growth_method: "Backyard organic greens",
    image:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80"
  }
] as const;

export const defaultProductImage = productCatalog[0].image;
