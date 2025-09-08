import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const querySchema = z.object({
  entity_types: z.array(z.string()).optional(),
  min_connections: z.number().min(1).default(2),
  max_entities: z.number().min(1).max(100).default(50),
  include_relationships: z.boolean().default(true),
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
    
    // Convert array parameters
    if (queryParams.entity_types) {
      queryParams.entity_types = queryParams.entity_types.split(',');
    }
    
    const validatedQuery = querySchema.parse(queryParams);

    // Get entity network
    const { data: entityNetwork, error: networkError } = await supabase
      .rpc('get_entity_network', {
        user_uuid: session.user.id,
        entity_types: validatedQuery.entity_types,
        min_connections: validatedQuery.min_connections,
      });

    if (networkError) {
      console.error('Error fetching entity network:', networkError);
      return NextResponse.json({ error: 'Failed to fetch knowledge graph' }, { status: 500 });
    }

    // Limit entities
    const limitedEntities = (entityNetwork || []).slice(0, validatedQuery.max_entities);

    // Get relationships if requested
    let relationships: any[] = [];
    if (validatedQuery.include_relationships && limitedEntities.length > 0) {
      const entityIds = limitedEntities.map((entity: any) => entity.entity_id);
      
      const { data: relationshipData, error: relationshipError } = await supabase
        .from('entity_relationships')
        .select(`
          id,
          relationship_type,
          strength,
          metadata,
          from_entity:entities!from_entity_id(id, name, type),
          to_entity:entities!to_entity_id(id, name, type)
        `)
        .or(`from_entity_id.in.(${entityIds.join(',')}),to_entity_id.in.(${entityIds.join(',')})`)
        .order('strength', { ascending: false });

      if (!relationshipError) {
        relationships = relationshipData || [];
      }
    }

    // Format data for graph visualization
    const nodes = limitedEntities.map((entity: any) => ({
      id: entity.entity_id,
      name: entity.entity_name,
      type: entity.entity_type,
      size: Math.min(entity.connection_count * 2, 20), // Scale node size by connections
      connections: entity.connection_count,
      connected_notes: entity.connected_entities,
    }));

    const edges = relationships.map((rel: any) => ({
      id: rel.id,
      source: rel.from_entity.id,
      target: rel.to_entity.id,
      type: rel.relationship_type,
      strength: rel.strength,
      metadata: rel.metadata,
    }));

    // Calculate graph statistics
    const stats = {
      total_entities: limitedEntities.length,
      total_relationships: relationships.length,
      entity_types: [...new Set(limitedEntities.map((e: any) => e.entity_type))],
      relationship_types: [...new Set(relationships.map((r: any) => r.relationship_type))],
      avg_connections: limitedEntities.length > 0 
        ? limitedEntities.reduce((sum: number, e: any) => sum + e.connection_count, 0) / limitedEntities.length 
        : 0,
    };

    return NextResponse.json({
      data: {
        nodes,
        edges,
        stats,
      }
    });

  } catch (error) {
    console.error('Error in GET /api/knowledge-graph:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get entities for a specific note
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { note_id, action } = body;

    if (!note_id || !z.string().uuid().safeParse(note_id).success) {
      return NextResponse.json({ error: 'Valid note_id is required' }, { status: 400 });
    }

    // Verify note ownership
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', note_id)
      .eq('user_id', session.user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 });
    }

    if (action === 'get_entities') {
      // Get entities for the note
      const { data: noteEntities, error: entitiesError } = await supabase
        .from('note_entities')
        .select(`
          id,
          relevance_score,
          context,
          entity:entities(id, name, type, description)
        `)
        .eq('note_id', note_id)
        .order('relevance_score', { ascending: false });

      if (entitiesError) {
        return NextResponse.json({ error: 'Failed to fetch note entities' }, { status: 500 });
      }

      return NextResponse.json({ data: noteEntities || [] });
    }

    if (action === 'get_related_notes') {
      // Get related notes through shared entities
      const { data: relatedNotes, error: relatedError } = await supabase
        .rpc('find_related_notes_by_entities', {
          note_uuid: note_id,
          user_uuid: session.user.id,
          max_results: 10,
        });

      if (relatedError) {
        return NextResponse.json({ error: 'Failed to fetch related notes' }, { status: 500 });
      }

      return NextResponse.json({ data: relatedNotes || [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/knowledge-graph:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
