import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollText, Mail, ArrowUpRight } from 'lucide-react';

type SectionItem = { id: string; label: string; number: string };

const sections: SectionItem[] = [
  { id: 'overview', label: 'Overview', number: '0' },
  { id: 'general', label: 'General conditions', number: '1' },
  { id: 'modifications', label: 'Modifications to services & pricing', number: '2' },
  { id: 'accuracy', label: 'Accuracy of information', number: '3' },
  { id: 'third-party', label: 'Third-party links & tools', number: '4' },
  { id: 'ugc', label: 'User-generated content', number: '5' },
  { id: 'personal-info', label: 'Personal information', number: '6' },
  { id: 'prohibited', label: 'Prohibited uses', number: '7' },
  { id: 'disclaimer', label: 'Disclaimer & liability', number: '8' },
  { id: 'governing', label: 'Governing law', number: '9' },
  { id: 'contact', label: 'Contact information', number: '10' },
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

export function TermsOfUsePage() {
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
                <ScrollText className='w-4 h-4 text-[#f63a9e]' />
                <p
                  className='text-[11px] uppercase tracking-[0.18em] text-gray-500'
                  style={{ fontWeight: 600 }}
                >
                  Terms of Use
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
                The agreement between us.
              </h1>
              <p className='text-gray-600 text-[17px] leading-relaxed mb-6'>
                These Terms set out the basic rules for using photify.co — what
                you can expect from us, what we expect from you, and the legal
                bits we&apos;re both bound by. By using the site, you accept
                them.
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
                  <p className='text-xs text-gray-500 mb-2'>Need help?</p>
                  <a
                    href='mailto:support@photify.co'
                    className='inline-flex items-center gap-1.5 text-[13px] text-gray-900 hover:text-[#f63a9e]'
                    style={{ fontWeight: 500 }}
                  >
                    <Mail className='w-3.5 h-3.5' />
                    support@photify.co
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
                  Terms of Service
                </h2>
                <p className='text-gray-500 text-[16px] leading-relaxed max-w-2xl'>
                  This website is operated by Photify. Throughout the site, the
                  terms &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refer
                  to Photify. These Terms apply to all users of the site,
                  including browsers, customers and contributors of content.
                </p>
              </div>

              <div className='space-y-14'>
                <SubSection id='overview' number='00' title='Overview'>
                  <p>
                    Please review these Terms carefully. If you do not agree to
                    these Terms, you should not access or use our website or
                    services.
                  </p>
                  <p>
                    We reserve the right to update, change or replace any part
                    of these Terms at any time without prior notice by posting
                    the changes on this page. It is your responsibility to
                    check this page periodically for updates. Your continued
                    use of the website constitutes acceptance of any changes.
                  </p>
                </SubSection>

                <SubSection id='general' number='01' title='General conditions'>
                  <BulletList
                    items={[
                      'You must be at least the age of majority in your jurisdiction to use this site. By using our website, you confirm that you meet this requirement or have obtained parental consent.',
                      'You agree not to use our site or services for any unlawful purposes or to violate any applicable laws.',
                      'We reserve the right to refuse service to anyone for any reason at any time.',
                      'The content and materials provided on this site are for general information only and should not be relied upon for decision-making without consulting more accurate or timely sources.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='modifications'
                  number='02'
                  title='Modifications to services and pricing'
                >
                  <BulletList
                    items={[
                      'We may update or discontinue any part of our services without notice.',
                      'Prices for any products or services listed on our site are subject to change at our discretion.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='accuracy'
                  number='03'
                  title='Accuracy of information'
                >
                  <BulletList
                    items={[
                      'While we strive for accuracy, we do not guarantee that all information on the site is complete or current. Any reliance on the information provided is at your own risk.',
                      'We reserve the right to correct any errors, omissions or inaccuracies in the content at any time.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='third-party'
                  number='04'
                  title='Third-party links and tools'
                >
                  <BulletList
                    items={[
                      'Our site may contain links to third-party websites or services. We are not responsible for the content, accuracy or practices of these third parties and are not liable for any issues arising from their use.',
                      'Access to third-party tools through our site is provided "as is" without warranties or endorsements.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='ugc'
                  number='05'
                  title='User-generated content'
                >
                  <BulletList
                    items={[
                      'By submitting comments, suggestions or other content, you grant us the right to use, edit and distribute your submissions without restriction.',
                      'You agree that your submissions will not violate any laws, contain harmful or unlawful material, or infringe upon the rights of others.',
                    ]}
                  />
                </SubSection>

                <SubSection
                  id='personal-info'
                  number='06'
                  title='Personal information'
                >
                  <p>
                    Your submission of personal information through the site is
                    governed by our{' '}
                    <Link
                      to='/privacy-policy'
                      className='text-[#f63a9e] underline-offset-4 hover:underline'
                      style={{ fontWeight: 500 }}
                    >
                      Privacy Policy
                    </Link>
                    , which outlines how we collect, use and protect your
                    data.
                  </p>
                </SubSection>

                <SubSection
                  id='prohibited'
                  number='07'
                  title='Prohibited uses'
                  description='You may not use the site or its content for any of the following.'
                >
                  <ul className='border border-gray-200 rounded-xl divide-y divide-gray-100 text-[14.5px]'>
                    {[
                      'Engaging in unlawful activities.',
                      'Violating intellectual property rights.',
                      'Harassing, abusing or discriminating against others.',
                      'Transmitting harmful or malicious software.',
                      'Collecting or tracking the personal information of others without consent.',
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
                  id='disclaimer'
                  number='08'
                  title='Disclaimer of warranties and limitation of liability'
                >
                  <BulletList
                    items={[
                      'We provide the website and services "as is" and "as available", without any warranties of any kind.',
                      'We do not guarantee uninterrupted or error-free access to the website.',
                      'In no event shall Photify or its affiliates be liable for any damages arising from the use or inability to use the site or services.',
                    ]}
                  />
                </SubSection>

                <SubSection id='governing' number='09' title='Governing law'>
                  <p>
                    These Terms of Service are governed by the laws of your
                    jurisdiction. Any disputes arising from these Terms shall be
                    resolved in the courts of the applicable jurisdiction.
                  </p>
                </SubSection>

                <SubSection
                  id='contact'
                  number='10'
                  title='Contact information'
                >
                  <p>
                    If you have any questions about these Terms of Service,
                    please contact us at{' '}
                    <a
                      href='mailto:support@photify.co'
                      className='text-[#f63a9e] underline-offset-4 hover:underline'
                    >
                      support@photify.co
                    </a>
                    .
                  </p>
                </SubSection>
              </div>

              {/* Acknowledgement */}
              <div className='mt-16 border border-gray-200 rounded-xl px-6 py-5 text-[14px] text-gray-600 leading-relaxed'>
                By using photify.co, you acknowledge that you have read,
                understood and agree to these Terms of Service.
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
                      Anything unclear?
                    </h3>
                    <p className='text-gray-500 text-[15px] leading-relaxed'>
                      Our team is happy to clarify anything about these terms —
                      we usually reply within one working day.
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
