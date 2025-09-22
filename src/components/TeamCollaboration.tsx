import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function getProfile() {
  try {
    const raw = localStorage.getItem('profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const fallbackMembers = [
  { name: 'Alexandra Deff', task: 'Repositorio de proyecto en Github', avatar: 'AD', status: 'Trabajando en', progress: 'En progreso', notifications: 1 },
  { name: 'Edwin Adenike', task: 'Autenticación de usuarios', avatar: 'EA', status: 'Trabajando en', progress: 'En progreso', notifications: 2 },
];

const progressColors: Record<string, string> = {
  'En progreso': 'bg-warning text-warning-foreground',
  'Pendiente': 'bg-destructive/10 text-destructive',
  'Completado': 'bg-success text-success-foreground',
};

export function TeamCollaboration() {
  const profile = getProfile();
  const apiMembers = (profile?.team as any[])?.map((m) => ({
    name: m.name || m.fullName || 'Miembro',
    task: m.role || m.task || 'Colaborador',
    avatar: (m.initials || (m.name?.split(' ').map((x: string) => x[0]).join(''))) || 'TM',
    status: m.status || 'Trabajando en',
    progress: m.progress || 'En progreso',
    notifications: m.notifications ?? 0,
  })) || [];

  const teamMembers = apiMembers.length ? apiMembers : fallbackMembers;

  // Modal state
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  // usar RegExp para evitar problemas de escape en TS/JSON
  const emailValid = useMemo(() => new RegExp('^[^@\\n]+@rimac\\.com\\.pe$', 'i').test(email), [email]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return;
    setOpen(false);
    alert('Solicitud enviada al administrador');
    setEmail('');
    setReason('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Equipo</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Agregar miembro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar acceso para nuevo miembro</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo corporativo</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre.apellido@rimac.com.pe" required />
                {!emailValid && email && (<p className="text-xs text-destructive">Formato corporativo requerido</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Razón</Label>
                <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="¿Por qué necesita acceso?" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!emailValid}>Solicitar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.map((member, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{member.avatar}</AvatarFallback>
              <AvatarImage src="/placeholder.svg" />
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.status} <span className="font-medium">{member.task}</span></p>
            </div>
            <Badge variant="secondary" className="text-xs mr-2">{member.notifications ?? 0}</Badge>
            {member.progress && (
              <Badge variant="secondary" className={`text-xs ${progressColors[member.progress] || 'bg-muted'}`}>{member.progress}</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
