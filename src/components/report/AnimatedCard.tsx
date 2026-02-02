import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
}

export const AnimatedCard = ({
  title,
  icon,
  children,
  className,
  badge
}: AnimatedCardProps) => {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-6 transition-shadow duration-200 hover:shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        {icon && (
          <span className="text-muted-foreground">
            {icon}
          </span>
        )}
        <h3 className="text-lg font-semibold text-foreground flex-1">
          {title}
        </h3>
        {badge}
      </div>

      {/* Content */}
      {children}
    </div>
  );
};
