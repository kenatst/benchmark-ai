import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewBenchmark from "./pages/NewBenchmark";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Example from "./pages/Example";
import Legal from "./pages/Legal";
import Settings from "./pages/Settings";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/new" element={<NewBenchmark />} />
            <Route path="/app/reports" element={<Reports />} />
            <Route path="/app/reports/:id" element={<ReportDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/example" element={<Example />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
