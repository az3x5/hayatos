import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for habit check-in
const checkinSchema = z.object({
  value: z.number().min(1).default(1),
  notes: z.string().optional(),
  mood_rating: z.number().min(1).max(5).optional(),
  logged_at: z.string().datetime().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    const { id } = await params;

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate habit ID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = checkinSchema.parse(body);

    // Check if habit exists and user owns it
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, title, target_value, cadence')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found or inactive' }, { status: 404 });
    }

    const loggedAt = validatedData.logged_at ? new Date(validatedData.logged_at) : new Date();
    const logDate = loggedAt.toISOString().split('T')[0];

    // Check if already logged for today (for daily habits)
    if (habit.cadence === 'daily') {
      const { data: existingLog } = await supabase
        .from('habit_logs')
        .select('id, value')
        .eq('habit_id', id)
        .eq('user_id', session.user.id)
        .gte('logged_at', logDate)
        .lt('logged_at', new Date(new Date(logDate).getTime() + 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (existingLog) {
        // Update existing log instead of creating new one
        const { data: updatedLog, error: updateError } = await supabase
          .from('habit_logs')
          .update({
            value: existingLog.value + validatedData.value,
            notes: validatedData.notes,
            mood_rating: validatedData.mood_rating,
          })
          .eq('id', existingLog.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating habit log:', updateError);
          return NextResponse.json({ error: 'Failed to update check-in' }, { status: 500 });
        }

        return NextResponse.json({ 
          data: updatedLog,
          message: 'Check-in updated successfully',
          is_completed: updatedLog.value >= habit.target_value,
        });
      }
    }

    // Create new habit log
    const { data: habitLog, error } = await supabase
      .from('habit_logs')
      .insert({
        habit_id: id,
        user_id: session.user.id,
        value: validatedData.value,
        notes: validatedData.notes,
        mood_rating: validatedData.mood_rating,
        logged_at: loggedAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating habit log:', error);
      return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 });
    }

    // Calculate if habit is completed for the day
    const isCompleted = habitLog.value >= habit.target_value;

    return NextResponse.json({ 
      data: habitLog,
      message: 'Check-in recorded successfully',
      is_completed: isCompleted,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/habits/[id]/checkin:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get check-in history for a habit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate habit ID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const limit = parseInt(url.searchParams.get('limit') || '30');

    // Check if habit exists and user owns it
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, title')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Build query for habit logs
    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', id)
      .eq('user_id', session.user.id);

    // Apply date filters
    if (startDate) {
      query = query.gte('logged_at', startDate);
    }
    if (endDate) {
      query = query.lte('logged_at', endDate);
    }

    // Apply limit and ordering
    query = query
      .order('logged_at', { ascending: false })
      .limit(limit);

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching habit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch check-in history' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: logs || [],
      habit: habit,
    });

  } catch (error) {
    console.error('Error in GET /api/habits/[id]/checkin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
