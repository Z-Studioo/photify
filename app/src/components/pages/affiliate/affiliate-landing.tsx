import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Wallet,
  Link2,
  Mail,
  ArrowRight,
  Instagram,
  Youtube,
  Camera,
  Home,
  Palette,
  PenTool,
  ShieldCheck,
  Clock,
  Globe,
  BarChart3,
  Gift,
  CheckCircle2,
  Quote,
} from 'lucide-react';

function EarningsCalculator() {
  const [aov, setAov] = useState(120);
  const [orders, setOrders] = useState(20);
  const monthly = useMemo(() => aov * orders * 0.1, [aov, orders]);
  const yearly = monthly * 12;

  return (
    <div className='rounded-2xl border border-gray-200 bg-white overflow-hidden'>
      <div className='grid md:grid-cols-[1.2fr_1fr]'>
        <div className='p-7 md:p-9 border-b md:border-b-0 md:border-r border-gray-200'>
          <p
            className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
            style={{ fontWeight: 600 }}
          >
            Earnings calculator
          </p>
          <h3
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            See what your audience could earn you
          </h3>
          <p className='text-gray-500 text-[14.5px] mb-7 leading-relaxed'>
            Sliders are estimates — your commission is always 10% of the
            subtotal of every paid order through your link.
          </p>

          <div className='space-y-6'>
            <div>
              <div className='flex items-baseline justify-between mb-2'>
                <label className='text-[13px] text-gray-700' style={{ fontWeight: 500 }}>
                  Average order value
                </label>
                <span
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-[15px]"
                  style={{ fontWeight: 700 }}
                >
                  £{aov}
                </span>
              </div>
              <input
                type='range'
                min={40}
                max={400}
                step={10}
                value={aov}
                onChange={(e) => setAov(Number(e.target.value))}
                className='w-full accent-[#f63a9e]'
              />
              <div className='flex justify-between text-[11px] text-gray-400 mt-1'>
                <span>£40</span>
                <span>£400</span>
              </div>
            </div>

            <div>
              <div className='flex items-baseline justify-between mb-2'>
                <label className='text-[13px] text-gray-700' style={{ fontWeight: 500 }}>
                  Orders per month
                </label>
                <span
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-[15px]"
                  style={{ fontWeight: 700 }}
                >
                  {orders}
                </span>
              </div>
              <input
                type='range'
                min={1}
                max={200}
                step={1}
                value={orders}
                onChange={(e) => setOrders(Number(e.target.value))}
                className='w-full accent-[#f63a9e]'
              />
              <div className='flex justify-between text-[11px] text-gray-400 mt-1'>
                <span>1</span>
                <span>200</span>
              </div>
            </div>
          </div>
        </div>

        <div className='p-7 md:p-9 bg-gradient-to-br from-[#fff5fa] via-white to-white flex flex-col justify-center'>
          <p className='text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-2'
            style={{ fontWeight: 600 }}
          >
            Estimated payout
          </p>
          <p
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
            style={{
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            £
            {monthly.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            <span className='text-gray-400 text-base ml-1.5' style={{ fontWeight: 500 }}>
              /mo
            </span>
          </p>
          <p className='text-gray-500 text-sm mt-2'>
            ≈ £
            {yearly.toLocaleString(undefined, { maximumFractionDigits: 0 })} per
            year at this pace
          </p>

          <div className='h-px bg-gray-200 my-6' />

          <ul className='space-y-2.5'>
            {[
              'Paid monthly via bank transfer',
              'Track every click, sale, and approval live',
              'Auto-discount keeps conversion high',
            ].map((line) => (
              <li key={line} className='flex items-start gap-2 text-[13.5px] text-gray-700'>
                <CheckCircle2 className='w-4 h-4 text-[#f63a9e] flex-shrink-0 mt-0.5' />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function AffiliateLandingPage() {
  const perks = [
    {
      icon: Wallet,
      title: '10% on every order',
      copy: 'Commission paid on the subtotal of every paid order (delivery excluded). No caps. No tiers.',
    },
    {
      icon: Link2,
      title: 'Your own short link',
      copy: 'photify.co/r/YOURNAME — share it anywhere. 30-day cookie attribution.',
    },
    {
      icon: Gift,
      title: 'Built-in audience discount',
      copy: 'Your followers automatically get a discount when they land via your link. Higher conversion, happier audience.',
    },
    {
      icon: BarChart3,
      title: 'Real-time dashboard',
      copy: 'See clicks, sales, pending and approved earnings live — plus per-order breakdowns.',
    },
    {
      icon: Mail,
      title: 'Inbox notifications',
      copy: 'Email pings on first click, first sale, approvals, and every payout sent.',
    },
    {
      icon: ShieldCheck,
      title: 'Honest holding period',
      copy: '14 days after delivery to cover returns — then commission flips to approved. No surprises.',
    },
    {
      icon: Clock,
      title: 'Monthly payouts',
      copy: 'Approved balance over £50 is sent on the 1st of every month, manually reviewed for accuracy.',
    },
    {
      icon: Globe,
      title: 'Worldwide friendly',
      copy: 'We ship across the UK and EU. Partners welcome from anywhere your audience reaches.',
    },
  ];

  const audiences = [
    {
      icon: Camera,
      tag: 'Photographers',
      copy: 'Print your shoots, sell prints to clients, and earn on every order they place themselves.',
    },
    {
      icon: Home,
      tag: 'Interior creators',
      copy: 'Wall-art is your bread and butter — get rewarded for every recommendation.',
    },
    {
      icon: Palette,
      tag: 'Designers & artists',
      copy: 'Send your community somewhere that prints work as well as it looks on screen.',
    },
    {
      icon: PenTool,
      tag: 'Bloggers & writers',
      copy: 'Add a referral link to your gift guides, home decor posts, and newsletters.',
    },
    {
      icon: Instagram,
      tag: 'Instagram creators',
      copy: 'Drop your link in stories and bio — discount auto-applies for your audience.',
    },
    {
      icon: Youtube,
      tag: 'YouTube & TikTok',
      copy: 'Pin your link in descriptions and comments — earn on every viewer who orders.',
    },
  ];

  const steps = [
    {
      title: 'Apply in under 3 minutes',
      copy: 'Tell us about you, your audience, and how you plan to promote. We review every application personally.',
    },
    {
      title: 'Get your custom link',
      copy: "Once approved, we email a magic link to set up your dashboard and your photify.co/r/YOU URL.",
    },
    {
      title: 'Share it anywhere',
      copy: 'Stories, bio, blog, newsletter, video descriptions. Your audience gets a discount automatically.',
    },
    {
      title: 'Get paid monthly',
      copy: 'Watch commissions accrue live. Once an order is delivered + the holding period clears, it’s yours.',
    },
  ];

  const faqs = [
    {
      q: 'How much do I earn?',
      a: '10% of the subtotal on every paid order placed within 30 days of someone clicking your link. Delivery is excluded. There are no caps or tiers.',
    },
    {
      q: 'When and how do I get paid?',
      a: 'Approved balance over £50 is paid monthly via bank transfer (BACS / SEPA / international wire). You set your payout details once you’re approved.',
    },
    {
      q: 'What is the holding period?',
      a: 'Commissions stay "pending" for 14 days after the order is delivered, to cover the refund window. After that they flip to "approved" automatically and become eligible for payout.',
    },
    {
      q: 'Do I have to be approved?',
      a: 'Yes — we review every applicant by hand to keep the program high quality. Most decisions come back within 3 working days.',
    },
    {
      q: 'Can I run paid ads on Photify’s brand?',
      a: 'No. Bidding on “Photify” or close variants is not allowed and will result in commissions being reversed. Organic content, your own audience, and paid ads on your own brand are all fine.',
    },
    {
      q: 'What if a customer asks for a refund?',
      a: 'If a refund happens before the holding period ends, that order’s commission simply doesn’t accrue. We never claw back paid commissions.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Absolutely. You can pause or close your affiliate account from your dashboard at any time. Any approved balance is still paid out.',
    },
  ];

  const stats = [
    { value: '10%', label: 'Commission, every order' },
    { value: '30d', label: 'Attribution window' },
    { value: '14d', label: 'Holding period' },
    { value: '£50', label: 'Minimum payout' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      <main className='flex-1'>
        {/* Hero */}
        <section className='relative overflow-hidden border-b border-gray-200'>
          <div
            className='absolute inset-0 pointer-events-none opacity-[0.55]'
            style={{
              backgroundImage:
                'radial-gradient(60% 50% at 80% 0%, rgba(246,58,158,0.18) 0%, rgba(246,58,158,0) 70%), radial-gradient(50% 40% at 0% 100%, rgba(246,58,158,0.12) 0%, rgba(246,58,158,0) 70%)',
            }}
          />
          <div className='relative max-w-[1200px] mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-16 md:pb-20'>
            <div className='grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center'>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className='max-w-3xl lg:max-w-none'
            >
              <div className='inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full bg-[#f63a9e]/10 border border-[#f63a9e]/20'>
                <Sparkles className='w-3.5 h-3.5 text-[#f63a9e]' />
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e]'
                  style={{ fontWeight: 600 }}
                >
                  Photify Partner Program
                </p>
              </div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6"
                style={{
                  fontSize: 'clamp(40px, 6vw, 68px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.02,
                }}
              >
                Turn your audience into <br className='hidden md:block' />
                <span className='text-[#f63a9e]'>recurring income</span> —
                <br className='hidden md:block' /> one print at a time.
              </h1>
              <p className='text-gray-600 text-[17px] md:text-[18.5px] leading-relaxed mb-9 max-w-2xl'>
                Earn <strong>10% commission</strong> on every print, canvas, and
                wall-art order you refer to Photify. Your link, your built-in
                discount, your live dashboard — we handle everything else.
              </p>

              <div className='flex flex-wrap items-center gap-3'>
                <Link to='/affiliate/apply'>
                  <Button
                    className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-12 px-6 rounded-lg text-[15px] shadow-none'
                    style={{ fontWeight: 500 }}
                  >
                    Become a Partner
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </Button>
                </Link>
                <Link to='/affiliate/login'>
                  <Button
                    variant='ghost'
                    className='text-gray-700 hover:text-gray-900 hover:bg-gray-100 h-12 px-5 rounded-lg text-[15px]'
                    style={{ fontWeight: 500 }}
                  >
                    Sign in to dashboard
                  </Button>
                </Link>
              </div>

              <div className='mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 max-w-2xl'>
                {stats.map((s) => (
                  <div key={s.label}>
                    <p
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                      style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </p>
                    <p className='text-[12.5px] text-gray-500 mt-1.5'>{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Hero visual */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className='relative w-full max-w-[560px] lg:max-w-none mx-auto lg:mx-0'
            >
              {/* Soft pink glow */}
              <div
                aria-hidden
                className='absolute -inset-6 lg:-inset-10 pointer-events-none -z-10'
                style={{
                  backgroundImage:
                    'radial-gradient(60% 55% at 70% 40%, rgba(246,58,158,0.22) 0%, rgba(246,58,158,0) 70%)',
                }}
              />

              <div className='relative rounded-2xl overflow-hidden border border-gray-200/80 bg-white shadow-[0_30px_80px_-30px_rgba(246,58,158,0.35),_0_12px_30px_-15px_rgba(17,24,39,0.18)]'>
                <img
                  src='/images/affiliate/affiliate-hero.png'
                  alt='A framed Photify pastel sunset print at the centre, surrounded by floating cards: 2,431 likes, +£247 weekly commission chart, a photify.co/r/maya share link, 1.2M views, and a new order notification — visualising how one print turns into audience reach and recurring affiliate income.'
                  className='w-full h-auto block'
                  loading='eager'
                  fetchPriority='high'
                  width={1024}
                  height={683}
                />
              </div>

              {/* Floating "10% commission" chip */}
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
                className='hidden md:flex absolute -top-3 -right-3 lg:-top-4 lg:-right-4 items-center gap-2 rounded-full bg-[#f63a9e] text-white px-3.5 py-2 shadow-[0_10px_28px_-8px_rgba(246,58,158,0.6)]'
              >
                <Sparkles className='w-3.5 h-3.5' />
                <p
                  className='text-[12px] tracking-tight'
                  style={{ fontWeight: 600 }}
                >
                  10% on every order
                </p>
              </motion.div>
            </motion.div>
            </div>
          </div>
        </section>

        {/* Perks */}
        <section className='border-b border-gray-200'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-20'>
            <div className='max-w-2xl mb-12'>
              <p
                className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                style={{ fontWeight: 600 }}
              >
                What you get
              </p>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 38px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                }}
              >
                A real program, built for people who actually create.
              </h2>
              <p className='text-gray-600 text-[16px] leading-relaxed'>
                No clunky third-party platform. No hidden cookie windows. Just a
                fast, honest tracking system and a dashboard that shows you
                exactly where every penny came from.
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10'>
              {perks.map((p) => (
                <div key={p.title} className='border-l-2 border-[#f63a9e]/60 pl-4'>
                  <p.icon className='w-5 h-5 text-[#f63a9e] mb-3' />
                  <p
                    className='text-gray-900 text-[15px] mb-1.5'
                    style={{ fontWeight: 600 }}
                  >
                    {p.title}
                  </p>
                  <p className='text-gray-600 text-[13.5px] leading-relaxed'>
                    {p.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className='border-b border-gray-200 bg-gray-50/70'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-20'>
            <EarningsCalculator />
          </div>
        </section>

        {/* Who it's for */}
        <section className='border-b border-gray-200'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-20'>
            <div className='max-w-2xl mb-12'>
              <p
                className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                style={{ fontWeight: 600 }}
              >
                Who it&apos;s for
              </p>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 38px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                }}
              >
                If your audience cares how their walls look — we want to meet you.
              </h2>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {audiences.map((a) => (
                <div
                  key={a.tag}
                  className='group rounded-xl border border-gray-200 hover:border-[#f63a9e]/40 hover:shadow-[0_8px_30px_-12px_rgba(246,58,158,0.18)] transition-all p-5 bg-white'
                >
                  <div className='flex items-center gap-2.5 mb-2'>
                    <div className='w-8 h-8 rounded-lg bg-[#f63a9e]/10 flex items-center justify-center group-hover:bg-[#f63a9e]/15 transition-colors'>
                      <a.icon className='w-4 h-4 text-[#f63a9e]' />
                    </div>
                    <p
                      className='text-gray-900 text-[14.5px]'
                      style={{ fontWeight: 600 }}
                    >
                      {a.tag}
                    </p>
                  </div>
                  <p className='text-gray-600 text-[13.5px] leading-relaxed'>
                    {a.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className='border-b border-gray-200 bg-gradient-to-b from-white to-gray-50/60'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-20'>
            <div className='max-w-2xl mb-14'>
              <p
                className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                style={{ fontWeight: 600 }}
              >
                How it works
              </p>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 38px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                }}
              >
                Four steps from application to your first payout.
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 relative'>
              {steps.map((s, i) => (
                <div key={s.title} className='relative'>
                  <div className='flex items-center gap-3 mb-3'>
                    <span
                      className="font-['Bricolage_Grotesque',_sans-serif] inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#f63a9e] text-white text-[14px]"
                      style={{ fontWeight: 700 }}
                    >
                      {i + 1}
                    </span>
                    {i < steps.length - 1 && (
                      <div className='hidden lg:block flex-1 h-px bg-gradient-to-r from-[#f63a9e]/30 to-transparent' />
                    )}
                  </div>
                  <p
                    className='text-gray-900 text-[16px] mb-2'
                    style={{ fontWeight: 600 }}
                  >
                    {s.title}
                  </p>
                  <p className='text-gray-600 text-[14px] leading-relaxed'>
                    {s.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial / trust */}
        <section className='border-b border-gray-200'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-20'>
            <div className='grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-start'>
              <div className='relative'>
                <Quote className='w-10 h-10 text-[#f63a9e]/30 mb-4' />
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                  style={{
                    fontSize: 'clamp(22px, 2.6vw, 30px)',
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.25,
                  }}
                >
                  &ldquo;The dashboard shows me every click and sale in real
                  time. My audience loves the auto discount, and I get a clean
                  monthly payout. It just works.&rdquo;
                </p>
                <div className='mt-6 flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#f63a9e] to-[#e02d8d] flex items-center justify-center text-white text-sm'
                    style={{ fontWeight: 600 }}
                  >
                    M
                  </div>
                  <div>
                    <p className='text-gray-900 text-[14px]' style={{ fontWeight: 600 }}>
                      Maya R.
                    </p>
                    <p className='text-gray-500 text-[12.5px]'>
                      Interior creator · 84K followers
                    </p>
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-gray-200 p-6 bg-white'>
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-4'
                  style={{ fontWeight: 600 }}
                >
                  Why partners stay
                </p>
                <ul className='space-y-4'>
                  {[
                    {
                      icon: TrendingUp,
                      title: 'Higher conversion',
                      copy: 'Auto-applied discount lifts your click-to-order rate.',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'No surprise reversals',
                      copy: 'Holding period is clear up-front. Paid commissions stay paid.',
                    },
                    {
                      icon: Mail,
                      title: 'Human support',
                      copy: 'Email us anytime — we read and reply, no ticket queue.',
                    },
                  ].map((b) => (
                    <li key={b.title} className='flex gap-3'>
                      <b.icon className='w-4 h-4 text-[#f63a9e] mt-1 flex-shrink-0' />
                      <div>
                        <p className='text-gray-900 text-[14px]' style={{ fontWeight: 600 }}>
                          {b.title}
                        </p>
                        <p className='text-gray-600 text-[13px] leading-relaxed mt-0.5'>
                          {b.copy}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className='border-b border-gray-200 bg-gray-50/60'>
          <div className='max-w-[900px] mx-auto px-6 md:px-12 py-16 md:py-20'>
            <div className='mb-10'>
              <p
                className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                style={{ fontWeight: 600 }}
              >
                FAQ
              </p>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 38px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                }}
              >
                Questions, answered straight.
              </h2>
            </div>
            <Accordion type='single' collapsible className='border-t border-gray-200'>
              {faqs.map((f, i) => (
                <AccordionItem
                  value={`faq-${i}`}
                  key={f.q}
                  className='border-gray-200'
                >
                  <AccordionTrigger className='text-[15px] text-gray-900 py-5' style={{ fontWeight: 600 }}>
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className='text-gray-600 text-[14.5px] leading-relaxed pr-6'>
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className='relative overflow-hidden'>
          <div
            className='absolute inset-0 pointer-events-none'
            style={{
              backgroundImage:
                'radial-gradient(70% 60% at 50% 0%, rgba(246,58,158,0.12) 0%, rgba(246,58,158,0) 70%)',
            }}
          />
          <div className='relative max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-24 text-center'>
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-5"
              style={{
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              Ready to earn from what you&apos;d <br className='hidden md:block' />
              recommend anyway?
            </h2>
            <p className='text-gray-600 text-[16.5px] max-w-xl mx-auto mb-9 leading-relaxed'>
              Apply in under three minutes. Most decisions back in 3 working
              days. No commitment, cancel anytime.
            </p>
            <div className='flex flex-wrap items-center justify-center gap-3'>
              <Link to='/affiliate/apply'>
                <Button
                  className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-12 px-7 rounded-lg text-[15px] shadow-none'
                  style={{ fontWeight: 500 }}
                >
                  Become a Partner
                  <ArrowRight className='w-4 h-4 ml-2' />
                </Button>
              </Link>
              <Link to='/contact'>
                <Button
                  variant='ghost'
                  className='text-gray-700 hover:text-gray-900 hover:bg-gray-100 h-12 px-5 rounded-lg text-[15px]'
                  style={{ fontWeight: 500 }}
                >
                  Talk to us first
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
