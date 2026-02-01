import { XCircle, CheckCircle, ArrowRight } from 'lucide-react';

const problems = [
  "Hard to understand competitors & pricing",
  "Generic reports waste time and money",
  "Decision paralysis without clear data"
];

const solutions = [
  "Answer a focused questionnaire",
  "We generate a structured benchmark",
  "Get a 30/60/90-day action plan"
];

export const ProblemSolution = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            From confusion to clarity
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Stop guessing. Get a structured, actionable benchmark that helps you make better decisions.
          </p>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Problems */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-6">The Problem</h3>
              {problems.map((problem, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20"
                >
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-foreground text-sm">{problem}</p>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="hidden md:flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-6">The Solution</h3>
              {solutions.map((solution, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20"
                >
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-foreground text-sm">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
