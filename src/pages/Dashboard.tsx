// src/pages/Dashboard.tsx
import React, { useCallback, useState } from "react";
import { Plus, Upload } from "lucide-react";

// UI building blocks (los que ya mostraste en /components)
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatsCard } from "@/components/StatsCard";
import { ProjectAnalyticsChart } from "@/components/ProjectAnalyticsChart";
import { TeamCollaboration } from "@/components/TeamCollaboration";
import { ProjectProgress } from "@/components/ProjectProgress";
import { RemindersCard } from "@/components/RemindersCard";
import { ProjectTasks } from "@/components/ProjectTasks";
import { TimeTracker } from "@/components/TimeTracker";
import { Button } from "@/components/ui/button";

async function postJson(url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "x-csrf-token": "1" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  const onLogout = useCallback(async () => {
    setLoading(true);
    try { await postJson("/api/logout", { form: 222 }); } catch {}
    finally {
      try { localStorage.removeItem("profile"); } catch {}
      window.location.replace("/"); // hard redirect: limpia todo el SPA state
    }
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-border">
        <DashboardSidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header superior (puedes quitar si DashboardHeader ya trae su propio topbar) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-semibold">Inicio / Dashboard</h1>
            <p className="text-sm text-muted-foreground">Plan, prioritize, and get it done.</p>
          </div>
          <Button
            onClick={onLogout}
            disabled={loading}
            className="bg-white text-black hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Saliendo…" : "Cerrar sesión / Logout"}
          </Button>
        </div>
        <DashboardHeader />

        {/* Si prefieres usar TU DashboardHeader por branding/filters/etc */}

        {/* Content scrollable */}
        <main className="flex-1 overflow-auto p-6 space-y-8">
          {/* Actions row */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Overview del portafolio de proyectos.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Total Projects" value="24" change={{ type: "increase", value: "vs last month" }} variant="primary" />
            <StatsCard title="Ended Projects" value="10" change={{ type: "increase", value: "vs last month" }} />
            <StatsCard title="Running Projects" value="12" change={{ type: "increase", value: "vs last month" }} />
            <StatsCard title="Pending Project" value="2" change={{ type: "decrease", value: "on discuss" }} />
          </div>

          {/* Charts + content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1"><ProjectAnalyticsChart /></div>
            <div className="lg:col-span-1"><RemindersCard /></div>
            <div className="lg:col-span-1"><ProjectTasks /></div>
          </div>

          {/* Bottom widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1"><TeamCollaboration /></div>
            <div className="lg:col-span-1"><ProjectProgress /></div>
            <div className="lg:col-span-1"><TimeTracker /></div>
          </div>
        </main>
      </div>
    </div>
  );
}
