-- Notifications System Database Functions

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
    user_uuid UUID,
    notification_type_key TEXT,
    title_text TEXT,
    body_text TEXT,
    scheduled_time TIMESTAMPTZ DEFAULT NOW(),
    notification_data JSONB DEFAULT '{}',
    reference_type_param TEXT DEFAULT NULL,
    reference_id_param UUID DEFAULT NULL,
    repeat_pattern_param TEXT DEFAULT 'none',
    delivery_methods_param TEXT[] DEFAULT ARRAY['push']
)
RETURNS TABLE (
    notification_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    notification_type_record RECORD;
    new_notification_id UUID;
BEGIN
    -- Get notification type
    SELECT * INTO notification_type_record
    FROM public.notification_types
    WHERE type_key = notification_type_key AND is_active = true;

    IF notification_type_record IS NULL THEN
        RETURN QUERY
        SELECT 
            NULL::UUID,
            FALSE,
            'Invalid notification type'::TEXT;
        RETURN;
    END IF;

    -- Create notification
    INSERT INTO public.notifications (
        user_id,
        notification_type_id,
        title,
        body,
        data,
        scheduled_at,
        reference_type,
        reference_id,
        repeat_pattern,
        delivery_methods,
        is_reminder,
        reminder_type,
        priority
    ) VALUES (
        user_uuid,
        notification_type_record.id,
        title_text,
        body_text,
        notification_data,
        scheduled_time,
        reference_type_param,
        reference_id_param,
        repeat_pattern_param,
        delivery_methods_param,
        CASE WHEN reference_type_param IS NOT NULL THEN TRUE ELSE FALSE END,
        CASE 
            WHEN notification_type_key LIKE 'task_%' THEN 'task_due'
            WHEN notification_type_key LIKE 'habit_%' THEN 'habit_checkin'
            WHEN notification_type_key = 'salat_reminder' THEN 'salat_reminder'
            WHEN notification_type_key = 'azkar_alert' THEN 'azkar_alert'
            WHEN notification_type_key LIKE 'bill_%' THEN 'bill_due'
            WHEN notification_type_key LIKE 'medication_%' THEN 'medication'
            WHEN notification_type_key LIKE 'appointment_%' THEN 'appointment'
            ELSE NULL
        END,
        notification_type_record.priority
    ) RETURNING id INTO new_notification_id;

    RETURN QUERY
    SELECT 
        new_notification_id,
        TRUE,
        'Notification created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending notifications for processing
CREATE OR REPLACE FUNCTION public.get_pending_notifications(
    batch_size INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    body TEXT,
    data JSONB,
    scheduled_at TIMESTAMPTZ,
    delivery_methods TEXT[],
    priority TEXT,
    notification_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.title,
        n.body,
        n.data,
        n.scheduled_at,
        n.delivery_methods,
        n.priority,
        nt.type_key
    FROM public.notifications n
    JOIN public.notification_types nt ON n.notification_type_id = nt.id
    WHERE n.status = 'pending'
        AND n.scheduled_at <= NOW()
        AND (n.snooze_until IS NULL OR n.snooze_until <= NOW())
    ORDER BY n.priority DESC, n.scheduled_at ASC
    LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION public.mark_notification_sent(
    notification_uuid UUID,
    delivery_method_param TEXT,
    platform_param TEXT DEFAULT NULL,
    external_id_param TEXT DEFAULT NULL,
    response_data_param JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    notification_record RECORD;
BEGIN
    -- Get notification details
    SELECT * INTO notification_record
    FROM public.notifications
    WHERE id = notification_uuid;

    IF notification_record IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Update notification status
    UPDATE public.notifications
    SET 
        status = 'sent',
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = notification_uuid;

    -- Log delivery attempt
    INSERT INTO public.notification_logs (
        notification_id,
        user_id,
        delivery_method,
        platform,
        status,
        external_id,
        response_data,
        sent_at
    ) VALUES (
        notification_uuid,
        notification_record.user_id,
        delivery_method_param,
        platform_param,
        'sent',
        external_id_param,
        response_data_param,
        NOW()
    );

    -- Create next occurrence if repeating
    IF notification_record.repeat_pattern != 'none' THEN
        PERFORM create_next_occurrence(notification_uuid);
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create next occurrence of repeating notification
CREATE OR REPLACE FUNCTION public.create_next_occurrence(
    notification_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    notification_record RECORD;
    next_scheduled_time TIMESTAMPTZ;
BEGIN
    -- Get notification details
    SELECT * INTO notification_record
    FROM public.notifications
    WHERE id = notification_uuid;

    IF notification_record IS NULL OR notification_record.repeat_pattern = 'none' THEN
        RETURN FALSE;
    END IF;

    -- Calculate next scheduled time
    CASE notification_record.repeat_pattern
        WHEN 'daily' THEN
            next_scheduled_time := notification_record.scheduled_at + (notification_record.repeat_interval || ' days')::INTERVAL;
        WHEN 'weekly' THEN
            next_scheduled_time := notification_record.scheduled_at + (notification_record.repeat_interval || ' weeks')::INTERVAL;
        WHEN 'monthly' THEN
            next_scheduled_time := notification_record.scheduled_at + (notification_record.repeat_interval || ' months')::INTERVAL;
        WHEN 'yearly' THEN
            next_scheduled_time := notification_record.scheduled_at + (notification_record.repeat_interval || ' years')::INTERVAL;
        ELSE
            RETURN FALSE;
    END CASE;

    -- Check if we should create next occurrence
    IF notification_record.repeat_until IS NOT NULL AND next_scheduled_time > notification_record.repeat_until THEN
        RETURN FALSE;
    END IF;

    IF notification_record.repeat_count IS NOT NULL THEN
        -- Check if we've reached the repeat count
        DECLARE
            occurrence_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO occurrence_count
            FROM public.notifications
            WHERE reference_type = notification_record.reference_type
                AND reference_id = notification_record.reference_id
                AND notification_type_id = notification_record.notification_type_id
                AND user_id = notification_record.user_id;

            IF occurrence_count >= notification_record.repeat_count THEN
                RETURN FALSE;
            END IF;
        END;
    END IF;

    -- Create next occurrence
    INSERT INTO public.notifications (
        user_id,
        notification_type_id,
        title,
        body,
        data,
        scheduled_at,
        reference_type,
        reference_id,
        repeat_pattern,
        repeat_interval,
        repeat_days,
        repeat_until,
        repeat_count,
        delivery_methods,
        priority,
        is_reminder,
        reminder_type
    ) VALUES (
        notification_record.user_id,
        notification_record.notification_type_id,
        notification_record.title,
        notification_record.body,
        notification_record.data,
        next_scheduled_time,
        notification_record.reference_type,
        notification_record.reference_id,
        notification_record.repeat_pattern,
        notification_record.repeat_interval,
        notification_record.repeat_days,
        notification_record.repeat_until,
        notification_record.repeat_count,
        notification_record.delivery_methods,
        notification_record.priority,
        notification_record.is_reminder,
        notification_record.reminder_type
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to snooze notification
CREATE OR REPLACE FUNCTION public.snooze_notification(
    notification_uuid UUID,
    snooze_minutes INTEGER DEFAULT 10
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    snooze_until TIMESTAMPTZ
) AS $$
DECLARE
    notification_record RECORD;
    new_snooze_until TIMESTAMPTZ;
BEGIN
    -- Get notification details
    SELECT * INTO notification_record
    FROM public.notifications
    WHERE id = notification_uuid;

    IF notification_record IS NULL THEN
        RETURN QUERY
        SELECT 
            FALSE,
            'Notification not found'::TEXT,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Check snooze limit
    IF notification_record.snooze_count >= notification_record.max_snooze_count THEN
        RETURN QUERY
        SELECT 
            FALSE,
            'Maximum snooze limit reached'::TEXT,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Calculate snooze time
    new_snooze_until := NOW() + (snooze_minutes || ' minutes')::INTERVAL;

    -- Update notification
    UPDATE public.notifications
    SET 
        status = 'snoozed',
        snooze_until = new_snooze_until,
        snooze_count = snooze_count + 1,
        updated_at = NOW()
    WHERE id = notification_uuid;

    -- Log interaction
    INSERT INTO public.notification_interactions (
        notification_id,
        user_id,
        action_type,
        action_data
    ) VALUES (
        notification_uuid,
        notification_record.user_id,
        'snoozed',
        jsonb_build_object('snooze_minutes', snooze_minutes, 'snooze_until', new_snooze_until)
    );

    RETURN QUERY
    SELECT 
        TRUE,
        'Notification snoozed successfully'::TEXT,
        new_snooze_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's push tokens
CREATE OR REPLACE FUNCTION public.get_user_push_tokens(
    user_uuid UUID,
    platform_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    device_id TEXT,
    platform TEXT,
    token TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.device_id,
        pt.platform,
        pt.token
    FROM public.push_tokens pt
    WHERE pt.user_id = user_uuid
        AND pt.is_active = true
        AND (platform_filter IS NULL OR pt.platform = platform_filter)
    ORDER BY pt.last_used_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register push token
CREATE OR REPLACE FUNCTION public.register_push_token(
    user_uuid UUID,
    device_id_param TEXT,
    platform_param TEXT,
    token_param TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Upsert push token
    INSERT INTO public.push_tokens (
        user_id,
        device_id,
        platform,
        token,
        is_active,
        last_used_at
    ) VALUES (
        user_uuid,
        device_id_param,
        platform_param,
        token_param,
        true,
        NOW()
    )
    ON CONFLICT (user_id, device_id, platform)
    DO UPDATE SET
        token = EXCLUDED.token,
        is_active = true,
        last_used_at = NOW(),
        updated_at = NOW();

    RETURN QUERY
    SELECT 
        TRUE,
        'Push token registered successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION public.get_notification_stats(
    user_uuid UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_notifications INTEGER,
    sent_notifications INTEGER,
    clicked_notifications INTEGER,
    snoozed_notifications INTEGER,
    by_type JSONB,
    by_day JSONB
) AS $$
DECLARE
    start_date TIMESTAMPTZ;
    stats_record RECORD;
BEGIN
    start_date := NOW() - (days_back || ' days')::INTERVAL;

    -- Get overall stats
    SELECT 
        COUNT(*)::INTEGER as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END)::INTEGER as sent,
        COUNT(CASE WHEN id IN (
            SELECT notification_id FROM public.notification_interactions 
            WHERE action_type = 'clicked' AND user_id = user_uuid
        ) THEN 1 END)::INTEGER as clicked,
        COUNT(CASE WHEN status = 'snoozed' THEN 1 END)::INTEGER as snoozed
    INTO stats_record
    FROM public.notifications
    WHERE user_id = user_uuid
        AND created_at >= start_date;

    RETURN QUERY
    WITH type_stats AS (
        SELECT jsonb_object_agg(
            nt.type_key,
            jsonb_build_object(
                'count', COUNT(n.id),
                'sent', COUNT(CASE WHEN n.status = 'sent' THEN 1 END)
            )
        ) as by_type_data
        FROM public.notifications n
        JOIN public.notification_types nt ON n.notification_type_id = nt.id
        WHERE n.user_id = user_uuid
            AND n.created_at >= start_date
        GROUP BY nt.type_key
    ),
    day_stats AS (
        SELECT jsonb_object_agg(
            DATE(created_at),
            COUNT(*)
        ) as by_day_data
        FROM public.notifications
        WHERE user_id = user_uuid
            AND created_at >= start_date
        GROUP BY DATE(created_at)
    )
    SELECT 
        stats_record.total,
        stats_record.sent,
        stats_record.clicked,
        stats_record.snoozed,
        COALESCE(ts.by_type_data, '{}'::jsonb),
        COALESCE(ds.by_day_data, '{}'::jsonb)
    FROM type_stats ts
    CROSS JOIN day_stats ds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(
    days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;

    -- Delete old notifications and their logs
    WITH deleted_notifications AS (
        DELETE FROM public.notifications
        WHERE created_at < cutoff_date
            AND status IN ('sent', 'failed', 'cancelled')
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_notifications;

    -- Delete orphaned logs
    DELETE FROM public.notification_logs
    WHERE created_at < cutoff_date
        AND notification_id NOT IN (SELECT id FROM public.notifications);

    -- Delete old interactions
    DELETE FROM public.notification_interactions
    WHERE created_at < cutoff_date;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel notification
CREATE OR REPLACE FUNCTION public.cancel_notification(
    notification_uuid UUID,
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notifications
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = notification_uuid
        AND user_id = user_uuid
        AND status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
