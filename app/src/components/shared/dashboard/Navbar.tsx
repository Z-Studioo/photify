import { Button } from '@/components/ui/button';
import { User, ShoppingCart } from 'lucide-react';
import logo from '@/assets/images/logo.svg';

const Navbar = () => {
  return (
    <header className='w-full bg-background border-b shadow-sm'>
      <div className='container mx-auto px-6 py-3 flex items-center justify-between'>
        {/* Left: Logo */}
        <div className='flex items-center space-x-2 cursor-pointer'>
          <img src={logo} alt='WHITEWALL Logo' className='h-10 w-auto' />{' '}
          {/* <-- replaced text with logo */}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
