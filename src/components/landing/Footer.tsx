import { Link } from 'react-router-dom';

export const Footer = () => {
  const links = {
    product: [
      { label: 'Fonctionnalités', href: '#product' },
      { label: 'Tarifs', href: '/pricing' },
      { label: 'Exemple', href: '/example' },
    ],
    company: [
      { label: 'À propos', href: '/about' },
      { label: 'Contact', href: 'mailto:contact@benchmark.ai' },
    ],
    legal: [
      { label: 'CGV', href: '/legal' },
      { label: 'Confidentialité', href: '/legal' },
      { label: 'Mentions légales', href: '/legal' },
    ],
  };

  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-md">
                <span className="text-background font-bold text-xl">B</span>
              </div>
              <span className="font-bold text-foreground text-xl">Benchmark</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Votre outil de benchmark intelligent pour des décisions éclairées.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-sm tracking-wide">PRODUIT</h4>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-sm tracking-wide">ENTREPRISE</h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-sm tracking-wide">LÉGAL</h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Benchmark. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Fait avec ❤️ en France</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
