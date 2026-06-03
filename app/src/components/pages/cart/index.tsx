import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { track, cleanProductName } from '@/lib/analytics';
import {
  X,
  Plus,
  Minus,
  Tag,
  ShoppingCart as ShoppingCartIcon,
  Truck,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Shield,
  Gift,
  Check,
  CreditCard,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useSiteSetting } from '@/lib/supabase/hooks';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Returns just the base product name for a cart line item by stripping
// any trailing ratio/size segments. Item names are built like
// "Product — Ratio — 12\" × 12\"" or "Product - 12\" × 12\"", so we
// split on the first space-separated em-dash / en-dash / hyphen and keep
// the first part. Hyphens without surrounding spaces (e.g. "Multi-Canvas
// Wall") are intentionally preserved.
function getDisplayName(name: string): string {
  if (!name) return name;
  const trimmedName = name.trim();
  const cleaned = trimmedName.split(/\s+[—–-]\s+/)[0]?.trim();
  return cleaned || trimmedName;
}

export function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    deliveryMethod,
    setDeliveryMethod,
    setShippingCost,
    discount,
    setDiscount,
    appliedPromoCode,
    setAppliedPromoCode,
    promoApplied,
    setPromoApplied,
  } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [featuredPromotion, setFeaturedPromotion] = useState<any>(null);
  const [promoOpen, setPromoOpen] = useState(false);

  useEffect(() => {
    const fetchFeaturedPromotion = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_featured', true)
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString().split('T')[0])
          .lte('start_date', new Date().toISOString().split('T')[0])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setFeaturedPromotion(data);
        }
      } catch (error) {
        console.error('Error fetching featured promotion:', error);
      }
    };

    fetchFeaturedPromotion();
  }, []);

  // GA4 view_cart — fires once when the cart page mounts with items.
  // Re-fires if the cart contents change so funnel reporting reflects
  // the *most recent* cart state the user actually looked at.
  useEffect(() => {
    if (cartItems.length === 0) return;
    try {
      const subtotal = cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      track({
        name: 'view_cart',
        params: {
          currency: 'GBP',
          value: subtotal,
          items: cartItems.map(i => ({
            item_id: i.id,
            item_name: cleanProductName(i.name),
            item_variant: i.size,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      });
    } catch {
      /* swallow */
    }
    // Intentionally only depends on the *length* of cartItems: we want
    // a view_cart on mount and on add/remove, not on every quantity tick.
  }, [cartItems.length]);

  const { data: standardShipping } = useSiteSetting('shipping_flat_rate');
  const { data: expressShipping } = useSiteSetting('shipping_express_cost');

  const deliveryOptions = {
    standard: {
      name: 'Standard',
      price: standardShipping?.setting_value?.value || 4.99,
      duration: '7-10 business days',
    },
    express: {
      name: 'Express',
      price: expressShipping?.setting_value?.value || 6.99,
      duration: '3-5 business days',
    },
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryPrice = deliveryOptions[deliveryMethod].price;
  const total = subtotal + deliveryPrice - discount;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setShippingCost(deliveryPrice);
  }, [deliveryPrice, setShippingCost]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setValidatingPromo(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('is_promotion_valid', {
        promotion_code: promoCode.toUpperCase().trim(),
        order_total: subtotal,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];

        if (result.valid) {
          const code = promoCode.toUpperCase().trim();
          setPromoApplied(true);
          setDiscount(result.discount_amount);
          setAppliedPromoCode(code);
          toast.success(
            `Promo code applied! You saved £${result.discount_amount.toFixed(2)}`
          );
          try {
            track({
              name: 'promo_applied',
              params: { code, discount_value: result.discount_amount },
            });
          } catch {
            /* swallow */
          }
        } else {
          toast.error(result.error_message || 'Invalid promo code');
          setPromoApplied(false);
          setDiscount(0);
          try {
            track({
              name: 'promo_failed',
              params: {
                code: promoCode.toUpperCase().trim(),
                reason: result.error_message || 'invalid',
              },
            });
          } catch {
            /* swallow */
          }
        }
      } else {
        toast.error('Invalid promo code');
        setPromoApplied(false);
        setDiscount(0);
        try {
          track({
            name: 'promo_failed',
            params: {
              code: promoCode.toUpperCase().trim(),
              reason: 'unknown',
            },
          });
        } catch {
          /* swallow */
        }
      }
    } catch (error) {
      console.error('Error validating promo:', error);
      toast.error('Failed to validate promo code');
      setPromoApplied(false);
      setDiscount(0);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(false);
    setDiscount(0);
    setAppliedPromoCode('');
    setPromoCode('');
  };

  const isEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 font-['Mona_Sans',_sans-serif]">
      <Header />

      {/* Mobile sticky checkout bar */}
      {!isEmpty && (
        <div className='lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-200 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]'>
          <div className='flex items-center gap-3'>
            <div className='flex-shrink-0'>
              <p className='text-[11px] text-gray-500 leading-tight'>
                Total · {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
              <p
                className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e] leading-tight"
                style={{ fontWeight: '700', fontSize: '22px' }}
              >
                £{total.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={() => navigate('/checkout')}
              className='flex-1 h-12 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl shadow-md transition-colors'
              style={{ fontWeight: '700', fontSize: '15px' }}
            >
              Checkout
              <ArrowRight className='w-4 h-4 ml-1.5' />
            </Button>
          </div>
        </div>
      )}

      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-28 lg:pb-12'>
        {/* Compact back + title row */}
        <div className='flex items-center justify-between gap-3 mb-4 sm:mb-6'>
          <button
            onClick={() => navigate('/')}
            className='inline-flex items-center gap-1.5 text-gray-600 hover:text-[#f63a9e] transition-colors group min-h-[40px]'
          >
            <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
            <span className='text-sm' style={{ fontWeight: '600' }}>
              Continue shopping
            </span>
          </button>
          {!isEmpty && (
            <span
              className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF5FB] text-[#f63a9e] text-xs'
              style={{ fontWeight: '700' }}
            >
              <ShoppingCartIcon className='w-3.5 h-3.5' />
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <h1
          className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 sm:mb-6 text-2xl sm:text-3xl lg:text-4xl"
          style={{ fontWeight: '700', lineHeight: '1.1' }}
        >
          Your cart
        </h1>

        {isEmpty ? (
          <div className='flex flex-col items-center justify-center text-center py-12 sm:py-20 bg-white rounded-2xl shadow-sm border-2 border-gray-200 px-4'>
            <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FFF5FB] flex items-center justify-center mb-4 sm:mb-5'>
              <ShoppingCartIcon className='w-10 h-10 sm:w-12 sm:h-12 text-[#f63a9e]' />
            </div>
            <h3
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2 text-xl sm:text-2xl"
              style={{ fontWeight: '700' }}
            >
              Your cart is empty
            </h3>
            <p className='text-gray-600 mb-6 max-w-md text-sm sm:text-base'>
              Discover our collection of beautiful prints and bring art into
              your home.
            </p>
            <Button
              onClick={() => navigate('/')}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white shadow-sm px-6 h-12'
              style={{ fontWeight: '700' }}
            >
              Start shopping
              <ArrowRight className='ml-2 w-4 h-4' />
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6'>
            {/* Left: items + delivery + promo */}
            <div className='lg:col-span-3 space-y-4'>
              {/* Items */}
              <section className='bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 sm:p-5'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3 text-base sm:text-lg flex items-center gap-2"
                  style={{ fontWeight: '700' }}
                >
                  Items
                  <span className='text-xs text-gray-500' style={{ fontWeight: '500' }}>
                    ({itemCount})
                  </span>
                </h2>
                <ul className='divide-y divide-gray-100'>
                  {cartItems.map(item => {
                    const displayName = getDisplayName(item.name);
                    return (
                      <li key={item.id} className='py-3 first:pt-0 last:pb-0'>
                        <div className='flex items-start gap-3'>
                          <div className='flex-1 min-w-0'>
                            <h4
                              className='text-gray-900 text-sm sm:text-base leading-snug'
                              style={{ fontWeight: '600' }}
                            >
                              {displayName}
                            </h4>
                            {item.size && (
                              <p className='mt-0.5 text-xs sm:text-sm text-gray-500'>
                                {item.size}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            aria-label='Remove item'
                            className='shrink-0 w-8 h-8 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </div>

                        <div className='mt-2.5 flex items-center justify-between gap-3'>
                          <div className='inline-flex items-center rounded-lg border border-gray-200'>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              aria-label='Decrease quantity'
                              className='w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-[#f63a9e] transition-colors'
                            >
                              <Minus className='w-3.5 h-3.5' />
                            </button>
                            <span
                              className='w-8 text-center text-sm text-gray-900'
                              style={{ fontWeight: '600' }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              aria-label='Increase quantity'
                              className='w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-[#f63a9e] transition-colors'
                            >
                              <Plus className='w-3.5 h-3.5' />
                            </button>
                          </div>
                          <div className='text-right'>
                            {item.quantity > 1 && (
                              <p className='text-[11px] text-gray-400 leading-tight'>
                                £{item.price.toFixed(2)} each
                              </p>
                            )}
                            <p
                              className='text-gray-900 text-base sm:text-lg leading-tight'
                              style={{ fontWeight: '700' }}
                            >
                              £{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Delivery */}
              <section className='bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 sm:p-5'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3 text-base sm:text-lg flex items-center gap-2"
                  style={{ fontWeight: '700' }}
                >
                  <Truck className='w-4 h-4 text-[#f63a9e]' />
                  Delivery
                </h2>
                <div className='grid grid-cols-2 gap-2'>
                  {(['standard', 'express'] as const).map(method => {
                    const opt = deliveryOptions[method];
                    const selected = deliveryMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => setDeliveryMethod(method)}
                        className={`relative text-left p-3 rounded-xl border-2 transition-colors ${
                          selected
                            ? 'border-[#f63a9e] bg-[#FFF5FB]'
                            : 'border-gray-200 hover:border-[#f63a9e]/40 bg-white'
                        }`}
                      >
                        <div className='flex items-center justify-between mb-0.5'>
                          <span
                            className='text-sm text-gray-900'
                            style={{ fontWeight: '700' }}
                          >
                            {opt.name}
                          </span>
                          {selected && (
                            <div className='w-4 h-4 rounded-full bg-[#f63a9e] flex items-center justify-center'>
                              <Check
                                className='w-2.5 h-2.5 text-white'
                                strokeWidth={3}
                              />
                            </div>
                          )}
                        </div>
                        <p className='text-xs text-gray-500 leading-tight'>
                          {opt.duration}
                        </p>
                        <p
                          className='text-sm text-[#f63a9e] mt-1.5'
                          style={{ fontWeight: '700' }}
                        >
                          £{opt.price.toFixed(2)}
                        </p>
                        {method === 'express' && (
                          <span className='absolute top-1.5 right-1.5 text-[9px] bg-[#f63a9e] text-white px-1.5 py-0.5 rounded-full tracking-wide'
                            style={{ fontWeight: '700' }}>
                            FAST
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Promo — collapsed by default */}
              <section className='bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden'>
                {promoApplied ? (
                  <div className='p-4 flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0'>
                      <Check className='w-5 h-5 text-white' strokeWidth={3} />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p
                        className='text-green-900 text-sm'
                        style={{ fontWeight: '700' }}
                      >
                        {appliedPromoCode} applied
                      </p>
                      <p className='text-green-700 text-xs'>
                        You saved £{discount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className='text-xs text-gray-500 hover:text-red-500 underline underline-offset-2'
                      style={{ fontWeight: '600' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setPromoOpen(v => !v)}
                      className='w-full px-4 py-3 flex items-center justify-between text-left'
                      aria-expanded={promoOpen}
                    >
                      <div className='flex items-center gap-2.5'>
                        <div className='w-8 h-8 rounded-lg bg-[#FFF5FB] flex items-center justify-center'>
                          <Tag className='w-4 h-4 text-[#f63a9e]' />
                        </div>
                        <div>
                          <p
                            className='text-gray-900 text-sm'
                            style={{ fontWeight: '700' }}
                          >
                            Have a promo code?
                          </p>
                          {featuredPromotion && !promoOpen && (
                            <p className='text-xs text-gray-500 leading-tight'>
                              Try{' '}
                              <span
                                className='text-[#f63a9e]'
                                style={{ fontWeight: '700' }}
                              >
                                {featuredPromotion.code}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      {promoOpen ? (
                        <ChevronUp className='w-4 h-4 text-gray-400' />
                      ) : (
                        <ChevronDown className='w-4 h-4 text-gray-400' />
                      )}
                    </button>
                    {promoOpen && (
                      <div className='px-4 pb-4 -mt-1'>
                        <div className='flex gap-2'>
                          <Input
                            type='text'
                            placeholder='Enter code'
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyPromo();
                              }
                            }}
                            className='h-11 border-2 rounded-xl text-sm flex-1 uppercase'
                            style={{ fontWeight: '500' }}
                          />
                          <Button
                            onClick={handleApplyPromo}
                            disabled={!promoCode.trim() || validatingPromo}
                            className='h-11 px-4 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl border-0 disabled:opacity-50'
                            style={{ fontWeight: '700' }}
                          >
                            {validatingPromo ? (
                              <Loader2 className='w-4 h-4 animate-spin' />
                            ) : (
                              'Apply'
                            )}
                          </Button>
                        </div>
                        {featuredPromotion && (
                          <button
                            onClick={() => setPromoCode(featuredPromotion.code)}
                            className='mt-2.5 flex items-center gap-2 text-left'
                          >
                            <Sparkles className='w-3.5 h-3.5 text-[#f63a9e]' />
                            <span className='text-xs text-gray-600'>
                              Try{' '}
                              <span
                                className='text-[#f63a9e]'
                                style={{ fontWeight: '700' }}
                              >
                                {featuredPromotion.code}
                              </span>
                              {featuredPromotion.description ? (
                                <> — {featuredPromotion.description}</>
                              ) : null}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            {/* Right: order summary (sticky on desktop) */}
            <div className='lg:col-span-2'>
              {/* lg:top-[88px] = sticky header height (h-[72px]) + 16px gap */}
              <div className='lg:sticky lg:top-[88px] bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 sm:p-5'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3 text-base sm:text-lg"
                  style={{ fontWeight: '700' }}
                >
                  Order summary
                </h2>

                <dl className='space-y-2 text-sm'>
                  <div className='flex items-center justify-between'>
                    <dt className='text-gray-600'>Subtotal</dt>
                    <dd
                      className='text-gray-900'
                      style={{ fontWeight: '600' }}
                    >
                      £{subtotal.toFixed(2)}
                    </dd>
                  </div>
                  <div className='flex items-center justify-between'>
                    <dt className='text-gray-600 inline-flex items-center gap-1.5'>
                      <Truck className='w-3.5 h-3.5' />
                      Delivery
                    </dt>
                    <dd
                      className='text-gray-900'
                      style={{ fontWeight: '600' }}
                    >
                      £{deliveryPrice.toFixed(2)}
                    </dd>
                  </div>
                  {promoApplied && (
                    <div className='flex items-center justify-between'>
                      <dt className='text-green-700 inline-flex items-center gap-1.5'>
                        <Gift className='w-3.5 h-3.5' />
                        Discount
                      </dt>
                      <dd
                        className='text-green-600'
                        style={{ fontWeight: '700' }}
                      >
                        -£{discount.toFixed(2)}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className='mt-4 pt-4 border-t-2 border-gray-100'>
                  <div className='flex items-center justify-between p-3 rounded-xl bg-[#FFF5FB]'>
                    <span
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                      style={{ fontWeight: '700', fontSize: '15px' }}
                    >
                      Total
                    </span>
                    <span
                      className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e] leading-none"
                      style={{ fontWeight: '700', fontSize: '28px' }}
                    >
                      £{total.toFixed(2)}
                    </span>
                  </div>
                  <p className='text-[11px] text-gray-500 text-center mt-2'>
                    Includes all taxes and fees
                  </p>
                </div>

                {/* Desktop CTA (mobile uses sticky bar) */}
                <Button
                  onClick={() => navigate('/checkout')}
                  className='mt-4 hidden lg:flex w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl shadow-md transition-colors'
                  style={{ height: '52px', fontSize: '15px', fontWeight: '700' }}
                >
                  Checkout
                  <ArrowRight className='ml-2 w-4 h-4' />
                </Button>

                <div className='hidden lg:flex items-center justify-center gap-2 mt-3'>
                  <Shield className='w-3.5 h-3.5 text-gray-500' />
                  <span className='text-xs text-gray-600'>
                    Secure checkout with
                  </span>
                  <span
                    className='inline-flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[#635bff]'
                    style={{ fontWeight: '700', fontSize: '11px' }}
                  >
                    <CreditCard className='w-3 h-3' />
                    Stripe
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
