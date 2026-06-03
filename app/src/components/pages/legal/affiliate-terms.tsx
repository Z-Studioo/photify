import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Handshake, Mail, ArrowUpRight, Sparkles } from 'lucide-react';

type SectionItem = { id: string; label: string; number: string };

const sections: SectionItem[] = [
  { id: 'overview', label: 'Overview', number: '0' },
  { id: 'eligibility', label: 'Eligibility & application', number: '1' },
  { id: 'commission', label: 'Commission & attribution', number: '2' },
  { id: 'payouts', label: 'Holding period & payouts', number: '3' },
  { id: 'brand-bidding', label: 'Paid ads & brand bidding', number: '4' },
  { id: 'disclosure', label: 'Disclosure obligations', number: '5' },
  { id: 'acceptable-use', label: 'Acceptable promotion', number: '6' },
  { id: 'prohibited', label: 'Prohibited conduct', number: '7' },
  { id: 'tax', label: 'Tax & financial responsibility', number: '8' },
  { id: 'trademark', label: 'Trademark & content use', number: '9' },
  { id: 'confidentiality', label: 'Confidentiality', number: '10' },
  { id: 'termination', label: 'Suspension & termination', number: '11' },
  { id: 'liability', label: 'Liability & indemnity', number: '12' },
  { id: 'changes', label: 'Changes to these terms', number: '13' },
  { id: 'governing', label: 'Governing law', number: '14' },
  { id: 'contact', label: 'Contact', number: '15' },
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

function KeyTermCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className='rounded-xl border border-gray-200 bg-white p-4'>
      <p
        className='text-[10.5px] uppercase tracking-[0.18em] text-gray-400 mb-2'
        style={{ fontWeight: 600 }}
      >
        {label}
      </p>
      <p
        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-1"
        style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}
      >
        {value}
      </p>
      <p className='text-gray-500 text-[12.5px] leading-snug'>{hint}</p>
    </div>
  );
}

export function AffiliateTermsPage() {
  const [activeId, setActiveId] = useState<string>(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop
          );
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: [0, 1] }
    );
    sections.forEach((s) => {
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
                <Handshake className='w-4 h-4 text-[#f63a9e]' />
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-gray-500'
                  style={{ fontWeight: 600 }}
                >
                  Affiliate Program Terms
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
                The deal between you and Photify.
              </h1>
              <p className='text-gray-600 text-[17px] leading-relaxed mb-6'>
                These Affiliate Program Terms set out the rules for partners
                who promote Photify in exchange for commission. They sit
                alongside our{' '}
                <Link
                  to='/terms-of-use'
                  className='text-[#f63a9e] underline-offset-4 hover:underline'
                  style={{ fontWeight: 500 }}
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to='/privacy-policy'
                  className='text-[#f63a9e] underline-offset-4 hover:underline'
                  style={{ fontWeight: 500 }}
                >
                  Privacy Policy
                </Link>
                . When you submit an application, click an approval link, or
                share your referral URL, you accept these terms.
              </p>
              <p className='text-sm text-gray-400'>
                Last updated 29 May 2026 ·{' '}
                <a
                  href='mailto:partners@photify.co'
                  className='text-gray-500 hover:text-[#f63a9e] underline-offset-4 hover:underline'
                >
                  partners@photify.co
                </a>
              </p>
            </motion.div>

            {/* Quick reference */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className='mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl'
            >
              <KeyTermCard
                label='Commission'
                value='10%'
                hint='Of every paid order subtotal'
              />
              <KeyTermCard
                label='Attribution'
                value='30 days'
                hint='Last-click cookie window'
              />
              <KeyTermCard
                label='Holding period'
                value='14 days'
                hint='After delivery, before approval'
              />
              <KeyTermCard
                label='Min payout'
                value='£50'
                hint='Approved balance, paid monthly'
              />
            </motion.div>
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
                  {sections.map((s) => {
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
                  <p className='text-xs text-gray-500 mb-2'>Partner team</p>
                  <a
                    href='mailto:partners@photify.co'
                    className='inline-flex items-center gap-1.5 text-[13px] text-gray-900 hover:text-[#f63a9e]'
                    style={{ fontWeight: 500 }}
                  >
                    <Mail className='w-3.5 h-3.5' />
                    partners@photify.co
                  </a>
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
                  Photify Affiliate Program Terms
                </h2>
                <p className='text-gray-500 text-[16px] leading-relaxed max-w-2xl'>
                  This agreement is made between Photify (&ldquo;Photify&rdquo;,
                  &ldquo;we&rdquo;, &ldquo;us&rdquo;) and you, the affiliate
                  partner (&ldquo;you&rdquo;, &ldquo;Partner&rdquo;), and
                  governs your participation in the Photify Affiliate Program
                  (the &ldquo;Program&rdquo;).
                </p>
              </div>

              <div className='space-y-14'>
                <SubSection id='overview' number='00' title='Overview'>
                  <p>
                    The Program lets approved partners earn commission for
                    referring paying customers to Photify through a unique
                    referral link of the form{' '}
                    <code className='px-1.5 py-0.5 rounded bg-gray-100 text-[13px] text-gray-700 font-mono'>
                      photify.co/r/YOURCODE
                    </code>
                    . These terms describe how that commission is earned,
                    tracked, paid, and (where applicable) reversed.
                  </p>
                  <p>
                    Please read these terms carefully. If you do not agree to
                    them, do not apply to or participate in the Program.
                  </p>
                </SubSection>

                <SubSection
                  id='eligibility'
                  number='01'
                  title='Eligibility & application'
                >
                  <BulletList
                    items={[
                      'You must be at least 18 years old (or the age of majority in your jurisdiction) and legally capable of entering binding contracts.',
                      'You must apply through the Photify website and be approved in writing (including by approval email) before you may use the Program.',
                      'We may decline or revoke your application at our discretion. Approval is granted on a case-by-case basis and is not automatic.',
                      'You may apply as an individual, sole trader, or company. The party that applies is the party bound by these terms; you may not transfer your account to another person without our written consent.',
                      'Photify employees, contractors, and members of their immediate household are not eligible to participate.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='commission'
                  number='02'
                  title='Commission & attribution'
                >
                  <BulletList
                    items={[
                      <>
                        <strong>Rate.</strong> You earn{' '}
                        <strong>10% commission</strong> on the subtotal of every
                        paid order placed by a Qualifying Customer. Subtotal
                        excludes shipping, delivery, taxes, gift cards, and any
                        amount paid using store credit or refunds.
                      </>,
                      <>
                        <strong>Attribution window.</strong> A customer becomes
                        a Qualifying Customer when they click your referral
                        link and place a paid order within{' '}
                        <strong>30 days</strong> on the same browser, on a
                        last-click basis. If a customer clicks multiple
                        affiliate links during the window, the most recent
                        click wins.
                      </>,
                      <>
                        <strong>Auto-discount.</strong> Your audience may
                        automatically receive a small discount on first order
                        when they land via your link. The discount is funded by
                        Photify and does not reduce your commissionable
                        subtotal unless we tell you otherwise in writing.
                      </>,
                      <>
                        <strong>No stacking.</strong> Commission is not paid on
                        orders placed by you on your own accounts, by your
                        immediate household, or where the customer used a
                        wholesale, employee, or partner discount we did not
                        sanction for the Program.
                      </>,
                      <>
                        <strong>Currency.</strong> Commission is calculated and
                        paid in pounds sterling (GBP). Where an order is placed
                        in another currency, we use the exchange rate captured
                        at order time.
                      </>,
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='payouts'
                  number='03'
                  title='Holding period & payouts'
                >
                  <BulletList
                    items={[
                      <>
                        <strong>Pending → approved.</strong> Commissions remain
                        in &ldquo;pending&rdquo; status for{' '}
                        <strong>14 days after the order is delivered</strong>{' '}
                        to cover the standard refund window. After that period
                        with no refund, the commission flips to
                        &ldquo;approved&rdquo; and becomes eligible for
                        payout.
                      </>,
                      <>
                        <strong>Refunds & cancellations.</strong> If an order
                        is fully or partially refunded, the affected
                        commission does not accrue, or is reduced
                        proportionally. We do not claw back commissions that
                        have already been paid out, except in cases of fraud,
                        misrepresentation, or breach of these terms.
                      </>,
                      <>
                        <strong>Payout schedule.</strong> Approved balances
                        above the minimum threshold of <strong>£50</strong>{' '}
                        are paid monthly, on or around the 1st of the
                        following month, by bank transfer (BACS, SEPA, or
                        international wire) to the account you provide.
                        Balances below £50 roll over to the next month.
                      </>,
                      <>
                        <strong>Bank details.</strong> You are responsible for
                        keeping your payout details up to date in your
                        affiliate dashboard. We are not liable for failed or
                        misdirected transfers caused by incorrect bank
                        information.
                      </>,
                      <>
                        <strong>Dormant accounts.</strong> If your account is
                        inactive (no clicks, sales, or logins) for 12
                        consecutive months and your approved balance is below
                        £50, we may close the account and forfeit the
                        remaining balance, as permitted by law.
                      </>,
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='brand-bidding'
                  number='04'
                  title='Paid ads & brand bidding'
                >
                  <p>
                    To protect our brand and the customer experience, the
                    following rules apply to any paid traffic you direct to
                    Photify:
                  </p>
                  <BulletList
                    items={[
                      <>
                        You may not bid on the keyword{' '}
                        <strong>&ldquo;Photify&rdquo;</strong>, common
                        misspellings, translations, or any combination
                        containing it (e.g. &ldquo;photify uk&rdquo;,
                        &ldquo;photify discount&rdquo;) on Google Ads,
                        Microsoft Ads, Meta search, TikTok Search, or any
                        comparable platform.
                      </>,
                      'You may not run ads that direct to Photify URLs from a domain that contains "photify" or any visually similar variant.',
                      'You may not impersonate Photify in any ad, landing page, social profile, or email — including using our logo, brand colours, or copy in a way that suggests an official Photify account.',
                      'You may run paid ads on your own brand, your own audience, or relevant non-brand keywords, provided the landing page is yours and clearly belongs to you.',
                      'Commissions on traffic that violates this section will be reversed without notice and may result in immediate termination from the Program.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='disclosure'
                  number='05'
                  title='Disclosure obligations'
                >
                  <BulletList
                    items={[
                      'You must clearly and conspicuously disclose your affiliate relationship with Photify wherever you share your referral link, in line with the FTC Endorsement Guides (US), the ASA / CAP Code (UK), and any equivalent rules in your jurisdiction.',
                      'Acceptable disclosures include #ad, #affiliate, "paid partnership", "Photify partner", or a clear written line such as "I earn a commission when you order through this link". Disclosures must be visible without expanding "more" or hovering.',
                      'You are solely responsible for compliance with applicable consumer protection, advertising, and disclosure laws in every jurisdiction where you promote.',
                      'We may request that you remove or amend non-compliant promotional content. Failure to comply may result in suspension or termination.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='acceptable-use'
                  number='06'
                  title='Acceptable promotion'
                >
                  <p>You may promote Photify through:</p>
                  <BulletList
                    items={[
                      'Your own websites, blogs, newsletters, and email lists where recipients have opted in.',
                      'Your own social media accounts and creator profiles (Instagram, TikTok, YouTube, Pinterest, etc.).',
                      'In-person recommendations, studio handovers, client galleries, and post-session client emails.',
                      'Honest reviews, gift guides, comparison content, and tutorials that genuinely use or recommend our products.',
                      'Paid ads on your own brand or non-brand keywords, in compliance with section 4.',
                    ]}
                  />
                  <p>
                    All promotion must be honest, accurate, and reflect your
                    genuine view of our products. You must not make claims
                    about Photify, our products, pricing, delivery times, or
                    refund policy that are inaccurate or misleading.
                  </p>
                </SubSection>

                <SubSection
                  id='prohibited'
                  number='07'
                  title='Prohibited conduct'
                  description='You agree not to do any of the following while participating in the Program.'
                >
                  <ul className='border border-gray-200 rounded-xl divide-y divide-gray-100 text-[14.5px]'>
                    {[
                      'Self-referrals, including placing orders for yourself, members of your household, or accounts you control.',
                      'Cookie stuffing, forced clicks, hidden iframes, or any technique that drops a referral cookie without a deliberate user click.',
                      'Coupon-site or cashback-site posting unless we have approved you specifically for that channel in writing.',
                      'Unsolicited email, SMS, or DM spam, or posting to forums, comment sections, or groups against their rules.',
                      'Trademark infringement, including registering domains, social handles, or app names containing "Photify" or close variants.',
                      'Misrepresenting our pricing, refund policy, delivery times, or product specifications.',
                      'Reverse-engineering, scraping, or automated access to our affiliate system, dashboard, or order data beyond what is exposed to you.',
                      'Operating sub-affiliate networks, sharing your referral link with networks, or sub-licensing your commission rate without our prior written consent.',
                    ].map((item, i) => (
                      <li
                        key={i}
                        className='flex items-center gap-4 px-4 py-3'
                      >
                        <span
                          className='text-gray-400 tabular-nums text-xs w-6'
                          style={{ fontWeight: 500 }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className='text-gray-700'>{item}</span>
                      </li>
                    ))}
                  </ul>
                </SubSection>

                <SubSection
                  id='tax'
                  number='08'
                  title='Tax & financial responsibility'
                >
                  <BulletList
                    items={[
                      'You are an independent contractor. Nothing in these terms creates an employment, partnership, joint venture, or agency relationship between you and Photify.',
                      'Commissions are paid gross of any income tax, VAT, GST, withholding, social charges, or equivalent obligations. You are solely responsible for declaring and paying any tax due in your jurisdiction(s) of residence.',
                      'If you are VAT-registered or otherwise required to issue invoices, please share your VAT/tax ID with us before payout so we can label payments correctly. We do not issue 1099s, P60s or equivalent forms unless required by law.',
                      'You agree to indemnify Photify against any tax claim, penalty, or interest arising from your failure to declare or pay tax due on your commissions.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='trademark'
                  number='09'
                  title='Trademark & content use'
                >
                  <BulletList
                    items={[
                      'During the term of these terms and subject to your compliance, we grant you a limited, non-exclusive, non-transferable, revocable licence to use the Photify name, logo, product images, and approved marketing assets solely for the purpose of promoting Photify under the Program.',
                      'You must use our brand assets exactly as supplied and must not modify, animate, recolour, or combine them with other marks in a way that creates confusion.',
                      'Any goodwill arising from your use of our brand assets vests exclusively in Photify.',
                      'You retain all rights in content you create (e.g. photos, videos, blog posts, reviews). You grant Photify a non-exclusive, royalty-free licence to repost, quote, and link to that content for the purpose of promoting the Program and the partnership, with appropriate credit.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='confidentiality'
                  number='10'
                  title='Confidentiality'
                >
                  <p>
                    You may receive non-public information from us — for
                    example, conversion rates, internal pricing, upcoming
                    promotions, product roadmap items, or customer-level data
                    surfaced in your dashboard. You agree to keep that
                    information confidential, to use it only to operate as a
                    Photify partner, and not to disclose it to third parties
                    without our prior written consent. This obligation
                    survives the end of these terms for two years.
                  </p>
                </SubSection>

                <SubSection
                  id='termination'
                  number='11'
                  title='Suspension & termination'
                >
                  <BulletList
                    items={[
                      'You may pause or close your affiliate account at any time from your dashboard or by emailing partners@photify.co. Any approved balance above the minimum will be paid out on the next scheduled payout date.',
                      'We may suspend or terminate your participation in the Program at any time, with or without notice, if we reasonably believe you have breached these terms, engaged in fraud, harmed our brand, or otherwise acted against the spirit of the partnership.',
                      'On termination, your right to use our brand assets and your referral link ends immediately. You agree to remove our marks and any affiliate disclosures relating to active promotions within a reasonable time.',
                      'Pending commissions associated with terminated accounts may be forfeited where termination is for cause (fraud, brand abuse, repeated breach). Otherwise, accrued commissions are paid out on the normal schedule.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='liability'
                  number='12'
                  title='Liability & indemnity'
                >
                  <BulletList
                    items={[
                      'The Program is provided on an "as is" basis. We do not guarantee any specific number of clicks, sales, or earnings, and we may change product pricing, the discount level, or commission rates with reasonable notice.',
                      'To the fullest extent permitted by law, Photify\'s aggregate liability to you under or in connection with the Program is limited to the total commissions paid or payable to you in the 12 months preceding the event giving rise to the claim.',
                      'We are not liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, audience, or goodwill, even if we were advised of the possibility of such damages.',
                      'You agree to indemnify and hold Photify harmless from any claim, loss, damage, or expense (including reasonable legal fees) arising from your breach of these terms, your promotional activity, your tax obligations, or your violation of any law or third-party right.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='changes'
                  number='13'
                  title='Changes to these terms'
                >
                  <p>
                    We may update these terms from time to time as the Program
                    evolves. We&apos;ll post the updated version here and, for
                    material changes, email you at the address on your
                    affiliate account at least 14 days before the new terms
                    take effect. Your continued participation after the
                    effective date constitutes acceptance of the updated
                    terms.
                  </p>
                </SubSection>

                <SubSection id='governing' number='14' title='Governing law'>
                  <p>
                    These terms are governed by the laws of England and Wales.
                    The courts of England and Wales have exclusive
                    jurisdiction to resolve any dispute or claim arising out
                    of or in connection with them, except that we may bring
                    proceedings in your local courts to enforce our rights.
                  </p>
                </SubSection>

                <SubSection id='contact' number='15' title='Contact'>
                  <p>
                    Questions about these terms, your account, payouts, or a
                    specific commission? Email{' '}
                    <a
                      href='mailto:partners@photify.co'
                      className='text-[#f63a9e] underline-offset-4 hover:underline'
                    >
                      partners@photify.co
                    </a>{' '}
                    — we usually reply within one working day.
                  </p>
                </SubSection>
              </div>

              {/* Acknowledgement */}
              <div className='mt-16 border border-gray-200 rounded-xl px-6 py-5 text-[14px] text-gray-600 leading-relaxed'>
                By submitting your application, clicking the approval link in
                our email, or sharing your referral URL, you acknowledge that
                you have read, understood, and agree to these Affiliate
                Program Terms.
              </div>

              {/* Footer CTA */}
              <div className='mt-12 border-t border-gray-200 pt-12'>
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
                      Ready to apply?
                    </h3>
                    <p className='text-gray-500 text-[15px] leading-relaxed'>
                      Three short steps. Most decisions back in three working
                      days.
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-3'>
                    <Link
                      to='/affiliate/apply'
                      className='inline-flex items-center gap-2 bg-[#f63a9e] hover:bg-[#e02d8d] text-white px-5 py-2.5 rounded-lg text-sm transition-colors'
                      style={{ fontWeight: 500 }}
                    >
                      <Sparkles className='w-4 h-4' />
                      Become a Partner
                    </Link>
                    <Link
                      to='/affiliate'
                      className='inline-flex items-center gap-2 border border-gray-300 hover:border-gray-900 text-gray-900 px-5 py-2.5 rounded-lg text-sm transition-colors'
                      style={{ fontWeight: 500 }}
                    >
                      About the program
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
