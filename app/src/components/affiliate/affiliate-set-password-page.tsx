import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

/**
 * Landed here from an approval magic link or a forgot-password email.
 * Supabase establishes a session from URL tokens; we collect the new password here.
 */
export function AffiliateSetPasswordPage() {
  const supabase = createClient();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const sessionReadyRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;

    // Supabase signals failure by redirecting with `#error=...&error_code=...
    // &error_description=...` instead of `#access_token=...`. Surface that
    // verbatim so users know the link itself is dead, not the page.
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const hashError = params.get('error_description') || params.get('error');
    if (hashError) {
      setError(decodeURIComponent(hashError.replace(/\+/g, ' ')));
      setChecking(false);
      return;
    }

    setIsRecovery(hash.includes('type=recovery'));

    const markReady = () => {
      sessionReadyRef.current = true;
      setSessionReady(true);
      setChecking(false);
      setError(null);
    };

    // The @supabase/ssr browser client parses the URL hash asynchronously, so
    // a synchronous getSession() right after mount typically returns null
    // even when the link is valid. Subscribe to auth state changes instead,
    // which fire as soon as the hash is consumed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === 'PASSWORD_RECOVERY' ||
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'TOKEN_REFRESHED')
      ) {
        markReady();
      }
    });

    // Also fire an explicit check in case the hash was already processed
    // before our listener attached (e.g. on a fast hydration path).
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady();
    });

    // If neither path produced a session within a generous window, the link
    // really is dead (consumed, expired, or this page was opened without a
    // token in the URL).
    const expiry = window.setTimeout(() => {
      if (!sessionReadyRef.current) {
        setChecking(false);
        setError(
          'This link has expired or already been used. Request a new reset link from the login page.'
        );
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(expiry);
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setSubmitting(true);

    const { error: upErr } = await supabase.auth.updateUser({ password });
    if (upErr) {
      setSubmitting(false);
      setError(upErr.message);
      return;
    }

    await supabase.auth.refreshSession();
    setSubmitting(false);
    setDone(true);
    setTimeout(() => navigate('/affiliate/dashboard', { replace: true }), 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-['Mona_Sans',_sans-serif]">
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif]"
            style={{ fontSize: '24px', fontWeight: '700' }}
          >
            {isRecovery ? 'Reset your password' : 'Welcome to Photify Affiliates'}
          </h1>
          <p className='text-gray-600 mt-2'>
            {isRecovery
              ? 'Choose a new password for your affiliate dashboard.'
              : 'Set a password so you can sign in next time.'}
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {checking && !error && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3'>
                <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5' />
                <p className='text-blue-800 text-sm'>Verifying your link…</p>
              </div>
            )}
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <p className='text-red-800 text-sm'>{error}</p>
              </div>
            )}
            {done && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3'>
                <CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
                <p className='text-green-800 text-sm'>Password set. Redirecting…</p>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='password'>New password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='pl-10'
                  required
                  disabled={submitting || done || !sessionReady}
                  placeholder='At least 8 characters'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirm'>Confirm password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  id='confirm'
                  type='password'
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className='pl-10'
                  required
                  disabled={submitting || done || !sessionReady}
                />
              </div>
            </div>

            <Button
              type='submit'
              disabled={submitting || done || !sessionReady}
              className='w-full h-11 bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
            >
              {submitting ? 'Saving…' : isRecovery ? 'Update password' : 'Set password and continue'}
            </Button>
          </form>
          {!sessionReady && (
            <p className='text-center text-sm text-gray-500 mt-4'>
              <a href='/affiliate/login' className='text-[#f63a9e] hover:underline'>
                Back to login
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
