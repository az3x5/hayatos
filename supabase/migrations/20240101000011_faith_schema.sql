-- Faith Module Database Schema

-- Create custom types for Islamic features
CREATE TYPE prayer_name AS ENUM ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha');
CREATE TYPE prayer_status AS ENUM ('completed', 'missed', 'qada');
CREATE TYPE azkar_type AS ENUM ('morning', 'evening', 'after_prayer', 'before_sleep', 'general');
CREATE TYPE hadith_grade AS ENUM ('sahih', 'hasan', 'daif', 'mawdu');

-- Quran structure tables
CREATE TABLE public.quran_surahs (
    id INTEGER PRIMARY KEY,
    name_arabic TEXT NOT NULL,
    name_english TEXT NOT NULL,
    name_dhivehi TEXT,
    revelation_place TEXT, -- makkah or madinah
    verse_count INTEGER NOT NULL,
    order_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.quran_verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surah_id INTEGER NOT NULL REFERENCES public.quran_surahs(id),
    verse_number INTEGER NOT NULL,
    text_arabic TEXT NOT NULL,
    text_english TEXT,
    text_dhivehi TEXT,
    transliteration TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(surah_id, verse_number)
);

-- Salat tracking tables
CREATE TABLE public.salat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    prayer_name prayer_name NOT NULL,
    prayer_date DATE NOT NULL,
    status prayer_status NOT NULL DEFAULT 'completed',
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    is_congregation BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, prayer_name, prayer_date)
);

-- Quran reading progress
CREATE TABLE public.quran_reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    surah_id INTEGER NOT NULL REFERENCES public.quran_surahs(id),
    start_verse INTEGER NOT NULL,
    end_verse INTEGER NOT NULL,
    duration_minutes INTEGER,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hadith collection
CREATE TABLE public.hadith_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_arabic TEXT NOT NULL,
    name_english TEXT NOT NULL,
    name_dhivehi TEXT,
    description TEXT,
    total_hadith INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.hadith (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES public.hadith_collections(id),
    book_number INTEGER,
    hadith_number INTEGER,
    text_arabic TEXT NOT NULL,
    text_english TEXT,
    text_dhivehi TEXT,
    narrator TEXT,
    grade hadith_grade,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Duas collection
CREATE TABLE public.duas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_arabic TEXT NOT NULL,
    title_english TEXT NOT NULL,
    title_dhivehi TEXT,
    text_arabic TEXT NOT NULL,
    text_english TEXT,
    text_dhivehi TEXT,
    transliteration TEXT,
    category TEXT NOT NULL,
    occasion TEXT,
    reference TEXT,
    audio_url TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Azkar and reminders
CREATE TABLE public.azkar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_arabic TEXT NOT NULL,
    title_english TEXT NOT NULL,
    title_dhivehi TEXT,
    text_arabic TEXT NOT NULL,
    text_english TEXT,
    text_dhivehi TEXT,
    transliteration TEXT,
    type azkar_type NOT NULL,
    repetition_count INTEGER DEFAULT 1,
    reference TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.azkar_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    azkar_id UUID NOT NULL REFERENCES public.azkar(id),
    reminder_time TIME NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE public.faith_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    prayer_notifications BOOLEAN DEFAULT TRUE,
    azkar_notifications BOOLEAN DEFAULT TRUE,
    preferred_translation TEXT DEFAULT 'english',
    preferred_reciter TEXT DEFAULT 'mishary',
    auto_play_audio BOOLEAN DEFAULT FALSE,
    font_size INTEGER DEFAULT 16,
    arabic_font TEXT DEFAULT 'uthmanic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User bookmarks and favorites
CREATE TABLE public.faith_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bookmark_type TEXT NOT NULL, -- 'verse', 'hadith', 'dua', 'azkar'
    reference_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, bookmark_type, reference_id)
);

-- Create indexes for better performance
CREATE INDEX idx_quran_verses_surah_id ON public.quran_verses(surah_id);
CREATE INDEX idx_quran_verses_verse_number ON public.quran_verses(verse_number);

CREATE INDEX idx_salat_logs_user_id ON public.salat_logs(user_id);
CREATE INDEX idx_salat_logs_prayer_date ON public.salat_logs(prayer_date);
CREATE INDEX idx_salat_logs_prayer_name ON public.salat_logs(prayer_name);
CREATE INDEX idx_salat_logs_status ON public.salat_logs(status);

CREATE INDEX idx_quran_reading_user_id ON public.quran_reading_sessions(user_id);
CREATE INDEX idx_quran_reading_date ON public.quran_reading_sessions(session_date);
CREATE INDEX idx_quran_reading_surah ON public.quran_reading_sessions(surah_id);

CREATE INDEX idx_hadith_collection_id ON public.hadith(collection_id);
CREATE INDEX idx_hadith_category ON public.hadith(category);
CREATE INDEX idx_hadith_tags ON public.hadith USING GIN(tags);
CREATE INDEX idx_hadith_grade ON public.hadith(grade);

CREATE INDEX idx_duas_category ON public.duas(category);
CREATE INDEX idx_duas_tags ON public.duas USING GIN(tags);

CREATE INDEX idx_azkar_type ON public.azkar(type);
CREATE INDEX idx_azkar_reminders_user_id ON public.azkar_reminders(user_id);
CREATE INDEX idx_azkar_reminders_time ON public.azkar_reminders(reminder_time);

CREATE INDEX idx_faith_bookmarks_user_id ON public.faith_bookmarks(user_id);
CREATE INDEX idx_faith_bookmarks_type ON public.faith_bookmarks(bookmark_type);

-- Add RLS policies
ALTER TABLE public.quran_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azkar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azkar_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_bookmarks ENABLE ROW LEVEL SECURITY;

-- Quran data is public (read-only)
CREATE POLICY "Quran surahs are publicly readable" ON public.quran_surahs
    FOR SELECT USING (true);

CREATE POLICY "Quran verses are publicly readable" ON public.quran_verses
    FOR SELECT USING (true);

-- Hadith and Duas are public (read-only)
CREATE POLICY "Hadith collections are publicly readable" ON public.hadith_collections
    FOR SELECT USING (true);

CREATE POLICY "Hadith are publicly readable" ON public.hadith
    FOR SELECT USING (true);

CREATE POLICY "Duas are publicly readable" ON public.duas
    FOR SELECT USING (true);

CREATE POLICY "Azkar are publicly readable" ON public.azkar
    FOR SELECT USING (true);

-- User-specific data policies
CREATE POLICY "Users can manage own salat logs" ON public.salat_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading sessions" ON public.quran_reading_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own azkar reminders" ON public.azkar_reminders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own faith settings" ON public.faith_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks" ON public.faith_bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_salat_logs_updated_at BEFORE UPDATE ON public.salat_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_azkar_reminders_updated_at BEFORE UPDATE ON public.azkar_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faith_settings_updated_at BEFORE UPDATE ON public.faith_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
