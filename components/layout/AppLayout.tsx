'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileBottomNav from './MobileBottomNav';
import QuickAddModal from '../modals/QuickAddModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleQuickAdd = () => {
    setQuickAddOpen(true);
  };

  const handleQuickAddClose = () => {
    setQuickAddOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - only show on desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar isOpen={true} onClose={handleSidebarClose} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={handleSidebarClose}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64">
              <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40">
          <TopBar onMenuClick={handleMenuClick} onQuickAdd={handleQuickAdd} />
        </div>

        {/* Page content */}
        <main className="px-4 py-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav onQuickAdd={handleQuickAdd} />

      {/* Quick add modal */}
      <QuickAddModal isOpen={quickAddOpen} onClose={handleQuickAddClose} />
    </div>
  );
}
