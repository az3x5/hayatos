export type TaskStatus = 'inbox' | 'todo' | 'doing' | 'done';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
export type NotificationType = 'task_due' | 'habit_reminder' | 'salat_time' | 'budget_alert' | 'system';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  timezone: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  color: string;
  is_archived: boolean;
  milestones: any[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  due_date?: string;
  completed_at?: string;
  recurrence_rule?: string;
  tags: string[];
  attachments: any[];
  position: number;
  created_at: string;
  updated_at: string;
  project?: Project;
  subtasks?: Task[];
}

export interface Event {
  id: string;
  user_id: string;
  linked_task_id?: string;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  all_day: boolean;
  location?: string;
  attendees: any[];
  created_at: string;
  updated_at: string;
  linked_task?: Task;
}

export interface Note {
  id: string;
  user_id: string;
  project_id?: string;
  task_id?: string;
  title: string;
  content?: string;
  excerpt?: string;
  word_count: number;
  reading_time: number;
  tags: string[];
  ai_generated_tags: string[];
  is_pinned: boolean;
  embedding?: number[];
  last_ai_processed_at?: string;
  ai_confidence_score?: number;
  created_at: string;
  updated_at: string;
  project?: Project;
  task?: Task;
  note_entities?: NoteEntity[];
  related_notes?: RelatedNote[];
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    days?: string[];
    times?: string[];
  };
  target_value: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthLog {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  unit: string;
  notes?: string;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}



export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  period: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalatLog {
  id: string;
  user_id: string;
  prayer_name: string;
  prayer_time: string;
  logged_at: string;
  is_on_time: boolean;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  data: Record<string, any>;
  is_read: boolean;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Entity and Knowledge Graph types
export interface Entity {
  id: string;
  name: string;
  type: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NoteEntity {
  id: string;
  note_id: string;
  entity_id: string;
  relevance_score: number;
  context?: string;
  created_at: string;
  entity?: Entity;
}

export interface EntityRelationship {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: string;
  strength: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RelatedNote {
  id: string;
  title: string;
  excerpt?: string;
  shared_entities: number;
  relevance_score: number;
}

// Faith Knowledge Base types
export interface QuranVerse {
  id: string;
  surah_number: number;
  surah_name_arabic: string;
  surah_name_english: string;
  surah_name_transliteration: string;
  ayah_number: number;
  ayah_text_arabic: string;
  ayah_text_english: string;
  ayah_text_transliteration?: string;
  revelation_type: string;
  juz_number?: number;
  hizb_number?: number;
  rub_number?: number;
  embedding?: number[];
  created_at: string;
}



export interface Dua {
  id: string;
  title: string;
  category: string;
  dua_arabic: string;
  dua_transliteration?: string;
  dua_english: string;
  reference?: string;
  benefits?: string;
  occasion?: string;
  embedding?: number[];
  created_at: string;
}

export interface FaithBookmark {
  id: string;
  user_id: string;
  content_type: 'quran' | 'hadith' | 'dua';
  content_id: string;
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  content?: QuranVerse | Hadith | Dua;
}

// Task creation/update types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  project_id?: string;
  parent_task_id?: string;
  status?: TaskStatus;
  priority?: PriorityLevel;
  due_date?: string;
  recurrence_rule?: string;
  tags?: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

// Project creation/update types
export interface CreateProjectRequest {
  title: string;
  description?: string;
  color?: string;
  milestones?: any[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}

// Note creation/update types
export interface CreateNoteRequest {
  title: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  project_id?: string;
  task_id?: string;
  is_pinned?: boolean;
}

export interface UpdateNoteRequest extends Partial<CreateNoteRequest> {
  id: string;
}

// Search and AI types
export interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  content_type: string;
  similarity?: number;
  relevance?: number;
  search_method: 'semantic' | 'keyword';
  created_at: string;
}

export interface AIProcessingResult {
  excerpt?: string;
  suggested_tags?: string[];
  entities?: Record<string, string[]>;
  embedding?: number[];
  confidence_score?: number;
}

export interface KnowledgeGraphNode {
  id: string;
  name: string;
  type: string;
  size: number;
  connections: number;
  connected_notes: any[];
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  metadata: Record<string, any>;
}

// Habits and Health types
export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  cadence_config: Record<string, any>;
  target_value: number;
  target_unit: string;
  color: string;
  icon: string;
  is_active: boolean;
  reminders: any[];
  created_at: string;
  updated_at: string;
  stats?: HabitStats;
}

export interface HabitStats {
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completion_rate: number;
  completed_today: boolean;
  today_value: number;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  logged_at: string;
  value: number;
  notes?: string;
  mood_rating?: number;
  created_at: string;
}

export interface HealthLog {
  id: string;
  user_id: string;
  type: 'sleep' | 'water' | 'exercise' | 'diet' | 'mood' | 'weight' | 'blood_pressure' | 'heart_rate' | 'steps' | 'calories';
  value: Record<string, any>;
  start_time: string;
  end_time?: string;
  notes?: string;
  source: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthGoal {
  id: string;
  user_id: string;
  type: 'sleep' | 'water' | 'exercise' | 'diet' | 'mood' | 'weight' | 'blood_pressure' | 'heart_rate' | 'steps' | 'calories';
  target_value: Record<string, any>;
  period: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  progress?: HealthGoalProgress;
}

export interface HealthGoalProgress {
  current_value: number;
  target_value: Record<string, any>;
  percentage: number;
  is_achieved: boolean;
  period_start: string;
  period_end: string;
}

export interface HealthIntegration {
  id: string;
  user_id: string;
  provider: 'google_fit' | 'apple_health' | 'fitbit' | 'samsung_health';
  is_enabled: boolean;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  sync_settings: Record<string, any>;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// Request/Response types for Habits and Health
export interface CreateHabitRequest {
  title: string;
  description?: string;
  cadence?: 'daily' | 'weekly' | 'monthly' | 'custom';
  cadence_config?: Record<string, any>;
  target_value?: number;
  target_unit?: string;
  color?: string;
  icon?: string;
  reminders?: any[];
}

export interface UpdateHabitRequest extends Partial<CreateHabitRequest> {
  is_active?: boolean;
}

export interface HabitCheckInRequest {
  value?: number;
  notes?: string;
  mood_rating?: number;
  logged_at?: string;
}

export interface CreateHealthLogRequest {
  type: 'sleep' | 'water' | 'exercise' | 'diet' | 'mood' | 'weight' | 'blood_pressure' | 'heart_rate' | 'steps' | 'calories';
  value: Record<string, any>;
  start_time: string;
  end_time?: string;
  notes?: string;
  source?: string;
  external_id?: string;
}

export interface CreateHealthGoalRequest {
  type: 'sleep' | 'water' | 'exercise' | 'diet' | 'mood' | 'weight' | 'blood_pressure' | 'heart_rate' | 'steps' | 'calories';
  target_value: Record<string, any>;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface HealthTrendData {
  date: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  count: number;
}

export interface HeatmapData {
  date: string;
  completed: boolean;
  value: number;
  target: number;
}

// Finance types
export interface FinancialAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  currency: string;
  initial_balance: number;
  current_balance: number;
  credit_limit?: number;
  interest_rate?: number;
  bank_name?: string;
  account_number?: string;
  routing_number?: string;
  is_active: boolean;
  is_hidden: boolean;
  external_account_id?: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  parent_category_id?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  notes?: string;
  transaction_date: string;
  posted_date?: string;
  transfer_account_id?: string;
  transfer_transaction_id?: string;
  recurring_rule?: string;
  parent_transaction_id?: string;
  external_transaction_id?: string;
  external_source?: string;
  is_pending: boolean;
  is_reconciled: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  tracked_accounts: string[];
  alert_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  next_due_date: string;
  transfer_account_id?: string;
  is_active: boolean;
  auto_create: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  goal_type: string;
  tracked_accounts: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankingIntegration {
  id: string;
  user_id: string;
  provider: string;
  institution_id: string;
  institution_name: string;
  access_token?: string;
  item_id?: string;
  is_active: boolean;
  last_sync_at?: string;
  sync_status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Request/Response types for Finance
export interface CreateAccountRequest {
  name: string;
  type: 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  currency?: string;
  initial_balance?: number;
  credit_limit?: number;
  interest_rate?: number;
  bank_name?: string;
  account_number?: string;
  routing_number?: string;
}

export interface UpdateAccountRequest extends Partial<CreateAccountRequest> {
  is_active?: boolean;
  is_hidden?: boolean;
}

export interface CreateTransactionRequest {
  account_id: string;
  category_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  notes?: string;
  transaction_date?: string;
  transfer_account_id?: string;
  recurring_rule?: string;
  tags?: string[];
}

export interface CreateBudgetRequest {
  name: string;
  category_id: string;
  amount: number;
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date?: string;
  end_date?: string;
  tracked_accounts?: string[];
  alert_percentage?: number;
}

export interface FinancialInsights {
  account_summary: {
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    liquid_assets: number;
    account_breakdown: any;
  };
  monthly_spending: Array<{
    category_id: string;
    category_name: string;
    category_color: string;
    total_amount: number;
    transaction_count: number;
  }>;
  budget_progress: Array<{
    budget_id: string;
    budget_name: string;
    category_name: string;
    budget_amount: number;
    spent_amount: number;
    remaining_amount: number;
    percentage_used: number;
    is_over_budget: boolean;
    days_remaining: number;
  }>;
  cash_flow: Array<{
    month_year: string;
    month_date: string;
    total_income: number;
    total_expenses: number;
    net_cash_flow: number;
    transaction_count: number;
  }>;
  savings_progress: Array<{
    goal_id: string;
    goal_name: string;
    target_amount: number;
    current_amount: number;
    progress_percentage: number;
    target_date?: string;
    days_remaining?: number;
    monthly_target?: number;
    is_on_track: boolean;
  }>;
  recurring_due: Array<{
    recurring_id: string;
    name: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    next_due_date: string;
    days_until_due: number;
    account_name: string;
    category_name?: string;
  }>;
  alerts: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    data?: any;
  }>;
}

// Faith types
export interface QuranSurah {
  id: number;
  name_arabic: string;
  name_english: string;
  name_dhivehi?: string;
  revelation_place: string;
  verse_count: number;
  order_number: number;
  created_at: string;
}

export interface QuranVerse {
  id: string;
  surah_id: number;
  verse_number: number;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  transliteration?: string;
  audio_url?: string;
  created_at: string;
}

export interface SalatLog {
  id: string;
  user_id: string;
  prayer_name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  prayer_date: string;
  status: 'completed' | 'missed' | 'qada';
  logged_at: string;
  is_congregation: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuranReadingSession {
  id: string;
  user_id: string;
  surah_id: number;
  start_verse: number;
  end_verse: number;
  duration_minutes?: number;
  session_date: string;
  notes?: string;
  created_at: string;
}

export interface HadithCollection {
  id: string;
  name_arabic: string;
  name_english: string;
  name_dhivehi?: string;
  description?: string;
  total_hadith: number;
  created_at: string;
}

export interface Hadith {
  id: string;
  collection_id: string;
  book_number?: number;
  hadith_number?: number;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  narrator?: string;
  grade?: 'sahih' | 'hasan' | 'daif' | 'mawdu';
  category?: string;
  tags: string[];
  reference?: string;
  created_at: string;
}

export interface Dua {
  id: string;
  title_arabic: string;
  title_english: string;
  title_dhivehi?: string;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  transliteration?: string;
  category: string;
  occasion?: string;
  reference?: string;
  audio_url?: string;
  tags: string[];
  created_at: string;
}

export interface Azkar {
  id: string;
  title_arabic: string;
  title_english: string;
  title_dhivehi?: string;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  transliteration?: string;
  type: 'morning' | 'evening' | 'after_prayer' | 'before_sleep' | 'general';
  repetition_count: number;
  reference?: string;
  audio_url?: string;
  created_at: string;
}

export interface AzkarReminder {
  id: string;
  user_id: string;
  azkar_id: string;
  reminder_time: string;
  is_enabled: boolean;
  days_of_week: number[];
  last_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FaithSettings {
  id: string;
  user_id: string;
  prayer_notifications: boolean;
  azkar_notifications: boolean;
  preferred_translation: string;
  preferred_reciter: string;
  auto_play_audio: boolean;
  font_size: number;
  arabic_font: string;
  created_at: string;
  updated_at: string;
}

export interface FaithBookmark {
  id: string;
  user_id: string;
  bookmark_type: string;
  reference_id: string;
  notes?: string;
  created_at: string;
}

// Request/Response types for Faith
export interface LogSalatRequest {
  prayer_name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  prayer_date?: string;
  status?: 'completed' | 'missed' | 'qada';
  is_congregation?: boolean;
  notes?: string;
}

export interface CreateReadingSessionRequest {
  surah_id: number;
  start_verse: number;
  end_verse: number;
  duration_minutes?: number;
  notes?: string;
}

export interface CreateAzkarReminderRequest {
  azkar_id: string;
  reminder_time: string;
  days_of_week?: number[];
  is_enabled?: boolean;
}

export interface FaithDashboardSummary {
  today_prayers_completed: number;
  today_prayers_total: number;
  current_salat_streak: number;
  quran_sessions_this_week: number;
  quran_minutes_this_week: number;
  bookmarks_count: number;
  last_reading_session?: string;
  today_salat: Array<{
    prayer_name: string;
    status: string;
    is_congregation: boolean;
    logged_at?: string;
  }>;
  recent_quran_sessions: Array<{
    id: string;
    surah_id: number;
    start_verse: number;
    end_verse: number;
    duration_minutes?: number;
    session_date: string;
    quran_surahs: {
      name_arabic: string;
      name_english: string;
      name_dhivehi?: string;
    };
  }>;
  quran_progress: {
    total_sessions: number;
    total_minutes: number;
    unique_surahs: number;
    verses_read: number;
    avg_session_duration: number;
    reading_streak: number;
  };
  salat_streak: {
    current_streak: number;
    longest_streak: number;
    total_prayers: number;
    completion_rate: number;
  };
  azkar_reminders: Array<{
    id: string;
    reminder_time: string;
    is_enabled: boolean;
    azkar: {
      title_english: string;
      type: string;
    };
  }>;
}

// Settings types
export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  timezone: string;
  language: string;
  country?: string;
  city?: string;
  created_at: string;
  updated_at: string;
}

export interface UserTheme {
  id: string;
  user_id: string;
  theme_name: 'light' | 'dark' | 'islamic' | 'auto';
  custom_colors: any;
  font_family: string;
  font_size: 'small' | 'medium' | 'large' | 'extra_large';
  arabic_font: string;
  compact_mode: boolean;
  animations_enabled: boolean;
  high_contrast: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;

  task_notifications: boolean;
  task_reminders: boolean;
  task_deadlines: boolean;

  habit_notifications: boolean;
  habit_reminders: boolean;
  habit_streaks: boolean;

  salat_notifications: boolean;
  salat_reminders: boolean;
  azkar_reminders: boolean;

  finance_notifications: boolean;
  budget_alerts: boolean;
  bill_reminders: boolean;

  health_notifications: boolean;
  medication_reminders: boolean;
  appointment_reminders: boolean;

  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  weekend_notifications: boolean;

  notification_sound: string;
  vibration_enabled: boolean;

  created_at: string;
  updated_at: string;
}

export interface UserIntegration {
  id: string;
  user_id: string;
  integration_type: string;
  integration_name: string;
  is_enabled: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  sync_error?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  api_key?: string;
  api_secret?: string;
  settings: any;
  permissions: any;
  created_at: string;
  updated_at: string;
}

export interface PrivacySettings {
  id: string;
  user_id: string;
  profile_visibility: 'public' | 'friends' | 'private';
  show_activity_status: boolean;
  show_last_seen: boolean;
  analytics_enabled: boolean;
  crash_reporting: boolean;
  usage_statistics: boolean;
  marketing_emails: boolean;
  two_factor_enabled: boolean;
  login_notifications: boolean;
  session_timeout: number;
  auto_delete_old_data: boolean;
  data_retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface DataExport {
  id: string;
  user_id: string;
  export_type: 'full' | 'partial' | 'module_specific';
  export_format: 'json' | 'csv' | 'pdf';
  modules: string[];
  date_range_start?: string;
  date_range_end?: string;
  include_deleted: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size?: number;
  expires_at?: string;
  requested_at: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
}

export interface AccountDeletion {
  id: string;
  user_id: string;
  reason?: string;
  feedback?: string;
  delete_immediately: boolean;
  export_data_before_deletion: boolean;
  anonymize_data: boolean;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  scheduled_deletion_date?: string;
  requested_at: string;
  processed_at?: string;
  cancelled_at?: string;
  created_at: string;
}

export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  preference_value: any;
  preference_type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  module?: string;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Request/Response types for Settings
export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  timezone?: string;
  language?: string;
  country?: string;
  city?: string;
}

export interface ThemeUpdateRequest {
  theme_name?: 'light' | 'dark' | 'islamic' | 'auto';
  custom_colors?: any;
  font_family?: string;
  font_size?: 'small' | 'medium' | 'large' | 'extra_large';
  arabic_font?: string;
  compact_mode?: boolean;
  animations_enabled?: boolean;
  high_contrast?: boolean;
}

export interface NotificationUpdateRequest {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  task_notifications?: boolean;
  task_reminders?: boolean;
  task_deadlines?: boolean;
  habit_notifications?: boolean;
  habit_reminders?: boolean;
  habit_streaks?: boolean;
  salat_notifications?: boolean;
  salat_reminders?: boolean;
  azkar_reminders?: boolean;
  finance_notifications?: boolean;
  budget_alerts?: boolean;
  bill_reminders?: boolean;
  health_notifications?: boolean;
  medication_reminders?: boolean;
  appointment_reminders?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  weekend_notifications?: boolean;
  notification_sound?: string;
  vibration_enabled?: boolean;
}

export interface IntegrationCreateRequest {
  integration_type: string;
  integration_name: string;
  is_enabled?: boolean;
  sync_frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  settings?: any;
  permissions?: any;
}

export interface ExportRequest {
  export_format: 'json' | 'csv' | 'pdf';
  modules?: string[];
  date_range_start?: string;
  date_range_end?: string;
  include_deleted?: boolean;
}

export interface AccountDeletionRequest {
  reason?: string;
  feedback?: string;
  delete_immediately?: boolean;
  export_data_before_deletion?: boolean;
  anonymize_data?: boolean;
  confirm_deletion: boolean;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface EmailChangeRequest {
  new_email: string;
  password: string;
}

export interface SettingsSummary {
  profile: UserProfile;
  theme: UserTheme;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  integrations: UserIntegration[];
  preferences: Record<string, any>;
  data_summary: {
    total_records: number;
    storage_used: string;
    account_age_days: number;
    modules: Record<string, number>;
  };
  security_info: {
    email: string;
    email_confirmed: boolean;
    phone?: string;
    phone_confirmed: boolean;
    two_factor_enabled: boolean;
    last_sign_in?: string;
    created_at: string;
  };
}

// Notification types
export interface PushToken {
  id: string;
  user_id: string;
  device_id: string;
  platform: 'web' | 'android' | 'ios';
  token: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTypeConfig {
  id: string;
  type_key: string;
  name: string;
  description?: string;
  category: 'task' | 'habit' | 'faith' | 'finance' | 'health' | 'system';
  default_title: string;
  default_body: string;
  icon?: string;
  sound: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type_id: string;
  title: string;
  body: string;
  data: any;
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled' | 'snoozed';
  is_reminder: boolean;
  reminder_type?: 'task_due' | 'habit_checkin' | 'salat_reminder' | 'azkar_alert' | 'bill_due' | 'appointment' | 'medication';
  reference_type?: 'task' | 'habit' | 'salat' | 'azkar' | 'transaction' | 'appointment' | 'medication';
  reference_id?: string;
  repeat_pattern: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  repeat_interval: number;
  repeat_days?: number[];
  repeat_until?: string;
  repeat_count?: number;
  snooze_until?: string;
  snooze_count: number;
  max_snooze_count: number;
  delivery_methods: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  notification_id: string;
  user_id: string;
  delivery_method: 'push' | 'email' | 'sms';
  platform?: 'web' | 'android' | 'ios';
  device_token?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked' | 'dismissed';
  external_id?: string;
  response_data?: any;
  error_message?: string;
  sent_at: string;
  delivered_at?: string;
  clicked_at?: string;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type_id: string;
  is_enabled: boolean;
  delivery_methods: string[];
  sound: string;
  vibration: boolean;
  advance_minutes: number;
  quiet_hours_override: boolean;
  max_repeats: number;
  repeat_interval_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationAction {
  id: string;
  notification_type_id: string;
  action_key: string;
  label: string;
  action_type: 'button' | 'input' | 'quick_reply';
  icon?: string;
  is_destructive: boolean;
  sort_order: number;
  created_at: string;
}

export interface NotificationInteraction {
  id: string;
  notification_id: string;
  user_id: string;
  action_type: 'viewed' | 'clicked' | 'dismissed' | 'snoozed' | 'completed' | 'custom';
  action_key?: string;
  action_data?: any;
  interacted_at: string;
  created_at: string;
}

export interface NotificationBatch {
  id: string;
  name: string;
  description?: string;
  notification_type_id: string;
  total_notifications: number;
  sent_notifications: number;
  failed_notifications: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// Request/Response types for Notifications
export interface CreateNotificationRequest {
  notification_type: string;
  title: string;
  body: string;
  scheduled_at?: string;
  data?: any;
  reference_type?: string;
  reference_id?: string;
  repeat_pattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  repeat_interval?: number;
  repeat_days?: number[];
  repeat_until?: string;
  repeat_count?: number;
  delivery_methods?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface UpdateNotificationRequest {
  title?: string;
  body?: string;
  scheduled_at?: string;
  data?: any;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled' | 'snoozed';
  delivery_methods?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SnoozeNotificationRequest {
  snooze_minutes?: number;
}

export interface RegisterPushTokenRequest {
  device_id: string;
  platform: 'web' | 'android' | 'ios';
  token: string;
}

export interface UpdatePushTokenRequest {
  token?: string;
  is_active?: boolean;
}

export interface NotificationInteractionRequest {
  notification_id: string;
  action_type: 'viewed' | 'clicked' | 'dismissed' | 'snoozed' | 'completed' | 'custom';
  action_key?: string;
  action_data?: any;
}

export interface BulkCreateNotificationsRequest {
  notifications: CreateNotificationRequest[];
}

export interface NotificationStats {
  total_notifications: number;
  sent_notifications: number;
  clicked_notifications: number;
  snoozed_notifications: number;
  by_type: Record<string, any>;
  by_day: Record<string, number>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  badge?: string;
  sound?: string;
  clickAction?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  platform: 'web' | 'android' | 'ios';
  token: string;
}
