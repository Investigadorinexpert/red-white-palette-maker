import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProjectProgress() {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Progreso de POCs</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-8 border-muted"></div>
            <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent rotate-45"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl font-bold">41%</div>
            </div>
          </div>
          <div className="text-sm leading-5">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Completadas</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning inline-block"></span> En progreso</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-muted inline-block"></span> Pendientes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
