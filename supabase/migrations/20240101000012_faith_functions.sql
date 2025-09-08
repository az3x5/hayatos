-- Faith Module Database Functions

-- Function to calculate salat streak
CREATE OR REPLACE FUNCTION public.calculate_salat_streak(
    user_uuid UUID,
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    current_streak INTEGER,
    longest_streak INTEGER,
    total_prayers INTEGER,
    completion_rate DECIMAL
) AS $$
DECLARE
    current_streak_count INTEGER := 0;
    longest_streak_count INTEGER := 0;
    temp_streak INTEGER := 0;
    total_days INTEGER := 0;
    completed_days INTEGER := 0;
    check_date DATE;
BEGIN
    -- Calculate current streak (working backwards from end_date)
    check_date := end_date;
    WHILE check_date >= (end_date - INTERVAL '365 days')::DATE LOOP
        -- Check if all 5 prayers were completed on this date
        IF (
            SELECT COUNT(*) 
            FROM public.salat_logs 
            WHERE user_id = user_uuid 
                AND prayer_date = check_date 
                AND status = 'completed'
        ) = 5 THEN
            current_streak_count := current_streak_count + 1;
        ELSE
            EXIT; -- Break streak
        END IF;
        check_date := check_date - 1;
    END LOOP;

    -- Calculate longest streak and completion rate
    FOR check_date IN 
        SELECT DISTINCT prayer_date 
        FROM public.salat_logs 
        WHERE user_id = user_uuid 
            AND prayer_date >= (end_date - INTERVAL '365 days')::DATE
        ORDER BY prayer_date
    LOOP
        total_days := total_days + 1;
        
        -- Check if all 5 prayers were completed on this date
        IF (
            SELECT COUNT(*) 
            FROM public.salat_logs 
            WHERE user_id = user_uuid 
                AND prayer_date = check_date 
                AND status = 'completed'
        ) = 5 THEN
            temp_streak := temp_streak + 1;
            completed_days := completed_days + 1;
            longest_streak_count := GREATEST(longest_streak_count, temp_streak);
        ELSE
            temp_streak := 0;
        END IF;
    END LOOP;

    -- Get total prayer count
    SELECT COUNT(*) INTO total_prayers
    FROM public.salat_logs
    WHERE user_id = user_uuid
        AND prayer_date >= (end_date - INTERVAL '365 days')::DATE;

    RETURN QUERY SELECT 
        current_streak_count,
        longest_streak_count,
        total_prayers::INTEGER,
        CASE 
            WHEN total_days > 0 THEN (completed_days::DECIMAL / total_days * 100)
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily salat status
CREATE OR REPLACE FUNCTION public.get_daily_salat_status(
    user_uuid UUID,
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    prayer_name prayer_name,
    status prayer_status,
    is_congregation BOOLEAN,
    logged_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH all_prayers AS (
        SELECT unnest(ARRAY['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']::prayer_name[]) as prayer
    )
    SELECT 
        ap.prayer as prayer_name,
        COALESCE(sl.status, 'missed'::prayer_status) as status,
        COALESCE(sl.is_congregation, false) as is_congregation,
        sl.logged_at
    FROM all_prayers ap
    LEFT JOIN public.salat_logs sl ON (
        sl.user_id = user_uuid 
        AND sl.prayer_date = target_date 
        AND sl.prayer_name = ap.prayer
    )
    ORDER BY 
        CASE ap.prayer
            WHEN 'fajr' THEN 1
            WHEN 'dhuhr' THEN 2
            WHEN 'asr' THEN 3
            WHEN 'maghrib' THEN 4
            WHEN 'isha' THEN 5
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Quran reading progress
CREATE OR REPLACE FUNCTION public.get_quran_reading_progress(
    user_uuid UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_sessions INTEGER,
    total_minutes INTEGER,
    unique_surahs INTEGER,
    verses_read INTEGER,
    avg_session_duration DECIMAL,
    reading_streak INTEGER
) AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE;
BEGIN
    -- Calculate reading streak
    check_date := CURRENT_DATE;
    WHILE check_date >= (CURRENT_DATE - INTERVAL '365 days')::DATE LOOP
        IF EXISTS (
            SELECT 1 
            FROM public.quran_reading_sessions 
            WHERE user_id = user_uuid 
                AND session_date = check_date
        ) THEN
            streak_count := streak_count + 1;
        ELSE
            EXIT;
        END IF;
        check_date := check_date - 1;
    END LOOP;

    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sessions,
        COALESCE(SUM(duration_minutes), 0)::INTEGER as total_minutes,
        COUNT(DISTINCT surah_id)::INTEGER as unique_surahs,
        COALESCE(SUM(end_verse - start_verse + 1), 0)::INTEGER as verses_read,
        CASE 
            WHEN COUNT(*) > 0 THEN AVG(duration_minutes)
            ELSE 0
        END as avg_session_duration,
        streak_count as reading_streak
    FROM public.quran_reading_sessions
    WHERE user_id = user_uuid
        AND session_date >= (CURRENT_DATE - days_back);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly salat statistics
CREATE OR REPLACE FUNCTION public.get_monthly_salat_stats(
    user_uuid UUID,
    target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE
)
RETURNS TABLE (
    prayer_name prayer_name,
    total_days INTEGER,
    completed_count INTEGER,
    missed_count INTEGER,
    qada_count INTEGER,
    completion_rate DECIMAL,
    congregation_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH month_days AS (
        SELECT generate_series(
            target_month,
            (target_month + INTERVAL '1 month - 1 day')::DATE,
            '1 day'::INTERVAL
        )::DATE as day
    ),
    prayer_stats AS (
        SELECT 
            sl.prayer_name,
            COUNT(*) as total_logged,
            COUNT(*) FILTER (WHERE sl.status = 'completed') as completed,
            COUNT(*) FILTER (WHERE sl.status = 'missed') as missed,
            COUNT(*) FILTER (WHERE sl.status = 'qada') as qada,
            COUNT(*) FILTER (WHERE sl.is_congregation = true) as congregation
        FROM public.salat_logs sl
        WHERE sl.user_id = user_uuid
            AND sl.prayer_date >= target_month
            AND sl.prayer_date < (target_month + INTERVAL '1 month')::DATE
        GROUP BY sl.prayer_name
    )
    SELECT 
        p.prayer_name,
        (SELECT COUNT(*) FROM month_days)::INTEGER as total_days,
        COALESCE(ps.completed, 0)::INTEGER as completed_count,
        COALESCE(ps.missed, 0)::INTEGER as missed_count,
        COALESCE(ps.qada, 0)::INTEGER as qada_count,
        CASE 
            WHEN (SELECT COUNT(*) FROM month_days) > 0 
            THEN (COALESCE(ps.completed, 0)::DECIMAL / (SELECT COUNT(*) FROM month_days) * 100)
            ELSE 0
        END as completion_rate,
        COALESCE(ps.congregation, 0)::INTEGER as congregation_count
    FROM (
        SELECT unnest(ARRAY['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']::prayer_name[]) as prayer_name
    ) p
    LEFT JOIN prayer_stats ps ON p.prayer_name = ps.prayer_name
    ORDER BY 
        CASE p.prayer_name
            WHEN 'fajr' THEN 1
            WHEN 'dhuhr' THEN 2
            WHEN 'asr' THEN 3
            WHEN 'maghrib' THEN 4
            WHEN 'isha' THEN 5
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search hadith
CREATE OR REPLACE FUNCTION public.search_hadith(
    search_query TEXT,
    collection_filter UUID DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    grade_filter hadith_grade DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    collection_name TEXT,
    hadith_number INTEGER,
    text_arabic TEXT,
    text_english TEXT,
    text_dhivehi TEXT,
    narrator TEXT,
    grade hadith_grade,
    category TEXT,
    reference TEXT,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        hc.name_english as collection_name,
        h.hadith_number,
        h.text_arabic,
        h.text_english,
        h.text_dhivehi,
        h.narrator,
        h.grade,
        h.category,
        h.reference,
        (
            ts_rank(
                to_tsvector('english', 
                    COALESCE(h.text_english, '') || ' ' || 
                    COALESCE(h.narrator, '') || ' ' || 
                    COALESCE(h.category, '')
                ),
                plainto_tsquery('english', search_query)
            ) +
            CASE 
                WHEN h.text_english ILIKE '%' || search_query || '%' THEN 0.5
                ELSE 0
            END
        )::REAL as relevance_score
    FROM public.hadith h
    JOIN public.hadith_collections hc ON h.collection_id = hc.id
    WHERE (
        search_query IS NULL OR search_query = '' OR
        to_tsvector('english', 
            COALESCE(h.text_english, '') || ' ' || 
            COALESCE(h.narrator, '') || ' ' || 
            COALESCE(h.category, '')
        ) @@ plainto_tsquery('english', search_query) OR
        h.text_english ILIKE '%' || search_query || '%' OR
        h.narrator ILIKE '%' || search_query || '%' OR
        h.category ILIKE '%' || search_query || '%'
    )
    AND (collection_filter IS NULL OR h.collection_id = collection_filter)
    AND (category_filter IS NULL OR h.category = category_filter)
    AND (grade_filter IS NULL OR h.grade = grade_filter)
    ORDER BY relevance_score DESC, h.hadith_number ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search duas
CREATE OR REPLACE FUNCTION public.search_duas(
    search_query TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    occasion_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title_arabic TEXT,
    title_english TEXT,
    title_dhivehi TEXT,
    text_arabic TEXT,
    text_english TEXT,
    text_dhivehi TEXT,
    transliteration TEXT,
    category TEXT,
    occasion TEXT,
    reference TEXT,
    audio_url TEXT,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title_arabic,
        d.title_english,
        d.title_dhivehi,
        d.text_arabic,
        d.text_english,
        d.text_dhivehi,
        d.transliteration,
        d.category,
        d.occasion,
        d.reference,
        d.audio_url,
        (
            ts_rank(
                to_tsvector('english', 
                    COALESCE(d.title_english, '') || ' ' || 
                    COALESCE(d.text_english, '') || ' ' || 
                    COALESCE(d.category, '') || ' ' ||
                    COALESCE(d.occasion, '')
                ),
                plainto_tsquery('english', COALESCE(search_query, ''))
            ) +
            CASE 
                WHEN search_query IS NOT NULL AND (
                    d.title_english ILIKE '%' || search_query || '%' OR
                    d.text_english ILIKE '%' || search_query || '%'
                ) THEN 0.5
                ELSE 0
            END
        )::REAL as relevance_score
    FROM public.duas d
    WHERE (
        search_query IS NULL OR search_query = '' OR
        to_tsvector('english', 
            COALESCE(d.title_english, '') || ' ' || 
            COALESCE(d.text_english, '') || ' ' || 
            COALESCE(d.category, '') || ' ' ||
            COALESCE(d.occasion, '')
        ) @@ plainto_tsquery('english', search_query) OR
        d.title_english ILIKE '%' || search_query || '%' OR
        d.text_english ILIKE '%' || search_query || '%' OR
        d.category ILIKE '%' || search_query || '%'
    )
    AND (category_filter IS NULL OR d.category = category_filter)
    AND (occasion_filter IS NULL OR d.occasion = occasion_filter)
    ORDER BY 
        CASE WHEN search_query IS NULL OR search_query = '' THEN 0 ELSE relevance_score END DESC,
        d.title_english ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's faith dashboard summary
CREATE OR REPLACE FUNCTION public.get_faith_dashboard_summary(user_uuid UUID)
RETURNS TABLE (
    today_prayers_completed INTEGER,
    today_prayers_total INTEGER,
    current_salat_streak INTEGER,
    quran_sessions_this_week INTEGER,
    quran_minutes_this_week INTEGER,
    bookmarks_count INTEGER,
    last_reading_session TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH today_salat AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            5 as total
        FROM public.salat_logs
        WHERE user_id = user_uuid AND prayer_date = CURRENT_DATE
    ),
    streak_info AS (
        SELECT current_streak
        FROM public.calculate_salat_streak(user_uuid)
    ),
    weekly_quran AS (
        SELECT 
            COUNT(*) as sessions,
            COALESCE(SUM(duration_minutes), 0) as minutes
        FROM public.quran_reading_sessions
        WHERE user_id = user_uuid 
            AND session_date >= (CURRENT_DATE - INTERVAL '7 days')::DATE
    ),
    bookmark_count AS (
        SELECT COUNT(*) as count
        FROM public.faith_bookmarks
        WHERE user_id = user_uuid
    ),
    last_session AS (
        SELECT MAX(created_at) as last_session
        FROM public.quran_reading_sessions
        WHERE user_id = user_uuid
    )
    SELECT 
        COALESCE(ts.completed, 0)::INTEGER,
        ts.total::INTEGER,
        COALESCE(si.current_streak, 0)::INTEGER,
        COALESCE(wq.sessions, 0)::INTEGER,
        COALESCE(wq.minutes, 0)::INTEGER,
        COALESCE(bc.count, 0)::INTEGER,
        ls.last_session
    FROM today_salat ts
    CROSS JOIN streak_info si
    CROSS JOIN weekly_quran wq
    CROSS JOIN bookmark_count bc
    CROSS JOIN last_session ls;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
