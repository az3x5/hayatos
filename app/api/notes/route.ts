import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().optional(),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  tags: z.array(z.string()).default([]),
  project_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  is_pinned: z.boolean().default(false),
});

const querySchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated tags
  project_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  is_pinned: z.string().transform(Boolean).optional(),
  semantic_search: z.string().optional(), // for semantic search query
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'word_count']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
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
    const validatedQuery = querySchema.parse(queryParams);

    // Handle semantic search
    if (validatedQuery.semantic_search) {
      try {
        // Generate embedding for search query (this would call OpenAI API)
        const searchEmbedding = await generateEmbedding(validatedQuery.semantic_search);
        
        const { data: semanticResults, error: semanticError } = await supabase
          .rpc('semantic_search_notes', {
            query_embedding: searchEmbedding,
            user_uuid: session.user.id,
            similarity_threshold: 0.7,
            max_results: validatedQuery.limit,
          });

        if (semanticError) {
          console.error('Semantic search error:', semanticError);
          return NextResponse.json({ error: 'Semantic search failed' }, { status: 500 });
        }

        return NextResponse.json({
          data: semanticResults || [],
          search_type: 'semantic',
          query: validatedQuery.semantic_search,
        });
      } catch (error) {
        console.error('Error in semantic search:', error);
        // Fall back to regular search
      }
    }

    // Build regular query
    let query = supabase
      .from('notes')
      .select(`
        *,
        project:projects(id, title, color),
        task:tasks(id, title, status),
        note_entities:note_entities(
          entity:entities(id, name, type)
        )
      `)
      .eq('user_id', session.user.id);

    // Apply filters
    if (validatedQuery.search) {
      query = query.or(`title.ilike.%${validatedQuery.search}%,content.ilike.%${validatedQuery.search}%,excerpt.ilike.%${validatedQuery.search}%`);
    }

    if (validatedQuery.tags) {
      const tags = validatedQuery.tags.split(',').map(tag => tag.trim());
      query = query.or(`tags.cs.{${tags.join(',')}},ai_generated_tags.cs.{${tags.join(',')}}`);
    }

    if (validatedQuery.project_id) {
      query = query.eq('project_id', validatedQuery.project_id);
    }

    if (validatedQuery.task_id) {
      query = query.eq('task_id', validatedQuery.task_id);
    }

    if (validatedQuery.is_pinned !== undefined) {
      query = query.eq('is_pinned', validatedQuery.is_pinned);
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    // Apply sorting
    query = query.order(validatedQuery.sort_by, { 
      ascending: validatedQuery.sort_order === 'asc' 
    });

    const { data: notes, error, count } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / validatedQuery.limit) : 0;

    return NextResponse.json({
      data: notes,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count,
        total_pages: totalPages,
      },
      search_type: 'regular',
    });

  } catch (error) {
    console.error('Error in GET /api/notes:', error);
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
    const validatedData = createNoteSchema.parse(body);

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

    // Validate task ownership if task_id is provided
    if (validatedData.task_id) {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', validatedData.task_id)
        .eq('user_id', session.user.id)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
      }
    }

    // Generate excerpt if not provided
    let excerpt = validatedData.excerpt;
    if (!excerpt && validatedData.content) {
      excerpt = generateExcerpt(validatedData.content);
    }

    // Create note
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        ...validatedData,
        excerpt,
        user_id: session.user.id,
      })
      .select(`
        *,
        project:projects(id, title, color),
        task:tasks(id, title, status)
      `)
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    // Trigger AI processing in the background (don't wait for it)
    if (validatedData.content) {
      processNoteWithAI(note.id, validatedData.content).catch(console.error);
    }

    return NextResponse.json({ data: note }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/notes:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate excerpt from content
function generateExcerpt(content: string, maxLength: number = 200): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find the last complete sentence within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxLength * 0.7) {
    return truncated.substring(0, lastSentence + 1);
  }
  
  // If no good sentence break, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.substring(0, lastSpace) + '...';
}

// Helper function to generate embeddings (placeholder)
async function generateEmbedding(text: string): Promise<number[]> {
  // This would call OpenAI API to generate embeddings
  // For now, return a dummy embedding
  return new Array(1536).fill(0);
}

// Helper function to process note with AI (placeholder)
async function processNoteWithAI(noteId: string, content: string): Promise<void> {
  // This would:
  // 1. Generate embeddings
  // 2. Extract entities
  // 3. Generate suggested tags
  // 4. Update the note with AI-generated data
  console.log(`Processing note ${noteId} with AI...`);
}
