import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Mail, ArrowUpRight } from 'lucide-react';

type SectionItem = { id: string; label: string; number: string };

const sections: SectionItem[] = [
  { id: 'eligibility', label: 'Refund eligibility', number: '1' },
  { id: 'returns', label: 'Returns & replacements', number: '2' },
  { id: 'shipping', label: 'Shipping costs', number: '3' },
  { id: 'damaged', label: 'Damaged or defective items', number: '4' },
  { id: 'notes', label: 'Important notes', number: '5' },
];

const summary = [
  {
    title: '7-day window',
    desc: 'Report issues within 7 days of receiving your order.',
  },
  {
    title: 'Pre-authorised returns',
    desc: 'All returns must be approved before sending back.',
  },
  {
    title: 'Return shipping',
    desc: 'Return postage is the customer\u2019s responsibility.',
  },
  {
    title: 'Defects covered',
    desc: 'Damaged or defective items qualify for a free replacement.',
  },
];

function SubSection({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className='scroll-mt-24'>
      <div className='mb-5'>
        <p className='text-xs text-gray-400 mb-1.5 tabular-nums'>{number}</p>
        <h3
          className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
          style={{
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
        {description && (
          <p className='text-gray-500 text-[15px] mt-2 leading-relaxed'>
            {description}
          </p>
        )}
      </div>
      <div className='text-gray-700 leading-relaxed space-y-4 text-[15px]'>
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className='space-y-2 list-disc pl-5 marker:text-gray-300'>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function RefundReturnPolicyPage() {
  const [activeId, setActiveId] = useState<string>(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop,
          );
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: [0, 1] },
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

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
                <RotateCcw className='w-4 h-4 text-[#f63a9e]' />
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-gray-500'
                  style={{ fontWeight: 600 }}
                >
                  Refund &amp; Returns
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
                If something isn&apos;t right, we&apos;ll fix it.
              </h1>
              <p className='text-gray-600 text-[17px] leading-relaxed mb-6'>
                Every print is made to order, so refunds work a little
                differently than off-the-shelf goods. Here&apos;s exactly when a
                refund or replacement applies, and how to get one if you need
                it.
              </p>
              <p className='text-sm text-gray-400'>
                Last updated 14 February 2026 ·{' '}
                <a
                  href='mailto:support@photify.co'
                  className='text-gray-500 hover:text-[#f63a9e] underline-offset-4 hover:underline'
                >
                  support@photify.co
                </a>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Summary strip */}
        <div className='border-b border-gray-200 bg-gray-50/60'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-10'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6'>
              {summary.map((item, i) => (
                <div key={i} className='border-l-2 border-[#f63a9e]/60 pl-4'>
                  <p
                    className='text-gray-900 mb-1 text-[15px]'
                    style={{ fontWeight: 600 }}
                  >
                    {item.title}
                  </p>
                  <p className='text-gray-500 text-sm leading-relaxed'>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16'>
          <div className='flex flex-col lg:flex-row gap-16'>
            {/* Sidebar TOC */}
            <aside className='lg:w-64 flex-shrink-0'>
              <div className='sticky top-24'>
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-5'
                  style={{ fontWeight: 600 }}
                >
                  On this page
                </p>
                <ul className='space-y-0.5 border-l border-gray-200'>
                  {sections.map(s => {
                    const isActive = activeId === s.id;
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className={`flex gap-3 text-[13.5px] py-1.5 pl-4 -ml-px border-l transition-colors ${
                            isActive
                              ? 'text-[#f63a9e] border-[#f63a9e]'
                              : 'text-gray-500 hover:text-gray-900 border-transparent'
                          }`}
                        >
                          <span className='tabular-nums text-gray-400 w-5'>
                            {s.number.padStart(2, '0')}
                          </span>
                          <span>{s.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
                <div className='mt-8 pt-6 border-t border-gray-200'>
                  <p className='text-xs text-gray-500 mb-2'>
                    Need help with a return?
                  </p>
                  <Link
                    to='/contact'
                    className='inline-flex items-center gap-1.5 text-[13px] text-gray-900 hover:text-[#f63a9e]'
                    style={{ fontWeight: 500 }}
                  >
                    Contact support
                    <ArrowUpRight className='w-3.5 h-3.5' />
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <article className='flex-1 max-w-2xl'>
              <div className='border-t border-gray-200 pt-12 mb-12'>
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                  style={{ fontWeight: 600 }}
                >
                  Photify Limited · UK
                </p>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                  }}
                >
                  Refund and Returns Policy
                </h2>
                <p className='text-gray-500 text-[16px] leading-relaxed max-w-2xl'>
                  At photify.co we aim to deliver high-quality prints that meet
                  your expectations. The sections below explain how refunds and
                  replacements work — please read them before getting in touch.
                </p>
              </div>

              <div className='space-y-14'>
                <SubSection
                  id='eligibility'
                  number='01'
                  title='Refund eligibility'
                >
                  <BulletList
                    items={[
                      <>
                        Refunds are accepted within{' '}
                        <span
                          className='text-gray-900'
                          style={{ fontWeight: 500 }}
                        >
                          7 days
                        </span>{' '}
                        of receiving your order.
                      </>,
                      <>
                        Personalised or custom items are{' '}
                        <span
                          className='text-gray-900'
                          style={{ fontWeight: 500 }}
                        >
                          non-refundable
                        </span>{' '}
                        unless they are damaged on delivery or contain a
                        manufacturing defect.
                      </>,
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='returns'
                  number='02'
                  title='Returns and replacements'
                >
                  <BulletList
                    items={[
                      <>
                        For eligible returns we will provide a{' '}
                        <span
                          className='text-gray-900'
                          style={{ fontWeight: 500 }}
                        >
                          replacement
                        </span>{' '}
                        for the item. Delivery charges will be deducted from
                        the refund amount.
                      </>,
                      <>
                        All returns must be{' '}
                        <span
                          className='text-gray-900'
                          style={{ fontWeight: 500 }}
                        >
                          pre-authorised
                        </span>
                        . Items sent back without prior approval will not be
                        accepted.
                      </>,
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='shipping'
                  number='03'
                  title='Shipping costs'
                >
                  <p>
                    If a return is approved, the{' '}
                    <span
                      className='text-gray-900'
                      style={{ fontWeight: 500 }}
                    >
                      customer is responsible
                    </span>{' '}
                    for covering the shipping cost of returning the item.
                  </p>
                </SubSection>

                <SubSection
                  id='damaged'
                  number='04'
                  title='Damaged or defective items'
                  description='If something arrives in poor condition, get in touch within 7 days and we&rsquo;ll sort it out.'
                >
                  <p>
                    Please include your order number and a few clear photos of
                    the issue. We will assess the situation and arrange a
                    replacement if necessary.
                  </p>
                  <dl className='grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-[14.5px] border border-gray-200 rounded-xl p-5'>
                    <div>
                      <dt className='text-gray-500 text-xs mb-0.5'>
                        Support email
                      </dt>
                      <dd>
                        <a
                          href='mailto:support@photify.co'
                          className='text-gray-900 hover:text-[#f63a9e] underline-offset-4 hover:underline'
                          style={{ fontWeight: 500 }}
                        >
                          support@photify.co
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className='text-gray-500 text-xs mb-0.5'>
                        General enquiries
                      </dt>
                      <dd>
                        <a
                          href='mailto:info@photify.co'
                          className='text-gray-900 hover:text-[#f63a9e] underline-offset-4 hover:underline'
                          style={{ fontWeight: 500 }}
                        >
                          info@photify.co
                        </a>
                      </dd>
                    </div>
                  </dl>
                </SubSection>

                <SubSection id='notes' number='05' title='Important notes'>
                  <BulletList
                    items={[
                      'Refunds or replacements will only be processed after the returned item has been inspected and approved.',
                      'Delivery charges are non-refundable.',
                    ]}
                  />
                </SubSection>
              </div>

              {/* Footer CTA */}
              <div className='mt-20 border-t border-gray-200 pt-12'>
                <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6'>
                  <div className='max-w-md'>
                    <h3
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        letterSpacing: '-0.015em',
                      }}
                    >
                      Need help with an order?
                    </h3>
                    <p className='text-gray-500 text-[15px] leading-relaxed'>
                      Get in touch and we&apos;ll be back to you within one
                      working day — or track your order to see where it is.
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-3'>
                    <a
                      href='mailto:support@photify.co'
                      className='inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm transition-colors'
                      style={{ fontWeight: 500 }}
                    >
                      <Mail className='w-4 h-4' />
                      Email us
                    </a>
                    <Link
                      to='/track-order'
                      className='inline-flex items-center gap-2 border border-gray-300 hover:border-gray-900 text-gray-900 px-5 py-2.5 rounded-lg text-sm transition-colors'
                      style={{ fontWeight: 500 }}
                    >
                      Track your order
                      <ArrowUpRight className='w-4 h-4' />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
