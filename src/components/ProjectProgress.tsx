import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProjectProgress() {
  const progress = 41;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Project Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              className="text-primary transition-all duration-300"
            />
          </svg>
          {/* Progress text */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold">{progress}%</span>
            <span className="text-xs text-muted-foreground">Project Ended</span>
          </div>
        </div>
        
        <div className="ml-8 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-muted"></div>
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-border"></div>
            <span className="text-sm">Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}