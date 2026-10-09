import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Award,
  Truck,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { PromoBanner } from '../components/home/PromoBanner';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { INITIAL_PRODUCTS, formatRupiah, applyOfficialPricing } from '../lib/utils';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MemberCard } from '../components/member/MemberCard';

export const HomePage: React.FC = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc')
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Product[];

          const pricedList = list.map(applyOfficialPricing);

          const filtered = pricedList.filter(
            (p) =>
              !p.name.toLowerCase().includes('teriyaki') &&
              !p.name.toLowerCase().includes('wings')
          );

          if (filtered.length > 0) {
            setProducts(filtered);
          }
        }
      } catch (err) {
        console.warn(
          'Note using initial catalog while firestore syncs:',
          err
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <div className="pb-16 max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">

      {/* MEMBER RINGKAS DI BAGIAN ATAS */}
      {profile && (
        <section className="mb-5">
          <Link
            to="/member"
            aria-label="Buka kartu member lengkap"
            className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <MemberCard profile={profile} compact />
          </Link>
        </section>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 text-stone-950 p-6 sm:p-10 mb-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

          <div className="md:col-span-7 space-y-4">

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
              Renyahnya Juara, Dibalut Saus Spesial yang Mantap.
            </h1>

            <p className="text-sm sm:text-base font-medium text-stone-900/90 leading-relaxed max-w-xl">
              Pesan ayam krispi favoritmu dari rumah atau nikmati keuntungan member loyalty dengan kumpulkan poin setiap pesanan.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/menu"
                className="px-6 py-3 rounded-2xl bg-stone-950 text-amber-400 font-extrabold text-sm hover:bg-stone-900 transition-all shadow-lg flex items-center gap-2 group"
              >
                <span>Lihat Menu & Pesan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {!profile && (
                <Link
                  to="/register"
                  className="px-5 py-3 rounded-2xl bg-white/90 hover:bg-white text-stone-950 font-bold text-sm transition-all shadow-sm"
                >
                  Daftar Member (Gratis)
                </Link>
              )}
            </div>
          </div>

          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 transform rotate-1 hover:rotate-0 transition-transform">
              <img
                src="https://cdn.phototourl.com/member/2026-04-29-8fc4beda-99f1-4e51-b445-bf6b5355eca0.jpg"
                alt="Ayam Sadis MY CDC GATSU"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* PROMOTION */}
      <PromoBanner />

      {/* DELIVERY */}
      <section className="mb-10 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-200 shrink-0">
              <Truck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-stone-900">
                Pengantaran Langsung ke Rumah
              </h3>

              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                Kami melayani pesanan online delivery dengan tarif ongkir terjangkau ke alamat Anda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <span className="text-stone-500 block text-[10px] uppercase font-bold">
                Indramayu Kota
              </span>

              <strong className="text-stone-900 font-extrabold text-sm">
                Rp9.000
              </strong>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <span className="text-stone-500 block text-[10px] uppercase font-bold">
                Luar Indramayu Kota
              </span>

              <strong className="text-stone-900 font-extrabold text-sm">
                Rp15.000
              </strong>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURED MENU */}
      <section className="mb-12">

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Menu Favorit MY CDC
            </h2>

            <p className="text-xs text-stone-500">
              Pilihan varian saus andalan yang selalu bikin ketagihan
            </p>
          </div>

          <Link
            to="/menu"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group"
          >
            <span>Semua Menu</span>

            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {products.slice(0, 6).map((item) => (

            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
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
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-stone-900/90 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                      {item.badge}
                    </span>
                  )}

                </div>

                <div className="p-4 space-y-1.5">

                  <div className="flex items-center justify-between">

                    <h3 className="font-extrabold text-base text-stone-900">
                      {item.name}
                    </h3>

                    <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>

                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                </div>

              </div>

              <div className="p-4 pt-0">

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">

                  <div>

                    <span className="text-[10px] text-stone-500 font-semibold block">
                      Mulai dari
                    </span>

                    <span className="text-sm font-black text-amber-600">
                      {formatRupiah(item.prices.tanpaNasi)}
                    </span>

                  </div>

                  <Link
                    to="/menu"
                    className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Pilih Varian</span>
                  </Link>

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* MEMBER BENEFIT */}
      <section className="mb-12 bg-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-stone-800">

        <div className="max-w-3xl">

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold mb-3">
            <Award className="w-3.5 h-3.5" />
            <span>Sistem Loyalitas Member</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
            Kumpulkan Poin Tiap Kali Beli, Dapatkan Potongan Harga Nyata!
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
            Setiap pelanggan yang terdaftar berhak mengumpulkan poin. Gunakan poin tersebut untuk langsung memotong total belanja pesanan online atau tunjukkan QR member saat beli di outlet.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

            <div className="p-4 rounded-2xl bg-stone-850 border border-stone-800">
              <span className="text-2xl font-black text-amber-400 block mb-1">
                1 Poin = Rp100
              </span>

              <p className="text-xs text-stone-400">
                10 Poin bernilai Rp1.000, 100 Poin bernilai Rp10.000!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-850 border border-stone-800">
              <span className="text-2xl font-black text-amber-400 block mb-1">
                Min. 10 Poin
              </span>

              <p className="text-xs text-stone-400">
                Cukup kumpulkan 10 poin untuk mulai menikmati potongan diskon.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-850 border border-stone-800">
              <span className="text-2xl font-black text-amber-400 block mb-1">
                QR Member
              </span>

              <p className="text-xs text-stone-400">
                Bisa dipakai baik delivery online maupun beli langsung di outlet.
              </p>
            </div>

          </div>

          {!profile && (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-lg"
            >
              <span>Daftar Sekarang & Mulai Kumpulkan Poin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

        </div>

      </section>

      {/* OUTLET LOCATION */}
      <section className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div className="space-y-2">

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
              Kunjungi Kami Langsung
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-stone-900">
              Outlet MY CDC GATSU
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed">
              Ingin makan di tempat atau take away langsung? Kami siap menyajikan ayam crispy hangat renyah favorit Anda.
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <a
              href="https://maps.app.goo.gl/pPDPnQA9NaJwpdbn9?g_st=ac&utm_source=chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Buka Google Maps</span>
            </a>

          </div>

        </div>

      </section>

    </div>
  );
};
