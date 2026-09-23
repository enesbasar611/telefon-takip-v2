export const DEVICE_BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Huawei",
  "Oppo",
  "Vivo",
  "Realme",
  "POCO",
  "Honor",
  "OnePlus",
  "Google",
  "Nothing",
  "Tecno",
  "Infinix",
  "Sony",
  "Asus",
  "Lenovo",
  "Motorola",
  "Nokia"
];

export const DEVICE_MODELS: Record<string, string[]> = {
  "Apple": [
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 mini", "iPhone 13",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 mini", "iPhone 12",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
    "iPhone SE (3. Nesil)", "iPhone SE (2. Nesil)",
    "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7"
  ],
  "Samsung": [
    "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S24 FE",
    "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE",
    "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22",
    "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy S21 FE",
    "Galaxy Z Fold 6", "Galaxy Z Flip 6", "Galaxy Z Fold 5", "Galaxy Z Flip 5",
    "Galaxy A55", "Galaxy A35", "Galaxy A54", "Galaxy A34", "Galaxy A25", "Galaxy A15",
    "Galaxy A53", "Galaxy A33", "Galaxy A73"
  ],
  "Xiaomi": [
    "Xiaomi 14 Ultra", "Xiaomi 14 Pro", "Xiaomi 14",
    "Xiaomi 13 Ultra", "Xiaomi 13 Pro", "Xiaomi 13", "Xiaomi 13T Pro", "Xiaomi 13T",
    "Xiaomi 12T Pro", "Xiaomi 12T", "Xiaomi 12 Pro", "Xiaomi 12",
    "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
    "Redmi Note 12 Pro+", "Redmi Note 12 Pro", "Redmi Note 12",
    "Redmi 13C", "Redmi 12"
  ],
  "POCO": [
    "POCO F6 Pro", "POCO F6", "POCO X6 Pro", "POCO X6", "POCO M6 Pro",
    "POCO F5 Pro", "POCO F5", "POCO X5 Pro", "POCO X5"
  ],
  "Huawei": [
    "Pura 70 Ultra", "Pura 70 Pro", "Pura 70",
    "P60 Pro", "P60", "Mate 60 Pro", "Mate 60",
    "P50 Pro", "P50", "Mate 50 Pro", "Nova 12", "Nova 11"
  ]
};

// Flattened popular models for quick search if brand is not selected
export const ALL_POPULAR_MODELS = Object.values(DEVICE_MODELS).flat();
