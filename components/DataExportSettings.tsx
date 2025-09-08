'use client';

import React, { useState, useEffect } from 'react';

interface DataExport {
  id: string;
  export_type: 'full' | 'partial' | 'module_specific';
  export_format: 'json' | 'csv' | 'pdf';
  modules: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size?: number;
  requested_at: string;
  completed_at?: string;
  expires_at?: string;
}

interface ExportPreview {
  estimated_size: string;
  estimated_records: number;
  modules_included: Array<{
    name: string;
    records: number;
    estimated_size: string;
  }>;
  date_range?: {
    start: string;
    end: string;
  };
  format: string;
}

export default function DataExportSettings() {
  const [exports, setExports] = useState<DataExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showExportForm, setShowExportForm] = useState(false);
  const [preview, setPreview] = useState<ExportPreview | null>(null);

  // Export form state
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [selectedModules, setSelectedModules] = useState<string[]>(['all']);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const availableModules = [
    { key: 'all', label: 'All Data', description: 'Export everything' },
    { key: 'profile', label: 'Profile', description: 'Personal information and settings' },
    { key: 'tasks', label: 'Tasks', description: 'All tasks and projects' },
    { key: 'habits', label: 'Habits', description: 'Habit tracking data' },
    { key: 'finance', label: 'Finance', description: 'Financial transactions and budgets' },
    { key: 'faith', label: 'Faith', description: 'Prayer logs and spiritual data' },
    { key: 'health', label: 'Health', description: 'Health metrics and records' },
  ];

  const exportFormats = [
    { value: 'json', label: 'JSON', description: 'Machine-readable format' },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet-compatible format' },
    { value: 'pdf', label: 'PDF', description: 'Human-readable document' },
  ];

  useEffect(() => {
    fetchExports();
  }, []);

  useEffect(() => {
    if (showExportForm) {
      generatePreview();
    }
  }, [exportFormat, selectedModules, dateRangeStart, dateRangeEnd, includeDeleted, showExportForm]);

  const fetchExports = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/export?action=history');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch export history');
      }

      setExports(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch export history');
      console.error('Error fetching exports:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    try {
      const response = await fetch('/api/settings/export?action=preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          export_format: exportFormat,
          modules: selectedModules,
          date_range_start: dateRangeStart || undefined,
          date_range_end: dateRangeEnd || undefined,
          include_deleted: includeDeleted,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPreview(result.data);
      }
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const requestExport = async () => {
    setExporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/settings/export?action=request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          export_format: exportFormat,
          modules: selectedModules,
          date_range_start: dateRangeStart || undefined,
          date_range_end: dateRangeEnd || undefined,
          include_deleted: includeDeleted,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request export');
      }

      setSuccessMessage('Export requested successfully. You will be notified when it\'s ready.');
      setShowExportForm(false);
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchExports(); // Refresh export list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request export');
      console.error('Error requesting export:', err);
    } finally {
      setExporting(false);
    }
  };

  const downloadExport = async (exportId: string) => {
    try {
      const response = await fetch(`/api/settings/export?action=download&id=${exportId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get download URL');
      }

      // Open download URL in new tab
      window.open(result.data.download_url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download export');
      console.error('Error downloading export:', err);
    }
  };

  const deleteExport = async (exportId: string) => {
    if (!confirm('Are you sure you want to delete this export?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/export?id=${exportId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete export');
      }

      setExports(prev => prev.filter(exp => exp.id !== exportId));
      setSuccessMessage('Export deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete export');
      console.error('Error deleting export:', err);
    }
  };

  const handleModuleToggle = (moduleKey: string) => {
    if (moduleKey === 'all') {
      setSelectedModules(['all']);
    } else {
      setSelectedModules(prev => {
        const newModules = prev.filter(m => m !== 'all');
        if (newModules.includes(moduleKey)) {
          return newModules.filter(m => m !== moduleKey);
        } else {
          return [...newModules, moduleKey];
        }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading export history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Data Export</h2>
          <p className="text-gray-600">Export your data in various formats</p>
        </div>
        <button
          onClick={() => setShowExportForm(!showExportForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showExportForm ? 'Cancel' : 'New Export'}
        </button>
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

      {/* Export Form */}
      {showExportForm && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Export</h3>
          
          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {exportFormats.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setExportFormat(format.value as any)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      exportFormat === format.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{format.label}</div>
                    <div className="text-sm text-gray-600">{format.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modules Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Data to Export
              </label>
              <div className="space-y-2">
                {availableModules.map((module) => (
                  <label key={module.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module.key)}
                      onChange={() => handleModuleToggle(module.key)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{module.label}</div>
                      <div className="text-sm text-gray-600">{module.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Include deleted items</span>
              </label>
            </div>

            {/* Preview */}
            {preview && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Export Preview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Format:</span>
                    <div className="font-medium">{preview.format.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Records:</span>
                    <div className="font-medium">{preview.estimated_records.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <div className="font-medium">{preview.estimated_size}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Modules:</span>
                    <div className="font-medium">{preview.modules_included.length}</div>
                  </div>
                </div>
                
                {preview.modules_included.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600">Included modules:</span>
                    <div className="mt-1 space-y-1">
                      {preview.modules_included.map((module) => (
                        <div key={module.name} className="text-sm flex justify-between">
                          <span>{module.name}</span>
                          <span className="text-gray-600">{module.records} records ({module.estimated_size})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExportForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={requestExport}
                disabled={exporting || selectedModules.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Creating Export...' : 'Create Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export History */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export History</h3>
        
        {exports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <p>No exports yet.</p>
            <p className="text-sm">Create your first export above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exports.map((exportItem) => (
              <div key={exportItem.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(exportItem.status)}`}>
                        {exportItem.status}
                      </span>
                      <span className="font-medium">{exportItem.export_format.toUpperCase()}</span>
                      <span className="text-sm text-gray-600">
                        {exportItem.export_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Requested: {new Date(exportItem.requested_at).toLocaleString()}
                      {exportItem.completed_at && (
                        <span> • Completed: {new Date(exportItem.completed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {exportItem.file_size && (
                      <span className="text-sm text-gray-600">
                        {formatFileSize(exportItem.file_size)}
                      </span>
                    )}
                    
                    {exportItem.status === 'completed' && exportItem.file_url && (
                      <button
                        onClick={() => downloadExport(exportItem.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Download
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteExport(exportItem.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Modules:</span> {exportItem.modules.join(', ')}
                  {exportItem.expires_at && (
                    <span className="ml-4">
                      <span className="font-medium">Expires:</span> {new Date(exportItem.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📦 About Data Export</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Exports include all your personal data in the selected format</li>
          <li>• Large exports may take several minutes to process</li>
          <li>• Export files are automatically deleted after 7 days for security</li>
          <li>• JSON format preserves all data structure and relationships</li>
          <li>• CSV format is suitable for spreadsheet applications</li>
          <li>• PDF format provides a human-readable summary</li>
        </ul>
      </div>
    </div>
  );
}
