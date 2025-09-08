import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const preferenceUpdateSchema = z.object({
  preference_key: z.string().min(1),
  preference_value: z.any(),
  preference_type: z.enum(['string', 'number', 'boolean', 'object', 'array']).default('string'),
  module: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'all') {
      return handleGetAllSettings(supabase, session.user.id);
    }

    if (action === 'preferences') {
      return handleGetPreferences(supabase, session.user.id);
    }

    if (action === 'app_settings') {
      return handleGetAppSettings(supabase);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'initialize') {
      return handleInitializeSettings(supabase, session.user.id);
    }

    if (action === 'preference') {
      return handleUpdatePreference(supabase, request, session.user.id);
    }

    if (action === 'reset') {
      return handleResetSettings(supabase, session.user.id);
    }

    if (action === 'backup') {
      return handleBackupSettings(supabase, session.user.id);
    }

    if (action === 'restore') {
      return handleRestoreSettings(supabase, request, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGetAllSettings(supabase: any, userId: string) {
  // Get complete user settings using database function
  const { data: settings, error } = await supabase
    .rpc('get_user_settings', {
      user_uuid: userId
    });

  if (error) {
    console.error('Error fetching all settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }

  return NextResponse.json({ data: settings[0] || {} });
}

async function handleGetPreferences(supabase: any, userId: string) {
  const { data: preferences, error } = await supabase
    .from('user_preferences')
    .select('preference_key, preference_value, preference_type, module')
    .eq('user_id', userId)
    .order('preference_key');

  if (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }

  // Transform to key-value object
  const preferencesObj = preferences?.reduce((acc: any, pref: any) => {
    acc[pref.preference_key] = {
      value: pref.preference_value,
      type: pref.preference_type,
      module: pref.module
    };
    return acc;
  }, {}) || {};

  return NextResponse.json({ data: preferencesObj });
}

async function handleGetAppSettings(supabase: any) {
  const { data: appSettings, error } = await supabase
    .rpc('get_app_settings');

  if (error) {
    console.error('Error fetching app settings:', error);
    return NextResponse.json({ error: 'Failed to fetch app settings' }, { status: 500 });
  }

  // Transform to key-value object
  const settingsObj = appSettings?.reduce((acc: any, setting: any) => {
    acc[setting.setting_key] = setting.setting_value;
    return acc;
  }, {}) || {};

  return NextResponse.json({ data: settingsObj });
}

async function handleInitializeSettings(supabase: any, userId: string) {
  // Initialize user settings using database function
  const { error } = await supabase
    .rpc('initialize_user_settings', {
      user_uuid: userId
    });

  if (error) {
    console.error('Error initializing settings:', error);
    return NextResponse.json({ error: 'Failed to initialize settings' }, { status: 500 });
  }

  // Get the initialized settings
  const { data: settings } = await supabase
    .rpc('get_user_settings', {
      user_uuid: userId
    });

  return NextResponse.json({ 
    data: settings[0] || {},
    message: 'Settings initialized successfully' 
  });
}

async function handleUpdatePreference(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = preferenceUpdateSchema.parse(body);

  // Update preference using database function
  const { data: result, error } = await supabase
    .rpc('update_user_preference', {
      user_uuid: userId,
      pref_key: validatedData.preference_key,
      pref_value: validatedData.preference_value,
      pref_type: validatedData.preference_type,
      pref_module: validatedData.module
    });

  if (error) {
    console.error('Error updating preference:', error);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: result[0],
    message: 'Preference updated successfully' 
  });
}

async function handleResetSettings(supabase: any, userId: string) {
  try {
    // Reset all user settings to defaults
    const resetOperations = [
      // Reset theme
      supabase
        .from('user_themes')
        .update({
          theme_name: 'light',
          custom_colors: {},
          font_family: 'Inter',
          font_size: 'medium',
          arabic_font: 'Amiri',
          compact_mode: false,
          animations_enabled: true,
          high_contrast: false,
        })
        .eq('user_id', userId),

      // Reset notifications
      supabase
        .from('notification_settings')
        .update({
          notifications_enabled: true,
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          task_notifications: true,
          habit_notifications: true,
          salat_notifications: true,
          finance_notifications: true,
          health_notifications: true,
          quiet_hours_enabled: false,
          notification_sound: 'default',
          vibration_enabled: true,
        })
        .eq('user_id', userId),

      // Reset privacy
      supabase
        .from('privacy_settings')
        .update({
          profile_visibility: 'private',
          show_activity_status: false,
          analytics_enabled: true,
          marketing_emails: false,
          two_factor_enabled: false,
          login_notifications: true,
        })
        .eq('user_id', userId),

      // Clear preferences
      supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
    ];

    await Promise.all(resetOperations);

    return NextResponse.json({ 
      message: 'All settings reset to defaults successfully' 
    });

  } catch (error) {
    console.error('Error resetting settings:', error);
    return NextResponse.json({ error: 'Failed to reset settings' }, { status: 500 });
  }
}

async function handleBackupSettings(supabase: any, userId: string) {
  try {
    // Get all user settings
    const { data: settings } = await supabase
      .rpc('get_user_settings', {
        user_uuid: userId
      });

    if (!settings || settings.length === 0) {
      return NextResponse.json({ error: 'No settings found to backup' }, { status: 404 });
    }

    // Create backup object
    const backup = {
      backup_date: new Date().toISOString(),
      user_id: userId,
      settings: settings[0],
      version: '1.0'
    };

    // Store backup as user preference
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preference_key: `settings_backup_${Date.now()}`,
        preference_value: backup,
        preference_type: 'object',
        module: 'settings'
      });

    return NextResponse.json({ 
      data: { backup_id: `settings_backup_${Date.now()}` },
      message: 'Settings backed up successfully' 
    });

  } catch (error) {
    console.error('Error backing up settings:', error);
    return NextResponse.json({ error: 'Failed to backup settings' }, { status: 500 });
  }
}

async function handleRestoreSettings(supabase: any, request: NextRequest, userId: string) {
  try {
    const { backup_id } = await request.json();

    if (!backup_id) {
      return NextResponse.json({ error: 'Backup ID required' }, { status: 400 });
    }

    // Get backup data
    const { data: backupPref, error } = await supabase
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', userId)
      .eq('preference_key', backup_id)
      .eq('module', 'settings')
      .single();

    if (error || !backupPref) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    const backup = backupPref.preference_value;
    const settings = backup.settings;

    // Restore settings
    const restoreOperations = [];

    if (settings.profile) {
      restoreOperations.push(
        supabase
          .from('user_profiles')
          .update(settings.profile)
          .eq('user_id', userId)
      );
    }

    if (settings.theme) {
      restoreOperations.push(
        supabase
          .from('user_themes')
          .update(settings.theme)
          .eq('user_id', userId)
      );
    }

    if (settings.notifications) {
      restoreOperations.push(
        supabase
          .from('notification_settings')
          .update(settings.notifications)
          .eq('user_id', userId)
      );
    }

    if (settings.privacy) {
      restoreOperations.push(
        supabase
          .from('privacy_settings')
          .update(settings.privacy)
          .eq('user_id', userId)
      );
    }

    await Promise.all(restoreOperations);

    return NextResponse.json({ 
      message: 'Settings restored successfully' 
    });

  } catch (error) {
    console.error('Error restoring settings:', error);
    return NextResponse.json({ error: 'Failed to restore settings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const key = url.searchParams.get('key');

    if (action === 'preference' && key) {
      // Delete specific preference
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', session.user.id)
        .eq('preference_key', key);

      if (error) {
        console.error('Error deleting preference:', error);
        return NextResponse.json({ error: 'Failed to delete preference' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Preference deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });

  } catch (error) {
    console.error('Error in DELETE /api/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
