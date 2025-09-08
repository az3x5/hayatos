-- Notifications System Database Schema

-- Push notification device tokens
CREATE TABLE public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
    token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id, platform)
);

-- Notification templates and types
CREATE TABLE public.notification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('task', 'habit', 'faith', 'finance', 'health', 'system')),
    default_title TEXT NOT NULL,
    default_body TEXT NOT NULL,
    icon TEXT,
    sound TEXT DEFAULT 'default',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notifications and reminders
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type_id UUID NOT NULL REFERENCES public.notification_types(id),
    
    -- Content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'snoozed')),
    
    -- Reminder settings
    is_reminder BOOLEAN DEFAULT FALSE,
    reminder_type TEXT CHECK (reminder_type IN ('task_due', 'habit_checkin', 'salat_reminder', 'azkar_alert', 'bill_due', 'appointment', 'medication')),
    
    -- Reference to source entity
    reference_type TEXT CHECK (reference_type IN ('task', 'habit', 'salat', 'azkar', 'transaction', 'appointment', 'medication')),
    reference_id UUID,
    
    -- Repeat settings
    repeat_pattern TEXT CHECK (repeat_pattern IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom')),
    repeat_interval INTEGER DEFAULT 1,
    repeat_days INTEGER[], -- Days of week (1-7) for weekly repeats
    repeat_until TIMESTAMPTZ,
    repeat_count INTEGER,
    
    -- Snooze settings
    snooze_until TIMESTAMPTZ,
    snooze_count INTEGER DEFAULT 0,
    max_snooze_count INTEGER DEFAULT 3,
    
    -- Delivery settings
    delivery_methods TEXT[] DEFAULT ARRAY['push'], -- push, email, sms
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification delivery logs
CREATE TABLE public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Delivery details
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('push', 'email', 'sms')),
    platform TEXT CHECK (platform IN ('web', 'android', 'ios')),
    device_token TEXT,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked', 'dismissed')),
    
    -- Response details
    external_id TEXT, -- FCM/APNs message ID
    response_data JSONB,
    error_message TEXT,
    
    -- Timing
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notification preferences (extends notification_settings)
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type_id UUID NOT NULL REFERENCES public.notification_types(id),
    
    -- Preference settings
    is_enabled BOOLEAN DEFAULT TRUE,
    delivery_methods TEXT[] DEFAULT ARRAY['push'],
    sound TEXT DEFAULT 'default',
    vibration BOOLEAN DEFAULT TRUE,
    
    -- Timing preferences
    advance_minutes INTEGER DEFAULT 0, -- How many minutes before event
    quiet_hours_override BOOLEAN DEFAULT FALSE,
    
    -- Repeat preferences
    max_repeats INTEGER DEFAULT 1,
    repeat_interval_minutes INTEGER DEFAULT 5,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type_id)
);

-- Notification actions (for interactive notifications)
CREATE TABLE public.notification_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type_id UUID NOT NULL REFERENCES public.notification_types(id),
    action_key TEXT NOT NULL,
    label TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('button', 'input', 'quick_reply')),
    icon TEXT,
    is_destructive BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notification_type_id, action_key)
);

-- User interactions with notifications
CREATE TABLE public.notification_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Interaction details
    action_type TEXT NOT NULL CHECK (action_type IN ('viewed', 'clicked', 'dismissed', 'snoozed', 'completed', 'custom')),
    action_key TEXT, -- For custom actions
    action_data JSONB,
    
    -- Timing
    interacted_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification batches (for bulk operations)
CREATE TABLE public.notification_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    notification_type_id UUID NOT NULL REFERENCES public.notification_types(id),
    
    -- Batch settings
    total_notifications INTEGER DEFAULT 0,
    sent_notifications INTEGER DEFAULT 0,
    failed_notifications INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Timing
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_scheduled_at ON public.notifications(scheduled_at);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_reminder_type ON public.notifications(reminder_type);
CREATE INDEX idx_notifications_reference ON public.notifications(reference_type, reference_id);
CREATE INDEX idx_notifications_repeat_pattern ON public.notifications(repeat_pattern);

CREATE INDEX idx_notification_logs_notification_id ON public.notification_logs(notification_id);
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at);

CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX idx_push_tokens_platform ON public.push_tokens(platform);
CREATE INDEX idx_push_tokens_active ON public.push_tokens(is_active);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_interactions_notification_id ON public.notification_interactions(notification_id);
CREATE INDEX idx_notification_interactions_user_id ON public.notification_interactions(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own push tokens" ON public.push_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification logs" ON public.notification_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification interactions" ON public.notification_interactions
    FOR ALL USING (auth.uid() = user_id);

-- Public read access for notification types and actions
CREATE POLICY "Notification types are publicly readable" ON public.notification_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Notification actions are publicly readable" ON public.notification_actions
    FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification types
INSERT INTO public.notification_types (type_key, name, description, category, default_title, default_body, icon, priority) VALUES
-- Task notifications
('task_due', 'Task Due', 'Task deadline reminder', 'task', 'Task Due Soon', 'You have a task due: {task_title}', '📋', 'normal'),
('task_overdue', 'Task Overdue', 'Overdue task notification', 'task', 'Task Overdue', 'Task is overdue: {task_title}', '⚠️', 'high'),
('task_completed', 'Task Completed', 'Task completion confirmation', 'task', 'Task Completed', 'Great job! You completed: {task_title}', '✅', 'low'),

-- Habit notifications
('habit_checkin', 'Habit Check-in', 'Daily habit reminder', 'habit', 'Time for Your Habit', 'Don''t forget: {habit_name}', '🔄', 'normal'),
('habit_streak', 'Habit Streak', 'Habit streak milestone', 'habit', 'Habit Streak!', 'Amazing! {streak_days} day streak for {habit_name}', '🔥', 'normal'),
('habit_missed', 'Habit Missed', 'Missed habit notification', 'habit', 'Habit Missed', 'You missed your habit: {habit_name}', '😔', 'low'),

-- Faith notifications
('salat_reminder', 'Salat Reminder', 'Prayer time reminder', 'faith', 'Prayer Time', 'Time for {prayer_name} prayer', '🕌', 'high'),
('azkar_alert', 'Azkar Alert', 'Dhikr and remembrance reminder', 'faith', 'Time for Azkar', 'Remember Allah: {azkar_title}', '📿', 'normal'),
('quran_reading', 'Quran Reading', 'Daily Quran reading reminder', 'faith', 'Quran Reading Time', 'Continue your Quran reading journey', '📖', 'normal'),

-- Finance notifications
('bill_due', 'Bill Due', 'Bill payment reminder', 'finance', 'Bill Due Soon', 'Bill due: {bill_name} - ${amount}', '💳', 'high'),
('budget_alert', 'Budget Alert', 'Budget limit notification', 'finance', 'Budget Alert', 'You''ve reached {percentage}% of your {category} budget', '💰', 'normal'),
('expense_reminder', 'Expense Reminder', 'Expense tracking reminder', 'finance', 'Log Your Expenses', 'Don''t forget to log today''s expenses', '📊', 'low'),

-- Health notifications
('medication_reminder', 'Medication Reminder', 'Medication time reminder', 'health', 'Medication Time', 'Time to take: {medication_name}', '💊', 'urgent'),
('appointment_reminder', 'Appointment Reminder', 'Medical appointment reminder', 'health', 'Appointment Reminder', 'Appointment with {doctor_name} at {time}', '🏥', 'high'),
('health_checkin', 'Health Check-in', 'Daily health metrics reminder', 'health', 'Health Check-in', 'Time to log your health metrics', '📈', 'normal'),

-- System notifications
('welcome', 'Welcome', 'Welcome new user', 'system', 'Welcome to HayatOS!', 'Start your journey to a better life', '🎉', 'normal'),
('backup_reminder', 'Backup Reminder', 'Data backup reminder', 'system', 'Backup Your Data', 'Consider backing up your important data', '💾', 'low'),
('update_available', 'Update Available', 'App update notification', 'system', 'Update Available', 'A new version of HayatOS is available', '🔄', 'normal');
