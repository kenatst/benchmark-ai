import { Link } from 'react-router-dom';

const footerLinks = {
  product: [
    { label: 'Fonctionnalités', href: '#product' },
    { label: 'Tarifs', href: '/pricing' },
    { label: 'Exemple', href: '/example' },
  ],
  company: [
    { label: 'À propos', href: '/about' },
    { label: 'Méthodologie', href: '/about#methodology' },
  ],
  legal: [
    { label: 'Conditions', href: '/legal' },
    { label: 'Confidentialité', href: '/legal#privacy' },
    { label: 'Mentions légales', href: '/legal#disclaimer' },
  ]
};

export const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <span className="font-semibold text-foreground text-lg">Benchmark AI</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Votre benchmark concurrentiel premium, généré par IA, en 10 minutes.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Produit</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Entreprise</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Légal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2025 Benchmark AI. Tous droits réservés.
          </p>
          <p className="text-muted-foreground text-sm">
            Outil d'aide à la décision — Non-conseil juridique ou financier
          </p>
        </div>
      </div>
    </footer>
  );
};