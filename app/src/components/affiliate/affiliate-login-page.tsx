import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAffiliate } from '@/context/AffiliateContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Lock, User, ArrowLeft } from 'lucide-react';

type View = 'login' | 'forgot';

export function AffiliateLoginPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAffiliate();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/affiliate/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      navigate('/affiliate/dashboard');
    } else {
      setError(result.error || 'Invalid email or password');
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/affiliates/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || 'Could not send reset email. Please try again.');
        return;
      }
      setSuccess(
        json?.message ||
          'If an approved affiliate account exists for this email, you will receive reset instructions shortly.'
      );
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchView = (next: View) => {
    setView(next);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-['Mona_Sans',_sans-serif]">
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center gap-2 mb-2'>
            <div className='w-12 h-12 bg-[#f63a9e] rounded-full flex items-center justify-center'>
              <div className='w-4 h-4 bg-white rounded-full' />
            </div>
            <span
              className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e]"
              style={{ fontSize: '32px', fontWeight: '800' }}
            >
              Photify
            </span>
          </div>
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif]"
            style={{ fontSize: '24px', fontWeight: '600' }}
          >
            {view === 'login' ? 'Affiliate Login' : 'Forgot password'}
          </h1>
          <p className='text-gray-600 mt-2'>
            {view === 'login'
              ? 'Sign in to your affiliate dashboard'
              : 'Enter your affiliate email and we’ll send a reset link'}
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
          {view === 'login' ? (
            <form onSubmit={handleLogin} className='space-y-6'>
              {error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3'>
                  <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                  <p className='text-red-800 text-sm'>{error}</p>
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='you@example.com'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className='pl-10'
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='password'>Password</Label>
                  <button
                    type='button'
                    onClick={() => switchView('forgot')}
                    className='text-sm text-[#f63a9e] hover:text-[#e02d8d]'
                    style={{ fontWeight: 600 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <Input
                    id='password'
                    type='password'
                    placeholder='Enter your password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='pl-10'
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type='submit'
                disabled={loading}
                className='w-full h-11 bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className='space-y-6'>
              {error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3'>
                  <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                  <p className='text-red-800 text-sm'>{error}</p>
                </div>
              )}
              {success && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3'>
                  <CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
                  <p className='text-green-800 text-sm'>{success}</p>
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='forgot-email'>Email</Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <Input
                    id='forgot-email'
                    type='email'
                    placeholder='you@example.com'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className='pl-10'
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type='submit'
                disabled={loading}
                className='w-full h-11 bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>

              <button
                type='button'
                onClick={() => switchView('login')}
                className='w-full inline-flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-900'
              >
                <ArrowLeft className='w-4 h-4' />
                Back to sign in
              </button>
            </form>
          )}

          {view === 'login' && (
            <p className='text-center text-sm text-gray-500 mt-6'>
              Not an affiliate yet?{' '}
              <a
                href='/affiliate'
                className='text-[#f63a9e] hover:text-[#e02d8d]'
                style={{ fontWeight: 600 }}
              >
                Apply here
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
