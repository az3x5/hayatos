-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Update notes table with enhanced features
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS embedding vector(1536), -- OpenAI ada-002 embedding size
ADD COLUMN IF NOT EXISTS last_ai_processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_generated_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2);

-- Create entities table for knowledge graph
CREATE TABLE public.entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- person, place, topic, concept, etc.
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, type)
);

-- Create note_entities junction table for many-to-many relationships
CREATE TABLE public.note_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 0.5,
    context TEXT, -- Where/how the entity appears in the note
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(note_id, entity_id)
);

-- Create entity_relationships table for knowledge graph edges
CREATE TABLE public.entity_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    to_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- related_to, mentions, discusses, etc.
    strength DECIMAL(3,2) DEFAULT 0.5,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

-- Faith Knowledge Base Tables

-- Quran table
CREATE TABLE public.quran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surah_number INTEGER NOT NULL,
    surah_name_arabic TEXT NOT NULL,
    surah_name_english TEXT NOT NULL,
    surah_name_transliteration TEXT NOT NULL,
    ayah_number INTEGER NOT NULL,
    ayah_text_arabic TEXT NOT NULL,
    ayah_text_english TEXT NOT NULL,
    ayah_text_transliteration TEXT,
    revelation_type TEXT, -- meccan or medinan
    juz_number INTEGER,
    hizb_number INTEGER,
    rub_number INTEGER,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(surah_number, ayah_number)
);

-- Hadith table
CREATE TABLE public.hadith (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection TEXT NOT NULL, -- bukhari, muslim, tirmidhi, etc.
    book_number INTEGER,
    book_name TEXT,
    hadith_number TEXT NOT NULL,
    chapter TEXT,
    hadith_text_arabic TEXT,
    hadith_text_english TEXT NOT NULL,
    narrator TEXT,
    grade TEXT, -- sahih, hasan, daif, etc.
    reference TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection, hadith_number)
);

-- Duas table
CREATE TABLE public.duas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- morning, evening, travel, etc.
    dua_arabic TEXT NOT NULL,
    dua_transliteration TEXT,
    dua_english TEXT NOT NULL,
    reference TEXT,
    benefits TEXT,
    occasion TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bookmarks for faith content
CREATE TABLE public.faith_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- quran, hadith, dua
    content_id UUID NOT NULL,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

-- Create indexes for performance
CREATE INDEX idx_notes_embedding ON public.notes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_notes_word_count ON public.notes(word_count);
CREATE INDEX idx_notes_reading_time ON public.notes(reading_time);
CREATE INDEX idx_notes_ai_tags ON public.notes USING GIN(ai_generated_tags);

CREATE INDEX idx_entities_name ON public.entities(name);
CREATE INDEX idx_entities_type ON public.entities(type);
CREATE INDEX idx_note_entities_note_id ON public.note_entities(note_id);
CREATE INDEX idx_note_entities_entity_id ON public.note_entities(entity_id);
CREATE INDEX idx_note_entities_relevance ON public.note_entities(relevance_score);

CREATE INDEX idx_entity_relationships_from ON public.entity_relationships(from_entity_id);
CREATE INDEX idx_entity_relationships_to ON public.entity_relationships(to_entity_id);
CREATE INDEX idx_entity_relationships_type ON public.entity_relationships(relationship_type);

CREATE INDEX idx_quran_surah ON public.quran(surah_number);
CREATE INDEX idx_quran_ayah ON public.quran(surah_number, ayah_number);
CREATE INDEX idx_quran_embedding ON public.quran USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_quran_juz ON public.quran(juz_number);

CREATE INDEX idx_hadith_collection ON public.hadith(collection);
CREATE INDEX idx_hadith_number ON public.hadith(collection, hadith_number);
CREATE INDEX idx_hadith_embedding ON public.hadith USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_hadith_grade ON public.hadith(grade);

CREATE INDEX idx_duas_category ON public.duas(category);
CREATE INDEX idx_duas_embedding ON public.duas USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_faith_bookmarks_user ON public.faith_bookmarks(user_id);
CREATE INDEX idx_faith_bookmarks_content ON public.faith_bookmarks(content_type, content_id);

-- Add RLS policies for new tables
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_bookmarks ENABLE ROW LEVEL SECURITY;

-- Entities are shared across users (read-only for regular users)
CREATE POLICY "Anyone can view entities" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can create entities" ON public.entities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Note entities are user-specific through note ownership
CREATE POLICY "Users can view note entities for their notes" ON public.note_entities 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.notes n 
            WHERE n.id = note_entities.note_id AND n.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage note entities for their notes" ON public.note_entities 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.notes n 
            WHERE n.id = note_entities.note_id AND n.user_id = auth.uid()
        )
    );

-- Entity relationships are public (read-only)
CREATE POLICY "Anyone can view entity relationships" ON public.entity_relationships FOR SELECT USING (true);

-- Faith content is public (read-only)
CREATE POLICY "Anyone can view Quran" ON public.quran FOR SELECT USING (true);
CREATE POLICY "Anyone can view Hadith" ON public.hadith FOR SELECT USING (true);
CREATE POLICY "Anyone can view Duas" ON public.duas FOR SELECT USING (true);

-- Faith bookmarks are user-specific
CREATE POLICY "Users can manage their faith bookmarks" ON public.faith_bookmarks 
    FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entity_relationships_updated_at BEFORE UPDATE ON public.entity_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faith_bookmarks_updated_at BEFORE UPDATE ON public.faith_bookmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
