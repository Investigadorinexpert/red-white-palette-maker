import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const pocs = [
  { title: 'Desarrollar endpoints de API', date: '25 Nov 2024', status: 'En curso' },
  { title: 'Flujo de Onboarding', date: '28 Nov 2024', status: 'Planificado' },
  { title: 'Construir Tablero', date: '30 Nov 2024', status: 'Completado' },
  { title: 'Optimizar carga de página', date: 'Fecha límite', status: 'En curso' },
  { title: 'Pruebas Cross‑Browser', date: '4 Dic 2024', status: 'Planificado' },
];

const statusTone: Record<string, string> = {
  'Completado': 'bg-success text-success-foreground',
  'En curso': 'bg-warning text-warning-foreground',
  'Planificado': 'bg-muted text-foreground',
};

export function ProjectTasks() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">POCs</CardTitle>
        <Button variant="outline" size="sm" className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Nueva POC
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {pocs.map((item, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
            <div className="p-2 rounded-lg bg-muted"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.date}</p>
            </div>
            <Badge className={statusTone[item.status] || 'bg-muted'}>{item.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
