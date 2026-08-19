'use client';

import { useCelebrationQueue } from '@/lib/celebration-context';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CelebrationPage } from './CelebrationPage';

export function CelebrationOverlay() {
  const { queue, clearQueue } = useCelebrationQueue();
  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasVisible = useRef(false);

  const visible = queue.length > 0;

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setPageIndex(0);
      scrollRef.current?.scrollTo({ left: 0 });
    }
    wasVisible.current = visible;
  }, [visible]);

  if (!visible) return null;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setPageIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {queue.map((celebration, i) => (
          <CelebrationPage key={i} celebration={celebration} onAct={clearQueue} />
        ))}
      </div>

      <button
        onClick={clearQueue}
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
      >
        <X size={18} />
      </button>

      {queue.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {queue.map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ background: i === pageIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
