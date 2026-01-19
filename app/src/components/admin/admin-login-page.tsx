import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, AlertCircle } from 'lucide-react';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAdmin();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Invalid email or password');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-['Mona_Sans',_sans-serif]">
      <div className='w-full max-w-md'>
        {/* Logo */}
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
            Admin Login
          </h1>
          <p className='text-gray-600 mt-2'>Access the management dashboard</p>
        </div>

        {/* Login Form */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
          <form onSubmit={handleSubmit} className='space-y-6'>
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
                  placeholder='Enter email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='pl-10'
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  id='password'
                  type='password'
                  placeholder='Enter password'
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
              className='w-full bg-[#f63a9e] hover:bg-[#e02d8d]'
              style={{ height: '50px' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </Button>
          </form>

          <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-xs text-blue-900 font-semibold mb-2'>
              📝 To create an admin account:
            </p>
            <ol className='text-xs text-blue-800 space-y-1 ml-4 list-decimal'>
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to Authentication → Users</li>
              <li>Click &quot;Add User&quot; and create an account</li>
              <li>Use those credentials to login here</li>
            </ol>
          </div>
        </div>

        <div className='text-center mt-6'>
          <button
            onClick={() => navigate('/')}
            className='text-gray-600 hover:text-[#f63a9e] transition-colors text-sm'
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
