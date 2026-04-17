import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BadgeCheck,
  Check,
  Clock,
  Gift,
  Heart,
  Image as ImageIcon,
  Leaf,
  Package,
  Palette,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Zap,
} from 'lucide-react';

/**
 * Curated icons for product Features (admin picker + storefront quick-trust row).
 * Keys are stored in `products.features[].icon` (lowercase kebab).
 */
export const PRODUCT_FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  truck: Truck,
  'rotate-ccw': RotateCcw,
  shield: Shield,
  clock: Clock,
  package: Package,
  sparkles: Sparkles,
  heart: Heart,
  star: Star,
  check: Check,
  'badge-check': BadgeCheck,
  zap: Zap,
  gift: Gift,
  palette: Palette,
  image: ImageIcon,
  leaf: Leaf,
  'thumbs-up': ThumbsUp,
  award: Award,
};

export const PRODUCT_FEATURE_ICON_OPTIONS: { value: string; label: string }[] =
  Object.entries({
    truck: 'Truck — shipping',
    'rotate-ccw': 'Returns',
    shield: 'Shield — guarantee',
    clock: 'Clock — timing',
    package: 'Package',
    sparkles: 'Sparkles',
    heart: 'Heart',
    star: 'Star',
    check: 'Check',
    'badge-check': 'Verified',
    zap: 'Zap — fast',
    gift: 'Gift',
    palette: 'Palette — art',
    image: 'Image',
    leaf: 'Leaf — eco',
    'thumbs-up': 'Thumbs up',
    award: 'Award',
  }).map(([value, label]) => ({ value, label }));

export function isFeatureIconUrl(icon: string | null | undefined): boolean {
  if (!icon || typeof icon !== 'string') return false;
  const t = icon.trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

export function getFeatureLucideIcon(
  icon: string | null | undefined
): LucideIcon | null {
  if (!icon || typeof icon !== 'string') return null;
  if (isFeatureIconUrl(icon)) return null;
  const k = icon.trim().toLowerCase();
  return PRODUCT_FEATURE_ICON_MAP[k] ?? null;
}
