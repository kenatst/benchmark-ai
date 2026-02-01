import { useState, useEffect } from 'react';
import { Report, ReportInput, ReportOutput } from '@/types/report';
import { mockReportOutput } from '@/data/mockReport';

// Mock user ID for now
const MOCK_USER_ID = 'user-123';

// Storage key
const REPORTS_KEY = 'benchmark_reports';

const getStoredReports = (): Report[] => {
  const stored = localStorage.getItem(REPORTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveReports = (reports: Report[]) => {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
};

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setReports(getStoredReports());
    setIsLoading(false);
  }, []);

  const createReport = (input: ReportInput): Report => {
    const newReport: Report = {
      id: `report-${Date.now()}`,
      userId: MOCK_USER_ID,
      createdAt: new Date().toISOString(),
      status: 'draft',
      inputPayload: input,
      emailSent: false,
    };
    
    const updatedReports = [newReport, ...reports];
    setReports(updatedReports);
    saveReports(updatedReports);
    
    return newReport;
  };

  const processReport = async (reportId: string): Promise<Report> => {
    // Update status to processing
    let updatedReports = reports.map(r => 
      r.id === reportId ? { ...r, status: 'processing' as const } : r
    );
    setReports(updatedReports);
    saveReports(updatedReports);

    // Simulate processing delay (5-10 seconds)
    const delay = 5000 + Math.random() * 5000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Generate mock output
    const report = updatedReports.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found');

    const output: ReportOutput = {
      ...mockReportOutput,
      title: `Benchmark Report: ${report.inputPayload.businessName}`,
    };

    // Update with output
    updatedReports = updatedReports.map(r => 
      r.id === reportId 
        ? { ...r, status: 'ready' as const, output, pdfUrl: '#mock-pdf' }
        : r
    );
    setReports(updatedReports);
    saveReports(updatedReports);

    return updatedReports.find(r => r.id === reportId)!;
  };

  const getReport = (reportId: string): Report | undefined => {
    return reports.find(r => r.id === reportId);
  };

  const getUserReports = (): Report[] => {
    return reports.filter(r => r.userId === MOCK_USER_ID);
  };

  return {
    reports,
    isLoading,
    createReport,
    processReport,
    getReport,
    getUserReports,
  };
};
