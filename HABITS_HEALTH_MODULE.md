# Habits and Health Tracking Module

## 🚀 Overview

The Habits and Health tracking module provides comprehensive wellness management with smart habit tracking, detailed health analytics, and seamless integrations with popular health apps. This implementation includes streak visualization, goal setting, and AI-powered insights.

## ✨ Features Implemented

### 🎯 Smart Habits System
- **Flexible Cadence**: Daily, weekly, monthly, and custom habit patterns
- **Streak Tracking**: Real-time calculation with GitHub-style heatmap visualization
- **Smart Reminders**: Configurable notifications, email, and SMS reminders
- **Progress Analytics**: Completion rates, longest streaks, and trend analysis
- **Mood Integration**: Optional mood rating with each habit check-in
- **Target Customization**: Flexible target values and units

### ❤️ Comprehensive Health Tracking
- **Multiple Metrics**: Sleep, water, exercise, diet, mood, weight, vitals
- **JSONB Storage**: Flexible data structure for any health metric type
- **Trend Analysis**: Statistical analysis with moving averages and insights
- **Goal Setting**: Personalized targets with real-time progress tracking
- **Data Validation**: Type-specific validation for health data integrity
- **Source Tracking**: Manual entry vs. automated sync identification

### 🔗 Health App Integrations
- **Google Fit**: OAuth2 integration with automatic data sync
- **Apple Health**: HealthKit data import via mobile app
- **Deduplication**: Prevent duplicate data from multiple sources
- **Token Management**: Secure encrypted token storage and refresh
- **Sync Scheduling**: Configurable automatic sync intervals
- **Error Recovery**: Robust error handling and retry mechanisms

### 📊 Advanced Analytics
- **Heatmap Visualization**: GitHub-style activity heatmaps for habits
- **Interactive Charts**: Multi-type health data visualization
- **Statistical Functions**: Database-level analytics and calculations
- **Correlation Analysis**: Find relationships between different metrics
- **Progress Reports**: Automated weekly/monthly wellness summaries
- **Predictive Insights**: AI-powered health recommendations

## 🗄️ Database Schema

### Core Tables
```sql
-- Habits with flexible cadence configuration
habits (id, user_id, title, cadence, target_value, color, icon, reminders)

-- Habit check-in logs with mood tracking
habit_logs (id, habit_id, logged_at, value, notes, mood_rating)

-- Flexible health data storage
health_logs (id, user_id, type, value::jsonb, start_time, source)

-- Personalized health goals
health_goals (id, user_id, type, target_value::jsonb, period)

-- External app integrations
health_integrations (id, user_id, provider, access_token, sync_settings)
```

### Advanced Functions
```sql
-- Real-time streak calculation
calculate_habit_streak(habit_uuid, user_uuid, end_date)

-- Health trend analysis
get_health_trends(user_uuid, log_type, start_date, end_date)

-- Heatmap data generation
get_habit_heatmap_data(habit_uuid, user_uuid, date_range)

-- Wellness summary statistics
get_user_wellness_summary(user_uuid)
```

## 🔧 API Endpoints

### Habits Management
```typescript
GET    /api/habits                    // List habits with stats
POST   /api/habits                    // Create new habit
GET    /api/habits/[id]               // Get habit details
PUT    /api/habits/[id]               // Update habit
DELETE /api/habits/[id]               // Delete habit
POST   /api/habits/[id]/checkin       // Log habit completion
GET    /api/habits/[id]/checkin       // Get check-in history
```

### Health Tracking
```typescript
GET    /api/health                    // Fetch health logs
POST   /api/health                    // Create health log
GET    /api/health/goals              // Get health goals
POST   /api/health/goals              // Set health goal
```

### External Integrations
```typescript
GET    /api/integrations/google-fit   // Check connection status
POST   /api/integrations/google-fit?action=connect   // Connect account
POST   /api/integrations/google-fit?action=sync      // Sync data
POST   /api/integrations/google-fit?action=disconnect // Disconnect

GET    /api/integrations/apple-health // Check connection status
POST   /api/integrations/apple-health?action=connect  // Connect device
POST   /api/integrations/apple-health?action=sync     // Sync data
```

## 🎨 React Components

### Core Components
- **WellnessDashboard**: Unified habits and health overview
- **HabitsDashboard**: Habit management and tracking interface
- **HealthDashboard**: Health metrics and analytics
- **HabitStreakHeatmap**: GitHub-style habit visualization
- **HealthChart**: Interactive health data charts

### React Hooks
- **useHabits()**: Habit CRUD operations and check-ins
- **useHealthLogs()**: Health data management
- **useHealthGoals()**: Goal setting and progress tracking
- **useHealthIntegrations()**: External app connections

## 📱 Integration Examples

### Google Fit Connection
```typescript
const { connectIntegration } = useHealthIntegrations();

// OAuth2 flow result
const googleFitData = {
  access_token: "ya29.a0...",
  refresh_token: "1//04...",
  expires_in: 3600
};

await connectIntegration('google_fit', googleFitData);
```

### Apple Health Sync
```typescript
// From iOS app via HealthKit
const healthData = [
  {
    type: 'steps',
    value: { count: 8500 },
    start_date: '2024-01-15T00:00:00Z',
    source: 'Apple Watch'
  },
  {
    type: 'sleep',
    value: { hours: 7.5, quality: 4 },
    start_date: '2024-01-14T22:00:00Z',
    end_date: '2024-01-15T05:30:00Z'
  }
];

await syncIntegration('apple_health', { health_data: healthData });
```

### Habit Check-in
```typescript
const { checkInHabit } = useHabits();

await checkInHabit('habit-id', 1, 'Felt great today!', 5);
```

## 🎯 Health Data Types

### Supported Metrics
```typescript
// Sleep tracking
{ type: 'sleep', value: { hours: 7.5, quality: 4 } }

// Water intake
{ type: 'water', value: { amount: 2000, unit: 'ml' } }

// Exercise session
{ type: 'exercise', value: { type: 'running', duration: 30, calories: 300 } }

// Weight measurement
{ type: 'weight', value: { weight: 70.5, unit: 'kg' } }

// Blood pressure
{ type: 'blood_pressure', value: { systolic: 120, diastolic: 80 } }

// Heart rate
{ type: 'heart_rate', value: { bpm: 72 } }

// Daily steps
{ type: 'steps', value: { count: 8500 } }

// Mood rating
{ type: 'mood', value: { rating: 4, notes: 'Feeling positive' } }
```

## 🔒 Security & Privacy

### Data Protection
- **Encryption**: All access tokens encrypted at rest
- **Row Level Security**: User data isolation
- **Token Refresh**: Automatic token renewal
- **Data Validation**: Strict input validation
- **Audit Logging**: Track all data modifications

### Privacy Features
- **Data Ownership**: Users control their data
- **Export/Delete**: Full data portability
- **Source Attribution**: Clear data source tracking
- **Consent Management**: Granular permission controls

## 🚀 Getting Started

### 1. Database Setup
```bash
# Run migrations
npx supabase db reset

# The following migrations will be applied:
# - 20240101000007_habits_health_schema.sql
# - 20240101000008_habits_health_functions.sql
```

### 2. Environment Configuration
```env
# Google Fit Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: Apple Health (for mobile app)
APPLE_TEAM_ID=your_apple_team_id
```

### 3. Component Usage
```tsx
import WellnessDashboard from '@/components/WellnessDashboard';

export default function WellnessPage() {
  return <WellnessDashboard />;
}
```

### 4. Demo Access
Visit `/wellness` to see the full demo with:
- Interactive habit tracking
- Health data visualization
- Integration management
- Goal progress tracking

## 📊 Analytics Features

### Habit Analytics
- **Streak Calculation**: Current and longest streaks
- **Completion Rates**: Success percentages over time
- **Heatmap Visualization**: Year-view activity patterns
- **Trend Analysis**: Weekly/monthly progress trends
- **Correlation Insights**: Habit interdependencies

### Health Analytics
- **Trend Charts**: Moving averages and patterns
- **Goal Progress**: Real-time achievement tracking
- **Statistical Analysis**: Min/max/average calculations
- **Comparative Analysis**: Period-over-period comparisons
- **Predictive Modeling**: Future trend projections

## 🔄 Sync Mechanisms

### Automatic Sync
- **Scheduled Jobs**: Hourly/daily sync intervals
- **Webhook Support**: Real-time data updates
- **Conflict Resolution**: Smart duplicate handling
- **Error Recovery**: Automatic retry with backoff

### Manual Sync
- **On-Demand**: User-triggered sync
- **Selective Sync**: Choose specific data types
- **Batch Processing**: Efficient bulk operations
- **Progress Tracking**: Real-time sync status

## 🎨 Customization

### Habit Customization
- **Custom Icons**: Emoji or custom images
- **Color Themes**: Personalized color schemes
- **Reminder Settings**: Flexible notification options
- **Target Flexibility**: Any unit and value

### Dashboard Customization
- **Widget Layout**: Drag-and-drop interface
- **Chart Types**: Line, bar, area charts
- **Time Ranges**: Custom date ranges
- **Metric Selection**: Choose displayed metrics

## 🔮 Future Enhancements

### Planned Features
- **AI Coaching**: Personalized habit recommendations
- **Social Features**: Share progress with friends
- **Wearable Integration**: Direct smartwatch sync
- **Advanced Analytics**: Machine learning insights
- **Gamification**: Achievements and challenges
- **Export Options**: PDF reports and data export

---

The Habits and Health module provides a comprehensive foundation for wellness tracking with enterprise-grade features, seamless integrations, and powerful analytics capabilities.
