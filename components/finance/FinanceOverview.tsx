'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  account: string;
  tags?: string[];
}

interface Budget {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    category: 'Food & Dining',
    description: 'Lunch at restaurant',
    amount: 25.50,
    date: '2024-01-14',
    account: 'Credit Card',
    tags: ['restaurant', 'lunch']
  },
  {
    id: '2',
    type: 'income',
    category: 'Salary',
    description: 'Monthly salary',
    amount: 5000.00,
    date: '2024-01-01',
    account: 'Checking Account'
  },
  {
    id: '3',
    type: 'expense',
    category: 'Transportation',
    description: 'Gas station',
    amount: 45.00,
    date: '2024-01-13',
    account: 'Debit Card',
    tags: ['gas', 'car']
  },
  {
    id: '4',
    type: 'expense',
    category: 'Shopping',
    description: 'Grocery shopping',
    amount: 120.75,
    date: '2024-01-12',
    account: 'Credit Card',
    tags: ['groceries', 'food']
  },
  {
    id: '5',
    type: 'expense',
    category: 'Bills & Utilities',
    description: 'Electricity bill',
    amount: 85.30,
    date: '2024-01-10',
    account: 'Checking Account',
    tags: ['utilities', 'electricity']
  },
  {
    id: '6',
    type: 'income',
    category: 'Freelance',
    description: 'Web development project',
    amount: 800.00,
    date: '2024-01-08',
    account: 'Checking Account',
    tags: ['freelance', 'web-dev']
  }
];

const mockBudgets: Budget[] = [
  { category: 'Food & Dining', budgeted: 400, spent: 285.50, remaining: 114.50 },
  { category: 'Transportation', budgeted: 200, spent: 145.00, remaining: 55.00 },
  { category: 'Shopping', budgeted: 300, spent: 220.75, remaining: 79.25 },
  { category: 'Bills & Utilities', budgeted: 500, spent: 385.30, remaining: 114.70 },
  { category: 'Entertainment', budgeted: 150, spent: 75.00, remaining: 75.00 },
  { category: 'Healthcare', budgeted: 200, spent: 50.00, remaining: 150.00 }
];

function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Food & Dining': '🍽️',
      'Transportation': '🚗',
      'Shopping': '🛒',
      'Bills & Utilities': '💡',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Salary': '💼',
      'Freelance': '💻'
    };
    return icons[category] || '💰';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getCategoryIcon(transaction.category)}</span>
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.category} • {formatDate(transaction.date)}
                  </div>
                  {transaction.tags && (
                    <div className="flex gap-1 mt-1">
                      {transaction.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
                <div className="text-sm text-muted-foreground">{transaction.account}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetOverview({ budgets }: { budgets: Budget[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.budgeted) * 100;
            const isOverBudget = percentage > 100;
            
            return (
              <div key={budget.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{budget.category}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(percentage)}% used</span>
                  <span className={isOverBudget ? 'text-red-600' : 'text-green-600'}>
                    {isOverBudget ? 'Over by ' : 'Remaining: '}
                    {formatCurrency(Math.abs(budget.remaining))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAddTransaction({ onAdd }: { onAdd: (transaction: Omit<Transaction, 'id'>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    account: 'Checking Account'
  });

  const categories = {
    expense: ['Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Healthcare'],
    income: ['Salary', 'Freelance', 'Investment', 'Other Income']
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.category) return;

    onAdd({
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: new Date().toISOString().split('T')[0],
      account: formData.account
    });

    setFormData({
      type: 'expense',
      category: '',
      description: '',
      amount: '',
      account: 'Checking Account'
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <span className="mr-2">➕</span>
        Add Transaction
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Add Transaction
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={formData.type === 'expense' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
              className="flex-1"
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={formData.type === 'income' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
              className="flex-1"
            >
              Income
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            >
              <option value="">Select category</option>
              {categories[formData.type].map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account</label>
            <select
              value={formData.account}
              onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="Checking Account">Checking Account</option>
              <option value="Savings Account">Savings Account</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Transaction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function FinanceOverview() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [budgets] = useState<Budget[]>(mockBudgets);

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTransaction,
      id: Date.now().toString()
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  // Calculate summary stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = monthlyIncome - monthlyExpenses;

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</p>
              </div>
              <span className="text-2xl">💸</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
              <span className="text-2xl">{netIncome >= 0 ? '📈' : '📉'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Used</p>
                <p className="text-2xl font-bold">
                  {Math.round((totalSpent / totalBudgeted) * 100)}%
                </p>
              </div>
              <span className="text-2xl">🎯</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions */}
        <div className="lg:col-span-2">
          <TransactionsList transactions={transactions} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickAddTransaction onAdd={handleAddTransaction} />
          <BudgetOverview budgets={budgets} />
        </div>
      </div>
    </div>
  );
}
