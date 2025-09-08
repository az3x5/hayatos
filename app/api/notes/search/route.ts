import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

// Validation schema
const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  search_type: z.enum(['semantic', 'keyword', 'hybrid']).default('hybrid'),
  similarity_threshold: z.number().min(0).max(1).default(0.7),
  max_results: z.number().min(1).max(50).default(20),
  include_faith_content: z.boolean().default(false),
  content_types: z.array(z.enum(['notes', 'quran', 'hadith', 'duas'])).default(['notes']),
  filters: z.object({
    tags: z.array(z.string()).optional(),
    project_id: z.string().uuid().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
  }).optional(),
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const validatedData = searchSchema.parse(body);

    const results: any = {
      query: validatedData.query,
      search_type: validatedData.search_type,
      results: [],
      total_results: 0,
    };

    // Generate embedding for semantic search
    let queryEmbedding: number[] | null = null;
    if (validatedData.search_type === 'semantic' || validatedData.search_type === 'hybrid') {
      try {
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: validatedData.query,
        });
        queryEmbedding = embeddingResponse.data[0].embedding;
      } catch (error) {
        console.error('Error generating query embedding:', error);
        if (validatedData.search_type === 'semantic') {
          return NextResponse.json({ error: 'Failed to generate search embedding' }, { status: 500 });
        }
      }
    }

    // Search notes
    if (validatedData.content_types.includes('notes')) {
      const notesResults = await searchNotes(
        supabase,
        session.user.id,
        validatedData.query,
        queryEmbedding,
        validatedData
      );
      results.results.push(...notesResults);
    }

    // Search faith content if requested
    if (validatedData.include_faith_content && queryEmbedding) {
      const faithContentTypes = validatedData.content_types.filter(type => 
        ['quran', 'hadith', 'duas'].includes(type)
      );
      
      if (faithContentTypes.length > 0) {
        const faithResults = await searchFaithContent(
          supabase,
          validatedData.query,
          queryEmbedding,
          faithContentTypes,
          validatedData
        );
        results.results.push(...faithResults);
      }
    }

    // Sort results by relevance/similarity
    results.results.sort((a: any, b: any) => (b.similarity || b.relevance || 0) - (a.similarity || a.relevance || 0));

    // Limit results
    results.results = results.results.slice(0, validatedData.max_results);
    results.total_results = results.results.length;

    return NextResponse.json({ data: results });

  } catch (error) {
    console.error('Error in POST /api/notes/search:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to search notes
async function searchNotes(
  supabase: any,
  userId: string,
  query: string,
  queryEmbedding: number[] | null,
  options: any
) {
  const results: any[] = [];

  // Semantic search
  if (queryEmbedding && (options.search_type === 'semantic' || options.search_type === 'hybrid')) {
    try {
      const { data: semanticResults } = await supabase
        .rpc('semantic_search_notes', {
          query_embedding: queryEmbedding,
          user_uuid: userId,
          similarity_threshold: options.similarity_threshold,
          max_results: options.max_results,
        });

      if (semanticResults) {
        results.push(...semanticResults.map((result: any) => ({
          ...result,
          content_type: 'note',
          search_method: 'semantic',
        })));
      }
    } catch (error) {
      console.error('Semantic search error:', error);
    }
  }

  // Keyword search
  if (options.search_type === 'keyword' || options.search_type === 'hybrid') {
    try {
      let keywordQuery = supabase
        .from('notes')
        .select(`
          id,
          title,
          excerpt,
          content,
          tags,
          ai_generated_tags,
          created_at,
          updated_at,
          project:projects(id, title, color)
        `)
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`);

      // Apply filters
      if (options.filters?.tags) {
        keywordQuery = keywordQuery.overlaps('tags', options.filters.tags);
      }

      if (options.filters?.project_id) {
        keywordQuery = keywordQuery.eq('project_id', options.filters.project_id);
      }

      if (options.filters?.date_from) {
        keywordQuery = keywordQuery.gte('created_at', options.filters.date_from);
      }

      if (options.filters?.date_to) {
        keywordQuery = keywordQuery.lte('created_at', options.filters.date_to);
      }

      keywordQuery = keywordQuery
        .order('updated_at', { ascending: false })
        .limit(options.max_results);

      const { data: keywordResults } = await keywordQuery;

      if (keywordResults) {
        // Calculate relevance score for keyword matches
        const scoredResults = keywordResults.map((result: any) => {
          let relevance = 0;
          const queryLower = query.toLowerCase();
          
          // Title match (highest weight)
          if (result.title?.toLowerCase().includes(queryLower)) {
            relevance += 0.4;
          }
          
          // Excerpt match
          if (result.excerpt?.toLowerCase().includes(queryLower)) {
            relevance += 0.3;
          }
          
          // Content match
          if (result.content?.toLowerCase().includes(queryLower)) {
            relevance += 0.2;
          }
          
          // Tag match
          const allTags = [...(result.tags || []), ...(result.ai_generated_tags || [])];
          if (allTags.some(tag => tag.toLowerCase().includes(queryLower))) {
            relevance += 0.1;
          }

          return {
            id: result.id,
            title: result.title,
            excerpt: result.excerpt,
            created_at: result.created_at,
            content_type: 'note',
            search_method: 'keyword',
            relevance,
            project: result.project,
          };
        });

        // Filter out results already found by semantic search (if hybrid)
        const newResults = options.search_type === 'hybrid'
          ? scoredResults.filter((kr: any) => !results.some((sr: any) => sr.id === kr.id))
          : scoredResults;

        results.push(...newResults);
      }
    } catch (error) {
      console.error('Keyword search error:', error);
    }
  }

  return results;
}

// Helper function to search faith content
async function searchFaithContent(
  supabase: any,
  query: string,
  queryEmbedding: number[],
  contentTypes: string[],
  options: any
) {
  try {
    const { data: faithResults } = await supabase
      .rpc('semantic_search_faith_content', {
        query_embedding: queryEmbedding,
        content_types: contentTypes,
        similarity_threshold: options.similarity_threshold,
        max_results: options.max_results,
      });

    return faithResults || [];
  } catch (error) {
    console.error('Faith content search error:', error);
    return [];
  }
}

// GET endpoint for simple search
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const searchType = url.searchParams.get('type') || 'keyword';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Simple keyword search for GET requests
    const { data: results } = await supabase
      .from('notes')
      .select(`
        id,
        title,
        excerpt,
        tags,
        ai_generated_tags,
        created_at,
        project:projects(id, title, color)
      `)
      .eq('user_id', session.user.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      data: {
        query,
        search_type: searchType,
        results: results || [],
        total_results: results?.length || 0,
      }
    });

  } catch (error) {
    console.error('Error in GET /api/notes/search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
