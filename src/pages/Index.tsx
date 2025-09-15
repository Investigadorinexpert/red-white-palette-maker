import React from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';
import { ProjectAnalyticsChart } from '@/components/ProjectAnalyticsChart';
import { TeamCollaboration } from '@/components/TeamCollaboration';
import { ProjectProgress } from '@/components/ProjectProgress';
import { RemindersCard } from '@/components/RemindersCard';
import { ProjectTasks } from '@/components/ProjectTasks';
import { TimeTracker } from '@/components/TimeTracker';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <DashboardSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Plan, prioritize, and accomplish your tasks with ease.</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
              </Button>
              <Button className="flex items-center space-x-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Projects"
              value="24"
              change={{ type: 'increase', value: 'Increased from last month' }}
              variant="primary"
            />
            <StatsCard
              title="Ended Projects"
              value="10"
              change={{ type: 'increase', value: 'Increased from last month' }}
            />
            <StatsCard
              title="Running Projects"
              value="12"
              change={{ type: 'increase', value: 'Increased from last month' }}
            />
            <StatsCard
              title="Pending Project"
              value="2"
              change={{ type: 'decrease', value: 'On Discuss' }}
            />
          </div>

          {/* Charts and Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <ProjectAnalyticsChart />
            </div>
            <div className="lg:col-span-1">
              <RemindersCard />
            </div>
            <div className="lg:col-span-1">
              <ProjectTasks />
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TeamCollaboration />
            </div>
            <div className="lg:col-span-1">
              <ProjectProgress />
            </div>
            <div className="lg:col-span-1">
              <TimeTracker />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
