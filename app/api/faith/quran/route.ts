import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const querySchema = z.object({
  surah_id: z.number().min(1).max(114).optional(),
  verse_start: z.number().min(1).optional(),
  verse_end: z.number().min(1).optional(),
  search: z.string().optional(),
  translation: z.enum(['english', 'dhivehi', 'both']).default('english'),
  include_audio: z.string().transform(Boolean).default('false'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

const readingSessionSchema = z.object({
  surah_id: z.number().min(1).max(114),
  start_verse: z.number().min(1),
  end_verse: z.number().min(1),
  duration_minutes: z.number().min(1).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Parse query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, any> = Object.fromEntries(url.searchParams.entries());

    // Convert numeric parameters
    ['surah_id', 'verse_start', 'verse_end', 'page', 'limit'].forEach(param => {
      if (queryParams[param]) {
        queryParams[param] = parseInt(queryParams[param]);
      }
    });

    if (queryParams.include_audio) {
      queryParams.include_audio = queryParams.include_audio === 'true';
    }

    const validatedQuery = querySchema.parse(queryParams);

    const action = url.searchParams.get('action');

    // Handle different actions
    if (action === 'surahs') {
      return handleGetSurahs(supabase);
    }

    if (action === 'verses') {
      return handleGetVerses(supabase, validatedQuery);
    }

    if (action === 'search') {
      return handleSearchVerses(supabase, validatedQuery);
    }

    // Default: return surahs list
    return handleGetSurahs(supabase);

  } catch (error) {
    console.error('Error in GET /api/faith/quran:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGetSurahs(supabase: any) {
  const { data: surahs, error } = await supabase
    .from('quran_surahs')
    .select('*')
    .order('order_number');

  if (error) {
    console.error('Error fetching surahs:', error);
    return NextResponse.json({ error: 'Failed to fetch surahs' }, { status: 500 });
  }

  return NextResponse.json({ data: surahs || [] });
}

async function handleGetVerses(supabase: any, query: any) {
  if (!query.surah_id) {
    return NextResponse.json({ error: 'Surah ID is required' }, { status: 400 });
  }

  let versesQuery = supabase
    .from('quran_verses')
    .select(`
      id,
      verse_number,
      text_arabic,
      text_english,
      text_dhivehi,
      transliteration,
      audio_url,
      quran_surahs!inner(
        id,
        name_arabic,
        name_english,
        name_dhivehi,
        verse_count
      )
    `)
    .eq('surah_id', query.surah_id);

  // Apply verse range filters
  if (query.verse_start) {
    versesQuery = versesQuery.gte('verse_number', query.verse_start);
  }

  if (query.verse_end) {
    versesQuery = versesQuery.lte('verse_number', query.verse_end);
  }

  // Apply pagination
  const offset = (query.page - 1) * query.limit;
  versesQuery = versesQuery
    .order('verse_number')
    .range(offset, offset + query.limit - 1);

  const { data: verses, error, count } = await versesQuery;

  if (error) {
    console.error('Error fetching verses:', error);
    return NextResponse.json({ error: 'Failed to fetch verses' }, { status: 500 });
  }

  // Filter translation fields based on request
  const filteredVerses = (verses || []).map((verse: any) => {
    const filtered: any = {
      id: verse.id,
      verse_number: verse.verse_number,
      text_arabic: verse.text_arabic,
      transliteration: verse.transliteration,
      quran_surahs: verse.quran_surahs,
    };

    if (query.translation === 'english' || query.translation === 'both') {
      filtered.text_english = verse.text_english;
    }

    if (query.translation === 'dhivehi' || query.translation === 'both') {
      filtered.text_dhivehi = verse.text_dhivehi;
    }

    if (query.include_audio) {
      filtered.audio_url = verse.audio_url;
    }

    return filtered;
  });

  return NextResponse.json({
    data: filteredVerses,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / query.limit),
    },
  });
}

async function handleSearchVerses(supabase: any, query: any) {
  if (!query.search) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  let searchQuery = supabase
    .from('quran_verses')
    .select(`
      id,
      surah_id,
      verse_number,
      text_arabic,
      text_english,
      text_dhivehi,
      transliteration,
      audio_url,
      quran_surahs!inner(
        id,
        name_arabic,
        name_english,
        name_dhivehi
      )
    `, { count: 'exact' });

  // Apply search filters
  if (query.translation === 'english' || query.translation === 'both') {
    searchQuery = searchQuery.or(`text_english.ilike.%${query.search}%,transliteration.ilike.%${query.search}%`);
  }

  if (query.translation === 'dhivehi') {
    searchQuery = searchQuery.ilike('text_dhivehi', `%${query.search}%`);
  }

  // Apply pagination
  const offset = (query.page - 1) * query.limit;
  searchQuery = searchQuery
    .order('surah_id')
    .order('verse_number')
    .range(offset, offset + query.limit - 1);

  const { data: verses, error, count } = await searchQuery;

  if (error) {
    console.error('Error searching verses:', error);
    return NextResponse.json({ error: 'Failed to search verses' }, { status: 500 });
  }

  // Filter translation fields based on request
  const filteredVerses = (verses || []).map((verse: any) => {
    const filtered: any = {
      id: verse.id,
      surah_id: verse.surah_id,
      verse_number: verse.verse_number,
      text_arabic: verse.text_arabic,
      transliteration: verse.transliteration,
      quran_surahs: verse.quran_surahs,
    };

    if (query.translation === 'english' || query.translation === 'both') {
      filtered.text_english = verse.text_english;
    }

    if (query.translation === 'dhivehi' || query.translation === 'both') {
      filtered.text_dhivehi = verse.text_dhivehi;
    }

    if (query.include_audio) {
      filtered.audio_url = verse.audio_url;
    }

    return filtered;
  });

  return NextResponse.json({
    data: filteredVerses,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / query.limit),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'reading_session') {
      return handleCreateReadingSession(supabase, request, session.user.id);
    }

    if (action === 'bookmark') {
      return handleCreateBookmark(supabase, request, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/faith/quran:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCreateReadingSession(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = readingSessionSchema.parse(body);

  // Validate verse range
  if (validatedData.end_verse < validatedData.start_verse) {
    return NextResponse.json({ error: 'End verse must be greater than or equal to start verse' }, { status: 400 });
  }

  // Verify surah exists and verse numbers are valid
  const { data: surah } = await supabase
    .from('quran_surahs')
    .select('verse_count')
    .eq('id', validatedData.surah_id)
    .single();

  if (!surah) {
    return NextResponse.json({ error: 'Invalid surah ID' }, { status: 400 });
  }

  if (validatedData.end_verse > surah.verse_count) {
    return NextResponse.json({ error: 'End verse exceeds surah verse count' }, { status: 400 });
  }

  // Create reading session
  const { data: session, error } = await supabase
    .from('quran_reading_sessions')
    .insert({
      user_id: userId,
      surah_id: validatedData.surah_id,
      start_verse: validatedData.start_verse,
      end_verse: validatedData.end_verse,
      duration_minutes: validatedData.duration_minutes,
      notes: validatedData.notes,
      session_date: new Date().toISOString().split('T')[0],
    })
    .select(`
      *,
      quran_surahs(name_arabic, name_english, name_dhivehi)
    `)
    .single();

  if (error) {
    console.error('Error creating reading session:', error);
    return NextResponse.json({ error: 'Failed to create reading session' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: session,
    message: 'Reading session logged successfully' 
  }, { status: 201 });
}

async function handleCreateBookmark(supabase: any, request: NextRequest, userId: string) {
  const { verse_id, notes } = await request.json();

  if (!verse_id) {
    return NextResponse.json({ error: 'Verse ID is required' }, { status: 400 });
  }

  // Check if bookmark already exists
  const { data: existingBookmark } = await supabase
    .from('faith_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('bookmark_type', 'verse')
    .eq('reference_id', verse_id)
    .single();

  if (existingBookmark) {
    return NextResponse.json({ error: 'Verse already bookmarked' }, { status: 409 });
  }

  // Create bookmark
  const { data: bookmark, error } = await supabase
    .from('faith_bookmarks')
    .insert({
      user_id: userId,
      bookmark_type: 'verse',
      reference_id: verse_id,
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
    message: 'Verse bookmarked successfully' 
  }, { status: 201 });
}
