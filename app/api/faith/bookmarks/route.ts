import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const querySchema = z.object({
  content_type: z.enum(['quran', 'hadith', 'dua', 'all']).default('all'),
  tags: z.string().optional(), // comma-separated tags
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
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
    ['page', 'limit'].forEach(param => {
      if (queryParams[param]) {
        queryParams[param] = parseInt(queryParams[param]);
      }
    });

    const validatedQuery = querySchema.parse(queryParams);

    // Build query
    let bookmarksQuery = supabase
      .from('faith_bookmarks')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id);

    // Apply filters
    if (validatedQuery.content_type !== 'all') {
      bookmarksQuery = bookmarksQuery.eq('content_type', validatedQuery.content_type);
    }

    if (validatedQuery.tags) {
      const tags = validatedQuery.tags.split(',').map(tag => tag.trim());
      bookmarksQuery = bookmarksQuery.overlaps('tags', tags);
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    bookmarksQuery = bookmarksQuery.range(offset, offset + validatedQuery.limit - 1);

    // Order by creation date
    bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false });

    const { data: bookmarks, error, count } = await bookmarksQuery;

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }

    // Fetch the actual content for each bookmark
    const enrichedBookmarks = await Promise.all(
      (bookmarks || []).map(async (bookmark) => {
        const content = await fetchBookmarkContent(supabase, bookmark.content_type, bookmark.content_id);
        return {
          ...bookmark,
          content,
        };
      })
    );

    return NextResponse.json({
      data: enrichedBookmarks,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / validatedQuery.limit),
      },
    });

  } catch (error) {
    console.error('Error in GET /api/faith/bookmarks:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete bookmark
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const bookmarkId = url.searchParams.get('id');

    if (!bookmarkId || !z.string().uuid().safeParse(bookmarkId).success) {
      return NextResponse.json({ error: 'Valid bookmark ID is required' }, { status: 400 });
    }

    // Delete bookmark
    const { error } = await supabase
      .from('faith_bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting bookmark:', error);
      return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bookmark deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/faith/bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to fetch bookmark content
async function fetchBookmarkContent(supabase: any, contentType: string, contentId: string) {
  try {
    let tableName = contentType;
    if (contentType === 'dua') {
      tableName = 'duas';
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', contentId)
      .single();

    if (error) {
      console.error(`Error fetching ${contentType} content:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error in fetchBookmarkContent for ${contentType}:`, error);
    return null;
  }
}
