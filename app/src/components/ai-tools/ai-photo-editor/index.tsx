import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Send,
  Wand2,
  Download,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  ArrowRight,
  ArrowLeft,
  Check,
  MessageSquare,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

const onboardingSteps = [
  {
    title: 'Welcome to AI Photo Editor',
    description:
      'Transform your photos with the power of AI. Edit, enhance, and perfect your images through simple conversations.',
    icon: Wand2,
    image:
      'https://images.unsplash.com/photo-1637519290541-0a12b3185485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGVkaXRpbmclMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjA2ODUxNzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    title: 'Upload Your Photo',
    description:
      'Start by uploading the photo you want to edit. Supports JPG, PNG, and HEIC formats up to 10MB.',
    icon: Upload,
    image:
      'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGxvYWQlMjBwaG90b3xlbnwxfHx8fDE3NjA5NjE3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    title: 'Chat to Edit',
    description:
      'Simply describe what you want to change. Say things like "Make it brighter", "Remove the background", or "Add a vintage filter".',
    icon: MessageSquare,
    image:
      'https://images.unsplash.com/photo-1676911809746-7bf978a61a8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMGNoYXQlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzYwOTYxNzM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    title: 'Download & Print',
    description:
      "Once you're happy with your edits, download your enhanced photo and order beautiful prints for your walls.",
    icon: Download,
    image:
      'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const examplePrompts = [
  'Make it brighter and more vibrant',
  'Remove the background',
  'Add a vintage film effect',
  'Enhance the colors',
  'Make it black and white',
  'Increase sharpness',
  'Blur the background',
  'Add warm tones',
];

// Template images for background
const templateImages = [
  'https://images.unsplash.com/photo-1637519290541-0a12b3185485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGVkaXRpbmclMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjA2ODUxNzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGxvYWQlMjBwaG90b3xlbnwxfHx8fDE3NjA5NjE3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFtZWQlMjBwaG90byUyMHdhbGwlMjBhcnR8ZW58MXx8fHwxNzYwNTMxMjY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1676911809746-7bf978a61a8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMGNoYXQlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzYwOTYxNzM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1686644472082-75dd48820a5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjB3YWxsJTIwYXJ0fGVufDF8fHx8MTc2MDcwNTA4NHww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1678117699040-b89738399ca7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3YWxsJTIwYXJ0fGVufDF8fHx8MTc2MDcwNDYyOHww&ixlib=rb-4.1.0&q=80&w=1080',
];

export function AIPhotoEditorPage() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        setEditedImage(imageUrl);

        const welcomeMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content:
            "Perfect! I've loaded your photo. Tell me what you'd like to edit, or use the quick actions below to get started!",
          timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (prompt?: string) => {
    const messageText = prompt || inputMessage;
    if (!messageText.trim() || !uploadedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    setTimeout(() => {
      const aiResponses = [
        '✨ Brightness and vibrancy enhanced! Your photo now has better exposure and more vivid colors.',
        '🎯 Background removed successfully! Your subject now has a clean, transparent background.',
        '📸 Vintage film effect applied! Your photo has that classic, nostalgic look with warm tones.',
        '🎨 Colors enhanced! Saturation boosted and white balance adjusted for a professional look.',
        '⚫ Converted to black and white with beautiful tonal range and contrast.',
        '🔍 Sharpness increased! Details are now more crisp and defined.',
        '🌟 Background blur applied! Your subject now stands out with beautiful depth.',
        '🔥 Warm tones added! Your photo now has a cozy, inviting atmosphere.',
      ];

      const randomResponse =
        aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
        imageUrl: editedImage || undefined,
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 2000);
  };

  const handleNextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <>
      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className='max-w-2xl p-0 overflow-hidden border-2 border-gray-100'>
          <DialogTitle className='sr-only'>Photo Editor Tutorial</DialogTitle>
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className='relative'
            >
              {/* Image Header */}
              <div className='relative h-64 overflow-hidden bg-gray-100'>
                <ImageWithFallback
                  src={onboardingSteps[currentStep].image}
                  alt={onboardingSteps[currentStep].title}
                  className='w-full h-full object-cover'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />

                <div className='absolute bottom-6 left-6'>
                  <div className='w-16 h-16 rounded-2xl bg-[#f63a9e] flex items-center justify-center mb-4 shadow-xl'>
                    {React.createElement(onboardingSteps[currentStep].icon, {
                      className: 'w-8 h-8 text-white',
                    })}
                  </div>
                </div>

                {/* Step Indicator */}
                <div className='absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full'>
                  <span className='text-sm' style={{ fontWeight: '700' }}>
                    Step {currentStep + 1} of {onboardingSteps.length}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className='p-8'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{ fontSize: '28px', fontWeight: '700' }}
                >
                  {onboardingSteps[currentStep].title}
                </h2>
                <p className='text-gray-600 text-lg mb-8'>
                  {onboardingSteps[currentStep].description}
                </p>

                {/* Progress Dots */}
                <div className='flex items-center gap-2 mb-8'>
                  {onboardingSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'w-8 bg-[#f63a9e]'
                          : index < currentStep
                            ? 'w-2 bg-[#f63a9e]/50'
                            : 'w-2 bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className='flex items-center justify-between'>
                  <Button
                    onClick={handleSkipOnboarding}
                    variant='ghost'
                    className='text-gray-500 hover:text-gray-700'
                    style={{ fontWeight: '600' }}
                  >
                    Skip Tutorial
                  </Button>

                  <div className='flex items-center gap-3'>
                    {currentStep > 0 && (
                      <Button
                        onClick={handlePrevStep}
                        variant='outline'
                        className='border-2 border-gray-200 hover:border-[#f63a9e] hover:bg-[#FFF5FB] rounded-xl h-[50px]'
                        style={{ fontWeight: '700' }}
                      >
                        <ArrowLeft className='w-5 h-5 mr-2' />
                        Back
                      </Button>
                    )}

                    <Button
                      onClick={handleNextStep}
                      className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[50px] px-8'
                      style={{ fontWeight: '700' }}
                    >
                      {currentStep === onboardingSteps.length - 1 ? (
                        <>
                          Get Started
                          <Check className='w-5 h-5 ml-2' />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className='w-5 h-5 ml-2' />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {!uploadedImage ? (
        /* Upload State - Full Screen Immersive */
        <div className="h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 font-['Mona_Sans',_sans-serif] flex items-center justify-center">
          {/* Background Grid with Template Thumbnails */}
          <div className='absolute inset-0 overflow-hidden opacity-8'>
            <div className='grid grid-cols-8 gap-4 p-4 -rotate-6 scale-110'>
              {[
                ...templateImages,
                ...templateImages,
                ...templateImages,
                ...templateImages,
                ...templateImages,
              ].map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: (index % 8) * 0.03 }}
                  className='aspect-[3/4] rounded-lg overflow-hidden shadow-xl'
                >
                  <ImageWithFallback
                    src={img}
                    alt='Template'
                    className='w-full h-full object-cover'
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Decorative gradient orbs */}
          <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            <div className='absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl' />
            <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl' />
          </div>

          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className='absolute top-6 left-6 z-30 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200/50'
          >
            <X className='w-5 h-5 text-gray-700' />
          </motion.button>

          {/* Left Wavy Border */}
          <svg
            className='absolute left-0 top-0 h-full w-16 z-10 opacity-25'
            viewBox='0 0 100 800'
            preserveAspectRatio='none'
          >
            <path
              d='M 0,0 Q 40,100 25,200 T 35,400 Q 50,500 30,600 T 25,800 L 0,800 Z'
              fill='white'
            />
          </svg>

          {/* Right Wavy Border */}
          <svg
            className='absolute right-0 top-0 h-full w-16 z-10 opacity-25'
            viewBox='0 0 100 800'
            preserveAspectRatio='none'
          >
            <path
              d='M 100,0 Q 60,100 75,200 T 65,400 Q 50,500 70,600 T 75,800 L 100,800 Z'
              fill='white'
            />
          </svg>

          {/* Main Content - Vertical Centered Layout */}
          <div className='relative z-20 w-full max-w-3xl px-6'>
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className='text-center mb-8'
            >
              <div className='inline-flex items-center justify-center gap-3 mb-3'>
                <Wand2 className='w-10 h-10 text-[#f63a9e]' />
              </div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] bg-gradient-to-r from-[#f63a9e] to-purple-600 bg-clip-text text-transparent mb-2"
                style={{
                  fontSize: '44px',
                  lineHeight: '1.1',
                  fontWeight: '700',
                }}
              >
                Edit Photos with AI
              </h1>
              <p
                className='text-gray-600 max-w-xl mx-auto'
                style={{ fontSize: '15px' }}
              >
                Transform your photos using natural language. Just describe what
                you want, and AI does the rest.
              </p>
            </motion.div>

            {/* Upload Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 mb-6'
            >
              <div className='p-12 text-center'>
                <div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#f63a9e] to-purple-600 rounded-full flex items-center justify-center'>
                  <Upload className='w-10 h-10 text-white' />
                </div>

                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{ fontSize: '24px', fontWeight: '700' }}
                >
                  Upload Your Photo
                </h3>
                <p className='text-gray-600 mb-8 max-w-md mx-auto'>
                  Drag and drop your image here, or click to browse
                </p>

                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleFileUpload}
                  className='hidden'
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-full h-[50px] px-10 shadow-lg'
                  style={{ fontWeight: '700' }}
                >
                  <Upload className='w-5 h-5 mr-2' />
                  Choose File
                </Button>

                <p className='text-gray-500 text-sm mt-6'>
                  Supports JPG, PNG, HEIC • Max 10MB
                </p>
              </div>
            </motion.div>

            {/* Example Prompts Chips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='text-center'
            >
              <p
                className='text-gray-600 text-sm mb-4'
                style={{ fontWeight: '600' }}
              >
                Try commands like:
              </p>
              <div className='flex flex-wrap justify-center gap-2'>
                {examplePrompts.slice(0, 4).map((prompt, i) => (
                  <span
                    key={i}
                    className='px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm border border-gray-200/50 shadow-sm'
                    style={{ fontWeight: '500' }}
                  >
                    &quot;{prompt}&quot;
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* Editor State */
        <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleClose}
            className='fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[#f63a9e] flex items-center justify-center text-gray-600 hover:text-[#f63a9e] transition-all shadow-xl group'
          >
            <X className='w-6 h-6 group-hover:rotate-90 transition-transform' />
          </motion.button>

          <div className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
            {/* Left: Image Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${isFullscreen ? 'w-full' : 'lg:w-3/5'} flex flex-col bg-gray-50 border-r-2 border-gray-100 transition-all`}
            >
              {/* Toolbar */}
              <div className='flex items-center justify-between px-8 py-6 bg-white border-b-2 border-gray-100'>
                <div className='flex items-center gap-4'>
                  <Button
                    onClick={() => {
                      setUploadedImage(null);
                      setEditedImage(null);
                      setMessages([]);
                    }}
                    variant='ghost'
                    className='text-gray-600 hover:text-[#f63a9e] hover:bg-[#FFF5FB] rounded-xl h-[45px]'
                    style={{ fontWeight: '600' }}
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    New Photo
                  </Button>
                </div>

                <div className='flex items-center gap-3'>
                  <Button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    variant='ghost'
                    className='text-gray-600 hover:text-[#f63a9e] hover:bg-[#FFF5FB] rounded-xl w-[45px] h-[45px] p-0'
                  >
                    {isFullscreen ? (
                      <Minimize2 className='w-5 h-5' />
                    ) : (
                      <Maximize2 className='w-5 h-5' />
                    )}
                  </Button>

                  <Button
                    className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[45px] px-6'
                    style={{ fontWeight: '700' }}
                  >
                    <Download className='w-5 h-5 mr-2' />
                    Download
                  </Button>
                </div>
              </div>

              {/* Image Display */}
              <div className='flex-1 flex items-center justify-center p-8 overflow-auto'>
                <div className='relative max-w-full max-h-full'>
                  <img
                    src={editedImage || uploadedImage}
                    alt='Your photo'
                    className='max-w-full max-h-full object-contain rounded-2xl shadow-2xl'
                  />
                </div>
              </div>
            </motion.div>

            {/* Right: Chat Interface */}
            {!isFullscreen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className='lg:w-2/5 flex flex-col bg-white h-screen'
              >
                {/* Chat Header */}
                <div className='px-8 py-6 border-b-2 border-gray-100 bg-[#FFF5FB]'>
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f63a9e] to-purple-600 flex items-center justify-center shadow-lg'>
                      <Wand2 className='w-6 h-6 text-white' />
                    </div>
                    <div>
                      <h3
                        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                        style={{ fontSize: '20px', fontWeight: '700' }}
                      >
                        AI Assistant
                      </h3>
                      <p className='text-gray-600 text-sm'>
                        Describe your edits naturally
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className='flex-1 overflow-y-auto px-8 py-6 space-y-4'>
                  <AnimatePresence>
                    {messages.map(message => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-[#f63a9e] to-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-900 border-2 border-gray-200'
                          } rounded-2xl p-4`}
                        >
                          <p
                            className='text-sm leading-relaxed'
                            style={{ fontWeight: '500' }}
                          >
                            {message.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='flex justify-start'
                    >
                      <div className='bg-gray-100 rounded-2xl p-4 flex items-center gap-3 border-2 border-gray-200'>
                        <Loader2 className='w-5 h-5 text-[#f63a9e] animate-spin' />
                        <span
                          className='text-gray-700 text-sm'
                          style={{ fontWeight: '500' }}
                        >
                          Processing your request...
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Example Prompts */}
                {messages.length <= 2 && !isProcessing && (
                  <div className='px-8 pb-4'>
                    <p
                      className='text-gray-600 text-xs mb-3'
                      style={{
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Suggestions
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {examplePrompts.slice(0, 4).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInputMessage(prompt)}
                          className='px-3 py-2 bg-gray-100 hover:bg-[#FFF5FB] text-gray-700 rounded-xl text-xs transition-all border-2 border-gray-200 hover:border-[#f63a9e]/30'
                          style={{ fontWeight: '600' }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className='px-8 py-6 border-t-2 border-gray-100 bg-white'>
                  <div className='flex gap-3'>
                    <Input
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      onKeyPress={e =>
                        e.key === 'Enter' && !e.shiftKey && handleSendMessage()
                      }
                      placeholder='Describe what you want to edit...'
                      className='flex-1 h-[50px] bg-gray-50 border-2 border-gray-200 focus:border-[#f63a9e] rounded-xl'
                      disabled={isProcessing}
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || isProcessing}
                      className='bg-gradient-to-br from-[#f63a9e] to-purple-600 hover:from-[#e02d8d] hover:to-purple-700 text-white rounded-xl h-[50px] w-[50px] p-0 shadow-lg'
                    >
                      <Send className='w-5 h-5' />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
