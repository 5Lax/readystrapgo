export interface StrapSpecs {
  length: number;
  width: number;
  material: string;
  color: string;
}

export interface Hardware {
  buckleType: string;
  dRings: boolean;
  rivets: boolean;
  snaps: boolean;
  velcro: boolean;
  triGlide: boolean;
}

export interface Quote {
  id?: string;
  user_id?: string;
  strap_specs: StrapSpecs;
  hardware: Hardware;
  quantity: number;
  estimated_price: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface PriceBreakdown {
  baseStrapPrice: number;
  materialMultiplier: number;
  hardwareTotal: number;
  subtotal: number;
  quantityDiscount: number;
  total: number;
  lineItems: LineItem[];
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
