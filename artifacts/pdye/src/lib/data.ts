export interface Yacht {
  id: string;
  name: string;
  length: string;
  year: number;
  builder: string;
  location: string;
  price: string;
  marketPrice?: string;
  distressedPrice?: string;
  image: string;
  status: string;
  description: string;
}

export const FEATURED_YACHTS: Yacht[] = [
  {
    id: "y-1",
    name: "AURELIA",
    length: "38.5m",
    year: 2019,
    builder: "Sanlorenzo",
    location: "Monaco",
    price: "€ 12,500,000",
    marketPrice: "€ 12,500,000",
    image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80",
    status: "Off-Market",
    description: "Exceptional opportunity. Impeccable condition with fully customized interior. Highly motivated seller."
  },
  {
    id: "y-2",
    name: "AZIMUT 72",
    length: "22.0m",
    year: 2017,
    builder: "Azimut",
    location: "Palma de Mallorca",
    price: "€ 1,800,000",
    marketPrice: "€ 2,900,000",
    distressedPrice: "€ 1,800,000",
    image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80",
    status: "Distressed Sale",
    description: "Bank-instructed sale. Priced significantly below market value for immediate disposal. Serious inquiries only."
  },
  {
    id: "y-3",
    name: "SUNSEEKER 86",
    length: "26.2m",
    year: 2016,
    builder: "Sunseeker",
    location: "Antibes",
    price: "€ 2,700,000",
    marketPrice: "€ 4,200,000",
    distressedPrice: "€ 2,700,000",
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
    length: "50.0m",
    year: 2012,
    builder: "Benetti",
    location: "Genoa",
    price: "€ 18,000,000",
    marketPrice: "€ 28,000,000",
    distressedPrice: "€ 18,000,000",
    image: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=800&q=80",
    status: "Distressed Sale",
    description: "Exceptional value on a full-displacement superyacht. Owner liquidating assets. Price firm."
  },
  {
    id: "y-5",
    name: "VELOCE",
    length: "28.5m",
    year: 2018,
    builder: "Sunseeker",
    location: "Cannes",
    price: "€ 6,800,000",
    marketPrice: "€ 6,800,000",
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
    marketPrice: "€ 35,000,000",
    image: "https://images.unsplash.com/photo-1518182170546-076616fdcb18?w=800&q=80",
    status: "Confidential",
    description: "Northern European pedigree. Helicopter capability. Serious inquiries only."
  }
];
