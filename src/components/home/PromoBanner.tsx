import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Promotion } from '../../types';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const PromoBanner: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

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

        if (!cancelled) setPromotions(list);
      } catch (err) {
        console.warn('Note on promotions fetch:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPromos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (promotions.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % promotions.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [promotions.length, currentIndex]);

  if (loading || promotions.length === 0) {
    return null;
  }

  const prev = () => {
    setCurrentIndex((index) =>
      index === 0 ? promotions.length - 1 : index - 1
    );
  };

  const next = () => {
    setCurrentIndex((index) => (index + 1) % promotions.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    const endX = event.changedTouches[0]?.clientX;
    const endY = event.changedTouches[0]?.clientY;

    touchStartX.current = null;
    touchStartY.current = null;

    if (
      startX === null ||
      startY === null ||
      endX === undefined ||
      endY === undefined
    ) {
      return;
    }

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) next();
    else prev();
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
              type="button"
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
              type="button"
              onClick={next}
              className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              aria-label="Promo berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-md">
        <div
          className="relative mx-auto w-full max-w-xl aspect-[1/1.414] overflow-hidden bg-stone-100"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={current.imageUrl}
            alt={current.title}
            draggable={false}
            className="w-full h-full object-contain object-center"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/85 via-stone-950/45 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
            <h3 className="text-base sm:text-xl font-bold tracking-tight mb-1 drop-shadow-sm">
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
            {promotions.map((promotion, index) => (
              <button
                key={promotion.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'w-5 bg-amber-400' : 'w-2 bg-stone-400'
                }`}
                aria-label={`Ke promo slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
