import { Product, Order } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateMemberId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CDC-${result}`;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CDC${y}${m}${d}-${random}`;
}

export function toDateSafe(value: unknown): Date | null {
  if (!value) return null;

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else {
    return null;
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateIndo(dateValue: unknown): string {
  const d = toDateSafe(dateValue);
  if (!d) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

// 1 poin = Rp100
export const POINT_VALUE_IN_RUPIAH = 100;
export const MIN_POINT_REDEEM = 10; // 10 poin = Rp1.000

export function pointsToRupiah(points: number): number {
  if (points < MIN_POINT_REDEEM) return 0;
  return points * POINT_VALUE_IN_RUPIAH;
}

export function rupiahToPoints(rupiah: number): number {
  return Math.floor(rupiah / 1000); // 1 point per 1000 spent as reward
}

// Initial catalog products as required by user prompt
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'sadis',
    name: 'Sadis',
    description: 'Ayam krispi gurih dengan lumuran saus Sadis super pedas membakar lidah, favorit pecinta pedas sejati!',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-8fc4beda-99f1-4e51-b445-bf6b5355eca0.jpg',
    category: 'Saus Pedas',
    isActive: true,
    sortOrder: 1,
    badge: 'Best Seller Pedas',
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'mentai',
    name: 'Mentai',
    description: 'Ayam krispi diselimuti saus mentai lembut creamy bercita rasa gurih Jepang yang meleleh di mulut.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-5f704978-969c-4d7a-9ad6-ee07a2af6efd.jpg',
    category: 'Creamy',
    isActive: true,
    sortOrder: 2,
    badge: 'Favorit Creamy',
    prices: {
      tanpaNasi: 14000,
      denganNasi: 18000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'lada-hitam',
    name: 'Lada Hitam',
    description: 'Sensasi bumbu lada hitam pekat yang harum aromatik dengan sentuhan pedas manis gurih mantap.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-a4ef8163-80df-4d3a-af6c-a3e247cc50bb.jpg',
    category: 'Saus Gurih',
    isActive: true,
    sortOrder: 3,
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'keju',
    name: 'Keju',
    description: 'Ayam renyah berpadu saus keju cheddar kental yang creamy dan gurih lezat, disukai semua usia.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-c94a7dc9-6a79-43d0-ae05-aa1db38547b9.jpg',
    category: 'Creamy Cheese',
    isActive: true,
    sortOrder: 4,
    badge: 'Kids Favorite',
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'geprek',
    name: 'Geprek',
    description: 'Ayam goreng crispy digeprek dengan sambal bawang segar ulek dadakan yang wangi dan pedas nendang.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-586579ad-b883-4a11-8c85-f5d153856fb9.jpg',
    category: 'Sambal Tradisional',
    isActive: true,
    sortOrder: 5,
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'bbq',
    name: 'BBQ',
    description: 'Aroma smokey khas saus barbekyu dengan perpaduan rasa manis legit gurih yang meresap sempurna.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-04-29-35095ad3-5964-456a-b25b-18a7143c4d8d.jpg',
    category: 'Smoky Sweet',
    isActive: true,
    sortOrder: 6,
    prices: {
      tanpaNasi: 12000,
      denganNasi: 16000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
  {
    id: 'ori',
    name: 'Ori (Tanpa Saus)',
    description: 'Ayam goreng krispi original dengan kulit renyah berempah dan daging yang juicy gurih alami.',
    imageUrl: 'https://cdn.phototourl.com/member/2026-07-15-951385c9-005c-4e97-8c0c-6ac713e698c5.jpg',
    category: 'Original Crispy',
    isActive: true,
    sortOrder: 7,
    prices: {
      tanpaNasi: 10000,
      denganNasi: 13000,
    },
    extraOptions: {
      extraSaus: 2000,
      extraNasi: 4000,
    },
  },
];


// Official current pricing requested by MY CDC GATSU.
// This keeps the customer-facing catalog correct even if older Firestore price data is still present.
export function applyOfficialPricing(product: Product): Product {
  const official = INITIAL_PRODUCTS.find((item) => item.id === product.id);
  if (!official) return product;
  return {
    ...product,
    prices: official.prices,
    extraOptions: official.extraOptions,
  };
}

export function isOrderUnhandledAfter10Min(
  order: Order,
  nowTimeMs: number = Date.now()
): {
  isUnhandled: boolean;
  elapsedMinutes: number;
  remainingMinutes: number;
} {
  const createdDate = toDateSafe(order.createdAt);
  if (!createdDate) return { isUnhandled: false, elapsedMinutes: 0, remainingMinutes: 10 };

  const elapsedMs = nowTimeMs - createdDate.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  const remainingMinutes = Math.max(0, 10 - elapsedMinutes);

  // If order is offline POS, timeout escalation does not apply
  if (order.orderType === 'offline_pos') {
    return { isUnhandled: false, elapsedMinutes, remainingMinutes: 0 };
  }

  // Handled if completed, cancelled, in cooking/shipping, or has explicit adminActionAt
  const isHandled =
    Boolean(order.adminActionAt) ||
    Boolean(order.lastAdminActionAt) ||
    ['accepted', 'cooking', 'packing', 'shipping', 'completed', 'cancelled'].includes(order.orderStatus) ||
    order.paymentStatus === 'verified' ||
    order.paymentStatus === 'rejected';

  // Only online delivery orders that are unhandled and elapsed >= 10 min
  const isUnhandled = !isHandled && elapsedMs >= 10 * 60 * 1000;

  return {
    isUnhandled,
    elapsedMinutes,
    remainingMinutes,
  };
}

export function formatOrderWhatsAppMessage(order: Order): string {
  const itemsText = (order.items || [])
    .map(
      (it) =>
        `• ${it.quantity}x ${it.productName} (${it.variantLabel || it.variant})${
          it.chickenPartNote ? ` [Catatan: ${it.chickenPartNote}]` : ''
        } @ ${formatRupiah(it.basePrice)} = ${formatRupiah(it.itemSubtotal)}`
    )
    .join('\n');

  const paymentStatusIndo =
    order.paymentStatus === 'verified'
      ? 'Sudah Terverifikasi'
      : order.paymentStatus === 'rejected'
      ? 'Ditolak'
      : 'Menunggu Verifikasi Bukti';

  const dateStr = formatDateIndo(order.createdAt);

  return `*ESKALASI PESANAN DELIVERY CDC GATSU (LEWAT 10 MENIT)*
----------------------------------------------
*No. Pesanan:* ${order.orderNumber || order.id}
*Waktu Pesanan:* ${dateStr}
*Nama Pelanggan:* ${order.customerName}
*No. WhatsApp Pelanggan:* ${order.customerWhatsapp || '-'}
*ID Member:* ${order.memberId || '-'}

*Alamat Pengiriman:*
${order.deliveryAddress}
${order.addressNote ? `Patokan: ${order.addressNote}\n` : ''}*Wilayah:* ${
    order.shippingArea === 'indramayu_kota'
      ? 'Indramayu Kota (Ongkir Rp9.000)'
      : 'Luar Indramayu Kota (Ongkir Rp15.000)'
  }

*Rincian Menu:*
${itemsText}

----------------------------------------------
*Subtotal:* ${formatRupiah(order.subtotal)}
*Ongkir:* ${formatRupiah(order.shippingFee || 0)}
${order.discountFromPoints ? `*Diskon Poin:* -${formatRupiah(order.discountFromPoints)}\n` : ''}*TOTAL AKHIR:* ${formatRupiah(order.total)}
----------------------------------------------
*Metode Bayar:* ${order.paymentMethod?.toUpperCase() || 'QRIS'}
*Status Bayar:* ${paymentStatusIndo}
*Catatan Pelanggan:* ${order.adminNotes || '-'}

_Mohon kru outlet segera memproses pesanan ini. Terima kasih!_`;
}

