import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollText, ChevronRight } from 'lucide-react';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'general', label: '1. General Conditions' },
  { id: 'modifications', label: '2. Modifications to Services & Pricing' },
  { id: 'accuracy', label: '3. Accuracy of Information' },
  { id: 'third-party', label: '4. Third-Party Links & Tools' },
  { id: 'ugc', label: '5. User-Generated Content' },
  { id: 'personal-info', label: '6. Personal Information' },
  { id: 'prohibited', label: '7. Prohibited Uses' },
  { id: 'disclaimer', label: '8. Disclaimer & Liability' },
  { id: 'governing', label: '9. Governing Law' },
  { id: 'contact', label: '10. Contact Information' },
];

export function TermsOfUsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-[#FFF5FB] border-b border-[#f63a9e]/20">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#f63a9e] flex items-center justify-center shadow-xl mb-6">
                <ScrollText className="w-10 h-10 text-white" />
              </div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                style={{ fontSize: '40px', fontWeight: '800', lineHeight: '1.2' }}
              >
                Terms of Use
              </h1>
              <p className="text-gray-500 max-w-2xl text-lg">
                Welcome to Photify.co. By accessing our website and using our services, you agree to comply with and be bound by these Terms of Service.
              </p>
              <p className="text-sm text-gray-400 mt-4">Last updated: February 2026</p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar TOC */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-8 bg-[#FFF5FB] border border-[#f63a9e]/20 rounded-2xl p-6">
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                  style={{ fontWeight: '700', fontSize: '16px' }}
                >
                  Table of Contents
                </p>
                <ul className="space-y-1">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#f63a9e] transition-colors py-1"
                      >
                        <ChevronRight className="w-3 h-3 flex-shrink-0 text-[#f63a9e]" />
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 max-w-3xl space-y-12 text-gray-700 leading-relaxed">

              {/* Intro */}
              <div className="bg-[#FFF5FB] border border-[#f63a9e]/20 rounded-2xl p-6 text-sm text-gray-600">
                This website is operated by Photify. Throughout the site, the terms &quot;we,&quot; &quot;us,&quot; and &quot;our&quot; refer to Photify. These Terms apply to all users of the site, including but not limited to browsers, customers, and contributors of content.
              </div>

              {/* Overview */}
              <section id="overview" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  Overview
                </h2>
                <p className="mb-4">
                  Please review these Terms carefully. If you do not agree to these Terms, you should not access or use our website or services.
                </p>
                <p>
                  We reserve the right to update, change, or replace any part of these Terms at any time without prior notice by posting the changes on this page. It is your responsibility to check this page periodically for updates. Your continued use of the website constitutes acceptance of any changes.
                </p>
              </section>

              {/* 1 */}
              <section id="general" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  1. General Conditions
                </h2>
                <ul className="space-y-3">
                  {[
                    'You must be at least the age of majority in your jurisdiction to use this site. By using our website, you confirm that you meet this requirement or have obtained parental consent.',
                    'You agree not to use our site or services for any unlawful purposes or to violate any applicable laws.',
                    'We reserve the right to refuse service to anyone for any reason at any time.',
                    'The content and materials provided on this site are for general information only and should not be relied upon for decision-making without consulting more accurate or timely sources.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 2 */}
              <section id="modifications" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  2. Modifications to Services and Pricing
                </h2>
                <ul className="space-y-3">
                  {[
                    'We may update or discontinue any part of our services without notice.',
                    'Prices for any products or services listed on our site are subject to change at our discretion.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 3 */}
              <section id="accuracy" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  3. Accuracy of Information
                </h2>
                <ul className="space-y-3">
                  {[
                    'While we strive for accuracy, we do not guarantee that all information on the site is complete or current. Any reliance on the information provided is at your own risk.',
                    'We reserve the right to correct any errors, omissions, or inaccuracies in the content at any time.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 4 */}
              <section id="third-party" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  4. Third-Party Links and Tools
                </h2>
                <ul className="space-y-3">
                  {[
                    'Our site may contain links to third-party websites or services. We are not responsible for the content, accuracy, or practices of these third parties and are not liable for any issues arising from their use.',
                    'Access to third-party tools through our site is provided "as is" without warranties or endorsements.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 5 */}
              <section id="ugc" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  5. User-Generated Content
                </h2>
                <ul className="space-y-3">
                  {[
                    'By submitting comments, suggestions, or other content, you grant us the right to use, edit, and distribute your submissions without restriction.',
                    'You agree that your submissions will not violate any laws, contain harmful or unlawful material, or infringe upon the rights of others.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 6 */}
              <section id="personal-info" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  6. Personal Information
                </h2>
                <p>
                  Your submission of personal information through the site is governed by our{' '}
                  <Link to="/privacy-policy" className="text-[#f63a9e] hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                  , which outlines how we collect, use, and protect your data.
                </p>
              </section>

              {/* 7 */}
              <section id="prohibited" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  7. Prohibited Uses
                </h2>
                <p className="mb-4">You are prohibited from using the site or its content for any of the following purposes:</p>
                <div className="space-y-2">
                  {[
                    'Engaging in unlawful activities.',
                    'Violating intellectual property rights.',
                    'Harassing, abusing, or discriminating against others.',
                    'Transmitting harmful or malicious software.',
                    'Collecting or tracking the personal information of others without consent.',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              {/* 8 */}
              <section id="disclaimer" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  8. Disclaimer of Warranties and Limitation of Liability
                </h2>
                <ul className="space-y-3">
                  {[
                    'We provide the website and services "as is" and "as available," without any warranties of any kind.',
                    'We do not guarantee uninterrupted or error-free access to the website.',
                    'In no event shall Photify or its affiliates be liable for any damages arising from the use or inability to use the site or services.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 9 */}
              <section id="governing" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  9. Governing Law
                </h2>
                <p>
                  These Terms of Service are governed by the laws of your jurisdiction. Any disputes arising from these Terms shall be resolved in the courts of the applicable jurisdiction.
                </p>
              </section>

              {/* 10 */}
              <section id="contact" className="scroll-mt-8">
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4 pb-3 border-b-2 border-[#f63a9e]/30"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  10. Contact Information
                </h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:support@photify.co" className="text-[#f63a9e] hover:underline font-semibold">
                    support@photify.co
                  </a>.
                </p>
              </section>

              {/* Acknowledgement */}
              <div className="bg-[#FFF5FB] border-2 border-[#f63a9e]/30 rounded-2xl p-6 text-sm text-gray-600 text-center">
                By using Photify.co, you acknowledge that you have read, understood, and agree to these Terms of Service.
              </div>

              {/* CTA */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center">
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  Have questions?
                </h3>
                <p className="text-gray-600 mb-6">
                  Our team is happy to help clarify anything about our terms.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-[#f63a9e] text-white px-8 py-3 rounded-xl hover:bg-[#e02d8d] transition-colors font-semibold"
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
