'use client';

import React, { useState, useEffect } from 'react';

interface Account {
  id: string;
  name: string;
  type: string;
  current_balance: number;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  transaction_date: string;
  account_id: string;
  category_id?: string;
  transfer_account_id?: string;
  notes?: string;
  tags: string[];
  is_pending: boolean;
}

interface TransactionManagerProps {
  onTransactionAdded?: (transaction: Transaction) => void;
}

export default function TransactionManager({ onTransactionAdded }: TransactionManagerProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    account_id: '',
    category_id: '',
    transfer_account_id: '',
    notes: '',
    tags: [] as string[],
    is_pending: false,
  });

  // Mock data
  const mockAccounts: Account[] = [
    { id: '1', name: 'Main Checking', type: 'checking', current_balance: 5420.50 },
    { id: '2', name: 'Savings Account', type: 'savings', current_balance: 15750.00 },
    { id: '3', name: 'Credit Card', type: 'credit', current_balance: -1250.75 },
  ];

  const mockCategories: Category[] = [
    { id: '1', name: 'Salary', type: 'income', color: '#10B981', icon: '💰' },
    { id: '2', name: 'Freelance', type: 'income', color: '#3B82F6', icon: '💼' },
    { id: '3', name: 'Groceries', type: 'expense', color: '#EF4444', icon: '🛒' },
    { id: '4', name: 'Transportation', type: 'expense', color: '#F59E0B', icon: '🚗' },
    { id: '5', name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: '🎬' },
    { id: '6', name: 'Utilities', type: 'expense', color: '#06B6D4', icon: '⚡' },
    { id: '7', name: 'Housing', type: 'expense', color: '#DC2626', icon: '🏠' },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'expense',
      amount: 85.50,
      description: 'Weekly grocery shopping',
      transaction_date: '2024-01-15',
      account_id: '1',
      category_id: '3',
      notes: 'Bought organic vegetables',
      tags: ['groceries', 'organic'],
      is_pending: false,
    },
    {
      id: '2',
      type: 'income',
      amount: 3500.00,
      description: 'Monthly salary',
      transaction_date: '2024-01-15',
      account_id: '1',
      category_id: '1',
      notes: '',
      tags: ['salary'],
      is_pending: false,
    },
    {
      id: '3',
      type: 'transfer',
      amount: 1000.00,
      description: 'Transfer to savings',
      transaction_date: '2024-01-14',
      account_id: '1',
      transfer_account_id: '2',
      notes: 'Monthly savings goal',
      tags: ['savings'],
      is_pending: false,
    },
  ];

  useEffect(() => {
    setAccounts(mockAccounts);
    setCategories(mockCategories);
    setTransactions(mockTransactions);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.amount || !formData.description || !formData.account_id) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.type === 'transfer' && !formData.transfer_account_id) {
        throw new Error('Please select a transfer destination account');
      }

      if (formData.type !== 'transfer' && !formData.category_id) {
        throw new Error('Please select a category');
      }

      // Create transaction object
      const newTransaction: Transaction = {
        id: editingTransaction?.id || Date.now().toString(),
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.transaction_date,
        account_id: formData.account_id,
        category_id: formData.category_id || undefined,
        transfer_account_id: formData.transfer_account_id || undefined,
        notes: formData.notes,
        tags: formData.tags,
        is_pending: formData.is_pending,
      };

      if (editingTransaction) {
        // Update existing transaction
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? newTransaction : t));
      } else {
        // Add new transaction
        setTransactions(prev => [newTransaction, ...prev]);
      }

      // Call callback if provided
      if (onTransactionAdded) {
        onTransactionAdded(newTransaction);
      }

      // Reset form
      resetForm();
      setShowForm(false);

    } catch (error) {
      console.error('Error saving transaction:', error);
      alert(error instanceof Error ? error.message : 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      account_id: '',
      category_id: '',
      transfer_account_id: '',
      notes: '',
      tags: [],
      is_pending: false,
    });
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      account_id: transaction.account_id,
      category_id: transaction.category_id || '',
      transfer_account_id: transaction.transfer_account_id || '',
      notes: transaction.notes || '',
      tags: transaction.tags,
      is_pending: transaction.is_pending,
    });
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Unknown Account';
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Transaction Manager</h2>
          <p className="text-gray-600">Add, edit, and manage your financial transactions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {/* Transaction Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'income' | 'expense' | 'transfer',
                    category_id: '', // Reset category when type changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transaction description"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account *
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category or Transfer Account */}
              {formData.type === 'transfer' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer To *
                  </label>
                  <select
                    value={formData.transfer_account_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, transfer_account_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select destination account</option>
                    {accounts.filter(a => a.id !== formData.account_id).map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
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
                    {filteredCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Optional notes"
              />
            </div>

            {/* Pending checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_pending"
                checked={formData.is_pending}
                onChange={(e) => setFormData(prev => ({ ...prev, is_pending: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_pending" className="ml-2 block text-sm text-gray-700">
                Mark as pending
              </label>
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
                {loading ? 'Saving...' : editingTransaction ? 'Update' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💳</div>
            <p>No transactions yet. Add your first transaction above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const category = getCategoryInfo(transaction.category_id || '');
              const transferAccount = transaction.transfer_account_id 
                ? getAccountName(transaction.transfer_account_id)
                : null;

              return (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {transaction.type === 'transfer' ? '🔄' : category?.icon || '💰'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {transaction.description}
                        {transaction.is_pending && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getAccountName(transaction.account_id)}
                        {transferAccount && ` → ${transferAccount}`}
                        {category && ` • ${category.name}`}
                        {' • '}
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 
                        transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit transaction"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete transaction"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
