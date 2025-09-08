import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for habit updates
const updateHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().optional(),
  cadence: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  cadence_config: z.record(z.any()).optional(),
  target_value: z.number().min(1).optional(),
  target_unit: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  is_active: z.boolean().optional(),
  reminders: z.array(z.any()).optional(),
});

export async function GET(
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

    // Fetch habit
    const { data: habit, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Get habit statistics
    const { data: streakData } = await supabase
      .rpc('calculate_habit_streak', {
        habit_uuid: id,
        user_uuid: session.user.id,
      });

    // Get recent logs (last 30 days)
    const { data: recentLogs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', id)
      .eq('user_id', session.user.id)
      .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('logged_at', { ascending: false });

    // Get heatmap data for the last year
    const { data: heatmapData } = await supabase
      .rpc('get_habit_heatmap_data', {
        habit_uuid: id,
        user_uuid: session.user.id,
      });

    return NextResponse.json({
      data: {
        ...habit,
        stats: {
          current_streak: streakData?.[0]?.current_streak || 0,
          longest_streak: streakData?.[0]?.longest_streak || 0,
          total_completions: streakData?.[0]?.total_completions || 0,
          completion_rate: streakData?.[0]?.completion_rate || 0,
        },
        recent_logs: recentLogs || [],
        heatmap_data: heatmapData || [],
      }
    });

  } catch (error) {
    console.error('Error in GET /api/habits/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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
    const validatedData = updateHabitSchema.parse(body);

    // Check if habit exists and user owns it
    const { data: existingHabit, error: fetchError } = await supabase
      .from('habits')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Update habit
    const { data: habit, error } = await supabase
      .from('habits')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating habit:', error);
      return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
    }

    return NextResponse.json({ data: habit });

  } catch (error) {
    console.error('Error in PUT /api/habits/[id]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check if habit exists and user owns it
    const { data: existingHabit, error: fetchError } = await supabase
      .from('habits')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Delete habit (this will cascade delete habit_logs due to foreign key constraint)
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting habit:', error);
      return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Habit deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/habits/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
