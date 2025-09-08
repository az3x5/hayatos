'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: '🏠',
    description: 'Overview and summary'
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: '✅',
    description: 'Task management'
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: '📁',
    description: 'Project organization'
  },
  {
    name: 'Notes',
    href: '/notes',
    icon: '📝',
    description: 'Knowledge management'
  },
  {
    name: 'Habits',
    href: '/habits',
    icon: '🔄',
    description: 'Habit tracking'
  },
  {
    name: 'Finance',
    href: '/finance',
    icon: '💰',
    description: 'Financial management'
  },
  {
    name: 'Faith',
    href: '/faith',
    icon: '🕌',
    description: 'Islamic practices'
  },
  {
    name: 'Health',
    href: '/health',
    icon: '🏥',
    description: 'Health & wellness'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: '⚙️',
    description: 'App preferences'
  }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">H</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">HayatOS</h1>
            <p className="text-xs text-muted-foreground">Life Management</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden"
        >
          ✕
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs opacity-75 truncate">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">User Name</div>
            <div className="text-xs text-muted-foreground truncate">
              user@example.com
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <span className="text-sm">⚙️</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
