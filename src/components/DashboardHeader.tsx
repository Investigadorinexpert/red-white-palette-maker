import React, { useEffect, useState } from 'react';
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

export function DashboardHeader() {
  const profile = getProfile();
  const displayName = 'X - perimenta';

  // Panel global de notificaciones (abre también desde la barra lateral via evento)
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  useEffect(() => {
    const open = () => {
      setPanelOpen(true);
      setPanelLoading(true);
      const t = setTimeout(() => setPanelLoading(false), 3000);
      return () => clearTimeout(t);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    window.addEventListener('open-notifications', open as EventListener);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('open-notifications', open as EventListener);
      window.removeEventListener('keydown', esc);
    };
  }, []);

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
              placeholder="Buscar tareas, proyectos o personas"
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              ⌘ K
            </span>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
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
    </header>
  );
}
