import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';

const sections = [
  { id: 'who-we-are', label: '1.1 Who we are' },
  { id: 'data-collected', label: '1.2 Personal data we collect' },
  { id: 'how-we-use', label: '1.3 How we use your data' },
  { id: 'automated', label: '1.4 Automated decision-making' },
  { id: 'sharing', label: '1.5 Who we share data with' },
  { id: 'transfers', label: '1.6 International transfers' },
  { id: 'retention', label: '1.7 Data retention periods' },
  { id: 'rights', label: '1.8 Your rights' },
  { id: 'security', label: '1.9 Security' },
  { id: 'changes', label: '1.10 Changes to this Policy' },
  { id: 'contact', label: '1.11 Contact' },
  { id: 'accounts', label: '2. Customer Accounts' },
  { id: 'cookies', label: '3. Note on Cookies' },
];

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      <main className='flex-1'>
        {/* Hero */}
        <div className='bg-[#FFF5FB] border-b border-[#f63a9e]/20'>
          <div className='max-w-[1400px] mx-auto px-6 md:px-12 py-16'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='flex flex-col items-center text-center'
            >
              <div className='w-20 h-20 rounded-2xl bg-[#f63a9e] flex items-center justify-center shadow-xl mb-6'>
                <Shield className='w-10 h-10 text-white' />
              </div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                style={{
                  fontSize: '40px',
                  fontWeight: '800',
                  lineHeight: '1.2',
                }}
              >
                Privacy Policy
              </h1>
              <p className='text-gray-500 max-w-2xl text-lg'>
                At Photify.co, we value your privacy and are committed to
                safeguarding your personal data. This Privacy Policy explains
                how we process your personal information when you use our
                services, contact us, or interact with us online or offline.
              </p>
              <p className='text-sm text-gray-400 mt-4'>
                Last updated: February 2026
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className='max-w-[1400px] mx-auto px-6 md:px-12 py-16'>
          <div className='flex flex-col lg:flex-row gap-12'>
            {/* Sidebar TOC */}
            <aside className='lg:w-72 flex-shrink-0'>
              <div className='sticky top-8 bg-[#FFF5FB] border border-[#f63a9e]/20 rounded-2xl p-6'>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                  style={{ fontWeight: '700', fontSize: '16px' }}
                >
                  Table of Contents
                </p>
                <ul className='space-y-1'>
                  {sections.map(s => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className='flex items-center gap-2 text-sm text-gray-600 hover:text-[#f63a9e] transition-colors py-1'
                      >
                        <ChevronRight className='w-3 h-3 flex-shrink-0 text-[#f63a9e]' />
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main content */}
            <div className='flex-1 max-w-3xl space-y-14 text-gray-700 leading-relaxed'>
              {/* Section 1 */}
              <section>
                <h2
                  id='section-1'
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '26px', fontWeight: '700' }}
                >
                  1. Which Personal Data Do We Process?
                </h2>

                <div id='who-we-are' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.1 Who we are
                  </h3>
                  <p className='mb-4'>
                    Photify Limited (&qout;Photify&qout;, &qout;we&qout;, &qout;our&qout;, &qout;us&qout;) is a company
                    registered in England and Wales.
                  </p>
                  <ul className='space-y-2 ml-4'>
                    <li className='flex items-start gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                      <span>
                        <strong>Registered office:</strong> London, United
                        Kingdom
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                      <span>
                        <strong>Company number:</strong> 16119644
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                      <span>
                        <strong>Website:</strong>{' '}
                        <a
                          href='https://www.photify.co'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-[#f63a9e] hover:underline'
                        >
                          https://www.photify.co
                        </a>{' '}
                        (the &quot;Site&quot;)
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                      <span>
                        <strong>Contact email:</strong>{' '}
                        <a
                          href='mailto:support@photify.co'
                          className='text-[#f63a9e] hover:underline'
                        >
                          support@photify.co
                        </a>
                      </span>
                    </li>
                  </ul>
                  <p className='mt-4'>
                    We sell custom photo prints to customers in the United
                    Kingdom only. We do not knowingly target or market to
                    children under 16, EU/EEA residents (outside the UK), or
                    California residents.
                  </p>
                </div>

                <div id='data-collected' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.2 Personal data we collect
                  </h3>
                  <div className='overflow-x-auto rounded-xl border border-gray-200 shadow-sm'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='bg-[#f63a9e] text-white'>
                          <th className='px-4 py-3 text-left font-semibold'>
                            Category
                          </th>
                          <th className='px-4 py-3 text-left font-semibold'>
                            Examples
                          </th>
                          <th className='px-4 py-3 text-left font-semibold'>
                            Purpose
                          </th>
                          <th className='px-4 py-3 text-left font-semibold'>
                            Lawful basis (UK GDPR Art. 6)
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100'>
                        {[
                          {
                            category: 'Identity & contact',
                            examples:
                              'Name, phone number, email, postal address',
                            purpose:
                              'Create your order, deliver prints, communicate about your purchase',
                            basis: 'Contract (perform our contract with you)',
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
                            basis: 'Contract; Legal obligation (prevent fraud)',
                          },
                          {
                            category: 'Usage data',
                            examples:
                              'IP address, browser type, pages viewed, events (via Google Analytics & Hotjar)',
                            purpose:
                              'Improve the Site, detect issues, measure marketing',
                            basis: 'Contract (perform our contract with you)',
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
                            basis:
                              'Legitimate interests (security, fraud prevention)',
                          },
                        ].map((row, i) => (
                          <tr
                            key={i}
                            className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className='px-4 py-3 font-medium text-gray-900'>
                              {row.category}
                            </td>
                            <td className='px-4 py-3 text-gray-600'>
                              {row.examples}
                            </td>
                            <td className='px-4 py-3 text-gray-600'>
                              {row.purpose}
                            </td>
                            <td className='px-4 py-3 text-gray-600'>
                              {row.basis}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div id='how-we-use' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.3 How we use your data
                  </h3>
                  <p className='mb-4'>
                    We use your data primarily for order fulfilment, which
                    involves receiving your images, printing them, packaging
                    your order, and dispatching it to you. Additionally, we
                    provide customer support by responding to your enquiries and
                    handling service-related emails.
                  </p>
                  <p className='mb-4'>
                    To improve our services and understand how visitors use our
                    Site, we analyse website traffic and user behaviour through
                    tools like Google Analytics and Hotjar. When you give your
                    consent, we also use your information to deliver marketing
                    communications, including ads on Meta platforms and
                    promotional emails.
                  </p>
                  <p>
                    Finally, we employ automated monitoring of payment
                    transactions and website traffic patterns to enhance
                    security and prevent fraud, helping to protect both our
                    users and our business.
                  </p>
                </div>

                <div id='automated' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.4 Automated decision-making
                  </h3>
                  <p>
                    We apply automated checks (via Stripe Radar and similar
                    fraud-detection triggers) to flag or block potentially
                    fraudulent transactions. These decisions do not produce
                    legal or similarly significant effects on individuals; a
                    human review is available on request.
                  </p>
                </div>

                <div id='sharing' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.5 Who we share data with
                  </h3>
                  <div className='overflow-x-auto rounded-xl border border-gray-200 shadow-sm mb-4'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='bg-[#f63a9e] text-white'>
                          <th className='px-4 py-3 text-left font-semibold'>
                            Recipient
                          </th>
                          <th className='px-4 py-3 text-left font-semibold'>
                            Role
                          </th>
                          <th className='px-4 py-3 text-left font-semibold'>
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
                            recipient: 'Google Analytics / Google LLC',
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
                            safeguards:
                              'Malta/EEA; SCCs for any third-country processing',
                          },
                          {
                            recipient: 'Couriers (e.g., Royal Mail, DPD)',
                            role: 'Deliver your prints',
                            safeguards: 'Address & contact info only',
                          },
                          {
                            recipient: 'IT service providers',
                            role: 'Hosting, backup, maintenance',
                            safeguards: 'UK/EU servers where possible',
                          },
                        ].map((row, i) => (
                          <tr
                            key={i}
                            className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className='px-4 py-3 font-medium text-gray-900'>
                              {row.recipient}
                            </td>
                            <td className='px-4 py-3 text-gray-600'>
                              {row.role}
                            </td>
                            <td className='px-4 py-3 text-gray-600'>
                              {row.safeguards}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className='font-semibold text-gray-900 bg-[#FFF5FB] border border-[#f63a9e]/30 rounded-xl px-4 py-3'>
                    We never sell your personal data.
                  </p>
                </div>

                <div id='transfers' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.6 International transfers
                  </h3>
                  <p className='mb-3'>
                    Where providers transfer data outside the UK (e.g., to the
                    US), we rely on:
                  </p>
                  <ul className='space-y-2 ml-4'>
                    <li className='flex items-start gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                      An adequacy decision (UK Extension to the EU–US Data
                      Privacy Framework); or
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                      UK International Data Transfer Addendum to EU Standard
                      Contractual Clauses.
                    </li>
                  </ul>
                </div>

                <div id='retention' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.7 Data retention periods
                  </h3>
                  <div className='overflow-x-auto rounded-xl border border-gray-200 shadow-sm'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='bg-[#f63a9e] text-white'>
                          <th className='px-4 py-3 text-left font-semibold'>
                            Data type
                          </th>
                          <th className='px-4 py-3 text-left font-semibold'>
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
                            type: 'Order information (including address, phone, email, payment tokens)',
                            period:
                              '1 year from dispatch, then securely deleted/anonymised (required for tax & warranty queries)',
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
                            period:
                              'Up to 26 months, per Google Analytics settings',
                          },
                        ].map((row, i) => (
                          <tr
                            key={i}
                            className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className='px-4 py-3 font-medium text-gray-900'>
                              {row.type}
                            </td>
                            <td className='px-4 py-3 text-gray-600'>
                              {row.period}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div id='rights' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.8 Your rights (UK GDPR / Data Protection Act 2018)
                  </h3>
                  <p className='mb-4'>You can:</p>
                  <ul className='space-y-3 ml-4'>
                    {[
                      'Request access to the personal data we hold about you.',
                      'Ask us to correct inaccurate or incomplete data.',
                      'Ask for deletion ("right to be forgotten") where legal grounds permit.',
                      'Object to or restrict our processing in certain circumstances.',
                      'Receive a copy of the data you provided to us in a structured, machine-readable format ("data portability").',
                      "Lodge a complaint with the UK Information Commissioner's Office (ICO) if you believe we've mishandled your data.",
                    ].map((right, i) => (
                      <li key={i} className='flex items-start gap-2'>
                        <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                        {right}
                      </li>
                    ))}
                  </ul>
                  <p className='mt-4'>
                    To exercise any of these rights, email{' '}
                    <a
                      href='mailto:support@photify.co'
                      className='text-[#f63a9e] hover:underline'
                    >
                      support@photify.co
                    </a>
                    .
                  </p>
                </div>

                <div id='security' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.9 Security
                  </h3>
                  <p>
                    We use TLS encryption, tokenised payments (Stripe),
                    least-privilege access controls, periodic penetration
                    testing, and secure deletion routines to protect your
                    information.
                  </p>
                </div>

                <div id='changes' className='scroll-mt-8 mb-10'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.10 Changes to this Policy
                  </h3>
                  <p>
                    We may update this notice from time to time. We&apos;ll post the
                    revised version and, if changes are material, notify you via
                    email or a prominent Site banner.
                  </p>
                </div>

                <div id='contact' className='scroll-mt-8'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                    style={{ fontSize: '20px', fontWeight: '700' }}
                  >
                    1.11 Contact
                  </h3>
                  <p>
                    For privacy questions, email{' '}
                    <a
                      href='mailto:support@photify.co'
                      className='text-[#f63a9e] hover:underline'
                    >
                      support@photify.co
                    </a>{' '}
                    or write to Photify Limited, London, United Kingdom.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <h2
                  id='accounts'
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6 pb-3 border-b-2 border-[#f63a9e]/30 scroll-mt-8"
                  style={{ fontSize: '26px', fontWeight: '700' }}
                >
                  2. Customer Accounts
                </h2>
                <p className='mb-6'>
                  Creating a customer account requires basic personal
                  information like your name, address, email, and password. This
                  data allows us to simplify order placements and manage your
                  preferences. You can update or delete your account at any
                  time, and your data will be removed unless required for legal
                  or outstanding obligations.
                </p>

                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{ fontSize: '20px', fontWeight: '700' }}
                >
                  2.1 How Photify.co Uses Your Data
                </h3>
                <p className='mb-4'>
                  We process your personal data in compliance with data
                  protection laws, particularly the principles outlined in GDPR.
                  Your data is used only for purposes communicated in our
                  Privacy Policy or those explained at the time of collection.
                  This includes order processing, personalization, service
                  development, and ensuring security. We also use your data
                  under strict European laws for product development, scientific
                  research (AI, machine learning, and deep learning), and market
                  analysis.
                </p>
                <p className='mb-4'>
                  For order processing, we collect personal information such as
                  your name, email address, and image files to fulfill your
                  requests. This data is used to keep you updated on order
                  status, provide relevant product information, and analyze
                  trends. Image files are deleted after three months unless
                  extended retention is necessary for customer support.
                  Additionally, we use your data to optimize business
                  operations, design tailored services, and deliver personalized
                  advertising.
                </p>
                <p className='mb-4'>
                  To enhance your shopping experience, we share data with select
                  service providers under GDPR regulations. This enables
                  efficient payment processing, shipping, and marketing
                  insights. For instance, shipping providers like DHL, EVRI or
                  UPS receive your address, while payment platforms like PayPal
                  ensure smooth transactions. Data sharing is strictly limited
                  to fulfilling your order or improving our services.
                </p>
                <p>
                  We also use marketing tools such as Google Analytics, Adobe
                  Media Optimizer, and retargeting technologies to understand
                  customer preferences and optimize our website. Social media
                  plugins are intentionally excluded to prevent automatic data
                  transfers, protecting your privacy. While you can manually
                  share pages on platforms like Facebook, no user profile data
                  is directly transmitted.
                </p>
              </section>

              {/* Section 3 */}
              <section>
                <h2
                  id='cookies'
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-6 pb-3 border-b-2 border-[#f63a9e]/30 scroll-mt-8"
                  style={{ fontSize: '26px', fontWeight: '700' }}
                >
                  3. Note on Cookies
                </h2>
                <p className='mb-4'>
                  We use cookies on our websites. Cookies are small text files
                  that are stored on your device and can be read by us. There
                  are two types of cookies:
                </p>
                <ul className='space-y-2 ml-4 mb-6'>
                  <li className='flex items-start gap-2'>
                    <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                    <span>
                      <strong>Session Cookies:</strong> These are deleted when
                      you close your browser.
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                    <span>
                      <strong>Permanent Cookies:</strong> These remain on your
                      device beyond a single session.
                    </span>
                  </li>
                </ul>

                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{ fontSize: '20px', fontWeight: '700' }}
                >
                  What Are Cookies?
                </h3>
                <p className='mb-6'>
                  Cookies and similar technologies are small text files or
                  pieces of code that often contain a unique identification
                  code. When you visit a website or use a mobile application,
                  the site requests permission to save this file on your device,
                  allowing it to access specific information. The data collected
                  through cookies may include the time and date of your visit
                  and how you use a particular website or mobile application.
                </p>

                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{ fontSize: '20px', fontWeight: '700' }}
                >
                  Why Do We Use Cookies?
                </h3>
                <p className='mb-3'>
                  Cookies ensure that during your visit to our online shop:
                </p>
                <ul className='space-y-2 ml-4 mb-4'>
                  {[
                    'You remain logged in.',
                    'Items remain in your shopping cart.',
                    'You can shop safely, and the website functions smoothly.',
                  ].map((item, i) => (
                    <li key={i} className='flex items-start gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0' />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className='mb-6'>
                  Additionally, cookies help us analyze website usage to improve
                  our services. Based on your preferences, our cookies may also
                  be used to display targeted advertisements that match your
                  personal interests.
                </p>

                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                  style={{ fontSize: '20px', fontWeight: '700' }}
                >
                  What Types of Cookies Do We Use?
                </h3>
                <div className='space-y-4'>
                  {[
                    {
                      title: '1. Unclassified Cookies',
                      desc: 'These are cookies that are in the process of being categorized. They will eventually be classified under one of the following categories: Necessary, Performance, Functional, or Advertising.',
                    },
                    {
                      title: '2. Necessary Cookies',
                      desc: 'These are essential for the website to function properly. They enable actions such as storing items in your shopping cart, saving your cookie preferences, remembering your language settings, and checking if you are logged in.',
                    },
                    {
                      title: '3. Performance Cookies',
                      desc: 'These collect statistical data about how our website is used, which helps us optimize website performance.',
                    },
                    {
                      title: '4. Functional Cookies',
                      desc: 'These cookies provide enhanced functionality, such as live chat services, viewing online videos, social media sharing buttons, and logging in using social media accounts.',
                    },
                    {
                      title: '5. Advertising / Tracking Cookies',
                      desc: 'These cookies are set by external advertising partners and are used for profiling and tracking across websites. They help us show you relevant ads based on your user profile and preferences, and they track the effectiveness of our ad campaigns.',
                    },
                  ].map((cookie, i) => (
                    <div
                      key={i}
                      className='bg-gray-50 rounded-xl p-5 border border-gray-200'
                    >
                      <h4
                        className='text-gray-900 mb-2'
                        style={{ fontWeight: '700' }}
                      >
                        {cookie.title}
                      </h4>
                      <p className='text-gray-600 text-sm'>{cookie.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <div className='bg-[#FFF5FB] border-2 border-[#f63a9e]/30 rounded-2xl p-8 text-center'>
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  Questions about your privacy?
                </h3>
                <p className='text-gray-600 mb-6'>
                  We&apos;re here to help. Reach out to our team and we&apos;ll respond as
                  quickly as possible.
                </p>
                <Link
                  to='/contact'
                  className='inline-flex items-center gap-2 bg-[#f63a9e] text-white px-8 py-3 rounded-xl hover:bg-[#e02d8d] transition-colors font-semibold'
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
