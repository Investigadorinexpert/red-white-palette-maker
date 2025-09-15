import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: {
    type: 'increase' | 'decrease';
    value: string;
  };
  variant?: 'default' | 'primary';
  className?: string;
}

export function StatsCard({ title, value, change, variant = 'default', className }: StatsCardProps) {
  return (
    <Card className={`${className} ${variant === 'primary' ? 'bg-primary text-primary-foreground' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={`text-sm ${variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {title}
            </p>
            <p className="text-3xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center space-x-1 text-sm">
                {change.type === 'increase' ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`${variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {change.value}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${variant === 'primary' ? 'bg-primary-foreground/10' : 'bg-muted'}`}>
            <div className="w-6 h-6 flex items-center justify-center">
              <span className="text-lg">↗</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}