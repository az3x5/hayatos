import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#3B82F6'),
  milestones: z.array(z.any()).default([]),
});

const querySchema = z.object({
  include_archived: z.string().transform(Boolean).default('false'),
  search: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
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
      .from('projects')
      .select(`
        *,
        task_count:tasks(count),
        completed_task_count:tasks!inner(count)
      `)
      .eq('user_id', session.user.id);

    // Apply filters
    if (!validatedQuery.include_archived) {
      query = query.eq('is_archived', false);
    }

    if (validatedQuery.search) {
      query = query.or(`title.ilike.%${validatedQuery.search}%,description.ilike.%${validatedQuery.search}%`);
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data: projects, error, count } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Calculate completion percentage for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const { data: completionPercentage } = await supabase
          .rpc('get_project_completion_percentage', { project_uuid: project.id });

        return {
          ...project,
          completion_percentage: completionPercentage || 0,
        };
      })
    );

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / validatedQuery.limit) : 0;

    return NextResponse.json({
      data: projectsWithStats,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count,
        total_pages: totalPages,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/projects:', error);
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
    const validatedData = createProjectSchema.parse(body);

    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...validatedData,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json({ data: project }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
