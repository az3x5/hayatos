import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const hadithQuerySchema = z.object({
  search: z.string().optional(),
  collection_id: z.string().uuid().optional(),
  category: z.string().optional(),
  grade: z.enum(['sahih', 'hasan', 'daif', 'mawdu']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

const duasQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  occasion: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Convert numeric parameters
    ['page', 'limit'].forEach(param => {
      if (queryParams[param]) {
        queryParams[param] = parseInt(queryParams[param]);
      }
    });

    const action = url.searchParams.get('action');

    // Handle different actions
    if (action === 'collections') {
      return handleGetCollections(supabase);
    }

    if (action === 'hadith') {
      const validatedQuery = hadithQuerySchema.parse(queryParams);
      return handleSearchHadith(supabase, validatedQuery);
    }

    if (action === 'duas') {
      const validatedQuery = duasQuerySchema.parse(queryParams);
      return handleSearchDuas(supabase, validatedQuery);
    }

    if (action === 'categories') {
      const type = url.searchParams.get('type') || 'hadith';
      return handleGetCategories(supabase, type);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in GET /api/faith/hadith:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGetCollections(supabase: any) {
  const { data: collections, error } = await supabase
    .from('hadith_collections')
    .select('*')
    .order('name_english');

  if (error) {
    console.error('Error fetching hadith collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }

  return NextResponse.json({ data: collections || [] });
}

async function handleSearchHadith(supabase: any, query: any) {
  const { data: hadithResults, error } = await supabase
    .rpc('search_hadith', {
      search_query: query.search || null,
      collection_filter: query.collection_id || null,
      category_filter: query.category || null,
      grade_filter: query.grade || null,
      limit_count: query.limit,
      offset_count: (query.page - 1) * query.limit,
    });

  if (error) {
    console.error('Error searching hadith:', error);
    return NextResponse.json({ error: 'Failed to search hadith' }, { status: 500 });
  }

  // Get total count for pagination
  let countQuery = supabase
    .from('hadith')
    .select('id', { count: 'exact', head: true })
    .join('hadith_collections', 'hadith.collection_id', 'hadith_collections.id');

  if (query.search) {
    countQuery = countQuery.or(`text_english.ilike.%${query.search}%,narrator.ilike.%${query.search}%,category.ilike.%${query.search}%`);
  }

  if (query.collection_id) {
    countQuery = countQuery.eq('collection_id', query.collection_id);
  }

  if (query.category) {
    countQuery = countQuery.eq('category', query.category);
  }

  if (query.grade) {
    countQuery = countQuery.eq('grade', query.grade);
  }

  const { count } = await countQuery;

  return NextResponse.json({
    data: hadithResults || [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / query.limit),
    },
  });
}

async function handleSearchDuas(supabase: any, query: any) {
  const { data: duasResults, error } = await supabase
    .rpc('search_duas', {
      search_query: query.search || null,
      category_filter: query.category || null,
      occasion_filter: query.occasion || null,
      limit_count: query.limit,
      offset_count: (query.page - 1) * query.limit,
    });

  if (error) {
    console.error('Error searching duas:', error);
    return NextResponse.json({ error: 'Failed to search duas' }, { status: 500 });
  }

  // Get total count for pagination
  let countQuery = supabase
    .from('duas')
    .select('id', { count: 'exact', head: true });

  if (query.search) {
    countQuery = countQuery.or(`title_english.ilike.%${query.search}%,text_english.ilike.%${query.search}%,category.ilike.%${query.search}%`);
  }

  if (query.category) {
    countQuery = countQuery.eq('category', query.category);
  }

  if (query.occasion) {
    countQuery = countQuery.eq('occasion', query.occasion);
  }

  const { count } = await countQuery;

  return NextResponse.json({
    data: duasResults || [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / query.limit),
    },
  });
}

async function handleGetCategories(supabase: any, type: string) {
  let query;
  
  if (type === 'hadith') {
    query = supabase
      .from('hadith')
      .select('category')
      .not('category', 'is', null);
  } else if (type === 'duas') {
    query = supabase
      .from('duas')
      .select('category')
      .not('category', 'is', null);
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  // Extract unique categories
  const categories = [...new Set((data || []).map(item => item.category))].sort();

  return NextResponse.json({ data: categories });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'bookmark') {
      return handleCreateBookmark(supabase, request, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/faith/hadith:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCreateBookmark(supabase: any, request: NextRequest, userId: string) {
  const { type, reference_id, notes } = await request.json();

  if (!type || !reference_id) {
    return NextResponse.json({ error: 'Type and reference ID are required' }, { status: 400 });
  }

  if (!['hadith', 'dua'].includes(type)) {
    return NextResponse.json({ error: 'Invalid bookmark type' }, { status: 400 });
  }

  // Check if bookmark already exists
  const { data: existingBookmark } = await supabase
    .from('faith_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('bookmark_type', type)
    .eq('reference_id', reference_id)
    .single();

  if (existingBookmark) {
    return NextResponse.json({ error: `${type} already bookmarked` }, { status: 409 });
  }

  // Create bookmark
  const { data: bookmark, error } = await supabase
    .from('faith_bookmarks')
    .insert({
      user_id: userId,
      bookmark_type: type,
      reference_id: reference_id,
      notes: notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: bookmark,
    message: `${type} bookmarked successfully` 
  }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookmark_id } = await request.json();

    if (!bookmark_id) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    // Delete bookmark
    const { error } = await supabase
      .from('faith_bookmarks')
      .delete()
      .eq('id', bookmark_id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting bookmark:', error);
      return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bookmark deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/faith/hadith:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
