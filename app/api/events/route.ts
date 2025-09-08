import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  start_at: z.string().datetime('Invalid start date'),
  end_at: z.string().datetime('Invalid end date').optional(),
  all_day: z.boolean().default(false),
  location: z.string().optional(),
  attendees: z.array(z.any()).default([]),
  linked_task_id: z.string().uuid().optional(),
});

const querySchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  include_tasks: z.string().transform(Boolean).default('true'),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('100'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    // Build events query
    let eventsQuery = supabase
      .from('events')
      .select(`
        *,
        linked_task:tasks(id, title, status, priority, project:projects(title, color))
      `)
      .eq('user_id', session.user.id);

    // Apply date filters
    if (validatedQuery.start_date) {
      eventsQuery = eventsQuery.gte('start_at', validatedQuery.start_date);
    }

    if (validatedQuery.end_date) {
      eventsQuery = eventsQuery.lte('start_at', validatedQuery.end_date);
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    eventsQuery = eventsQuery.range(offset, offset + validatedQuery.limit - 1);

    // Order by start time
    eventsQuery = eventsQuery.order('start_at', { ascending: true });

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    let allEvents = events || [];

    // Include tasks with due dates as events if requested
    if (validatedQuery.include_tasks) {
      let tasksQuery = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          due_date,
          status,
          priority,
          project:projects(title, color)
        `)
        .eq('user_id', session.user.id)
        .not('due_date', 'is', null)
        .neq('status', 'done');

      // Apply same date filters to tasks
      if (validatedQuery.start_date) {
        tasksQuery = tasksQuery.gte('due_date', validatedQuery.start_date);
      }

      if (validatedQuery.end_date) {
        tasksQuery = tasksQuery.lte('due_date', validatedQuery.end_date);
      }

      const { data: tasks, error: tasksError } = await tasksQuery;

      if (tasksError) {
        console.error('Error fetching tasks for calendar:', tasksError);
      } else {
        // Convert tasks to event format
        const taskEvents = tasks
          .filter(task => !events?.some(event => event.linked_task_id === task.id))
          .map(task => ({
            id: `task-${task.id}`,
            user_id: session.user.id,
            linked_task_id: task.id,
            title: `Task: ${task.title}`,
            description: task.description,
            start_at: task.due_date,
            end_at: null,
            all_day: false,
            location: null,
            attendees: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            linked_task: task,
            is_task_event: true,
          }));

        allEvents = [...allEvents, ...taskEvents];
      }
    }

    // Sort all events by start time
    allEvents.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

    return NextResponse.json({
      data: allEvents,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: allEvents.length,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/events:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    // Validate linked task ownership if provided
    if (validatedData.linked_task_id) {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', validatedData.linked_task_id)
        .eq('user_id', session.user.id)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Linked task not found or access denied' }, { status: 404 });
      }
    }

    // Validate end_at is after start_at
    if (validatedData.end_at && new Date(validatedData.end_at) <= new Date(validatedData.start_at)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Create event
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...validatedData,
        user_id: session.user.id,
      })
      .select(`
        *,
        linked_task:tasks(id, title, status, priority, project:projects(title, color))
      `)
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ data: event }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/events:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
