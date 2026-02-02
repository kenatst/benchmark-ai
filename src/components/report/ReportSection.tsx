import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ReportSectionProps {
    id: string;
    number: number;
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
}

export const ReportSection = ({
    id,
    number,
    title,
    subtitle,
    children,
    className
}: ReportSectionProps) => {
    return (
        <section
            id={id}
            className={cn("scroll-mt-28 py-12 first:pt-0", className)}
        >
            {/* Section Header */}
            <div className="mb-8">
                <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-5xl font-black text-muted-foreground/20">
                        {String(number).padStart(2, '0')}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                        {title}
                    </h2>
                </div>
                {subtitle && (
                    <p className="text-muted-foreground ml-16 md:ml-20">
                        {subtitle}
                    </p>
                )}
                <div className="h-px bg-border mt-6" />
            </div>

            {/* Section Content */}
            <div className="space-y-6">
                {children}
            </div>
        </section>
    );
};
