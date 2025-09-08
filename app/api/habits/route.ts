import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  cadence: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
  cadence_config: z.record(z.any()).default({}),
  target_value: z.number().min(1).default(1),
  target_unit: z.string().default('times'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#10B981'),
  icon: z.string().default('✓'),
  reminders: z.array(z.any()).default([]),
});

const querySchema = z.object({
  is_active: z.string().transform(Boolean).optional(),
  cadence: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  include_stats: z.string().transform(Boolean).default('false'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Convert numeric parameters
    ['page', 'limit'].forEach(param => {
      if (queryParams[param]) {
        queryParams[param] = parseInt(queryParams[param]);
      }
    });

    const validatedQuery = querySchema.parse(queryParams);

    // Build query
    let query = supabase
      .from('habits')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id);

    // Apply filters
    if (validatedQuery.is_active !== undefined) {
      query = query.eq('is_active', validatedQuery.is_active);
    }

    if (validatedQuery.cadence) {
      query = query.eq('cadence', validatedQuery.cadence);
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data: habits, error, count } = await query;

    if (error) {
      console.error('Error fetching habits:', error);
      return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
    }

    // Include statistics if requested
    let enrichedHabits = habits || [];
    if (validatedQuery.include_stats) {
      enrichedHabits = await Promise.all(
        (habits || []).map(async (habit) => {
          // Get streak information
          const { data: streakData } = await supabase
            .rpc('calculate_habit_streak', {
              habit_uuid: habit.id,
              user_uuid: session.user.id,
            });

          // Check if completed today
          const { data: todayLog } = await supabase
            .from('habit_logs')
            .select('value')
            .eq('habit_id', habit.id)
            .eq('user_id', session.user.id)
            .gte('logged_at', new Date().toISOString().split('T')[0])
            .single();

          return {
            ...habit,
            stats: {
              current_streak: streakData?.[0]?.current_streak || 0,
              longest_streak: streakData?.[0]?.longest_streak || 0,
              total_completions: streakData?.[0]?.total_completions || 0,
              completion_rate: streakData?.[0]?.completion_rate || 0,
              completed_today: (todayLog?.value || 0) >= habit.target_value,
              today_value: todayLog?.value || 0,
            },
          };
        })
      );
    }

    return NextResponse.json({
      data: enrichedHabits,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / validatedQuery.limit),
      },
    });

  } catch (error) {
    console.error('Error in GET /api/habits:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createHabitSchema.parse(body);

    // Create habit
    const { data: habit, error } = await supabase
      .from('habits')
      .insert({
        ...validatedData,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating habit:', error);
      return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
    }

    return NextResponse.json({ data: habit }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/habits:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
