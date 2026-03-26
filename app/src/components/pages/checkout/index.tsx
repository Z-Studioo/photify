import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSiteSetting } from '@/lib/supabase/hooks';
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
  Star,
  Truck,
  Tag,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
  Video,
  Sparkles,
} from 'lucide-react';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
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
  videoPermission: boolean;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, shippingCost, discount, appliedPromoCode } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    postcode: '',
    address: '',
    videoPermission: false,
  });
  const [searchedAddresses, setSearchedAddresses] = useState<PostcoderAddress[]>([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
    // Remove all spaces, hyphens, and parentheses for validation
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    // UK phone patterns:
    // - Mobile: 07xxx xxxxxx (11 digits starting with 07)
    // - Landline: 01xxx/02xxx/03xxx (10-11 digits)
    // - International format: +44 7xxx or +44 1xxx/2xxx/3xxx
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

  const validateStep1 = (): boolean => {
    const nameValid = validateName(formData.name);
    const emailValid = validateEmail(formData.email);
    const phoneValid = validateUKPhone(formData.phone);
    return nameValid && emailValid && phoneValid;
  };

  // Fetch delivery prices from settings for reference
  // const { data: standardShipping } = useSiteSetting('shipping_flat_rate');
  const { data: expressShipping } = useSiteSetting('shipping_express_cost');

  // Get estimated delivery days based on delivery method
  const getEstimatedDays = () => {
    // const standardPrice = standardShipping?.setting_value?.value || 9.99;
    const expressPrice = expressShipping?.setting_value?.value || 19.99;

    // Check if current shipping cost matches express delivery
    if (Math.abs(shippingCost - expressPrice) < 0.01) {
      return '2-3 business days';
    }
    // Default to standard delivery
    return '5-7 business days';
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = shippingCost;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const handleNext = () => {
    // Validate Step 1 (Personal Information)
    if (currentStep === 1) {
      if (!validateStep1()) {
        toast.error('Please correct the errors before continuing');
        return;
      }
    }

    // Validate Step 2 (Address)
    if (currentStep === 2) {
      if (!formData.postcode.trim() || !formData.address.trim()) {
        toast.error('Please enter your postcode and select an address');
        return;
      }
    }

    if (currentStep < 4) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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

  const handleCheckout = async () => {
    if (isProcessing) return;

    // Final validation before checkout
    if (!validateStep1()) {
      toast.error('Please correct the errors in your personal information');
      setCurrentStep(1);
      return;
    }

    if (!formData.postcode.trim() || !formData.address.trim()) {
      toast.error('Please complete your address information');
      setCurrentStep(2);
      return;
    }

    try {
      setIsProcessing(true);

      // Validate cart
      if (cartItems.length === 0) {
        toast.error('Your cart is empty');
        return;
      }

      // Create checkout session
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems,
            customerInfo: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            },
            shippingAddress: {
              address: formData.address,
              postcode: formData.postcode,
            },
            videoPermission: formData.videoPermission,
            subtotal,
            deliveryFee,
            discount,
            promoCode: appliedPromoCode || undefined,
            total,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Store order ID in sessionStorage for confirmation page
      sessionStorage.setItem('pendingOrderId', data.orderId);

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to process checkout'
      );
      setIsProcessing(false);
    }
  };

  const isStep1Valid =
    formData.name &&
    formData.phone &&
    formData.email &&
    !errors.name &&
    !errors.phone &&
    !errors.email;
  const isStep2Valid = formData.postcode && formData.address;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 font-['Mona_Sans',_sans-serif]">
      {/* Ambient Background Effects */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <motion.div
          className='absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#f63a9e]/20 to-purple-500/20 rounded-full blur-3xl'
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className='absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl'
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Header */}
      <div className='relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6'>
        <div className='flex items-center justify-between'>
          <motion.button
            onClick={() => navigate('/cart')}
            className='flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors group'
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:shadow-lg transition-shadow'>
              <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5' />
            </div>
            <span style={{ fontWeight: '600' }}>Back to Cart</span>
          </motion.button>
        </div>

        {/* Step Progress Bar */}
        <div className='mt-4 sm:mt-6'>
          <div className='flex items-center justify-between mb-2 sm:mb-3'>
            {['Details', 'Address', 'Review', 'Payment'].map((label, i) => {
              const step = i + 1;
              const isDone = completedSteps.includes(step);
              const isActive = currentStep === step;
              return (
                <div key={label} className='flex-1 flex flex-col items-center'>
                  <div
                    className={cn(
                      'w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shadow-sm',
                      isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-[#f63a9e] text-white shadow-[#f63a9e]/30 shadow-lg'
                          : 'bg-gray-200 text-gray-400'
                    )}
                  >
                    {isDone ? <Check className='w-4 h-4' /> : step}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs mt-1 font-semibold',
                      isActive ? 'text-[#f63a9e]' : isDone ? 'text-green-600' : 'text-gray-400'
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className='relative h-1 sm:h-1.5 bg-gray-200 rounded-full mx-3'>
            <div
              className='absolute top-0 left-0 h-full bg-gradient-to-r from-[#f63a9e] to-purple-500 rounded-full transition-all duration-500'
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12'>
        <div className='flex flex-col-reverse lg:grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start'>
          {/* Left Side - Form */}
          <div>
            <AnimatePresence mode='wait'>
              {/* Form Content with Title Inside */}
              <motion.div
                key={`form-${currentStep}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className='bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-gray-100'
              >
                {/* Step Title Inside Container */}
                <div className='mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200'>
                  <h1
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2 sm:mb-3 text-2xl sm:text-3xl lg:text-4xl"
                    style={{ fontWeight: '700', lineHeight: '1.1' }}
                  >
                    {currentStep === 1 && "Let's get your details"}
                    {currentStep === 2 && 'Where to deliver?'}
                    {currentStep === 3 && 'Review everything'}
                    {currentStep === 4 && 'Secure Payment'}
                  </h1>
                  <p className='text-gray-600 text-sm sm:text-base'>
                    {currentStep === 1 &&
                      "We'll use this to keep you updated about your order"}
                    {currentStep === 2 &&
                      "Choose where you'd like your beautiful prints delivered"}
                    {currentStep === 3 &&
                      'Take a moment to confirm your details are correct'}
                    {currentStep === 4 &&
                      'Your payment details are encrypted and secure'}
                  </p>
                </div>

                {/* Step 1: Contact Information */}
                {currentStep === 1 && (
                  <div className='space-y-6 sm:space-y-8'>
                    {[
                      {
                        id: 'name',
                        label: 'Full Name',
                        icon: User,
                        type: 'text',
                        placeholder: 'John Doe',
                        value: formData.name,
                      },
                      {
                        id: 'phone',
                        label: 'Phone Number',
                        icon: Phone,
                        type: 'tel',
                        placeholder: '07123 456789 or 020 1234 5678',
                        value: formData.phone,
                      },
                      {
                        id: 'email',
                        label: 'Email Address',
                        icon: Mail,
                        type: 'email',
                        placeholder: 'john@example.com',
                        value: formData.email,
                      },
                    ].map((field, index) => {
                      const hasError = errors[field.id as keyof FormData];
                      return (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Label
                            htmlFor={field.id}
                            className='text-gray-700 mb-2 sm:mb-3 block text-sm sm:text-base'
                            style={{ fontWeight: '600' }}
                          >
                            {field.label}
                          </Label>
                          <div className='relative group'>
                            <Input
                              id={field.id}
                              type={field.type}
                              placeholder={field.placeholder}
                              value={field.value}
                              onChange={e =>
                                setFormData({
                                  ...formData,
                                  [field.id]: e.target.value,
                                })
                              }
                              onFocus={() => setFieldFocus(field.id)}
                              onBlur={() => {
                                setFieldFocus(null);
                                // Validate on blur
                                if (field.id === 'name')
                                  validateName(field.value);
                                if (field.id === 'email')
                                  validateEmail(field.value);
                                if (field.id === 'phone')
                                  validateUKPhone(field.value);
                              }}
                              className={cn(
                                'h-12 sm:h-14 lg:h-16 border-2 rounded-xl sm:rounded-2xl text-sm sm:text-base pl-4 sm:pl-6 pr-12 sm:pr-14 transition-all bg-gray-50 focus:bg-white',
                                hasError
                                  ? 'border-red-500 ring-4 ring-red-500/10'
                                  : fieldFocus === field.id
                                    ? 'border-[#f63a9e] ring-4 ring-[#f63a9e]/10 shadow-lg'
                                    : 'border-gray-200'
                              )}
                            />
                            <AnimatePresence>
                              {field.value && !hasError && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  className='absolute right-3 sm:right-5 top-1/2 -translate-y-1/2'
                                >
                                  <div className='w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500 flex items-center justify-center'>
                                    <Check className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {hasError && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className='text-red-500 text-xs sm:text-sm mt-2 flex items-center gap-1'
                            >
                              <span className='font-semibold'>⚠</span>{' '}
                              {hasError}
                            </motion.p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Step 2: Delivery Address */}
                {currentStep === 2 && (
                  <div className='space-y-4 sm:space-y-6'>
                    {/* Postcode Search Only */}
                    <div>
                      <Label
                        htmlFor='postcode'
                        className='text-gray-700 mb-2 sm:mb-3 block text-sm sm:text-base'
                        style={{ fontWeight: '600' }}
                      >
                        Enter Your UK Postcode
                      </Label>
                      <div className='flex gap-2 sm:gap-3'>
                        <Input
                          id='postcode'
                          type='text'
                          placeholder='e.g., SW1A 1AA, EC1A 1BB, M1 1AE'
                          value={formData.postcode}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              postcode: e.target.value,
                            })
                          }
                          onFocus={() => setFieldFocus('postcode')}
                          onBlur={() => setFieldFocus(null)}
                          onKeyPress={e =>
                            e.key === 'Enter' && handlePostcodeSearch()
                          }
                          className={cn(
                            'h-12 sm:h-14 lg:h-16 border-2 rounded-xl sm:rounded-2xl text-sm sm:text-base pl-4 sm:pl-6 flex-1 transition-all bg-gray-50 focus:bg-white',
                            fieldFocus === 'postcode'
                              ? 'border-[#f63a9e] ring-4 ring-[#f63a9e]/10 shadow-lg'
                              : 'border-gray-200'
                          )}
                        />
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={handlePostcodeSearch}
                            disabled={isSearchingAddress}
                            className='h-12 sm:h-14 lg:h-16 px-4 sm:px-6 lg:px-8 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl sm:rounded-2xl shadow-lg disabled:opacity-50 whitespace-nowrap'
                            style={{ fontWeight: '700' }}
                          >
                            {isSearchingAddress ? (
                              <>
                                <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                                Searching...
                              </>
                            ) : (
                              <>
                                <Search className='w-5 h-5 mr-2' />
                                Find
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showAddresses && searchedAddresses.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Label
                            className='text-gray-700 mb-3 block'
                            style={{ fontWeight: '600', fontSize: '15px' }}
                          >
                            Select Your Address
                          </Label>
                          <div className='space-y-2 max-h-96 overflow-y-auto pr-2'>
                            {searchedAddresses.map((addr, index) => {
                              const formatted = formatAddress(addr);
                              const isSelected = formData.address === formatted;
                              return (
                                <motion.button
                                  key={index}
                                  onClick={() => selectAddress(addr)}
                                  className={cn(
                                    'w-full text-left p-4 rounded-2xl border-2 transition-all',
                                    isSelected
                                      ? 'border-[#f63a9e] bg-gradient-to-br from-[#f63a9e]/5 to-purple-50 shadow-lg'
                                      : 'border-gray-200 bg-white hover:border-[#f63a9e]/50 hover:shadow-md'
                                  )}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.04 }}
                                  whileHover={{ x: 4 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className='flex items-center justify-between gap-3'>
                                    <div className='flex items-start gap-3 min-w-0'>
                                      <MapPin
                                        className={cn(
                                          'w-4 h-4 mt-0.5 flex-shrink-0',
                                          isSelected ? 'text-[#f63a9e]' : 'text-gray-400'
                                        )}
                                      />
                                      <div className='min-w-0'>
                                        <p className='font-semibold text-gray-900 text-sm leading-tight'>
                                          {addr.addressline1}
                                          {addr.addressline2 && `, ${addr.addressline2}`}
                                        </p>
                                        <p className='text-gray-500 text-xs mt-0.5'>
                                          {[addr.posttown, addr.county, addr.postcode].filter(Boolean).join(', ')}
                                        </p>
                                      </div>
                                    </div>
                                    <AnimatePresence>
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          exit={{ scale: 0, rotate: 180 }}
                                          className='w-8 h-8 rounded-full bg-[#f63a9e] flex items-center justify-center flex-shrink-0'
                                        >
                                          <Check className='w-4 h-4 text-white' />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {showAddresses &&
                        searchedAddresses.length === 0 &&
                        !isSearchingAddress && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className='p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl text-center'
                          >
                            <p
                              className='text-red-700 text-sm sm:text-base'
                              style={{ fontWeight: '600' }}
                            >
                              No addresses found for this postcode. Please check
                              and try again.
                            </p>
                            <p className='text-red-600 text-xs sm:text-sm mt-2'>
                              Example UK postcodes: SW1A 1AA, EC1A 1BB, M1 1AE
                            </p>
                          </motion.div>
                        )}

                      {formData.address && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className='p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl'
                        >
                          <div className='flex items-start gap-4'>
                            <div className='w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0'>
                              <Check className='w-6 h-6 text-white' />
                            </div>
                            <div className='flex-1'>
                              <h4
                                className='text-green-900 mb-2'
                                style={{ fontWeight: '700' }}
                              >
                                Delivery Address Confirmed
                              </h4>
                              <p className='text-green-700'>
                                {formData.address}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <div className='space-y-4 sm:space-y-6'>
                    <motion.div
                      className='p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl border-2 border-indigo-200 relative overflow-hidden'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className='absolute top-0 right-0 w-20 h-20 sm:w-40 sm:h-40 bg-indigo-300/30 rounded-full blur-3xl' />
                      <div className='relative z-10'>
                        <div className='flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
                          <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0'>
                            <User className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
                          </div>
                          <h3
                            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-base sm:text-lg lg:text-xl"
                            style={{ fontWeight: '700' }}
                          >
                            Contact Information
                          </h3>
                        </div>
                        <div className='space-y-3 sm:space-y-4'>
                          {[
                            { icon: User, label: 'Name', value: formData.name },
                            {
                              icon: Phone,
                              label: 'Phone',
                              value: formData.phone,
                            },
                            {
                              icon: Mail,
                              label: 'Email',
                              value: formData.email,
                            },
                          ].map((item, index) => {
                            const ItemIcon = item.icon;
                            return (
                              <motion.div
                                key={item.label}
                                className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 lg:p-5 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl'
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <div className='flex items-center gap-2 sm:gap-3'>
                                  <ItemIcon className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0' />
                                  <span className='text-gray-600 text-sm sm:text-base'>
                                    {item.label}:
                                  </span>
                                </div>
                                <span
                                  className='text-gray-900 text-sm sm:text-base break-words ml-6 sm:ml-0'
                                  style={{ fontWeight: '600' }}
                                >
                                  {item.value}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className='p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-xl sm:rounded-2xl border-2 border-purple-200 relative overflow-hidden'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className='absolute bottom-0 left-0 w-20 h-20 sm:w-40 sm:h-40 bg-purple-300/30 rounded-full blur-3xl' />
                      <div className='relative z-10'>
                        <div className='flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
                          <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0'>
                            <Truck className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
                          </div>
                          <h3
                            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-base sm:text-lg lg:text-xl"
                            style={{ fontWeight: '700' }}
                          >
                            Delivery Address
                          </h3>
                        </div>
                        <div className='p-3 sm:p-4 lg:p-5 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3'>
                          <MapPin className='w-4 h-4 sm:w-5 sm:h-5 text-[#f63a9e] mt-0.5 flex-shrink-0' />
                          <p
                            className='text-gray-900 text-sm sm:text-base break-words'
                            style={{ fontWeight: '600' }}
                          >
                            {formData.address}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.button
                      onClick={() => setCurrentStep(1)}
                      className='w-full p-4 text-[#f63a9e] hover:bg-[#f63a9e]/5 rounded-xl transition-all flex items-center justify-center gap-2'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span style={{ fontWeight: '600' }}>
                        Need to make changes?
                      </span>
                    </motion.button>
                  </div>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && (
                  <div className='space-y-6'>
                    <motion.div
                      className='p-8 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border-2 border-gray-200'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className='text-center mb-6'>
                        <div className='inline-flex items-center gap-3 mb-4'>
                          <Lock className='w-6 h-6 text-gray-600' />
                          <h4
                            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                            style={{ fontSize: '18px', fontWeight: '700' }}
                          >
                            Secure Payment via Stripe
                          </h4>
                        </div>
                        <p className='text-gray-600 text-sm'>
                          Your payment is encrypted and processed securely by
                          our trusted partner
                        </p>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {[
                          {
                            icon: Shield,
                            label: 'Encrypted',
                            color: 'from-green-500 to-emerald-500',
                          },
                          {
                            icon: Lock,
                            label: 'PCI DSS',
                            color: 'from-blue-500 to-indigo-500',
                          },
                          {
                            icon: Zap,
                            label: 'Instant',
                            color: 'from-orange-500 to-red-500',
                          },
                        ].map((badge, index) => {
                          const BadgeIcon = badge.icon;
                          return (
                            <motion.div
                              key={badge.label}
                              className='text-center p-4 bg-white rounded-xl'
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + index * 0.1 }}
                            >
                              <div
                                className={cn(
                                  'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-2',
                                  badge.color
                                )}
                              >
                                <BadgeIcon className='w-6 h-6 text-white' />
                              </div>
                              <span
                                className='text-xs text-gray-600'
                                style={{ fontWeight: '600' }}
                              >
                                {badge.label}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Video Permission Option - Step 3 Only */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className='mb-6'
                  >
                    <div className='p-5 sm:p-6 bg-gradient-to-br from-[#f63a9e]/5 to-purple-50 rounded-2xl border-2 border-[#f63a9e]/20 relative overflow-hidden'>
                      {/* Animated background decoration */}
                      <motion.div
                        className='absolute top-0 right-0 w-32 h-32 bg-[#f63a9e]/10 rounded-full blur-3xl'
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />

                      <div className='relative z-10'>
                        {/* Header */}
                        <div className='flex items-start gap-4 mb-4'>
                          <motion.div
                            className='w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f63a9e] to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg'
                            animate={{
                              rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <Video className='w-7 h-7 text-white' />
                          </motion.div>

                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <h3
                                className='text-gray-900 text-lg sm:text-xl'
                                style={{ fontWeight: '700' }}
                              >
                                Behind-the-Scenes Video
                              </h3>
                              <Sparkles className='w-5 h-5 text-[#f63a9e]' />
                            </div>
                            <p className='text-gray-600 text-sm'>
                              Let us capture your prints being crafted into shareable content! 🎥✨
                            </p>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <motion.label
                          className='flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#f63a9e]/50 cursor-pointer transition-all group'
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className='relative flex-shrink-0 pt-1'>
                            <input
                              type='checkbox'
                              checked={formData.videoPermission}
                              onChange={e =>
                                setFormData({
                                  ...formData,
                                  videoPermission: e.target.checked,
                                })
                              }
                              className='w-6 h-6 sm:w-5 sm:h-5 rounded-md border-2 border-gray-300 text-[#f63a9e] focus:ring-[#f63a9e] focus:ring-offset-0 cursor-pointer transition-all'
                            />
                          </div>

                          <div className='flex-1'>
                            <p className='text-gray-900 font-semibold mb-2'>
                              Yes, film my order journey! {formData.videoPermission && '🎬'}
                            </p>
                            <p className='text-gray-600 text-sm leading-relaxed mb-3'>
                              We'll create a behind-the-scenes video of your prints being made — perfect for sharing on social media or keeping as a memory! 📱✨
                            </p>

                            {/* Feature highlights */}
                            <div className='flex flex-wrap gap-2'>
                              {[
                                { icon: '📸', label: 'Social Ready' },
                                { icon: '🎨', label: 'Crafting Process' },
                                { icon: '✨', label: 'Shareable Content' },
                                { icon: '📱', label: 'Instagram Ready' },
                              ].map((feature, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                    formData.videoPermission
                                      ? 'bg-[#f63a9e] text-white shadow-md'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  <span>{feature.icon}</span>
                                  {feature.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.label>

                        {/* Note */}
                        <p className='text-xs text-gray-500 mt-3 pl-1'>
                          💡 We'll send the video to {formData.email || 'your email'} — perfect for posting on your socials! 📲
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons - Inside Container */}
                <div className='pt-4 sm:pt-6 border-t border-gray-200 mt-6 sm:mt-8'>
                  <div className='flex gap-2 sm:gap-4'>
                    {currentStep > 1 && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className='flex-1'
                      >
                        <Button
                          onClick={handleBack}
                          variant='outline'
                          className='w-full h-12 sm:h-14 lg:h-16 rounded-xl sm:rounded-2xl border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm sm:text-base shadow-sm'
                          style={{ fontWeight: '600' }}
                        >
                          <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2' />
                          Back
                        </Button>
                      </motion.div>
                    )}

                    {currentStep < 4 ? (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={currentStep === 1 ? 'w-full' : 'flex-1'}
                      >
                        <Button
                          onClick={handleNext}
                          disabled={
                            (currentStep === 1 && !isStep1Valid) ||
                            (currentStep === 2 && !isStep2Valid)
                          }
                          className='w-full h-12 sm:h-14 lg:h-16 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base shadow-xl bg-[#f63a9e] hover:bg-[#e02d8d] disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                          style={{ fontWeight: '700' }}
                        >
                          Continue
                          <ArrowRight className='w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2' />
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                        className='flex-1'
                      >
                        <Button
                          onClick={handleCheckout}
                          disabled={isProcessing}
                          className='w-full h-12 sm:h-14 lg:h-16 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl sm:rounded-2xl shadow-2xl shadow-[#f63a9e]/40 text-sm sm:text-base relative overflow-hidden group transition-all disabled:opacity-70 disabled:cursor-not-allowed'
                          style={{ fontWeight: '700' }}
                        >
                          {!isProcessing && (
                            <motion.div
                              className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0'
                              animate={{ x: ['-200%', '200%'] }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                            />
                          )}
                          <span className='relative z-10 flex items-center justify-center'>
                            {isProcessing ? (
                              <>
                                <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className='w-5 h-5 mr-2' />
                                Proceed to Pay · £{total.toFixed(2)}
                              </>
                            )}
                          </span>
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Side - Order Summary */}
          <motion.div
            className='lg:sticky lg:top-8'
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className='bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden'>
              {/* Mobile collapsible toggle */}
              <button
                className='lg:hidden w-full flex items-center justify-between p-4 sm:p-5'
                onClick={() => setSummaryOpen(v => !v)}
              >
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-xl bg-[#f63a9e] flex items-center justify-center'>
                    <ShoppingBag className='w-4 h-4 text-white' />
                  </div>
                  <div className='text-left'>
                    <p className='font-semibold text-gray-900 text-sm'>Order Summary</p>
                    <p className='text-xs text-gray-500'>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · £{total.toFixed(2)}</p>
                  </div>
                </div>
                {summaryOpen ? <ChevronUp className='w-5 h-5 text-gray-400' /> : <ChevronDown className='w-5 h-5 text-gray-400' />}
              </button>

              {/* Summary body — always visible on desktop, collapsible on mobile */}
              <div className={cn('p-4 sm:p-6', summaryOpen ? 'block' : 'hidden lg:block')}>
                {/* Header */}
                <div className='hidden lg:flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
                  <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#f63a9e] flex items-center justify-center'>
                    <ShoppingBag className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                  </div>
                  <div>
                    <h2
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-lg sm:text-xl"
                      style={{ fontWeight: '700' }}
                    >
                      Order Summary
                    </h2>
                    <p className='text-gray-500 text-xs sm:text-sm'>
                      {cartItems.length}{' '}
                      {cartItems.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {/* Cart Items - Compact */}
                <div className='space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto pr-1 sm:pr-2'>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className='flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className='relative flex-shrink-0'>
                        <img
                          src={item.image}
                          alt={item.name}
                          className='w-16 h-16 rounded-lg object-cover'
                        />
                        <div
                          className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#f63a9e] text-white flex items-center justify-center text-xs'
                          style={{ fontWeight: '700' }}
                        >
                          {item.quantity}
                        </div>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h4
                          className='text-gray-900 mb-1 truncate text-sm'
                          style={{ fontWeight: '600' }}
                        >
                          {item.name}
                        </h4>
                        <p className='text-gray-500 text-xs mb-1'>
                          {item.size}
                        </p>
                        <span
                          className='text-[#f63a9e] text-sm'
                          style={{ fontWeight: '700' }}
                        >
                          £{item.price.toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Price Breakdown - Compact */}
                <div className='space-y-3 pt-4 border-t border-gray-200 mb-4'>
                  <div className='flex justify-between items-center text-gray-600 text-sm'>
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: '600' }}>
                      £{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center text-gray-600 text-sm'>
                    <span className='flex items-center gap-1'>
                      <Truck className='w-3 h-3' />
                      Delivery:
                    </span>
                    <div className='text-right'>
                      <span style={{ fontWeight: '600' }}>
                        £{deliveryFee.toFixed(2)}
                      </span>
                      <div className='text-xs text-gray-500 mt-0.5'>
                        Est. {getEstimatedDays()}
                      </div>
                    </div>
                  </div>
                  {discount > 0 && (
                    <div className='flex justify-between items-center text-green-600 text-sm'>
                      <span className='flex items-center gap-1'>
                        <Tag className='w-3 h-3' />
                        Promo{appliedPromoCode ? ` (${appliedPromoCode})` : ''}:
                      </span>
                      <span style={{ fontWeight: '600' }}>
                        -£{discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className='pt-3 border-t border-gray-200'>
                    <div className='flex justify-between items-center p-4 bg-gradient-to-br from-[#f63a9e]/10 to-purple-50 rounded-xl'>
                      <span
                        className='text-gray-900'
                        style={{ fontWeight: '700' }}
                      >
                        Total:
                      </span>
                      <div className='text-right'>
                        <div
                          className='text-[#f63a9e]'
                          style={{
                            fontWeight: '700',
                            fontSize: '24px',
                            lineHeight: '1',
                          }}
                        >
                          £{total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges - Compact */}
                <div className='grid grid-cols-2 gap-2 mb-4'>
                  <div className='p-3 bg-green-50 rounded-lg border border-green-200 text-center'>
                    <div className='w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-1'>
                      <Check className='w-4 h-4 text-white' />
                    </div>
                    <p
                      className='text-xs text-green-800'
                      style={{ fontWeight: '600' }}
                    >
                      Free Returns
                    </p>
                  </div>
                  <div className='p-3 bg-blue-50 rounded-lg border border-blue-200 text-center'>
                    <div className='w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-1'>
                      <Star className='w-4 h-4 text-white' />
                    </div>
                    <p
                      className='text-xs text-blue-800'
                      style={{ fontWeight: '600' }}
                    >
                      Premium Quality
                    </p>
                  </div>
                </div>

                {/* Privacy Notice */}
                {currentStep === 1 && (
                  <motion.div
                    className='p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className='flex items-start gap-3'>
                      <div className='w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0'>
                        <Shield className='w-4 h-4 text-white' />
                      </div>
                      <div>
                        <h4
                          className='text-gray-900 mb-1 text-sm'
                          style={{ fontWeight: '700' }}
                        >
                          Your privacy matters
                        </h4>
                        <p className='text-gray-600 text-xs'>
                          We use industry-standard encryption and never share
                          your personal information.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
