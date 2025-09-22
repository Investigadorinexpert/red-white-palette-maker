import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const chartData = [
  { day: 'L', value: 20 },
  { day: 'M', value: 80 },
  { day: 'X', value: 60 },
  { day: 'J', value: 100 },
  { day: 'V', value: 70 },
  { day: 'S', value: 30 },
  { day: 'D', value: 25 },
];

export function ProjectAnalyticsChart() {
  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actividad de POCs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-32 space-x-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="bg-primary rounded-t-md transition-all duration-300"
                style={{ height: `${(item.value / maxValue) * 100}px`, width: '70%' }}
              />
              <span className="text-xs text-muted-foreground font-medium">{item.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
