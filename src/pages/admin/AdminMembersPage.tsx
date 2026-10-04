import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, PointTransaction, Order } from '../../types';
import { formatRupiah, pointsToRupiah, generateOrderNumber } from '../../lib/utils';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Award,
  Phone,
  CreditCard,
  Plus,
  Minus,
  Store,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

export const AdminMembersPage: React.FC = () => {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected member for Offline POS purchase or Adjustment
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [modalMode, setModalMode] = useState<'offline_pos' | 'adjust_points' | null>(null);

  // Offline POS Form state
  const [posBillAmount, setPosBillAmount] = useState<number>(16000);
  const [posPointsRedeem, setPosPointsRedeem] = useState<number>(0);
  const [posRewardPoints, setPosRewardPoints] = useState<number>(16);
  const [posNotes, setPosNotes] = useState('Pembelian kasir outlet CDC Gatsu');

  // Manual Adjust Form state
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');

  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useNotification();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as UserProfile[];
        setMembers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Members snapshot note:', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.name?.toLowerCase().includes(term) ||
      m.whatsapp?.toLowerCase().includes(term) ||
      m.memberId?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term)
    );
  });

  // Calculate POS discount: 1 point = Rp100
  const posDiscountRp = posPointsRedeem >= 10 ? posPointsRedeem * 100 : 0;
  const posFinalPayable = Math.max(0, posBillAmount - posDiscountRp);

  const handleProcessOfflinePOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    if (posPointsRedeem > selectedMember.points) {
      showToast('Poin yang ingin di-redeem melebihi saldo member.', 'error');
      return;
    }

    if (posPointsRedeem > 0 && posPointsRedeem < 10) {
      showToast('Minimum redeem poin adalah 10 poin.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();
      const orderId = doc(collection(db, 'orders')).id;

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', selectedMember.id);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          throw new Error('Member tidak ditemukan di database.');
        }

        const currentPts = Number(userSnap.data().points) || 0;
        const newBalance = currentPts - posPointsRedeem + posRewardPoints;

        // 1. Update user points
        transaction.update(userRef, {
          points: newBalance,
          updatedAt: serverTimestamp(),
        });

        // 2. Insert point ledger for redeem if any
        if (posPointsRedeem > 0) {
          const ptRedeemRef = doc(collection(db, 'pointTransactions'));
          transaction.set(ptRedeemRef, {
            id: ptRedeemRef.id,
            userId: selectedMember.id,
            memberId: selectedMember.memberId,
            amount: -posPointsRedeem,
            type: 'redeem',
            description: `Redeem kasir outlet #${orderNumber}`,
            orderId,
            adminUid: currentUser?.uid,
            createdAt: serverTimestamp(),
          });
        }

        // 3. Insert point ledger for reward
        if (posRewardPoints > 0) {
          const ptRewardRef = doc(collection(db, 'pointTransactions'));
          transaction.set(ptRewardRef, {
            id: ptRewardRef.id,
            userId: selectedMember.id,
            memberId: selectedMember.memberId,
            amount: posRewardPoints,
            type: 'reward',
            description: `Reward pembelian outlet #${orderNumber}`,
            orderId,
            adminUid: currentUser?.uid,
            createdAt: serverTimestamp(),
          });
        }

        // 4. Create order record for offline pos
        const orderRef = doc(db, 'orders', orderId);
        transaction.set(orderRef, {
          id: orderId,
          orderNumber,
          userId: selectedMember.id,
          memberId: selectedMember.memberId,
          customerName: selectedMember.name,
          customerWhatsapp: selectedMember.whatsapp,
          deliveryAddress: 'Transaksi Langsung di Outlet (Kasir)',
          shippingArea: 'indramayu_kota',
          shippingFee: 0,
          items: [
            {
              id: 'offline_pos_item',
              productId: 'pos_offline',
              productName: 'Transaksi Outlet Kasir',
              productImage: 'https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png',
              variant: 'dengan_nasi',
              variantLabel: 'Paket Outlet',
              basePrice: posBillAmount,
              extraSausCount: 0,
              extraSausPrice: 0,
              extraNasiCount: 0,
              extraNasiPrice: 0,
              chickenPartNote: posNotes || 'Outlet POS',
              quantity: 1,
              itemSubtotal: posBillAmount,
            },
          ],
          subtotal: posBillAmount,
          pointsRedeemed: posPointsRedeem,
          discountFromPoints: posDiscountRp,
          total: posFinalPayable,
          paymentMethod: 'qris',
          paymentStatus: 'verified',
          orderStatus: 'completed',
          orderType: 'offline_pos',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 5. Admin Log
        const logRef = doc(collection(db, 'adminLogs'));
        transaction.set(logRef, {
          adminUid: currentUser?.uid,
          action: 'OFFLINE_POS_TRANSACTION',
          targetType: 'user',
          targetId: selectedMember.id,
          details: `Transaksi Kasir Outlet #${orderNumber}: Total ${formatRupiah(posFinalPayable)}, Redeem ${posPointsRedeem} pts, Reward ${posRewardPoints} pts`,
          createdAt: serverTimestamp(),
        });
      });

      showToast(
        `Transaksi kasir berhasil dicatat! Total bayar: ${formatRupiah(posFinalPayable)}`,
        'success',
        'Transaksi Kasir Sukses'
      );

      setModalMode(null);
      setSelectedMember(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses transaksi offline.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !adjustReason.trim()) {
      showToast('Alasan penyesuaian poin wajib dicatat.', 'error');
      return;
    }

    const delta = adjustType === 'add' ? adjustAmount : -adjustAmount;

    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', selectedMember.id);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          throw new Error('Member tidak ditemukan.');
        }

        const currentPts = Number(userSnap.data().points) || 0;
        const newBalance = Math.max(0, currentPts + delta);

        transaction.update(userRef, {
          points: newBalance,
          updatedAt: serverTimestamp(),
        });

        // Add ledger entry
        const ptRef = doc(collection(db, 'pointTransactions'));
        transaction.set(ptRef, {
          id: ptRef.id,
          userId: selectedMember.id,
          memberId: selectedMember.memberId,
          amount: delta,
          type: 'manual_adjustment',
          description: `Penyesuaian kasir: ${adjustReason.trim()}`,
          adminUid: currentUser?.uid,
          createdAt: serverTimestamp(),
        });

        // Admin log
        const logRef = doc(collection(db, 'adminLogs'));
        transaction.set(logRef, {
          adminUid: currentUser?.uid,
          action: 'MANUAL_POINT_ADJUSTMENT',
          targetType: 'user',
          targetId: selectedMember.id,
          details: `Poin ${delta > 0 ? '+' : ''}${delta} (${adjustReason.trim()})`,
          createdAt: serverTimestamp(),
        });
      });

      showToast(`Poin member berhasil disesuaikan (${delta > 0 ? '+' : ''}${delta} poin).`, 'success');
      setModalMode(null);
      setSelectedMember(null);
      setAdjustReason('');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah poin.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Manajemen Member & Kasir Outlet</h1>
          <p className="text-xs text-stone-400">
            Cari member berdasarkan Member ID, WhatsApp, atau nama untuk transaksi offline kasir
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 flex items-center gap-3">
        <Search className="w-5 h-5 text-stone-500 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari Member ID (misal: CDC-8F29A1), No. WhatsApp, atau Nama..."
          className="w-full bg-transparent text-white text-xs placeholder-stone-500 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-stone-400 hover:text-white text-xs font-bold px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Member Table */}
      <div className="bg-stone-950 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-stone-850">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Daftar Member Terdaftar ({filteredMembers.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500">Memuat data member...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Tidak ditemukan member dengan kata kunci pencarian tersebut.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="text-[10px] uppercase text-stone-400 border-b border-stone-800 font-bold">
                <tr>
                  <th className="py-3 px-3">Member ID</th>
                  <th className="py-3 px-3">Nama Lengkap</th>
                  <th className="py-3 px-3">No. WhatsApp</th>
                  <th className="py-3 px-3">Saldo Poin</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-right">Aksi Kasir Outlet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-900 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {m.memberId || '-'}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {m.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-300">
                      {m.whatsapp || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-amber-400 text-sm">
                        {m.points || 0} Poin
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        (= {formatRupiah(pointsToRupiah(m.points || 0))})
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {m.role === 'admin' ? 'Admin Crew' : 'Customer'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(m);
                          setPosBillAmount(16000);
                          setPosPointsRedeem(0);
                          setPosRewardPoints(16);
                          setModalMode('offline_pos');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-[11px] transition-colors shadow-xs"
                      >
                        + Transaksi Kasir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(m);
                          setAdjustAmount(10);
                          setAdjustReason('');
                          setModalMode('adjust_points');
                        }}
                        className="px-2 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] transition-colors"
                      >
                        Sesuaikan Poin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: OFFLINE POS PURCHASE */}
      {modalMode === 'offline_pos' && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">Transaksi Pembelian Outlet (Kasir)</h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member info preview */}
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{selectedMember.name}</p>
                <p className="text-stone-400 font-mono text-[11px]">
                  {selectedMember.memberId} • WA: {selectedMember.whatsapp}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Saldo Poin</span>
                <span className="text-amber-400 font-black text-sm">{selectedMember.points} Poin</span>
              </div>
            </div>

            <form onSubmit={handleProcessOfflinePOS} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Total Belanja Outlet (Rp) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={posBillAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setPosBillAmount(val);
                    setPosRewardPoints(Math.max(1, Math.floor(val / 1000)));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Redeem Points in POS */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-stone-300">Tukar Poin Member (Redeem)</label>
                  <span className="text-[11px] text-amber-400">
                    Maks: {selectedMember.points} Pts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 10, 20, 50].map((pts) => {
                    if (pts > selectedMember.points && pts !== 0) return null;
                    return (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setPosPointsRedeem(pts)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          posPointsRedeem === pts
                            ? 'bg-amber-500 text-stone-950 border-amber-500'
                            : 'bg-stone-850 text-stone-300 border-stone-700 hover:bg-stone-800'
                        }`}
                      >
                        {pts === 0 ? '0 Pts' : `${pts} Pts (-${formatRupiah(pts * 100)})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reward Points to grant */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Reward Poin Ditambahkan (+ Poin)</label>
                <input
                  type="number"
                  min={0}
                  value={posRewardPoints}
                  onChange={(e) => setPosRewardPoints(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-850 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-stone-400">
                  Otomatis dihitung 1 poin per kelipatan Rp1.000 belanja.
                </span>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Catatan Kasir</label>
                <input
                  type="text"
                  value={posNotes}
                  onChange={(e) => setPosNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-850 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Final calculation summary */}
              <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal Belanja</span>
                  <span>{formatRupiah(posBillAmount)}</span>
                </div>
                {posDiscountRp > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Diskon Poin ({posPointsRedeem} Pts)</span>
                    <span>-{formatRupiah(posDiscountRp)}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-stone-800 flex justify-between items-baseline font-black text-white">
                  <span>Total Tagihan Bayar Kasir:</span>
                  <span className="text-lg text-amber-400">{formatRupiah(posFinalPayable)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-750"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-md"
                >
                  {submitting ? 'Memproses...' : `Selesaikan Transaksi (${formatRupiah(posFinalPayable)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL POINT ADJUSTMENT */}
      {modalMode === 'adjust_points' && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-base text-white">Penyesuaian Poin Manual</h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Ubah saldo poin member <strong>{selectedMember.name}</strong> ({selectedMember.memberId}). Saldo saat ini: <strong className="text-amber-400">{selectedMember.points} Poin</strong>.
            </p>

            <form onSubmit={handleAdjustPoints} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">Tipe Aksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-stone-850 text-stone-300 border-stone-700'
                    }`}
                  >
                    + Tambah Poin
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                      adjustType === 'deduct'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-stone-850 text-stone-300 border-stone-700'
                    }`}
                  >
                    - Kurangi Poin
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Jumlah Poin *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-850 text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">Alasan Penyesuaian (Wajib Dicatat) *</label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Kompensasi pesanan / Koreksi transaksi offline / Bonus loyalitas event"
                  className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-850 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-750"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !adjustReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-md"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan ke Ledger Poin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
