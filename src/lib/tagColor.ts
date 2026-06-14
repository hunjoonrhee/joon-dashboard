const COLORS = [
  'bg-indigo-50 text-indigo-500',
  'bg-teal-50 text-teal-500',
  'bg-amber-50 text-amber-600',
  'bg-green-50 text-green-600',
  'bg-pink-50 text-pink-500',
  'bg-orange-50 text-orange-500',
  'bg-sky-50 text-sky-500',
];

export function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
