import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';
import { UserProfile } from '../../types';
import { formatRupiah, pointsToRupiah } from '../../lib/utils';

interface MemberCardProps { profile: UserProfile; }

export const MemberCard: React.FC<MemberCardProps> = ({ profile }) => (
  <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 text-white shadow-[0_18px_45px_rgba(24,24,27,0.18)]">
    <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
    <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />

    <div className="relative p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm">
            <img src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png" alt="MY CDC GATSU" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">MY CDC GATSU</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-400">Official Member</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-extrabold text-emerald-300"><Sparkles className="h-3 w-3" /> Aktif</span>
      </div>

      <div className="relative mt-7 grid grid-cols-[1fr_auto] items-center gap-4 sm:gap-8">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500">Pemilik kartu</p>
          <h3 className="mt-1 truncate text-xl font-black tracking-tight sm:text-2xl">{profile.name}</h3>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-400">
            <CreditCard className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono font-bold tracking-widest text-zinc-300">{profile.memberId}</span>
          </div>

          <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-zinc-950"><Award className="h-5 w-5" /></div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Poin tersedia</p>
              <div className="flex items-baseline gap-1.5"><strong className="text-xl font-black text-amber-300">{profile.points}</strong><span className="text-[9px] text-zinc-500">≈ {formatRupiah(pointsToRupiah(profile.points))}</span></div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-2.5 shadow-xl">
          <QRCodeSVG value={profile.memberId} size={102} level="H" includeMargin={false} />
          <p className="mt-2 text-center text-[8px] font-black uppercase tracking-wider text-zinc-500">Scan di kasir</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-[9px] leading-relaxed text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <span>Gunakan QR member saat transaksi di outlet atau gunakan poin sesuai ketentuan program.</span>
      </div>
    </div>
  </div>
);
