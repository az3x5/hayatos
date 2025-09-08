import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for task updates
const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().optional(),
  project_id: z.string().uuid().nullable().optional(),
  parent_task_id: z.string().uuid().nullable().optional(),
  status: z.enum(['inbox', 'todo', 'doing', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().datetime().nullable().optional(),
  recurrence_rule: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  position: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate task ID
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Fetch task with related data
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, title, color),
        subtasks:tasks!parent_task_id(
          id, title, status, priority, due_date, created_at
        ),
        parent_task:tasks!parent_task_id(
          id, title, status
        )
      `)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ data: task });

  } catch (error) {
    console.error('Error in GET /api/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate task ID
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Check if task exists and user owns it
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, status, due_date')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

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

    // Prepare update data
    const updateData: any = { ...validatedData };

    // Set completed_at if status is changing to 'done'
    if (validatedData.status === 'done' && existingTask.status !== 'done') {
      updateData.completed_at = new Date().toISOString();
    } else if (validatedData.status && validatedData.status !== 'done') {
      updateData.completed_at = null;
    }

    // Update task
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select(`
        *,
        project:projects(id, title, color)
      `)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Handle calendar event updates
    if (validatedData.due_date !== undefined) {
      if (validatedData.due_date) {
        // Update or create calendar event
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('linked_task_id', params.id)
          .single();

        if (existingEvent) {
          await supabase
            .from('events')
            .update({
              title: `Task: ${task.title}`,
              start_at: validatedData.due_date,
            })
            .eq('id', existingEvent.id);
        } else {
          await supabase
            .from('events')
            .insert({
              user_id: session.user.id,
              linked_task_id: task.id,
              title: `Task: ${task.title}`,
              start_at: validatedData.due_date,
              all_day: false,
            });
        }
      } else {
        // Remove calendar event if due_date is set to null
        await supabase
          .from('events')
          .delete()
          .eq('linked_task_id', params.id);
      }
    }

    return NextResponse.json({ data: task });

  } catch (error) {
    console.error('Error in PUT /api/tasks/[id]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate task ID
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Check if task exists and user owns it
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete associated calendar events
    await supabase
      .from('events')
      .delete()
      .eq('linked_task_id', params.id);

    // Delete task (this will cascade delete subtasks due to foreign key constraint)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
