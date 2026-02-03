/**
 * Unified download utility for all document types (PDF, Excel, PowerPoint)
 * Eliminates triplication of blob download logic
 */

export interface DownloadOptions {
  format: 'pdf' | 'excel' | 'powerpoint';
  reportId: string;
  businessName?: string;
}

/**
 * Download a generated document directly from Supabase storage or function
 * Handles both storage URLs and on-demand generation
 */
export async function downloadDocument(
  options: DownloadOptions,
  getAccessToken: () => Promise<string | null>
): Promise<{ success: boolean; error?: string }> {
  const { format, reportId, businessName = 'Benchmark' } = options;

  try {
    // Map format to file extension and MIME type
    const formatConfig: Record<string, { ext: string; mime: string; endpoint: string }> = {
      pdf: {
        ext: 'pdf',
        mime: 'application/pdf',
        endpoint: 'generate-pdf',
      },
      excel: {
        ext: 'xlsx',
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        endpoint: 'generate-excel',
      },
      powerpoint: {
        ext: 'pptx',
        mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        endpoint: 'generate-slides',
      },
    };

    const config = formatConfig[format];
    if (!config) throw new Error(`Unknown format: ${format}`);

    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    // Call the generation function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${config.endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${format} generation failed (${response.status}): ${errorText}`);
    }

    // Check if response is actually a file
    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes(config.mime)) {
      throw new Error(`Invalid response type: expected ${config.mime}, got ${contentType}`);
    }

    // Download the file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Extract filename from Content-Disposition header if available
    const disposition = response.headers.get('Content-Disposition');
    let filename = `Benchmark_${reportId.substring(0, 8)}.${config.ext}`;
    if (disposition) {
      const match = disposition.match(/filename="([^"]+)"/);
      if (match) filename = match[1];
    }

    // Trigger browser download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Download] Failed to download ${format}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Download multiple documents in parallel
 * Useful for downloading all available formats at once
 */
export async function downloadAllDocuments(
  reportId: string,
  formats: DownloadOptions['format'][],
  getAccessToken: () => Promise<string | null>,
  businessName?: string
): Promise<{ successes: DownloadOptions['format'][]; failures: Array<{ format: string; error: string }> }> {
  const results = await Promise.all(
    formats.map((format) =>
      downloadDocument({ format, reportId, businessName }, getAccessToken)
    )
  );

  const successes: DownloadOptions['format'][] = [];
  const failures: Array<{ format: string; error: string }> = [];

  for (let i = 0; i < formats.length; i++) {
    if (results[i].success) {
      successes.push(formats[i]);
    } else {
      failures.push({
        format: formats[i],
        error: results[i].error || 'Unknown error',
      });
    }
  }

  return { successes, failures };
}
