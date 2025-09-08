# Settings Module - Complete User Settings Management

## 🔧 Overview

The Settings Module provides comprehensive user settings management including personal profile, theme customization, notification preferences, external integrations, data export capabilities, and account security management. This implementation follows modern UX patterns and includes robust security features.

## ✨ Features Implemented

### 👤 Profile Management
- **Personal Information**: Complete profile with name, bio, contact details, and location
- **Avatar Upload**: Image upload with validation, resizing, and secure storage
- **Preferences**: Timezone, language, and regional settings with validation
- **Account Information**: Creation date, last updated, and account statistics
- **Auto-save**: Automatic saving of profile changes with error handling
- **Validation**: Comprehensive input validation and sanitization

### 🎨 Theme System
- **Built-in Themes**: Light, dark, Islamic, and auto (system preference) themes
- **Custom Themes**: Full color picker interface for creating custom themes
- **Typography**: Font family selection, size adjustment, and Arabic font support
- **Display Options**: Compact mode, animations toggle, and high contrast mode
- **Live Preview**: Real-time theme preview with sample content
- **Theme Reset**: Reset to default theme settings with confirmation

### 🔔 Notification Management
- **Global Controls**: Master notification switch and delivery method preferences
- **Module-specific**: Granular control for tasks, habits, faith, finance, and health modules
- **Delivery Methods**: Email, push notifications, and SMS with test capabilities
- **Timing Controls**: Quiet hours, weekend preferences, and scheduling options
- **Bulk Operations**: Enable/disable notifications by category or all at once
- **Test Notifications**: Send test notifications to verify setup and delivery

### 🔗 Integration Management
- **OAuth Flow**: Secure authentication with external services using OAuth 2.0
- **Service Categories**: Productivity (Google Calendar, Notion), Health (Fitbit, Apple Health), Finance (Banking APIs), Lifestyle (Spotify)
- **Sync Management**: Configurable sync frequency and manual sync options
- **Status Monitoring**: Real-time connection status and error tracking
- **Test Connections**: Verify integration functionality and data flow
- **Secure Disconnect**: Safe removal of integrations with data cleanup

### 📦 Data Export
- **Multiple Formats**: JSON (complete structure), CSV (spreadsheet-ready), PDF (human-readable)
- **Selective Export**: Choose specific modules or export all data
- **Date Filtering**: Export data within specific date ranges
- **Export Preview**: Preview what will be exported before processing
- **Background Processing**: Asynchronous export processing for large datasets
- **Secure Downloads**: Time-limited download links with automatic cleanup

### ⚙️ Account Security
- **Password Management**: Secure password change with strength validation
- **Email Updates**: Email change with confirmation flow and verification
- **Two-Factor Authentication**: TOTP-based 2FA setup and management
- **Security Overview**: Account age, login history, and security metrics
- **Account Deletion**: GDPR-compliant deletion with 30-day grace period
- **Data Protection**: Export data before deletion option

## 🗄️ Database Schema

### Core Settings Tables
```sql
-- User profiles and personal information
user_profiles (id, user_id, first_name, last_name, display_name, bio, avatar_url, 
               phone_number, date_of_birth, gender, timezone, language, country, city)

-- Theme and appearance settings
user_themes (id, user_id, theme_name, custom_colors, font_family, font_size, 
             arabic_font, compact_mode, animations_enabled, high_contrast)

-- Notification preferences
notification_settings (id, user_id, notifications_enabled, email_notifications, 
                      push_notifications, sms_notifications, module_specific_settings,
                      quiet_hours_enabled, quiet_hours_start, quiet_hours_end)

-- External integrations
user_integrations (id, user_id, integration_type, integration_name, is_enabled,
                  sync_frequency, sync_enabled, last_sync_at, sync_status,
                  access_token, refresh_token, settings, permissions)

-- Privacy and security settings
privacy_settings (id, user_id, profile_visibility, show_activity_status,
                 analytics_enabled, two_factor_enabled, login_notifications,
                 session_timeout, data_retention_days)

-- Data export logs
data_exports (id, user_id, export_type, export_format, modules, status,
             file_url, file_size, expires_at, requested_at, completed_at)

-- Account deletion requests
account_deletions (id, user_id, reason, feedback, delete_immediately,
                  export_data_before_deletion, status, scheduled_deletion_date)

-- User preferences (flexible key-value store)
user_preferences (id, user_id, preference_key, preference_value, preference_type, module)

-- Application settings (global)
app_settings (id, setting_key, setting_value, setting_type, description, is_public)
```

### Advanced Database Functions
```sql
-- Settings management
get_user_settings(user_uuid) -- Complete user settings retrieval
initialize_user_settings(user_uuid) -- Initialize default settings for new users
update_user_preference(user_uuid, key, value, type, module) -- Update specific preference

-- Data export and account management
export_user_data(user_uuid, format, modules, include_deleted) -- Create export request
request_account_deletion(user_uuid, reason, feedback, immediate, export_data) -- Request deletion
cancel_account_deletion(user_uuid) -- Cancel pending deletion
sync_integration(user_uuid, integration_type) -- Sync external integration

-- Utility functions
get_app_settings() -- Get public application settings
cleanup_expired_exports() -- Clean up expired export files
process_pending_deletions() -- Process scheduled account deletions
```

## 🔧 API Endpoints

### Profile Management API
```typescript
GET    /api/settings/profile                    // Get user profile
PUT    /api/settings/profile                    // Update profile information
POST   /api/settings/profile?action=upload_avatar // Upload profile picture
POST   /api/settings/profile?action=initialize    // Initialize default profile
DELETE /api/settings/profile?action=avatar        // Remove profile picture
```

### Theme Management API
```typescript
GET    /api/settings/theme                      // Get theme settings
PUT    /api/settings/theme                      // Update theme settings
POST   /api/settings/theme?action=custom_theme  // Create custom theme
POST   /api/settings/theme?action=reset         // Reset to default theme
POST   /api/settings/theme?action=preview       // Preview theme changes
DELETE /api/settings/theme?action=custom_theme  // Delete custom theme
```

### Notification Management API
```typescript
GET    /api/settings/notifications              // Get notification preferences
PUT    /api/settings/notifications              // Update notification settings
POST   /api/settings/notifications?action=test // Send test notification
POST   /api/settings/notifications?action=reset // Reset to defaults
POST   /api/settings/notifications?action=bulk_update // Bulk enable/disable
```

### Integration Management API
```typescript
GET    /api/settings/integrations               // Get connected integrations
GET    /api/settings/integrations?action=available // Get available integrations
GET    /api/settings/integrations?action=oauth_url // Get OAuth URL
POST   /api/settings/integrations               // Create new integration
POST   /api/settings/integrations?action=oauth_callback // OAuth callback
POST   /api/settings/integrations?action=sync   // Sync integration
POST   /api/settings/integrations?action=test   // Test integration
PUT    /api/settings/integrations?id=uuid       // Update integration
DELETE /api/settings/integrations?id=uuid       // Delete integration
```

### Data Export API
```typescript
GET    /api/settings/export?action=history      // Get export history
GET    /api/settings/export?action=download&id=uuid // Download export
GET    /api/settings/export?action=status&id=uuid   // Get export status
POST   /api/settings/export?action=request      // Request new export
POST   /api/settings/export?action=preview      // Preview export
DELETE /api/settings/export?id=uuid             // Delete export
```

### Account Management API
```typescript
GET    /api/settings/account?action=security_info    // Get security information
GET    /api/settings/account?action=deletion_status  // Get deletion status
GET    /api/settings/account?action=data_summary     // Get data summary
POST   /api/settings/account?action=change_password  // Change password
POST   /api/settings/account?action=change_email     // Change email
POST   /api/settings/account?action=enable_2fa       // Enable 2FA
POST   /api/settings/account?action=disable_2fa      // Disable 2FA
POST   /api/settings/account?action=request_deletion // Request account deletion
POST   /api/settings/account?action=cancel_deletion  // Cancel account deletion
```

### Settings Management API
```typescript
GET    /api/settings?action=all                 // Get all user settings
GET    /api/settings?action=preferences         // Get user preferences
GET    /api/settings?action=app_settings        // Get app settings
POST   /api/settings?action=initialize          // Initialize user settings
POST   /api/settings?action=preference          // Update preference
POST   /api/settings?action=reset               // Reset all settings
POST   /api/settings?action=backup              // Backup settings
POST   /api/settings?action=restore             // Restore from backup
DELETE /api/settings?action=preference&key=name // Delete preference
```

## 🎨 React Components

### Core Components
- **SettingsDashboard**: Main settings interface with tabbed navigation
- **ProfileSettings**: Personal profile management with avatar upload
- **ThemeSettings**: Theme selection and customization interface
- **NotificationSettings**: Notification preferences with test capabilities
- **IntegrationsSettings**: External service connection management
- **DataExportSettings**: Data export interface with preview and history
- **AccountManagement**: Security settings and account deletion

### Component Features
- **Responsive Design**: Mobile-first responsive layout
- **Real-time Updates**: Live preview and immediate feedback
- **Error Handling**: Comprehensive error states and recovery
- **Loading States**: Skeleton loading and progress indicators
- **Validation**: Client-side validation with server-side verification
- **Accessibility**: Full keyboard navigation and screen reader support

## 🔒 Security Features

### Data Protection
- **Row Level Security**: Complete RLS policies for user data isolation
- **Data Encryption**: Sensitive data encrypted at rest and in transit
- **Input Validation**: Comprehensive validation and sanitization
- **CSRF Protection**: Cross-site request forgery protection
- **Rate Limiting**: API rate limiting to prevent abuse
- **Audit Logging**: Security events and changes logged

### OAuth Security
- **Secure Token Storage**: Encrypted OAuth tokens with rotation
- **Scope Management**: Minimal required permissions for integrations
- **Token Expiry**: Automatic token refresh and expiry handling
- **Revocation Support**: Ability to revoke integration access
- **State Validation**: CSRF protection for OAuth flows
- **Secure Redirects**: Validated redirect URLs

### Account Security
- **Password Strength**: Enforced password complexity requirements
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- **Session Management**: Secure session handling with timeout
- **Login Monitoring**: Failed login attempt tracking
- **Account Lockout**: Temporary lockout after failed attempts
- **Email Verification**: Email confirmation for sensitive changes

## 🚀 Getting Started

### 1. Database Setup
```bash
# Run settings migrations
npx supabase db reset

# Migrations applied:
# - 20240101000013_settings_schema.sql
# - 20240101000014_settings_functions.sql
```

### 2. Storage Configuration
```bash
# Configure Supabase Storage buckets
# - user-uploads: For avatar images
# - exports: For data export files
```

### 3. OAuth Configuration
```bash
# Set up OAuth credentials in environment variables
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
FITBIT_REDIRECT_URI=your_redirect_uri

# Add other integration credentials as needed
```

### 4. Component Usage
```tsx
import SettingsDashboard from '@/components/SettingsDashboard';

export default function SettingsPage() {
  return <SettingsDashboard />;
}
```

### 5. Demo Access
Visit `/settings` to explore:
- Complete profile management with avatar upload
- Theme customization with live preview
- Notification preferences with test capabilities
- Integration management with OAuth flow
- Data export with multiple formats
- Account security and deletion options

## 📱 Mobile & Accessibility

### Responsive Design
- **Mobile-first**: Optimized for mobile devices with touch-friendly interfaces
- **Tablet Support**: Adapted layouts for tablet screen sizes
- **Desktop Enhancement**: Enhanced features for desktop users
- **Cross-browser**: Compatible with all modern browsers
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility for all features
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: High contrast mode for better visibility
- **Font Scaling**: Adjustable font sizes for readability
- **Color Blind Support**: Color-blind friendly design patterns
- **Focus Management**: Clear focus indicators and logical tab order

## 🔮 Future Enhancements

### Advanced Features
- **Settings Sync**: Sync settings across multiple devices
- **Team Settings**: Shared settings for team/family accounts
- **Advanced Themes**: Theme marketplace and sharing
- **Backup Scheduling**: Automated settings and data backups
- **Advanced Analytics**: Detailed usage analytics and insights
- **API Keys**: User-generated API keys for third-party access

### Integration Expansions
- **More Services**: Additional productivity, health, and lifestyle integrations
- **Webhook Support**: Real-time data sync via webhooks
- **Custom Integrations**: User-defined custom integrations
- **Integration Marketplace**: Community-contributed integrations
- **Advanced Sync**: Bi-directional sync with conflict resolution
- **Bulk Operations**: Bulk data import/export for integrations

---

The Settings Module provides a comprehensive, secure, and user-friendly settings management system that covers all aspects of user preferences, security, and data management while maintaining high standards for privacy and accessibility.
