import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReportInput } from '@/types/report';
import { Check, CreditCard } from 'lucide-react';

interface StepReviewProps {
  data: ReportInput;
  onPayment: () => void;
  isProcessing: boolean;
}

const reportIncludes = [
  'Executive summary with key insights',
  'Detailed competitor comparison table',
  'Positioning matrix visualization',
  'Pricing strategy recommendations',
  'Go-to-market channel analysis',
  'Risk assessment & compliance checks',
  '30/60/90-day action plan',
  'Assumptions to validate'
];

export const StepReview = ({ data, onPayment, isProcessing }: StepReviewProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Review & generate</h2>
        <p className="text-muted-foreground">Review your inputs and generate your benchmark report</p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Your Benchmark Summary</h3>
          
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Business</p>
              <p className="font-medium text-foreground">{data.businessName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sector</p>
              <p className="font-medium text-foreground">{data.sector}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium text-foreground">{data.location.city}, {data.location.country}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Target</p>
              <p className="font-medium text-foreground">{data.targetCustomers.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Price Range</p>
              <p className="font-medium text-foreground">${data.priceRange.min} - ${data.priceRange.max}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Competitors</p>
              <p className="font-medium text-foreground">{data.competitors.length} added</p>
            </div>
          </div>

          {data.differentiators.length > 0 && (
            <div>
              <p className="text-muted-foreground text-sm mb-2">Differentiators</p>
              <div className="flex flex-wrap gap-1">
                {data.differentiators.map((d) => (
                  <span key={d} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What's included */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Your report will include:</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {reportIncludes.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card className="border-primary">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <p className="text-3xl font-bold text-foreground">$4.99</p>
            <p className="text-muted-foreground text-sm">One-time payment</p>
          </div>
          
          <Button 
            size="lg" 
            className="w-full sm:w-auto px-8"
            onClick={onPayment}
            disabled={isProcessing}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Pay & generate my benchmark'}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Secure payment • Instant delivery • 24-hour refund policy
          </p>
        </CardContent>
      </Card>

      {/* Trust microcopy */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>We don't invent sources. If you provide competitor URLs, we cite them.</p>
        <p>This is decision-support, not legal or financial advice.</p>
      </div>
    </div>
  );
};
