export type Category = {
  _id: string;
  name: string;
  description?: string;
};

export type Brand = {
  _id: string;
  name: string;
  description?: string;
};

export type Product = {
  _id: string;
  name: string;
  price: number; // kuruş
  description?: string;
  imgUrl?: string;
  stock?: number;
  sku?: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  brand?: string;
  categories: string[];
  date?: string;
};

export type CartItem = {
  _id: string;
  name: string;
  price: number; // kuruş
  imgUrl?: string;
  quantity: number;
};

export type OrderItemProduct = {
  _id: string;
  name: string;
  price: number; // kuruş
  imgUrl?: string;
};

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export type Order = {
  _id: string;
  status: OrderStatus;
  user?: {
    userId: string;
    name: string;
    email: string;
  };
  items: {
    product: OrderItemProduct;
    quantity: number;
    date?: string;
  }[];
  createdAt?: string;
};

export type CurrentUser = {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};
