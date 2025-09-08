import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const azkarQuerySchema = z.object({
  type: z.enum(['morning', 'evening', 'after_prayer', 'before_sleep', 'general']).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

const reminderSchema = z.object({
  azkar_id: z.string().uuid(),
  reminder_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  days_of_week: z.array(z.number().min(1).max(7)).default([1,2,3,4,5,6,7]),
  is_enabled: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Parse query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, any> = Object.fromEntries(url.searchParams.entries());

    // Convert numeric parameters
    ['page', 'limit'].forEach(param => {
      if (queryParams[param]) {
        queryParams[param] = parseInt(queryParams[param]);
      }
    });

    const action = url.searchParams.get('action');

    // Handle different actions
    if (action === 'azkar') {
      const validatedQuery = azkarQuerySchema.parse(queryParams);
      return handleGetAzkar(supabase, validatedQuery);
    }

    if (action === 'reminders') {
      // Check authentication for reminders
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return handleGetReminders(supabase, session.user.id);
    }

    if (action === 'types') {
      return handleGetAzkarTypes(supabase);
    }

    // Default: return azkar
    const validatedQuery = azkarQuerySchema.parse(queryParams);
    return handleGetAzkar(supabase, validatedQuery);

  } catch (error) {
    console.error('Error in GET /api/faith/azkar:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGetAzkar(supabase: any, query: any) {
  let azkarQuery = supabase
    .from('azkar')
    .select('*', { count: 'exact' });

  // Apply filters
  if (query.type) {
    azkarQuery = azkarQuery.eq('type', query.type);
  }

  if (query.search) {
    azkarQuery = azkarQuery.or(`title_english.ilike.%${query.search}%,text_english.ilike.%${query.search}%`);
  }

  // Apply pagination
  const offset = (query.page - 1) * query.limit;
  azkarQuery = azkarQuery
    .order('type')
    .order('title_english')
    .range(offset, offset + query.limit - 1);

  const { data: azkar, error, count } = await azkarQuery;

  if (error) {
    console.error('Error fetching azkar:', error);
    return NextResponse.json({ error: 'Failed to fetch azkar' }, { status: 500 });
  }

  return NextResponse.json({
    data: azkar || [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / query.limit),
    },
  });
}

async function handleGetReminders(supabase: any, userId: string) {
  const { data: reminders, error } = await supabase
    .from('azkar_reminders')
    .select(`
      *,
      azkar(
        id,
        title_arabic,
        title_english,
        title_dhivehi,
        type,
        repetition_count
      )
    `)
    .eq('user_id', userId)
    .order('reminder_time');

  if (error) {
    console.error('Error fetching azkar reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }

  return NextResponse.json({ data: reminders || [] });
}

async function handleGetAzkarTypes(supabase: any) {
  const { data: types, error } = await supabase
    .from('azkar')
    .select('type')
    .not('type', 'is', null);

  if (error) {
    console.error('Error fetching azkar types:', error);
    return NextResponse.json({ error: 'Failed to fetch types' }, { status: 500 });
  }

  // Extract unique types
  const uniqueTypes = Array.from(new Set((types || []).map((item: any) => item.type))).sort();

  return NextResponse.json({ data: uniqueTypes });
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

    if (action === 'reminder') {
      return handleCreateReminder(supabase, request, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/faith/azkar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCreateReminder(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = reminderSchema.parse(body);

  // Verify azkar exists
  const { data: azkar } = await supabase
    .from('azkar')
    .select('id, title_english')
    .eq('id', validatedData.azkar_id)
    .single();

  if (!azkar) {
    return NextResponse.json({ error: 'Invalid azkar ID' }, { status: 400 });
  }

  // Check if reminder already exists for this azkar and time
  const { data: existingReminder } = await supabase
    .from('azkar_reminders')
    .select('id')
    .eq('user_id', userId)
    .eq('azkar_id', validatedData.azkar_id)
    .eq('reminder_time', validatedData.reminder_time)
    .single();

  if (existingReminder) {
    return NextResponse.json({ error: 'Reminder already exists for this time' }, { status: 409 });
  }

  // Create reminder
  const { data: reminder, error } = await supabase
    .from('azkar_reminders')
    .insert({
      user_id: userId,
      azkar_id: validatedData.azkar_id,
      reminder_time: validatedData.reminder_time,
      days_of_week: validatedData.days_of_week,
      is_enabled: validatedData.is_enabled,
    })
    .select(`
      *,
      azkar(
        id,
        title_arabic,
        title_english,
        title_dhivehi,
        type
      )
    `)
    .single();

  if (error) {
    console.error('Error creating azkar reminder:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: reminder,
    message: 'Azkar reminder created successfully' 
  }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reminder_id, ...updateData } = body;

    if (!reminder_id) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    // Validate update data
    const validatedData = reminderSchema.partial().parse(updateData);

    // Update reminder
    const { data: reminder, error } = await supabase
      .from('azkar_reminders')
      .update(validatedData)
      .eq('id', reminder_id)
      .eq('user_id', session.user.id)
      .select(`
        *,
        azkar(
          id,
          title_arabic,
          title_english,
          title_dhivehi,
          type
        )
      `)
      .single();

    if (error) {
      console.error('Error updating azkar reminder:', error);
      return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
    }

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      data: reminder,
      message: 'Azkar reminder updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/faith/azkar:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const { reminder_id } = await request.json();

    if (!reminder_id) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    // Delete reminder
    const { error } = await supabase
      .from('azkar_reminders')
      .delete()
      .eq('id', reminder_id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting azkar reminder:', error);
      return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Azkar reminder deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/faith/azkar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
