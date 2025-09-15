import React from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Home, 
  Settings, 
  Users, 
  HelpCircle,
  LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: Home, label: 'Dashboard', active: true },
  { icon: CheckSquare, label: 'Tasks', badge: '12' },
  { icon: Calendar, label: 'Calendar' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Users, label: 'Team' },
];

const generalItems = [
  { icon: Settings, label: 'Settings' },
  { icon: HelpCircle, label: 'Help' },
  { icon: LogOut, label: 'Logout' },
];

export function DashboardSidebar() {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <span className="font-semibold text-xl">Donezo</span>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 px-4 py-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">
            MENU
          </p>
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "default" : "ghost"}
              className={`w-full justify-start h-11 px-3 ${
                item.active 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">
            GENERAL
          </p>
          {generalItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start h-11 px-3 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile App Promotion */}
      <div className="p-4">
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
            <span className="text-primary-foreground text-xs">📱</span>
          </div>
          <h4 className="font-medium text-sm mb-1">Download our Mobile App</h4>
          <p className="text-xs text-muted-foreground mb-3">Get busy in another way</p>
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}