import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const Example = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Example Benchmark Report
            </h1>
            <p className="text-muted-foreground">
              See what you'll get with your benchmark report
            </p>
          </div>

          {/* Sample Report Preview */}
          <Card className="mb-8 overflow-hidden">
            {/* Cover Page */}
            <div className="bg-primary/5 p-12 text-center border-b border-border">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Benchmark Report
              </h2>
              <p className="text-xl text-primary mb-4">TechStart Solutions</p>
              <p className="text-muted-foreground text-sm">
                SaaS / Software • San Francisco, CA<br />
                Generated January 2024
              </p>
            </div>

            <CardContent className="p-8 space-y-8">
              {/* Executive Summary */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                  Executive Summary
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Your market position shows strong differentiation potential in the mid-tier segment
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Primary competitors focus on price, leaving quality-focused positioning underserved
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Recommended pricing strategy: value-based pricing with tiered packages
                  </li>
                </ul>
              </div>

              {/* Competitor Table (blurred) */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                  Competitor Analysis
                </h3>
                <div className="relative">
                  <div className="blur-sm select-none">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-foreground">Competitor</th>
                          <th className="text-left py-2 text-foreground">Strengths</th>
                          <th className="text-left py-2 text-foreground">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-2">Competitor A</td>
                          <td className="py-2">Brand recognition, Enterprise features</td>
                          <td className="py-2">$99-499/mo</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">Competitor B</td>
                          <td className="py-2">Low pricing, Modern UI</td>
                          <td className="py-2">$29-149/mo</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <span className="text-sm text-muted-foreground">
                      Full competitor data in your report
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Plan Preview */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                  30/60/90 Day Action Plan
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {['30 Days', '60 Days', '90 Days'].map((period) => (
                    <div key={period} className="bg-muted/20 rounded-lg p-4">
                      <h4 className="font-medium text-primary text-sm mb-3">{period}</h4>
                      <div className="space-y-2">
                        <div className="h-3 bg-foreground/10 rounded w-full" />
                        <div className="h-3 bg-foreground/10 rounded w-4/5" />
                        <div className="h-3 bg-foreground/10 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Ready to get your personalized benchmark report?
            </p>
            <Link to="/app/new">
              <Button size="lg">
                Generate my benchmark — $4.99
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Example;
