import { Link } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { format } from 'date-fns';

const Dashboard = () => {
  const { getUserReports, isLoading } = useReports();
  const reports = getUserReports();
  
  const readyReports = reports.filter(r => r.status === 'ready').length;
  const lastReport = reports[0];

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Manage your benchmark reports</p>
            </div>
            <Link to="/app/new">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Generate New Benchmark
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Reports Generated</CardDescription>
                <CardTitle className="text-3xl">{readyReports}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Last Report</CardDescription>
                <CardTitle className="text-lg">
                  {lastReport 
                    ? format(new Date(lastReport.createdAt), 'MMM d, yyyy')
                    : 'No reports yet'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Total Saved</CardDescription>
                <CardTitle className="text-3xl text-primary">
                  ${readyReports * 50}+
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  vs. traditional market research
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Reports</h2>
            
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
              <div className="grid gap-4">
                {reports.map((report) => (
                  <Link key={report.id} to={`/app/reports/${report.id}`}>
                    <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {report.inputPayload.businessName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {report.inputPayload.sector} • {report.inputPayload.location.city}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(report.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {getStatusBadge(report.status)}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
