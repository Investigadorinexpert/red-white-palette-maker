import React from 'react';
import { Plus, Code2, Palette, Search, Layout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tasks = [
  {
    title: 'Develop API Endpoints',
    dueDate: 'Nov 25, 2024',
    icon: Code2,
    color: 'text-primary',
  },
  {
    title: 'Onboarding Flow',
    dueDate: 'Nov 28, 2024', 
    icon: Palette,
    color: 'text-info',
  },
  {
    title: 'Build Dashboard',
    dueDate: 'Nov 30, 2024',
    icon: Layout,
    color: 'text-success',
  },
  {
    title: 'Optimize Page Load',
    dueDate: 'Due date',
    icon: Search,
    color: 'text-warning',
  },
  {
    title: 'Cross-Browser Testing',
    dueDate: 'Dec 4, 2024',
    icon: Code2,
    color: 'text-primary',
  },
];

export function ProjectTasks() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Project</CardTitle>
        <Button variant="outline" size="sm" className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          New
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
            <div className={`p-2 rounded-lg bg-muted ${task.color}`}>
              <task.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.dueDate}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}