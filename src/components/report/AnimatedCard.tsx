import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  title: string;
  icon?: ReactNode;
  iconBg?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
  badge?: ReactNode;
}

export const AnimatedCard = ({ 
  title, 
  icon, 
  iconBg = 'bg-primary/10', 
  children, 
  className,
  delay = 0,
  badge
}: AnimatedCardProps) => {
  return (
    <Card 
      className={cn(
        "animate-fade-up opacity-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      <CardHeader className="flex flex-row items-center gap-3">
        {icon && (
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-110",
            iconBg
          )}>
            {icon}
          </div>
        )}
        <div className="flex items-center gap-2 flex-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          {badge}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
