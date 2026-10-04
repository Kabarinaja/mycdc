import React from 'react';
import { MapPin, Phone, MessageSquare } from 'lucide-react';

export const Footer: React.FC = () => {
  const MAPS_URL = "https://maps.app.goo.gl/pPDPnQA9NaJwpdbn9?g_st=ac&utm_source=chatgpt.com";
  const WA_NUMBER = "082379474173";

  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-24 md:pb-12 border-t border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-stone-800">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
                alt="Logo MY CDC GATSU"
                className="h-10 w-auto object-contain brightness-110"
              />
              <div>
                <h3 className="text-white font-extrabold text-lg tracking-tight">MY CDC GATSU</h3>
                <p className="text-xs text-amber-500 font-semibold tracking-wider uppercase">Dicelup Ayam Crispy</p>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Sistem member resmi, pemesanan online delivery, dan program loyalitas poin MY CDC GATSU.
            </p>
          </div>

          {/* Quick Contacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Kontak Outlet</h4>
            <div className="space-y-2 text-xs">
              <a
                href={`https://wa.me/62${WA_NUMBER.substring(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-stone-300 hover:text-white transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-stone-800 text-emerald-400">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>WhatsApp: <strong className="text-white">{WA_NUMBER}</strong></span>
              </a>
              <div className="flex items-center gap-2.5 text-stone-400">
                <div className="p-1.5 rounded-lg bg-stone-800 text-amber-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span>Tersedia fitur Chat Outlet langsung di aplikasi</span>
              </div>
            </div>
          </div>

          {/* Location Button */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Kunjungi Outlet Kami</h4>
            <p className="text-xs text-stone-400">
              Nikmati ayam crispy renyah hangat langsung di tempat atau pesan delivery melalui website.
            </p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md group"
            >
              <MapPin className="w-4 h-4 text-stone-950 group-hover:scale-110 transition-transform" />
              <span>Lokasi Kami (Buka Google Maps)</span>
            </a>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <p>© 2026 MY CDC GATSU. Hak Cipta Dilindungi.</p>
          <p className="text-[11px] text-stone-500">
            Domain Resmi: <span className="text-stone-400 font-mono">dicelupayamcrispy.store</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
