import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const chartData = [
  { day: 'S', value: 20 },
  { day: 'M', value: 80 },
  { day: 'T', value: 60 },
  { day: 'W', value: 100 },
  { day: 'T', value: 70 },
  { day: 'F', value: 30 },
  { day: 'S', value: 25 },
];

export function ProjectAnalyticsChart() {
  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Project Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-32 space-x-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full flex items-end justify-center mb-2">
                <div
                  className="bg-primary rounded-t-md transition-all duration-300"
                  style={{
                    height: `${(item.value / maxValue) * 100}px`,
                    width: '70%',
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{item.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}