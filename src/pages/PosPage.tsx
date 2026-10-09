import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, PosTransaction, PosTransactionItem, ProductVariantKey } from '../types';
import { formatRupiah, INITIAL_PRODUCTS } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  RotateCcw,
  CheckCircle2,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  Calendar,
  Filter,
  User,
  ArrowLeft,
  X,
  AlertCircle,
  Receipt,
  Check,
} from 'lucide-react';

interface CartLineItem {
  id: string; // unique item id
  productId: string;
  productName: string;
  variant: ProductVariantKey;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export const PosPage: React.FC = () => {
  const { currentUser, profile, isAdmin, loading: authLoading } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Products from Firebase with INITIAL_PRODUCTS fallback
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // POS Cart State
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | null>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [qrisVerifiedByCashier, setQrisVerifiedByCashier] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerMemberId, setCustomerMemberId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Completed transaction for Receipt
  const [completedTx, setCompletedTx] = useState<PosTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Sales Summary Modal State
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryFilter, setSummaryFilter] = useState<'today' | '7days' | 'all'>('today');
  const [summaryTransactions, setSummaryTransactions] = useState<PosTransaction[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Real-time products listener
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Product[];
          const active = list
            .filter((p) => p.isActive !== false)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setProducts(active);
        } else {
          setProducts(INITIAL_PRODUCTS);
        }
        setLoadingProducts(false);
      },
      (err) => {
        console.warn('POS products note:', err.message);
        setProducts(INITIAL_PRODUCTS);
        setLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch summary transactions for reports
  const fetchSalesSummary = async () => {
    setLoadingSummary(true);
    try {
      const q = query(collection(db, 'orders'), where('orderType', '==', 'offline_pos'));
      const snap = await getDocs(q);
      const list: PosTransaction[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          receiptNumber: data.orderNumber || d.id,
          createdAt: data.createdAt || new Date().toISOString(),
          cashierUid: data.cashierUid || '',
          cashierName: data.cashierName || 'Kasir CDC',
          cashierEmail: data.userId || '',
          customerName: data.customerName || 'Pelanggan Outlet',
          customerMemberId: data.memberId || '',
          customerWhatsapp: data.customerWhatsapp || '',
          items: (data.items || []).map((it: any) => ({
            productId: it.productId || '',
            productName: it.productName || '',
            variant: it.variant || 'dengan_nasi',
            variantLabel: it.variantLabel || '',
            unitPrice: it.basePrice || 0,
            quantity: it.quantity || 1,
            subtotal: it.itemSubtotal || 0,
          })),
          subtotal: data.subtotal || 0,
          discount: data.discountFromPoints || 0,
          total: data.total || 0,
          paymentMethod: (data.paymentMethod?.toUpperCase() === 'CASH' ? 'CASH' : 'QRIS') as 'CASH' | 'QRIS',
          paymentStatus: data.paymentStatus === 'verified' ? 'verified' : 'pending_verification',
          cashReceived: data.cashReceived,
          cashChange: data.cashChange,
        };
      });
      setSummaryTransactions(list);
    } catch (e) {
      console.warn('Error fetching POS summary:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (showSummaryModal) {
      fetchSalesSummary();
    }
  }, [showSummaryModal]);

  // Auth Protection Check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-stone-300">Memeriksa otorisasi sistem POS...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-7 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto text-amber-500">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Akses Kasir Terproteksi</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Halaman POS (Point of Sale) khusus untuk staf kasir dan admin resmi outlet MY CDC GATSU. Silakan masuk dengan akun kru yang berwenang.
          </p>
          <div className="pt-3 flex flex-col gap-2.5">
            <Link
              to="/admingatsu"
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs transition-colors shadow-md"
            >
              Masuk Akun Kasir / Crew
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter Categories
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Cart operations
  const addToCart = (product: Product, variant: ProductVariantKey = 'dengan_nasi') => {
    const unitPrice =
      variant === 'ayam_saja'
        ? product.prices?.ayamSaja || product.prices?.tanpaNasi || 13000
        : variant === 'tanpa_nasi'
        ? product.prices?.tanpaNasi || 13000
        : product.prices?.denganNasi || 16000;

    const variantLabel =
      variant === 'ayam_saja'
        ? 'Ayam Saja'
        : variant === 'tanpa_nasi'
        ? 'Tanpa Nasi'
        : 'Dengan Nasi';

    const cartItemId = `${product.id}-${variant}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + 1;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          subtotal: newQty * next[existingIndex].unitPrice,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            id: cartItemId,
            productId: product.id,
            productName: product.name,
            variant,
            variantLabel,
            unitPrice,
            quantity: 1,
            subtotal: unitPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              subtotal: nextQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartLineItem[];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived(0);
    setDiscountAmount(0);
    setQrisVerifiedByCashier(false);
    setCustomerName('');
    setCustomerMemberId('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const cashChange = paymentMethod === 'CASH' ? Math.max(0, cashReceived - totalAmount) : 0;
  const isCashInsufficient = paymentMethod === 'CASH' && cashReceived < totalAmount;

  // Generate Unique Receipt ID
  const generateReceiptId = () => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `POS-${dateStr}-${rand}`;
  };

  // Submit Transaction to Firestore
  const handleCheckoutPOS = async () => {
    if (cart.length === 0) {
      showToast('Keranjang kasir masih kosong.', 'error');
      return;
    }

    if (!paymentMethod) {
      showToast('Wajib memilih metode pembayaran: CASH atau QRIS.', 'error');
      return;
    }

    if (paymentMethod === 'CASH' && cashReceived < totalAmount) {
      showToast('Uang tunai yang diterima masih kurang.', 'error');
      return;
    }

    if (paymentMethod === 'QRIS' && !qrisVerifiedByCashier) {
      showToast('Mohon centang verifikasi bahwa dana QRIS telah masuk.', 'error');
      return;
    }

    setSubmitting(true);
    const receiptNumber = generateReceiptId();
    const nowIso = new Date().toISOString();

    const posTxData: PosTransaction = {
      id: receiptNumber,
      receiptNumber,
      createdAt: nowIso,
      cashierUid: currentUser.uid,
      cashierName: profile?.name || 'Kasir CDC Gatsu',
      cashierEmail: currentUser.email || '',
      customerName: customerName.trim() || 'Pelanggan Outlet',
      customerMemberId: customerMemberId.trim() || undefined,
      items: cart.map((c) => ({
        productId: c.productId,
        productName: c.productName,
        variant: c.variant,
        variantLabel: c.variantLabel,
        unitPrice: c.unitPrice,
        quantity: c.quantity,
        subtotal: c.subtotal,
      })),
      subtotal,
      discount: discountAmount,
      total: totalAmount,
      paymentMethod,
      paymentStatus: 'verified',
      cashReceived: paymentMethod === 'CASH' ? cashReceived : undefined,
      cashChange: paymentMethod === 'CASH' ? cashChange : undefined,
      qrisRef: paymentMethod === 'QRIS' ? `QRIS-${Date.now().toString().slice(-6)}` : undefined,
      notes: 'Transaksi Langsung Kasir Outlet CDC Gatsu',
    };

    try {
      // 1. Simpan ke koleksi orders (dengan orderType offline_pos agar terhubung ke analitik & audit)
      const orderRef = doc(db, 'orders', receiptNumber);
      await setDoc(orderRef, {
        orderNumber: receiptNumber,
        userId: currentUser.uid,
        memberId: customerMemberId.trim() || 'OUTLET-OFFLINE',
        customerName: customerName.trim() || 'Pelanggan Outlet',
        customerWhatsapp: '-',
        deliveryAddress: 'Outlet MY CDC GATSU Indramayu (Dine-in / Take Away)',
        shippingArea: 'indramayu_kota',
        shippingFee: 0,
        items: cart.map((c) => ({
          id: c.id,
          productId: c.productId,
          productName: c.productName,
          productImage: '',
          variant: c.variant,
          variantLabel: c.variantLabel,
          basePrice: c.unitPrice,
          extraSausCount: 0,
          extraSausPrice: 0,
          extraNasiCount: 0,
          extraNasiPrice: 0,
          chickenPartNote: 'Bebas',
          quantity: c.quantity,
          itemSubtotal: c.subtotal,
        })),
        subtotal,
        pointsRedeemed: 0,
        discountFromPoints: discountAmount,
        total: totalAmount,
        paymentMethod: paymentMethod.toLowerCase(),
        paymentStatus: 'verified',
        orderStatus: 'completed',
        orderType: 'offline_pos',
        cashReceived: paymentMethod === 'CASH' ? cashReceived : null,
        cashChange: paymentMethod === 'CASH' ? cashChange : null,
        cashierUid: currentUser.uid,
        cashierName: profile?.name || 'Kasir CDC Gatsu',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        adminActionAt: serverTimestamp(),
      });

      // 2. Simpan juga ke pos_transactions untuk rekap POS kasir
      const posDocRef = doc(db, 'pos_transactions', receiptNumber);
      await setDoc(posDocRef, {
        ...posTxData,
        createdAt: serverTimestamp(),
      });

      setCompletedTx(posTxData);
      setShowReceiptModal(true);
      showToast('Transaksi kasir berhasil disimpan!', 'success', 'Transaksi Sukses');
    } catch (err: any) {
      console.error('POS Checkout error:', err);
      showToast('Gagal menyimpan transaksi: ' + (err.message || 'Coba lagi'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleStartNewTransaction = () => {
    clearCart();
    setCompletedTx(null);
    setShowReceiptModal(false);
  };

  // Filter Summary Calculations
  const now = new Date();
  const filteredSummaryList = summaryTransactions.filter((tx) => {
    if (summaryFilter === 'all') return true;
    const txDate = new Date(tx.createdAt);
    if (summaryFilter === 'today') {
      return (
        txDate.getDate() === now.getDate() &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      );
    }
    if (summaryFilter === '7days') {
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return true;
  });

  const cashIncome = filteredSummaryList
    .filter((tx) => tx.paymentMethod === 'CASH')
    .reduce((sum, tx) => sum + (tx.total || 0), 0);

  const qrisIncome = filteredSummaryList
    .filter((tx) => tx.paymentMethod === 'QRIS')
    .reduce((sum, tx) => sum + (tx.total || 0), 0);

  const totalIncome = cashIncome + qrisIncome;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* POS Top Navigation Bar */}
      <header className="bg-stone-900 border-b border-stone-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 transition-colors"
            title="Kembali ke Dashboard Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <img
            src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
            alt="MY CDC Logo"
            className="h-8 w-auto object-contain"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-tight">KASIR POS CDC GATSU</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Kasir: <strong className="text-amber-400">{profile?.name || currentUser.email}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSummaryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Rekap Omzet Kasir</span>
          </button>

          <Link
            to="/admin/orders"
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 text-xs font-bold transition-colors"
          >
            Pesanan Online
          </Link>
        </div>
      </header>

      {/* POS Main Workspace (2-Column Layout) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT COLUMN: Product Catalog (Cols 7 on Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-60px)]">
          {/* Search & Category Filter */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu ayam, saus, minuman..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-2xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors capitalize ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-850'
                  }`}
                >
                  {cat === 'all' ? 'Semua Menu' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loadingProducts ? (
            <div className="py-20 text-center text-xs text-stone-400">
              Memuat daftar produk kasir...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-stone-500 text-xs">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((prod) => {
                const defaultPrice = prod.prices?.denganNasi || prod.prices?.tanpaNasi || 16000;
                return (
                  <div
                    key={prod.id}
                    className="bg-stone-900 border border-stone-800 rounded-2xl p-3 flex flex-col justify-between hover:border-stone-700 transition-all shadow-xs group"
                  >
                    <div>
                      {prod.imageUrl ? (
                        <div className="h-28 w-full rounded-xl overflow-hidden bg-stone-950 mb-2.5">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-full rounded-xl bg-stone-950 flex items-center justify-center text-stone-600 mb-2.5">
                          <Store className="w-6 h-6" />
                        </div>
                      )}
                      <h3 className="font-bold text-xs text-white line-clamp-1">{prod.name}</h3>
                      <p className="text-[10px] text-stone-400 capitalize mt-0.5">{prod.category}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400">
                          {formatRupiah(defaultPrice)}
                        </span>
                      </div>

                      {/* Variant Buttons */}
                      <div className="grid grid-cols-2 gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => addToCart(prod, 'dengan_nasi')}
                          className="py-1 px-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-[10px] font-bold text-stone-300 transition-colors text-center"
                          title="Tambah + Nasi (Rp16.000)"
                        >
                          + Nasi
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(prod, 'tanpa_nasi')}
                          className="py-1 px-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-[10px] font-bold text-stone-300 transition-colors text-center"
                          title="Tambah Tanpa Nasi (Rp13.000)"
                        >
                          Tnp Nasi
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: POS Cart & Checkout Station (Cols 5 on Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-stone-900 border-l border-stone-800 p-4 sm:p-5 flex flex-col justify-between max-h-[calc(100vh-60px)] overflow-y-auto">
          <div className="space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-black text-white">Keranjang Transaksi</h2>
                <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-[10px] font-bold">
                  {cart.reduce((s, it) => s + it.quantity, 0)} item
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* Member Info Input (Optional) */}
            <div className="bg-stone-950 p-2.5 rounded-2xl border border-stone-800/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-stone-400 text-[11px] font-bold">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Data Pelanggan / Member (Opsional)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pembeli"
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={customerMemberId}
                  onChange={(e) => setCustomerMemberId(e.target.value)}
                  placeholder="ID Member / No HP"
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs">
                  Belum ada item dipilih. Klik menu di katalog untuk menambahkan.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs"
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="font-bold text-white truncate">{item.productName}</p>
                      <p className="text-[10px] text-stone-400">
                        {item.variantLabel} • {formatRupiah(item.unitPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-stone-750 bg-stone-900 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:text-amber-400 text-stone-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-amber-400 text-stone-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-xs min-w-[65px] text-right">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout & Payment Section */}
          <div className="pt-4 border-t border-stone-800 space-y-4">
            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal</span>
                <span className="font-mono text-stone-200">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-400 items-center">
                <span>Diskon / Potongan</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-stone-500">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-20 px-2 py-0.5 bg-stone-950 border border-stone-800 rounded text-right text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-800">
                <span className="text-sm font-bold text-white">Total Tagihan</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector (CASH or QRIS) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 block">
                Metode Pembayaran (Wajib Dipilih):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md font-black'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-850'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>CASH (TUNAI)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md font-black'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-850'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS OUTLET</span>
                </button>
              </div>
            </div>

            {/* Dynamic Payment Input Section */}
            {paymentMethod === 'CASH' && (
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 font-medium">Uang Diterima Kasir:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                    placeholder="Contoh: 50000"
                    className="w-32 px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-right font-mono font-bold text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Cash Quick Buttons */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashReceived(totalAmount)}
                    className="flex-1 py-1 rounded bg-stone-850 hover:bg-stone-800 text-[10px] font-bold text-stone-300"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived(20000)}
                    className="flex-1 py-1 rounded bg-stone-850 hover:bg-stone-800 text-[10px] font-bold text-stone-300"
                  >
                    20.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived(50000)}
                    className="flex-1 py-1 rounded bg-stone-850 hover:bg-stone-800 text-[10px] font-bold text-stone-300"
                  >
                    50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived(100000)}
                    className="flex-1 py-1 rounded bg-stone-850 hover:bg-stone-800 text-[10px] font-bold text-stone-300"
                  >
                    100.000
                  </button>
                </div>

                {/* Change Calculation */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-900">
                  <span className="text-stone-400 font-medium">Kembalian:</span>
                  <span
                    className={`font-mono text-sm font-black ${
                      isCashInsufficient ? 'text-rose-500' : 'text-emerald-400'
                    }`}
                  >
                    {isCashInsufficient
                      ? `Kurang ${formatRupiah(totalAmount - cashReceived)}`
                      : formatRupiah(cashChange)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'QRIS' && (
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-lg">
                    <QRCodeSVG value="https://www.dicelupayamcrispy.store/" size={56} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">QRIS MY CDC GATSU</p>
                    <p className="text-[10px] text-stone-400">
                      Tunjukkan QRIS ke pelanggan untuk dipindai melalui BCA, Mandiri, GoPay, OVO, Dana, dll.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-2 p-2 bg-stone-900 rounded-xl border border-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrisVerifiedByCashier}
                    onChange={(e) => setQrisVerifiedByCashier(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-stone-300 font-semibold leading-tight">
                    Saya mengonfirmasi bahwa dana senilai <strong>{formatRupiah(totalAmount)}</strong> telah berhasil masuk ke mutasi QRIS merchant outlet.
                  </span>
                </label>
              </div>
            )}

            {/* Submit Transaction Button */}
            <button
              type="button"
              disabled={
                submitting ||
                cart.length === 0 ||
                !paymentMethod ||
                isCashInsufficient ||
                (paymentMethod === 'QRIS' && !qrisVerifiedByCashier)
              }
              onClick={handleCheckoutPOS}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Menyimpan Transaksi...' : 'Bayar & Cetak Struk Kasir'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: THERMAL RECEIPT PREVIEW & PRINT */}
      {showReceiptModal && completedTx && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={handleStartNewTransaction}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Thermal Receipt Box */}
            <div id="thermal-receipt" className="border border-stone-300 p-4 rounded-xl font-mono text-xs space-y-3 bg-stone-50">
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-stone-400">
                <h2 className="font-black text-sm tracking-tight">MY CDC GATSU</h2>
                <p className="text-[10px]">DICELUP AYAM CRISPY INDRAMAYU</p>
                <p className="text-[9px] text-stone-500">Jl. Gatot Subroto No. 45 Indramayu</p>
                <p className="text-[9px] text-stone-500">Telp: 0823-7947-4173</p>
              </div>

              <div className="space-y-0.5 text-[10px] text-stone-600 pb-2 border-b border-dashed border-stone-400">
                <div className="flex justify-between">
                  <span>No: {completedTx.receiptNumber}</span>
                  <span>{new Date(completedTx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tgl: {new Date(completedTx.createdAt).toLocaleDateString('id-ID')}</span>
                  <span>Kasir: {completedTx.cashierName}</span>
                </div>
                {completedTx.customerName && (
                  <div className="flex justify-between font-semibold text-stone-800">
                    <span>Pelanggan:</span>
                    <span>{completedTx.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-stone-400">
                {completedTx.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <p className="font-bold">{it.productName}</p>
                      <p className="text-[9px] text-stone-500">
                        {it.quantity} x {formatRupiah(it.unitPrice)} ({it.variantLabel})
                      </p>
                    </div>
                    <span className="font-semibold text-right">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-stone-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(completedTx.subtotal)}</span>
                </div>
                {completedTx.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(completedTx.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-stone-300">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(completedTx.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-stone-600">
                  <span>Metode:</span>
                  <span className="font-bold uppercase">{completedTx.paymentMethod}</span>
                </div>
                {completedTx.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between text-[10px]">
                      <span>Tunai Diterima:</span>
                      <span>{formatRupiah(completedTx.cashReceived || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-emerald-700">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(completedTx.cashChange || 0)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-[10px] font-bold text-emerald-600 pt-1">
                  <span>STATUS:</span>
                  <span>LUNAS (VERIFIED)</span>
                </div>
              </div>

              <div className="text-center pt-1 space-y-1 text-[10px] text-stone-500">
                <p>Terima kasih atas kunjungan Anda!</p>
                <p className="text-[8px]">Simpan struk ini sebagai bukti pembayaran sah.</p>
              </div>
            </div>

            {/* Print & Next Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk (Print)</span>
              </button>
              <button
                type="button"
                onClick={handleStartNewTransaction}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Transaksi Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SALES SUMMARY (OMZET REKAP KASIR) */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm text-white">Ringkasan Omzet Kasir Outlet</h3>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Filters */}
            <div className="flex items-center gap-1.5">
              {[
                { id: 'today', label: 'Hari Ini' },
                { id: '7days', label: '7 Hari Terakhir' },
                { id: 'all', label: 'Semua Waktu' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSummaryFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    summaryFilter === f.id
                      ? 'bg-amber-500 text-stone-950 font-black'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Income Breakdown Cards (CASH vs QRIS strictly separated) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400 text-xs">
                  <span>Omzet CASH</span>
                  <Banknote className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-lg font-black text-emerald-400 font-mono">
                  {formatRupiah(cashIncome)}
                </p>
                <p className="text-[10px] text-stone-500">
                  {filteredSummaryList.filter((t) => t.paymentMethod === 'CASH').length} Transaksi Tunai
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400 text-xs">
                  <span>Omzet QRIS</span>
                  <QrCode className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-lg font-black text-cyan-400 font-mono">
                  {formatRupiah(qrisIncome)}
                </p>
                <p className="text-[10px] text-stone-500">
                  {filteredSummaryList.filter((t) => t.paymentMethod === 'QRIS').length} Transaksi QRIS
                </p>
              </div>
            </div>

            {/* Total Aggregate */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-300 font-bold">TOTAL OMZET POS OUTLET</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Total {filteredSummaryList.length} Transaksi Kasir
                </p>
              </div>
              <p className="text-xl font-black text-amber-400 font-mono">
                {formatRupiah(totalIncome)}
              </p>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
              >
                Tutup Rekap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
