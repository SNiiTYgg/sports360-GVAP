/**
 * App Component - campus360
 * 
 * Root application component with providers and routing.
 * Integrates Firebase Auth for poll voting and Supabase for data.
 */

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { PollProvider } from "@/contexts/PollContext";
import { AdminRoleProvider } from "@/contexts/AdminRoleContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// React Query client for data fetching
const queryClient = new QueryClient();

/**
 * Main App component with all providers
 * 
 * IMPORTANT: AdminRoleProvider must exist ONCE and NEVER unmount.
 * It's placed after AuthProvider, before BrowserRouter.
 */
const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminRoleProvider>
          <PollProvider>
            <TooltipProvider>
              {/* Toast notifications */}
              <Toaster />
              <Sonner />

              {/* Router */}
              <BrowserRouter>
                <Routes>
                  {/* Main page with tab navigation */}
                  <Route path="/" element={<Index />} />

                  {/* Admin authentication */}
                  <Route path="/auth" element={<Auth />} />

                  {/* Admin dashboard */}
                  <Route path="/admin" element={<Admin />} />

                  {/* Catch-all for 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </PollProvider>
        </AdminRoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

