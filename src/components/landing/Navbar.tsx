import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'PRODUIT', href: '#product' },
    { label: 'TARIFS', href: '/pricing' },
    { label: 'À PROPOS', href: '/about' },
    { label: 'EXEMPLE', href: '/example' },
  ];

  const isLandingPage = location.pathname === '/';

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${scrolled ? 'top-2' : 'top-6'}`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full bg-card/95 backdrop-blur-xl border border-border/80 shadow-xl transition-all duration-500 ${scrolled ? 'shadow-2xl' : ''}`}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-secondary transition-colors">
          <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center shadow-md">
            <span className="text-background font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-foreground text-lg hidden sm:block">Benchmark</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            item.href.startsWith('#') && isLandingPage ? (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors tracking-wide"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.href.startsWith('#') ? '/' + item.href : item.href}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors tracking-wide"
              >
                {item.label}
              </Link>
            )
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-2">
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors hidden sm:flex">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <Link to="/app/new">
            <Button size="sm" className="bg-coral/90 hover:bg-coral text-coral-foreground border-0 gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">NOUVEAU</span>
            </Button>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden mt-2 py-4 px-6 rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-xl animate-fade-in">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href.startsWith('#') ? '/' + item.href : item.href}
                className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm font-semibold rounded-xl tracking-wide"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border">
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full mb-2">Se connecter</Button>
              </Link>
              <Link to="/app/new" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Générer mon benchmark</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
