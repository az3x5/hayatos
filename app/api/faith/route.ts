import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const querySchema = z.object({
  content_type: z.enum(['quran', 'hadith', 'duas', 'all']).default('all'),
  search: z.string().optional(),
  surah_number: z.number().min(1).max(114).optional(),
  juz_number: z.number().min(1).max(30).optional(),
  collection: z.string().optional(), // for hadith
  category: z.string().optional(), // for duas
  grade: z.enum(['sahih', 'hasan', 'daif']).optional(), // for hadith
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const bookmarkSchema = z.object({
  content_type: z.enum(['quran', 'hadith', 'dua']),
  content_id: z.string().uuid(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
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
    const queryParams: Record<string, any> = Object.fromEntries(url.searchParams.entries());

    // Convert numeric parameters
    ['surah_number', 'juz_number', 'page', 'limit'].forEach(param => {
      if (queryParams[param]) {
        queryParams[param] = parseInt(queryParams[param]);
      }
    });

    const validatedQuery = querySchema.parse(queryParams);

    let results: any[] = [];
    let totalCount = 0;

    // Search Quran
    if (validatedQuery.content_type === 'quran' || validatedQuery.content_type === 'all') {
      const quranResults = await searchQuran(supabase, validatedQuery);
      results.push(...quranResults.data);
      totalCount += quranResults.count;
    }

    // Search Hadith
    if (validatedQuery.content_type === 'hadith' || validatedQuery.content_type === 'all') {
      const hadithResults = await searchHadith(supabase, validatedQuery);
      results.push(...hadithResults.data);
      totalCount += hadithResults.count;
    }

    // Search Duas
    if (validatedQuery.content_type === 'duas' || validatedQuery.content_type === 'all') {
      const duasResults = await searchDuas(supabase, validatedQuery);
      results.push(...duasResults.data);
      totalCount += duasResults.count;
    }

    // Sort and paginate if searching all content types
    if (validatedQuery.content_type === 'all') {
      results.sort((a, b) => a.content_type.localeCompare(b.content_type));
      const offset = (validatedQuery.page - 1) * validatedQuery.limit;
      results = results.slice(offset, offset + validatedQuery.limit);
    }

    return NextResponse.json({
      data: results,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / validatedQuery.limit),
      },
    });

  } catch (error) {
    console.error('Error in GET /api/faith:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create or update bookmark
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bookmarkSchema.parse(body);

    // Verify content exists
    const contentExists = await verifyContentExists(supabase, validatedData.content_type, validatedData.content_id);
    if (!contentExists) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Insert or update bookmark
    const { data: bookmark, error } = await supabase
      .from('faith_bookmarks')
      .upsert({
        user_id: session.user.id,
        content_type: validatedData.content_type,
        content_id: validatedData.content_id,
        notes: validatedData.notes,
        tags: validatedData.tags,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bookmark:', error);
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
    }

    return NextResponse.json({ data: bookmark }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/faith:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to search Quran
async function searchQuran(supabase: any, query: any) {
  let quranQuery = supabase
    .from('quran')
    .select('*', { count: 'exact' });

  // Apply filters
  if (query.search) {
    quranQuery = quranQuery.or(`ayah_text_english.ilike.%${query.search}%,ayah_text_arabic.ilike.%${query.search}%,surah_name_english.ilike.%${query.search}%`);
  }

  if (query.surah_number) {
    quranQuery = quranQuery.eq('surah_number', query.surah_number);
  }

  if (query.juz_number) {
    quranQuery = quranQuery.eq('juz_number', query.juz_number);
  }

  // Apply pagination only if searching specific content type
  if (query.content_type === 'quran') {
    const offset = (query.page - 1) * query.limit;
    quranQuery = quranQuery.range(offset, offset + query.limit - 1);
  }

  quranQuery = quranQuery.order('surah_number').order('ayah_number');

  const { data, error, count } = await quranQuery;

  if (error) {
    console.error('Error searching Quran:', error);
    return { data: [], count: 0 };
  }

  return {
    data: (data || []).map((item: any) => ({ ...item, content_type: 'quran' })),
    count: count || 0,
  };
}

// Helper function to search Hadith
async function searchHadith(supabase: any, query: any) {
  let hadithQuery = supabase
    .from('hadith')
    .select('*', { count: 'exact' });

  // Apply filters
  if (query.search) {
    hadithQuery = hadithQuery.or(`hadith_text_english.ilike.%${query.search}%,hadith_text_arabic.ilike.%${query.search}%,narrator.ilike.%${query.search}%`);
  }

  if (query.collection) {
    hadithQuery = hadithQuery.eq('collection', query.collection);
  }

  if (query.grade) {
    hadithQuery = hadithQuery.eq('grade', query.grade);
  }

  // Apply pagination only if searching specific content type
  if (query.content_type === 'hadith') {
    const offset = (query.page - 1) * query.limit;
    hadithQuery = hadithQuery.range(offset, offset + query.limit - 1);
  }

  hadithQuery = hadithQuery.order('collection').order('hadith_number');

  const { data, error, count } = await hadithQuery;

  if (error) {
    console.error('Error searching Hadith:', error);
    return { data: [], count: 0 };
  }

  return {
    data: (data || []).map((item: any) => ({ ...item, content_type: 'hadith' })),
    count: count || 0,
  };
}

// Helper function to search Duas
async function searchDuas(supabase: any, query: any) {
  let duasQuery = supabase
    .from('duas')
    .select('*', { count: 'exact' });

  // Apply filters
  if (query.search) {
    duasQuery = duasQuery.or(`title.ilike.%${query.search}%,dua_english.ilike.%${query.search}%,dua_arabic.ilike.%${query.search}%,category.ilike.%${query.search}%`);
  }

  if (query.category) {
    duasQuery = duasQuery.eq('category', query.category);
  }

  // Apply pagination only if searching specific content type
  if (query.content_type === 'duas') {
    const offset = (query.page - 1) * query.limit;
    duasQuery = duasQuery.range(offset, offset + query.limit - 1);
  }

  duasQuery = duasQuery.order('category').order('title');

  const { data, error, count } = await duasQuery;

  if (error) {
    console.error('Error searching Duas:', error);
    return { data: [], count: 0 };
  }

  return {
    data: (data || []).map((item: any) => ({ ...item, content_type: 'duas' })),
    count: count || 0,
  };
}

// Helper function to verify content exists
async function verifyContentExists(supabase: any, contentType: string, contentId: string): Promise<boolean> {
  const tableName = contentType === 'dua' ? 'duas' : contentType;
  
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', contentId)
    .single();

  return !error && !!data;
}
