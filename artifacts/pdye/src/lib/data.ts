// Shared dummy data to simulate a backend

export const FEATURED_YACHTS = [
  {
    id: "y-1",
    name: "AURELIA",
    length: "38.5m",
    year: 2019,
    builder: "Sanlorenzo",
    location: "Monaco",
    price: "€ 12,500,000",
    image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80",
    status: "Off-Market",
    description: "Exceptional opportunity. Impeccable condition with fully customized interior. Highly motivated seller."
  },
  {
    id: "y-2",
    name: "LADY BLUE",
    length: "45.0m",
    year: 2015,
    builder: "Benetti",
    location: "Palma de Mallorca",
    price: "Price on Application",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    status: "Distressed Sale",
    description: "Bank-instructed sale. Requires minor refit. Priced significantly below market value for immediate disposal."
  },
  {
    id: "y-3",
    name: "OCEANIS",
    length: "52.4m",
    year: 2021,
    builder: "Oceanco",
    location: "Antibes",
    price: "€ 28,000,000",
    image: "https://images.unsplash.com/photo-1582236592233-a3d8b1eecbce?w=800&q=80",
    status: "Private Treaty",
    description: "Virtually new delivery. Owner taking delivery of larger vessel. Highly confidential."
  }
];

export const ALL_YACHTS = [
  ...FEATURED_YACHTS,
  {
    id: "y-4",
    name: "STELLA MARIS",
    length: "32.0m",
    year: 2012,
    builder: "Custom Line",
    location: "Genoa",
    price: "€ 4,200,000",
    image: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=80",
    status: "Price Reduced",
    description: "Classic Italian styling. Major refit in 2020. Aggressive price reduction for quick sale."
  },
  {
    id: "y-5",
    name: "VELOCE",
    length: "28.5m",
    year: 2018,
    builder: "Sunseeker",
    location: "Cannes",
    price: "€ 6,800,000",
    image: "https://images.unsplash.com/photo-1579730303861-125dd1f4df32?w=800&q=80",
    status: "Off-Market",
    description: "Fast planing yacht. Zero speed stabilizers. Turnkey condition."
  },
  {
    id: "y-6",
    name: "SILVER WIND",
    length: "60.0m",
    year: 2010,
    builder: "Lürssen",
    location: "Athens",
    price: "€ 35,000,000",
    image: "https://images.unsplash.com/photo-1518182170546-076616fdcb18?w=800&q=80",
    status: "Confidential",
    description: "Northern European pedigree. Helicopter capability. Serious inquiries only."
  }
];
