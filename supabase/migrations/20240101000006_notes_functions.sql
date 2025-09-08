-- Function to calculate reading time and word count
CREATE OR REPLACE FUNCTION public.calculate_note_stats(note_content TEXT)
RETURNS TABLE (word_count INTEGER, reading_time INTEGER) AS $$
DECLARE
    words INTEGER;
    reading_minutes INTEGER;
BEGIN
    -- Count words (split by whitespace and filter empty strings)
    SELECT array_length(
        array_remove(
            string_to_array(regexp_replace(note_content, '[^\w\s]', ' ', 'g'), ' '), 
            ''
        ), 
        1
    ) INTO words;
    
    -- Calculate reading time (average 200 words per minute)
    reading_minutes := GREATEST(1, ROUND(words / 200.0));
    
    RETURN QUERY SELECT COALESCE(words, 0), reading_minutes;
END;
$$ LANGUAGE plpgsql;

-- Function to perform semantic search on notes
CREATE OR REPLACE FUNCTION public.semantic_search_notes(
    query_embedding vector(1536),
    user_uuid UUID,
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    excerpt TEXT,
    similarity FLOAT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.excerpt,
        (1 - (n.embedding <=> query_embedding)) as similarity,
        n.created_at
    FROM public.notes n
    WHERE n.user_id = user_uuid
        AND n.embedding IS NOT NULL
        AND (1 - (n.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY n.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search faith content (Quran, Hadith, Duas)
CREATE OR REPLACE FUNCTION public.semantic_search_faith_content(
    query_embedding vector(1536),
    content_types TEXT[] DEFAULT ARRAY['quran', 'hadith', 'duas'],
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    content_type TEXT,
    title TEXT,
    text_english TEXT,
    text_arabic TEXT,
    reference TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    (
        SELECT 
            q.id,
            'quran'::TEXT as content_type,
            (q.surah_name_english || ' ' || q.surah_number || ':' || q.ayah_number) as title,
            q.ayah_text_english as text_english,
            q.ayah_text_arabic as text_arabic,
            ('Quran ' || q.surah_number || ':' || q.ayah_number) as reference,
            (1 - (q.embedding <=> query_embedding)) as similarity
        FROM public.quran q
        WHERE 'quran' = ANY(content_types)
            AND q.embedding IS NOT NULL
            AND (1 - (q.embedding <=> query_embedding)) > similarity_threshold
        ORDER BY q.embedding <=> query_embedding
        LIMIT max_results / 3
    )
    UNION ALL
    (
        SELECT 
            h.id,
            'hadith'::TEXT as content_type,
            (h.collection || ' ' || h.hadith_number) as title,
            h.hadith_text_english as text_english,
            h.hadith_text_arabic as text_arabic,
            h.reference,
            (1 - (h.embedding <=> query_embedding)) as similarity
        FROM public.hadith h
        WHERE 'hadith' = ANY(content_types)
            AND h.embedding IS NOT NULL
            AND (1 - (h.embedding <=> query_embedding)) > similarity_threshold
        ORDER BY h.embedding <=> query_embedding
        LIMIT max_results / 3
    )
    UNION ALL
    (
        SELECT 
            d.id,
            'duas'::TEXT as content_type,
            d.title,
            d.dua_english as text_english,
            d.dua_arabic as text_arabic,
            d.reference,
            (1 - (d.embedding <=> query_embedding)) as similarity
        FROM public.duas d
        WHERE 'duas' = ANY(content_types)
            AND d.embedding IS NOT NULL
            AND (1 - (d.embedding <=> query_embedding)) > similarity_threshold
        ORDER BY d.embedding <=> query_embedding
        LIMIT max_results / 3
    )
    ORDER BY similarity DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find related notes through knowledge graph
CREATE OR REPLACE FUNCTION public.find_related_notes_by_entities(
    note_uuid UUID,
    user_uuid UUID,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    excerpt TEXT,
    shared_entities INTEGER,
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH note_entities AS (
        SELECT entity_id, relevance_score
        FROM public.note_entities ne
        WHERE ne.note_id = note_uuid
    ),
    related_notes AS (
        SELECT 
            n.id,
            n.title,
            n.excerpt,
            COUNT(ne2.entity_id) as shared_entities,
            AVG(ne2.relevance_score * ne1.relevance_score) as relevance_score
        FROM public.notes n
        JOIN public.note_entities ne2 ON n.id = ne2.note_id
        JOIN note_entities ne1 ON ne2.entity_id = ne1.entity_id
        WHERE n.user_id = user_uuid
            AND n.id != note_uuid
        GROUP BY n.id, n.title, n.excerpt
        HAVING COUNT(ne2.entity_id) > 0
    )
    SELECT 
        rn.id,
        rn.title,
        rn.excerpt,
        rn.shared_entities::INTEGER,
        rn.relevance_score::FLOAT
    FROM related_notes rn
    ORDER BY rn.shared_entities DESC, rn.relevance_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get entity network for knowledge graph visualization
CREATE OR REPLACE FUNCTION public.get_entity_network(
    user_uuid UUID,
    entity_types TEXT[] DEFAULT NULL,
    min_connections INTEGER DEFAULT 2
)
RETURNS TABLE (
    entity_id UUID,
    entity_name TEXT,
    entity_type TEXT,
    connection_count INTEGER,
    connected_entities JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_entities AS (
        SELECT DISTINCT e.id, e.name, e.type
        FROM public.entities e
        JOIN public.note_entities ne ON e.id = ne.entity_id
        JOIN public.notes n ON ne.note_id = n.id
        WHERE n.user_id = user_uuid
            AND (entity_types IS NULL OR e.type = ANY(entity_types))
    ),
    entity_connections AS (
        SELECT 
            ue.id,
            ue.name,
            ue.type,
            COUNT(DISTINCT ne.note_id) as connection_count,
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'note_id', n.id,
                    'note_title', n.title,
                    'relevance', ne.relevance_score
                )
            ) as connected_entities
        FROM user_entities ue
        JOIN public.note_entities ne ON ue.id = ne.entity_id
        JOIN public.notes n ON ne.note_id = n.id
        WHERE n.user_id = user_uuid
        GROUP BY ue.id, ue.name, ue.type
        HAVING COUNT(DISTINCT ne.note_id) >= min_connections
    )
    SELECT 
        ec.id,
        ec.name,
        ec.type,
        ec.connection_count::INTEGER,
        ec.connected_entities
    FROM entity_connections ec
    ORDER BY ec.connection_count DESC, ec.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update note statistics when content changes
CREATE OR REPLACE FUNCTION public.update_note_stats()
RETURNS TRIGGER AS $$
DECLARE
    stats RECORD;
BEGIN
    -- Calculate word count and reading time
    SELECT word_count, reading_time INTO stats
    FROM public.calculate_note_stats(NEW.content);
    
    NEW.word_count := stats.word_count;
    NEW.reading_time := stats.reading_time;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update note stats
CREATE TRIGGER update_note_stats_trigger
    BEFORE INSERT OR UPDATE OF content ON public.notes
    FOR EACH ROW
    WHEN (NEW.content IS DISTINCT FROM OLD.content OR OLD.content IS NULL)
    EXECUTE FUNCTION public.update_note_stats();

-- Function to clean up orphaned entities
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_entities()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.entities e
    WHERE NOT EXISTS (
        SELECT 1 FROM public.note_entities ne WHERE ne.entity_id = e.id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get note statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_note_statistics(user_uuid UUID)
RETURNS TABLE (
    total_notes INTEGER,
    total_words INTEGER,
    total_reading_time INTEGER,
    avg_words_per_note FLOAT,
    most_used_tags TEXT[],
    entity_count INTEGER,
    notes_with_ai_tags INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH note_stats AS (
        SELECT 
            COUNT(*)::INTEGER as total_notes,
            COALESCE(SUM(word_count), 0)::INTEGER as total_words,
            COALESCE(SUM(reading_time), 0)::INTEGER as total_reading_time,
            COALESCE(AVG(word_count), 0)::FLOAT as avg_words_per_note,
            COUNT(CASE WHEN array_length(ai_generated_tags, 1) > 0 THEN 1 END)::INTEGER as notes_with_ai_tags
        FROM public.notes
        WHERE user_id = user_uuid
    ),
    tag_stats AS (
        SELECT array_agg(tag ORDER BY tag_count DESC) as most_used_tags
        FROM (
            SELECT unnest(tags || ai_generated_tags) as tag, COUNT(*) as tag_count
            FROM public.notes
            WHERE user_id = user_uuid
            GROUP BY tag
            ORDER BY tag_count DESC
            LIMIT 10
        ) t
    ),
    entity_stats AS (
        SELECT COUNT(DISTINCT e.id)::INTEGER as entity_count
        FROM public.entities e
        JOIN public.note_entities ne ON e.id = ne.entity_id
        JOIN public.notes n ON ne.note_id = n.id
        WHERE n.user_id = user_uuid
    )
    SELECT 
        ns.total_notes,
        ns.total_words,
        ns.total_reading_time,
        ns.avg_words_per_note,
        COALESCE(ts.most_used_tags, ARRAY[]::TEXT[]),
        es.entity_count,
        ns.notes_with_ai_tags
    FROM note_stats ns
    CROSS JOIN tag_stats ts
    CROSS JOIN entity_stats es;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
