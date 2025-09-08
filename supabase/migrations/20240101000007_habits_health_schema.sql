-- Habits and Health Tracking Module Schema

-- Create custom types for habits and health
CREATE TYPE habit_cadence AS ENUM ('daily', 'weekly', 'monthly', 'custom');
CREATE TYPE health_log_type AS ENUM ('sleep', 'water', 'exercise', 'diet', 'mood', 'weight', 'blood_pressure', 'heart_rate', 'steps', 'calories');
CREATE TYPE reminder_type AS ENUM ('notification', 'email', 'sms');

-- Habits table
CREATE TABLE public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cadence habit_cadence NOT NULL DEFAULT 'daily',
    cadence_config JSONB DEFAULT '{}', -- For custom cadence rules
    target_value INTEGER DEFAULT 1, -- How many times per cadence period
    target_unit TEXT DEFAULT 'times', -- Unit of measurement
    color TEXT DEFAULT '#10B981',
    icon TEXT DEFAULT '✓',
    is_active BOOLEAN DEFAULT TRUE,
    reminders JSONB DEFAULT '[]', -- Array of reminder configurations
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit logs table for tracking check-ins
CREATE TABLE public.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    value INTEGER DEFAULT 1, -- How many times completed
    notes TEXT,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5), -- Optional mood after habit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one log per habit per day for daily habits
    UNIQUE(habit_id, DATE(logged_at AT TIME ZONE 'UTC'))
);

-- Health logs table for comprehensive health tracking
CREATE TABLE public.health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type health_log_type NOT NULL,
    value JSONB NOT NULL, -- Flexible data structure for different health metrics
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    notes TEXT,
    source TEXT DEFAULT 'manual', -- manual, google_fit, apple_health, etc.
    external_id TEXT, -- ID from external source for deduplication
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate imports from external sources
    UNIQUE(user_id, type, external_id, source) WHERE external_id IS NOT NULL
);

-- Health goals table for setting targets
CREATE TABLE public.health_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type health_log_type NOT NULL,
    target_value JSONB NOT NULL, -- Target values (e.g., {"hours": 8} for sleep)
    period TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One active goal per type per user
    UNIQUE(user_id, type) WHERE is_active = TRUE
);

-- Integration settings table for external health apps
CREATE TABLE public.health_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- google_fit, apple_health, fitbit, etc.
    is_enabled BOOLEAN DEFAULT TRUE,
    access_token TEXT, -- Encrypted access token
    refresh_token TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMPTZ,
    sync_settings JSONB DEFAULT '{}', -- What data types to sync
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, provider)
);

-- Create indexes for better performance
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habits_cadence ON public.habits(cadence);
CREATE INDEX idx_habits_is_active ON public.habits(is_active);

CREATE INDEX idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX idx_habit_logs_logged_at ON public.habit_logs(logged_at);
CREATE INDEX idx_habit_logs_date ON public.habit_logs(DATE(logged_at AT TIME ZONE 'UTC'));

CREATE INDEX idx_health_logs_user_id ON public.health_logs(user_id);
CREATE INDEX idx_health_logs_type ON public.health_logs(type);
CREATE INDEX idx_health_logs_start_time ON public.health_logs(start_time);
CREATE INDEX idx_health_logs_source ON public.health_logs(source);

CREATE INDEX idx_health_goals_user_id ON public.health_goals(user_id);
CREATE INDEX idx_health_goals_type ON public.health_goals(type);
CREATE INDEX idx_health_goals_is_active ON public.health_goals(is_active);

CREATE INDEX idx_health_integrations_user_id ON public.health_integrations(user_id);
CREATE INDEX idx_health_integrations_provider ON public.health_integrations(provider);

-- Add RLS policies
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_integrations ENABLE ROW LEVEL SECURITY;

-- Habits policies
CREATE POLICY "Users can view own habits" ON public.habits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON public.habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
    FOR DELETE USING (auth.uid() = user_id);

-- Habit logs policies
CREATE POLICY "Users can view own habit logs" ON public.habit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs" ON public.habit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs" ON public.habit_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs" ON public.habit_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Health logs policies
CREATE POLICY "Users can view own health logs" ON public.health_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health logs" ON public.health_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health logs" ON public.health_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health logs" ON public.health_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Health goals policies
CREATE POLICY "Users can manage own health goals" ON public.health_goals
    FOR ALL USING (auth.uid() = user_id);

-- Health integrations policies
CREATE POLICY "Users can manage own health integrations" ON public.health_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_logs_updated_at BEFORE UPDATE ON public.health_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_goals_updated_at BEFORE UPDATE ON public.health_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_integrations_updated_at BEFORE UPDATE ON public.health_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
