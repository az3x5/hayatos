import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for note updates
const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  content: z.string().optional(),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  tags: z.array(z.string()).optional(),
  project_id: z.string().uuid().nullable().optional(),
  task_id: z.string().uuid().nullable().optional(),
  is_pinned: z.boolean().optional(),
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

    // Validate note ID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    // Fetch note with related data
    const { data: note, error } = await supabase
      .from('notes')
      .select(`
        *,
        project:projects(id, title, color),
        task:tasks(id, title, status),
        note_entities:note_entities(
          id,
          relevance_score,
          context,
          entity:entities(id, name, type, description)
        )
      `)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Get related notes through knowledge graph
    const { data: relatedNotes } = await supabase
      .rpc('find_related_notes_by_entities', {
        note_uuid: id,
        user_uuid: session.user.id,
        max_results: 5,
      });

    return NextResponse.json({ 
      data: {
        ...note,
        related_notes: relatedNotes || [],
      }
    });

  } catch (error) {
    console.error('Error in GET /api/notes/[id]:', error);
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

    // Validate note ID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Check if note exists and user owns it
    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('id, content')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
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

    // Generate excerpt if content is being updated and no excerpt provided
    let updateData = { ...validatedData };
    if (validatedData.content && !validatedData.excerpt) {
      updateData.excerpt = generateExcerpt(validatedData.content);
    }

    // Update note
    const { data: note, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select(`
        *,
        project:projects(id, title, color),
        task:tasks(id, title, status)
      `)
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    // Trigger AI processing if content changed
    if (validatedData.content && validatedData.content !== existingNote.content) {
      processNoteWithAI(id, validatedData.content).catch(console.error);
    }

    return NextResponse.json({ data: note });

  } catch (error) {
    console.error('Error in PUT /api/notes/[id]:', error);
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

    // Validate note ID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    // Check if note exists and user owns it
    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Delete note (this will cascade delete note_entities due to foreign key constraint)
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    // Clean up orphaned entities
    await supabase.rpc('cleanup_orphaned_entities');

    return NextResponse.json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/notes/[id]:', error);
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

// Helper function to process note with AI (placeholder)
async function processNoteWithAI(noteId: string, content: string): Promise<void> {
  // This would:
  // 1. Generate embeddings
  // 2. Extract entities
  // 3. Generate suggested tags
  // 4. Update the note with AI-generated data
  console.log(`Processing note ${noteId} with AI...`);
}
