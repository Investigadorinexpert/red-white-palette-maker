import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

function getProfile() {
  try {
    const raw = localStorage.getItem('profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const fallbackMembers = [
  { name: 'Alexandra Deff', task: 'Github Project Repository', avatar: 'AD', status: 'Working on' },
  { name: 'Edwin Adenike', task: 'User Authentication', avatar: 'EA', status: 'Working on', progress: 'In Progress' },
];

const progressColors: Record<string, string> = {
  'In Progress': 'bg-warning text-warning-foreground',
  'Pending': 'bg-destructive/10 text-destructive',
  'Completed': 'bg-success text-success-foreground',
};

export function TeamCollaboration() {
  const profile = getProfile();
  const apiMembers = (profile?.team as any[])?.map((m) => ({
    name: m.name || m.fullName || 'Miembro',
    task: m.role || m.task || 'Colaborador',
    avatar: (m.initials || (m.name?.split(' ').map((x: string) => x[0]).join(''))) || 'TM',
    status: m.status || 'Activo',
    progress: m.progress,
  })) || [];

  const teamMembers = apiMembers.length ? apiMembers : fallbackMembers;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Equipo</CardTitle>
        <Button variant="outline" size="sm" className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Agregar miembro
        </Button>
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
            {member.progress && (
              <Badge variant="secondary" className={(progressColors as any)[member.progress] ? 'text-xs ' + (progressColors as any)[member.progress] : 'text-xs bg-muted'}>{member.progress}</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
