import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { ReportInput, ReportOutput } from '@/types/report';

export interface Report {
  id: string;
  user_id: string;
  status: 'draft' | 'paid' | 'processing' | 'ready' | 'failed' | 'abandoned';
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
  processing_step?: string;
  processing_progress?: number;
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

    // Exclude abandoned reports from the list
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'abandoned')
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

  const triggerGeneration = async (reportId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { reportId },
      });

      if (error) {
        console.error('Generation error:', error);
        return false;
      }

      // Update local state to processing
      setReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, status: 'processing' as const } : r)
      );

      return data?.success || false;
    } catch (error) {
      console.error('Error triggering generation:', error);
      return false;
    }
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

  const deleteReport = async (reportId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report:', error);
      return false;
    }

    setReports(prev => prev.filter(r => r.id !== reportId));
    return true;
  };

  return {
    reports,
    isLoading,
    createReport,
    createCheckoutSession,
    triggerGeneration,
    getReport,
    refetchReport,
    deleteReport,
    refetch: fetchReports,
  };
};
