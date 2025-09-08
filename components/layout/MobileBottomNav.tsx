'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MobileBottomNavProps {
  onQuickAdd: () => void;
}

const bottomNavItems = [
  { name: 'Home', href: '/', icon: '🏠' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
  { name: 'Notes', href: '/notes', icon: '📝' },
  { name: 'Habits', href: '/habits', icon: '🔄' },
  { name: 'More', href: '/settings', icon: '⚙️' },
];

export default function MobileBottomNav({ onQuickAdd }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={onQuickAdd}
        size="icon"
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg lg:hidden"
      >
        <span className="text-xl">➕</span>
      </Button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border lg:hidden">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for content */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
