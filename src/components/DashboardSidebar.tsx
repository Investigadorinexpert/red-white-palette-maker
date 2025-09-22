import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Home, 
  Settings, 
  Users, 
  HelpCircle,
  LogOut,
  Bell,
  Files
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function useAppName() {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem('profile');
      if (!raw) return '—';
      const p = JSON.parse(raw);
      return p?.user?.name || p?.name || '—';
    } catch {
      return '—';
    }
  }, []);
}

const menuItems = [
  { icon: Home, label: 'Inicio', active: true },
  { icon: BarChart3, label: 'Analíticas' },
  { icon: CheckSquare, label: 'Proyectos' },
  { icon: Users, label: 'Equipo' },
  { icon: Calendar, label: 'Calendario' },
  { icon: Files, label: 'Documentos' },
  { icon: Bell, label: 'Notificaciones', badge: '3' },
  { icon: Settings, label: 'Configuración' },
];

export function DashboardSidebar() {
  const appName = useAppName();

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Marca dinámica + quick actions */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <span className="font-semibold text-xl">{appName}</span>
          </div>
          <div className="text-xs text-muted-foreground space-x-2">
            <button className="hover:underline">Ayuda</button>
            <span>|</span>
            <button className="hover:underline" onClick={() => { try { localStorage.removeItem('profile'); } catch {}; window.location.replace('/'); }}>Cerrar sesión</button>
          </div>
        </div>
      </div>

      {/* Menú principal en español */}
      <div className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? 'default' : 'ghost'}
              className={`w-full justify-start h-11 px-3 ${item.active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Promo inferior (se mantiene) */}
      <div className="p-4">
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
            <span className="text-primary-foreground text-xs">📱</span>
          </div>
          <h4 className="font-medium text-sm mb-1">Descarga nuestra App</h4>
          <p className="text-xs text-muted-foreground mb-3">Productividad en la palma.</p>
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
            Descargar
          </Button>
        </div>
      </div>
    </div>
  );
}
