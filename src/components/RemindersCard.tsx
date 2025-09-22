import React from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function RemindersCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recordatorios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-base">Reunión con Arc Company</h4>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Hora: 02:00 pm - 04:00 pm</span>
          </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90">
          <div className="w-2 h-2 bg-primary-foreground rounded-full mr-2" />
          Iniciar reunión
        </Button>
      </CardContent>
    </Card>
  );
}
