import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Promotion } from '../../types';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const PromoBanner: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const q = query(
          collection(db, 'promotions'),
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc')
        );
        const snap = await getDocs(q);
        const list: Promotion[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Promotion[];
        setPromotions(list);
      } catch (err) {
        console.warn('Note on promotions fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, []);

  if (loading || promotions.length === 0) {
    return null; // As requested: jika tidak ada promo aktif, jangan menampilkan carousel kosong!
  }

  const prev = () => {
    setCurrentIndex((c) => (c === 0 ? promotions.length - 1 : c - 1));
  };

  const next = () => {
    setCurrentIndex((c) => (c === promotions.length - 1 ? 0 : c + 1));
  };

  const current = promotions[currentIndex];

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm uppercase tracking-wider font-extrabold text-stone-800">
            Promo & Pengumuman Spesial
          </h2>
        </div>
        {promotions.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={prev}
              className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              aria-label="Promo sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-stone-500">
              {currentIndex + 1} / {promotions.length}
            </span>
            <button
              onClick={next}
              className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              aria-label="Promo berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-stone-900 border border-stone-200 shadow-md group">
        <div className="relative aspect-[21/9] sm:aspect-[24/8] max-h-72 w-full overflow-hidden bg-stone-950">
          <img
            src={current.imageUrl}
            alt={current.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
            <h3 className="text-base sm:text-xl font-bold tracking-tight text-white mb-1 drop-shadow-sm">
              {current.title}
            </h3>
            {current.description && (
              <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 max-w-xl drop-shadow-sm">
                {current.description}
              </p>
            )}
          </div>
        </div>

        {promotions.length > 1 && (
          <div className="absolute bottom-2 right-4 flex gap-1.5 z-10">
            {promotions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-5 bg-amber-400' : 'w-2 bg-white/50'
                }`}
                aria-label={`Ke promo slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
