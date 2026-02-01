import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReports } from '@/hooks/useReports';
import { Report } from '@/types/report';
import { 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';

const ReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getReport, processReport } = useReports();
  const [report, setReport] = useState<Report | undefined>();
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    if (id) {
      const r = getReport(id);
      setReport(r);
      
      // If processing, simulate progress
      if (r?.status === 'processing') {
        const interval = setInterval(() => {
          setProcessingProgress(prev => {
            if (prev >= 95) {
              clearInterval(interval);
              return prev;
            }
            return prev + Math.random() * 15;
          });
        }, 500);

        // Check for completion
        const checkInterval = setInterval(() => {
          const updated = getReport(id);
          if (updated?.status === 'ready') {
            setReport(updated);
            setProcessingProgress(100);
            clearInterval(checkInterval);
          }
        }, 1000);

        return () => {
          clearInterval(interval);
          clearInterval(checkInterval);
        };
      }
    }
  }, [id, getReport]);

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Report not found</h2>
            <Link to="/app/reports">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to reports
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderStatus = () => {
    switch (report.status) {
      case 'processing':
        return (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Generating your report...
              </h2>
              <p className="text-muted-foreground mb-6">
                Our AI is analyzing your inputs and competitors
              </p>
              <Progress value={processingProgress} className="max-w-md mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                This usually takes 5-10 seconds
              </p>
            </CardContent>
          </Card>
        );
      
      case 'ready':
        return (
          <Card className="mb-8 border-primary">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Your report is ready!
              </h2>
              <p className="text-muted-foreground mb-6">
                Download your premium PDF report below
              </p>
              <Button size="lg" className="px-8">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        );
      
      case 'failed':
        return (
          <Card className="mb-8 border-destructive">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Generation failed
              </h2>
              <p className="text-muted-foreground mb-6">
                Something went wrong. Please try again.
              </p>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => processReport(report.id)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Back link */}
          <Link to="/app/reports" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to reports
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {report.inputPayload.businessName}
              </h1>
              <p className="text-muted-foreground">
                {report.inputPayload.sector} • {report.inputPayload.location.city}, {report.inputPayload.location.country}
              </p>
            </div>
            <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
              {report.status}
            </Badge>
          </div>

          {/* Status */}
          {renderStatus()}

          {/* Report Preview (when ready) */}
          {report.status === 'ready' && report.output && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.output.executiveSummary.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground text-sm leading-relaxed">
                    {report.output.marketOverview}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Competitor</th>
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Strengths</th>
                          <th className="text-left py-2 pr-4 font-medium text-foreground">Weaknesses</th>
                          <th className="text-left py-2 font-medium text-foreground">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.output.competitorTable.map((comp, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-3 pr-4 font-medium text-foreground">{comp.name}</td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {comp.strengths?.slice(0, 2).join(', ')}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {comp.weaknesses?.slice(0, 2).join(', ')}
                            </td>
                            <td className="py-3 text-muted-foreground">{comp.priceRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>30/60/90 Day Action Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {report.output.actionPlan30_60_90.map((plan) => (
                      <div key={plan.timeframe}>
                        <h4 className="font-semibold text-primary mb-3">
                          {plan.timeframe} Days
                        </h4>
                        <ul className="space-y-2">
                          {plan.tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <div className="w-4 h-4 rounded border border-primary/30 flex-shrink-0 mt-0.5" />
                              <span className="text-foreground">{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm mb-4">
                  This is a preview. Download the full PDF for all sections.
                </p>
                <Button size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Full PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportDetail;
