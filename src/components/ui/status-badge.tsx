import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary';
}

/**
 * Unified status badge component for reports
 * Eliminates duplicate status logic in Dashboard and Reports pages
 */
export const StatusBadge = ({ status, variant = 'default' }: StatusBadgeProps) => {
  switch (status) {
    case 'ready':
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          Prêt
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">
          En cours
        </Badge>
      );
    case 'paid':
      return (
        <Badge className="bg-mint/10 text-mint-foreground border-mint/20">
          Payé
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          Échoué
        </Badge>
      );
    default:
      return <Badge variant={variant === 'secondary' ? 'secondary' : 'default'}>Brouillon</Badge>;
  }
};
