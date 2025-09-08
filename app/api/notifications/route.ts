import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createNotificationSchema = z.object({
  notification_type: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  scheduled_at: z.string().datetime().optional(),
  data: z.record(z.any()).optional(),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().optional(),
  repeat_pattern: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']).default('none'),
  repeat_interval: z.number().min(1).default(1),
  repeat_days: z.array(z.number().min(1).max(7)).optional(),
  repeat_until: z.string().datetime().optional(),
  repeat_count: z.number().min(1).optional(),
  delivery_methods: z.array(z.enum(['push', 'email', 'sms'])).default(['push']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

const updateNotificationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(500).optional(),
  scheduled_at: z.string().datetime().optional(),
  data: z.record(z.any()).optional(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled', 'snoozed']).optional(),
  delivery_methods: z.array(z.enum(['push', 'email', 'sms'])).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

const snoozeNotificationSchema = z.object({
  snooze_minutes: z.number().min(1).max(1440).default(10), // Max 24 hours
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (action === 'stats') {
      return handleGetStats(supabase, session.user.id);
    }

    if (action === 'types') {
      return handleGetNotificationTypes(supabase);
    }

    // Get user notifications
    let query = supabase
      .from('notifications')
      .select(`
        id,
        title,
        body,
        data,
        scheduled_at,
        sent_at,
        status,
        is_reminder,
        reminder_type,
        reference_type,
        reference_id,
        repeat_pattern,
        repeat_interval,
        repeat_days,
        repeat_until,
        repeat_count,
        snooze_until,
        snooze_count,
        max_snooze_count,
        delivery_methods,
        priority,
        created_at,
        updated_at,
        notification_types!inner(
          type_key,
          name,
          category,
          icon,
          sound
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('notification_types.type_key', type);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({ data: notifications || [] });

  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
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

    if (action === 'snooze') {
      return handleSnoozeNotification(supabase, request, session.user.id);
    }

    if (action === 'interact') {
      return handleNotificationInteraction(supabase, request, session.user.id);
    }

    if (action === 'bulk_create') {
      return handleBulkCreateNotifications(supabase, request, session.user.id);
    }

    // Create single notification
    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    // Use database function to create notification
    const { data: result, error } = await supabase
      .rpc('create_notification', {
        user_uuid: session.user.id,
        notification_type_key: validatedData.notification_type,
        title_text: validatedData.title,
        body_text: validatedData.body,
        scheduled_time: validatedData.scheduled_at ? new Date(validatedData.scheduled_at).toISOString() : new Date().toISOString(),
        notification_data: validatedData.data || {},
        reference_type_param: validatedData.reference_type,
        reference_id_param: validatedData.reference_id,
        repeat_pattern_param: validatedData.repeat_pattern,
        delivery_methods_param: validatedData.delivery_methods
      });

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    if (!result[0]?.success) {
      return NextResponse.json({ error: result[0]?.message || 'Failed to create notification' }, { status: 400 });
    }

    return NextResponse.json({ 
      data: { id: result[0].notification_id },
      message: 'Notification created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
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

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateNotificationSchema.parse(body);

    // Update notification
    const { data: updatedNotification, error } = await supabase
      .from('notifications')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    if (!updatedNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      data: updatedNotification,
      message: 'Notification updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/notifications:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (action === 'cancel' && notificationId) {
      // Cancel notification using database function
      const { data: result, error } = await supabase
        .rpc('cancel_notification', {
          notification_uuid: notificationId,
          user_uuid: session.user.id
        });

      if (error) {
        console.error('Error cancelling notification:', error);
        return NextResponse.json({ error: 'Failed to cancel notification' }, { status: 500 });
      }

      if (!result) {
        return NextResponse.json({ error: 'Notification not found or cannot be cancelled' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Notification cancelled successfully' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // Delete notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notification deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGetStats(supabase: any, userId: string) {
  const { data: stats, error } = await supabase
    .rpc('get_notification_stats', {
      user_uuid: userId,
      days_back: 30
    });

  if (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json({ error: 'Failed to fetch notification stats' }, { status: 500 });
  }

  return NextResponse.json({ data: stats[0] || {} });
}

async function handleGetNotificationTypes(supabase: any) {
  const { data: types, error } = await supabase
    .from('notification_types')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching notification types:', error);
    return NextResponse.json({ error: 'Failed to fetch notification types' }, { status: 500 });
  }

  return NextResponse.json({ data: types || [] });
}

async function handleSnoozeNotification(supabase: any, request: NextRequest, userId: string) {
  const url = new URL(request.url);
  const notificationId = url.searchParams.get('id');

  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  }

  const body = await request.json();
  const validatedData = snoozeNotificationSchema.parse(body);

  const { data: result, error } = await supabase
    .rpc('snooze_notification', {
      notification_uuid: notificationId,
      snooze_minutes: validatedData.snooze_minutes
    });

  if (error) {
    console.error('Error snoozing notification:', error);
    return NextResponse.json({ error: 'Failed to snooze notification' }, { status: 500 });
  }

  if (!result[0]?.success) {
    return NextResponse.json({ error: result[0]?.message || 'Failed to snooze notification' }, { status: 400 });
  }

  return NextResponse.json({ 
    data: result[0],
    message: 'Notification snoozed successfully' 
  });
}

async function handleNotificationInteraction(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const { notification_id, action_type, action_key, action_data } = body;

  if (!notification_id || !action_type) {
    return NextResponse.json({ error: 'Notification ID and action type required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('notification_interactions')
    .insert({
      notification_id,
      user_id: userId,
      action_type,
      action_key,
      action_data: action_data || {},
      interacted_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error recording notification interaction:', error);
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Interaction recorded successfully' });
}

async function handleBulkCreateNotifications(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const { notifications } = body;

  if (!Array.isArray(notifications) || notifications.length === 0) {
    return NextResponse.json({ error: 'Notifications array required' }, { status: 400 });
  }

  const results = [];
  const errors = [];

  for (const notification of notifications) {
    try {
      const validatedData = createNotificationSchema.parse(notification);
      
      const { data: result, error } = await supabase
        .rpc('create_notification', {
          user_uuid: userId,
          notification_type_key: validatedData.notification_type,
          title_text: validatedData.title,
          body_text: validatedData.body,
          scheduled_time: validatedData.scheduled_at ? new Date(validatedData.scheduled_at).toISOString() : new Date().toISOString(),
          notification_data: validatedData.data || {},
          reference_type_param: validatedData.reference_type,
          reference_id_param: validatedData.reference_id,
          repeat_pattern_param: validatedData.repeat_pattern,
          delivery_methods_param: validatedData.delivery_methods
        });

      if (error) {
        errors.push({ notification, error: error.message });
      } else if (result[0]?.success) {
        results.push({ id: result[0].notification_id });
      } else {
        errors.push({ notification, error: result[0]?.message || 'Unknown error' });
      }
    } catch (error) {
      errors.push({ notification, error: error instanceof Error ? error.message : 'Validation error' });
    }
  }

  return NextResponse.json({ 
    data: { 
      created: results.length,
      failed: errors.length,
      results,
      errors 
    },
    message: `Created ${results.length} notifications, ${errors.length} failed` 
  });
}
