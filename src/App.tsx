import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Protected({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading'|'ok'|'deny'>('loading');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const j = localStorage.getItem('jsessionid');
        const k = localStorage.getItem('sessionkey') || (j ? `sess:${j}` : null);
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ form: 333, sessionkey: k }),
        });
        const json = await res.json();
        if (!alive) return;
        setState(json?.result ? 'ok' : 'deny');
        if (!json?.result) window.location.replace('/');
      } catch {
        if (!alive) return;
        setState('deny');
        window.location.replace('/');
      }
    })();
    return () => { alive = false; };
  }, []);

  if (state === 'loading') return <div className="p-6 text-sm">Validando sesión… / Validating session…</div>;
  if (state === 'deny') return null;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inicio" element={<Protected><Index /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
