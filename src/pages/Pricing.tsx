import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, Sparkles } from 'lucide-react';

const features = [
  'Executive summary with key insights',
  'Detailed competitor comparison table',
  'Positioning matrix visualization',
  'Pricing strategy recommendations',
  'Go-to-market channel analysis',
  'Risk assessment & compliance checks',
  '30/60/90-day action plan',
  'Premium PDF format',
  'Instant delivery',
  '24-hour refund policy'
];

const faqs = [
  {
    question: 'How long does it take to generate a report?',
    answer: 'Most reports are generated within 10 seconds after completing the questionnaire and payment. Complex reports with many competitors may take up to 30 seconds.'
  },
  {
    question: 'What inputs do I need to provide?',
    answer: 'You\'ll answer questions about your business, sector, location, pricing, differentiators, and optionally your competitors. The more detail you provide, the more accurate the report.'
  },
  {
    question: 'Can I get a refund?',
    answer: 'Yes! If your report doesn\'t meet your expectations, contact us within 24 hours for a full refund. No questions asked.'
  },
  {
    question: 'What format is the report?',
    answer: 'Reports are delivered as premium PDF documents that you can download, print, and share with your team or stakeholders.'
  },
  {
    question: 'Can I add competitor URLs?',
    answer: 'Yes! When you provide competitor URLs, we analyze them and cite them in your report. We never invent sources.'
  },
  {
    question: 'Is this legal/financial advice?',
    answer: 'No. This is decision-support benchmarking. You should validate the recommendations and consult professionals for legal or financial decisions.'
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-muted-foreground text-lg">
              One price. Everything included. No subscriptions.
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="max-w-lg mx-auto mb-16 border-primary">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Benchmark Report</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold text-foreground">$4.99</span>
                <span className="text-muted-foreground ml-2">per report</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/app/new" className="block">
                <Button size="lg" className="w-full">
                  Generate my benchmark
                </Button>
              </Link>

              <p className="text-center text-xs text-muted-foreground">
                Secure payment via Stripe
              </p>
            </CardContent>
          </Card>

          {/* Coming Soon */}
          <Card className="max-w-lg mx-auto mb-16 bg-muted/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Coming Soon</span>
              </div>
              <h3 className="font-medium text-foreground mb-2">
                Enhanced Report with Sources
              </h3>
              <p className="text-sm text-muted-foreground">
                Deep competitor analysis with automated web scraping, live pricing data, 
                and verified source citations. Stay tuned!
              </p>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
