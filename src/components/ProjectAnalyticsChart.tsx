import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Maximize2, X } from 'lucide-react';

export type POCFilter = 'totales' | 'finalizadas' | 'en_curso' | 'pendientes';

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

const teamBreakdown = (label: string) => ([
  { k: 'Innovación', v: Math.floor(Math.random()*7)+1 },
  { k: 'Gen AI', v: Math.floor(Math.random()*5)+1 },
  { k: 'Estrategia', v: Math.floor(Math.random()*4)+1 },
]);

export function ProjectAnalyticsChart({ filter }: { filter: POCFilter }) {
  const [range, setRange] = useState<'semana' | 'mes'>('semana');
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState<{i:number;x:number;y:number}|null>(null);

  const data = useMemo(() => {
    if (range === 'semana') {
      return baseWeek.map((v) => Math.round(scaleFor(filter, v)));
    }
    const arr = Array.from({ length: 12 }, (_, i) => baseWeek[i % 7]);
    return arr.map((v) => Math.round(scaleFor(filter, v)));
  }, [filter, range]);

  const maxValue = Math.max(...data, 1);
  const labels = range === 'semana' ? ['L','M','X','J','V','S','D'] : Array.from({length: data.length}, (_,i)=>`S${i+1}`);

  const ChartBody = ({compact=false}:{compact?:boolean}) => (
    <div className="relative">
      {/* Indicadores laterales mínimos */}
      <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-muted-foreground">
        <span>{maxValue}</span>
        <span>0</span>
      </div>
      <div className={`overflow-x-auto ${compact ? '' : 'pr-2'}`}>
        <div className="flex items-end gap-2 h-36 ml-8 min-w-full transition-all duration-200">
          {data.map((val, index) => (
            <div key={index} className="flex flex-col items-center relative" style={{ minWidth: data.length > 12 ? 28 : 'calc(100%/7 - 6px)' }}>
              <div
                className="bg-primary rounded-t-md transition-all duration-500 ease-out will-change-transform cursor-pointer"
                style={{ height: `${(val / maxValue) * 120}px`, width: data.length > 12 ? 18 : '70%' }}
                onMouseEnter={(e) => {
                  const r = (e.target as HTMLElement).getBoundingClientRect();
                  setHover({ i:index, x: r.left + r.width/2, y: r.top - 8 });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => setExpanded(true)}
              />
              <span className="text-[10px] leading-4 text-muted-foreground font-medium">{labels[index]}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Tooltip ligero con blur (no bloqueante) */}
      {hover && (
        <div className="pointer-events-none fixed z-50 translate-x-[-50%]" style={{ left: hover.x, top: hover.y }}>
          <div className="bg-white/90 backdrop-blur-md border shadow-sm rounded-md px-2 py-1">
            <p className="text-xs font-medium mb-1">Detalles {labels[hover.i]}</p>
            {teamBreakdown(labels[hover.i]).map((t) => (
              <div key={t.k} className="text-[10px] text-muted-foreground">{t.k}: <span className="font-medium">{t.v}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Actividad de POCs</CardTitle>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-border p-0.5 bg-card">
                <button className={`px-2 py-0.5 text-[11px] rounded ${range==='semana' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => setRange('semana')}>Semana</button>
                <button className={`px-2 py-0.5 text-[11px] rounded ${range==='mes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => setRange('mes')}>Mes</button>
              </div>
              <button className="p-1 rounded hover:bg-muted" aria-label="Expandir" onClick={() => setExpanded(true)}><Maximize2 className="w-4 h-4" /></button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ChartBody compact />
        </CardContent>
      </Card>

      {/* Modal centrado (mediano) con blur y botón X */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setExpanded(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
          <div className="relative w-[min(92vw,900px)] h-[min(70vh,520px)] bg-card border shadow-2xl rounded-xl p-6" onClick={(e)=>e.stopPropagation()}>
            <button aria-label="Cerrar" className="absolute top-3 right-3 p-1 rounded hover:bg-muted" onClick={() => setExpanded(false)}><X className="w-4 h-4" /></button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Actividad de POCs</h3>
              <div className="inline-flex rounded-md border border-border p-0.5 bg-card">
                <button className={`px-3 py-1 text-sm rounded ${range==='semana' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => setRange('semana')}>Semana</button>
                <button className={`px-3 py-1 text-sm rounded ${range==='mes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} onClick={() => setRange('mes')}>Mes</button>
              </div>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <ChartBody />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
