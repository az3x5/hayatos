import FinanceOverview from '@/components/finance/FinanceOverview';

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="text-muted-foreground">
          Track your income, expenses, and budgets
        </p>
      </div>

      <FinanceOverview />
    </div>
  );
}

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">🏦</div>
            <h3 className="font-semibold text-gray-900 mb-2">Account Management</h3>
            <p className="text-sm text-gray-600">
              Track multiple accounts with real-time balances and insights
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">💳</div>
            <h3 className="font-semibold text-gray-900 mb-2">Transaction Tracking</h3>
            <p className="text-sm text-gray-600">
              Categorize and manage all your financial transactions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Budget Management</h3>
            <p className="text-sm text-gray-600">
              Set budgets and track spending with smart alerts
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-semibold text-gray-900 mb-2">Banking Integration</h3>
            <p className="text-sm text-gray-600">
              Connect bank accounts for automatic transaction import
            </p>
          </div>
        </div>

        {/* Main Dashboard */}
        <UnifiedFinanceDashboard />

        {/* Technical Details */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Implementation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏦 Account Management</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Multiple Account Types:</strong> Cash, checking, savings, credit, investment, loans</li>
                <li>• <strong>Real-time Balances:</strong> Automatic balance updates with transactions</li>
                <li>• <strong>Multi-currency Support:</strong> Handle different currencies and exchange rates</li>
                <li>• <strong>Account Masking:</strong> Secure display of sensitive account information</li>
                <li>• <strong>External Integration:</strong> Link with banking APIs for automatic sync</li>
                <li>• <strong>Account Analytics:</strong> Track account performance and trends</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Transaction System</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Transaction Types:</strong> Income, expense, and transfer transactions</li>
                <li>• <strong>Smart Categorization:</strong> Automatic and manual transaction categorization</li>
                <li>• <strong>Transfer Handling:</strong> Paired transactions for account transfers</li>
                <li>• <strong>Recurring Transactions:</strong> Automated recurring payment setup</li>
                <li>• <strong>Transaction Search:</strong> Advanced filtering and search capabilities</li>
                <li>• <strong>Bulk Operations:</strong> Import and export transaction data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Budget Tracking</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Flexible Periods:</strong> Weekly, monthly, quarterly, and yearly budgets</li>
                <li>• <strong>Category-based:</strong> Budget by spending categories with progress tracking</li>
                <li>• <strong>Smart Alerts:</strong> Configurable alerts when approaching budget limits</li>
                <li>• <strong>Account Filtering:</strong> Track specific accounts within budgets</li>
                <li>• <strong>Progress Visualization:</strong> Real-time budget progress with charts</li>
                <li>• <strong>Historical Analysis:</strong> Compare budget performance over time</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Banking Integration</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Plaid Integration:</strong> Secure connection to 11,000+ financial institutions</li>
                <li>• <strong>Automatic Sync:</strong> Daily transaction and balance synchronization</li>
                <li>• <strong>Duplicate Detection:</strong> Prevent duplicate transactions from multiple sources</li>
                <li>• <strong>Error Handling:</strong> Robust error recovery and reconnection flows</li>
                <li>• <strong>Data Security:</strong> Bank-level encryption and secure token management</li>
                <li>• <strong>Institution Support:</strong> Support for major banks and credit unions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounts API</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">GET /api/finance/accounts</code>
                  <p className="text-gray-600 mt-1">List all financial accounts</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/finance/accounts</code>
                  <p className="text-gray-600 mt-1">Create a new account</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-yellow-600">PUT /api/finance/accounts/[id]</code>
                  <p className="text-gray-600 mt-1">Update account details</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-red-600">DELETE /api/finance/accounts/[id]</code>
                  <p className="text-gray-600 mt-1">Delete or deactivate account</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions API</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">GET /api/finance/transactions</code>
                  <p className="text-gray-600 mt-1">Fetch transactions with filtering</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/finance/transactions</code>
                  <p className="text-gray-600 mt-1">Create new transaction</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-yellow-600">PUT /api/finance/transactions/[id]</code>
                  <p className="text-gray-600 mt-1">Update transaction</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-red-600">DELETE /api/finance/transactions/[id]</code>
                  <p className="text-gray-600 mt-1">Delete transaction</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budgets API</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">GET /api/finance/budgets</code>
                  <p className="text-gray-600 mt-1">Get budgets with progress</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/finance/budgets</code>
                  <p className="text-gray-600 mt-1">Create new budget</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-yellow-600">PUT /api/finance/budgets/[id]</code>
                  <p className="text-gray-600 mt-1">Update budget settings</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Banking</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">GET /api/finance/insights</code>
                  <p className="text-gray-600 mt-1">Financial insights and analytics</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/finance/banking</code>
                  <p className="text-gray-600 mt-1">Banking integration actions</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">GET /api/finance/banking</code>
                  <p className="text-gray-600 mt-1">Get integration status</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Functions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Functions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Analytics</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_monthly_spending_by_category()</code>
                  <p className="text-gray-600 mt-1">Category-wise spending analysis</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_budget_progress()</code>
                  <p className="text-gray-600 mt-1">Real-time budget tracking</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_monthly_cash_flow()</code>
                  <p className="text-gray-600 mt-1">Income vs expense trends</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_account_balances_summary()</code>
                  <p className="text-gray-600 mt-1">Net worth and asset calculation</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">update_account_balance()</code>
                  <p className="text-gray-600 mt-1">Automatic balance updates</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_savings_progress()</code>
                  <p className="text-gray-600 mt-1">Financial goal tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Setup Instructions</h2>
          <div className="space-y-4 text-blue-800">
            <div>
              <h4 className="font-semibold">1. Database Setup</h4>
              <p className="text-sm">Run the finance migrations to create accounts, transactions, budgets, and banking integration tables.</p>
            </div>
            <div>
              <h4 className="font-semibold">2. Plaid Integration</h4>
              <p className="text-sm">Configure Plaid API credentials for banking integrations and set up webhook endpoints.</p>
            </div>
            <div>
              <h4 className="font-semibold">3. Environment Variables</h4>
              <p className="text-sm">Set up Plaid client ID, secret, and environment configuration for banking connections.</p>
            </div>
            <div>
              <h4 className="font-semibold">4. Security Configuration</h4>
              <p className="text-sm">Configure encryption for sensitive financial data and set up proper access controls.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
