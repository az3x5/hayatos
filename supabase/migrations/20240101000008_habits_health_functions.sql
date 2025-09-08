-- Database functions for Habits and Health tracking

-- Function to calculate habit streak
CREATE OR REPLACE FUNCTION public.calculate_habit_streak(
    habit_uuid UUID,
    user_uuid UUID,
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    current_streak INTEGER,
    longest_streak INTEGER,
    total_completions INTEGER,
    completion_rate DECIMAL
) AS $$
DECLARE
    habit_cadence TEXT;
    streak_count INTEGER := 0;
    max_streak INTEGER := 0;
    temp_streak INTEGER := 0;
    total_days INTEGER := 0;
    completed_days INTEGER := 0;
    check_date DATE;
    days_back INTEGER := 365; -- Check last year
BEGIN
    -- Get habit cadence
    SELECT h.cadence INTO habit_cadence
    FROM public.habits h
    WHERE h.id = habit_uuid AND h.user_id = user_uuid;
    
    IF habit_cadence IS NULL THEN
        RETURN QUERY SELECT 0, 0, 0, 0.0;
        RETURN;
    END IF;
    
    -- Calculate streaks for daily habits
    IF habit_cadence = 'daily' THEN
        check_date := end_date;
        
        -- Count current streak (going backwards from end_date)
        WHILE check_date >= (end_date - days_back) LOOP
            IF EXISTS (
                SELECT 1 FROM public.habit_logs hl
                WHERE hl.habit_id = habit_uuid
                    AND hl.user_id = user_uuid
                    AND DATE(hl.logged_at AT TIME ZONE 'UTC') = check_date
            ) THEN
                IF check_date = end_date OR streak_count > 0 THEN
                    streak_count := streak_count + 1;
                END IF;
                temp_streak := temp_streak + 1;
                completed_days := completed_days + 1;
            ELSE
                IF check_date = end_date THEN
                    streak_count := 0;
                END IF;
                max_streak := GREATEST(max_streak, temp_streak);
                temp_streak := 0;
            END IF;
            
            total_days := total_days + 1;
            check_date := check_date - 1;
        END LOOP;
        
        max_streak := GREATEST(max_streak, temp_streak);
        max_streak := GREATEST(max_streak, streak_count);
    END IF;
    
    -- Calculate completion rate
    DECLARE
        completion_rate_calc DECIMAL := 0.0;
    BEGIN
        IF total_days > 0 THEN
            completion_rate_calc := (completed_days::DECIMAL / total_days::DECIMAL) * 100;
        END IF;
        
        RETURN QUERY SELECT 
            streak_count,
            max_streak,
            completed_days,
            completion_rate_calc;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get habit completion data for heatmap
CREATE OR REPLACE FUNCTION public.get_habit_heatmap_data(
    habit_uuid UUID,
    user_uuid UUID,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '365 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    completed BOOLEAN,
    value INTEGER,
    target INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(start_date, end_date, '1 day'::interval)::date as date
    ),
    habit_info AS (
        SELECT h.target_value
        FROM public.habits h
        WHERE h.id = habit_uuid AND h.user_id = user_uuid
    ),
    completions AS (
        SELECT 
            DATE(hl.logged_at AT TIME ZONE 'UTC') as log_date,
            SUM(hl.value) as total_value
        FROM public.habit_logs hl
        WHERE hl.habit_id = habit_uuid
            AND hl.user_id = user_uuid
            AND DATE(hl.logged_at AT TIME ZONE 'UTC') BETWEEN start_date AND end_date
        GROUP BY DATE(hl.logged_at AT TIME ZONE 'UTC')
    )
    SELECT 
        ds.date,
        COALESCE(c.total_value >= hi.target_value, false) as completed,
        COALESCE(c.total_value, 0) as value,
        hi.target_value as target
    FROM date_series ds
    CROSS JOIN habit_info hi
    LEFT JOIN completions c ON ds.date = c.log_date
    ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get health trends
CREATE OR REPLACE FUNCTION public.get_health_trends(
    user_uuid UUID,
    log_type health_log_type,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    avg_value DECIMAL,
    min_value DECIMAL,
    max_value DECIMAL,
    count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(hl.start_time AT TIME ZONE 'UTC') as date,
        AVG((hl.value->>'value')::DECIMAL) as avg_value,
        MIN((hl.value->>'value')::DECIMAL) as min_value,
        MAX((hl.value->>'value')::DECIMAL) as max_value,
        COUNT(*)::INTEGER as count
    FROM public.health_logs hl
    WHERE hl.user_id = user_uuid
        AND hl.type = log_type
        AND DATE(hl.start_time AT TIME ZONE 'UTC') BETWEEN start_date AND end_date
        AND hl.value ? 'value'
    GROUP BY DATE(hl.start_time AT TIME ZONE 'UTC')
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's habit and health summary
CREATE OR REPLACE FUNCTION public.get_user_wellness_summary(user_uuid UUID)
RETURNS TABLE (
    total_habits INTEGER,
    active_habits INTEGER,
    habits_completed_today INTEGER,
    current_avg_streak DECIMAL,
    health_logs_this_week INTEGER,
    last_health_log TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH habit_stats AS (
        SELECT 
            COUNT(*)::INTEGER as total_habits,
            COUNT(CASE WHEN is_active THEN 1 END)::INTEGER as active_habits
        FROM public.habits h
        WHERE h.user_id = user_uuid
    ),
    today_completions AS (
        SELECT COUNT(DISTINCT hl.habit_id)::INTEGER as completed_today
        FROM public.habit_logs hl
        JOIN public.habits h ON hl.habit_id = h.id
        WHERE hl.user_id = user_uuid
            AND h.is_active = true
            AND DATE(hl.logged_at AT TIME ZONE 'UTC') = CURRENT_DATE
    ),
    streak_stats AS (
        SELECT AVG(
            (SELECT current_streak FROM public.calculate_habit_streak(h.id, user_uuid))
        ) as avg_streak
        FROM public.habits h
        WHERE h.user_id = user_uuid AND h.is_active = true
    ),
    health_stats AS (
        SELECT 
            COUNT(*)::INTEGER as logs_this_week,
            MAX(hl.created_at) as last_log
        FROM public.health_logs hl
        WHERE hl.user_id = user_uuid
            AND hl.start_time >= CURRENT_DATE - INTERVAL '7 days'
    )
    SELECT 
        hs.total_habits,
        hs.active_habits,
        tc.completed_today,
        COALESCE(ss.avg_streak, 0)::DECIMAL,
        hst.logs_this_week,
        hst.last_log
    FROM habit_stats hs
    CROSS JOIN today_completions tc
    CROSS JOIN streak_stats ss
    CROSS JOIN health_stats hst;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if habit is due today
CREATE OR REPLACE FUNCTION public.is_habit_due_today(
    habit_uuid UUID,
    user_uuid UUID,
    check_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    habit_cadence TEXT;
    cadence_config JSONB;
    is_due BOOLEAN := false;
BEGIN
    -- Get habit details
    SELECT h.cadence, h.cadence_config
    INTO habit_cadence, cadence_config
    FROM public.habits h
    WHERE h.id = habit_uuid AND h.user_id = user_uuid AND h.is_active = true;
    
    IF habit_cadence IS NULL THEN
        RETURN false;
    END IF;
    
    CASE habit_cadence
        WHEN 'daily' THEN
            is_due := true;
        WHEN 'weekly' THEN
            -- Check if today matches the configured day of week
            IF cadence_config ? 'days_of_week' THEN
                is_due := (EXTRACT(DOW FROM check_date)::INTEGER = ANY(
                    SELECT jsonb_array_elements_text(cadence_config->'days_of_week')::INTEGER
                ));
            ELSE
                is_due := true; -- Default to any day if not configured
            END IF;
        WHEN 'monthly' THEN
            -- Check if today matches the configured day of month
            IF cadence_config ? 'day_of_month' THEN
                is_due := EXTRACT(DAY FROM check_date)::INTEGER = (cadence_config->>'day_of_month')::INTEGER;
            ELSE
                is_due := EXTRACT(DAY FROM check_date)::INTEGER = 1; -- Default to 1st of month
            END IF;
        WHEN 'custom' THEN
            -- Custom logic based on cadence_config
            is_due := true; -- Simplified for now
    END CASE;
    
    RETURN is_due;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get habits due today
CREATE OR REPLACE FUNCTION public.get_habits_due_today(user_uuid UUID)
RETURNS TABLE (
    habit_id UUID,
    title TEXT,
    description TEXT,
    target_value INTEGER,
    target_unit TEXT,
    color TEXT,
    icon TEXT,
    is_completed BOOLEAN,
    current_value INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.title,
        h.description,
        h.target_value,
        h.target_unit,
        h.color,
        h.icon,
        EXISTS(
            SELECT 1 FROM public.habit_logs hl
            WHERE hl.habit_id = h.id
                AND hl.user_id = user_uuid
                AND DATE(hl.logged_at AT TIME ZONE 'UTC') = CURRENT_DATE
                AND hl.value >= h.target_value
        ) as is_completed,
        COALESCE((
            SELECT SUM(hl.value)
            FROM public.habit_logs hl
            WHERE hl.habit_id = h.id
                AND hl.user_id = user_uuid
                AND DATE(hl.logged_at AT TIME ZONE 'UTC') = CURRENT_DATE
        ), 0)::INTEGER as current_value
    FROM public.habits h
    WHERE h.user_id = user_uuid
        AND h.is_active = true
        AND public.is_habit_due_today(h.id, user_uuid)
    ORDER BY h.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
