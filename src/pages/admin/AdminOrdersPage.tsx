import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { formatRupiah, formatDateIndo, isOrderUnhandledAfter10Min, formatOrderWhatsAppMessage } from '../../lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/OrderBadge';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  Filter,
  Check,
  ChefHat,
  Package,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('status') || 'all';

  const { showToast } = useNotification();
  const { currentUser } = useAuth();

  // Quick proof preview modal
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Live timer for 10-minute SLA tracking
  const [nowTimeMs, setNowTimeMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimeMs(Date.now());
    }, 5000); // Check every 5 seconds
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Order[];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Orders listener note:', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filterParam === 'all') return true;
    if (filterParam === 'pending_verification') return o.paymentStatus === 'pending_verification';
    if (filterParam === 'processing') return ['accepted', 'cooking', 'packing'].includes(o.orderStatus);
    if (filterParam === 'shipping') return o.orderStatus === 'shipping';
    if (filterParam === 'completed') return o.orderStatus === 'completed';
    if (filterParam === 'cancelled') return o.orderStatus === 'cancelled';
    return o.orderStatus === filterParam;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Kelola Pesanan Outlet</h1>
          <p className="text-xs text-stone-400">Verifikasi bukti transfer QRIS dan kendalikan status pemrosesan dapur</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-800">
        {[
          { key: 'all', label: 'Semua Pesanan' },
          { key: 'pending_verification', label: 'Perlu Verifikasi Bukti', badge: orders.filter((o) => o.paymentStatus === 'pending_verification').length },
          { key: 'processing', label: 'Sedang Dimasak / Dikemas' },
          { key: 'shipping', label: 'Sedang Diantar' },
          { key: 'completed', label: 'Selesai' },
          { key: 'cancelled', label: 'Dibatalkan' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSearchParams({ status: tab.key })}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterParam === tab.key
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List / Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400">Memuat data pesanan...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-stone-500 text-xs">
          Tidak ada pesanan pada kategori filter ini.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const sla = isOrderUnhandledAfter10Min(ord, nowTimeMs);
            const waText = formatOrderWhatsAppMessage(ord);
            const waUrl = `https://wa.me/6282379474173?text=${encodeURIComponent(waText)}`;

            return (
              <div
                key={ord.id}
                className={`border rounded-3xl p-5 space-y-4 shadow-sm transition-all ${
                  sla.isUnhandled
                    ? 'bg-rose-950/20 border-rose-700/80 ring-1 ring-rose-600/50'
                    : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* 10-Minute Timeout Escalation Warning Banner */}
                {sla.isUnhandled && (
                  <div className="p-3 bg-rose-900/60 border border-rose-600 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-rose-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                      <div>
                        <p className="font-black text-rose-200">
                          ⚠️ Melebihi 10 Menit Tanpa Tindakan Admin! ({sla.elapsedMinutes} menit berlalu)
                        </p>
                        <p className="text-[11px] text-rose-300">
                          Pesanan delivery belum diproses/diverifikasi. Segera koordinasikan dengan kru via WhatsApp.
                        </p>
                      </div>
                    </div>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs transition-colors shadow-md shrink-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Kirim pesanan ke WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-850 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-stone-900 rounded-2xl text-amber-400 border border-stone-800">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white font-mono">{ord.orderNumber || ord.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-850 text-stone-300 font-bold text-[10px]">
                          {ord.shippingArea === 'indramayu_kota' ? 'Indramayu Kota (9rb)' : 'Luar Kota (15rb)'}
                        </span>
                        {/* Elapsed Time Badge */}
                        <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-750 text-stone-300 text-[10px] flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{sla.elapsedMinutes}m lalu</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {ord.customerName} ({ord.customerWhatsapp}) • {formatDateIndo(ord.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={ord.orderStatus} />
                    <PaymentStatusBadge status={ord.paymentStatus} />
                  </div>
                </div>

              {/* Items & Address Summary */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                {/* Items */}
                <div className="md:col-span-6 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Menu Dipesan</span>
                  <div className="space-y-1 text-stone-300">
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {it.quantity}x {it.productName} ({it.variantLabel}) - {it.chickenPartNote || 'Bebas'}
                        </span>
                        <span className="font-semibold text-stone-400">{formatRupiah(it.itemSubtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-4 space-y-1 text-stone-400">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Alamat Antar</span>
                  <p className="text-stone-300 line-clamp-2 leading-relaxed">{ord.deliveryAddress}</p>
                  {ord.addressNote && (
                    <p className="text-[11px] text-amber-400/90 italic">Patokan: {ord.addressNote}</p>
                  )}
                </div>

                {/* Total & Proof */}
                <div className="md:col-span-2 flex flex-col justify-between items-start md:items-end">
                  <div>
                    <span className="text-[10px] text-stone-500 block">Total Tagihan</span>
                    <span className="text-base font-black text-amber-400">{formatRupiah(ord.total)}</span>
                  </div>

                  {ord.paymentProofUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewProofUrl(ord.paymentProofUrl || null)}
                      className="mt-2 text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Bukti QRIS</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-stone-850 flex items-center justify-between text-xs">
                <span className="text-[11px] text-stone-500">
                  ID Member: <strong className="text-stone-300 font-mono">{ord.memberId}</strong>
                  {ord.pointsRedeemed > 0 && ` • Pakai ${ord.pointsRedeemed} Poin`}
                </span>

                <Link
                  to={`/admin/orders/${ord.id}`}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-sm"
                >
                  Kelola Detail Pesanan &gt;
                </Link>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Proof Preview Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="text-sm font-bold text-white">Bukti Transfer QRIS Pelanggan</h3>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="text-stone-400 hover:text-white text-xs font-bold px-2 py-1 bg-stone-800 rounded-lg"
              >
                Tutup
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-stone-950 max-h-[70vh] flex items-center justify-center p-2">
              <img
                src={previewProofUrl}
                alt="Bukti Transfer"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
