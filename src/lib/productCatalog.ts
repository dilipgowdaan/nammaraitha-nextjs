export const productCategories = [
  "Vegetables",
  "Fruits",
  "Flowers",
  "Millets",
  "Grains",
  "Pulses",
  "Oilseeds",
  "Spices",
  "Greens",
  "Plantation"
] as const;

type CatalogItem = {
  name: string;
  category: (typeof productCategories)[number];
  unit: string;
  growth_method: string;
  image: string;
};

function commonsImage(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=720`;
}

function fallbackImage(label: string, color = "E8F5E9") {
  return `https://placehold.co/640x420/${color}/2E7D32?text=${encodeURIComponent(label)}`;
}

export const productCatalog: CatalogItem[] = [
  { name: "Tomato", category: "Vegetables", unit: "kg", growth_method: "Open field, low chemical use", image: commonsImage("Tomato_je.jpg") },
  { name: "Onion", category: "Vegetables", unit: "kg", growth_method: "Local Karnataka variety", image: commonsImage("Mixed_onions.jpg") },
  { name: "Potato", category: "Vegetables", unit: "kg", growth_method: "Fresh soil-grown tubers", image: commonsImage("Patates.jpg") },
  { name: "Brinjal", category: "Vegetables", unit: "kg", growth_method: "Fresh local vegetable crop", image: commonsImage("Solanum_melongena_24_08_2012_(1).JPG") },
  { name: "Okra", category: "Vegetables", unit: "kg", growth_method: "Hand picked tender pods", image: commonsImage("Hong_Kong_Okra_Aug_25_2012.JPG") },
  { name: "Carrot", category: "Vegetables", unit: "kg", growth_method: "Fresh root crop", image: commonsImage("Vegetable-Carrot-Bundle-wStalks.jpg") },
  { name: "Beetroot", category: "Vegetables", unit: "kg", growth_method: "Local root vegetable", image: commonsImage("Detroitdarkredbeets.png") },
  { name: "Cabbage", category: "Vegetables", unit: "kg", growth_method: "Cool-season leafy head crop", image: commonsImage("Cabbage_and_cross_section_on_white.jpg") },
  { name: "Cauliflower", category: "Vegetables", unit: "kg", growth_method: "Fresh white curd harvest", image: commonsImage("Chou-fleur_02.jpg") },
  { name: "Capsicum", category: "Vegetables", unit: "kg", growth_method: "Protected or open field grown", image: commonsImage("Green-Yellow-Red-Pepper-2009.jpg") },
  { name: "Cucumber", category: "Vegetables", unit: "kg", growth_method: "Fresh vine crop", image: commonsImage("ARS_cucumber.jpg") },
  { name: "Pumpkin", category: "Vegetables", unit: "kg", growth_method: "Field-grown seasonal vegetable", image: commonsImage("FrenchMarketPumpkinsB.jpg") },
  { name: "Bitter Gourd", category: "Vegetables", unit: "kg", growth_method: "Climber crop, hand harvested", image: commonsImage("Momordica_charantia_Blanco2.357.png") },
  { name: "Ridge Gourd", category: "Vegetables", unit: "kg", growth_method: "Fresh gourd crop", image: commonsImage("Luffa_aegyptica.jpg") },
  { name: "Bottle Gourd", category: "Vegetables", unit: "kg", growth_method: "Fresh gourd harvest", image: commonsImage("Courge_encore_verte.jpg") },
  { name: "Beans", category: "Vegetables", unit: "kg", growth_method: "Tender green pods", image: commonsImage("Stringlesss_green_beans.jpg") },
  { name: "Green Peas", category: "Vegetables", unit: "kg", growth_method: "Fresh pea pods", image: commonsImage("Green_pea_pods.jpg") },
  { name: "Radish", category: "Vegetables", unit: "kg", growth_method: "Fresh root vegetable", image: commonsImage("Radish_3371103037_4ab07db0bf_o.jpg") },
  { name: "Sweet Corn", category: "Vegetables", unit: "piece", growth_method: "Fresh maize cobs", image: commonsImage("Corn_on_the_cob_(sweet_corn).jpg") },
  { name: "Chayote", category: "Vegetables", unit: "kg", growth_method: "Fresh vine vegetable", image: commonsImage("Chayote_1.jpg") },
  { name: "Ash Gourd", category: "Vegetables", unit: "kg", growth_method: "Mature gourd harvest", image: commonsImage("A_winter_melon.jpg") },
  { name: "Snake Gourd", category: "Vegetables", unit: "kg", growth_method: "Fresh climber gourd", image: commonsImage("Snake_gourd_of_Bangladesh.jpg") },
  { name: "Taro Root", category: "Vegetables", unit: "kg", growth_method: "Fresh tuber crop", image: commonsImage("Taro_Root,_Eddoe_or_Colocasia_Esculenta.jpg") },
  { name: "Drumstick", category: "Vegetables", unit: "kg", growth_method: "Fresh moringa pods", image: commonsImage("DrumstickFlower.jpg") },

  { name: "Mango", category: "Fruits", unit: "kg", growth_method: "Seasonal orchard harvest", image: commonsImage("Mangos_-_single_and_halved.jpg") },
  { name: "Banana", category: "Fruits", unit: "dozen", growth_method: "Farm fresh bunches", image: commonsImage("Bananavarieties.jpg") },
  { name: "Guava", category: "Fruits", unit: "kg", growth_method: "Naturally ripened fruit", image: commonsImage("Guava_pink_fruit.jpg") },
  { name: "Papaya", category: "Fruits", unit: "kg", growth_method: "Tree-ripened local fruit", image: commonsImage("Carica_papaya_fruit.JPG") },
  { name: "Pomegranate", category: "Fruits", unit: "kg", growth_method: "Orchard-grown fruit", image: commonsImage("Pomegranate_Juice_(2019).jpg") },
  { name: "Grapes", category: "Fruits", unit: "kg", growth_method: "Vineyard harvest", image: commonsImage("Grapes,_Rostov-on-Don,_Russia.jpg") },
  { name: "Watermelon", category: "Fruits", unit: "kg", growth_method: "Seasonal field melon", image: commonsImage("Taiwan_2009_Tainan_City_Organic_Farm_Watermelon_FRD_7962.jpg") },
  { name: "Muskmelon", category: "Fruits", unit: "kg", growth_method: "Fresh field melon", image: commonsImage("Meloen_vrucht_met_bloem.jpg") },
  { name: "Jackfruit", category: "Fruits", unit: "kg", growth_method: "Tree-ripened harvest", image: commonsImage("The_jackfruit_is_holding_on_to_the_tree.jpg") },
  { name: "Sapota", category: "Fruits", unit: "kg", growth_method: "Naturally ripened fruit", image: commonsImage("Manilkara_zapota_fruit.jpg") },
  { name: "Orange", category: "Fruits", unit: "kg", growth_method: "Citrus orchard harvest", image: commonsImage("Ambersweet_oranges.jpg") },
  { name: "Lemon", category: "Fruits", unit: "kg", growth_method: "Fresh citrus harvest", image: commonsImage("P1030323.JPG") },
  { name: "Pineapple", category: "Fruits", unit: "piece", growth_method: "Fresh tropical fruit", image: commonsImage("Pineapple_and_cross_section.jpg") },
  { name: "Custard Apple", category: "Fruits", unit: "kg", growth_method: "Tree-ripened seasonal fruit", image: commonsImage("Sugar_apple_on_tree.jpg") },
  { name: "Amla", category: "Fruits", unit: "kg", growth_method: "Fresh Indian gooseberry", image: commonsImage("Phyllanthus_officinalis.jpg") },
  { name: "Apple", category: "Fruits", unit: "kg", growth_method: "Fresh orchard fruit", image: commonsImage("Pink_lady_and_cross_section.jpg") },
  { name: "Pear", category: "Fruits", unit: "kg", growth_method: "Fresh orchard fruit", image: commonsImage("Pears.jpg") },
  { name: "Strawberry", category: "Fruits", unit: "kg", growth_method: "Fresh berry harvest", image: commonsImage("Garden_strawberry_(Fragaria_ananassa)_single2.jpg") },
  { name: "Tamarind", category: "Fruits", unit: "kg", growth_method: "Mature tree pods", image: commonsImage("Tamarindus_indica_fruit.jpg") },

  { name: "Marigold", category: "Flowers", unit: "kg", growth_method: "Fresh flower harvest", image: commonsImage("Tagetes_erecta_chendumalli_chedi.jpg") },
  { name: "Jasmine", category: "Flowers", unit: "mala", growth_method: "Hand picked local flowers", image: commonsImage("Common_Jasmine.jpg") },
  { name: "Rose", category: "Flowers", unit: "bundle", growth_method: "Fresh cut flowers", image: commonsImage("Rosa_rubiginosa_1.jpg") },
  { name: "Chrysanthemum", category: "Flowers", unit: "kg", growth_method: "Fresh flower harvest", image: commonsImage("Chrysanthemum_nangkingense.jpg") },
  { name: "Tuberose", category: "Flowers", unit: "bundle", growth_method: "Fresh fragrant flowers", image: commonsImage("Tuberose_flower.jpg") },
  { name: "Crossandra", category: "Flowers", unit: "kg", growth_method: "Fresh local flowers", image: commonsImage("Crossandra_infundibuliformis_kanakambaram_Madhurawada_Visakhapatnam.JPG") },
  { name: "Lotus", category: "Flowers", unit: "piece", growth_method: "Fresh pond flower", image: commonsImage("Sacred_lotus_Nelumbo_nucifera.jpg") },
  { name: "Hibiscus", category: "Flowers", unit: "bundle", growth_method: "Fresh garden flower", image: commonsImage("Hibiscus_Brilliant.jpg") },
  { name: "Carnation", category: "Flowers", unit: "bundle", growth_method: "Fresh cut flowers", image: commonsImage("W_carnation4051.jpg") },
  { name: "Gerbera", category: "Flowers", unit: "bundle", growth_method: "Fresh cut flowers", image: commonsImage("Unidentified_Gerbera.jpg") },
  { name: "Sunflower", category: "Flowers", unit: "piece", growth_method: "Fresh field flower", image: commonsImage("Sunflower_sky_backdrop.jpg") },

  { name: "Ragi", category: "Millets", unit: "kg", growth_method: "Rain-fed traditional crop", image: commonsImage("Finger_millet_3_11-21-02.jpg") },
  { name: "Jowar", category: "Millets", unit: "kg", growth_method: "Dryland farm grown", image: commonsImage("Sorghum_bicolor03.jpg") },
  { name: "Bajra", category: "Millets", unit: "kg", growth_method: "Dryland millet crop", image: commonsImage("Grain_millet,_early_grain_fill,_Tifton,_7-3-02.jpg") },
  { name: "Foxtail Millet", category: "Millets", unit: "kg", growth_method: "Traditional small millet", image: commonsImage("Japanese_Foxtail_millet_02.jpg") },
  { name: "Little Millet", category: "Millets", unit: "kg", growth_method: "Rain-fed small millet", image: commonsImage("A_crop_\"samai_\"_grown_in_the_rain_water_only_itself.jpg") },
  { name: "Kodo Millet", category: "Millets", unit: "kg", growth_method: "Traditional millet crop", image: commonsImage("Paspalum_scrobiculatum_224164066.jpg") },
  { name: "Barnyard Millet", category: "Millets", unit: "kg", growth_method: "Short-duration millet crop", image: commonsImage("Echinochloa_esculenta_sl2.jpg") },
  { name: "Proso Millet", category: "Millets", unit: "kg", growth_method: "Dryland millet grain", image: commonsImage("Mature_Proso_Millet_Panicles.jpg") },
  { name: "Browntop Millet", category: "Millets", unit: "kg", growth_method: "Traditional dryland millet", image: commonsImage("Brachiaria_ramosa_from_Ambanja,_Madagascar.jpg") },

  { name: "Rice", category: "Grains", unit: "kg", growth_method: "Local paddy harvest", image: commonsImage("20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg") },
  { name: "Paddy", category: "Grains", unit: "kg", growth_method: "Freshly harvested paddy", image: commonsImage("20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg") },
  { name: "Wheat", category: "Grains", unit: "kg", growth_method: "Field-grown cereal grain", image: commonsImage("Wheat_close-up.JPG") },
  { name: "Maize", category: "Grains", unit: "kg", growth_method: "Field-grown maize grain", image: commonsImage("Corn_on_the_cob_(sweet_corn).jpg") },
  { name: "Barley", category: "Grains", unit: "kg", growth_method: "Field-grown cereal crop", image: commonsImage("Barley_(Hordeum_vulgare)_-_United_States_National_Arboretum_-_24_May_2009.jpg") },
  { name: "Oats", category: "Grains", unit: "kg", growth_method: "Cereal grain harvest", image: commonsImage("AvenaSativa3.jpg") },
  { name: "Quinoa", category: "Grains", unit: "kg", growth_method: "Nutritive grain crop", image: commonsImage("Reismelde.jpg") },

  { name: "Chickpea", category: "Pulses", unit: "kg", growth_method: "Dry pulse crop", image: commonsImage("Chickpea_BNC.jpg") },
  { name: "Pigeon Pea", category: "Pulses", unit: "kg", growth_method: "Red gram pulse crop", image: commonsImage("Cajanus_cajan_Blanco1.167-cropped.jpg") },
  { name: "Green Gram", category: "Pulses", unit: "kg", growth_method: "Dry pulse crop", image: commonsImage("Mung_beans_(Vigna_radiata).jpg") },
  { name: "Black Gram", category: "Pulses", unit: "kg", growth_method: "Dry pulse crop", image: commonsImage("Black_gram.jpg") },
  { name: "Lentil", category: "Pulses", unit: "kg", growth_method: "Dry pulse crop", image: commonsImage("3_types_of_lentil.jpg") },
  { name: "Kidney Bean", category: "Pulses", unit: "kg", growth_method: "Dry bean crop", image: commonsImage("Red_Rajma_BNC.jpg") },
  { name: "Cowpea", category: "Pulses", unit: "kg", growth_method: "Dry pulse crop", image: commonsImage("Lobia.jpg") },
  { name: "Horse Gram", category: "Pulses", unit: "kg", growth_method: "Hardy dryland pulse", image: commonsImage("Horse_Gram_BNC.jpg") },
  { name: "Soybean", category: "Pulses", unit: "kg", growth_method: "Protein-rich field crop", image: commonsImage("Soybean.USDA.jpg") },

  { name: "Groundnut", category: "Oilseeds", unit: "kg", growth_method: "Dryland oilseed crop", image: commonsImage("Peanuts_in_shell.jpg") },
  { name: "Sesame", category: "Oilseeds", unit: "kg", growth_method: "Traditional oilseed crop", image: commonsImage("Sesame_seeds.jpg") },
  { name: "Mustard Seed", category: "Oilseeds", unit: "kg", growth_method: "Oilseed and spice crop", image: commonsImage("Mustard.png") },
  { name: "Safflower", category: "Oilseeds", unit: "kg", growth_method: "Dryland oilseed crop", image: commonsImage("Safflower.jpg") },
  { name: "Castor Seed", category: "Oilseeds", unit: "kg", growth_method: "Hardy oilseed crop", image: commonsImage("Ricinus_March_2010-1.jpg") },
  { name: "Linseed", category: "Oilseeds", unit: "kg", growth_method: "Oilseed and fibre crop", image: commonsImage("Flax_seeds.jpg") },
  { name: "Niger Seed", category: "Oilseeds", unit: "kg", growth_method: "Traditional oilseed crop", image: commonsImage("Guizotia_abyssinica_niger.jpg") },
  { name: "Sunflower Seed", category: "Oilseeds", unit: "kg", growth_method: "Oilseed harvest", image: commonsImage("Sunflower_sky_backdrop.jpg") },

  { name: "Turmeric", category: "Spices", unit: "kg", growth_method: "Sun dried and farm processed", image: commonsImage("Turmeric_inflorescence.jpg") },
  { name: "Chilli", category: "Spices", unit: "kg", growth_method: "Sun dried local spice", image: commonsImage("Madame_Jeanette_and_other_chillies.jpg") },
  { name: "Coriander", category: "Spices", unit: "kg", growth_method: "Seed spice harvest", image: commonsImage("Coriander_Seeds.jpg") },
  { name: "Cumin", category: "Spices", unit: "kg", growth_method: "Seed spice crop", image: commonsImage("Cumin_seeds.jpg") },
  { name: "Black Pepper", category: "Spices", unit: "kg", growth_method: "Plantation spice crop", image: commonsImage("Black_Pepper_Piper_nigrum.jpg") },
  { name: "Cardamom", category: "Spices", unit: "kg", growth_method: "Shade-grown spice crop", image: commonsImage("02017_0119_Kardamom,_Winter_in_den_Beskiden.jpg") },
  { name: "Clove", category: "Spices", unit: "kg", growth_method: "Dried aromatic spice", image: commonsImage("ClovesDried.jpg") },
  { name: "Cinnamon", category: "Spices", unit: "kg", growth_method: "Farm processed bark spice", image: commonsImage("Cinnamomum_verum_spices.jpg") },
  { name: "Ginger", category: "Spices", unit: "kg", growth_method: "Fresh rhizome crop", image: commonsImage("Koeh-146-no_text.jpg") },
  { name: "Garlic", category: "Spices", unit: "kg", growth_method: "Fresh bulb crop", image: commonsImage("Allium_sativum_Woodwill_1793.jpg") },
  { name: "Fenugreek", category: "Spices", unit: "kg", growth_method: "Seed spice crop", image: commonsImage("Illustration_Trigonella_foenum-graecum0_clean.jpg") },
  { name: "Fennel", category: "Spices", unit: "kg", growth_method: "Aromatic seed spice", image: commonsImage("Foeniculum_July_2011-1a.jpg") },
  { name: "Ajwain", category: "Spices", unit: "kg", growth_method: "Aromatic seed spice", image: commonsImage("Carom_Flowers.jpg") },

  { name: "Drumstick Leaves", category: "Greens", unit: "bundle", growth_method: "Backyard organic greens", image: commonsImage("DrumstickFlower.jpg") },
  { name: "Spinach", category: "Greens", unit: "bundle", growth_method: "Fresh leafy greens", image: commonsImage("Spinacia_oleracea_Spinazie_bloeiend.jpg") },
  { name: "Coriander Leaves", category: "Greens", unit: "bundle", growth_method: "Fresh herb greens", image: commonsImage("Coriander_leaves.jpg") },
  { name: "Mint", category: "Greens", unit: "bundle", growth_method: "Fresh herb greens", image: commonsImage("Mentha_spicata-IMG_6186.jpg") },
  { name: "Fenugreek Leaves", category: "Greens", unit: "bundle", growth_method: "Fresh leafy greens", image: commonsImage("Illustration_Trigonella_foenum-graecum0_clean.jpg") },
  { name: "Amaranth Leaves", category: "Greens", unit: "bundle", growth_method: "Fresh leafy greens", image: commonsImage("Amaranthus_tricolor0.jpg") },
  { name: "Curry Leaves", category: "Greens", unit: "bundle", growth_method: "Fresh aromatic leaves", image: commonsImage("Curry_Trees.jpg") },
  { name: "Dill Leaves", category: "Greens", unit: "bundle", growth_method: "Fresh herb greens", image: commonsImage("Illustration_Anethum_graveolens_clean.jpg") },
  { name: "Malabar Spinach", category: "Greens", unit: "bundle", growth_method: "Fresh vine greens", image: commonsImage("Basella_alba-2.JPG") },
  { name: "Lettuce", category: "Greens", unit: "piece", growth_method: "Fresh salad greens", image: commonsImage("Iceberg_lettuce_in_SB.jpg") },
  { name: "Spring Onion", category: "Greens", unit: "bundle", growth_method: "Fresh onion greens", image: commonsImage("CSA-Red-Spring-Onions.jpg") },
  { name: "Gongura", category: "Greens", unit: "bundle", growth_method: "Fresh sour greens", image: commonsImage("Roselle,_Hibiscus_sabdariffa,_2014_01.JPG") },

  { name: "Coconut", category: "Plantation", unit: "piece", growth_method: "Naturally matured", image: commonsImage("Coconuts_-_single_and_cracked_open.jpg") },
  { name: "Arecanut", category: "Plantation", unit: "kg", growth_method: "Plantation harvest", image: commonsImage("Bago,_mercado_23.jpg") },
  { name: "Coffee Beans", category: "Plantation", unit: "kg", growth_method: "Plantation crop, dried beans", image: commonsImage("Roasted_coffee_beans.jpg") },
  { name: "Tea Leaves", category: "Plantation", unit: "kg", growth_method: "Fresh plantation leaves", image: commonsImage("Longjing_tea_steeping_in_gaiwan.jpg") },
  { name: "Sugarcane", category: "Plantation", unit: "bundle", growth_method: "Fresh cane harvest", image: commonsImage("Sugarcane_field.jpg") },
  { name: "Cocoa", category: "Plantation", unit: "kg", growth_method: "Plantation pod harvest", image: commonsImage("Cocoa_Pods.JPG") },
  { name: "Betel Leaf", category: "Plantation", unit: "bundle", growth_method: "Fresh vine leaves", image: commonsImage("Piper_betle_plant.jpg") },
  { name: "Cashew Nut", category: "Plantation", unit: "kg", growth_method: "Plantation nut harvest", image: commonsImage("Cashew_apples.jpg") },
  { name: "Oil Palm", category: "Plantation", unit: "kg", growth_method: "Plantation fruit bunches", image: commonsImage("Elaeis_guineensis_fruit.jpg") }
];

export function catalogProductImage(name?: string | null) {
  if (!name) return null;
  return productCatalog.find((item) => item.name.toLowerCase() === name.toLowerCase())?.image ?? null;
}

export const defaultProductImage = fallbackImage("Farm Fresh");
