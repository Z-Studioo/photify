
'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  Sparkles,
  Users,
  Headphones,
  MessageCircle,
  Instagram,
  Facebook
} from 'lucide-react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }, 5000);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to send message. Please try again.');
      console.error('Contact form error:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      detail: 'support@photify.co',
      description: 'Send us an email anytime',
      link: 'mailto:support@photify.co'
    },
    {
      icon: Phone,
      title: 'Call Us',
      detail: '07438 940960',
      description: 'Also available on WhatsApp · Mon-Fri 8am–6pm GMT',
      link: 'https://wa.me/447438940960'
    },
    {
      icon: MapPin,
      title: 'Our Location',
      detail: 'London, United Kingdom',
      description: 'Photify Limited · Company No: 16119644',
      link: 'https://maps.google.com/?q=London,UK'
    }
  ];

  const faqs = [
    {
      question: 'How do I place an order for photo prints?',
      answer: 'Click on "Create Yours", which will take you to our editor where you can upload your image, preview a mockup, and confirm your design. Once you\'re satisfied, simply add the item to your cart and proceed to checkout.'
    },
    {
      question: 'Which file formats do you accept for uploads?',
      answer: 'We currently accept PNG, JPEG, and HEIC files.'
    },
    {
      question: 'What sizes and customization options do you offer?',
      answer: 'Some of our products allow for customizable sizes. When you upload your image and view the mockup, you\'ll see which size options are available for that specific product.'
    },
    {
      question: 'How long does shipping take, and do you offer express delivery?',
      answer: 'Our standard delivery time is 6 working days. If you need your prints sooner, we offer an express delivery option that takes 3 working days — you can select this at checkout.'
    },
    {
      question: 'What if my print arrives damaged or doesn\'t match my design?',
      answer: 'We do not accept returns, but we will offer a free reprint if your print is damaged or if it differs from the design you created.'
    }
  ];

  const TikTokIcon = () => (
    <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
      <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z' />
    </svg>
  );

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', link: 'https://www.instagram.com/photify.co', color: 'hover:text-pink-600' },
    { icon: Facebook, label: 'Facebook', link: 'https://www.facebook.com/@photifyprints', color: 'hover:text-blue-600' },
    { icon: TikTokIcon, label: 'TikTok', link: 'https://www.tiktok.com/@photify.co', color: 'hover:text-gray-900' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-[#FFF5FB]">
          {/* Animated Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating Circles */}
            <motion.div 
              className="absolute top-20 right-[10%] w-32 h-32 border-4 border-[#f63a9e]/20 rounded-full"
              animate={{ 
                y: [0, -30, 0],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute bottom-32 left-[8%] w-24 h-24 border-4 border-[#f63a9e]/10 rounded-full"
              animate={{ 
                y: [0, 40, 0],
                rotate: [360, 180, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Floating Icons */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${10 + (i * 12)}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0.2, 0.5, 0.2],
                  rotate: [0, 15, -15, 0],
                }}
                transition={{
                  duration: 4 + (i % 4),
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {i % 4 === 0 && <MessageSquare className="w-7 h-7 text-[#f63a9e]/30" />}
                {i % 4 === 1 && <Mail className="w-6 h-6 text-[#f63a9e]/30" />}
                {i % 4 === 2 && <Phone className="w-6 h-6 text-[#f63a9e]/30" />}
                {i % 4 === 3 && <Headphones className="w-7 h-7 text-[#f63a9e]/30" />}
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-8 py-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  duration: 0.8,
                  bounce: 0.5 
                }}
                className="inline-flex items-center justify-center relative mb-8"
              >
                <motion.div
                  className="w-32 h-32 rounded-full bg-[#f63a9e] flex items-center justify-center shadow-2xl"
                  animate={{ 
                    boxShadow: [
                      "0 20px 60px rgba(246, 58, 158, 0.3)",
                      "0 20px 80px rgba(246, 58, 158, 0.5)",
                      "0 20px 60px rgba(246, 58, 158, 0.3)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MessageCircle className="w-16 h-16 text-white" />
                </motion.div>
                
                {/* Orbiting Icons */}
                {[Mail, Phone, Users].map((Icon, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    animate={{
                      rotate: [0 + (i * 120), 360 + (i * 120)],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <div style={{ transform: 'translate(-50%, -50%) translateY(-80px)' }}>
                      <Icon className="w-7 h-7 text-[#f63a9e]" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              
              <h1 className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4" style={{ fontSize: '40px', fontWeight: '700', lineHeight: '1.2' }}>
                Get in Touch
              </h1>
              
              <p className="text-gray-600 mb-6 text-lg">
                Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 justify-center mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-lg"
                >
                  <Clock className="w-6 h-6 text-[#f63a9e]" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500" style={{ fontWeight: '600' }}>Response Time</p>
                    <p className="text-gray-900" style={{ fontWeight: '700' }}>Under 24hrs</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-lg"
                >
                  <Users className="w-6 h-6 text-[#f63a9e]" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500" style={{ fontWeight: '600' }}>Support Team</p>
                    <p className="text-gray-900" style={{ fontWeight: '700' }}>24/7 Available</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-lg"
                >
                  <Headphones className="w-6 h-6 text-[#f63a9e]" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500" style={{ fontWeight: '600' }}>Customer Satisfaction</p>
                    <p className="text-gray-900" style={{ fontWeight: '700' }}>98% Rating</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#f63a9e] flex items-center justify-center shadow-lg">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900" style={{ fontSize: '24px', fontWeight: '700' }}>
                    Send us a Message
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
                    >
                      <p className="text-red-600 text-sm" style={{ fontWeight: '600' }}>
                        {error}
                      </p>
                    </motion.div>
                  )}

                  {/* Success Message */}
                  {isSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 border-2 border-green-200 rounded-xl p-4"
                    >
                      <p className="text-green-600 text-sm" style={{ fontWeight: '600' }}>
                        ✓ Thank you! We've received your message and will get back to you soon.
                      </p>
                    </motion.div>
                  )}

                  {/* Name Input */}
                  <div>
                    <label className="block text-gray-700 mb-2" style={{ fontWeight: '600' }}>
                      Your Name
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="h-[50px] border-2 border-gray-200 focus:border-[#f63a9e] focus-visible:ring-0"
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-gray-700 mb-2" style={{ fontWeight: '600' }}>
                      Email Address
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className="h-[50px] border-2 border-gray-200 focus:border-[#f63a9e] focus-visible:ring-0"
                    />
                  </div>

                  {/* Subject Input */}
                  <div>
                    <label className="block text-gray-700 mb-2" style={{ fontWeight: '600' }}>
                      Subject
                    </label>
                    <Input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      required
                      className="h-[50px] border-2 border-gray-200 focus:border-[#f63a9e] focus-visible:ring-0"
                    />
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <label className="block text-gray-700 mb-2" style={{ fontWeight: '600' }}>
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      required
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#f63a9e] focus:outline-none focus:ring-0 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || isSubmitted}
                    className={`w-full h-[56px] rounded-xl shadow-lg transition-all ${
                      isSubmitted 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-[#f63a9e] hover:bg-[#e02d8d]'
                    }`}
                    style={{ fontWeight: '700' }}
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-6 h-6" />
                      </motion.div>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 mr-2" />
                        Message Sent!
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Right Column - Contact Info & FAQs */}
            <div className="space-y-8">
              {/* Contact Information Cards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6" style={{ fontSize: '24px', fontWeight: '700' }}>
                  Contact Information
                </h3>
                
                {contactInfo.map((info, index) => (
                  <motion.a
                    key={index}
                    href={info.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 8 }}
                    className="block bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-[#f63a9e] hover:bg-[#FFF5FB] transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#f63a9e] flex items-center justify-center flex-shrink-0 shadow-md">
                        {<info.icon className="w-7 h-7 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1" style={{ fontWeight: '700', fontSize: '18px' }}>
                          {info.title}
                        </h4>
                        <p className="text-[#f63a9e] mb-2" style={{ fontWeight: '600' }}>
                          {info.detail}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-[#FFF5FB] rounded-3xl p-8 border-2 border-[#f63a9e]/30 shadow-xl"
              >
                <h3 className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6 text-center" style={{ fontSize: '20px', fontWeight: '700' }}>
                  Follow Us
                </h3>
                <div className="flex justify-center gap-4">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg transition-colors ${social.color}`}
                    >
                      <social.icon className="w-6 h-6" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              {/* FAQs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100"
              >
                <h3 className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6" style={{ fontSize: '20px', fontWeight: '700' }}>
                  Quick Answers
                </h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                      <h4 className="text-gray-900 mb-2" style={{ fontWeight: '600' }}>
                        {faq.question}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

