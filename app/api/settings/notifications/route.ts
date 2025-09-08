import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const notificationUpdateSchema = z.object({
  // Global settings
  notifications_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  
  // Module-specific notifications
  task_notifications: z.boolean().optional(),
  task_reminders: z.boolean().optional(),
  task_deadlines: z.boolean().optional(),
  
  habit_notifications: z.boolean().optional(),
  habit_reminders: z.boolean().optional(),
  habit_streaks: z.boolean().optional(),
  
  salat_notifications: z.boolean().optional(),
  salat_reminders: z.boolean().optional(),
  azkar_reminders: z.boolean().optional(),
  
  finance_notifications: z.boolean().optional(),
  budget_alerts: z.boolean().optional(),
  bill_reminders: z.boolean().optional(),
  
  health_notifications: z.boolean().optional(),
  medication_reminders: z.boolean().optional(),
  appointment_reminders: z.boolean().optional(),
  
  // Timing settings
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quiet_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  weekend_notifications: z.boolean().optional(),
  
  // Notification methods
  notification_sound: z.string().optional(),
  vibration_enabled: z.boolean().optional(),
});

const testNotificationSchema = z.object({
  type: z.enum(['email', 'push', 'sms']),
  message: z.string().min(1).max(200).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notification settings
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification settings:', error);
      return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
    }

    // If no settings exist, create default ones
    if (!settings) {
      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: session.user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating notification settings:', createError);
        return NextResponse.json({ error: 'Failed to create notification settings' }, { status: 500 });
      }

      return NextResponse.json({ data: newSettings });
    }

    return NextResponse.json({ data: settings });

  } catch (error) {
    console.error('Error in GET /api/settings/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = notificationUpdateSchema.parse(body);

    // Update notification settings
    const { data: updatedSettings, error } = await supabase
      .from('notification_settings')
      .update(validatedData)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification settings:', error);
      return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: updatedSettings,
      message: 'Notification settings updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/settings/notifications:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
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

    if (action === 'test') {
      return handleTestNotification(supabase, request, session.user);
    }

    if (action === 'reset') {
      return handleResetNotifications(supabase, session.user.id);
    }

    if (action === 'bulk_update') {
      return handleBulkUpdate(supabase, request, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/settings/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleTestNotification(supabase: any, request: NextRequest, user: any) {
  try {
    const body = await request.json();
    const validatedData = testNotificationSchema.parse(body);

    const testMessage = validatedData.message || 'This is a test notification from HayatOS';

    // Get user's notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Notification settings not found' }, { status: 404 });
    }

    // Check if the notification type is enabled
    const typeEnabled = {
      email: settings.email_notifications,
      push: settings.push_notifications,
      sms: settings.sms_notifications,
    };

    if (!typeEnabled[validatedData.type]) {
      return NextResponse.json({ 
        error: `${validatedData.type} notifications are disabled`,
        suggestion: `Enable ${validatedData.type} notifications in your settings first`
      }, { status: 400 });
    }

    // Simulate sending notification (in real implementation, you'd use actual services)
    let result = { success: false, message: '' };

    switch (validatedData.type) {
      case 'email':
        // Here you would integrate with email service (SendGrid, AWS SES, etc.)
        result = {
          success: true,
          message: `Test email sent to ${user.email}`
        };
        break;

      case 'push':
        // Here you would integrate with push notification service (FCM, APNs, etc.)
        result = {
          success: true,
          message: 'Test push notification sent to your device'
        };
        break;

      case 'sms':
        // Here you would integrate with SMS service (Twilio, AWS SNS, etc.)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('phone_number')
          .eq('user_id', user.id)
          .single();

        if (!profile?.phone_number) {
          return NextResponse.json({ 
            error: 'Phone number not found',
            suggestion: 'Add a phone number to your profile to receive SMS notifications'
          }, { status: 400 });
        }

        result = {
          success: true,
          message: `Test SMS sent to ${profile.phone_number}`
        };
        break;
    }

    return NextResponse.json({ 
      data: result,
      message: 'Test notification sent successfully' 
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}

async function handleResetNotifications(supabase: any, userId: string) {
  try {
    // Reset to default notification settings
    const { data: resetSettings, error } = await supabase
      .from('notification_settings')
      .update({
        notifications_enabled: true,
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        
        task_notifications: true,
        task_reminders: true,
        task_deadlines: true,
        
        habit_notifications: true,
        habit_reminders: true,
        habit_streaks: true,
        
        salat_notifications: true,
        salat_reminders: true,
        azkar_reminders: true,
        
        finance_notifications: true,
        budget_alerts: true,
        bill_reminders: true,
        
        health_notifications: true,
        medication_reminders: false,
        appointment_reminders: true,
        
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
        weekend_notifications: true,
        
        notification_sound: 'default',
        vibration_enabled: true,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error resetting notification settings:', error);
      return NextResponse.json({ error: 'Failed to reset notification settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: resetSettings,
      message: 'Notification settings reset to default successfully' 
    });

  } catch (error) {
    console.error('Error resetting notifications:', error);
    return NextResponse.json({ error: 'Failed to reset notification settings' }, { status: 500 });
  }
}

async function handleBulkUpdate(supabase: any, request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    const { category, enabled } = body;

    if (!category || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Category and enabled status required' }, { status: 400 });
    }

    let updateData: any = {};

    switch (category) {
      case 'tasks':
        updateData = {
          task_notifications: enabled,
          task_reminders: enabled,
          task_deadlines: enabled,
        };
        break;

      case 'habits':
        updateData = {
          habit_notifications: enabled,
          habit_reminders: enabled,
          habit_streaks: enabled,
        };
        break;

      case 'faith':
        updateData = {
          salat_notifications: enabled,
          salat_reminders: enabled,
          azkar_reminders: enabled,
        };
        break;

      case 'finance':
        updateData = {
          finance_notifications: enabled,
          budget_alerts: enabled,
          bill_reminders: enabled,
        };
        break;

      case 'health':
        updateData = {
          health_notifications: enabled,
          medication_reminders: enabled,
          appointment_reminders: enabled,
        };
        break;

      case 'all':
        updateData = {
          task_notifications: enabled,
          task_reminders: enabled,
          task_deadlines: enabled,
          habit_notifications: enabled,
          habit_reminders: enabled,
          habit_streaks: enabled,
          salat_notifications: enabled,
          salat_reminders: enabled,
          azkar_reminders: enabled,
          finance_notifications: enabled,
          budget_alerts: enabled,
          bill_reminders: enabled,
          health_notifications: enabled,
          medication_reminders: enabled,
          appointment_reminders: enabled,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const { data: updatedSettings, error } = await supabase
      .from('notification_settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error bulk updating notifications:', error);
      return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: updatedSettings,
      message: `${category} notifications ${enabled ? 'enabled' : 'disabled'} successfully` 
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
  }
}
