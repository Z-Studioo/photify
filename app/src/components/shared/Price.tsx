import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDiscountedPrice } from '@/lib/pricing/use-discounted-price';
import { formatGbp, splitGbpParts } from '@/lib/pricing';

type PriceVariant = 'card' | 'inline' | 'lg' | 'compact';

interface PriceProps {
  amount: number | null | undefined;
  variant?: PriceVariant;
  className?: string;
  showBadge?: boolean;
  /** When set, use this colour for the discounted price (e.g. brand pink). */
  accentClassName?: string;
}

function CardPrice({
  amount,
  accentClassName,
}: {
  amount: number;
  accentClassName: string;
}) {
  const { original, discounted, percentOff, hasDiscount } =
    useDiscountedPrice(amount);
  const display = hasDiscount ? discounted : original;
  const { whole, cents } = splitGbpParts(display);

  return (
    <div className='flex flex-col'>
      {hasDiscount && (
        <div className='mb-1 flex items-center gap-1.5'>
          <Badge
            variant='secondary'
            className='bg-green-100 px-1.5 py-0 text-[10px] font-medium text-green-700'
          >
            {percentOff}% OFF
          </Badge>
          <span className='text-xs text-gray-400 line-through'>
            £{original.toFixed(2)}
          </span>
        </div>
      )}
      <div className={cn('flex items-start', accentClassName)}>
        <span className='font-bold text-lg mt-2 mr-0.5'>£</span>
        <span className='font-extrabold text-4xl tracking-tighter leading-none font-bricolage'>
          {whole}
        </span>
        <span className='font-bold text-xl mt-2'>.{cents}</span>
      </div>
    </div>
  );
}

function InlinePrice({
  amount,
  accentClassName,
  showBadge,
}: {
  amount: number;
  accentClassName: string;
  showBadge: boolean;
}) {
  const { original, discounted, percentOff, hasDiscount } =
    useDiscountedPrice(amount);

  if (!hasDiscount) {
    return (
      <span className={cn('font-semibold tabular-nums', accentClassName)}>
        {formatGbp(amount, { alwaysDecimals: true })}
      </span>
    );
  }

  return (
    <div className='flex flex-col items-end gap-0.5'>
      <div className='flex items-center gap-1.5'>
        {showBadge && (
          <Badge
            variant='secondary'
            className='bg-green-100 px-1 py-0 text-[10px] font-medium text-green-700'
          >
            {percentOff}% OFF
          </Badge>
        )}
        <span className={cn('font-semibold tabular-nums', accentClassName)}>
          {formatGbp(discounted, { alwaysDecimals: true })}
        </span>
      </div>
      <span className='text-xs text-gray-400 line-through tabular-nums'>
        {formatGbp(original, { alwaysDecimals: true })}
      </span>
    </div>
  );
}

function LgPrice({ amount, accentClassName }: { amount: number; accentClassName: string }) {
  const { original, discounted, percentOff, hasDiscount } =
    useDiscountedPrice(amount);
  const display = hasDiscount ? discounted : original;

  return (
    <div className='flex flex-col gap-1'>
      {hasDiscount && (
        <div className='flex items-center gap-2'>
          <Badge
            variant='secondary'
            className='bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
          >
            {percentOff}% OFF
          </Badge>
          <span className='text-sm text-gray-400 line-through'>
            {formatGbp(original, { alwaysDecimals: true })}
          </span>
        </div>
      )}
      <span className={cn('text-3xl font-bold tabular-nums', accentClassName)}>
        {formatGbp(display, { alwaysDecimals: true })}
      </span>
    </div>
  );
}

function CompactPrice({
  amount,
  accentClassName,
}: {
  amount: number;
  accentClassName: string;
}) {
  const { original, discounted, percentOff, hasDiscount } =
    useDiscountedPrice(amount);

  if (!hasDiscount) {
    return (
      <span className={cn('font-semibold tabular-nums text-sm', accentClassName)}>
        {formatGbp(amount, { alwaysDecimals: true })}
      </span>
    );
  }

  return (
    <div className='text-right'>
      <div className={cn('font-semibold tabular-nums text-sm', accentClassName)}>
        {formatGbp(discounted, { alwaysDecimals: true })}
      </div>
      <div className='text-xs text-gray-400 line-through tabular-nums'>
        {formatGbp(original, { alwaysDecimals: true })}
      </div>
      <div className='text-[10px] font-medium text-green-600'>{percentOff}% OFF</div>
    </div>
  );
}

export function Price({
  amount,
  variant = 'inline',
  className,
  showBadge = true,
  accentClassName = 'text-[#f63a9e]',
}: PriceProps) {
  if (amount == null || !Number.isFinite(amount)) {
    return (
      <span className={cn('font-semibold text-gray-400', className)}>—</span>
    );
  }

  return (
    <div className={className}>
      {variant === 'card' && (
        <CardPrice amount={amount} accentClassName={accentClassName} />
      )}
      {variant === 'inline' && (
        <InlinePrice
          amount={amount}
          accentClassName={accentClassName}
          showBadge={showBadge}
        />
      )}
      {variant === 'lg' && (
        <LgPrice amount={amount} accentClassName={accentClassName} />
      )}
      {variant === 'compact' && (
        <CompactPrice amount={amount} accentClassName={accentClassName} />
      )}
    </div>
  );
}

export { useDiscountedPrice };

interface DiscountedAmountProps {
  amount: number;
  className?: string;
  /** Show struck original on a second line (configurator style). */
  stacked?: boolean;
  showBadge?: boolean;
}

/** Inline original + discounted GBP for cart lines, configurators, etc. */
export function DiscountedAmount({
  amount,
  className,
  stacked = false,
  showBadge = false,
}: DiscountedAmountProps) {
  const { original, discounted, percentOff, hasDiscount } =
    useDiscountedPrice(amount);

  if (!hasDiscount) {
    return (
      <span className={className}>£{amount.toFixed(2)}</span>
    );
  }

  if (stacked) {
    return (
      <div className={className}>
        <div className='flex flex-wrap items-center gap-1'>
          {showBadge && (
            <Badge
              variant='secondary'
              className='bg-green-100 px-1 py-0 text-[10px] font-medium text-green-700 sm:text-xs'
            >
              {percentOff}% OFF
            </Badge>
          )}
          <span className='font-semibold tabular-nums text-zinc-900'>
            £{discounted.toFixed(2)}
          </span>
        </div>
        <span className='text-[10px] leading-tight text-zinc-400 line-through sm:text-xs tabular-nums'>
          £{original.toFixed(2)}
        </span>
      </div>
    );
  }

  return (
    <span className={className}>
      <span className='font-semibold tabular-nums'>£{discounted.toFixed(2)}</span>
      <span className='ml-1.5 text-xs text-gray-400 line-through tabular-nums'>
        £{original.toFixed(2)}
      </span>
    </span>
  );
}
