import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Clock3, MapPin, Search, ShoppingBag, Sparkles, Truck, UtensilsCrossed } from 'lucide-react';
import { PromoBanner } from '../components/home/PromoBanner';
import { MemberCard } from '../components/member/MemberCard';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="mobile-bottom-space mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-7">
      <section className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-[0_10px_35px_rgba(24,24,27,0.06)]">
        <div className="relative isolate overflow-hidden bg-zinc-950 px-5 py-7 text-white sm:px-9 sm:py-10">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-red-600/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-300"><Sparkles className="h-3.5 w-3.5" /> Ayam crispy · Indramayu</div>
            <h1 className="max-w-xl text-[30px] font-black leading-[1.08] tracking-[-0.03em] sm:text-5xl">Renyahnya ayam, sausnya bikin balik lagi.</h1>
            <p className="mt-4 max-w-xl text-xs leading-6 text-zinc-300 sm:text-sm">Pesan menu favorit, simpan di troli, cek status pesanan, dan kumpulkan poin member dalam satu tempat.</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/menu" className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-xs font-black text-zinc-950 shadow-lg shadow-amber-950/20">Lihat Menu <ArrowRight className="h-4 w-4" /></Link>
              {!profile && <Link to="/register" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs font-extrabold text-white hover:bg-white/10">Daftar Member</Link>}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 bg-white p-3 sm:p-4">
          <Link to="/menu" className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3.5 ring-1 ring-zinc-200/70 transition hover:bg-zinc-100">
            <Search className="h-5 w-5 text-zinc-400" />
            <span className="flex-1 text-xs text-zinc-400 sm:text-sm">Cari ayam, saus, atau menu favoritmu...</span>
            <span className="hidden rounded-xl bg-white px-2.5 py-1.5 text-[9px] font-bold text-zinc-500 shadow-sm sm:block">Buka Menu</span>
          </Link>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
        <Link to="/menu" className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm hover:border-amber-300"><UtensilsCrossed className="h-5 w-5 text-amber-600" /><p className="mt-2 text-[11px] font-black text-zinc-900">Pesan Menu</p><p className="mt-0.5 text-[9px] text-zinc-500">Pilih favorit</p></Link>
        <Link to="/checkout" className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm hover:border-amber-300"><ShoppingBag className="h-5 w-5 text-amber-600" /><p className="mt-2 text-[11px] font-black text-zinc-900">Troli</p><p className="mt-0.5 text-[9px] text-zinc-500">Cek pesanan</p></Link>
        <Link to="/pesanan" className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm hover:border-amber-300"><Clock3 className="h-5 w-5 text-amber-600" /><p className="mt-2 text-[11px] font-black text-zinc-900">Riwayat</p><p className="mt-0.5 text-[9px] text-zinc-500">Lihat status</p></Link>
      </div>

      <div className="mt-7"><PromoBanner /></div>

      {profile && (
        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600">Member area</p><h2 className="mt-1 text-lg font-black tracking-tight text-zinc-950">Kartu & poin kamu</h2></div>
            <Link to="/member" className="text-[10px] font-extrabold text-zinc-500 hover:text-zinc-950">Detail member →</Link>
          </div>
          <MemberCard profile={profile} />
        </section>
      )}

      <section className="mt-7 rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Truck className="h-5 w-5" /></div>
          <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600">Layanan</p><h2 className="mt-1 text-base font-black text-zinc-950">Delivery & pemesanan online</h2><p className="mt-1.5 text-[11px] leading-5 text-zinc-500">Pesanan diproses selama jam operasional. Detail ongkir dan total akan mengikuti sistem checkout yang sudah tersedia.</p></div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-zinc-50 px-3.5 py-3 text-[10px] font-bold text-zinc-600"><Clock3 className="h-4 w-4 text-amber-600" /> Senin–Sabtu · 07.00–17.00 · Minggu tutup</div>
      </section>

      <section className="mt-7 rounded-[26px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">Tentang kami</p><h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">Mitra Master Kuliner Indonesia</h2><p className="mt-1.5 max-w-xl text-[11px] leading-5 text-zinc-600">MY CDC GATSU adalah mitra Master Kuliner Indonesia (MKI) dan telah hadir sejak 2024.</p></div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm"><Award className="h-5 w-5 text-amber-600" /><span className="text-[10px] font-extrabold text-zinc-800">Program member & poin</span></div>
        </div>
      </section>

      <section className="mt-7 rounded-[26px] bg-zinc-950 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-400">Outlet</p><h2 className="mt-1 text-lg font-black">Kunjungi MY CDC GATSU</h2><p className="mt-1.5 text-[11px] leading-5 text-zinc-400">Makan di tempat atau take away langsung dari outlet.</p></div>
          <a href="https://maps.app.goo.gl/pPDPnQA9NaJwpdbn9?g_st=ac&utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-[10px] font-black text-zinc-950"><MapPin className="h-4 w-4" /> Google Maps</a>
        </div>
      </section>
    </div>
  );
};
