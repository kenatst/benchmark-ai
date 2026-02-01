import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Plus } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { format } from 'date-fns';

const Reports = () => {
  const { getUserReports, isLoading } = useReports();
  const reports = getUserReports();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Ready</Badge>;
      case 'processing':
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Reports</h1>
              <p className="text-muted-foreground">View and download your benchmark reports</p>
            </div>
            <Link to="/app/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No reports yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Generate your first benchmark report to get started
                </p>
                <Link to="/app/new">
                  <Button>Generate my benchmark</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Link key={report.id} to={`/app/reports/${report.id}`}>
                  <Card className="h-full hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {report.inputPayload.businessName}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {report.inputPayload.sector}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reports;
