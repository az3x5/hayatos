'use client';

import React, { useState, useEffect } from 'react';

interface SecurityInfo {
  email: string;
  email_confirmed: boolean;
  phone?: string;
  phone_confirmed: boolean;
  two_factor_enabled: boolean;
  login_notifications: boolean;
  session_timeout: number;
  last_sign_in?: string;
  created_at: string;
  recent_logins: Array<{
    timestamp: string;
    ip_address: string;
    user_agent: string;
    location: string;
  }>;
}

interface DataSummary {
  profile: number;
  tasks: number;
  habits: number;
  finance: number;
  faith: number;
  health: number;
  total_records: number;
  storage_used: string;
  account_age_days: number;
}

interface DeletionStatus {
  has_pending_deletion: boolean;
  scheduled_date?: string;
  reason?: string;
  export_data?: boolean;
  requested_at?: string;
}

export default function AccountManagement() {
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showDeletionForm, setShowDeletionForm] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [emailForm, setEmailForm] = useState({
    new_email: '',
    password: '',
  });

  const [deletionForm, setDeletionForm] = useState({
    reason: '',
    feedback: '',
    delete_immediately: false,
    export_data_before_deletion: true,
    confirm_deletion: false,
  });

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const [securityResponse, dataSummaryResponse, deletionResponse] = await Promise.all([
        fetch('/api/settings/account?action=security_info'),
        fetch('/api/settings/account?action=data_summary'),
        fetch('/api/settings/account?action=deletion_status'),
      ]);

      const [securityResult, dataSummaryResult, deletionResult] = await Promise.all([
        securityResponse.json(),
        dataSummaryResponse.json(),
        deletionResponse.json(),
      ]);

      if (securityResponse.ok) {
        setSecurityInfo(securityResult.data);
      }

      if (dataSummaryResponse.ok) {
        setDataSummary(dataSummaryResult.data);
      }

      if (deletionResponse.ok) {
        setDeletionStatus(deletionResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account information');
      console.error('Error fetching account info:', err);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/settings/account?action=change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      setSuccessMessage('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      console.error('Error changing password:', err);
    }
  };

  const changeEmail = async () => {
    try {
      const response = await fetch('/api/settings/account?action=change_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change email');
      }

      setSuccessMessage('Email change initiated. Please check your new email for confirmation.');
      setShowEmailForm(false);
      setEmailForm({ new_email: '', password: '' });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change email');
      console.error('Error changing email:', err);
    }
  };

  const toggle2FA = async (enable: boolean) => {
    try {
      const response = await fetch(`/api/settings/account?action=${enable ? 'enable' : 'disable'}_2fa`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${enable ? 'enable' : 'disable'} 2FA`);
      }

      setSecurityInfo(prev => prev ? { ...prev, two_factor_enabled: enable } : null);
      setSuccessMessage(`Two-factor authentication ${enable ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${enable ? 'enable' : 'disable'} 2FA`);
      console.error('Error toggling 2FA:', err);
    }
  };

  const requestAccountDeletion = async () => {
    if (!deletionForm.confirm_deletion) {
      setError('You must confirm the deletion');
      return;
    }

    try {
      const response = await fetch('/api/settings/account?action=request_deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletionForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request account deletion');
      }

      setSuccessMessage('Account deletion requested successfully');
      setShowDeletionForm(false);
      fetchAccountInfo(); // Refresh deletion status
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request account deletion');
      console.error('Error requesting account deletion:', err);
    }
  };

  const cancelAccountDeletion = async () => {
    try {
      const response = await fetch('/api/settings/account?action=cancel_deletion', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel account deletion');
      }

      setSuccessMessage('Account deletion cancelled successfully');
      fetchAccountInfo(); // Refresh deletion status
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel account deletion');
      console.error('Error cancelling account deletion:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Account Management</h2>
        <p className="text-gray-600">Manage your account security and data</p>
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

      {/* Account Deletion Warning */}
      {deletionStatus?.has_pending_deletion && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-900">⚠️ Account Deletion Scheduled</h4>
              <p className="text-red-800">
                Your account is scheduled for deletion on{' '}
                {deletionStatus.scheduled_date && new Date(deletionStatus.scheduled_date).toLocaleDateString()}
              </p>
              {deletionStatus.reason && (
                <p className="text-sm text-red-700 mt-1">Reason: {deletionStatus.reason}</p>
              )}
            </div>
            <button
              onClick={cancelAccountDeletion}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Deletion
            </button>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {securityInfo && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
          
          <div className="space-y-6">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Address</h4>
                <p className="text-sm text-gray-600">
                  {securityInfo.email}
                  {securityInfo.email_confirmed ? (
                    <span className="ml-2 text-green-600">✓ Verified</span>
                  ) : (
                    <span className="ml-2 text-red-600">⚠ Unverified</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Change Email
              </button>
            </div>

            {showEmailForm && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={emailForm.new_email}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, new_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="new@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={changeEmail}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Change Email
                    </button>
                    <button
                      onClick={() => setShowEmailForm(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Password</h4>
                <p className="text-sm text-gray-600">Last changed: Unknown</p>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Change Password
              </button>
            </div>

            {showPasswordForm && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={changePassword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Change Password
                    </button>
                    <button
                      onClick={() => setShowPasswordForm(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">
                  {securityInfo.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <button
                onClick={() => toggle2FA(!securityInfo.two_factor_enabled)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  securityInfo.two_factor_enabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {securityInfo.two_factor_enabled ? 'Disable' : 'Enable'} 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Summary */}
      {dataSummary && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Data</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dataSummary.total_records}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dataSummary.storage_used}</div>
              <div className="text-sm text-gray-600">Storage Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dataSummary.account_age_days}</div>
              <div className="text-sm text-gray-600">Days Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(dataSummary).filter((v, i) => i > 0 && i < 6 && v > 0).length}
              </div>
              <div className="text-sm text-gray-600">Active Modules</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Profile:</span>
              <span className="font-medium">{dataSummary.profile}</span>
            </div>
            <div className="flex justify-between">
              <span>Tasks:</span>
              <span className="font-medium">{dataSummary.tasks}</span>
            </div>
            <div className="flex justify-between">
              <span>Habits:</span>
              <span className="font-medium">{dataSummary.habits}</span>
            </div>
            <div className="flex justify-between">
              <span>Finance:</span>
              <span className="font-medium">{dataSummary.finance}</span>
            </div>
            <div className="flex justify-between">
              <span>Faith:</span>
              <span className="font-medium">{dataSummary.faith}</span>
            </div>
            <div className="flex justify-between">
              <span>Health:</span>
              <span className="font-medium">{dataSummary.health}</span>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion */}
      {!deletionStatus?.has_pending_deletion && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h3>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-red-900 mb-2">⚠️ Warning</h4>
            <p className="text-red-800 text-sm">
              Account deletion is permanent and cannot be undone. All your data will be permanently removed from our servers.
            </p>
          </div>

          <button
            onClick={() => setShowDeletionForm(!showDeletionForm)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {showDeletionForm ? 'Cancel' : 'Delete Account'}
          </button>

          {showDeletionForm && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for deletion (optional)
                  </label>
                  <select
                    value={deletionForm.reason}
                    onChange={(e) => setDeletionForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="no_longer_needed">No longer needed</option>
                    <option value="privacy_concerns">Privacy concerns</option>
                    <option value="switching_services">Switching to another service</option>
                    <option value="too_complex">Too complex to use</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional feedback (optional)
                  </label>
                  <textarea
                    value={deletionForm.feedback}
                    onChange={(e) => setDeletionForm(prev => ({ ...prev, feedback: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Help us improve by sharing your feedback"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deletionForm.export_data_before_deletion}
                      onChange={(e) => setDeletionForm(prev => ({ ...prev, export_data_before_deletion: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Export my data before deletion</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deletionForm.delete_immediately}
                      onChange={(e) => setDeletionForm(prev => ({ ...prev, delete_immediately: e.target.checked }))}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Delete immediately (skip 30-day grace period)</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deletionForm.confirm_deletion}
                      onChange={(e) => setDeletionForm(prev => ({ ...prev, confirm_deletion: e.target.checked }))}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">
                      I understand this action cannot be undone
                    </span>
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={requestAccountDeletion}
                    disabled={!deletionForm.confirm_deletion}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Delete Account
                  </button>
                  <button
                    onClick={() => setShowDeletionForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
