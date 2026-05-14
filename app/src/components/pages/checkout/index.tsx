import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSiteSetting } from '@/lib/supabase/hooks';
import { StripePaymentForm } from '@/components/shared/stripe-payment-form';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  Search,
  Check,
  CreditCard,
  ShoppingBag,
  Shield,
  Lock,
  Truck,
  Tag,
  Loader2,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
} from 'lucide-react';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

// Returns just the base product name by stripping any trailing
// ratio/size segments. Item names are built like
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

interface PostcoderAddress {
  addressline1: string;
  addressline2?: string;
  summaryline?: string;
  organisation?: string;
  buildingname?: string;
  premise?: string;
  street?: string;
  dependentlocality?: string;
  posttown: string;
  county?: string;
  postcode: string;
  country?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  address: string;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, shippingCost, discount, appliedPromoCode } = useCart();
  // 2-step flow: 1 = Your Details (contact + address), 2 = Review & Pay
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    postcode: '',
    address: '',
  });
  const [searchedAddresses, setSearchedAddresses] = useState<PostcoderAddress[]>([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [addressFilter, setAddressFilter] = useState('');
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Validation functions
  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }));
      return false;
    }
    if (name.trim().length < 2) {
      setErrors(prev => ({
        ...prev,
        name: 'Name must be at least 2 characters',
      }));
      return false;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      setErrors(prev => ({
        ...prev,
        name: 'Name can only contain letters, spaces, hyphens, and apostrophes',
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: undefined }));
    return true;
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address',
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  const validateUKPhone = (phone: string): boolean => {
    if (!phone.trim()) {
      setErrors(prev => ({ ...prev, phone: 'Phone number is required' }));
      return false;
    }
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const ukPhoneRegex =
      /^(?:(?:\+44\s?|0)(?:7\d{3}|1\d{3,4}|2\d{1,2}|3\d{2,3})\s?\d{3,4}\s?\d{3,4}|(?:\+44|0)7\d{9})$/;
    const cleanPhoneRegex = /^(?:\+44|0)(?:7\d{9}|[123]\d{8,9})$/;

    if (!ukPhoneRegex.test(phone) && !cleanPhoneRegex.test(cleanPhone)) {
      setErrors(prev => ({
        ...prev,
        phone:
          'Please enter a valid UK phone number (e.g., 07123 456789 or 020 1234 5678)',
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, phone: undefined }));
    return true;
  };

  const validateDetails = (): boolean => {
    const nameValid = validateName(formData.name);
    const emailValid = validateEmail(formData.email);
    const phoneValid = validateUKPhone(formData.phone);
    const addressValid = !!formData.postcode.trim() && !!formData.address.trim();
    return nameValid && emailValid && phoneValid && addressValid;
  };

  // Fetch delivery prices from settings for reference
  const { data: expressShipping } = useSiteSetting('shipping_express_cost');

  const getEstimatedDays = () => {
    const expressPrice = expressShipping?.setting_value?.value || 6.99;
    if (Math.abs(shippingCost - expressPrice) < 0.01) {
      return '3-5 business days';
    }
    return '7-10 business days';
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = shippingCost;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const handleContinue = () => {
    if (!validateDetails()) {
      if (!formData.postcode.trim() || !formData.address.trim()) {
        toast.error('Please enter your postcode and select an address');
      } else {
        toast.error('Please correct the errors before continuing');
      }
      return;
    }
    setCurrentStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePostcodeSearch = async () => {
    if (!formData.postcode.trim()) {
      toast.error('Please enter a postcode');
      return;
    }

    setIsSearchingAddress(true);
    setSearchedAddresses([]);
    setShowAddresses(false);
    setAddressFilter('');

    try {
      const postcode = formData.postcode.trim().toUpperCase().replace(/\s+/g, '');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/address/lookup?postcode=${encodeURIComponent(postcode)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Postcode not found. Please check and try again.');
        } else if (response.status === 502) {
          toast.error('Address lookup unavailable. Please enter your address manually.');
        } else {
          throw new Error('Failed to search postcode');
        }
        setShowAddresses(true);
        return;
      }

      const data: PostcoderAddress[] = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        toast.error('No addresses found for this postcode. Please check and try again.');
        setShowAddresses(true);
        return;
      }

      setSearchedAddresses(data);
      setShowAddresses(true);
      toast.success(`Found ${data.length} address${data.length !== 1 ? 'es' : ''}`);
    } catch (error) {
      console.error('Postcode search error:', error);
      toast.error('Failed to search postcode. Please try again.');
      setShowAddresses(true);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const formatAddress = (addr: PostcoderAddress): string => {
    const parts = [
      addr.addressline1,
      addr.addressline2,
      addr.posttown,
      addr.county,
      addr.postcode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const selectAddress = (addr: PostcoderAddress) => {
    setFormData({
      ...formData,
      address: formatAddress(addr),
      postcode: addr.postcode,
    });
    setShowAddresses(false);
  };

  const clearSelectedAddress = () => {
    setFormData(prev => ({ ...prev, address: '' }));
    setShowAddresses(true);
  };

  const isStep1Valid =
    formData.name &&
    formData.phone &&
    formData.email &&
    formData.postcode &&
    formData.address &&
    !errors.name &&
    !errors.phone &&
    !errors.email;

  return (
    <div className="min-h-screen bg-gray-50 font-['Mona_Sans',_sans-serif]">
      {/* Header */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5'>
        <div className='flex items-center justify-between'>
          <button
            onClick={() =>
              currentStep === 1 ? navigate('/cart') : handleBack()
            }
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group'
          >
            <div className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:shadow-md transition-shadow'>
              <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5' />
            </div>
            <span className='text-sm sm:text-base' style={{ fontWeight: '600' }}>
              {currentStep === 1 ? 'Back to Cart' : 'Edit Details'}
            </span>
          </button>

          <div className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm'>
            <Lock className='w-3.5 h-3.5 text-gray-500' />
            <span className='text-xs text-gray-600' style={{ fontWeight: '600' }}>
              Secure checkout
            </span>
          </div>
        </div>

        {/* Compact 2-step indicator */}
        <div className='mt-4 sm:mt-5'>
          <div className='flex items-center gap-2 sm:gap-3'>
            {[
              { step: 1, label: 'Your details' },
              { step: 2, label: 'Review & Pay' },
            ].map(({ step, label }, idx) => {
              const isActive = currentStep === step;
              const isDone = currentStep > step;
              return (
                <div key={step} className='flex items-center gap-2 sm:gap-3 flex-1'>
                  <div
                    className={cn(
                      'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm shrink-0 transition-colors',
                      isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-[#f63a9e] text-white'
                          : 'bg-gray-200 text-gray-500'
                    )}
                    style={{ fontWeight: '700' }}
                  >
                    {isDone ? <Check className='w-4 h-4' /> : step}
                  </div>
                  <span
                    className={cn(
                      'text-xs sm:text-sm whitespace-nowrap',
                      isActive
                        ? 'text-gray-900'
                        : isDone
                          ? 'text-green-600'
                          : 'text-gray-400'
                    )}
                    style={{ fontWeight: '600' }}
                  >
                    {label}
                  </span>
                  {idx === 0 && (
                    <div className='flex-1 h-px bg-gray-200 mx-1 sm:mx-2' />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-28 lg:pb-12'>
        <div className='flex flex-col-reverse lg:grid lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 items-start'>
          {/* Form / Review (left, wider) */}
          <div className='lg:col-span-3 w-full'>
            <AnimatePresence mode='wait'>
              {currentStep === 1 ? (
                <motion.div
                  key='step-1'
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className='bg-white rounded-2xl p-5 sm:p-7 lg:p-8 shadow-sm border-2 border-gray-200'
                >
                  <div className='mb-5 sm:mb-6'>
                    <h1
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1 text-xl sm:text-2xl lg:text-3xl"
                      style={{ fontWeight: '700', lineHeight: '1.15' }}
                    >
                      Your details
                    </h1>
                    <p className='text-gray-600 text-sm sm:text-base'>
                      We'll use this to keep you posted on delivery.
                    </p>
                  </div>

                  {/* Contact fields */}
                  <div className='space-y-4 sm:space-y-5'>
                    {[
                      {
                        id: 'name',
                        label: 'Full name',
                        icon: User,
                        type: 'text',
                        placeholder: 'Jane Doe',
                        autoComplete: 'name',
                        inputMode: 'text' as const,
                        value: formData.name,
                      },
                      {
                        id: 'phone',
                        label: 'Phone',
                        icon: Phone,
                        type: 'tel',
                        placeholder: '07123 456789',
                        autoComplete: 'tel',
                        inputMode: 'tel' as const,
                        value: formData.phone,
                      },
                      {
                        id: 'email',
                        label: 'Email',
                        icon: Mail,
                        type: 'email',
                        placeholder: 'jane@example.com',
                        autoComplete: 'email',
                        inputMode: 'email' as const,
                        value: formData.email,
                      },
                    ].map(field => {
                      const hasError = errors[field.id as keyof FormData];
                      const isFocused = fieldFocus === field.id;
                      const FieldIcon = field.icon;
                      return (
                        <div key={field.id}>
                          <Label
                            htmlFor={field.id}
                            className='text-gray-700 mb-1.5 block text-sm'
                            style={{ fontWeight: '600' }}
                          >
                            {field.label}
                          </Label>
                          <div className='relative'>
                            <FieldIcon className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                            <Input
                              id={field.id}
                              type={field.type}
                              placeholder={field.placeholder}
                              value={field.value}
                              autoComplete={field.autoComplete}
                              inputMode={field.inputMode}
                              onChange={e =>
                                setFormData({
                                  ...formData,
                                  [field.id]: e.target.value,
                                })
                              }
                              onFocus={() => setFieldFocus(field.id)}
                              onBlur={() => {
                                setFieldFocus(null);
                                if (field.id === 'name') validateName(field.value);
                                if (field.id === 'email') validateEmail(field.value);
                                if (field.id === 'phone') validateUKPhone(field.value);
                              }}
                              className={cn(
                                'h-12 sm:h-13 border-2 rounded-xl text-base pl-10 pr-10 transition-colors bg-white',
                                hasError
                                  ? 'border-red-400 focus:border-red-500'
                                  : isFocused
                                    ? 'border-[#f63a9e]'
                                    : 'border-gray-200 hover:border-gray-300'
                              )}
                            />
                            {field.value && !hasError && (
                              <div className='absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center'>
                                <Check className='w-3.5 h-3.5 text-white' strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          {hasError && (
                            <p className='text-red-500 text-xs mt-1.5 flex items-center gap-1'>
                              <span className='font-bold'>⚠</span> {hasError}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className='my-6 sm:my-7 border-t border-gray-200' />

                  {/* Address */}
                  <div className='mb-1'>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1 text-lg sm:text-xl flex items-center gap-2"
                      style={{ fontWeight: '700' }}
                    >
                      <MapPin className='w-5 h-5 text-[#f63a9e]' />
                      Delivery address
                    </h2>
                    <p className='text-gray-600 text-sm mb-4'>
                      Enter your UK postcode and pick your address.
                    </p>
                  </div>

                  {!formData.address ? (
                    <div className='space-y-4'>
                      <div>
                        <Label
                          htmlFor='postcode'
                          className='text-gray-700 mb-1.5 block text-sm'
                          style={{ fontWeight: '600' }}
                        >
                          Postcode
                        </Label>
                        <div className='flex gap-2'>
                          <Input
                            id='postcode'
                            type='text'
                            placeholder='e.g. SW1A 1AA'
                            value={formData.postcode}
                            autoComplete='postal-code'
                            onChange={e =>
                              setFormData({
                                ...formData,
                                postcode: e.target.value,
                              })
                            }
                            onFocus={() => setFieldFocus('postcode')}
                            onBlur={() => setFieldFocus(null)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handlePostcodeSearch();
                              }
                            }}
                            className={cn(
                              'h-12 sm:h-13 border-2 rounded-xl text-base px-4 flex-1 transition-colors bg-white uppercase',
                              fieldFocus === 'postcode'
                                ? 'border-[#f63a9e]'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                          />
                          <Button
                            onClick={handlePostcodeSearch}
                            disabled={isSearchingAddress || !formData.postcode.trim()}
                            className='h-12 sm:h-13 px-4 sm:px-5 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 whitespace-nowrap border-0 shrink-0'
                            style={{ fontWeight: '700' }}
                          >
                            {isSearchingAddress ? (
                              <Loader2 className='w-4 h-4 animate-spin' />
                            ) : (
                              <>
                                <Search className='w-4 h-4' />
                                <span className='hidden sm:inline'>Find</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {showAddresses && searchedAddresses.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {(() => {
                              const filter = addressFilter.trim().toLowerCase();
                              const visible = filter
                                ? searchedAddresses.filter(addr => {
                                    const haystack = [
                                      addr.addressline1,
                                      addr.addressline2,
                                      addr.posttown,
                                      addr.county,
                                      addr.postcode,
                                    ]
                                      .filter(Boolean)
                                      .join(' ')
                                      .toLowerCase();
                                    return haystack.includes(filter);
                                  })
                                : searchedAddresses;

                              return (
                                <>
                                  <div className='flex items-center justify-between mb-2'>
                                    <Label
                                      className='text-gray-700 text-sm'
                                      style={{ fontWeight: '600' }}
                                    >
                                      Select your address
                                    </Label>
                                    <span
                                      className='text-xs text-gray-500'
                                      style={{ fontWeight: '500' }}
                                    >
                                      {filter
                                        ? `${visible.length} of ${searchedAddresses.length}`
                                        : `${searchedAddresses.length} found`}
                                    </span>
                                  </div>

                                  {/* Inline filter — much faster than scrolling 20+ entries on mobile */}
                                  {searchedAddresses.length > 5 && (
                                    <div className='relative mb-2'>
                                      <Search className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                                      <Input
                                        type='text'
                                        inputMode='search'
                                        placeholder='Filter by house number or street'
                                        value={addressFilter}
                                        onChange={e => setAddressFilter(e.target.value)}
                                        className='h-11 border-2 border-gray-200 rounded-xl text-sm pl-9 pr-9 bg-white'
                                      />
                                      {addressFilter && (
                                        <button
                                          type='button'
                                          onClick={() => setAddressFilter('')}
                                          aria-label='Clear filter'
                                          className='absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center'
                                        >
                                          <X className='w-3.5 h-3.5' />
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {visible.length === 0 ? (
                                    <div className='p-3 rounded-xl bg-gray-50 border border-gray-200 text-center text-sm text-gray-500'>
                                      No matches for "{addressFilter}". Try a different number.
                                    </div>
                                  ) : (
                                    // No inner scroll on mobile — let the page scroll naturally
                                    // so users aren't trapped in a 3-row mini-viewport. On
                                    // desktop we cap it so the column doesn't get absurdly
                                    // tall.
                                    <div className='space-y-2 lg:max-h-96 lg:overflow-y-auto lg:pr-1'>
                                      {visible.map((addr, index) => {
                                        const formatted = formatAddress(addr);
                                        const isSelected = formData.address === formatted;
                                        return (
                                          <button
                                            key={`${addr.addressline1}-${index}`}
                                            onClick={() => selectAddress(addr)}
                                            className={cn(
                                              'w-full text-left p-3 sm:p-3.5 rounded-xl border-2 transition-colors',
                                              isSelected
                                                ? 'border-[#f63a9e] bg-[#FFF5FB]'
                                                : 'border-gray-200 bg-white hover:border-[#f63a9e]/40 active:bg-gray-50'
                                            )}
                                          >
                                            <div className='flex items-start gap-2.5'>
                                              <MapPin
                                                className={cn(
                                                  'w-4 h-4 mt-0.5 flex-shrink-0',
                                                  isSelected
                                                    ? 'text-[#f63a9e]'
                                                    : 'text-gray-400'
                                                )}
                                              />
                                              <div className='min-w-0 flex-1'>
                                                <p
                                                  className='text-gray-900 text-sm leading-snug'
                                                  style={{ fontWeight: '600' }}
                                                >
                                                  {addr.addressline1}
                                                  {addr.addressline2 &&
                                                    `, ${addr.addressline2}`}
                                                </p>
                                                <p className='text-gray-500 text-xs mt-0.5'>
                                                  {[
                                                    addr.posttown,
                                                    addr.county,
                                                    addr.postcode,
                                                  ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                                </p>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </motion.div>
                        )}

                        {showAddresses &&
                          searchedAddresses.length === 0 &&
                          !isSearchingAddress && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className='p-3.5 bg-red-50 border-2 border-red-200 rounded-xl'
                            >
                              <p
                                className='text-red-700 text-sm'
                                style={{ fontWeight: '600' }}
                              >
                                No addresses found. Please double-check your postcode.
                              </p>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className='p-4 bg-green-50 border-2 border-green-300 rounded-xl'>
                      <div className='flex items-start gap-3'>
                        <div className='w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0'>
                          <Check className='w-5 h-5 text-white' strokeWidth={3} />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p
                            className='text-green-900 text-sm mb-0.5'
                            style={{ fontWeight: '700' }}
                          >
                            Delivery to
                          </p>
                          <p className='text-green-800 text-sm break-words'>
                            {formData.address}
                          </p>
                          <button
                            onClick={clearSelectedAddress}
                            className='mt-2 text-xs text-green-700 hover:text-green-900 inline-flex items-center gap-1 underline underline-offset-2'
                            style={{ fontWeight: '600' }}
                          >
                            <Pencil className='w-3 h-3' />
                            Change address
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desktop continue button (mobile uses sticky bar below) */}
                  <div className='hidden lg:block mt-7 pt-6 border-t border-gray-200'>
                    <Button
                      onClick={handleContinue}
                      disabled={!isStep1Valid}
                      className='w-full h-13 rounded-xl bg-[#f63a9e] hover:bg-[#e02d8d] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      style={{ fontWeight: '700', fontSize: '15px', height: '52px' }}
                    >
                      Continue to review
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key='step-2'
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className='bg-white rounded-2xl p-5 sm:p-7 lg:p-8 shadow-sm border-2 border-gray-200'
                >
                  <div className='mb-5 sm:mb-6'>
                    <h1
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1 text-xl sm:text-2xl lg:text-3xl"
                      style={{ fontWeight: '700', lineHeight: '1.15' }}
                    >
                      Review &amp; pay
                    </h1>
                    <p className='text-gray-600 text-sm sm:text-base'>
                      Confirm your details — payment is processed securely by Stripe.
                    </p>
                  </div>

                  {/* Contact summary */}
                  <div className='rounded-xl border-2 border-gray-200 overflow-hidden'>
                    <div className='flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200'>
                      <span
                        className='text-gray-700 text-sm'
                        style={{ fontWeight: '700' }}
                      >
                        Contact
                      </span>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className='text-[#f63a9e] hover:text-[#e02d8d] text-xs inline-flex items-center gap-1'
                        style={{ fontWeight: '700' }}
                      >
                        <Pencil className='w-3 h-3' />
                        Edit
                      </button>
                    </div>
                    <dl className='divide-y divide-gray-100'>
                      {[
                        { icon: User, label: 'Name', value: formData.name },
                        { icon: Phone, label: 'Phone', value: formData.phone },
                        { icon: Mail, label: 'Email', value: formData.email },
                      ].map(item => {
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className='flex items-start gap-3 px-4 py-3'
                          >
                            <ItemIcon className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                            <dt className='text-gray-500 text-sm w-16 sm:w-20 shrink-0'>
                              {item.label}
                            </dt>
                            <dd
                              className='text-gray-900 text-sm break-all flex-1'
                              style={{ fontWeight: '600' }}
                            >
                              {item.value}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>

                  {/* Address summary */}
                  <div className='rounded-xl border-2 border-gray-200 overflow-hidden mt-4'>
                    <div className='flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200'>
                      <span
                        className='text-gray-700 text-sm'
                        style={{ fontWeight: '700' }}
                      >
                        Delivery address
                      </span>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className='text-[#f63a9e] hover:text-[#e02d8d] text-xs inline-flex items-center gap-1'
                        style={{ fontWeight: '700' }}
                      >
                        <Pencil className='w-3 h-3' />
                        Edit
                      </button>
                    </div>
                    <div className='flex items-start gap-3 px-4 py-3'>
                      <MapPin className='w-4 h-4 text-[#f63a9e] mt-0.5 flex-shrink-0' />
                      <p
                        className='text-gray-900 text-sm break-words'
                        style={{ fontWeight: '600' }}
                      >
                        {formData.address}
                      </p>
                    </div>
                  </div>

                  {/* Embedded payment: Express Checkout + Payment Element */}
                  <div className='mt-6 pt-6 border-t border-gray-200'>
                    <StripePaymentForm
                      cartItems={cartItems}
                      subtotal={subtotal}
                      deliveryFee={deliveryFee}
                      discount={discount}
                      promoCode={appliedPromoCode || undefined}
                      total={total}
                      customer={{
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                      }}
                      shippingAddress={{
                        address: formData.address,
                        postcode: formData.postcode,
                      }}
                      deliveryLabel={`Delivery (est. ${getEstimatedDays()})`}
                    />
                  </div>

                  {/* Trust strip */}
                  <div className='mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500'>
                    <span className='inline-flex items-center gap-1.5'>
                      <Shield className='w-3.5 h-3.5 text-green-600' />
                      Encrypted
                    </span>
                    <span className='inline-flex items-center gap-1.5'>
                      <Lock className='w-3.5 h-3.5 text-blue-600' />
                      PCI DSS
                    </span>
                    <span className='inline-flex items-center gap-1.5'>
                      <CreditCard className='w-3.5 h-3.5 text-[#635bff]' />
                      Stripe
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <motion.div
            className='lg:sticky lg:top-6 lg:col-span-2 w-full'
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className='bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden'>
              {/* Mobile collapsible toggle */}
              <button
                className='lg:hidden w-full flex items-center justify-between p-4'
                onClick={() => setSummaryOpen(v => !v)}
                aria-expanded={summaryOpen}
              >
                <div className='flex items-center gap-2.5'>
                  <div className='w-9 h-9 rounded-xl bg-[#f63a9e] flex items-center justify-center'>
                    <ShoppingBag className='w-4 h-4 text-white' />
                  </div>
                  <div className='text-left'>
                    <p
                      className='text-gray-900 text-sm'
                      style={{ fontWeight: '700' }}
                    >
                      Order summary
                    </p>
                    <p className='text-xs text-gray-500'>
                      {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · £
                      {total.toFixed(2)}
                    </p>
                  </div>
                </div>
                {summaryOpen ? (
                  <ChevronUp className='w-5 h-5 text-gray-400' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-gray-400' />
                )}
              </button>

              <div className={cn('p-5 sm:p-6', summaryOpen ? 'block' : 'hidden lg:block')}>
                {/* Desktop header */}
                <div className='hidden lg:flex items-center gap-3 mb-5'>
                  <div className='w-10 h-10 rounded-xl bg-[#f63a9e] flex items-center justify-center'>
                    <ShoppingBag className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-lg"
                      style={{ fontWeight: '700' }}
                    >
                      Order summary
                    </h2>
                    <p className='text-gray-500 text-xs'>
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {/* Cart Items */}
                <ul className='mb-4 max-h-56 lg:max-h-72 overflow-y-auto pr-1 divide-y divide-gray-100'>
                  {cartItems.map(item => {
                    const displayName = getDisplayName(item.name);
                    return (
                      <li
                        key={item.id}
                        className='py-2.5 first:pt-0 last:pb-0 flex items-start gap-3'
                      >
                        <div className='flex-1 min-w-0'>
                          <h4
                            className='text-gray-900 truncate text-sm leading-snug'
                            style={{ fontWeight: '600' }}
                          >
                            {displayName}
                          </h4>
                          <p className='text-gray-500 text-xs mt-0.5'>
                            {item.size ? `${item.size} · ` : ''}Qty {item.quantity}
                          </p>
                        </div>
                        <span
                          className='text-gray-900 text-sm whitespace-nowrap'
                          style={{ fontWeight: '700' }}
                        >
                          £{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Price Breakdown */}
                <div className='space-y-2 pt-4 border-t border-gray-200 mb-4'>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-gray-600'>Subtotal</span>
                    <span
                      className='text-gray-900'
                      style={{ fontWeight: '600' }}
                    >
                      £{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between items-start text-sm'>
                    <span className='text-gray-600 inline-flex items-center gap-1.5'>
                      <Truck className='w-3.5 h-3.5' />
                      Delivery
                    </span>
                    <div className='text-right'>
                      <span
                        className='text-gray-900'
                        style={{ fontWeight: '600' }}
                      >
                        £{deliveryFee.toFixed(2)}
                      </span>
                      <div className='text-[11px] text-gray-500 mt-0.5'>
                        Est. {getEstimatedDays()}
                      </div>
                    </div>
                  </div>
                  {discount > 0 && (
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-green-700 inline-flex items-center gap-1.5'>
                        <Tag className='w-3.5 h-3.5' />
                        Promo{appliedPromoCode ? ` (${appliedPromoCode})` : ''}
                      </span>
                      <span
                        className='text-green-600'
                        style={{ fontWeight: '700' }}
                      >
                        -£{discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className='flex justify-between items-center p-4 bg-[#FFF5FB] rounded-xl'>
                  <span
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                    style={{ fontWeight: '700', fontSize: '15px' }}
                  >
                    Total
                  </span>
                  <span
                    className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e]"
                    style={{ fontWeight: '700', fontSize: '26px', lineHeight: '1' }}
                  >
                    £{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile sticky CTA bar — only on Step 1; Step 2 has inline Pay button */}
      {currentStep === 1 && (
        <div className='lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-200 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]'>
          <div className='flex items-center gap-3'>
            <div className='flex-shrink-0'>
              <p className='text-[11px] text-gray-500 leading-tight'>Total</p>
              <p
                className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e] leading-tight"
                style={{ fontWeight: '700', fontSize: '22px' }}
              >
                £{total.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={handleContinue}
              disabled={!isStep1Valid}
              className='flex-1 h-12 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              style={{ fontWeight: '700', fontSize: '15px' }}
            >
              Review order
              <ArrowRight className='w-4 h-4 ml-1.5' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
