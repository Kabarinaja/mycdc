import React, { useState, useEffect } from 'react';
import { Product, ProductVariantKey } from '../types';
import { INITIAL_PRODUCTS, formatRupiah } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Plus, Check, ShoppingBag, X, Info, Flame } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const MenuPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal customizer state
  const [variant, setVariant] = useState<ProductVariantKey>('dengan_nasi');
  const [extraSausCount, setExtraSausCount] = useState(0);
  const [extraNasiCount, setExtraNasiCount] = useState(0);
  const [chickenPartNote, setChickenPartNote] = useState('Bebas');
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();
  const { showToast } = useNotification();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
          // Strictly exclude Teriyaki and Wings
          const validList = list.filter(
            (p) =>
              !p.name.toLowerCase().includes('teriyaki') &&
              !p.name.toLowerCase().includes('wings')
          );
          if (validList.length > 0) {
            setProducts(validList);
          }
        }
      } catch (e) {
        console.warn('Note using initial catalog:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const openCustomizer = (product: Product) => {
    setSelectedProduct(product);
    // If product is Mentai, default to 'dengan_nasi' because Mentai doesn't offer ayam saja
    if (!product.prices.ayamSaja) {
      setVariant('dengan_nasi');
    } else {
      setVariant('dengan_nasi');
    }
    setExtraSausCount(0);
    setExtraNasiCount(0);
    setChickenPartNote('Bebas');
    setQuantity(1);
  };

  const getVariantPrice = (prod: Product, v: ProductVariantKey): number => {
    if (v === 'ayam_saja') return prod.prices.ayamSaja || 10000;
    if (v === 'tanpa_nasi') return prod.prices.tanpaNasi || 12000;
    return prod.prices.denganNasi || 16000;
  };

  const getVariantLabel = (v: ProductVariantKey): string => {
    if (v === 'ayam_saja') return 'Ayam Saja';
    if (v === 'tanpa_nasi') return 'Tanpa Nasi';
    return 'Dengan Nasi';
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const basePrice = getVariantPrice(selectedProduct, variant);
    addToCart({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.imageUrl,
      variant,
      variantLabel: getVariantLabel(variant),
      basePrice,
      extraSausCount,
      extraSausPrice: selectedProduct.extraOptions.extraSaus || 2000,
      extraNasiCount,
      extraNasiPrice: selectedProduct.extraOptions.extraNasi || 4000,
      chickenPartNote,
      quantity,
    });

    showToast(
      `${quantity}x ${selectedProduct.name} (${getVariantLabel(variant)}) ditambahkan ke pesanan.`,
      'success',
      'Ditambahkan ke Keranjang'
    );

    setSelectedProduct(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Title Header */}
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Daftar Menu MY CDC GATSU
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-600">
          Ayam renyah krispi dengan aneka lumuran saus pilihan terbaik. Silakan pilih menu dan tentukan paket favoritmu.
        </p>
      </div>

      {/* Notice info on chicken part */}
      <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Catatan:</strong> Anda dapat memilih preferensi bagian ayam (dada, paha, atau sayap) saat memesan. Permintaan bagian ayam menyesuaikan ketersediaan harian di outlet.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((item) => {
          const startingPrice = item.prices.ayamSaja || item.prices.tanpaNasi;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/90 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm shadow-md">
                      {item.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-stone-900/80 text-white text-[11px] font-bold backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-extrabold text-lg text-stone-900">{item.name}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed min-h-[36px]">
                    {item.description}
                  </p>

                  {/* Price Tag Preview */}
                  <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-stone-600">
                    {item.prices.ayamSaja && (
                      <span className="px-2 py-0.5 rounded-lg bg-stone-100">
                        Ayam saja: <strong>{formatRupiah(item.prices.ayamSaja)}</strong>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100">
                      Tanpa nasi: <strong>{formatRupiah(item.prices.tanpaNasi)}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      + Nasi: <strong>{formatRupiah(item.prices.denganNasi)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => openCustomizer(item)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pesan Sekarang (Mulai {formatRupiah(startingPrice)})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Customizer Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
                />
                <div>
                  <h3 className="text-lg font-black text-stone-900">{selectedProduct.name}</h3>
                  <p className="text-xs text-stone-500">{selectedProduct.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Variant Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Pilih Paket Ayam
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedProduct.prices.ayamSaja && (
                  <button
                    type="button"
                    onClick={() => setVariant('ayam_saja')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      variant === 'ayam_saja'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-900">Ayam Saja</span>
                    <span className="block text-xs text-amber-700 font-extrabold mt-1">
                      {formatRupiah(selectedProduct.prices.ayamSaja)}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setVariant('tanpa_nasi')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    variant === 'tanpa_nasi'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-xs font-bold text-stone-900">Tanpa Nasi</span>
                  <span className="block text-xs text-amber-700 font-extrabold mt-1">
                    {formatRupiah(selectedProduct.prices.tanpaNasi)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVariant('dengan_nasi')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    variant === 'dengan_nasi'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-xs font-bold text-stone-900">+ Nasi Hangat</span>
                  <span className="block text-xs text-amber-700 font-extrabold mt-1">
                    {formatRupiah(selectedProduct.prices.denganNasi)}
                  </span>
                </button>
              </div>
            </div>

            {/* Chicken Part Preference */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Preferensi Bagian Ayam
                </label>
                <span className="text-[10px] text-amber-700 font-semibold">Opsional</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {['Bebas', 'Minta dada', 'Minta paha', 'Minta sayap'].map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setChickenPartNote(part)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                      chickenPartNote === part
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-500 italic">
                *Permintaan bagian ayam menyesuaikan ketersediaan di outlet saat pesanan diproses.
              </p>
            </div>

            {/* Extras Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Pilihan Tambahan (Extra)
              </label>

              {/* Extra Saus */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50/50">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Extra Saus {selectedProduct.name}</span>
                  <span className="text-[11px] text-stone-500">+Rp2.000 / porsi</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraSausCount((c) => Math.max(0, c - 1))}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 text-sm"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{extraSausCount}</span>
                  <button
                    type="button"
                    onClick={() => setExtraSausCount((c) => c + 1)}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Extra Nasi */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50/50">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Extra Nasi Putih</span>
                  <span className="text-[11px] text-stone-500">+Rp4.000 / porsi</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraNasiCount((c) => Math.max(0, c - 1))}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 text-sm"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{extraNasiCount}</span>
                  <button
                    type="button"
                    onClick={() => setExtraNasiCount((c) => c + 1)}
                    className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold text-stone-800 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quantity and Final Subtotal button */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold text-stone-900"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-xs">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold text-stone-900"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm transition-colors flex items-center justify-between shadow-md"
              >
                <span>Tambahkan</span>
                <span>
                  {formatRupiah(
                    (getVariantPrice(selectedProduct, variant) +
                      extraSausCount * 2000 +
                      extraNasiCount * 4000) *
                      quantity
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
