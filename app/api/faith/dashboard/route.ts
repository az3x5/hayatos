import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get comprehensive faith dashboard data
    const { data: dashboardSummary, error: summaryError } = await supabase
      .rpc('get_faith_dashboard_summary', {
        user_uuid: session.user.id,
      });

    if (summaryError) {
      console.error('Error fetching dashboard summary:', summaryError);
      return NextResponse.json({ error: 'Failed to fetch dashboard summary' }, { status: 500 });
    }

    // Get today's salat status
    const { data: todaySalat, error: salatError } = await supabase
      .rpc('get_daily_salat_status', {
        user_uuid: session.user.id,
        target_date: new Date().toISOString().split('T')[0],
      });

    if (salatError) {
      console.error('Error fetching today salat:', salatError);
    }

    // Get recent Quran reading sessions
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('quran_reading_sessions')
      .select(`
        *,
        quran_surahs(name_arabic, name_english, name_dhivehi)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('Error fetching recent sessions:', sessionsError);
    }

    // Get Quran reading progress
    const { data: quranProgress, error: progressError } = await supabase
      .rpc('get_quran_reading_progress', {
        user_uuid: session.user.id,
        days_back: 30,
      });

    if (progressError) {
      console.error('Error fetching Quran progress:', progressError);
    }

    // Get salat streak information
    const { data: salatStreak, error: streakError } = await supabase
      .rpc('calculate_salat_streak', {
        user_uuid: session.user.id,
      });

    if (streakError) {
      console.error('Error fetching salat streak:', streakError);
    }

    // Get monthly salat statistics
    const { data: monthlyStats, error: monthlyError } = await supabase
      .rpc('get_monthly_salat_stats', {
        user_uuid: session.user.id,
      });

    if (monthlyError) {
      console.error('Error fetching monthly stats:', monthlyError);
    }

    // Get user's bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('faith_bookmarks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
    }

    // Get active azkar reminders
    const { data: azkarReminders, error: remindersError } = await supabase
      .from('azkar_reminders')
      .select(`
        *,
        azkar(title_english, type)
      `)
      .eq('user_id', session.user.id)
      .eq('is_enabled', true)
      .order('reminder_time');

    if (remindersError) {
      console.error('Error fetching azkar reminders:', remindersError);
    }

    // Compile dashboard data
    const dashboardData = {
      summary: dashboardSummary?.[0] || {
        today_prayers_completed: 0,
        today_prayers_total: 5,
        current_salat_streak: 0,
        quran_sessions_this_week: 0,
        quran_minutes_this_week: 0,
        bookmarks_count: 0,
        last_reading_session: null,
      },
      today_salat: todaySalat || [],
      recent_quran_sessions: recentSessions || [],
      quran_progress: quranProgress?.[0] || {
        total_sessions: 0,
        total_minutes: 0,
        unique_surahs: 0,
        verses_read: 0,
        avg_session_duration: 0,
        reading_streak: 0,
      },
      salat_streak: salatStreak?.[0] || {
        current_streak: 0,
        longest_streak: 0,
        total_prayers: 0,
        completion_rate: 0,
      },
      monthly_salat_stats: monthlyStats || [],
      bookmarks: bookmarks || [],
      azkar_reminders: azkarReminders || [],
    };

    return NextResponse.json({ data: dashboardData });

  } catch (error) {
    console.error('Error in GET /api/faith/dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'quick_salat') {
      return handleQuickSalatLog(supabase, request, session.user.id);
    }

    if (action === 'settings') {
      return handleUpdateSettings(supabase, request, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/faith/dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleQuickSalatLog(supabase: any, request: NextRequest, userId: string) {
  const { prayer_name, status = 'completed' } = await request.json();

  if (!prayer_name) {
    return NextResponse.json({ error: 'Prayer name is required' }, { status: 400 });
  }

  const validPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  if (!validPrayers.includes(prayer_name)) {
    return NextResponse.json({ error: 'Invalid prayer name' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Check if already logged
  const { data: existingLog } = await supabase
    .from('salat_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('prayer_name', prayer_name)
    .eq('prayer_date', today)
    .single();

  if (existingLog) {
    // Update existing log
    const { data: updatedLog, error } = await supabase
      .from('salat_logs')
      .update({
        status: status,
        logged_at: new Date().toISOString(),
      })
      .eq('id', existingLog.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quick salat log:', error);
      return NextResponse.json({ error: 'Failed to update prayer log' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: updatedLog,
      message: 'Prayer updated successfully' 
    });
  } else {
    // Create new log
    const { data: newLog, error } = await supabase
      .from('salat_logs')
      .insert({
        user_id: userId,
        prayer_name: prayer_name,
        prayer_date: today,
        status: status,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quick salat log:', error);
      return NextResponse.json({ error: 'Failed to log prayer' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: newLog,
      message: 'Prayer logged successfully' 
    }, { status: 201 });
  }
}

async function handleUpdateSettings(supabase: any, request: NextRequest, userId: string) {
  const settings = await request.json();

  // Get existing settings
  const { data: existingSettings } = await supabase
    .from('faith_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingSettings) {
    // Update existing settings
    const { data: updatedSettings, error } = await supabase
      .from('faith_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating faith settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: updatedSettings,
      message: 'Settings updated successfully' 
    });
  } else {
    // Create new settings
    const { data: newSettings, error } = await supabase
      .from('faith_settings')
      .insert({
        user_id: userId,
        ...settings,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating faith settings:', error);
      return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: newSettings,
      message: 'Settings created successfully' 
    }, { status: 201 });
  }
}
