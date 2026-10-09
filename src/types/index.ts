export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  whatsapp: string;
  memberId: string; // e.g. CDC-8F29A1
  role: UserRole;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductVariantKey = 'ayam_saja' | 'tanpa_nasi' | 'dengan_nasi';

export interface ProductPriceConfig {
  ayamSaja?: number;
  tanpaNasi: number;
  denganNasi: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  prices: ProductPriceConfig;
  extraOptions: {
    extraSaus: number;
    extraNasi: number;
  };
  badge?: string;
}

export interface CartItem {
  id: string; // unique item uuid in cart
  productId: string;
  productName: string;
  productImage: string;
  variant: ProductVariantKey;
  variantLabel: string;
  basePrice: number;
  extraSausCount: number;
  extraSausPrice: number;
  extraSausName?: string;
  extraNasiCount: number;
  extraNasiPrice: number;
  chickenPartNote: string; // e.g. "Minta paha", "Minta dada", "Minta sayap", "Bebas"
  quantity: number;
  itemSubtotal: number;
}

export type ShippingArea = 'indramayu_kota' | 'luar_indramayu_kota';

export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_verification'
  | 'accepted'
  | 'cooking'
  | 'packing'
  | 'shipping'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  memberId: string;
  customerName: string;
  customerWhatsapp: string;
  deliveryAddress: string;
  addressNote?: string;
  shippingArea: ShippingArea;
  shippingFee: number;
  items: CartItem[];
  subtotal: number;
  pointsRedeemed: number; // e.g. 20
  discountFromPoints: number; // e.g. 2000
  total: number;
  paymentMethod: 'qris';
  paymentProofUrl?: string;
  paymentStatus: PaymentStatus;
  paymentRejectionReason?: string;
  orderStatus: OrderStatus;
  orderType: 'delivery' | 'offline_pos';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  adminActionAt?: string;
  lastAdminActionAt?: string;
  cashReceived?: number;
  cashChange?: number;
  cashierUid?: string;
  cashierName?: string;
}

export type PointTxType = 'reward' | 'redeem' | 'refund' | 'manual_adjustment';

export interface PointTransaction {
  id: string;
  userId: string;
  memberId: string;
  amount: number; // positive or negative
  type: PointTxType;
  description: string;
  orderId?: string;
  adminUid?: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  startAt?: string;
  endAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  id: string; // typically userId
  userId: string;
  customerName: string;
  customerWhatsapp: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadByAdmin: number;
  unreadByCustomer: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: 'customer' | 'admin';
  text: string;
  imageUrl?: string;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
    mapsUrl?: string;
  };
  orderId?: string;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  adminUid: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface PosTransactionItem {
  productId: string;
  productName: string;
  variant: ProductVariantKey;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface PosTransaction {
  id: string;
  receiptNumber: string;
  createdAt: string;
  cashierUid: string;
  cashierName: string;
  cashierEmail: string;
  customerName?: string;
  customerMemberId?: string;
  customerWhatsapp?: string;
  items: PosTransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'QRIS';
  paymentStatus: 'verified' | 'pending_verification';
  cashReceived?: number;
  cashChange?: number;
  qrisRef?: string;
  notes?: string;
}

export type CallStatus =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connected'
  | 'ended'
  | 'rejected'
  | 'failed'
  | 'unanswered';

export interface CallSession {
  id: string;
  chatId: string;
  callerId: string;
  callerName: string;
  callerRole: 'admin' | 'customer';
  calleeId: string;
  calleeName: string;
  orderId?: string;
  status: CallStatus;
  offer?: any;
  answer?: any;
  callerCandidates?: any[];
  calleeCandidates?: any[];
  startedAt?: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

