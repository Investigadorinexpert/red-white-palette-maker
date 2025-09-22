import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Mail, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getProfile() {
  try {
    const raw = localStorage.getItem('profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function postJson(url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', 'x-csrf-token': '1' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Dataset de ejemplo para el buscador inteligente (UI only)
const DATASET = {
  pocs: ['Onboarding Flow', 'API Endpoints', 'Tablero V2', 'Rendimiento Web', 'Data Ingestion'],
  personas: ['Alexandra Deff', 'Edwin Adenike', 'Totok Michael', 'Jean Silva'],
  docs: ['Requerimientos POC', 'Plan de Pruebas', 'Checklist Release'],
};

export function DashboardHeader() {
  const profile = getProfile();
  const displayName = 'X - perimenta';

  // Panel global de notificaciones
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  // Panel global de mensajes
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    const openNotif = () => {
      setPanelOpen(true);
      setPanelLoading(true);
      const t = setTimeout(() => setPanelLoading(false), 3000);
      return () => clearTimeout(t);
    };
    const openMsg = () => {
      setMsgOpen(true);
      setMsgLoading(true);
      const t = setTimeout(() => setMsgLoading(false), 3000);
      return () => clearTimeout(t);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPanelOpen(false); setMsgOpen(false); } };
    window.addEventListener('open-notifications', openNotif as EventListener);
    window.addEventListener('open-messages', openMsg as EventListener);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('open-notifications', openNotif as EventListener);
      window.removeEventListener('open-messages', openMsg as EventListener);
      window.removeEventListener('keydown', esc);
    };
  }, []);

  // Buscador inteligente (debounced typeahead)
  const [q, setQ] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const debounce = useRef<number | null>(null);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQ(v);
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => setShowSuggest(true), 220);
  };
  const normalized = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalized) return null;
    const f = (arr: string[]) => arr.filter(x => x.toLowerCase().includes(normalized));
    return {
      pocs: f(DATASET.pocs),
      personas: f(DATASET.personas),
      docs: f(DATASET.docs),
    };
  }, [normalized]);

  const onLogout = async () => {
    try {
      await postJson('/api/logout', { form: 222 });
    } catch (e) {} finally {
      try { localStorage.removeItem('profile'); } catch {}
      window.location.replace('/');
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Búsqueda */}
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar tareas, POCs o personas"
              className={`pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary ${showSuggest && q ? 'ring-1 ring-destructive/40' : ''}`}
              value={q}
              onChange={onChange}
              onFocus={() => q && setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              ⌘ K
            </span>

            {/* Sugerencias */}
            {showSuggest && q && results && (
              <div className="absolute z-40 mt-2 w-full bg-white/90 backdrop-blur-md border shadow-md rounded-lg overflow-hidden">
                <div className="p-3 text-xs text-muted-foreground">Resultados para "{q}"</div>
                <div className="max-h-72 overflow-auto divide-y">
                  <div className="p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">POCs</p>
                    {(results.pocs.length ? results.pocs : ['Sin resultados']).map((x, i) => (
                      <div key={i} className="text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer">{x}</div>
                    ))}
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Personas</p>
                    {(results.personas.length ? results.personas : ['Sin resultados']).map((x, i) => (
                      <div key={i} className="text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer">{x}</div>
                    ))}
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Documentos</p>
                    {(results.docs.length ? results.docs : ['Sin resultados']).map((x, i) => (
                      <div key={i} className="text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer">{x}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center space-x-2">
          {/* Mensajes tipo correo */}
          <Button variant="ghost" size="sm" className="relative rounded-xl hover:bg-primary/10 active:bg-primary/20" onClick={() => window.dispatchEvent(new CustomEvent('open-messages'))}>
            <Mail className="w-4 h-4" />
          </Button>

          {/* Campana -> abre panel global */}
          <Button variant="ghost" size="sm" className="relative" onClick={() => window.dispatchEvent(new CustomEvent('open-notifications'))}>
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
          </Button>

          {/* Perfil de usuario con menú */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{profile?.user?.email || profile?.email || 'usuario@correo.com'}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">XP</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-50 bg-white/90 backdrop-blur-md text-popover-foreground border shadow-md">
                <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>RIMAC SEGUROS</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onLogout()}>Cerrar sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Panel flotante de notificaciones */}
      {panelOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setPanelOpen(false)}>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          <div className="absolute top-16 right-6 w-80 bg-white/90 backdrop-blur-md border shadow-lg rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 font-medium border-b">Notificaciones</div>
            <div className="p-3 space-y-3">
              {panelLoading ? (
                [0,1,2].map(i => (
                  <div key={i} className="animate-pulse flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted mt-2" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-5/6" />
                      <div className="h-3 bg-muted rounded w-3/6" />
                    </div>
                  </div>
                ))
              ) : (
                [
                  { t: 'POC “Onboarding Flow” asignada', s: 'Hace 5 min' },
                  { t: 'Revisión aprobada en “API Endpoints”', s: 'Hace 1 h' },
                  { t: 'Nueva mención en Equipo', s: 'Ayer' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">{n.t}</p>
                      <p className="text-xs text-muted-foreground">{n.s}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panel flotante de mensajes */}
      {msgOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setMsgOpen(false)}>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          <div className="absolute top-16 right-28 w-[420px] bg-white/90 backdrop-blur-md border shadow-lg rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 font-medium border-b">Mensajes</div>
            <div className="p-3 space-y-3">
              {msgLoading ? (
                [0,1,2].map(i => (
                  <div key={i} className="animate-pulse flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-4/6" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </div>
                  </div>
                ))
              ) : (
                [
                  { from: 'Alexandra Deff', subject: 'Revisión de POC Onboarding', preview: 'Subí comentarios al doc…', time: 'Hace 8 min' },
                  { from: 'Edwin Adenike', subject: 'Endpoints listos', preview: 'Deploy en staging completado', time: 'Hace 1 h' },
                  { from: 'Jean Silva', subject: 'Retro sprint', preview: 'Agendemos 15 min', time: 'Ayer' },
                ].map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{m.from.split(' ').map(s=>s[0]).join('').slice(0,2)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{m.subject}</p>
                        <span className="text-[11px] text-muted-foreground">{m.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.preview}</p>
                      <p className="text-[11px] text-muted-foreground">De: {m.from}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
