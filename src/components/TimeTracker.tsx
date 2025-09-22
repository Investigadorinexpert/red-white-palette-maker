import React from 'react';
import { Pause, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TimeTracker() {
  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Cronómetro</h3>
          <div className="text-4xl font-mono font-bold">01:24:08</div>
          <div className="flex justify-center space-x-2">
            <Button variant="secondary" size="sm" className="rounded-full w-10 h-10 p-0">
              <Pause className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm" className="rounded-full w-10 h-10 p-0">
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
