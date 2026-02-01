import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { ReportInput, ReportOutput } from '@/types/report';
import { mockReportOutput } from '@/data/mockReport';

export interface Report {
  id: string;
  user_id: string;
  status: 'draft' | 'paid' | 'processing' | 'ready' | 'failed';
  plan: 'standard' | 'pro' | 'agency';
  input_data: ReportInput;
  output_data: ReportOutput | null;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  amount_paid: number | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export const useReports = () => {
  const { user } = useAuthContext();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!user) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data as unknown as Report[]);
    }
    
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = async (input: ReportInput, plan: 'standard' | 'pro' | 'agency' = 'standard'): Promise<Report | null> => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('reports')
      .insert([{
        user_id: user.id,
        status: 'draft' as const,
        plan: plan as 'standard' | 'pro' | 'agency',
        input_data: JSON.parse(JSON.stringify(input)),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return null;
    }

    const newReport = data as unknown as Report;
    setReports(prev => [newReport, ...prev]);
    
    return newReport;
  };

  const createCheckoutSession = async (reportId: string, plan: 'standard' | 'pro' | 'agency'): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, reportId },
      });

      if (error) {
        console.error('Checkout error:', error);
        return null;
      }

      return data?.url || null;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  };

  const processReport = async (reportId: string): Promise<Report | null> => {
    // Update status to processing
    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'processing' })
      .eq('id', reportId);

    if (updateError) {
      console.error('Error updating report status:', updateError);
      return null;
    }

    // Update local state
    setReports(prev => 
      prev.map(r => r.id === reportId ? { ...r, status: 'processing' as const } : r)
    );

    // Simulate processing delay (will be replaced by actual AI generation)
    const delay = 5000 + Math.random() * 5000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Get the report to generate output
    const report = reports.find(r => r.id === reportId);
    if (!report) return null;

    // Generate mock output (will be replaced by AI)
    const inputData = report.input_data as ReportInput;
    const output: ReportOutput = {
      ...mockReportOutput,
      title: `Benchmark Report: ${inputData.businessName || 'Unknown'}`,
    };

    // Update with output
    const { data, error } = await supabase
      .from('reports')
      .update({ 
        status: 'ready' as const, 
        output_data: JSON.parse(JSON.stringify(output)),
        completed_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error updating report:', error);
      return null;
    }

    const updatedReport = data as unknown as Report;
    setReports(prev => 
      prev.map(r => r.id === reportId ? updatedReport : r)
    );

    return updatedReport;
  };

  const getReport = (reportId: string): Report | undefined => {
    return reports.find(r => r.id === reportId);
  };

  const refetchReport = async (reportId: string): Promise<Report | null> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      return null;
    }

    const report = data as unknown as Report;
    setReports(prev => {
      const exists = prev.find(r => r.id === reportId);
      if (exists) {
        return prev.map(r => r.id === reportId ? report : r);
      }
      return [report, ...prev];
    });

    return report;
  };

  return {
    reports,
    isLoading,
    createReport,
    createCheckoutSession,
    processReport,
    getReport,
    refetchReport,
    refetch: fetchReports,
  };
};
