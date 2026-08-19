'use client';

import type { BadgeTier } from './badge-registry';
import type { BadgeMeta } from './badge-registry';

const TIER_STYLES: Record<BadgeTier, { bg: string; icon: string; ring: string }> = {
  green: { bg: 'bg-pri/15', icon: 'text-pri', ring: 'ring-pri/30' },
  gold: { bg: 'bg-amber/15', icon: 'text-amber', ring: 'ring-amber/30' },
  purple: { bg: 'bg-[#C9A6FF]/15', icon: 'text-[#9B72D6]', ring: 'ring-[#C9A6FF]/30' },
};

interface Props {
  badge: BadgeMeta;
  unlocked: boolean;
  label: string;
  detail?: string;
  onClick?: () => void;
}

export default function AchievementBadge({ badge, unlocked, label, detail, onClick }: Props) {
  const Icon = badge.icon;
  const style = TIER_STYLES[badge.tier];

  return (
    <button
      onClick={unlocked ? onClick : undefined}
      disabled={!unlocked}
      className="flex flex-col items-center gap-2 w-24 text-center disabled:cursor-default"
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform ${
          unlocked ? `${style.bg} ring-1 ${style.ring} hover:scale-105` : 'bg-surf-2'
        }`}
      >
        <Icon size={26} strokeWidth={1.8} className={unlocked ? style.icon : 'text-ink-faint'} />
      </div>
      <span className={`text-xs font-medium leading-tight ${unlocked ? 'text-ink-dim' : 'text-ink-faint'}`}>
        {label}
      </span>
      {unlocked && detail && <span className="text-[11px] text-ink-faint leading-tight">{detail}</span>}
    </button>
  );
}
