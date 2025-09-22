import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProjectProgress() {
  const progress = 41;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progreso de POCs</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          {/* Círculo base */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
            {/* Progreso */}
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={String(2 * Math.PI * 40)} strokeDashoffset={String(2 * Math.PI * 40 * (1 - progress / 100))} className="text-primary transition-all duration-300" />
          </svg>
          {/* Texto del progreso */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold">{progress}%</span>
            <span className="text-xs text-muted-foreground">POCs completadas</span>
          </div>
        </div>

        <div className="ml-8 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-sm">Completadas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-muted"></div>
            <span className="text-sm">En progreso</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-border"></div>
            <span className="text-sm">Pendientes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
