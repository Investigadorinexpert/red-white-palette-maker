import React, { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { POCFilter } from './ProjectAnalyticsChart';

const allPocs = [
  { title: 'Desarrollar endpoints de API', date: '25 Nov 2024', status: 'En curso' },
  { title: 'Flujo de Onboarding', date: '28 Nov 2024', status: 'Planificado' },
  { title: 'Construir Tablero', date: '30 Nov 2024', status: 'Completado' },
  { title: 'Optimizar carga de página', date: 'Fecha límite', status: 'En curso' },
  { title: 'Pruebas Cross‑Browser', date: '4 Dic 2024', status: 'Planificado' },
  { title: 'POC de Performance', date: '10 Dic 2024', status: 'Planificado' },
  { title: 'POC Data Ingestion', date: '15 Dic 2024', status: 'En curso' },
];

const statusTone: Record<string, string> = {
  'Completado': 'bg-success text-success-foreground',
  'En curso': 'bg-warning text-warning-foreground',
  'Planificado': 'bg-muted text-foreground',
};

const PAGE = 5;
function pickByFilter(filter: POCFilter) {
  switch (filter) {
    case 'finalizadas': return allPocs.filter(p => p.status === 'Completado');
    case 'en_curso': return allPocs.filter(p => p.status === 'En curso');
    case 'pendientes': return allPocs.filter(p => p.status === 'Planificado');
    default: return allPocs;
  }
}

export function ProjectTasks({ filter }: { filter: POCFilter }) {
  const list = useMemo(() => pickByFilter(filter), [filter]);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const start = page * PAGE;
  const slice = list.slice(start, start + PAGE);
  const placeholders = Array.from({ length: Math.max(0, PAGE - slice.length) });

  // reset page si cambia el filtro
  React.useEffect(() => setPage(0), [filter]);

  const title = useMemo(() => ({
    totales: 'POCs',
    finalizadas: 'POCs finalizadas',
    en_curso: 'POCs en curso',
    pendientes: 'POCs pendientes',
  }[filter]), [filter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(pages-1, p+1))} disabled={page>=pages-1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Plus className="w-3 h-3 mr-1" />
            Nueva POC
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Render fijo de 5 slots */}
        {[...slice, ...placeholders].map((item, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 rounded-lg transition-colors bg-transparent hover:bg-muted/50 min-h-[52px]">
            <div className="p-2 rounded-lg bg-muted"></div>
            <div className="flex-1 min-w-0">
              {item ? (
                <>
                  <p className="text-sm font-medium truncate">{(item as any).title}</p>
                  <p className="text-xs text-muted-foreground">{(item as any).date}</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">Registra más POCs…</p>
              )}
            </div>
            {item ? (
              <Badge className={statusTone[(item as any).status] || 'bg-muted'}>{(item as any).status}</Badge>
            ) : (
              <span className="text-xs text-muted-foreground"> </span>
            )}
          </div>
        ))}
        {/* Indicador de página para feedback visual */}
        <div className="text-[11px] text-muted-foreground text-right">{page+1} / {pages}</div>
      </CardContent>
    </Card>
  );
}
