-- Settings Module Database Schema

-- User profiles and personal settings
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    country TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Theme and appearance settings
CREATE TABLE public.user_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_name TEXT NOT NULL DEFAULT 'light' CHECK (theme_name IN ('light', 'dark', 'islamic', 'auto')),
    custom_colors JSONB DEFAULT '{}',
    font_family TEXT DEFAULT 'Inter',
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra_large')),
    arabic_font TEXT DEFAULT 'Amiri',
    compact_mode BOOLEAN DEFAULT FALSE,
    animations_enabled BOOLEAN DEFAULT TRUE,
    high_contrast BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Notification preferences
CREATE TABLE public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global notification settings
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    -- Module-specific notifications
    task_notifications BOOLEAN DEFAULT TRUE,
    task_reminders BOOLEAN DEFAULT TRUE,
    task_deadlines BOOLEAN DEFAULT TRUE,
    
    habit_notifications BOOLEAN DEFAULT TRUE,
    habit_reminders BOOLEAN DEFAULT TRUE,
    habit_streaks BOOLEAN DEFAULT TRUE,
    
    salat_notifications BOOLEAN DEFAULT TRUE,
    salat_reminders BOOLEAN DEFAULT TRUE,
    azkar_reminders BOOLEAN DEFAULT TRUE,
    
    finance_notifications BOOLEAN DEFAULT TRUE,
    budget_alerts BOOLEAN DEFAULT TRUE,
    bill_reminders BOOLEAN DEFAULT TRUE,
    
    health_notifications BOOLEAN DEFAULT TRUE,
    medication_reminders BOOLEAN DEFAULT FALSE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    
    -- Notification timing
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    weekend_notifications BOOLEAN DEFAULT TRUE,
    
    -- Notification methods
    notification_sound TEXT DEFAULT 'default',
    vibration_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- External integrations
CREATE TABLE public.user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL CHECK (integration_type IN (
        'google_calendar', 'google_fit', 'apple_health', 'fitbit', 
        'banking_api', 'spotify', 'github', 'slack', 'notion'
    )),
    integration_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- OAuth and API credentials (encrypted)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    api_key TEXT,
    api_secret TEXT,
    
    -- Integration-specific settings
    sync_frequency TEXT DEFAULT 'hourly' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
    sync_error TEXT,
    
    -- Integration configuration
    settings JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, integration_type)
);

-- Privacy and security settings
CREATE TABLE public.privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile visibility
    profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    show_activity_status BOOLEAN DEFAULT FALSE,
    show_last_seen BOOLEAN DEFAULT FALSE,
    
    -- Data sharing
    analytics_enabled BOOLEAN DEFAULT TRUE,
    crash_reporting BOOLEAN DEFAULT TRUE,
    usage_statistics BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    
    -- Security settings
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    login_notifications BOOLEAN DEFAULT TRUE,
    session_timeout INTEGER DEFAULT 30, -- days
    
    -- Data retention
    auto_delete_old_data BOOLEAN DEFAULT FALSE,
    data_retention_days INTEGER DEFAULT 365,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Data export logs
CREATE TABLE public.data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL CHECK (export_type IN ('full', 'partial', 'module_specific')),
    export_format TEXT NOT NULL CHECK (export_format IN ('json', 'csv', 'pdf')),
    
    -- Export configuration
    modules TEXT[] DEFAULT '{}', -- Which modules to export
    date_range_start DATE,
    date_range_end DATE,
    include_deleted BOOLEAN DEFAULT FALSE,
    
    -- Export status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account deletion requests
CREATE TABLE public.account_deletions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Deletion request details
    reason TEXT,
    feedback TEXT,
    delete_immediately BOOLEAN DEFAULT FALSE,
    
    -- Data handling
    export_data_before_deletion BOOLEAN DEFAULT TRUE,
    anonymize_data BOOLEAN DEFAULT FALSE,
    
    -- Deletion status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    scheduled_deletion_date TIMESTAMPTZ,
    
    -- Metadata
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application settings (global)
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'object', 'array')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences (key-value store for flexible settings)
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    preference_type TEXT NOT NULL CHECK (preference_type IN ('string', 'number', 'boolean', 'object', 'array')),
    module TEXT, -- Which module this preference belongs to
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_themes_user_id ON public.user_themes(user_id);
CREATE INDEX idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX idx_user_integrations_type ON public.user_integrations(integration_type);
CREATE INDEX idx_privacy_settings_user_id ON public.privacy_settings(user_id);
CREATE INDEX idx_data_exports_user_id ON public.data_exports(user_id);
CREATE INDEX idx_data_exports_status ON public.data_exports(status);
CREATE INDEX idx_account_deletions_user_id ON public.account_deletions(user_id);
CREATE INDEX idx_account_deletions_status ON public.account_deletions(status);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_module ON public.user_preferences(module);

-- Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own theme settings" ON public.user_themes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification settings" ON public.notification_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own integrations" ON public.user_integrations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own privacy settings" ON public.privacy_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own data exports" ON public.data_exports
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own account deletion" ON public.account_deletions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Public app settings (read-only for users)
CREATE POLICY "Public app settings are viewable" ON public.app_settings
    FOR SELECT USING (is_public = true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_themes_updated_at BEFORE UPDATE ON public.user_themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON public.user_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON public.privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default app settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_version', '"1.0.0"', 'string', 'Current application version', true),
('maintenance_mode', 'false', 'boolean', 'Application maintenance mode', true),
('supported_languages', '["en", "ar", "dv"]', 'array', 'Supported application languages', true),
('supported_timezones', '["UTC", "Asia/Maldives", "Asia/Dubai", "America/New_York"]', 'array', 'Supported timezones', true),
('default_theme', '"light"', 'string', 'Default application theme', true),
('max_export_size_mb', '100', 'number', 'Maximum export file size in MB', false),
('data_retention_days', '365', 'number', 'Default data retention period', false);
