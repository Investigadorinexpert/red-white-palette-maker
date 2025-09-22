import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type POCFilter = 'totales' | 'finalizadas' | 'en_curso' | 'pendientes';

const base = [20, 80, 60, 100, 70, 30, 25]; // L..D

function scaleFor(filter: POCFilter, i: number): number {
  switch (filter) {
    case 'finalizadas': return base[i] * 0.6;
    case 'en_curso': return base[i] * 0.9;
    case 'pendientes': return base[i] * 0.4;
    default: return base[i];
  }
}

export function ProjectAnalyticsChart({ filter }: { filter: POCFilter }) {
  const data = useMemo(() => base.map((v, i) => Math.round(scaleFor(filter, i))), [filter]);
  const maxValue = Math.max(...data);
  const days = ['L','M','X','J','V','S','D'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actividad de POCs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-32 space-x-2">
          {data.map((val, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="bg-primary rounded-t-md transition-all duration-300"
                style={{ height: `${(val / maxValue) * 100}px`, width: '70%' }}
              />
              <span className="text-xs text-muted-foreground font-medium">{days[index]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
