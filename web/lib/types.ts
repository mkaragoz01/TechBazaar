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

export type Address = {
  _id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode?: string;
  isDefault: boolean;
};

export type PaymentMethod = {
  _id: string;
  cardHolderName: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
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
  shippingAddress?: {
    title?: string;
    fullName: string;
    phone: string;
    city: string;
    district: string;
    addressLine: string;
    postalCode?: string;
  };
  paymentDisplay?: string;
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
