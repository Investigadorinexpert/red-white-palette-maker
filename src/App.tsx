import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useNavigate } from 'react-router-dom';

const queryClient = new QueryClient();

function Protected({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<'loading'|'ok'|'deny'>('loading');

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          credentials: 'include',               // <- crucial
          headers: { 'content-type': 'application/json', 'x-csrf-token': '1' },
          body: JSON.stringify({ form: 333 }),  // <- sin sessionkey
          signal: ac.signal,
        });

        // Defensive: 401/403 => deny
        if (!res.ok) { setState('deny'); return navigate('/', { replace: true }); }

        const json = await res.json();
        if (json?.result === true) {
          setState('ok');
        } else {
          setState('deny');
          navigate('/', { replace: true });
        }
      } catch {
        if (!ac.signal.aborted) {
          setState('deny');
          navigate('/', { replace: true });
        }
      }
    })();
    return () => ac.abort();
  }, [navigate]);

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
