'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuickAddType = 'task' | 'note' | 'habit' | 'expense' | 'prayer';

const quickAddTypes = [
  { type: 'task' as QuickAddType, label: 'Task', icon: '✅', color: 'bg-blue-500' },
  { type: 'note' as QuickAddType, label: 'Note', icon: '📝', color: 'bg-green-500' },
  { type: 'habit' as QuickAddType, label: 'Habit', icon: '🔄', color: 'bg-purple-500' },
  { type: 'expense' as QuickAddType, label: 'Expense', icon: '💰', color: 'bg-red-500' },
  { type: 'prayer' as QuickAddType, label: 'Prayer Log', icon: '🕌', color: 'bg-emerald-500' },
];

export default function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const [selectedType, setSelectedType] = useState<QuickAddType>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle different types of quick adds
    const data = {
      type: selectedType,
      title,
      description,
      amount: selectedType === 'expense' ? parseFloat(amount) : undefined,
      priority: selectedType === 'task' ? priority : undefined,
    };

    console.log('Quick add data:', data);
    
    // Reset form
    setTitle('');
    setDescription('');
    setAmount('');
    setPriority('medium');
    onClose();
  };

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case 'task':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className="capitalize"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'expense':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
            />
          </div>
        );
      
      case 'habit':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Frequency</label>
            <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Add</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {quickAddTypes.map((type) => (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setSelectedType(type.type)}
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-lg border transition-colors",
                      selectedType === type.type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", type.color)}>
                      <span className="text-sm">{type.icon}</span>
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {selectedType === 'expense' ? 'Description' : 'Title'}
              </label>
              <Input
                type="text"
                placeholder={`Enter ${selectedType} ${selectedType === 'expense' ? 'description' : 'title'}...`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                required
              />
            </div>

            {/* Type-specific fields */}
            {renderTypeSpecificFields()}

            {/* Description/Notes */}
            {selectedType !== 'expense' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedType === 'note' ? 'Content' : 'Notes (optional)'}
                </label>
                <textarea
                  placeholder={`Enter ${selectedType === 'note' ? 'content' : 'additional notes'}...`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add {quickAddTypes.find(t => t.type === selectedType)?.label}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
