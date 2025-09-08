'use client';

import React, { useState, useEffect } from 'react';

interface Budget {
  id: string;
  name: string;
  category_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  alert_percentage: number;
  is_active: boolean;
  financial_categories?: {
    name: string;
    color: string;
    icon: string;
  };
  progress?: {
    spent_amount: number;
    remaining_amount: number;
    percentage_used: number;
    is_over_budget: boolean;
    days_remaining: number;
  };
}

interface Category {
  id: string;
  name: string;
  type: 'expense';
  color: string;
  icon: string;
}

export default function BudgetTracker() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    alert_percentage: '80',
  });

  // Mock data
  const mockCategories: Category[] = [
    { id: '1', name: 'Groceries', type: 'expense', color: '#10B981', icon: '🛒' },
    { id: '2', name: 'Transportation', type: 'expense', color: '#F59E0B', icon: '🚗' },
    { id: '3', name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: '🎬' },
    { id: '4', name: 'Utilities', type: 'expense', color: '#06B6D4', icon: '⚡' },
    { id: '5', name: 'Housing', type: 'expense', color: '#DC2626', icon: '🏠' },
    { id: '6', name: 'Healthcare', type: 'expense', color: '#EC4899', icon: '🏥' },
    { id: '7', name: 'Shopping', type: 'expense', color: '#F97316', icon: '🛍️' },
  ];

  const mockBudgets: Budget[] = [
    {
      id: '1',
      name: 'Monthly Groceries',
      category_id: '1',
      amount: 500,
      period: 'monthly',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      alert_percentage: 80,
      is_active: true,
      financial_categories: { name: 'Groceries', color: '#10B981', icon: '🛒' },
      progress: {
        spent_amount: 450,
        remaining_amount: 50,
        percentage_used: 90,
        is_over_budget: false,
        days_remaining: 16,
      },
    },
    {
      id: '2',
      name: 'Transportation Budget',
      category_id: '2',
      amount: 300,
      period: 'monthly',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      alert_percentage: 75,
      is_active: true,
      financial_categories: { name: 'Transportation', color: '#F59E0B', icon: '🚗' },
      progress: {
        spent_amount: 180,
        remaining_amount: 120,
        percentage_used: 60,
        is_over_budget: false,
        days_remaining: 16,
      },
    },
    {
      id: '3',
      name: 'Entertainment Fund',
      category_id: '3',
      amount: 200,
      period: 'monthly',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      alert_percentage: 80,
      is_active: true,
      financial_categories: { name: 'Entertainment', color: '#8B5CF6', icon: '🎬' },
      progress: {
        spent_amount: 250,
        remaining_amount: -50,
        percentage_used: 125,
        is_over_budget: true,
        days_remaining: 16,
      },
    },
    {
      id: '4',
      name: 'Monthly Utilities',
      category_id: '4',
      amount: 150,
      period: 'monthly',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      alert_percentage: 90,
      is_active: true,
      financial_categories: { name: 'Utilities', color: '#06B6D4', icon: '⚡' },
      progress: {
        spent_amount: 145,
        remaining_amount: 5,
        percentage_used: 97,
        is_over_budget: false,
        days_remaining: 16,
      },
    },
  ];

  useEffect(() => {
    setCategories(mockCategories);
    setBudgets(mockBudgets);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.name || !formData.category_id || !formData.amount) {
        throw new Error('Please fill in all required fields');
      }

      const category = categories.find(c => c.id === formData.category_id);
      if (!category) {
        throw new Error('Invalid category selected');
      }

      // Create budget object
      const newBudget: Budget = {
        id: editingBudget?.id || Date.now().toString(),
        name: formData.name,
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        alert_percentage: parseFloat(formData.alert_percentage),
        is_active: true,
        financial_categories: {
          name: category.name,
          color: category.color,
          icon: category.icon,
        },
        progress: {
          spent_amount: 0,
          remaining_amount: parseFloat(formData.amount),
          percentage_used: 0,
          is_over_budget: false,
          days_remaining: 30,
        },
      };

      if (editingBudget) {
        // Update existing budget
        setBudgets(prev => prev.map(b => b.id === editingBudget.id ? newBudget : b));
      } else {
        // Add new budget
        setBudgets(prev => [newBudget, ...prev]);
      }

      // Reset form
      resetForm();
      setShowForm(false);

    } catch (error) {
      console.error('Error saving budget:', error);
      alert(error instanceof Error ? error.message : 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      amount: '',
      period: 'monthly',
      alert_percentage: '80',
    });
    setEditingBudget(null);
  };

  const handleEdit = (budget: Budget) => {
    setFormData({
      name: budget.name,
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      period: budget.period,
      alert_percentage: budget.alert_percentage.toString(),
    });
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (budgetId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      setBudgets(prev => prev.filter(b => b.id !== budgetId));
    }
  };

  const toggleBudgetStatus = (budgetId: string) => {
    setBudgets(prev => prev.map(b => 
      b.id === budgetId ? { ...b, is_active: !b.is_active } : b
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgressBarColor = (budget: Budget) => {
    if (!budget.progress) return '#10B981';
    
    if (budget.progress.is_over_budget) return '#EF4444';
    if (budget.progress.percentage_used >= budget.alert_percentage) return '#F59E0B';
    return '#10B981';
  };

  const getStatusBadge = (budget: Budget) => {
    if (!budget.is_active) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>;
    }
    
    if (!budget.progress) {
      return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">Active</span>;
    }

    if (budget.progress.is_over_budget) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">Over Budget</span>;
    }
    
    if (budget.progress.percentage_used >= budget.alert_percentage) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded">Warning</span>;
    }
    
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">On Track</span>;
  };

  // Calculate summary statistics
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.progress?.spent_amount || 0), 0);
  const overBudgetCount = budgets.filter(b => b.progress?.is_over_budget).length;
  const activeBudgets = budgets.filter(b => b.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Budget Tracker</h2>
          <p className="text-gray-600">Monitor your spending against budget goals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Budget'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{activeBudgets}</div>
          <div className="text-sm text-gray-600">Active Budgets</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudgeted)}</div>
          <div className="text-sm text-gray-600">Total Budgeted</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-orange-600">{overBudgetCount}</div>
          <div className="text-sm text-gray-600">Over Budget</div>
        </div>
      </div>

      {/* Budget Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Monthly Groceries"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Alert Percentage */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.alert_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, alert_percentage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="80"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Get alerted when spending reaches this percentage of the budget
                </p>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budgets List */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Budgets</h3>
        
        {budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No budgets created yet. Create your first budget above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{budget.financial_categories?.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{budget.name}</h4>
                      <p className="text-sm text-gray-600">
                        {budget.financial_categories?.name} • {budget.period}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(budget)}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit budget"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => toggleBudgetStatus(budget.id)}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title={budget.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {budget.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete budget"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {budget.progress && (
                  <div className="space-y-2">
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(budget.progress.percentage_used, 100)}%`,
                          backgroundColor: getProgressBarColor(budget),
                        }}
                      />
                    </div>

                    {/* Progress details */}
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">
                          {formatCurrency(budget.progress.spent_amount)}
                        </span>
                        <span className="text-gray-600"> of {formatCurrency(budget.amount)}</span>
                      </div>
                      <div className="text-gray-600">
                        {budget.progress.percentage_used.toFixed(1)}% used
                      </div>
                    </div>

                    <div className="flex justify-between text-sm text-gray-600">
                      <div>
                        Remaining: <span className={budget.progress.remaining_amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(budget.progress.remaining_amount)}
                        </span>
                      </div>
                      <div>
                        {budget.progress.days_remaining} days left
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
