import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { track } from '@/lib/analytics';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Instagram,
  Facebook,
  ArrowUpRight,
} from 'lucide-react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setIsSubmitting(false);
      setIsSubmitted(true);

      try {
        track({ name: 'contact_form_submitted', params: {} });
      } catch {
        /* swallow */
      }

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const channels = [
    {
      icon: Mail,
      label: 'Email',
      value: 'support@photify.co',
      hint: 'Replies within one working day',
      href: 'mailto:support@photify.co',
    },
    {
      icon: Phone,
      label: 'Phone & WhatsApp',
      value: '07438 940960',
      hint: 'Mon–Fri · 8am–6pm GMT',
      href: 'https://wa.me/447438940960',
    },
    {
      icon: MapPin,
      label: 'Address',
      value: 'London, United Kingdom',
      hint: 'Photify Limited · Company No. 16119644',
      href: 'https://maps.google.com/?q=London,UK',
    },
  ];

  const faqs = [
    {
      q: 'How do I place an order for photo prints?',
      a: 'Click on "Create Yours", which takes you to our editor. Upload your image, preview a mockup, confirm your design, then add to cart and check out.',
    },
    {
      q: 'Which file formats do you accept for uploads?',
      a: 'We accept PNG, JPEG and HEIC files.',
    },
    {
      q: 'What sizes and customization options do you offer?',
      a: 'Some products allow custom sizes. When you upload your image and view the mockup, the available size options for that product will be shown.',
    },
    {
      q: 'How long does shipping take?',
      a: 'Standard delivery is 6 working days. Express delivery (3 working days) is available at checkout.',
    },
    {
      q: 'What if my print arrives damaged?',
      a: "We don't accept returns, but we offer a free reprint if your print is damaged or differs from the design you created.",
    },
  ];

  const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill='currentColor' viewBox='0 0 24 24'>
      <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z' />
    </svg>
  );

  const socials = [
    {
      icon: Instagram,
      label: 'Instagram',
      href: 'https://www.instagram.com/photify.co',
    },
    {
      icon: Facebook,
      label: 'Facebook',
      href: 'https://www.facebook.com/@photifyprints',
    },
    {
      icon: TikTokIcon,
      label: 'TikTok',
      href: 'https://www.tiktok.com/@photify.co',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      <main className='flex-1'>
        {/* Hero */}
        <div className='border-b border-gray-200'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 pt-20 pb-16'>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className='max-w-2xl'
            >
              <div className='flex items-center gap-2 mb-6'>
                <MessageCircle className='w-4 h-4 text-[#f63a9e]' />
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-gray-500'
                  style={{ fontWeight: 600 }}
                >
                  Get in touch
                </p>
              </div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-5"
                style={{
                  fontSize: 'clamp(36px, 5vw, 52px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.05,
                }}
              >
                We&apos;d love to hear from you.
              </h1>
              <p className='text-gray-600 text-[17px] leading-relaxed mb-6'>
                Whether you have a question about an order, your artwork, or a
                bulk request — drop us a line and someone from the team will
                get back to you within one working day.
              </p>
              <p className='text-sm text-gray-400'>
                Average response time · under 24 hours
              </p>
            </motion.div>
          </div>
        </div>

        {/* Channels strip */}
        <div className='border-b border-gray-200 bg-gray-50/60'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-10'>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-6'>
              {channels.map((c, i) => (
                <a
                  key={i}
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    c.href.startsWith('http') ? 'noopener noreferrer' : undefined
                  }
                  className='group block border-l-2 border-[#f63a9e]/60 pl-4'
                >
                  <p className='text-xs uppercase tracking-[0.14em] text-gray-500 mb-1.5'>
                    {c.label}
                  </p>
                  <p
                    className='text-gray-900 text-[15px] group-hover:text-[#f63a9e] transition-colors'
                    style={{ fontWeight: 600 }}
                  >
                    {c.value}
                  </p>
                  <p className='text-gray-500 text-sm mt-1 leading-relaxed'>
                    {c.hint}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16'>
          <div className='grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16'>
            {/* Form */}
            <div>
              <div className='mb-8'>
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                  style={{ fontWeight: 600 }}
                >
                  Send a message
                </p>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                  }}
                >
                  Tell us a little about your enquiry
                </h2>
                <p className='text-gray-500 text-[15px] leading-relaxed'>
                  We&apos;ll point your message at the right person on the
                  team. All fields below are required.
                </p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-5'>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='border border-red-200 bg-red-50 rounded-lg px-4 py-3'
                  >
                    <p className='text-red-600 text-sm'>{error}</p>
                  </motion.div>
                )}

                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='border border-green-200 bg-green-50 rounded-lg px-4 py-3 flex items-center gap-2'
                  >
                    <CheckCircle2 className='w-4 h-4 text-green-600' />
                    <p className='text-green-700 text-sm'>
                      Thanks — we&apos;ve got your message and will be in
                      touch soon.
                    </p>
                  </motion.div>
                )}

                <div className='grid sm:grid-cols-2 gap-5'>
                  <div>
                    <label
                      htmlFor='name'
                      className='block text-[13px] text-gray-700 mb-1.5'
                      style={{ fontWeight: 500 }}
                    >
                      Your name
                    </label>
                    <Input
                      id='name'
                      type='text'
                      name='name'
                      value={formData.name}
                      onChange={handleChange}
                      placeholder='Jane Doe'
                      required
                      className='h-11 border-gray-300 focus:border-gray-900 focus-visible:ring-0'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='email'
                      className='block text-[13px] text-gray-700 mb-1.5'
                      style={{ fontWeight: 500 }}
                    >
                      Email address
                    </label>
                    <Input
                      id='email'
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleChange}
                      placeholder='you@example.com'
                      required
                      className='h-11 border-gray-300 focus:border-gray-900 focus-visible:ring-0'
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='subject'
                    className='block text-[13px] text-gray-700 mb-1.5'
                    style={{ fontWeight: 500 }}
                  >
                    Subject
                  </label>
                  <Input
                    id='subject'
                    type='text'
                    name='subject'
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder='What is this about?'
                    required
                    className='h-11 border-gray-300 focus:border-gray-900 focus-visible:ring-0'
                  />
                </div>

                <div>
                  <label
                    htmlFor='message'
                    className='block text-[13px] text-gray-700 mb-1.5'
                    style={{ fontWeight: 500 }}
                  >
                    Message
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    value={formData.message}
                    onChange={handleChange}
                    placeholder='Share a few details so we can help quickly…'
                    required
                    rows={6}
                    className='w-full px-3 py-2.5 text-[14.5px] border border-gray-300 rounded-md focus:border-gray-900 focus:outline-none focus:ring-0 resize-none placeholder:text-gray-400'
                  />
                </div>

                <div className='flex items-center justify-between gap-4 pt-2'>
                  <p className='text-xs text-gray-400'>
                    By submitting, you agree to our{' '}
                    <a
                      href='/privacy-policy'
                      className='text-gray-600 underline-offset-4 hover:underline'
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                  <Button
                    type='submit'
                    disabled={isSubmitting || isSubmitted}
                    className='inline-flex items-center gap-2 bg-[#f63a9e] hover:bg-[#e02d8d] disabled:bg-[#f63a9e]/50 text-white px-5 h-11 rounded-lg text-sm shadow-none'
                    style={{ fontWeight: 500 }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Sending…
                      </>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle2 className='w-4 h-4' />
                        Sent
                      </>
                    ) : (
                      <>
                        <Send className='w-4 h-4' />
                        Send message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Right rail */}
            <aside className='space-y-12'>
              {/* Quick answers */}
              <div>
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                  style={{ fontWeight: 600 }}
                >
                  Quick answers
                </p>
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-5"
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                  }}
                >
                  Frequently asked
                </h3>
                <div className='border-t border-gray-200'>
                  {faqs.map((faq, i) => (
                    <details
                      key={i}
                      className='group border-b border-gray-200 py-4'
                    >
                      <summary className='flex items-start justify-between gap-4 cursor-pointer list-none'>
                        <span
                          className='text-gray-900 text-[14.5px] leading-snug'
                          style={{ fontWeight: 500 }}
                        >
                          {faq.q}
                        </span>
                        <span className='text-gray-400 text-xl leading-none transition-transform group-open:rotate-45'>
                          +
                        </span>
                      </summary>
                      <p className='text-gray-600 text-[14px] mt-3 leading-relaxed'>
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>

              {/* Social */}
              <div>
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3'
                  style={{ fontWeight: 600 }}
                >
                  Follow along
                </p>
                <div className='flex flex-wrap gap-3'>
                  {socials.map((s, i) => (
                    <a
                      key={i}
                      href={s.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 border border-gray-300 hover:border-gray-900 text-gray-700 hover:text-gray-900 px-4 h-10 rounded-lg text-sm transition-colors'
                      style={{ fontWeight: 500 }}
                    >
                      <s.icon className='w-4 h-4' />
                      {s.label}
                      <ArrowUpRight className='w-3.5 h-3.5 text-gray-400' />
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
