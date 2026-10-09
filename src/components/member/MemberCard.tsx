import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award, ShieldCheck, Sparkles, Phone, CreditCard } from 'lucide-react';
import { UserProfile } from '../../types';
import { formatRupiah, pointsToRupiah } from '../../lib/utils';

interface MemberCardProps {
  profile: UserProfile;
  compact?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({ profile, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white p-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Member MY CDC GATSU
          </p>
          <h3 className="mt-1 truncate text-sm font-extrabold text-stone-900">
            {profile.name}
          </h3>
          <p className="mt-1 text-xs text-stone-600">
            {profile.points} poin
          </p>
          <p className="text-sm font-extrabold text-amber-700">
            {formatRupiah(pointsToRupiah(profile.points))}
          </p>
          <p className="mt-1 text-[10px] text-stone-500">
            Ketuk untuk melihat kartu member lengkap
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-stone-200 bg-white p-1.5">
          <QRCodeSVG
            value={profile.memberId}
            size={64}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 p-6 sm:p-8 text-white shadow-2xl border border-stone-800">
      {/* Decorative subtle texture glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      {/* Top Header Card */}
      <div className="relative z-10 flex items-center justify-between pb-6 border-b border-stone-800/80">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
            alt="Logo"
            className="h-10 w-auto object-contain brightness-110"
          />
          <div>
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
              MY CDC GATSU
            </h3>
            <p className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
              Loyalty VIP Member
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Member Aktif</span>
        </div>
      </div>

      {/* Middle Body with Member Info and QR Code */}
      <div className="relative z-10 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
        {/* Member Details */}
        <div className="sm:col-span-2 space-y-3">
          <div>
            <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider">Nama Anggota</span>
            <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">{profile.name}</h4>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-stone-300">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-bold tracking-wider text-amber-300">{profile.memberId}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-stone-400" />
              <span>{profile.whatsapp || '-'}</span>
            </div>
          </div>

          {/* Points Highlight */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-3 bg-stone-900/90 border border-stone-800 rounded-2xl p-3 sm:p-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-extrabold shadow-md">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Saldo Poin</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 leading-none">
                    {profile.points}
                  </span>
                  <span className="text-xs text-stone-400 font-semibold">
                    (= {formatRupiah(pointsToRupiah(profile.points))} hemat)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Container for Offline Cashier Scan */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl text-stone-950 border-4 border-amber-500/80">
          <QRCodeSVG
            value={profile.memberId}
            size={120}
            level="H"
            includeMargin={false}
          />
          <div className="mt-2 text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Scan Kasir Outlet</span>
            <span className="font-mono text-xs font-extrabold tracking-wider text-stone-900 block">{profile.memberId}</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 pt-4 border-t border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-stone-400 gap-2">
        <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tunjukkan QR saat transaksi offline di outlet atau gunakan poin saat delivery online.</span>
        </div>
        <span className="text-[10px] text-amber-500 font-semibold">1 Poin = Rp100 (Min. redeem 10 Poin)</span>
      </div>
    </div>
  );
};
