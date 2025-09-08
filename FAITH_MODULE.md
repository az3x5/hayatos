# Faith Module - Islamic Spiritual Tracking

## 🕌 Overview

The Faith Module provides comprehensive Islamic spiritual tracking and resources, including Salat (prayer) tracking, Quran reading with translations, authentic Hadith and Duas library, and Azkar (remembrance) reminders. This implementation follows Islamic principles and uses authentic sources for all religious content.

## ✨ Features Implemented

### 🕌 Salat Tracker
- **Five Daily Prayers**: Complete tracking of Fajr, Dhuhr, Asr, Maghrib, and Isha prayers
- **Prayer Status**: Mark prayers as completed, missed, or made up (Qada)
- **Congregation Tracking**: Special marking for prayers performed in congregation (Jama'ah)
- **Streak Calculation**: Track current and longest prayer completion streaks
- **Detailed Statistics**: Monthly and yearly prayer completion rates and analytics
- **Historical Logs**: View and edit prayer logs for any date
- **Quick Actions**: Fast prayer logging from dashboard

### 📖 Quran Reader
- **Complete Quran**: All 114 surahs with proper Arabic text and verse numbering
- **Multi-language Support**: Arabic text with English and Dhivehi translations
- **Audio Recitation**: Verse-by-verse audio playback with authentic recitation
- **Advanced Search**: Search across Arabic text, translations, and transliterations
- **Reading Sessions**: Track reading time, verses covered, and progress
- **Bookmarking System**: Save favorite verses for quick reference
- **Progress Tracking**: Monitor reading streaks and completion statistics

### 📜 Hadith & Duas Library
- **Authentic Collections**: Major hadith collections with proper attribution
- **Hadith Grading**: Classification as Sahih, Hasan, Daif, or Mawdu according to Islamic scholarship
- **Advanced Search**: Search by text content, narrator, category, or collection
- **Comprehensive Duas**: Supplications for various occasions and times
- **Category Organization**: Organized by topics like prayer, travel, eating, etc.
- **Audio Support**: Audio playback for selected duas with proper pronunciation
- **Bookmark System**: Save important hadith and duas for easy access

### 🔔 Azkar Reminders
- **Azkar Types**: Morning, evening, post-prayer, bedtime, and general remembrance
- **Smart Scheduling**: Customizable reminder times and frequency
- **Repetition Tracking**: Track recommended repetition counts for each azkar
- **Flexible Patterns**: Daily, weekly, or custom notification schedules
- **Push Notifications**: Browser-based reminder system with Islamic content
- **Audio Guidance**: Pronunciation help with audio playback

### 📊 Faith Dashboard
- **Spiritual Overview**: Comprehensive dashboard showing prayer streaks, Quran progress, and reminders
- **Progress Analytics**: Visual representation of spiritual activities and improvements
- **Quick Actions**: Fast access to prayer logging, Quran reading, and other features
- **Islamic Calendar**: Display of current Islamic date and important occasions
- **Recent Activity**: Timeline of recent spiritual activities and achievements

## 🗄️ Database Schema

### Core Islamic Tables
```sql
-- Quran structure with authentic text
quran_surahs (id, name_arabic, name_english, name_dhivehi, verse_count, revelation_place)
quran_verses (id, surah_id, verse_number, text_arabic, text_english, text_dhivehi, audio_url)

-- Prayer tracking system
salat_logs (id, user_id, prayer_name, prayer_date, status, is_congregation, notes)

-- Hadith collections with grading
hadith_collections (id, name_arabic, name_english, total_hadith)
hadith (id, collection_id, text_arabic, text_english, narrator, grade, category)

-- Duas and supplications
duas (id, title_arabic, title_english, text_arabic, text_english, category, occasion)

-- Azkar and reminders
azkar (id, title_arabic, title_english, text_arabic, type, repetition_count)
azkar_reminders (id, user_id, azkar_id, reminder_time, days_of_week, is_enabled)

-- User spiritual data
quran_reading_sessions (id, user_id, surah_id, start_verse, end_verse, duration_minutes)
faith_bookmarks (id, user_id, bookmark_type, reference_id, notes)
faith_settings (id, user_id, prayer_notifications, preferred_translation, arabic_font)
```

### Advanced Islamic Functions
```sql
-- Prayer analytics with Islamic calendar awareness
calculate_salat_streak(user_uuid, end_date) -- Current and longest prayer streaks
get_daily_salat_status(user_uuid, target_date) -- Prayer status for specific date
get_monthly_salat_stats(user_uuid, target_month) -- Monthly prayer statistics

-- Quran reading progress
get_quran_reading_progress(user_uuid, days_back) -- Reading sessions and progress
search_hadith(search_query, collection_filter, grade_filter) -- Hadith search with relevance
search_duas(search_query, category_filter, occasion_filter) -- Duas search

-- Faith dashboard summary
get_faith_dashboard_summary(user_uuid) -- Comprehensive spiritual overview
```

## 🔧 API Endpoints

### Salat Tracking API
```typescript
GET    /api/faith/salat                    // Get prayer logs with statistics
POST   /api/faith/salat                    // Log prayer completion
PUT    /api/faith/salat                    // Update prayer log
DELETE /api/faith/salat                    // Delete prayer log

// Query parameters
?date=YYYY-MM-DD                          // Specific date
?include_stats=true                       // Include streak and statistics
?prayer_name=fajr|dhuhr|asr|maghrib|isha // Filter by prayer
```

### Quran Reader API
```typescript
GET    /api/faith/quran?action=surahs     // List all surahs
GET    /api/faith/quran?action=verses     // Get verses with translations
GET    /api/faith/quran?action=search     // Search verses
POST   /api/faith/quran?action=reading_session // Log reading session
POST   /api/faith/quran?action=bookmark   // Bookmark verse

// Query parameters
?surah_id=1-114                          // Specific surah
?translation=english|dhivehi|both        // Translation preference
?include_audio=true                      // Include audio URLs
```

### Hadith & Duas API
```typescript
GET    /api/faith/hadith?action=collections // List hadith collections
GET    /api/faith/hadith?action=hadith      // Search hadith
GET    /api/faith/hadith?action=duas        // Search duas
GET    /api/faith/hadith?action=categories  // Get categories
POST   /api/faith/hadith?action=bookmark    // Bookmark hadith/dua

// Query parameters
?search=query                            // Text search
?collection_id=uuid                      // Filter by collection
?grade=sahih|hasan|daif|mawdu           // Filter by authenticity
?category=prayer|travel|eating           // Filter by category
```

### Azkar & Reminders API
```typescript
GET    /api/faith/azkar?action=azkar      // Get azkar collection
GET    /api/faith/azkar?action=reminders  // Get user reminders
GET    /api/faith/azkar?action=types      // Get azkar types
POST   /api/faith/azkar?action=reminder   // Create reminder
PUT    /api/faith/azkar                   // Update reminder
DELETE /api/faith/azkar                   // Delete reminder

// Query parameters
?type=morning|evening|after_prayer|before_sleep|general
```

### Faith Dashboard API
```typescript
GET    /api/faith/dashboard               // Comprehensive faith summary
POST   /api/faith/dashboard?action=quick_salat // Quick prayer logging
POST   /api/faith/dashboard?action=settings    // Update faith settings
```

## 🎨 React Components

### Core Components
- **UnifiedFaithDashboard**: Main faith module interface with tabbed navigation
- **FaithDashboard**: Overview dashboard with spiritual progress and quick actions
- **SalatTracker**: Prayer logging with streak tracking and statistics
- **QuranReader**: Quran reading with translations, audio, and bookmarking
- **HadithDuasLibrary**: Searchable hadith and duas collection
- **AzkarReminders**: Azkar reminder setup and management

### React Hooks
- **useSalat()**: Prayer logging and streak management
- **useQuran()**: Quran reading, search, and session tracking
- **useHadithDuas()**: Hadith and duas search and bookmarking
- **useAzkar()**: Azkar collection and reminder management

## 🕌 Islamic Features

### Prayer System
```typescript
// Prayer logging with Islamic requirements
const prayerLog = {
  prayer_name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  status: 'completed' | 'missed' | 'qada',
  is_congregation: boolean,
  prayer_date: 'YYYY-MM-DD',
  notes: string
};

// Streak calculation following Islamic calendar
const streak = await calculateSalatStreak(userId);
```

### Quran Integration
```typescript
// Reading session tracking
const session = {
  surah_id: 1-114,
  start_verse: number,
  end_verse: number,
  duration_minutes: number,
  notes: string
};

// Multi-language support
const translations = ['english', 'dhivehi', 'both'];
```

### Hadith Authentication
```typescript
// Hadith with Islamic grading
const hadith = {
  text_arabic: string,
  text_english: string,
  narrator: string,
  grade: 'sahih' | 'hasan' | 'daif' | 'mawdu',
  collection: 'Sahih Bukhari' | 'Sahih Muslim' | ...,
  reference: string
};
```

### Azkar Reminders
```typescript
// Islamic remembrance scheduling
const azkarReminder = {
  type: 'morning' | 'evening' | 'after_prayer' | 'before_sleep',
  reminder_time: 'HH:MM',
  days_of_week: [1,2,3,4,5,6,7], // Monday to Sunday
  repetition_count: number
};
```

## 🔒 Islamic Data Integrity

### Authentic Sources
- **Quran Text**: Verified against the Mushaf of Madinah
- **Hadith Collections**: From recognized authentic collections with proper grading
- **Duas**: Sourced from Quran and authentic Sunnah
- **Azkar**: Traditional morning/evening remembrance from verified sources

### Data Validation
- **Arabic Text Verification**: Proper Arabic script and diacritics
- **Translation Accuracy**: Verified translations from recognized scholars
- **Hadith Grading**: Proper classification according to Islamic scholarship
- **Audio Authenticity**: Recitations from qualified Qaris with proper Tajweed

## 🚀 Getting Started

### 1. Database Setup
```bash
# Run faith migrations
npx supabase db reset

# Migrations applied:
# - 20240101000011_faith_schema.sql
# - 20240101000012_faith_functions.sql
```

### 2. Islamic Data Import
```bash
# Import Quran data (114 surahs, 6236 verses)
# Import hadith collections (Bukhari, Muslim, etc.)
# Import duas and azkar collections
# Configure audio URLs for recitation
```

### 3. Component Usage
```tsx
import UnifiedFaithDashboard from '@/components/UnifiedFaithDashboard';

export default function FaithPage() {
  return <UnifiedFaithDashboard />;
}
```

### 4. Demo Access
Visit `/faith` to explore:
- Interactive prayer tracking with Islamic calendar
- Complete Quran reader with audio recitation
- Authentic hadith and duas library
- Azkar reminder system with notifications

## 📱 Mobile & Accessibility

### Islamic UX Considerations
- **Right-to-Left Support**: Proper RTL layout for Arabic text
- **Islamic Typography**: Authentic Arabic fonts and proper text rendering
- **Prayer Time Integration**: Consideration for local prayer times
- **Qibla Direction**: Future integration with compass for prayer direction
- **Islamic Calendar**: Hijri date display and Islamic occasion awareness

### Accessibility Features
- **Screen Reader Support**: Proper Arabic text pronunciation
- **High Contrast**: Readable text for all lighting conditions
- **Large Text**: Adjustable font sizes for Arabic and translations
- **Audio Controls**: Accessible audio playback controls
- **Keyboard Navigation**: Full keyboard accessibility

## 🔮 Future Enhancements

### Advanced Islamic Features
- **Prayer Time Calculator**: Accurate prayer times based on location and calculation method
- **Qibla Compass**: Direction to Mecca for prayer orientation
- **Islamic Calendar**: Full Hijri calendar with Islamic occasions
- **Tafsir Integration**: Quranic commentary and explanation
- **Tajweed Rules**: Quranic recitation rules and pronunciation guide
- **Dhikr Counter**: Digital tasbih for remembrance counting

### Community Features
- **Study Groups**: Collaborative Quran and hadith study
- **Mosque Integration**: Connect with local mosque prayer times and events
- **Islamic Learning**: Structured courses on Islamic knowledge
- **Charity Tracking**: Zakat and sadaqah calculation and tracking
- **Hajj/Umrah Planner**: Pilgrimage planning and guidance

---

The Faith Module provides a comprehensive Islamic spiritual tracking system with authentic religious content, proper Islamic principles, and modern technology to support Muslim users in their daily worship and spiritual growth.
