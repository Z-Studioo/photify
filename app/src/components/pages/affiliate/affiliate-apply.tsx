import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  X,
  CornerDownLeft,
  TrendingUp,
  Wallet,
  Clock,
  ShieldCheck,
} from 'lucide-react';

type FormState = {
  name: string;
  email: string;
  phone: string;
  website: string;
  social_handle: string;

  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;

  creator_type: string;

  agree_terms: boolean;
  agree_no_brand_bidding: boolean;
  agree_disclosure: boolean;
  agree_tax: boolean;
  agree_age: boolean;
  opt_in_marketing: boolean;
};

const INITIAL: FormState = {
  name: '',
  email: '',
  phone: '',
  website: '',
  social_handle: '',

  address_line1: '',
  address_line2: '',
  city: '',
  region: '',
  postal_code: '',
  country: '',

  creator_type: '',

  agree_terms: false,
  agree_no_brand_bidding: false,
  agree_disclosure: false,
  agree_tax: false,
  agree_age: false,
  opt_in_marketing: false,
};

const CREATOR_TYPE_OPTIONS = [
  'Photographer',
  'Influencer / content creator',
  'Interior / home creator',
  'Blogger / writer',
  'Designer / artist',
  'YouTuber / video creator',
  'Agency / studio',
  'Other',
];

type AgreementKey =
  | 'agree_terms'
  | 'agree_no_brand_bidding'
  | 'agree_disclosure'
  | 'agree_tax'
  | 'agree_age';

const REQUIRED_AGREEMENTS: {
  key: AgreementKey;
  title: string;
  body: React.ReactNode;
}[] = [
  {
    key: 'agree_terms',
    title: 'I accept the Photify Affiliate Program Terms',
    body: (
      <>
        I&apos;ve read and agree to the{' '}
        <a
          href='/legal/affiliate-terms'
          target='_blank'
          rel='noreferrer'
          className='underline decoration-[#f63a9e]/40 underline-offset-2 hover:text-[#f63a9e]'
        >
          Affiliate Program Terms
        </a>{' '}
        and{' '}
        <a
          href='/privacy-policy'
          target='_blank'
          rel='noreferrer'
          className='underline decoration-[#f63a9e]/40 underline-offset-2 hover:text-[#f63a9e]'
        >
          Privacy Policy
        </a>
        .
      </>
    ),
  },
  {
    key: 'agree_no_brand_bidding',
    title: 'No bidding on the Photify brand',
    body: (
      <>
        I won&apos;t run paid ads on &ldquo;Photify&rdquo; or close variants.
        Commissions on traffic from brand-bidding ads will be reversed.
      </>
    ),
  },
  {
    key: 'agree_disclosure',
    title: 'I will disclose my affiliate relationship',
    body: (
      <>
        Wherever I share my link, I&apos;ll comply with FTC, ASA and local
        disclosure rules (e.g. #ad, #affiliate, &ldquo;paid partnership&rdquo;).
      </>
    ),
  },
  {
    key: 'agree_tax',
    title: 'I’m responsible for my own tax',
    body: (
      <>
        I understand commissions are paid gross and that any income tax, VAT or
        equivalent obligations are mine to handle.
      </>
    ),
  },
  {
    key: 'agree_age',
    title: 'I’m at least 18 and authorised to enter this agreement',
    body: (
      <>
        I confirm I&apos;m of legal age in my country and have the authority to
        accept these terms on my own behalf or on behalf of my business.
      </>
    ),
  },
];

const CLIENT_DRIVEN_TYPES = new Set(['Photographer', 'Agency / studio']);

function isClientDriven(creatorType: string): boolean {
  return CLIENT_DRIVEN_TYPES.has(creatorType);
}

const STEPS = [
  { id: 1, title: 'About you' },
  { id: 2, title: 'Where you are' },
  { id: 3, title: 'Agreement' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

function buildAudienceDescriptionPayload(f: FormState): string {
  const lines: string[] = [];

  if (f.creator_type.trim()) {
    lines.push('[Profile]');
    lines.push(`Creator type: ${f.creator_type.trim()}`);
    lines.push('');
  }

  const addressParts = [
    f.address_line1,
    f.address_line2,
    [f.city, f.region, f.postal_code].filter(Boolean).join(', '),
    f.country,
  ]
    .map((s) => (s || '').trim())
    .filter(Boolean);
  if (addressParts.length) {
    lines.push('[Address]');
    addressParts.forEach((p) => lines.push(p));
    lines.push('');
  }

  const consentLines: string[] = [];
  if (f.agree_terms) consentLines.push('- Affiliate Program Terms');
  if (f.agree_no_brand_bidding)
    consentLines.push('- No paid ads on Photify brand or close variants');
  if (f.agree_disclosure)
    consentLines.push('- Will disclose affiliate relationship per FTC / ASA');
  if (f.agree_tax) consentLines.push('- Personally responsible for taxes');
  if (f.agree_age) consentLines.push('- 18+ and authorised to sign');
  if (consentLines.length) {
    lines.push('[Consent]');
    lines.push(`Confirmed at: ${new Date().toISOString()}`);
    consentLines.forEach((l) => lines.push(l));
    lines.push(
      f.opt_in_marketing
        ? '- Opted in to program updates'
        : '- Did NOT opt in to program updates'
    );
    lines.push('');
  }

  return lines.join('\n').trim();
}

/* ----------------------- Large field primitives ----------------------- */

function BigLabel({
  number,
  label,
  optional,
}: {
  number: string;
  label: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className='flex items-baseline gap-3 mb-3'>
      <span
        className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e] text-[14px]"
        style={{ fontWeight: 700 }}
      >
        {number}
      </span>
      <label
        className='text-gray-900 text-[17px] md:text-[18px]'
        style={{ fontWeight: 500, letterSpacing: '-0.01em' }}
      >
        {label}
        {optional && (
          <span className='text-gray-400 ml-2 text-[14px]'>(optional)</span>
        )}
      </label>
    </div>
  );
}

function BigInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus,
  onEnter,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className='w-full h-14 md:h-[60px] px-5 text-[17px] md:text-[18px] text-gray-900 placeholder:text-gray-300 bg-white border border-gray-200 rounded-2xl outline-none transition-all focus:border-[#f63a9e] focus:ring-4 focus:ring-[#f63a9e]/10 hover:border-gray-300'
    />
  );
}

function BigTextarea({
  value,
  onChange,
  placeholder,
  rows = 5,
  maxLength,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  return (
    <div className='relative'>
      <textarea
        value={value}
        onChange={(e) =>
          onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)
        }
        autoFocus={autoFocus}
        placeholder={placeholder}
        rows={rows}
        className='w-full px-5 py-4 text-[16.5px] text-gray-900 placeholder:text-gray-300 bg-white border border-gray-200 rounded-2xl outline-none transition-all focus:border-[#f63a9e] focus:ring-4 focus:ring-[#f63a9e]/10 hover:border-gray-300 resize-none leading-relaxed'
      />
      {maxLength && (
        <span className='absolute bottom-3 right-4 text-[11px] text-gray-400 tabular-nums'>
          {value.length} / {maxLength}
        </span>
      )}
    </div>
  );
}

function SizeTile({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`h-14 rounded-2xl border text-[15px] transition-all ${
        active
          ? 'border-[#f63a9e] bg-[#f63a9e]/8 text-[#f63a9e] shadow-[0_4px_16px_-6px_rgba(246,58,158,0.35)]'
          : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
      }`}
      style={{ fontWeight: active ? 600 : 500 }}
    >
      {label}
    </button>
  );
}

function ConsentRow({
  title,
  body,
  checked,
  onChange,
  optional,
}: {
  title: string;
  body: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  optional?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`w-full text-left rounded-2xl border p-4 md:p-5 transition-all flex items-start gap-4 ${
        checked
          ? 'border-[#f63a9e] bg-[#f63a9e]/[0.04] shadow-[0_6px_22px_-12px_rgba(246,58,158,0.4)]'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <span
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          checked
            ? 'border-[#f63a9e] bg-[#f63a9e]'
            : 'border-gray-300 bg-white'
        }`}
        aria-hidden
      >
        {checked && <CheckCircle2 className='w-3.5 h-3.5 text-white' />}
      </span>
      <span className='flex-1 min-w-0'>
        <span
          className='block text-gray-900 text-[14.5px] md:text-[15px] mb-1'
          style={{ fontWeight: 600, letterSpacing: '-0.005em' }}
        >
          {title}
          {optional && (
            <span className='text-gray-400 ml-2 text-[12px]' style={{ fontWeight: 500 }}>
              optional
            </span>
          )}
        </span>
        <span className='block text-gray-600 text-[13px] md:text-[13.5px] leading-relaxed'>
          {body}
        </span>
      </span>
    </button>
  );
}

/* ------------------------------ Page ------------------------------ */

export function AffiliateApplyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const stepValid = useMemo(() => {
    if (step === 1) {
      return (
        form.creator_type.trim().length > 0 &&
        form.name.trim().length >= 2 &&
        /.+@.+\..+/.test(form.email.trim())
      );
    }
    if (step === 2) {
      return form.city.trim().length > 0 && form.country.trim().length > 0;
    }
    if (step === 3) {
      return REQUIRED_AGREEMENTS.every((a) => form[a.key] === true);
    }
    return false;
  }, [step, form]);

  const submit = async () => {
    if (!stepValid || isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      website: form.website.trim() || undefined,
      social_handle: form.social_handle.trim() || undefined,
      audience_description: buildAudienceDescriptionPayload(form),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/affiliates/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || 'Failed to submit application'
        );
      }
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit application. Please try again.'
      );
    }
  };

  const goNext = () => {
    if (!stepValid) return;
    if (step < STEPS.length) {
      setDirection(1);
      setStep((s) => (s + 1) as StepId);
    } else {
      submit();
    }
  };
  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => (s - 1) as StepId);
    }
  };

  // Reset scroll on step change for a clean transition
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isSubmitted) return;
      const target = e.target as HTMLElement | null;
      const isTextarea = target?.tagName === 'TEXTAREA';
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Enter' && !isTextarea) {
        // For non-textarea fields the per-input handler already handles it,
        // but this catches "Enter" pressed when focus is on a button/page.
        if (
          target?.tagName !== 'INPUT' &&
          target?.tagName !== 'BUTTON'
        ) {
          e.preventDefault();
          goNext();
        }
      } else if (e.key === 'Escape') {
        navigate('/affiliate');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, stepValid, isSubmitted, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const progressPct = (step / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-white font-['Mona_Sans',_sans-serif] flex overflow-hidden">
      {/* ============================ LEFT PANE ============================ */}
      <AffiliateApplyAside />

      {/* ============================ RIGHT PANE ============================ */}
      <div className='relative flex-1 flex flex-col overflow-hidden min-w-0'>
        {/* Ambient gradient backdrop (right pane only) */}
        <div
          className='absolute inset-0 pointer-events-none'
          style={{
            backgroundImage:
              'radial-gradient(60% 50% at 100% 0%, rgba(246,58,158,0.10) 0%, rgba(246,58,158,0) 70%), radial-gradient(60% 50% at 0% 100%, rgba(246,58,158,0.08) 0%, rgba(246,58,158,0) 70%)',
          }}
        />

        {/* Top bar (slim, not a site header) */}
        <header className='relative z-10 px-5 md:px-8 h-16 flex items-center justify-between flex-shrink-0'>
          <div className='flex items-center gap-2 lg:hidden'>
            <div className='w-7 h-7 rounded-lg bg-[#f63a9e] flex items-center justify-center'>
              <Sparkles className='w-3.5 h-3.5 text-white' />
            </div>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 text-[14px]"
              style={{ fontWeight: 700, letterSpacing: '-0.01em' }}
            >
              Photify Partner Application
            </p>
          </div>
          <div className='hidden lg:block' />

          <div className='flex items-center gap-3'>
            <p className='hidden md:block text-[12px] text-gray-400'>
              Press{' '}
              <kbd className='px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10.5px] text-gray-600 font-mono'>
                Esc
              </kbd>{' '}
              to exit
            </p>
            <button
              type='button'
              onClick={() => navigate('/affiliate')}
              className='w-9 h-9 rounded-full border border-gray-200 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors'
              aria-label='Close application'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </header>

        {/* Progress */}
        <div className='relative z-10 px-5 md:px-8 flex-shrink-0'>
        <div className='h-[3px] rounded-full bg-gray-100 overflow-hidden'>
          <motion.div
            className='h-full bg-gradient-to-r from-[#f63a9e] to-[#ff6bb5]'
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className='flex items-center justify-between mt-2.5'>
          <div className='flex items-center gap-2'>
            {STEPS.map((s) => {
              const isActive = s.id === step;
              const isComplete = s.id < step;
              const clickable = isComplete;
              return (
                <button
                  key={s.id}
                  type='button'
                  disabled={!clickable}
                  onClick={() => {
                    if (clickable) {
                      setDirection(-1);
                      setStep(s.id);
                    }
                  }}
                  className={`text-[11.5px] tabular-nums transition-colors ${
                    isActive
                      ? 'text-gray-900'
                      : isComplete
                      ? 'text-gray-500 hover:text-gray-900 cursor-pointer'
                      : 'text-gray-300'
                  }`}
                  style={{ fontWeight: isActive ? 600 : 500 }}
                >
                  <span className='hidden sm:inline'>
                    {String(s.id).padStart(2, '0')} · {s.title}
                  </span>
                  <span className='sm:hidden'>
                    {isComplete ? '✓' : s.id}
                  </span>
                </button>
              );
            })}
          </div>
          <p className='text-[11.5px] text-gray-400 tabular-nums'>
            {Math.round(progressPct)}%
          </p>
        </div>
      </div>

      {/* Stage */}
      <main
        ref={scrollRef}
        className='relative z-10 flex-1 overflow-y-auto overflow-x-hidden'
      >
        <div className='min-h-full flex items-start md:items-center justify-center px-5 md:px-8 py-10 md:py-16'>
          <div className='w-full max-w-[720px]'>
            <AnimatePresence mode='wait' custom={direction}>
              {isSubmitted ? (
                <motion.div
                  key='done'
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className='text-center'
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 220,
                      damping: 18,
                      delay: 0.05,
                    }}
                    className='w-20 h-20 rounded-full bg-gradient-to-br from-[#f63a9e] to-[#ff6bb5] mx-auto mb-7 flex items-center justify-center shadow-[0_12px_40px_-8px_rgba(246,58,158,0.5)]'
                  >
                    <CheckCircle2 className='w-10 h-10 text-white' />
                  </motion.div>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                    style={{
                      fontSize: 'clamp(32px, 5vw, 48px)',
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.05,
                    }}
                  >
                    You&apos;re in the queue.
                  </h2>
                  <p className='text-gray-600 text-[17px] leading-relaxed max-w-md mx-auto mb-9'>
                    Thanks {form.name.split(' ')[0] || 'there'}. We&apos;ll
                    email{' '}
                    <span className='text-gray-900' style={{ fontWeight: 600 }}>
                      {form.email}
                    </span>{' '}
                    within 3 working days with our decision.
                  </p>
                  <div className='flex flex-wrap items-center justify-center gap-3'>
                    <Button
                      onClick={() => navigate('/affiliate')}
                      variant='ghost'
                      className='text-gray-700 hover:text-gray-900 hover:bg-gray-100 h-12 px-5 rounded-xl text-[15px]'
                      style={{ fontWeight: 500 }}
                    >
                      Back to program
                    </Button>
                    <Button
                      onClick={() => navigate('/')}
                      className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white h-12 px-6 rounded-xl text-[15px] shadow-none'
                      style={{ fontWeight: 500 }}
                    >
                      Explore Photify
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  custom={direction}
                  initial={(d: 1 | -1) => ({ opacity: 0, x: d * 40 })}
                  animate={{ opacity: 1, x: 0 }}
                  exit={(d: 1 | -1) => ({ opacity: 0, x: d * -40 })}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 1 && (
                    <Step
                      eyebrow={`Step ${step} of ${STEPS.length}`}
                      title="Let's start with you."
                      subtitle="Tell us who you are. We'll use this to set up your dashboard when you're approved."
                    >
                      <div className='space-y-7'>
                        <div>
                          <BigLabel
                            number='01'
                            label='What kind of creator are you?'
                          />
                          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2.5'>
                            {CREATOR_TYPE_OPTIONS.map((opt) => (
                              <SizeTile
                                key={opt}
                                label={opt}
                                active={form.creator_type === opt}
                                onClick={() => update('creator_type', opt)}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <BigLabel number='02' label='What should we call you?' />
                          <BigInput
                            value={form.name}
                            onChange={(v) => update('name', v)}
                            placeholder='Jane Doe'
                            onEnter={goNext}
                          />
                        </div>
                        <div>
                          <BigLabel number='03' label='Your email address' />
                          <BigInput
                            value={form.email}
                            onChange={(v) => update('email', v)}
                            placeholder='you@example.com'
                            type='email'
                            inputMode='email'
                            onEnter={goNext}
                          />
                        </div>
                        <div className='grid sm:grid-cols-2 gap-5'>
                          <div>
                            <BigLabel
                              number='04'
                              label='Phone'
                              optional
                            />
                            <BigInput
                              value={form.phone}
                              onChange={(v) => update('phone', v)}
                              placeholder='+44 7700 900000'
                              inputMode='tel'
                              onEnter={goNext}
                            />
                          </div>
                          <div>
                            <BigLabel
                              number='05'
                              label={
                                isClientDriven(form.creator_type)
                                  ? 'Portfolio / website'
                                  : 'Website / portfolio'
                              }
                              optional
                            />
                            <BigInput
                              value={form.website}
                              onChange={(v) => update('website', v)}
                              placeholder='https://…'
                              inputMode='url'
                              onEnter={goNext}
                            />
                          </div>
                        </div>
                        <div>
                          <BigLabel
                            number='06'
                            label={
                              isClientDriven(form.creator_type)
                                ? 'Social handle'
                                : 'Primary social handle'
                            }
                            optional
                          />
                          <BigInput
                            value={form.social_handle}
                            onChange={(v) => update('social_handle', v)}
                            placeholder='@yourhandle on Instagram / TikTok / YouTube'
                            onEnter={goNext}
                          />
                        </div>
                      </div>
                    </Step>
                  )}

                  {step === 2 && (
                    <Step
                      eyebrow={`Step ${step} of ${STEPS.length}`}
                      title='Where are you based?'
                      subtitle='We need a contact address for payouts and tax records. This stays private.'
                    >
                      <div className='space-y-7'>
                        <div>
                          <BigLabel number='01' label='Address' />
                          <BigInput
                            value={form.address_line1}
                            onChange={(v) => update('address_line1', v)}
                            placeholder='Street and number'
                            autoFocus
                            onEnter={goNext}
                          />
                        </div>
                        <div>
                          <BigLabel
                            number='02'
                            label='Apt, suite, building'
                            optional
                          />
                          <BigInput
                            value={form.address_line2}
                            onChange={(v) => update('address_line2', v)}
                            placeholder='Apt 4B'
                            onEnter={goNext}
                          />
                        </div>
                        <div className='grid sm:grid-cols-2 gap-5'>
                          <div>
                            <BigLabel number='03' label='City' />
                            <BigInput
                              value={form.city}
                              onChange={(v) => update('city', v)}
                              placeholder='London'
                              onEnter={goNext}
                            />
                          </div>
                          <div>
                            <BigLabel
                              number='04'
                              label='State / region'
                              optional
                            />
                            <BigInput
                              value={form.region}
                              onChange={(v) => update('region', v)}
                              placeholder='Greater London'
                              onEnter={goNext}
                            />
                          </div>
                        </div>
                        <div className='grid sm:grid-cols-2 gap-5'>
                          <div>
                            <BigLabel
                              number='05'
                              label='Postal code'
                              optional
                            />
                            <BigInput
                              value={form.postal_code}
                              onChange={(v) => update('postal_code', v)}
                              placeholder='SW1A 1AA'
                              onEnter={goNext}
                            />
                          </div>
                          <div>
                            <BigLabel number='06' label='Country' />
                            <BigInput
                              value={form.country}
                              onChange={(v) => update('country', v)}
                              placeholder='United Kingdom'
                              onEnter={goNext}
                            />
                          </div>
                        </div>
                      </div>
                    </Step>
                  )}

                  {step === 3 && (
                    <Step
                      eyebrow={`Step ${step} of ${STEPS.length}`}
                      title='Agreement & consent.'
                      subtitle='A few quick confirmations before we review your application.'
                    >
                      <div className='space-y-3'>
                        {REQUIRED_AGREEMENTS.map((a) => (
                          <ConsentRow
                            key={a.key}
                            title={a.title}
                            body={a.body}
                            checked={form[a.key]}
                            onChange={(v) => update(a.key, v)}
                          />
                        ))}

                        <div className='pt-2'>
                          <ConsentRow
                            title='Send me program updates (optional)'
                            body={
                              <>
                                Tips, seasonal promo guides, and occasional
                                product news. Unsubscribe anytime.
                              </>
                            }
                            checked={form.opt_in_marketing}
                            onChange={(v) => update('opt_in_marketing', v)}
                            optional
                          />
                        </div>
                      </div>

                      <p className='mt-7 text-[12.5px] text-gray-500 leading-relaxed'>
                        By submitting this application, you confirm the
                        information provided is accurate. We&apos;ll review it
                        and email you within 3 working days.
                      </p>
                    </Step>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && !isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className='mt-6 border border-red-200 bg-red-50 rounded-xl px-4 py-3'
                >
                  <p className='text-red-600 text-sm'>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Sticky bottom nav */}
      {!isSubmitted && (
        <div className='relative z-10 border-t border-gray-100 bg-white/80 backdrop-blur-md flex-shrink-0'>
          <div className='w-full max-w-[720px] mx-auto px-5 md:px-8 h-[72px] flex items-center justify-between gap-4'>
            <Button
              type='button'
              variant='ghost'
              onClick={goBack}
              disabled={step === 1}
              className='text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-11 px-4 rounded-xl text-[14px] disabled:opacity-30 disabled:hover:bg-transparent'
              style={{ fontWeight: 500 }}
            >
              <ArrowLeft className='w-4 h-4 mr-1.5' />
              Back
            </Button>

            <div className='flex items-center gap-3'>
              <p className='hidden md:flex items-center gap-1.5 text-[11.5px] text-gray-400'>
                Press
                <kbd className='px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] text-gray-600 font-mono inline-flex items-center gap-0.5'>
                  <CornerDownLeft className='w-2.5 h-2.5' />
                  Enter
                </kbd>
                to continue
              </p>
              {step < STEPS.length ? (
                <Button
                  type='button'
                  onClick={goNext}
                  disabled={!stepValid}
                  className='bg-[#f63a9e] hover:bg-[#e02d8d] disabled:bg-[#f63a9e]/30 text-white h-12 px-6 rounded-xl text-[15px] shadow-[0_6px_20px_-6px_rgba(246,58,158,0.5)] disabled:shadow-none transition-all'
                  style={{ fontWeight: 500 }}
                >
                  Continue
                  <ArrowRight className='w-4 h-4 ml-1.5' />
                </Button>
              ) : (
                <Button
                  type='button'
                  onClick={submit}
                  disabled={!stepValid || isSubmitting}
                  className='bg-[#f63a9e] hover:bg-[#e02d8d] disabled:bg-[#f63a9e]/30 text-white h-12 px-6 rounded-xl text-[15px] shadow-[0_6px_20px_-6px_rgba(246,58,158,0.5)] disabled:shadow-none transition-all'
                  style={{ fontWeight: 500 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-1.5 animate-spin' />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className='w-4 h-4 mr-1.5' />
                      Submit application
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/* ----------------------- Left aside (split-screen) ----------------------- */

function AffiliateApplyAside() {
  const highlights = [
    {
      icon: TrendingUp,
      title: '10% commission',
      body: 'On every paid order through your link. No tiers, no fine print.',
    },
    {
      icon: Clock,
      title: '30-day attribution',
      body: 'A single click gives you credit for a full month of purchases.',
    },
    {
      icon: Wallet,
      title: 'Paid monthly',
      body: 'Reliable payouts on the 1st, sent straight to your account.',
    },
    {
      icon: ShieldCheck,
      title: 'No caps, ever',
      body: "If your audience keeps buying, your commission keeps coming.",
    },
  ];

  return (
    <aside className='hidden lg:flex relative w-[44%] xl:w-[42%] 2xl:w-[40%] flex-shrink-0 flex-col overflow-hidden bg-[#0b0b10] text-white'>
      {/* Layered background */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 0% 0%, rgba(246,58,158,0.28) 0%, rgba(246,58,158,0) 65%), radial-gradient(55% 45% at 100% 100%, rgba(246,58,158,0.18) 0%, rgba(246,58,158,0) 70%)',
        }}
      />
      <div
        className='absolute inset-0 opacity-[0.06] pointer-events-none'
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: 'center center',
          maskImage:
            'radial-gradient(70% 60% at 50% 40%, #000 30%, transparent 80%)',
        }}
      />

      <div className='relative z-10 flex flex-col h-full px-10 xl:px-14 py-10 overflow-y-auto'>
        {/* Brand */}
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-lg bg-[#f63a9e] flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(246,58,158,0.8)]'>
            <Sparkles className='w-4 h-4 text-white' />
          </div>
          <p
            className="font-['Bricolage_Grotesque',_sans-serif] text-white/95 text-[14px]"
            style={{ fontWeight: 700, letterSpacing: '-0.01em' }}
          >
            Photify Partner Program
          </p>
        </div>

        {/* Headline */}
        <div className='mt-14 xl:mt-20'>
          <p
            className='text-[11px] uppercase tracking-[0.22em] text-[#ff6bb5] mb-5'
            style={{ fontWeight: 600 }}
          >
            Apply in 3 short steps
          </p>
          <h2
            className="font-['Bricolage_Grotesque',_sans-serif] text-white mb-5"
            style={{
              fontSize: 'clamp(34px, 3.4vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.04,
            }}
          >
            Get paid for the work
            <br />
            you&apos;re already doing.
          </h2>
          <p
            className='text-white/65 text-[16px] leading-relaxed max-w-[44ch]'
            style={{ fontWeight: 400 }}
          >
            Join a hand-picked group of creators, photographers and editors
            earning a steady cut of every Photify order they send our way.
          </p>
        </div>

        {/* Highlights */}
        <ul className='mt-12 space-y-5'>
          {highlights.map(({ icon: Icon, title, body }) => (
            <li key={title} className='flex items-start gap-4'>
              <div className='w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0'>
                <Icon className='w-[18px] h-[18px] text-[#ff6bb5]' />
              </div>
              <div className='pt-0.5'>
                <p
                  className="text-white text-[15px] mb-1 font-['Bricolage_Grotesque',_sans-serif]"
                  style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
                >
                  {title}
                </p>
                <p className='text-white/55 text-[13.5px] leading-relaxed max-w-[42ch]'>
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer note */}
        <div className='mt-auto pt-12'>
          <div className='rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur px-5 py-4'>
            <p className='text-white/85 text-[13.5px] leading-relaxed'>
              <span
                className="text-white font-['Bricolage_Grotesque',_sans-serif]"
                style={{ fontWeight: 600 }}
              >
                Quick decisions.
              </span>{' '}
              <span className='text-white/60'>
                We reply to every application within 3 working days — usually
                much sooner.
              </span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ----------------------- Step wrapper ----------------------- */

function Step({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className='text-[11px] uppercase tracking-[0.2em] text-[#f63a9e] mb-4'
        style={{ fontWeight: 600 }}
      >
        {eyebrow}
      </p>
      <h1
        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
        style={{
          fontSize: 'clamp(30px, 4.5vw, 44px)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
        }}
      >
        {title}
      </h1>
      <p className='text-gray-500 text-[16px] md:text-[17px] leading-relaxed mb-10 max-w-xl'>
        {subtitle}
      </p>
      {children}
    </div>
  );
}
