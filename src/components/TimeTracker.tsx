import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Cronómetro persistente por pestaña/sitio usando localStorage.
 * - Claves: tt_startedAt (ms), tt_accumSec (segundos).
 * - Recalcula con Date.now() para evitar drift y mantener consumo mínimo (intervalo de 1s).
 */
export function TimeTracker() {
  const [tick, setTick] = useState(0); // fuerza re-render cada segundo
  const [running, setRunning] = useState(false);

  // Helpers de almacenamiento
  const getStartedAt = () => {
    const v = localStorage.getItem('tt_startedAt');
    return v ? parseInt(v, 10) : null;
  };
  const setStartedAt = (ms: number | null) => {
    if (ms == null) localStorage.removeItem('tt_startedAt');
    else localStorage.setItem('tt_startedAt', String(ms));
  };
  const getAccum = () => parseInt(localStorage.getItem('tt_accumSec') || '0', 10);
  const setAccum = (s: number) => localStorage.setItem('tt_accumSec', String(Math.max(0, Math.floor(s))));

  // Cálculo derivado del tiempo transcurrido
  const elapsedSec = useMemo(() => {
    const started = getStartedAt();
    const accum = getAccum();
    if (started) {
      const delta = Math.floor((Date.now() - started) / 1000);
      return Math.max(0, accum + delta);
    }
    return Math.max(0, accum);
  }, [tick]);

  // Efecto de latido de 1s y sync de running
  useEffect(() => {
    const started = getStartedAt();
    setRunning(!!started);
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const start = () => {
    if (!getStartedAt()) setStartedAt(Date.now());
    setRunning(true);
  };
  const pause = () => {
    setAccum(elapsedSec);
    setStartedAt(null);
    setRunning(false);
  };
  const stop = () => {
    setStartedAt(null);
    setAccum(0);
    setRunning(false);
  };

  const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Cronómetro</h3>
          <div className="text-4xl font-mono font-bold">{hh}:{mm}:{ss}</div>
          <div className="flex justify-center space-x-2">
            {running ? (
              <Button variant="secondary" size="sm" className="rounded-full w-10 h-10 p-0" onClick={pause}>
                <Pause className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="rounded-full w-10 h-10 p-0" onClick={start}>
                <Play className="w-4 h-4" />
              </Button>
            )}
            <Button variant="destructive" size="sm" className="rounded-full w-10 h-10 p-0" onClick={stop}>
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
