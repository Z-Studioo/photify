import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import {
  X,
  Plus,
  Minus,
  Tag,
  ShoppingCart as ShoppingCartIcon,
  Truck,
  Package,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Shield,
  Gift,
  Check,
  CreditCard,
  Loader2,
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
  const { cartItems, updateQuantity, removeFromCart, deliveryMethod, setDeliveryMethod, setShippingCost, discount, setDiscount, appliedPromoCode, setAppliedPromoCode, promoApplied, setPromoApplied } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [featuredPromotion, setFeaturedPromotion] = useState<any>(null);

  // Fetch featured promotion
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

  // Fetch delivery prices from settings
  const { data: standardShipping } = useSiteSetting('shipping_flat_rate');
  const { data: expressShipping } = useSiteSetting('shipping_express_cost');

  const deliveryOptions = {
    standard: {
      name: 'Standard Delivery',
      price: standardShipping?.setting_value?.value || 4.99,
      duration: '7-10 business days',
    },
    express: {
      name: 'Express Delivery',
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

  // Update shipping cost in context when delivery method or prices change
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
          setPromoApplied(true);
          setDiscount(result.discount_amount);
          setAppliedPromoCode(promoCode.toUpperCase().trim());
          toast.success(
            `Promo code applied! You saved £${result.discount_amount.toFixed(2)}`
          );
        } else {
          toast.error(result.error_message || 'Invalid promo code');
          setPromoApplied(false);
          setDiscount(0);
        }
      } else {
        toast.error('Invalid promo code');
        setPromoApplied(false);
        setDiscount(0);
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

  return (
    <div className="min-h-screen bg-gray-50 font-['Mona_Sans',_sans-serif]">
      <Header />

      {/* Main Content */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8'>
        {/* Breadcrumb / Back Button */}
        <button
          onClick={() => navigate("/")}
          className='flex items-center gap-2 text-gray-600 hover:text-[#f63a9e] transition-colors mb-4 sm:mb-6 group'
        >
          <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
          <span style={{ fontWeight: '500' }}>Continue Shopping</span>
        </button>

        {/* Page Header */}
        <div className='mb-4 sm:mb-8 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-gray-200'>
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#f63a9e] flex items-center justify-center shadow-lg ring-4 ring-[#f63a9e]/10'>
              <ShoppingCartIcon className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
            <div className='flex-1'>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1 text-xl sm:text-2xl md:text-3xl"
                style={{ fontWeight: '700' }}
              >
                Shopping Cart
              </h1>
              <p className='text-gray-600 flex items-center gap-2'>
                <span
                  className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f63a9e]/10 text-[#f63a9e]'
                  style={{ fontWeight: '600' }}
                >
                  <Package className='w-4 h-4' />
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
                <span className='text-gray-400'>•</span>
                <span style={{ fontWeight: '600' }}>
                  £
                  {cartItems
                    .reduce((sum, item) => sum + item.price * item.quantity, 0)
                    .toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className='flex flex-col items-center justify-center text-center py-12 sm:py-20 bg-white rounded-3xl shadow-sm px-4'>
            <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-[#FFF5FB] flex items-center justify-center mb-4 sm:mb-6 shadow-xl'>
              <ShoppingCartIcon className='w-12 h-12 sm:w-16 sm:h-16 text-[#f63a9e]' />
            </div>
            <h3
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3 text-2xl sm:text-3xl"
              style={{ fontWeight: '700' }}
            >
              Your cart is empty
            </h3>
            <p
              className='text-gray-600 mb-6 sm:mb-8 max-w-md text-sm sm:text-base'
            >
              Discover our collection of beautiful prints and bring art into
              your home
            </p>
            <Button
              onClick={() => navigate('/')}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white shadow-lg px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base'
              style={{ fontWeight: '600' }}
            >
              Start Shopping <ArrowRight className='ml-2 w-4 h-4 sm:w-5 sm:h-5' />
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6'>
            {/* Left Column - Cart Items & Order Summary */}
            <div className='lg:col-span-2 space-y-3 sm:space-y-4'>
              {/* Cart Items */}
              <div className='bg-white rounded-2xl shadow-sm p-4 sm:p-6 border-2 border-gray-200'>
                <div className='flex items-center justify-between mb-5'>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 flex items-center gap-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    <div className='w-9 h-9 rounded-lg bg-[#FFF5FB] flex items-center justify-center'>
                      <ShoppingCartIcon className='w-4 h-4 text-[#f63a9e]' />
                    </div>
                    Your Items
                  </h2>
                  <span
                    className='px-3 py-1.5 rounded-full bg-[#f63a9e] text-white text-xs'
                    style={{ fontWeight: '700' }}
                  >
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                    Items
                  </span>
                </div>
                <ul className='divide-y divide-gray-100'>
                  {cartItems.map(item => {
                    const displayName = getDisplayName(item.name);
                    return (
                      <li
                        key={item.id}
                        className='py-4 first:pt-0 last:pb-0'
                      >
                        <div className='flex items-start gap-3'>
                          <div className='flex-1 min-w-0'>
                            <h4
                              className='text-gray-900 text-sm sm:text-base leading-snug'
                              style={{ fontWeight: '600' }}
                            >
                              {displayName}
                            </h4>
                            {item.size && (
                              <p className='mt-1 text-xs sm:text-sm text-gray-500'>
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

                        <div className='mt-3 flex items-center justify-between gap-3'>
                          <div className='inline-flex items-center rounded-lg border border-gray-200'>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              aria-label='Decrease quantity'
                              className='w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#f63a9e] transition-colors'
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
                              className='w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#f63a9e] transition-colors'
                            >
                              <Plus className='w-3.5 h-3.5' />
                            </button>
                          </div>
                          <div className='text-right'>
                            {item.quantity > 1 && (
                              <p className='text-xs text-gray-400'>
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
              </div>

              {/* Order Summary */}
              <div className='bg-white rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-gray-200'>
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-5 flex items-center gap-3"
                  style={{
                    fontWeight: '700',
                    fontSize: '20px',
                    color: '#1f2937',
                  }}
                >
                  <div className='w-10 h-10 rounded-xl bg-[#FFF5FB] flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-[#f63a9e]'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                  Order Summary
                </h3>

                <div className='space-y-3 mb-5'>
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50'>
                    <span className='text-gray-600'>Subtotal</span>
                    <span
                      className='text-gray-900'
                      style={{ fontWeight: '600' }}
                    >
                      £{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50'>
                    <span className='text-gray-600'>Delivery</span>
                    <span
                      className='text-gray-900'
                      style={{ fontWeight: '600' }}
                    >
                      £{deliveryPrice.toFixed(2)}
                    </span>
                  </div>
                  {promoApplied && (
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between py-2 px-3 rounded-lg bg-green-50 border border-green-200'>
                        <span
                          className='text-green-700 flex items-center gap-1.5'
                          style={{ fontWeight: '600' }}
                        >
                          <Gift className='w-4 h-4' />
                          Discount
                        </span>
                        <span
                          className='text-green-600'
                          style={{ fontWeight: '700' }}
                        >
                          -£{discount.toFixed(2)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 px-3 py-2 bg-green-50/50 rounded-lg border border-green-100'>
                        <Check className='w-3.5 h-3.5 text-green-600' />
                        <span
                          className='text-xs text-green-700'
                          style={{ fontWeight: '600' }}
                        >
                          Promo applied:{' '}
                          <span
                            className='text-green-900'
                            style={{ fontWeight: '700' }}
                          >
                            {appliedPromoCode}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div className='pt-4 border-t-2 border-gray-200'>
                    <div className='flex items-center justify-between mb-2 px-3 py-3 rounded-xl bg-[#FFF5FB]'>
                      <span
                        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                        style={{ fontSize: '18px', fontWeight: '700' }}
                      >
                        Total
                      </span>
                      <span
                        className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e]"
                        style={{ fontSize: '34px', fontWeight: '700' }}
                      >
                        £{total.toFixed(2)}
                      </span>
                    </div>
                    <p className='text-xs text-gray-500 text-center mt-2'>
                      Includes all taxes and fees
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white shadow-lg hover:shadow-xl transition-all border-0 mb-4'
                  style={{
                    height: '54px',
                    fontSize: '16px',
                    fontWeight: '700',
                  }}
                >
                  Proceed to Checkout
                  <ArrowRight className='ml-2 w-5 h-5' />
                </Button>

                <div className='flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200'>
                  <Shield className='w-4 h-4 text-gray-600' />
                  <span
                    className='text-gray-700 text-sm'
                    style={{ fontWeight: '600' }}
                  >
                    Secure checkout with
                  </span>
                  <div className='flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200 shadow-sm'>
                    <CreditCard className='w-3.5 h-3.5 text-[#635bff]' />
                    <span
                      className='text-[#635bff]'
                      style={{ fontWeight: '700', fontSize: '13px' }}
                    >
                      Stripe
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Delivery & Promo */}
            <div className='space-y-3 sm:space-y-4'>
              {/* Delivery Method */}
              <div className='bg-white rounded-2xl border-2 border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow'>
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 flex items-center gap-2.5"
                  style={{ fontWeight: '700', fontSize: '17px' }}
                >
                  <div className='w-9 h-9 rounded-xl bg-[#FFF5FB] flex items-center justify-center shadow-sm'>
                    <Truck className='w-4.5 h-4.5 text-[#f63a9e]' />
                  </div>
                  Delivery Method
                </h3>
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={(value: 'standard' | 'express') =>
                    setDeliveryMethod(value)
                  }
                >
                  <div className='space-y-3'>
                    <div
                      onClick={() => setDeliveryMethod('standard')}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryMethod === 'standard'
                          ? 'border-[#f63a9e] bg-[#FFF5FB]'
                          : 'border-gray-200 hover:border-[#f63a9e]/40 bg-white'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          deliveryMethod === 'standard'
                            ? 'border-[#f63a9e] bg-[#f63a9e]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {deliveryMethod === 'standard' && (
                          <Check
                            className='w-3.5 h-3.5 text-white'
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='text-[15px] font-semibold text-gray-900 leading-5'>
                            {deliveryOptions.standard.name}
                          </span>
                          <span className='text-[15px] font-semibold text-[#f63a9e] whitespace-nowrap'>
                            £{deliveryOptions.standard.price.toFixed(2)}
                          </span>
                        </div>
                        <p className='text-sm text-gray-500 mt-1'>
                          {deliveryOptions.standard.duration}
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setDeliveryMethod('express')}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryMethod === 'express'
                          ? 'border-[#f63a9e] bg-[#FFF5FB]'
                          : 'border-gray-200 hover:border-[#f63a9e]/40 bg-white'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          deliveryMethod === 'express'
                            ? 'border-[#f63a9e] bg-[#f63a9e]'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {deliveryMethod === 'express' && (
                          <Check
                            className='w-3.5 h-3.5 text-white'
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center justify-between gap-3'>
                          <div className='flex items-center gap-2'>
                            <span className='text-[15px] font-semibold text-gray-900 leading-5'>
                              {deliveryOptions.express.name}
                            </span>
                            <span className='text-[10px] bg-[#f63a9e] text-white px-2 py-0.5 rounded-full font-bold tracking-wide'>
                              FAST
                            </span>
                          </div>
                          <span className='text-[15px] font-semibold text-[#f63a9e] whitespace-nowrap'>
                            £{deliveryOptions.express.price.toFixed(2)}
                          </span>
                        </div>
                        <p className='text-sm text-gray-500 mt-1'>
                          {deliveryOptions.express.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Promo Code */}
              <div className='bg-white rounded-2xl border-2 border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow'>
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 flex items-center gap-2.5"
                  style={{ fontWeight: '700', fontSize: '17px' }}
                >
                  <div className='w-9 h-9 rounded-xl bg-[#FFF5FB] flex items-center justify-center shadow-sm'>
                    <Tag className='w-4.5 h-4.5 text-[#f63a9e]' />
                  </div>
                  Promo Code
                </h3>
                <div className='space-y-3'>
                  <div className='flex gap-2'>
                    <div className='relative flex-1'>
                      <Tag className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                      <Input
                        type='text'
                        placeholder='Enter promo code'
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        disabled={promoApplied}
                        className='pl-10 h-11 border-2 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-[#f63a9e]/20'
                        style={{ fontWeight: '500' }}
                      />
                    </div>
                    <Button
                      onClick={handleApplyPromo}
                      disabled={
                        promoApplied || !promoCode.trim() || validatingPromo
                      }
                      className={`px-5 rounded-xl text-sm shadow-sm ${
                        promoApplied
                          ? 'bg-green-500 hover:bg-green-600 text-white border-0'
                          : 'bg-[#f63a9e] hover:bg-[#e02d8d] text-white border-0'
                      }`}
                      style={{ height: '44px', fontWeight: '700' }}
                    >
                      {promoApplied ? (
                        <>
                          <svg
                            className='w-4 h-4 mr-1.5'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2.5}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                          Applied
                        </>
                      ) : validatingPromo ? (
                        <>
                          <Loader2 className='w-4 h-4 animate-spin' />
                        </>
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  {promoApplied ? (
                    <div className='p-4 bg-green-50 border-2 border-green-300 rounded-xl shadow-sm'>
                      <div className='flex items-start gap-3'>
                        <div className='w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0 shadow-md'>
                          <svg
                            className='w-5 h-5 text-white'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2.5}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        </div>
                        <div>
                          <p
                            className='text-green-800'
                            style={{ fontWeight: '700', fontSize: '14px' }}
                          >
                            Promo code applied!
                          </p>
                          <p
                            className='text-green-600 text-xs mt-1'
                            style={{ fontWeight: '600' }}
                          >
                            You saved £{discount.toFixed(2)} on this order
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : featuredPromotion ? (
                    <div className='p-4 bg-[#FFF5FB] border-2 border-[#f63a9e]/30 rounded-xl shadow-sm'>
                      <div className='flex items-start gap-3'>
                        <div className='w-8 h-8 rounded-lg bg-[#f63a9e] flex items-center justify-center flex-shrink-0 shadow-md'>
                          <Sparkles className='w-4 h-4 text-white' />
                        </div>
                        <div className='flex-1'>
                          <p
                            className='text-gray-800 text-sm'
                            style={{ fontWeight: '600' }}
                          >
                            Try code:{' '}
                            <button
                              onClick={() => {
                                setPromoCode(featuredPromotion.code);
                              }}
                              className='text-[#f63a9e] hover:text-[#e02d8d] transition-colors'
                              style={{ fontWeight: '700' }}
                            >
                              {featuredPromotion.code}
                            </button>
                          </p>
                          <p className='text-gray-600 text-xs mt-1'>
                            {featuredPromotion.description || 
                              `Get ${featuredPromotion.type === 'percentage' 
                                ? `${featuredPromotion.value}% off` 
                                : featuredPromotion.type === 'fixed_amount'
                                ? `£${featuredPromotion.value} off`
                                : 'free shipping on'} your order`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='p-4 bg-gray-50 border-2 border-gray-200 rounded-xl shadow-sm'>
                      <div className='flex items-start gap-3'>
                        <div className='w-8 h-8 rounded-lg bg-gray-300 flex items-center justify-center flex-shrink-0'>
                          <Tag className='w-4 h-4 text-gray-600' />
                        </div>
                        <div>
                          <p
                            className='text-gray-700 text-sm'
                            style={{ fontWeight: '600' }}
                          >
                            Have a promo code?
                          </p>
                          <p className='text-gray-500 text-xs mt-1'>
                            Enter your code above to apply discount
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
