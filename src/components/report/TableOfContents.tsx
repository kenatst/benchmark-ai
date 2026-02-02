import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
  icon?: string;
}

interface TableOfContentsProps {
  sections: Section[];
  className?: string;
}

export const TableOfContents = ({ sections, className }: TableOfContentsProps) => {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className={cn("hidden lg:block", className)}>
      <div className="sticky top-28">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Sommaire
        </h4>
        <ul className="space-y-1">
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2",
                  activeSection === section.id
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span className="text-xs text-muted-foreground w-5">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="truncate">{section.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
