import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const FinalCTA = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to benchmark your market?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of businesses making smarter decisions with data-driven insights.
          </p>
          
          <Link to="/app/new">
            <Button size="lg" className="text-base px-10 py-6 h-auto">
              Generate my benchmark
            </Button>
          </Link>
          
          <p className="mt-4 text-muted-foreground text-sm">
            $4.99 — delivered instantly as a premium PDF
          </p>

          {/* Trust microcopy */}
          <div className="mt-8 pt-8 border-t border-border max-w-lg mx-auto">
            <p className="text-muted-foreground text-xs leading-relaxed">
              We don't invent sources. If you provide competitor URLs, we cite them.
              This is decision-support, not legal or financial advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
