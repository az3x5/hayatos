-- Settings Module Database Functions

-- Function to get complete user settings
CREATE OR REPLACE FUNCTION public.get_user_settings(user_uuid UUID)
RETURNS TABLE (
    profile JSONB,
    theme JSONB,
    notifications JSONB,
    privacy JSONB,
    integrations JSONB,
    preferences JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_profile AS (
        SELECT to_jsonb(up.*) as profile_data
        FROM public.user_profiles up
        WHERE up.user_id = user_uuid
    ),
    user_theme AS (
        SELECT to_jsonb(ut.*) as theme_data
        FROM public.user_themes ut
        WHERE ut.user_id = user_uuid
    ),
    user_notifications AS (
        SELECT to_jsonb(ns.*) as notification_data
        FROM public.notification_settings ns
        WHERE ns.user_id = user_uuid
    ),
    user_privacy AS (
        SELECT to_jsonb(ps.*) as privacy_data
        FROM public.privacy_settings ps
        WHERE ps.user_id = user_uuid
    ),
    user_integrations AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ui.id,
                'integration_type', ui.integration_type,
                'integration_name', ui.integration_name,
                'is_enabled', ui.is_enabled,
                'sync_frequency', ui.sync_frequency,
                'sync_enabled', ui.sync_enabled,
                'last_sync_at', ui.last_sync_at,
                'sync_status', ui.sync_status,
                'settings', ui.settings,
                'created_at', ui.created_at,
                'updated_at', ui.updated_at
            )
        ) as integrations_data
        FROM public.user_integrations ui
        WHERE ui.user_id = user_uuid
    ),
    user_preferences AS (
        SELECT jsonb_object_agg(
            up.preference_key,
            jsonb_build_object(
                'value', up.preference_value,
                'type', up.preference_type,
                'module', up.module
            )
        ) as preferences_data
        FROM public.user_preferences up
        WHERE up.user_id = user_uuid
    )
    SELECT 
        COALESCE(up.profile_data, '{}'::jsonb),
        COALESCE(ut.theme_data, '{}'::jsonb),
        COALESCE(un.notification_data, '{}'::jsonb),
        COALESCE(upr.privacy_data, '{}'::jsonb),
        COALESCE(ui.integrations_data, '[]'::jsonb),
        COALESCE(upref.preferences_data, '{}'::jsonb)
    FROM user_profile up
    FULL OUTER JOIN user_theme ut ON true
    FULL OUTER JOIN user_notifications un ON true
    FULL OUTER JOIN user_privacy upr ON true
    FULL OUTER JOIN user_integrations ui ON true
    FULL OUTER JOIN user_preferences upref ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize default user settings
CREATE OR REPLACE FUNCTION public.initialize_user_settings(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert default profile if not exists
    INSERT INTO public.user_profiles (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert default theme if not exists
    INSERT INTO public.user_themes (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert default notification settings if not exists
    INSERT INTO public.notification_settings (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert default privacy settings if not exists
    INSERT INTO public.privacy_settings (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user data
CREATE OR REPLACE FUNCTION public.export_user_data(
    user_uuid UUID,
    export_format TEXT DEFAULT 'json',
    modules TEXT[] DEFAULT ARRAY['all'],
    include_deleted BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    export_id UUID,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    new_export_id UUID;
BEGIN
    -- Create export record
    INSERT INTO public.data_exports (
        user_id,
        export_type,
        export_format,
        modules,
        include_deleted,
        status
    ) VALUES (
        user_uuid,
        CASE WHEN 'all' = ANY(modules) THEN 'full' ELSE 'partial' END,
        export_format,
        modules,
        include_deleted,
        'pending'
    ) RETURNING id INTO new_export_id;

    RETURN QUERY
    SELECT 
        new_export_id,
        'pending'::TEXT,
        'Export request created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user export history
CREATE OR REPLACE FUNCTION public.get_user_exports(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    export_type TEXT,
    export_format TEXT,
    modules TEXT[],
    status TEXT,
    file_url TEXT,
    file_size BIGINT,
    requested_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.export_type,
        de.export_format,
        de.modules,
        de.status,
        de.file_url,
        de.file_size,
        de.requested_at,
        de.completed_at,
        de.expires_at
    FROM public.data_exports de
    WHERE de.user_id = user_uuid
    ORDER BY de.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request account deletion
CREATE OR REPLACE FUNCTION public.request_account_deletion(
    user_uuid UUID,
    deletion_reason TEXT DEFAULT NULL,
    user_feedback TEXT DEFAULT NULL,
    delete_immediately BOOLEAN DEFAULT FALSE,
    export_data BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    deletion_id UUID,
    scheduled_date TIMESTAMPTZ,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    new_deletion_id UUID;
    scheduled_deletion_date TIMESTAMPTZ;
BEGIN
    -- Calculate scheduled deletion date (30 days from now unless immediate)
    IF delete_immediately THEN
        scheduled_deletion_date := NOW() + INTERVAL '1 day';
    ELSE
        scheduled_deletion_date := NOW() + INTERVAL '30 days';
    END IF;

    -- Create deletion request
    INSERT INTO public.account_deletions (
        user_id,
        reason,
        feedback,
        delete_immediately,
        export_data_before_deletion,
        scheduled_deletion_date,
        status
    ) VALUES (
        user_uuid,
        deletion_reason,
        user_feedback,
        delete_immediately,
        export_data,
        scheduled_deletion_date,
        'pending'
    ) RETURNING id INTO new_deletion_id;

    RETURN QUERY
    SELECT 
        new_deletion_id,
        scheduled_deletion_date,
        'pending'::TEXT,
        CASE 
            WHEN delete_immediately THEN 'Account deletion scheduled for tomorrow'
            ELSE 'Account deletion scheduled for 30 days from now'
        END::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel account deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion(user_uuid UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    deletion_record RECORD;
BEGIN
    -- Find pending deletion request
    SELECT * INTO deletion_record
    FROM public.account_deletions
    WHERE user_id = user_uuid 
        AND status = 'pending'
        AND scheduled_deletion_date > NOW()
    ORDER BY requested_at DESC
    LIMIT 1;

    IF deletion_record IS NULL THEN
        RETURN QUERY
        SELECT 
            FALSE,
            'No pending deletion request found'::TEXT;
        RETURN;
    END IF;

    -- Cancel the deletion
    UPDATE public.account_deletions
    SET 
        status = 'cancelled',
        cancelled_at = NOW()
    WHERE id = deletion_record.id;

    RETURN QUERY
    SELECT 
        TRUE,
        'Account deletion cancelled successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync integration data
CREATE OR REPLACE FUNCTION public.sync_integration(
    user_uuid UUID,
    integration_type_param TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    last_sync TIMESTAMPTZ
) AS $$
DECLARE
    integration_record RECORD;
    sync_timestamp TIMESTAMPTZ;
BEGIN
    sync_timestamp := NOW();

    -- Find the integration
    SELECT * INTO integration_record
    FROM public.user_integrations
    WHERE user_id = user_uuid 
        AND integration_type = integration_type_param
        AND is_enabled = TRUE;

    IF integration_record IS NULL THEN
        RETURN QUERY
        SELECT 
            FALSE,
            'Integration not found or disabled'::TEXT,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Update sync status
    UPDATE public.user_integrations
    SET 
        sync_status = 'syncing',
        last_sync_at = sync_timestamp
    WHERE id = integration_record.id;

    -- Here you would implement actual sync logic
    -- For now, we'll just mark it as successful
    UPDATE public.user_integrations
    SET 
        sync_status = 'success',
        sync_error = NULL
    WHERE id = integration_record.id;

    RETURN QUERY
    SELECT 
        TRUE,
        'Integration synced successfully'::TEXT,
        sync_timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get app settings
CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS TABLE (
    setting_key TEXT,
    setting_value JSONB,
    setting_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aps.setting_key,
        aps.setting_value,
        aps.setting_type
    FROM public.app_settings aps
    WHERE aps.is_public = TRUE
    ORDER BY aps.setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user preference
CREATE OR REPLACE FUNCTION public.update_user_preference(
    user_uuid UUID,
    pref_key TEXT,
    pref_value JSONB,
    pref_type TEXT DEFAULT 'string',
    pref_module TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    INSERT INTO public.user_preferences (
        user_id,
        preference_key,
        preference_value,
        preference_type,
        module
    ) VALUES (
        user_uuid,
        pref_key,
        pref_value,
        pref_type,
        pref_module
    )
    ON CONFLICT (user_id, preference_key)
    DO UPDATE SET
        preference_value = EXCLUDED.preference_value,
        preference_type = EXCLUDED.preference_type,
        module = EXCLUDED.module,
        updated_at = NOW();

    RETURN QUERY
    SELECT 
        TRUE,
        'Preference updated successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get integration status
CREATE OR REPLACE FUNCTION public.get_integration_status(user_uuid UUID)
RETURNS TABLE (
    integration_type TEXT,
    integration_name TEXT,
    is_enabled BOOLEAN,
    sync_status TEXT,
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.integration_type,
        ui.integration_name,
        ui.is_enabled,
        ui.sync_status,
        ui.last_sync_at,
        ui.sync_error
    FROM public.user_integrations ui
    WHERE ui.user_id = user_uuid
    ORDER BY ui.integration_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired exports
CREATE OR REPLACE FUNCTION public.cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.data_exports
    WHERE expires_at < NOW()
        AND status = 'completed';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process pending account deletions
CREATE OR REPLACE FUNCTION public.process_pending_deletions()
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    deletion_record RECORD;
BEGIN
    FOR deletion_record IN
        SELECT * FROM public.account_deletions
        WHERE status = 'pending'
            AND scheduled_deletion_date <= NOW()
    LOOP
        -- Mark as processing
        UPDATE public.account_deletions
        SET status = 'processing', processed_at = NOW()
        WHERE id = deletion_record.id;

        -- Here you would implement actual account deletion logic
        -- For now, we'll just mark as completed
        UPDATE public.account_deletions
        SET status = 'completed'
        WHERE id = deletion_record.id;

        processed_count := processed_count + 1;
    END LOOP;

    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
