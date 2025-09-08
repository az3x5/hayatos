import Link from 'next/link';
import WellnessDashboard from '@/components/WellnessDashboard';

export default function WellnessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Wellness Module</h1>
          </div>
          <p className="text-lg text-gray-600">
            Comprehensive habits and health tracking with AI-powered insights and integrations
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Habits</h3>
            <p className="text-sm text-gray-600">
              Track daily, weekly, and custom habits with streak visualization
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Health Analytics</h3>
            <p className="text-sm text-gray-600">
              Comprehensive health metrics with trend analysis
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-semibold text-gray-900 mb-2">App Integrations</h3>
            <p className="text-sm text-gray-600">
              Sync with Google Fit, Apple Health, and more
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-semibold text-gray-900 mb-2">Goal Tracking</h3>
            <p className="text-sm text-gray-600">
              Set and achieve personalized wellness goals
            </p>
          </div>
        </div>

        {/* Main Dashboard */}
        <WellnessDashboard />

        {/* Technical Details */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Implementation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Habits System</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Flexible Cadence:</strong> Daily, weekly, monthly, and custom patterns</li>
                <li>• <strong>Streak Calculation:</strong> Real-time streak tracking with heatmap visualization</li>
                <li>• <strong>Smart Reminders:</strong> Configurable notifications and email reminders</li>
                <li>• <strong>Progress Analytics:</strong> Completion rates, longest streaks, and trends</li>
                <li>• <strong>Mood Tracking:</strong> Optional mood rating with each check-in</li>
                <li>• <strong>Habit Stacking:</strong> Link related habits for better consistency</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">❤️ Health Tracking</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Comprehensive Metrics:</strong> Sleep, water, exercise, diet, mood, vitals</li>
                <li>• <strong>JSONB Storage:</strong> Flexible data structure for any health metric</li>
                <li>• <strong>Trend Analysis:</strong> Statistical analysis with moving averages</li>
                <li>• <strong>Goal Setting:</strong> Personalized targets with progress tracking</li>
                <li>• <strong>Data Validation:</strong> Type-specific validation for health metrics</li>
                <li>• <strong>Export/Import:</strong> Standard health data formats support</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Integrations</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Google Fit:</strong> OAuth2 integration with automatic sync</li>
                <li>• <strong>Apple Health:</strong> HealthKit data import via mobile app</li>
                <li>• <strong>Deduplication:</strong> Prevent duplicate data from multiple sources</li>
                <li>• <strong>Token Management:</strong> Secure token storage and refresh</li>
                <li>• <strong>Sync Scheduling:</strong> Configurable automatic sync intervals</li>
                <li>• <strong>Error Handling:</strong> Robust error recovery and retry logic</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Analytics & Insights</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Heatmap Visualization:</strong> GitHub-style activity heatmaps</li>
                <li>• <strong>Trend Charts:</strong> Interactive charts with multiple data types</li>
                <li>• <strong>Statistical Functions:</strong> Database-level analytics functions</li>
                <li>• <strong>Correlation Analysis:</strong> Find relationships between metrics</li>
                <li>• <strong>Progress Reports:</strong> Weekly/monthly wellness summaries</li>
                <li>• <strong>Predictive Insights:</strong> AI-powered health recommendations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Habits API</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">GET /api/habits</code>
                  <p className="text-gray-600 mt-1">List all habits with optional stats</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/habits</code>
                  <p className="text-gray-600 mt-1">Create a new habit</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-yellow-600">PUT /api/habits/[id]</code>
                  <p className="text-gray-600 mt-1">Update habit details</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">POST /api/habits/[id]/checkin</code>
                  <p className="text-gray-600 mt-1">Log habit completion</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Health API</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">GET /api/health</code>
                  <p className="text-gray-600 mt-1">Fetch health logs with filtering</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/health</code>
                  <p className="text-gray-600 mt-1">Create health log entry</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-green-600">GET /api/health/goals</code>
                  <p className="text-gray-600 mt-1">Get health goals with progress</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/health/goals</code>
                  <p className="text-gray-600 mt-1">Set new health goal</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration APIs</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/integrations/google-fit</code>
                  <p className="text-gray-600 mt-1">Connect/sync Google Fit</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-blue-600">POST /api/integrations/apple-health</code>
                  <p className="text-gray-600 mt-1">Sync Apple Health data</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Functions</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">calculate_habit_streak()</code>
                  <p className="text-gray-600 mt-1">Real-time streak calculation</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_health_trends()</code>
                  <p className="text-gray-600 mt-1">Statistical health analysis</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-purple-600">get_habit_heatmap_data()</code>
                  <p className="text-gray-600 mt-1">Heatmap visualization data</p>
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
              <p className="text-sm">Run the habits and health migrations to create the required tables and functions.</p>
            </div>
            <div>
              <h4 className="font-semibold">2. Google Fit Integration</h4>
              <p className="text-sm">Configure Google OAuth2 credentials and enable the Fitness API in Google Cloud Console.</p>
            </div>
            <div>
              <h4 className="font-semibold">3. Apple Health Integration</h4>
              <p className="text-sm">Implement HealthKit integration in your iOS app to sync data with the API.</p>
            </div>
            <div>
              <h4 className="font-semibold">4. Environment Variables</h4>
              <p className="text-sm">Set up Google OAuth credentials and any other required API keys.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
