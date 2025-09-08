'use client';

import React, { useState, useEffect } from 'react';

interface Integration {
  id: string;
  integration_type: string;
  integration_name: string;
  is_enabled: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  sync_error?: string;
  settings: any;
  permissions: any;
  created_at: string;
  updated_at: string;
}

interface AvailableIntegration {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
  oauth_required: boolean;
}

export default function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<AvailableIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categories = [
    { key: 'productivity', label: 'Productivity', icon: '💼' },
    { key: 'health', label: 'Health & Fitness', icon: '🏥' },
    { key: 'finance', label: 'Finance', icon: '💰' },
    { key: 'lifestyle', label: 'Lifestyle', icon: '🎨' },
  ];

  const syncFrequencies = [
    { value: 'realtime', label: 'Real-time', description: 'Sync immediately when changes occur' },
    { value: 'hourly', label: 'Hourly', description: 'Sync every hour' },
    { value: 'daily', label: 'Daily', description: 'Sync once per day' },
    { value: 'weekly', label: 'Weekly', description: 'Sync once per week' },
    { value: 'manual', label: 'Manual', description: 'Sync only when requested' },
  ];

  useEffect(() => {
    fetchIntegrations();
    fetchAvailableIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/settings/integrations');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch integrations');
      }

      setIntegrations(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
      console.error('Error fetching integrations:', err);
    }
  };

  const fetchAvailableIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/integrations?action=available');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch available integrations');
      }

      setAvailableIntegrations(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available integrations');
      console.error('Error fetching available integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectIntegration = async (integrationType: string) => {
    setConnecting(integrationType);
    setError(null);

    try {
      // Get OAuth URL
      const response = await fetch(`/api/settings/integrations?action=oauth_url&type=${integrationType}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get OAuth URL');
      }

      // Open OAuth window
      const oauthWindow = window.open(
        result.data.oauth_url,
        'oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const checkClosed = setInterval(() => {
        if (oauthWindow?.closed) {
          clearInterval(checkClosed);
          setConnecting(null);
          fetchIntegrations(); // Refresh integrations
        }
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect integration');
      console.error('Error connecting integration:', err);
      setConnecting(null);
    }
  };

  const updateIntegration = async (integrationId: string, updates: Partial<Integration>) => {
    try {
      const response = await fetch(`/api/settings/integrations?id=${integrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update integration');
      }

      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId ? result.data : integration
        )
      );

      setSuccessMessage('Integration updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update integration');
      console.error('Error updating integration:', err);
    }
  };

  const syncIntegration = async (integrationType: string) => {
    setSyncing(integrationType);
    setError(null);

    try {
      const response = await fetch('/api/settings/integrations?action=sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration_type: integrationType }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync integration');
      }

      setSuccessMessage('Integration synced successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchIntegrations(); // Refresh to get updated sync status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync integration');
      console.error('Error syncing integration:', err);
    } finally {
      setSyncing(null);
    }
  };

  const testIntegration = async (integrationId: string) => {
    try {
      const response = await fetch('/api/settings/integrations?action=test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration_id: integrationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to test integration');
      }

      setSuccessMessage(result.data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test integration');
      console.error('Error testing integration:', err);
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/integrations?id=${integrationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to disconnect integration');
      }

      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      setSuccessMessage('Integration disconnected successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration');
      console.error('Error disconnecting integration:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'syncing':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isIntegrationConnected = (type: string) => {
    return integrations.some(integration => integration.integration_type === type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
        <p className="text-gray-600">Connect external services to sync your data</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Integrations</h3>
          
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {availableIntegrations.find(ai => ai.type === integration.integration_type)?.icon || '🔗'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{integration.integration_name}</h4>
                      <p className="text-sm text-gray-600">
                        {availableIntegrations.find(ai => ai.type === integration.integration_type)?.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(integration.sync_status)}`}>
                      {integration.sync_status}
                    </span>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.is_enabled}
                        onChange={(e) => updateIntegration(integration.id, { is_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sync Frequency
                    </label>
                    <select
                      value={integration.sync_frequency}
                      onChange={(e) => updateIntegration(integration.id, { sync_frequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {syncFrequencies.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={integration.sync_enabled}
                        onChange={(e) => updateIntegration(integration.id, { sync_enabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto Sync</span>
                    </label>
                  </div>

                  <div className="text-sm text-gray-600">
                    {integration.last_sync_at && (
                      <p>Last sync: {new Date(integration.last_sync_at).toLocaleString()}</p>
                    )}
                    {integration.sync_error && (
                      <p className="text-red-600">Error: {integration.sync_error}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => syncIntegration(integration.integration_type)}
                    disabled={syncing === integration.integration_type}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {syncing === integration.integration_type ? 'Syncing...' : 'Sync Now'}
                  </button>
                  
                  <button
                    onClick={() => testIntegration(integration.id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Test
                  </button>
                  
                  <button
                    onClick={() => disconnectIntegration(integration.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Integrations</h3>
        
        {categories.map((category) => {
          const categoryIntegrations = availableIntegrations.filter(
            integration => integration.category === category.key
          );

          if (categoryIntegrations.length === 0) return null;

          return (
            <div key={category.key} className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">{category.icon}</span>
                <h4 className="text-lg font-medium text-gray-900">{category.label}</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryIntegrations.map((integration) => {
                  const isConnected = isIntegrationConnected(integration.type);
                  const isConnecting = connecting === integration.type;

                  return (
                    <div key={integration.type} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{integration.icon}</span>
                        <div>
                          <h5 className="font-medium text-gray-900">{integration.name}</h5>
                          <p className="text-sm text-gray-600">{integration.description}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h6 className="text-sm font-medium text-gray-700 mb-1">Features:</h6>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {integration.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => connectIntegration(integration.type)}
                        disabled={isConnected || isConnecting}
                        className={`w-full px-3 py-2 text-sm rounded transition-colors ${
                          isConnected
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : isConnecting
                            ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">🔗 About Integrations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Integrations allow you to sync data between HayatOS and external services</li>
          <li>• OAuth authentication ensures secure connection without sharing passwords</li>
          <li>• You can control sync frequency and disable integrations at any time</li>
          <li>• Data is synced according to your privacy settings and preferences</li>
        </ul>
      </div>
    </div>
  );
}
