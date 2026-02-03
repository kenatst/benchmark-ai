/**
 * SHARED CONSTANTS FOR ALL SUPABASE EDGE FUNCTIONS
 * Prevents duplication across 10+ functions
 */

// ============================================
// CORS HEADERS - Used in all functions
// ============================================
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// INSTITUTIONAL COLOR PALETTE - McKinsey-inspired
// ============================================
export const INSTITUTIONAL_COLORS = {
  primary: "#1a3a5c",     // Deep navy
  secondary: "#7c6b9c",   // Muted purple
  accent: "#b89456",      // Gold accent
  success: "#2d7a5a",     // Forest green
  warning: "#b38f40",     // Amber
  danger: "#9a4040",      // Wine red
};

// ============================================
// PDF PAGE LAYOUT CONSTANTS
// ============================================
export const PDF_PAGE = {
  WIDTH: 595.28,
  HEIGHT: 841.89,
  MARGIN_TOP: 72,
  MARGIN_BOTTOM: 72,
  MARGIN_LEFT: 60,
  MARGIN_RIGHT: 60,
};

export const PDF_TYPOGRAPHY = {
  headingFont: "Helvetica Neue",
  bodyFont: "Georgia",
  monoFont: "Courier",
};

// ============================================
// RESPONSE HEADERS - Standard for all functions
// ============================================
export const getJsonHeaders = () => ({
  ...corsHeaders,
  "Content-Type": "application/json",
});

export const getPdfHeaders = () => ({
  ...corsHeaders,
  "Content-Type": "application/pdf",
});

export const getExcelHeaders = () => ({
  ...corsHeaders,
  "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

export const getPowerpointHeaders = () => ({
  ...corsHeaders,
  "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
});
