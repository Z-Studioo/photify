export interface Product {
  id: string;
  name: string;
  images: string[];
  size: string;
  price: string;
  oldPrice?: string;
  category: string;
  description?: string;
}

export interface ArtProduct {
  id: string;
  name: string;
  image: string;
  size: string;
  price: string;
  isBestSeller: boolean;
  category: string;
  description?: string;
}

export interface RoomInspiration {
  id: string;
  title: string;
  image: string;
  productCount: number;
  products?: Product[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  total: number;
  items: CartItem[];
}

export interface PrintSize {
  id: string;
  name: string;
  dimensions: string;
  price: number;
}

export interface AITool {
  id: string;
  title: string;
  description: string;
  image: string;
  path: string;
}

