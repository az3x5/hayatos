import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  project_id: z.string().uuid().optional(),
  parent_task_id: z.string().uuid().optional(),
  status: z.enum(['inbox', 'todo', 'doing', 'done']).default('inbox'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional(),
  recurrence_rule: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const querySchema = z.object({
  status: z.enum(['inbox', 'todo', 'doing', 'done']).optional(),
  project_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_before: z.string().datetime().optional(),
  due_after: z.string().datetime().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated tags
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  include_subtasks: z.string().transform(Boolean).default('true'),
  include_completed: z.string().transform(Boolean).default('false'),
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

    // Build query
    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, title, color),
        subtasks:tasks!parent_task_id(id, title, status, due_date)
      `)
      .eq('user_id', session.user.id)
      .is('parent_task_id', null); // Only get top-level tasks

    // Apply filters
    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status);
    }

    if (validatedQuery.project_id) {
      query = query.eq('project_id', validatedQuery.project_id);
    }

    if (validatedQuery.priority) {
      query = query.eq('priority', validatedQuery.priority);
    }

    if (validatedQuery.due_before) {
      query = query.lte('due_date', validatedQuery.due_before);
    }

    if (validatedQuery.due_after) {
      query = query.gte('due_date', validatedQuery.due_after);
    }

    if (validatedQuery.search) {
      query = query.or(`title.ilike.%${validatedQuery.search}%,description.ilike.%${validatedQuery.search}%`);
    }

    if (validatedQuery.tags) {
      const tags = validatedQuery.tags.split(',').map(tag => tag.trim());
      query = query.overlaps('tags', tags);
    }

    if (!validatedQuery.include_completed) {
      query = query.neq('status', 'done');
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    // Order by priority and due date
    query = query.order('priority', { ascending: false })
                 .order('due_date', { ascending: true, nullsFirst: false })
                 .order('created_at', { ascending: false });

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / validatedQuery.limit) : 0;

    return NextResponse.json({
      data: tasks,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count,
        total_pages: totalPages,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
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
    const validatedData = createTaskSchema.parse(body);

    // Validate project ownership if project_id is provided
    if (validatedData.project_id) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', validatedData.project_id)
        .eq('user_id', session.user.id)
        .single();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
      }
    }

    // Validate parent task ownership if parent_task_id is provided
    if (validatedData.parent_task_id) {
      const { data: parentTask, error: parentError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', validatedData.parent_task_id)
        .eq('user_id', session.user.id)
        .single();

      if (parentError || !parentTask) {
        return NextResponse.json({ error: 'Parent task not found or access denied' }, { status: 404 });
      }
    }

    // Create task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        ...validatedData,
        user_id: session.user.id,
      })
      .select(`
        *,
        project:projects(id, title, color)
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Create calendar event if task has due date
    if (validatedData.due_date) {
      const eventData = {
        user_id: session.user.id,
        linked_task_id: task.id,
        title: `Task: ${task.title}`,
        start_at: validatedData.due_date,
        all_day: false,
      };

      await supabase.from('events').insert(eventData);
    }

    return NextResponse.json({ data: task }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/tasks:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
