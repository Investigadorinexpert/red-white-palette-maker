import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Protected from "./routes/Protected";

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
            <Route path="/inicio" element={<Protected><Dashboard /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
