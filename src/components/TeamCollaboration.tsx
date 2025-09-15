import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const teamMembers = [
  {
    name: 'Alexandra Deff',
    task: 'Github Project Repository',
    avatar: 'AD',
    status: 'Working on',
  },
  {
    name: 'Edwin Adenike',
    task: 'Integrate User Authentication System',
    avatar: 'EA',
    status: 'Working on',
    progress: 'In Progress',
  },
  {
    name: 'Isaac Oluwatemilorun',
    task: 'Develop Search and Filter Functionality',
    avatar: 'IO',
    status: 'Working on',
    progress: 'Pending',
  },
  {
    name: 'David Oshodi',
    task: 'Responsive Layout for Homepage',
    avatar: 'DO',
    status: 'Working on',
    progress: 'In Progress',
  },
];

const progressColors = {
  'In Progress': 'bg-warning text-warning-foreground',
  'Pending': 'bg-destructive/10 text-destructive',
  'Completed': 'bg-success text-success-foreground',
};

export function TeamCollaboration() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Team Collaboration</CardTitle>
        <Button variant="outline" size="sm" className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.map((member, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {member.status} <span className="font-medium">{member.task}</span>
              </p>
            </div>
            {member.progress && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${progressColors[member.progress as keyof typeof progressColors] || 'bg-muted'}`}
              >
                {member.progress}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}