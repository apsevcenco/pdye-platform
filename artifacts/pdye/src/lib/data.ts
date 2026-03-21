export interface YachtDocument {
  name: string;
  url: string;
  size?: string;
  type?: string;  // PDF, ZIP, DOC, XLS, etc.
}

export interface Yacht {
  id: string;
  name: string;
  // Classification
  type?: string;           // Motor Yacht, Sailing Yacht, Catamaran, etc.
  condition?: string;      // Used, New
  flag?: string;           // Registration / flag state
  // Builder
  builder?: string;
  year?: number;
  refit?: number;          // Last refit year
  // Dimensions
  length?: string;         // LOA e.g. "38.5m"
  beam?: string;           // e.g. "7.2m"
  draft?: string;          // e.g. "1.8m"
  displacement?: string;   // e.g. "85 t"
  gross_tonnage?: string;  // e.g. "420 GT"
  // Hull
  hull_material?: string;  // Fiberglass, Steel, Aluminum, Composite, Wood
  hull_type?: string;      // Monohull, Catamaran, Trimaran
  // Engines & Fuel
  engines?: string;        // e.g. "Twin MTU 16V 2000 M94"
  engine_count?: number;
  horse_power?: string;    // e.g. "2 x 2,400 hp"
  fuel_type?: string;      // Diesel, Gasoline
  fuel_capacity?: string;  // e.g. "24,000 L"
  water_capacity?: string; // e.g. "4,000 L"
  // Performance
  max_speed?: string;      // e.g. "18 kn"
  cruise_speed?: string;   // e.g. "14 kn"
  range?: string;          // e.g. "3,200 nm"
  // Accommodation
  cabins?: number;         // Guest cabins
  heads?: number;          // Bathrooms
  berths?: number;         // Sleeping berths
  crew?: number;           // Crew cabins
  // Location & Pricing
  location?: string;
  price: string;
  market_price?: string;
  distressed_price?: string;
  // Media & Status
  image?: string;
  photos?: string[];      // Up to 30 gallery photos
  documents?: YachtDocument[];  // Deal room documents
  status: string;
  description?: string;
  // Access control
  is_private?: boolean;   // If true, only visible to logged-in users
}

export const FEATURED_YACHTS: Yacht[] = [
  {
    id: "y-1",
    name: "AURELIA",
    type: "Motor Yacht",
    condition: "Used",
    flag: "Cayman Islands",
    builder: "Sanlorenzo",
    year: 2019,
    length: "38.5m",
    beam: "7.6m",
    draft: "1.9m",
    displacement: "145 t",
    hull_material: "Steel",
    hull_type: "Monohull",
    engines: "Twin MTU 10V 2000 M96L",
    engine_count: 2,
    horse_power: "2 × 1,450 hp",
    fuel_type: "Diesel",
    max_speed: "16 kn",
    cruise_speed: "12 kn",
    range: "2,800 nm",
    fuel_capacity: "28,000 L",
    cabins: 5,
    heads: 5,
    berths: 10,
    crew: 6,
    location: "Monaco",
    price: "€ 12,500,000",
    market_price: "€ 12,500,000",
    image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80",
    status: "Off-Market",
    description: "Exceptional opportunity. Impeccable condition with fully customized interior. Highly motivated seller."
  },
  {
    id: "y-2",
    name: "AZIMUT 72",
    type: "Motor Yacht",
    condition: "Used",
    flag: "Italy",
    builder: "Azimut",
    year: 2017,
    length: "22.0m",
    beam: "5.5m",
    draft: "1.5m",
    hull_material: "Fiberglass",
    hull_type: "Monohull",
    engines: "Twin Volvo IPS 1050",
    engine_count: 2,
    horse_power: "2 × 725 hp",
    fuel_type: "Diesel",
    max_speed: "34 kn",
    cruise_speed: "26 kn",
    fuel_capacity: "6,000 L",
    cabins: 4,
    heads: 4,
    berths: 8,
    crew: 2,
    location: "Palma de Mallorca",
    price: "€ 1,800,000",
    market_price: "€ 2,900,000",
    distressed_price: "€ 1,800,000",
    image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80",
    status: "Distressed Sale",
    description: "Bank-instructed sale. Priced significantly below market value for immediate disposal. Serious inquiries only."
  },
  {
    id: "y-3",
    name: "SUNSEEKER 86",
    type: "Motor Yacht",
    condition: "Used",
    flag: "UK",
    builder: "Sunseeker",
    year: 2016,
    length: "26.2m",
    beam: "6.2m",
    draft: "1.7m",
    hull_material: "Fiberglass",
    hull_type: "Monohull",
    engines: "Twin MAN V12 2000",
    engine_count: 2,
    horse_power: "2 × 1,550 hp",
    fuel_type: "Diesel",
    max_speed: "30 kn",
    cruise_speed: "22 kn",
    fuel_capacity: "8,500 L",
    cabins: 4,
    heads: 4,
    berths: 8,
    crew: 3,
    location: "Antibes",
    price: "€ 2,700,000",
    market_price: "€ 4,200,000",
    distressed_price: "€ 2,700,000",
    image: "https://images.unsplash.com/photo-1504274066651-8d31a536b11a?w=800&q=80",
    status: "Distressed Sale",
    description: "Motivated seller. Requires minor refit. Priced aggressively for a fast transaction."
  }
];

export const ALL_YACHTS: Yacht[] = [
  ...FEATURED_YACHTS,
  {
    id: "y-4",
    name: "BENETTI 50M",
    type: "Superyacht",
    condition: "Used",
    flag: "Marshall Islands",
    builder: "Benetti",
    year: 2012,
    refit: 2021,
    length: "50.0m",
    beam: "9.5m",
    draft: "2.6m",
    displacement: "420 t",
    gross_tonnage: "495 GT",
    hull_material: "Steel",
    hull_type: "Monohull",
    engines: "Twin Caterpillar 3512C",
    engine_count: 2,
    horse_power: "2 × 1,900 hp",
    fuel_type: "Diesel",
    max_speed: "15 kn",
    cruise_speed: "11 kn",
    range: "4,500 nm",
    fuel_capacity: "72,000 L",
    cabins: 7,
    heads: 7,
    berths: 14,
    crew: 10,
    location: "Genoa",
    price: "€ 18,000,000",
    market_price: "€ 28,000,000",
    distressed_price: "€ 18,000,000",
    image: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=800&q=80",
    status: "Distressed Sale",
    description: "Exceptional value on a full-displacement superyacht. Owner liquidating assets. Price firm."
  },
  {
    id: "y-5",
    name: "VELOCE",
    type: "Sport Cruiser",
    condition: "Used",
    flag: "France",
    builder: "Sunseeker",
    year: 2018,
    length: "28.5m",
    beam: "6.4m",
    draft: "1.8m",
    hull_material: "Fiberglass",
    hull_type: "Monohull",
    engines: "Twin MAN V12",
    engine_count: 2,
    horse_power: "2 × 1,200 hp",
    fuel_type: "Diesel",
    max_speed: "32 kn",
    cruise_speed: "24 kn",
    cabins: 4,
    heads: 4,
    berths: 8,
    crew: 3,
    location: "Cannes",
    price: "€ 6,800,000",
    market_price: "€ 6,800,000",
    image: "https://images.unsplash.com/photo-1579730303861-125dd1f4df32?w=800&q=80",
    status: "Off-Market",
    description: "Fast planing yacht. Zero speed stabilizers. Turnkey condition."
  },
  {
    id: "y-6",
    name: "SILVER WIND",
    type: "Superyacht",
    condition: "Used",
    flag: "Cayman Islands",
    builder: "Lürssen",
    year: 2010,
    refit: 2019,
    length: "60.0m",
    beam: "11.2m",
    draft: "3.1m",
    displacement: "850 t",
    hull_material: "Steel",
    hull_type: "Monohull",
    engines: "Twin MTU 20V 8000 M71L",
    engine_count: 2,
    horse_power: "2 × 9,100 hp",
    fuel_type: "Diesel",
    max_speed: "20 kn",
    cruise_speed: "15 kn",
    range: "5,500 nm",
    fuel_capacity: "120,000 L",
    cabins: 9,
    heads: 9,
    berths: 18,
    crew: 14,
    location: "Athens",
    price: "€ 35,000,000",
    market_price: "€ 35,000,000",
    image: "https://images.unsplash.com/photo-1518182170546-076616fdcb18?w=800&q=80",
    status: "Confidential",
    description: "Northern European pedigree. Helicopter capability. Serious inquiries only."
  }
];
