import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, ChevronRight, AlertCircle, Package, Truck, ShieldCheck, Info } from 'lucide-react';

const sections = [
  { id: 'eligibility', label: 'Refund Eligibility' },
  { id: 'returns', label: 'Returns & Replacements' },
  { id: 'shipping', label: 'Shipping Costs' },
  { id: 'damaged', label: 'Damaged or Defective Items' },
  { id: 'notes', label: 'Important Notes' },
];

const highlights = [
  { icon: AlertCircle, title: '7-Day Window', desc: 'Report issues within 7 days of receiving your order.' },
  { icon: Package, title: 'Pre-Authorised Returns', desc: 'All returns must be approved before sending back.' },
  { icon: Truck, title: 'Customer Covers Shipping', desc: 'Return shipping costs are borne by the customer.' },
  { icon: ShieldCheck, title: 'Defects Covered', desc: 'Damaged or defective items qualify for a free replacement.' },
];

export function RefundReturnPolicyPage() {
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
                <RotateCcw className="w-10 h-10 text-white" />
              </div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                style={{ fontSize: '40px', fontWeight: '800', lineHeight: '1.2' }}
              >
                Refund & Returns Policy
              </h1>
              <p className="text-gray-500 max-w-2xl text-lg">
                At Photify.co, we aim to deliver high-quality products that meet your expectations. Please review our refund policy below.
              </p>
              <p className="text-sm text-gray-400 mt-4">Last updated: February 2026</p>
            </motion.div>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="border-b border-gray-100 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {highlights.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-4 bg-[#FFF5FB] border border-[#f63a9e]/20 rounded-2xl p-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f63a9e] flex items-center justify-center flex-shrink-0">
                    <h.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm" style={{ fontWeight: '700' }}>{h.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{h.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
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

                <div className="mt-6 pt-6 border-t border-[#f63a9e]/20">
                  <p className="text-xs text-gray-500 mb-3">Need help with a return?</p>
                  <Link
                    to="/contact"
                    className="block w-full text-center bg-[#f63a9e] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#e02d8d] transition-colors font-semibold"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 max-w-3xl space-y-12 text-gray-700 leading-relaxed">

              {/* Refund Eligibility */}
              <section id="eligibility" className="scroll-mt-8">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#f63a9e]/30">
                  <div className="w-9 h-9 rounded-xl bg-[#f63a9e] flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                    style={{ fontSize: '22px', fontWeight: '700' }}
                  >
                    Refund Eligibility
                  </h2>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                    Refunds are accepted within <strong>7 days</strong> of receiving your order.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                    Personalized or custom items are <strong>non-refundable</strong> unless they are damaged upon delivery or contain a manufacturing defect.
                  </li>
                </ul>
              </section>

              {/* Returns & Replacements */}
              <section id="returns" className="scroll-mt-8">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#f63a9e]/30">
                  <div className="w-9 h-9 rounded-xl bg-[#f63a9e] flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                    style={{ fontSize: '22px', fontWeight: '700' }}
                  >
                    Returns and Replacements
                  </h2>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                    For eligible returns, we will provide a <strong>replacement</strong> for the item. However, delivery charges will be deducted from the refund amount.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                    All returns must be <strong>pre-authorised</strong>. Items sent back without prior approval will not be accepted.
                  </li>
                </ul>
              </section>

              {/* Shipping Costs */}
              <section id="shipping" className="scroll-mt-8">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#f63a9e]/30">
                  <div className="w-9 h-9 rounded-xl bg-[#f63a9e] flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                    style={{ fontSize: '22px', fontWeight: '700' }}
                  >
                    Shipping Costs
                  </h2>
                </div>
                <p>
                  If a return is approved, the <strong>customer is responsible</strong> for covering the shipping costs to return the item.
                </p>
              </section>

              {/* Damaged or Defective */}
              <section id="damaged" className="scroll-mt-8">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#f63a9e]/30">
                  <div className="w-9 h-9 rounded-xl bg-[#f63a9e] flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                    style={{ fontSize: '22px', fontWeight: '700' }}
                  >
                    Damaged or Defective Items
                  </h2>
                </div>
                <p className="mb-4">
                  If your order arrives damaged or defective, please notify us <strong>within 7 days</strong> with your order details and photos of the issue.
                </p>
                <div className="bg-[#FFF5FB] border border-[#f63a9e]/30 rounded-xl p-5">
                  <p className="text-sm text-gray-700 mb-2">Contact us for assistance:</p>
                  <div className="space-y-1">
                    <a href="mailto:support@photify.co" className="block text-[#f63a9e] hover:underline font-semibold text-sm">
                      support@photify.co
                    </a>
                    <a href="mailto:info@photify.co" className="block text-[#f63a9e] hover:underline font-semibold text-sm">
                      info@photify.co
                    </a>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    We will assess the situation and arrange a replacement if necessary.
                  </p>
                </div>
              </section>

              {/* Important Notes */}
              <section id="notes" className="scroll-mt-8">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#f63a9e]/30">
                  <div className="w-9 h-9 rounded-xl bg-[#f63a9e] flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                    style={{ fontSize: '22px', fontWeight: '700' }}
                  >
                    Important Notes
                  </h2>
                </div>
                <div className="space-y-3">
                  {[
                    'Refunds or replacements will only be processed after the returned item has been inspected and approved.',
                    'Delivery charges are non-refundable.',
                  ].map((note, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f63a9e] mt-2 flex-shrink-0" />
                      {note}
                    </div>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <div className="bg-[#FFF5FB] border-2 border-[#f63a9e]/30 rounded-2xl p-8 text-center">
                <h3
                  className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                  style={{ fontSize: '22px', fontWeight: '700' }}
                >
                  Thank you for choosing Photify.co!
                </h3>
                <p className="text-gray-600 mb-6">
                  If you have any questions or need further assistance, we're here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-[#f63a9e] text-white px-8 py-3 rounded-xl hover:bg-[#e02d8d] transition-colors font-semibold"
                  >
                    Contact Us
                  </Link>
                  <Link
                    to="/track-order"
                    className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:border-[#f63a9e] transition-colors font-semibold"
                  >
                    Track Your Order
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
