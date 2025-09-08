import { useState, useEffect, useCallback } from 'react';

// Types
interface Account {
  id: string;
  name: string;
  type: 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  currency: string;
  current_balance: number;
  credit_limit?: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  account_id: string;
  category_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  transaction_date: string;
  transfer_account_id?: string;
  notes?: string;
  tags: string[];
  is_pending: boolean;
}

interface Budget {
  id: string;
  name: string;
  category_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  alert_percentage: number;
  is_active: boolean;
  progress?: {
    spent_amount: number;
    remaining_amount: number;
    percentage_used: number;
    is_over_budget: boolean;
  };
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
  alerts: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    message: string;
  }>;
}

// Accounts Hook
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async (filters?: { type?: string; include_hidden?: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/finance/accounts?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch accounts');
      }

      setAccounts(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = useCallback(async (accountData: Partial<Account>) => {
    try {
      const response = await fetch('/api/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      setAccounts(prev => [result.data, ...prev]);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      console.error('Error creating account:', err);
      return null;
    }
  }, []);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    try {
      const response = await fetch(`/api/finance/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update account');
      }

      setAccounts(prev => prev.map(account => account.id === id ? result.data : account));
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
      console.error('Error updating account:', err);
      return null;
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/finance/accounts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete account');
      }

      setAccounts(prev => prev.filter(account => account.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      console.error('Error deleting account:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}

// Transactions Hook
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
  });

  const fetchTransactions = useCallback(async (filters?: {
    account_id?: string;
    category_id?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/finance/transactions?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch transactions');
      }

      setTransactions(result.data || []);
      setPagination(result.pagination || pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  const createTransaction = useCallback(async (transactionData: Partial<Transaction>) => {
    try {
      const response = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create transaction');
      }

      setTransactions(prev => [result.data, ...prev]);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      console.error('Error creating transaction:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    pagination,
    fetchTransactions,
    createTransaction,
  };
}

// Budgets Hook
export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async (includeProgress = true) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (includeProgress) {
        params.append('include_progress', 'true');
      }

      const response = await fetch(`/api/finance/budgets?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch budgets');
      }

      setBudgets(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBudget = useCallback(async (budgetData: Partial<Budget>) => {
    try {
      const response = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create budget');
      }

      setBudgets(prev => [result.data, ...prev]);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget');
      console.error('Error creating budget:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
  };
}

// Financial Insights Hook
export function useFinancialInsights() {
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (filters?: {
    period?: string;
    months_back?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/finance/insights?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch insights');
      }

      setInsights(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    loading,
    error,
    fetchInsights,
  };
}

// Banking Integration Hook
export function useBankingIntegrations() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/finance/banking?action=integrations');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch integrations');
      }

      setIntegrations(result.integrations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLinkToken = useCallback(async () => {
    try {
      const response = await fetch('/api/finance/banking?action=create_link_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create link token');
      }

      return result.link_token;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link token');
      console.error('Error creating link token:', err);
      return null;
    }
  }, []);

  const exchangePublicToken = useCallback(async (publicToken: string, metadata: any) => {
    try {
      const response = await fetch('/api/finance/banking?action=exchange_public_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: publicToken,
          institution_id: metadata.institution.institution_id,
          institution_name: metadata.institution.name,
          accounts: metadata.accounts,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to exchange token');
      }

      // Refresh integrations
      await fetchIntegrations();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to exchange token');
      console.error('Error exchanging token:', err);
      return null;
    }
  }, [fetchIntegrations]);

  const syncTransactions = useCallback(async (integrationId: string) => {
    try {
      const response = await fetch('/api/finance/banking?action=sync_transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration_id: integrationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync transactions');
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync transactions');
      console.error('Error syncing transactions:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return {
    integrations,
    loading,
    error,
    fetchIntegrations,
    createLinkToken,
    exchangePublicToken,
    syncTransactions,
  };
}
