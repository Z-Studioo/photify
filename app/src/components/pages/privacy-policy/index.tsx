import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, ArrowUpRight } from 'lucide-react';

type SectionItem = { id: string; label: string };
type SectionGroup = { title: string; items: SectionItem[] };

const sectionGroups: SectionGroup[] = [
  {
    title: 'Personal Data',
    items: [
      { id: 'who-we-are', label: 'Who we are' },
      { id: 'data-collected', label: 'Data we collect' },
      { id: 'how-we-use', label: 'How we use your data' },
      { id: 'automated', label: 'Automated decisions' },
      { id: 'sharing', label: 'Who we share with' },
      { id: 'transfers', label: 'International transfers' },
      { id: 'retention', label: 'Data retention' },
      { id: 'rights', label: 'Your rights' },
      { id: 'security', label: 'Security' },
      { id: 'changes', label: 'Changes' },
      { id: 'contact', label: 'Contact' },
    ],
  },
  { title: 'Customer Accounts', items: [{ id: 'accounts', label: 'Overview' }] },
  { title: 'Cookies', items: [{ id: 'cookies', label: 'A note on cookies' }] },
];

const summary = [
  { title: 'We never sell your data', desc: 'Not to advertisers, not to anyone.' },
  { title: 'UK GDPR compliant', desc: 'Aligned with UK GDPR and the DPA 2018.' },
  { title: 'Encrypted in transit', desc: 'TLS and tokenised payments via Stripe.' },
  { title: 'You stay in control', desc: 'Access, edit or delete your data anytime.' },
];

const rights = [
  { title: 'Access', desc: 'Request a copy of the data we hold about you.' },
  { title: 'Rectification', desc: 'Correct inaccurate or incomplete data.' },
  { title: 'Erasure', desc: 'Request deletion where legal grounds permit.' },
  { title: 'Object & restrict', desc: 'Object to or restrict processing.' },
  { title: 'Portability', desc: 'Receive your data in a machine-readable format.' },
  { title: 'Complain', desc: "Lodge a complaint with the UK's ICO." },
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
          style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em' }}
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

function PartHeader({
  part,
  title,
  description,
}: {
  part: string;
  title: string;
  description?: string;
}) {
  return (
    <div className='border-t border-gray-200 pt-12 mb-12'>
      <p
        className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
        style={{ fontWeight: 600 }}
      >
        {part}
      </p>
      <h2
        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
        style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}
      >
        {title}
      </h2>
      {description && (
        <p className='text-gray-500 text-[16px] leading-relaxed max-w-2xl'>
          {description}
        </p>
      )}
    </div>
  );
}

export function PrivacyPolicyPage() {
  const allIds = sectionGroups.flatMap(g => g.items.map(i => i.id));
  const [activeId, setActiveId] = useState<string>(allIds[0] ?? '');

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
    allIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [allIds]);

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
                <Shield className='w-4 h-4 text-[#f63a9e]' />
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-gray-500'
                  style={{ fontWeight: 600 }}
                >
                  Privacy Policy
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
                How we handle your data.
              </h1>
              <p className='text-gray-600 text-[17px] leading-relaxed mb-6'>
                At Photify, we treat your personal information with care and
                only collect what we need to fulfil your order, run the site,
                and stay compliant with UK law. This page explains exactly what
                that means in practice.
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
                <nav className='space-y-7'>
                  {sectionGroups.map((group, gi) => (
                    <div key={gi}>
                      <p
                        className='text-[11px] uppercase tracking-[0.14em] text-gray-500 mb-3'
                        style={{ fontWeight: 600 }}
                      >
                        {group.title}
                      </p>
                      <ul className='space-y-0.5 border-l border-gray-200'>
                        {group.items.map(s => {
                          const isActive = activeId === s.id;
                          return (
                            <li key={s.id}>
                              <a
                                href={`#${s.id}`}
                                className={`block text-[13.5px] py-1.5 pl-4 -ml-px border-l transition-colors ${
                                  isActive
                                    ? 'text-[#f63a9e] border-[#f63a9e]'
                                    : 'text-gray-500 hover:text-gray-900 border-transparent'
                                }`}
                              >
                                {s.label}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <article className='flex-1 max-w-2xl'>
              {/* Part 1 */}
              <PartHeader
                part='Part 1'
                title='Personal data'
                description='What we collect, why we collect it, where it goes, and how long we keep it.'
              />

              <div className='space-y-14'>
                <SubSection id='who-we-are' number='1.1' title='Who we are'>
                  <p>
                    Photify Limited (&quot;Photify&quot;, &quot;we&quot;,
                    &quot;our&quot;, &quot;us&quot;) is a company registered in
                    England and Wales.
                  </p>
                  <dl className='grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-[14.5px] border border-gray-200 rounded-xl p-5 not-prose'>
                    {[
                      { k: 'Registered office', v: 'London, United Kingdom' },
                      { k: 'Company number', v: '16119644' },
                      {
                        k: 'Website',
                        v: 'photify.co',
                        href: 'https://www.photify.co',
                      },
                      {
                        k: 'Contact email',
                        v: 'support@photify.co',
                        href: 'mailto:support@photify.co',
                      },
                    ].map((row, i) => (
                      <div key={i}>
                        <dt className='text-gray-500 text-xs mb-0.5'>
                          {row.k}
                        </dt>
                        <dd>
                          {row.href ? (
                            <a
                              href={row.href}
                              target={
                                row.href.startsWith('http') ? '_blank' : undefined
                              }
                              rel={
                                row.href.startsWith('http')
                                  ? 'noopener noreferrer'
                                  : undefined
                              }
                              className='text-gray-900 hover:text-[#f63a9e] underline-offset-4 hover:underline'
                              style={{ fontWeight: 500 }}
                            >
                              {row.v}
                            </a>
                          ) : (
                            <span
                              className='text-gray-900'
                              style={{ fontWeight: 500 }}
                            >
                              {row.v}
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p>
                    We sell custom photo prints to customers in the United
                    Kingdom only. We do not knowingly target or market to
                    children under 16, EU/EEA residents (outside the UK), or
                    California residents.
                  </p>
                </SubSection>

                <SubSection
                  id='data-collected'
                  number='1.2'
                  title='Personal data we collect'
                  description='Each category below includes the purpose and lawful basis under UK GDPR Article 6.'
                >
                  <div className='overflow-x-auto border border-gray-200 rounded-xl'>
                    <table className='w-full text-[13.5px]'>
                      <thead>
                        <tr className='border-b border-gray-200 bg-gray-50/70 text-gray-500'>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Category
                          </th>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Examples
                          </th>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Purpose
                          </th>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Lawful basis
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100'>
                        {[
                          {
                            category: 'Identity & contact',
                            examples: 'Name, phone, email, postal address',
                            purpose:
                              'Create your order, deliver prints, communicate about your purchase',
                            basis: 'Contract',
                          },
                          {
                            category: 'Photos & artwork',
                            examples: 'Image files you upload',
                            purpose: 'Produce and package your prints',
                            basis: 'Contract',
                          },
                          {
                            category: 'Payment details',
                            examples: 'Card number (tokenised via Stripe)',
                            purpose: 'Process payment',
                            basis: 'Contract & legal obligation',
                          },
                          {
                            category: 'Usage data',
                            examples:
                              'IP, browser, pages viewed (GA & Hotjar)',
                            purpose:
                              'Improve the Site, detect issues, measure marketing',
                            basis: 'Contract',
                          },
                          {
                            category: 'Marketing preferences',
                            examples: 'Opt-in status',
                            purpose: 'Send offers & news (if you consent)',
                            basis: 'Consent',
                          },
                          {
                            category: 'Automated logs',
                            examples: 'Server logs, Stripe webhook logs',
                            purpose: 'Protect security, prevent fraud',
                            basis: 'Legitimate interests',
                          },
                        ].map((row, i) => (
                          <tr key={i}>
                            <td
                              className='px-4 py-3 text-gray-900 align-top'
                              style={{ fontWeight: 500 }}
                            >
                              {row.category}
                            </td>
                            <td className='px-4 py-3 text-gray-600 align-top'>
                              {row.examples}
                            </td>
                            <td className='px-4 py-3 text-gray-600 align-top'>
                              {row.purpose}
                            </td>
                            <td className='px-4 py-3 text-gray-600 align-top'>
                              {row.basis}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SubSection>

                <SubSection
                  id='how-we-use'
                  number='1.3'
                  title='How we use your data'
                >
                  <p>
                    We use your data primarily for{' '}
                    <span className='text-gray-900' style={{ fontWeight: 500 }}>
                      order fulfilment
                    </span>{' '}
                    — receiving your images, printing them, packaging your
                    order, and dispatching it to you. Customer support emails
                    are handled under the same basis.
                  </p>
                  <p>
                    To improve our services, we analyse website traffic and
                    user behaviour through Google Analytics and Hotjar. When
                    you give your consent, we may also use your information to
                    deliver marketing communications, including ads on Meta
                    platforms and promotional emails.
                  </p>
                  <p>
                    Finally, we employ automated monitoring of payment
                    transactions and website traffic patterns to enhance
                    security and prevent fraud.
                  </p>
                </SubSection>

                <SubSection
                  id='automated'
                  number='1.4'
                  title='Automated decision-making'
                >
                  <p>
                    We apply automated checks (via Stripe Radar and similar
                    fraud-detection triggers) to flag or block potentially
                    fraudulent transactions. These decisions do not produce
                    legal or similarly significant effects on individuals; a
                    human review is available on request.
                  </p>
                </SubSection>

                <SubSection
                  id='sharing'
                  number='1.5'
                  title='Who we share data with'
                  description='We only share what is needed, with vetted providers, under formal safeguards.'
                >
                  <div className='overflow-x-auto border border-gray-200 rounded-xl'>
                    <table className='w-full text-[13.5px]'>
                      <thead>
                        <tr className='border-b border-gray-200 bg-gray-50/70 text-gray-500'>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Recipient
                          </th>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Role
                          </th>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Safeguards
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100'>
                        {[
                          {
                            recipient: 'Stripe Payments UK, Ltd.',
                            role: 'Card processing, fraud checks',
                            safeguards: 'UK-hosted; PCI-DSS compliant',
                          },
                          {
                            recipient: 'Google Analytics',
                            role: 'Site analytics',
                            safeguards:
                              'IP anonymisation; EU–US Data Privacy Framework',
                          },
                          {
                            recipient: 'Meta Platforms Ireland Ltd.',
                            role: 'Conversion tracking (Meta Pixel)',
                            safeguards: 'Standard Contractual Clauses',
                          },
                          {
                            recipient: 'Hotjar Ltd.',
                            role: 'Session analytics & heat-maps',
                            safeguards: 'Malta/EEA; SCCs where needed',
                          },
                          {
                            recipient: 'Couriers (Royal Mail, DPD)',
                            role: 'Deliver your prints',
                            safeguards: 'Address & contact info only',
                          },
                          {
                            recipient: 'IT service providers',
                            role: 'Hosting, backup, maintenance',
                            safeguards: 'UK/EU servers where possible',
                          },
                        ].map((row, i) => (
                          <tr key={i}>
                            <td
                              className='px-4 py-3 text-gray-900 align-top'
                              style={{ fontWeight: 500 }}
                            >
                              {row.recipient}
                            </td>
                            <td className='px-4 py-3 text-gray-600 align-top'>
                              {row.role}
                            </td>
                            <td className='px-4 py-3 text-gray-600 align-top'>
                              {row.safeguards}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p
                    className='text-gray-900'
                    style={{ fontWeight: 500 }}
                  >
                    We never sell your personal data.
                  </p>
                </SubSection>

                <SubSection
                  id='transfers'
                  number='1.6'
                  title='International transfers'
                >
                  <p>
                    Where providers transfer data outside the UK (e.g., to the
                    US), we rely on:
                  </p>
                  <ul className='space-y-2 list-disc pl-5 marker:text-gray-300'>
                    <li>
                      An adequacy decision (UK Extension to the EU–US Data
                      Privacy Framework); or
                    </li>
                    <li>
                      The UK International Data Transfer Addendum to EU
                      Standard Contractual Clauses.
                    </li>
                  </ul>
                </SubSection>

                <SubSection
                  id='retention'
                  number='1.7'
                  title='Data retention periods'
                >
                  <div className='overflow-x-auto border border-gray-200 rounded-xl'>
                    <table className='w-full text-[13.5px]'>
                      <thead>
                        <tr className='border-b border-gray-200 bg-gray-50/70 text-gray-500'>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Data type
                          </th>
                          <th
                            className='px-4 py-3 text-left'
                            style={{ fontWeight: 600 }}
                          >
                            Retention period
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100'>
                        {[
                          {
                            type: 'Cookies & similar technologies',
                            period: '30 days (see Cookies Policy below)',
                          },
                          {
                            type: 'Order information',
                            period:
                              '1 year from dispatch, then securely deleted / anonymised',
                          },
                          {
                            type: 'Photos you upload',
                            period:
                              '1 year from dispatch, then securely deleted',
                          },
                          {
                            type: 'Customer support emails',
                            period: '18 months',
                          },
                          {
                            type: 'Analytics data (aggregated)',
                            period: 'Up to 26 months (per Google Analytics)',
                          },
                        ].map((row, i) => (
                          <tr key={i}>
                            <td
                              className='px-4 py-3 text-gray-900 align-top'
                              style={{ fontWeight: 500 }}
                            >
                              {row.type}
                            </td>
                            <td className='px-4 py-3 text-gray-600 align-top'>
                              {row.period}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SubSection>

                <SubSection
                  id='rights'
                  number='1.8'
                  title='Your rights'
                  description='Under UK GDPR and the Data Protection Act 2018.'
                >
                  <div className='grid sm:grid-cols-2 gap-x-8 gap-y-5 not-prose'>
                    {rights.map((right, i) => (
                      <div key={i}>
                        <p
                          className='text-gray-900 mb-1 text-[14.5px]'
                          style={{ fontWeight: 600 }}
                        >
                          {right.title}
                        </p>
                        <p className='text-gray-500 text-[13.5px] leading-relaxed'>
                          {right.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className='text-[14.5px] text-gray-600'>
                    To exercise any of these rights, email{' '}
                    <a
                      href='mailto:support@photify.co'
                      className='text-[#f63a9e] underline-offset-4 hover:underline'
                    >
                      support@photify.co
                    </a>
                    . We respond within 30 days.
                  </p>
                </SubSection>

                <SubSection id='security' number='1.9' title='Security'>
                  <p>
                    We use TLS encryption, tokenised payments (Stripe),
                    least-privilege access controls, periodic penetration
                    testing, and secure deletion routines to protect your
                    information.
                  </p>
                </SubSection>

                <SubSection
                  id='changes'
                  number='1.10'
                  title='Changes to this policy'
                >
                  <p>
                    We may update this notice from time to time. We&apos;ll
                    post the revised version and, if changes are material,
                    notify you by email or a prominent banner on the Site.
                  </p>
                </SubSection>

                <SubSection id='contact' number='1.11' title='Contact'>
                  <p>
                    For privacy questions, email{' '}
                    <a
                      href='mailto:support@photify.co'
                      className='text-[#f63a9e] underline-offset-4 hover:underline'
                    >
                      support@photify.co
                    </a>{' '}
                    or write to Photify Limited, London, United Kingdom.
                  </p>
                </SubSection>
              </div>

              {/* Part 2 */}
              <div className='mt-20'>
                <PartHeader
                  part='Part 2'
                  title='Customer accounts'
                  description='Account data, how it&rsquo;s used, and how to remove it.'
                />
                <section id='accounts' className='scroll-mt-24 space-y-4 text-gray-700 leading-relaxed text-[15px]'>
                  <p>
                    Creating a customer account requires basic personal
                    information like your name, address, email, and password.
                    This data allows us to simplify order placements and manage
                    your preferences.{' '}
                    <span className='text-gray-900' style={{ fontWeight: 500 }}>
                      You can update or delete your account at any time
                    </span>
                    , and your data will be removed unless required for legal
                    or outstanding obligations.
                  </p>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 pt-6"
                    style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.01em' }}
                  >
                    2.1 How Photify uses your data
                  </h3>
                  <p>
                    We process your personal data in compliance with data
                    protection laws, particularly the principles outlined in
                    GDPR. Your data is used only for purposes communicated in
                    our Privacy Policy or those explained at the time of
                    collection. This includes order processing, personalisation,
                    service development, and ensuring security. We also use
                    your data under strict European laws for product
                    development, scientific research (AI, machine learning, and
                    deep learning), and market analysis.
                  </p>
                  <p>
                    For order processing, we collect personal information such
                    as your name, email address, and image files to fulfil your
                    requests. This data is used to keep you updated on order
                    status, provide relevant product information, and analyse
                    trends. Image files are deleted after three months unless
                    extended retention is necessary for customer support.
                    Additionally, we use your data to optimise business
                    operations, design tailored services, and deliver
                    personalised advertising.
                  </p>
                  <p>
                    To enhance your shopping experience, we share data with
                    select service providers under GDPR regulations. This
                    enables efficient payment processing, shipping, and
                    marketing insights. For instance, shipping providers like
                    DHL, EVRI or UPS receive your address, while payment
                    platforms like PayPal ensure smooth transactions. Data
                    sharing is strictly limited to fulfilling your order or
                    improving our services.
                  </p>
                  <p>
                    We also use marketing tools such as Google Analytics, Adobe
                    Media Optimizer, and retargeting technologies to understand
                    customer preferences and optimise our website. Social media
                    plugins are intentionally excluded to prevent automatic
                    data transfers, protecting your privacy. While you can
                    manually share pages on platforms like Facebook, no user
                    profile data is directly transmitted.
                  </p>
                </section>
              </div>

              {/* Part 3 */}
              <div className='mt-20'>
                <PartHeader
                  part='Part 3'
                  title='A note on cookies'
                  description='What they are, why we use them, and the types you may encounter on the Site.'
                />
                <section id='cookies' className='scroll-mt-24 space-y-6 text-gray-700 leading-relaxed text-[15px]'>
                  <p>
                    We use cookies on our websites. Cookies are small text
                    files that are stored on your device and can be read by us.
                    There are two types:
                  </p>
                  <div className='grid sm:grid-cols-2 gap-x-8 gap-y-4'>
                    <div className='border-l-2 border-gray-200 pl-4'>
                      <p
                        className='text-gray-900 mb-1'
                        style={{ fontWeight: 600 }}
                      >
                        Session cookies
                      </p>
                      <p className='text-gray-500 text-sm'>
                        Deleted automatically when you close your browser.
                      </p>
                    </div>
                    <div className='border-l-2 border-gray-200 pl-4'>
                      <p
                        className='text-gray-900 mb-1'
                        style={{ fontWeight: 600 }}
                      >
                        Permanent cookies
                      </p>
                      <p className='text-gray-500 text-sm'>
                        Remain on your device beyond a single session.
                      </p>
                    </div>
                  </div>

                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 pt-4"
                    style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.01em' }}
                  >
                    What are cookies?
                  </h3>
                  <p>
                    Cookies and similar technologies are small text files or
                    pieces of code that often contain a unique identification
                    code. When you visit a website or use a mobile application,
                    the site requests permission to save this file on your
                    device, allowing it to access specific information. The
                    data collected through cookies may include the time and
                    date of your visit and how you use a particular website or
                    mobile application.
                  </p>

                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 pt-4"
                    style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.01em' }}
                  >
                    Why do we use cookies?
                  </h3>
                  <p>Cookies ensure that during your visit to our online shop:</p>
                  <ul className='space-y-1.5 list-disc pl-5 marker:text-gray-300'>
                    <li>You remain logged in.</li>
                    <li>Items remain in your shopping cart.</li>
                    <li>You can shop safely and the site functions smoothly.</li>
                  </ul>
                  <p>
                    Additionally, cookies help us analyse website usage to
                    improve our services. Based on your preferences, our
                    cookies may also be used to display targeted advertisements
                    that match your personal interests.
                  </p>

                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 pt-4"
                    style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.01em' }}
                  >
                    Types of cookies we use
                  </h3>
                  <dl className='border border-gray-200 rounded-xl divide-y divide-gray-100'>
                    {[
                      {
                        title: 'Unclassified',
                        desc: 'Cookies in the process of being categorised. They will eventually be classified as Necessary, Performance, Functional, or Advertising.',
                      },
                      {
                        title: 'Necessary',
                        desc: 'Essential for the website to function — storing items in your cart, saving cookie preferences, remembering language settings, and checking if you are logged in.',
                      },
                      {
                        title: 'Performance',
                        desc: 'Collect statistical data about how our website is used, which helps us optimise website performance.',
                      },
                      {
                        title: 'Functional',
                        desc: 'Provide enhanced functionality such as live chat, online videos, social sharing, and social login.',
                      },
                      {
                        title: 'Advertising / tracking',
                        desc: 'Set by external advertising partners and used for profiling, tracking across websites, and measuring ad campaign effectiveness.',
                      },
                    ].map((c, i) => (
                      <div
                        key={i}
                        className='grid grid-cols-[140px_1fr] gap-6 px-5 py-4'
                      >
                        <dt
                          className='text-gray-900 text-[14px]'
                          style={{ fontWeight: 600 }}
                        >
                          {c.title}
                        </dt>
                        <dd className='text-gray-600 text-[14px] leading-relaxed'>
                          {c.desc}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>

              {/* Footer CTA */}
              <div className='mt-20 border-t border-gray-200 pt-12'>
                <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6'>
                  <div className='max-w-md'>
                    <h3
                      className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                      style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.015em' }}
                    >
                      Questions about your privacy?
                    </h3>
                    <p className='text-gray-500 text-[15px] leading-relaxed'>
                      Our team is happy to help. We usually reply within one
                      working day.
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
                      to='/contact'
                      className='inline-flex items-center gap-2 border border-gray-300 hover:border-gray-900 text-gray-900 px-5 py-2.5 rounded-lg text-sm transition-colors'
                      style={{ fontWeight: 500 }}
                    >
                      Contact form
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
