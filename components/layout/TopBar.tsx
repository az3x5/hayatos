'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface TopBarProps {
  onMenuClick: () => void;
  onQuickAdd: () => void;
}

export default function TopBar({ onMenuClick, onQuickAdd }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 min-h-[60px]">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <span className="text-lg">☰</span>
          </Button>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:block">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search tasks, notes, habits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 pl-10 h-9"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-muted-foreground text-sm">🔍</span>
              </div>
            </div>
          </form>
        </div>

        {/* Center section - Quick stats */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Today:</span>
            <Badge variant="secondary">5 tasks</Badge>
            <Badge variant="outline">3 habits</Badge>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Quick add button */}
          <Button
            onClick={onQuickAdd}
            size="sm"
            className="hidden sm:flex h-9"
          >
            <span className="mr-2">➕</span>
            <span className="hidden lg:inline">Quick Add</span>
            <span className="lg:hidden">Add</span>
          </Button>

          {/* Mobile quick add */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onQuickAdd}
            className="sm:hidden h-9 w-9"
          >
            <span className="text-lg">➕</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <span className="text-lg">🔔</span>
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9">
            <span className="text-lg">🌙</span>
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
              <AvatarFallback className="text-xs">U</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
              <span className="text-sm">⌄</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 border-b border-border sm:hidden">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search tasks, notes, habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <span className="text-muted-foreground text-sm">🔍</span>
            </div>
          </div>
        </form>
      </div>
    </header>
  );
}
