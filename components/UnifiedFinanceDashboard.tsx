'use client';

import React, { useState, useEffect } from 'react';
import FinanceDashboard from './FinanceDashboard';
import TransactionManager from './TransactionManager';
import BudgetTracker from './BudgetTracker';

interface BankingIntegration {
  id: string;
  provider: string;
  institution_name: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string;
}

export default function UnifiedFinanceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'budgets' | 'banking'>('overview');
  const [bankingIntegrations, setBankingIntegrations] = useState<BankingIntegration[]>([]);
  const [showBankingSetup, setShowBankingSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock banking integrations
  const mockIntegrations: BankingIntegration[] = [
    {
      id: '1',
      provider: 'plaid',
      institution_name: 'Chase Bank',
      is_active: true,
      last_sync_at: new Date().toISOString(),
      sync_status: 'active',
    },
    {
      id: '2',
      provider: 'plaid',
      institution_name: 'Bank of America',
      is_active: false,
      last_sync_at: null,
      sync_status: 'disconnected',
    },
  ];

  useEffect(() => {
    setBankingIntegrations(mockIntegrations);
  }, []);

  const handleBankConnection = async (institutionId: string, publicToken: string) => {
    setLoading(true);
    try {
      // In a real app, this would call the banking API
      console.log('Connecting bank:', { institutionId, publicToken });
      
      // Mock successful connection
      const newIntegration: BankingIntegration = {
        id: Date.now().toString(),
        provider: 'plaid',
        institution_name: 'New Bank',
        is_active: true,
        last_sync_at: new Date().toISOString(),
        sync_status: 'active',
      };

      setBankingIntegrations(prev => [newIntegration, ...prev]);
      setShowBankingSetup(false);
      
    } catch (error) {
      console.error('Error connecting bank:', error);
      alert('Failed to connect bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async (integrationId: string) => {
    setLoading(true);
    try {
      // In a real app, this would call the sync API
      console.log('Syncing transactions for:', integrationId);
      
      // Update last sync time
      setBankingIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, last_sync_at: new Date().toISOString() }
          : integration
      ));
      
    } catch (error) {
      console.error('Error syncing transactions:', error);
      alert('Failed to sync transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectBank = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this bank account?')) {
      return;
    }

    try {
      // In a real app, this would call the disconnect API
      setBankingIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, is_active: false, sync_status: 'disconnected' }
          : integration
      ));
      
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      alert('Failed to disconnect bank account');
    }
  };

  const renderBankingTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Banking Integrations</h2>
          <p className="text-gray-600">Connect your bank accounts for automatic transaction import</p>
        </div>
        <button
          onClick={() => setShowBankingSetup(!showBankingSetup)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showBankingSetup ? 'Cancel' : 'Connect Bank'}
        </button>
      </div>

      {/* Banking Setup */}
      {showBankingSetup && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Your Bank Account</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">🔒</span>
              <div>
                <h4 className="font-medium text-blue-900">Secure Connection</h4>
                <p className="text-sm text-blue-800">
                  We use bank-level security to protect your data. We never store your banking credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Mock bank selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'chase', name: 'Chase Bank', logo: '🏦' },
              { id: 'boa', name: 'Bank of America', logo: '🏛️' },
              { id: 'wells', name: 'Wells Fargo', logo: '🏪' },
              { id: 'citi', name: 'Citibank', logo: '🏢' },
              { id: 'capital', name: 'Capital One', logo: '💳' },
              { id: 'other', name: 'Other Banks', logo: '🏦' },
            ].map((bank) => (
              <button
                key={bank.id}
                onClick={() => handleBankConnection(bank.id, `public_token_${bank.id}`)}
                disabled={loading}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-center"
              >
                <div className="text-3xl mb-2">{bank.logo}</div>
                <div className="font-medium text-gray-900">{bank.name}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Demo Mode:</strong> This is a demonstration. In production, this would use Plaid Link or similar service for secure bank connections.</p>
          </div>
        </div>
      )}

      {/* Connected Banks */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h3>
        
        {bankingIntegrations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏦</div>
            <p>No bank accounts connected yet.</p>
            <p className="text-sm">Connect your first bank account to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bankingIntegrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">🏦</div>
                  <div>
                    <div className="font-medium text-gray-900">{integration.institution_name}</div>
                    <div className="text-sm text-gray-600">
                      {integration.is_active ? (
                        <>
                          Last synced: {integration.last_sync_at 
                            ? new Date(integration.last_sync_at).toLocaleDateString()
                            : 'Never'
                          }
                        </>
                      ) : (
                        'Disconnected'
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    integration.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {integration.sync_status}
                  </span>
                  
                  {integration.is_active && (
                    <button
                      onClick={() => handleSyncTransactions(integration.id)}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Sync Now
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDisconnectBank(integration.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    {integration.is_active ? 'Disconnect' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banking Features */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔄 Automatic Sync</h4>
            <p className="text-sm text-gray-600">
              Transactions are automatically imported from your connected bank accounts daily.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🏷️ Smart Categorization</h4>
            <p className="text-sm text-gray-600">
              Transactions are automatically categorized using machine learning for better insights.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔒 Bank-Level Security</h4>
            <p className="text-sm text-gray-600">
              Your data is protected with 256-bit encryption and we never store your banking credentials.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📊 Real-Time Balances</h4>
            <p className="text-sm text-gray-600">
              Account balances are updated in real-time to give you accurate financial insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
          <p className="text-gray-600">Complete financial tracking with accounts, transactions, and budgets</p>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800">Demo Mode</h4>
            <p className="text-sm text-yellow-700">
              This is a demonstration with mock financial data. In production, you can connect real bank accounts via Plaid.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'transactions', label: 'Transactions', icon: '💳' },
            { id: 'budgets', label: 'Budgets', icon: '🎯' },
            { id: 'banking', label: 'Banking', icon: '🏦' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <FinanceDashboard />}
        {activeTab === 'transactions' && <TransactionManager />}
        {activeTab === 'budgets' && <BudgetTracker />}
        {activeTab === 'banking' && renderBankingTab()}
      </div>
    </div>
  );
}
