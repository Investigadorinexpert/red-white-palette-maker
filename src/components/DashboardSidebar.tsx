import React from 'react';
import { 
  Home,
  BarChart3,
  Folder,
  Users,
  Calendar,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function getProfile() {
  try {
    const raw = localStorage.getItem('profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const buildMenu = () => ([
  { icon: Home, label: 'Inicio', active: true },
  { icon: BarChart3, label: 'Analíticas' },
  { icon: Folder, label: 'Proyectos' },
  { icon: Users, label: 'Equipo' },
  { icon: Calendar, label: 'Calendario' },
  { icon: FileText, label: 'Documentos' },
  { icon: Bell, label: 'Notificaciones', badge: '3' },
  { icon: Settings, label: 'Configuración' },
]);

export function DashboardSidebar() {
  const profile = getProfile();
  const productName: string = (profile?.user?.name || profile?.name || 'Producto');

  const menuItems = buildMenu();

  const onHelp = () => window.open('https://github.com/Investigadorinexpert/totok-mejorado', '_blank');
  const onLogout = async () => {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'include', headers: { 'x-csrf-token': '1' } }); } catch {}
    try { localStorage.removeItem('profile'); } catch {}
    window.location.replace('/');
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Branding */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <span className="font-semibold text-xl truncate">{productName}</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <button onClick={onHelp} className="underline mr-2">ayuda</button>|
          <button onClick={onLogout} className="underline ml-2">cerrar sesión</button>
        </div>
      </div>

      {/* Menú */}
      <div className="flex-1 px-4 py-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">MENÚ</p>
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? 'default' : 'ghost'}
              className={`w-full justify-start h-11 px-3 ${
                item.active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
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

        <div className="space-y-1 mt-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">GENERAL</p>
          {[{icon: Settings, label: 'Configuración'}, {icon: HelpCircle, label: 'Ayuda'}].map((item) => (
            <Button key={item.label} variant="ghost" className="w-full justify-start h-11 px-3 text-muted-foreground hover:text-foreground hover:bg-muted">
              <item.icon className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          ))}
          <Button variant="ghost" className="w-full justify-start h-11 px-3 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-3" />
            <span className="flex-1 text-left">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
