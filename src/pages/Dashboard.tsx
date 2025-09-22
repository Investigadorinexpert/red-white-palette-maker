// src/pages/Dashboard.tsx
import React from "react";
import { Plus } from "lucide-react";

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

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-border">
        <DashboardSidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        {/* Contenido scrollable */}
        <main className="flex-1 overflow-auto p-6 space-y-8">
          {/* Fila de acciones */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Tablero</h2>
              <p className="text-sm text-muted-foreground">Overview del portafolio de POCs.</p>
            </div>
            <div className="flex gap-3">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Nueva POC</span>
              </Button>
            </div>
          </div>

          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="POCs totales" value="24" change={{ type: "increase", value: "vs mes pasado" }} variant="primary" />
            <StatsCard title="POCs finalizadas" value="10" change={{ type: "increase", value: "vs mes pasado" }} />
            <StatsCard title="POCs en curso" value="12" change={{ type: "increase", value: "vs mes pasado" }} />
            <StatsCard title="POCs pendientes" value="2" change={{ type: "decrease", value: "en discusión" }} />
          </div>

          {/* Charts + contenido */}
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
