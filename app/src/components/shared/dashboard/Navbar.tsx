import { Button } from "@/components/ui/button"
import { Save, User, ShoppingCart } from "lucide-react"
import logo from "@/assets/images/logo.svg" 

const Navbar = () => {
  return (
    <header className="w-full bg-background border-b shadow-sm">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center space-x-2 cursor-pointer">
          <img src={logo} alt="WHITEWALL Logo" className="h-10 w-auto" /> {/* <-- replaced text with logo */}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          {/* Save Product (icon + text) */}
          <Button variant="ghost" className="flex items-center space-x-2 text-sm px-3 py-2 cursor-pointer">
            <Save className="h-5 w-5" />
            <span>Save Product</span>
          </Button>

          {/* User icon */}
          <Button variant="ghost" size="icon" className="h-10 w-10 cursor-pointer">
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Button>

          {/* Shopping cart */}
          <Button variant="ghost" size="icon" className="h-10 w-10 cursor-pointer">
            <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Cart</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
