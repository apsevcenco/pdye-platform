export interface YachtDocument {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface Yacht {
  id: string;
  name: string;
  type?: string;
  condition?: string;
  flag?: string;
  builder?: string;
  year?: number;
  refit?: number;
  length?: string;
  beam?: string;
  draft?: string;
  displacement?: string;
  gross_tonnage?: string;
  hull_material?: string;
  hull_type?: string;
  engines?: string;
  engine_count?: number;
  horse_power?: string;
  fuel_type?: string;
  fuel_capacity?: string;
  water_capacity?: string;
  max_speed?: string;
  cruise_speed?: string;
  range?: string;
  cabins?: number;
  heads?: number;
  berths?: number;
  crew?: number;
  location?: string;
  price: string;
  market_price?: string;
  distressed_price?: string;
  image?: string;
  photos?: string[];
  documents?: YachtDocument[];
  status: string;
  description?: string;
  is_private?: boolean;
  is_featured?: boolean;
}
