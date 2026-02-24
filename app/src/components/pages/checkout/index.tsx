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
  Video,
  ShoppingBag,
  Shield,
  Lock,
  Star,
  Truck,
  Tag,
  Zap,
  Loader2,
} from 'lucide-react';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
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
  const [searchedAddresses, setSearchedAddresses] = useState<string[]>([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Validation functions
  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }));
      return false;
    }
    if (name.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
      return false;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      setErrors(prev => ({ ...prev, name: 'Name can only contain letters, spaces, hyphens, and apostrophes' }));
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
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
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
    const ukPhoneRegex = /^(?:(?:\+44\s?|0)(?:7\d{3}|1\d{3,4}|2\d{1,2}|3\d{2,3})\s?\d{3,4}\s?\d{3,4}|(?:\+44|0)7\d{9})$/;
    const cleanPhoneRegex = /^(?:\+44|0)(?:7\d{9}|[123]\d{8,9})$/;
    
    if (!ukPhoneRegex.test(phone) && !cleanPhoneRegex.test(cleanPhone)) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid UK phone number (e.g., 07123 456789 or 020 1234 5678)' }));
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
    
    try {
      // Normalize postcode: remove extra spaces, convert to uppercase
      let postcode = formData.postcode.trim().toUpperCase().replace(/\s+/g, '');
      
      // Add space before last 3 characters if not present (standard UK format)
      if (postcode.length >= 5 && !postcode.includes(' ')) {
        postcode = postcode.slice(0, -3) + ' ' + postcode.slice(-3);
      }
      
      // Try exact postcode first
      let response = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
      );

      // If exact match fails, try autocomplete/partial match
      if (!response.ok && response.status === 404) {
        const partialPostcode = postcode.replace(/\s+/g, '');
        const autocompleteResponse = await fetch(
          `https://api.postcodes.io/postcodes/${encodeURIComponent(partialPostcode)}/autocomplete`
        );
        
        if (autocompleteResponse.ok) {
          const autocompleteData = await autocompleteResponse.json();
          if (autocompleteData.status === 200 && autocompleteData.result && autocompleteData.result.length > 0) {
            // Use the first suggested postcode
            const suggestedPostcode = autocompleteData.result[0];
            response = await fetch(
              `https://api.postcodes.io/postcodes/${encodeURIComponent(suggestedPostcode)}`
            );
            
            if (response.ok) {
              toast.info(`Using closest match: ${suggestedPostcode}`);
            }
          }
        }
      }

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Postcode not found. Please check and try again.');
          setSearchedAddresses([]);
          setShowAddresses(true);
          return;
        }
        throw new Error('Failed to search postcode');
      }

      const data = await response.json();

      if (data.status === 200 && data.result) {
        const result = data.result;
        
        // Build comprehensive address list
        const addresses: string[] = [];
        
        // Primary address
        addresses.push(
          `${result.postcode}, ${result.admin_district || result.parish || ''}, ${result.region}, ${result.country}`
        );
        
        // Add ward/parish if available
        if (result.parish && result.parish !== result.admin_district) {
          addresses.push(
            `${result.postcode}, ${result.parish}, ${result.admin_district}, ${result.region}`
          );
        }
        
        // Add specific locality if available
        if (result.admin_ward) {
          addresses.push(
            `${result.postcode}, ${result.admin_ward}, ${result.admin_district}, ${result.region}`
          );
        }

        // Try to get nearby postcodes for more options
        try {
          const nearbyResponse = await fetch(
            `https://api.postcodes.io/postcodes?lon=${result.longitude}&lat=${result.latitude}&radius=500&limit=5`
          );
          
          if (nearbyResponse.ok) {
            const nearbyData = await nearbyResponse.json();
            if (nearbyData.status === 200 && nearbyData.result) {
              nearbyData.result.forEach((nearby: any) => {
                if (nearby.postcode !== result.postcode) {
                  addresses.push(
                    `${nearby.postcode}, ${nearby.admin_district}, ${nearby.region}`
                  );
                }
              });
            }
          }
        } catch (e) {
          // Ignore nearby search errors
          console.warn('Nearby postcode search failed:', e);
        }

        // Remove duplicates
        const uniqueAddresses = [...new Set(addresses)];
        
        setSearchedAddresses(uniqueAddresses);
        setShowAddresses(true);
        toast.success(`Found ${uniqueAddresses.length} address${uniqueAddresses.length > 1 ? 'es' : ''}`);
      } else {
        toast.error('No address found for this postcode');
        setSearchedAddresses([]);
        setShowAddresses(true);
      }
    } catch (error) {
      console.error('Postcode search error:', error);
      toast.error('Failed to search postcode. Please try again.');
      setSearchedAddresses([]);
      setShowAddresses(true);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const selectAddress = (address: string) => {
    setFormData({ ...formData, address });
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/checkout`, {
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
      });

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

  const isStep1Valid = formData.name && formData.phone && formData.email && !errors.name && !errors.phone && !errors.email;
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
      </div>

      {/* Main Content */}
      <div className='relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12'>
        <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start'>
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
                                if (field.id === 'name') validateName(field.value);
                                if (field.id === 'email') validateEmail(field.value);
                                if (field.id === 'phone') validateUKPhone(field.value);
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
                              <span className='font-semibold'>⚠</span> {hasError}
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
                            className='h-16 px-8 bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-2xl shadow-lg disabled:opacity-50'
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
                          <div className='space-y-3 max-h-96 overflow-y-auto pr-2'>
                            {searchedAddresses.map((address, index) => (
                              <motion.button
                                key={index}
                                onClick={() => selectAddress(address)}
                                className={cn(
                                  'w-full text-left p-6 rounded-2xl border-2 transition-all',
                                  formData.address === address
                                    ? 'border-[#f63a9e] bg-gradient-to-br from-[#f63a9e]/5 to-purple-50 shadow-lg'
                                    : 'border-gray-200 bg-white hover:border-[#f63a9e]/50 hover:shadow-md'
                                )}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-start gap-3'>
                                    <MapPin
                                      className={cn(
                                        'w-5 h-5 mt-0.5',
                                        formData.address === address
                                          ? 'text-[#f63a9e]'
                                          : 'text-gray-400'
                                      )}
                                    />
                                    <span className='text-gray-900'>
                                      {address}
                                    </span>
                                  </div>
                                  <AnimatePresence>
                                    {formData.address === address && (
                                      <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, rotate: 180 }}
                                        className='w-10 h-10 rounded-full bg-[#f63a9e] flex items-center justify-center'
                                      >
                                        <Check className='w-6 h-6 text-white' />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {showAddresses && searchedAddresses.length === 0 && !isSearchingAddress && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className='p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl text-center'
                        >
                          <p
                            className='text-red-700 text-sm sm:text-base'
                            style={{ fontWeight: '600' }}
                          >
                            No addresses found for this postcode. Please check and try again.
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

                    {/* Video Consent - Compact */}
                    <motion.div
                      className='p-3 sm:p-4 lg:p-5 bg-gradient-to-br from-orange-50 to-rose-50 rounded-lg sm:rounded-xl border-2 border-orange-100'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
                        <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
                          <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center flex-shrink-0'>
                            <Video className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                          </div>
                          <div className='min-w-0'>
                            <h4
                              className='text-gray-900 text-xs sm:text-sm'
                              style={{ fontWeight: '700' }}
                            >
                              Order Preparation Video
                            </h4>
                            <p className='text-gray-600 text-xs'>
                              Get a behind-the-scenes video
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2 w-full sm:w-auto'>
                          <button
                            onClick={() =>
                              setFormData({
                                ...formData,
                                videoPermission: true,
                              })
                            }
                            className={cn(
                              'flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm',
                              formData.videoPermission
                                ? 'bg-[#f63a9e] text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#f63a9e]/50'
                            )}
                            style={{ fontWeight: '600' }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() =>
                              setFormData({
                                ...formData,
                                videoPermission: false,
                              })
                            }
                            className={cn(
                              'flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm',
                              !formData.videoPermission
                                ? 'bg-gray-700 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                            )}
                            style={{ fontWeight: '600' }}
                          >
                            No
                          </button>
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

                      <div className='grid grid-cols-3 gap-4'>
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
                                Complete Purchase ${total.toFixed(2)}
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
            <div className='bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-100'>
              <div>
                {/* Header */}
                <div className='flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
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
                          ${item.price.toFixed(2)}
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
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center text-gray-600 text-sm'>
                    <span className='flex items-center gap-1'>
                      <Truck className='w-3 h-3' />
                      Delivery:
                    </span>
                    <div className='text-right'>
                      <span style={{ fontWeight: '600' }}>
                        ${deliveryFee.toFixed(2)}
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
                      <span style={{ fontWeight: '600' }}>-${discount.toFixed(2)}</span>
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
                          ${total.toFixed(2)}
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
