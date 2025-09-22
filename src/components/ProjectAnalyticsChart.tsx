import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type POCFilter = 'totales' | 'finalizadas' | 'en_curso' | 'pendientes';
export type RangeView = 'semana' | 'mes';

// base para una semana (7 barras)
const baseWeek = [20, 80, 60, 100, 70, 30, 25]; // L..D

function scaleFor(filter: POCFilter, v: number): number {
  switch (filter) {
    case 'finalizadas': return v * 0.6;
    case 'en_curso': return v * 0.9;
    case 'pendientes': return v * 0.4;
    default: return v;
  }
}

/**
 * Gráfico responsive y animado.
 * - Semana: 7 barras (L..D).
 * - Mes: 4 semanas (S1..S4) o N barras dinámicas (count) con scroll horizontal suave.
 */
export function ProjectAnalyticsChart({ filter, range = 'semana', count }: { filter: POCFilter; range?: RangeView; count?: number }) {
  const data = useMemo(() => {
    if (range === 'semana') {
      return baseWeek.map((v) => Math.round(scaleFor(filter, v)));
    }
    // mes: generar N barras (default 4 semanas). Si count grande, crear tantas como count (cap 120 para UI demo)
    const n = Math.max(4, Math.min(count ?? 4, 120));
    const arr = Array.from({ length: n }, (_, i) => baseWeek[i % 7]);
    return arr.map((v) => Math.round(scaleFor(filter, v)));
  }, [filter, range, count]);

  const maxValue = Math.max(...data, 1);
  const labels = useMemo(() => {
    if (range === 'semana') return ['L','M','X','J','V','S','D'];
    return Array.from({ length: data.length }, (_, i) => `S${i + 1}`);
  }, [range, data.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actividad de POCs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-2 h-36 min-w-full transition-all duration-200">
            {data.map((val, index) => (
              <div key={index} className="flex flex-col items-center" style={{ minWidth: data.length > 12 ? 28 : 'calc(100%/7 - 6px)' }}>
                <div
                  className="bg-primary rounded-t-md transition-all duration-500 ease-out will-change-transform"
                  style={{ height: `${(val / maxValue) * 120}px`, width: data.length > 12 ? 18 : '70%' }}
                />
                <span className="text-[10px] leading-4 text-muted-foreground font-medium">{labels[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
