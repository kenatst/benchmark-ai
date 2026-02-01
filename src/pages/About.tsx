import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Target, Shield, Sparkles } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Actionable Insights',
    description: 'Every recommendation is designed to be actionable. No fluff, no filler — just clear steps you can take today.'
  },
  {
    icon: Shield,
    title: 'Honest Analysis',
    description: 'We don\'t invent sources or make up data. If you provide competitor URLs, we cite them. If we make assumptions, we tell you.'
  },
  {
    icon: Sparkles,
    title: 'Premium Quality',
    description: 'Beautiful reports you\'ll be proud to share with your team, investors, or stakeholders. First impressions matter.'
  }
];

const methodology = [
  {
    question: 'What inputs are used?',
    answer: 'Your benchmark is generated from the information you provide: business details, sector, location, pricing, differentiators, goals, and competitors. The more detail you provide, the more tailored your report.'
  },
  {
    question: 'How is the report structured?',
    answer: 'Our AI analyzes your inputs against market patterns and generates a structured report including: executive summary, market overview, competitor analysis, positioning matrix, pricing recommendations, go-to-market strategy, risk assessment, and a 30/60/90-day action plan.'
  },
  {
    question: 'What should users validate?',
    answer: 'Validate competitor pricing (markets change), verify regulatory requirements for your specific location, and confirm assumptions about your target market. The report is decision-support, not definitive research.'
  },
  {
    question: 'How do competitor URLs help?',
    answer: 'When you provide competitor website URLs, we can analyze their public positioning and cite them as sources. Without URLs, recommendations are based on general market patterns for your sector.'
  }
];

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              About AI Benchmark
            </h1>
            <p className="text-muted-foreground text-lg">
              We believe every business deserves access to professional market intelligence — 
              without the enterprise price tag.
            </p>
          </div>

          {/* Mission */}
          <Card className="max-w-3xl mx-auto mb-16">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Traditional market research costs thousands and takes weeks. 
                We're democratizing competitive intelligence by combining AI with 
                structured frameworks used by top consultants. In 10 minutes, 
                you get the same strategic clarity that Fortune 500 companies pay six figures for.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              What We Stand For
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Methodology */}
          <div id="methodology" className="max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Methodology
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {methodology.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/app/new">
              <Button size="lg">Generate my benchmark</Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
