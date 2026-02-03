/**
 * Minimal Deno type declarations for Edge Functions
 * These extend/augment the built-in Deno types without conflicting
 */

// The serve function from Deno's HTTP server
declare function serve(handler: (req: Request) => Promise<Response> | Response): void;

// EdgeRuntime for background tasks (Supabase-specific)
declare namespace EdgeRuntime {
  function waitUntil(promise: Promise<unknown>): void;
}
