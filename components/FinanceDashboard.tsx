'use client';

import React, { useState, useEffect } from 'react';
import FinancePieChart from './FinancePieChart';
import FinanceLineChart from './FinanceLineChart';

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  currency: string;
  current_balance: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  transaction_date: string;
  financial_accounts: { name: string; type: string };
  financial_categories?: { name: string; color: string; icon: string };
}

interface FinancialInsights {
  account_summary: {
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    liquid_assets: number;
  };
  monthly_spending: Array<{
    category_id: string;
    category_name: string;
    category_color: string;
    total_amount: number;
    transaction_count: number;
  }>;
  cash_flow: Array<{
    month_year: string;
    month_date: string;
    total_income: number;
    total_expenses: number;
    net_cash_flow: number;
  }>;
  budget_progress: Array<{
    budget_id: string;
    budget_name: string;
    category_name: string;
    budget_amount: number;
    spent_amount: number;
    percentage_used: number;
    is_over_budget: boolean;
  }>;
  alerts: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    message: string;
  }>;
}

export default function FinanceDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demo
  const mockAccounts: Account[] = [
    {
      id: '1',
      name: 'Main Checking',
      type: 'checking',
      currency: 'USD',
      current_balance: 5420.50,
      is_active: true,
    },
    {
      id: '2',
      name: 'Savings Account',
      type: 'savings',
      currency: 'USD',
      current_balance: 15750.00,
      is_active: true,
    },
    {
      id: '3',
      name: 'Credit Card',
      type: 'credit',
      currency: 'USD',
      current_balance: -1250.75,
      is_active: true,
    },
    {
      id: '4',
      name: 'Investment Account',
      type: 'investment',
      currency: 'USD',
      current_balance: 25000.00,
      is_active: true,
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'expense',
      amount: 85.50,
      description: 'Grocery shopping',
      transaction_date: '2024-01-15',
      financial_accounts: { name: 'Main Checking', type: 'checking' },
      financial_categories: { name: 'Groceries', color: '#10B981', icon: '🛒' },
    },
    {
      id: '2',
      type: 'income',
      amount: 3500.00,
      description: 'Salary deposit',
      transaction_date: '2024-01-15',
      financial_accounts: { name: 'Main Checking', type: 'checking' },
      financial_categories: { name: 'Salary', color: '#3B82F6', icon: '💰' },
    },
    {
      id: '3',
      type: 'expense',
      amount: 45.00,
      description: 'Gas station',
      transaction_date: '2024-01-14',
      financial_accounts: { name: 'Credit Card', type: 'credit' },
      financial_categories: { name: 'Transportation', color: '#F59E0B', icon: '⛽' },
    },
    {
      id: '4',
      type: 'expense',
      amount: 1200.00,
      description: 'Monthly rent',
      transaction_date: '2024-01-01',
      financial_accounts: { name: 'Main Checking', type: 'checking' },
      financial_categories: { name: 'Housing', color: '#EF4444', icon: '🏠' },
    },
  ];

  const mockInsights: FinancialInsights = {
    account_summary: {
      total_assets: 46170.50,
      total_liabilities: 1250.75,
      net_worth: 44919.75,
      liquid_assets: 21170.50,
    },
    monthly_spending: [
      { category_id: '1', category_name: 'Housing', category_color: '#EF4444', total_amount: 1200, transaction_count: 1 },
      { category_id: '2', category_name: 'Groceries', category_color: '#10B981', total_amount: 450, transaction_count: 8 },
      { category_id: '3', category_name: 'Transportation', category_color: '#F59E0B', total_amount: 320, transaction_count: 12 },
      { category_id: '4', category_name: 'Entertainment', category_color: '#8B5CF6', total_amount: 180, transaction_count: 6 },
      { category_id: '5', category_name: 'Utilities', category_color: '#06B6D4', total_amount: 150, transaction_count: 3 },
    ],
    cash_flow: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return {
        month_year: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        month_date: date.toISOString().split('T')[0],
        total_income: 3500 + Math.random() * 500,
        total_expenses: 2200 + Math.random() * 800,
        net_cash_flow: 1300 + Math.random() * 300 - 150,
      };
    }),
    budget_progress: [
      {
        budget_id: '1',
        budget_name: 'Monthly Housing',
        category_name: 'Housing',
        budget_amount: 1200,
        spent_amount: 1200,
        percentage_used: 100,
        is_over_budget: false,
      },
      {
        budget_id: '2',
        budget_name: 'Groceries Budget',
        category_name: 'Groceries',
        budget_amount: 500,
        spent_amount: 450,
        percentage_used: 90,
        is_over_budget: false,
      },
      {
        budget_id: '3',
        budget_name: 'Entertainment',
        category_name: 'Entertainment',
        budget_amount: 200,
        spent_amount: 250,
        percentage_used: 125,
        is_over_budget: true,
      },
    ],
    alerts: [
      {
        type: 'budget_exceeded',
        severity: 'high',
        title: 'Budget Exceeded',
        message: "You've exceeded your Entertainment budget by 25%",
      },
      {
        type: 'budget_warning',
        severity: 'medium',
        title: 'Budget Warning',
        message: "You've used 90% of your Groceries budget",
      },
    ],
  };

  useEffect(() => {
    // In a real app, this would fetch from the APIs
    setAccounts(mockAccounts);
    setRecentTransactions(mockTransactions);
    setInsights(mockInsights);
    setLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeIcon = (type: string) => {
    const icons = {
      checking: '🏦',
      savings: '💰',
      credit: '💳',
      investment: '📈',
      cash: '💵',
      loan: '🏠',
    };
    return icons[type as keyof typeof icons] || '💼';
  };

  const getAlertIcon = (severity: string) => {
    const icons = {
      high: '🚨',
      medium: '⚠️',
      low: 'ℹ️',
    };
    return icons[severity as keyof typeof icons] || 'ℹ️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600">Manage your accounts, track spending, and monitor budgets</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Add Income
          </button>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Add Expense
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Transfer
          </button>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800">Demo Mode</h4>
            <p className="text-sm text-yellow-700">
              This is a demonstration with mock financial data. In full mode, you can connect real bank accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Financial Alerts */}
      {insights?.alerts && insights.alerts.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Alerts</h3>
          <div className="space-y-3">
            {insights.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-400'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">{getAlertIcon(alert.severity)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Worth</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(insights?.account_summary.net_worth || 0)}
              </p>
            </div>
            <div className="text-3xl">💎</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(insights?.account_summary.total_assets || 0)}
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Liabilities</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(insights?.account_summary.total_liabilities || 0)}
              </p>
            </div>
            <div className="text-3xl">📉</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Liquid Assets</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(insights?.account_summary.liquid_assets || 0)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancePieChart
          data={insights?.monthly_spending || []}
          title="Monthly Spending by Category"
        />
        <FinanceLineChart
          data={insights?.cash_flow || []}
          title="Cash Flow Trend"
          type="cash_flow"
        />
      </div>

      {/* Accounts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounts</h3>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getAccountTypeIcon(account.type)}</span>
                  <div>
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className="text-sm text-gray-600 capitalize">{account.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(account.current_balance)}
                  </div>
                  <div className="text-sm text-gray-600">{account.currency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {transaction.financial_categories?.icon || 
                     (transaction.type === 'income' ? '💰' : transaction.type === 'expense' ? '💸' : '🔄')}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-sm text-gray-600">
                      {transaction.financial_accounts.name} • {new Date(transaction.transaction_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {transaction.financial_categories?.name || 'Uncategorized'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
