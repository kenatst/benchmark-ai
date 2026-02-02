import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataCardProps {
    title: string;
    value?: string | ReactNode;
    subtitle?: string;
    children?: ReactNode;
    variant?: 'default' | 'highlight' | 'muted';
    className?: string;
}

export const DataCard = ({
    title,
    value,
    subtitle,
    children,
    variant = 'default',
    className
}: DataCardProps) => {
    const variants = {
        default: 'bg-card border-border',
        highlight: 'bg-foreground text-background border-foreground',
        muted: 'bg-muted/50 border-border/50'
    };

    return (
        <div
            className={cn(
                "rounded-xl border p-5 transition-all duration-200 hover:shadow-sm",
                variants[variant],
                className
            )}
        >
            <p className={cn(
                "text-xs font-medium uppercase tracking-wider mb-2",
                variant === 'highlight' ? 'text-background/70' : 'text-muted-foreground'
            )}>
                {title}
            </p>
            {value && (
                <p className={cn(
                    "text-xl font-bold",
                    variant === 'highlight' ? 'text-background' : 'text-foreground'
                )}>
                    {value}
                </p>
            )}
            {subtitle && (
                <p className={cn(
                    "text-sm mt-1",
                    variant === 'highlight' ? 'text-background/70' : 'text-muted-foreground'
                )}>
                    {subtitle}
                </p>
            )}
            {children}
        </div>
    );
};
